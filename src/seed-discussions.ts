import "dotenv/config";
import { db } from "./db/index.js";
import { discussions, discussionReplies, discussionVotes } from "./db/schema/discussions.js";
import { classes } from "./db/schema/app.js";
import { user } from "./db/schema/auth.js";
import { eq, sql } from "drizzle-orm";

async function seedDiscussions() {
  console.log("🌱 Starting discussions seed...");

  // 1. Get existing data
  const students = await db.select().from(user).where(eq(user.role, 'student')).limit(5);
  const staff = await db.select().from(user).where(sql`${user.role} IN ('teacher', 'admin')`).limit(2);
  const allClasses = await db.select().from(classes).limit(3);

  if (allClasses.length === 0 || (students.length === 0 && staff.length === 0)) {
    console.error("❌ Need at least one class and some users to seed discussions.");
    process.exit(1);
  }

  const teacher = staff[0] || students[0];
  const student = students[0] || staff[0];
  const voterIds = Array.from(new Set([...students, ...staff].map((u) => u.id).filter(Boolean)));

  const clampUpvotes = (upvotes: number, authorId?: string) => {
    const eligibleCount = Math.max(voterIds.length - (authorId ? 1 : 0), 0);
    return Math.min(Math.max(upvotes, 0), eligibleCount);
  };

  const recordReplyActivity = async (discussionId: number, createdAt?: Date | null) => {
    await db.update(discussions)
      .set({
        replyCount: sql`${discussions.replyCount} + 1`,
        lastActivityAt: createdAt ?? new Date(),
      })
      .where(eq(discussions.id, discussionId));
  };

  const seedUpvotes = async (replyId: number, upvotes: number, authorId?: string) => {
    if (upvotes <= 0) return;
    const eligibleVoters = voterIds.filter((id) => id !== authorId);

    await db.insert(discussionVotes).values(
      eligibleVoters.slice(0, upvotes).map((userId) => ({
        replyId,
        userId,
        voteType: 'up',
        createdAt: new Date(),
      }))
    ).onConflictDoNothing();
  };

  for (const classItem of allClasses) {
    console.log(`Seeding discussions for class: ${classItem.name}`);

    // TYPE: Question
    const [q1] = await db.insert(discussions).values({
      classId: classItem.id,
      authorId: student.id,
      title: "How to handle React state effectively?",
      content: "I'm confused between using `useState` and `useReducer` for complex forms. What's the best practice in this course?",
      type: "question",
      lastActivityAt: new Date(),
    }).returning();

    const q1Reply1Upvotes = clampUpvotes(5, teacher.id);
    const q1Reply2Upvotes = clampUpvotes(2, students[1]?.id || student.id);

    const q1Replies = await db.insert(discussionReplies).values([
      {
        discussionId: q1.id,
        authorId: teacher.id,
        content: "Great question! For simple toggles, `useState` is fine. For forms with many fields, `useReducer` keeps logic cleaner. Check the 'Resources' section for a demo.",
        isAccepted: true,
        upvotes: q1Reply1Upvotes,
      },
      {
        discussionId: q1.id,
        authorId: students[1]?.id || student.id,
        content: "I personally prefer using libraries like React Hook Form for this.",
        upvotes: q1Reply2Upvotes,
      }
    ]).returning();

    for (const replyItem of q1Replies) {
      await recordReplyActivity(replyItem.discussionId, replyItem.createdAt);
      await seedUpvotes(replyItem.id, replyItem.upvotes ?? 0, replyItem.authorId);
    }

    // TYPE: Announcement
    await db.insert(discussions).values({
      classId: classItem.id,
      authorId: teacher.id,
      title: "📢 Upcoming Project Deadline",
      content: "Reminder: The first milestone for your project is due this Friday. Please ensure your repositories are public and the link is submitted.",
      type: "announcement",
      isPinned: true,
      lastActivityAt: new Date(),
    });

    // TYPE: Resource
    const [r1] = await db.insert(discussions).values({
      classId: classItem.id,
      authorId: teacher.id,
      title: "Deep Dive into Drizzle ORM",
      content: "I've found a fantastic video series that explains the Drizzle schema architecture in detail. Highly recommended for the backend module.",
      type: "resource",
      lastActivityAt: new Date(),
    }).returning();

    const r1ReplyUpvotes = clampUpvotes(3, student.id);
    const r1Replies = await db.insert(discussionReplies).values({
      discussionId: r1.id,
      authorId: student.id,
      content: "This is exactly what I needed, thanks Professor!",
      upvotes: r1ReplyUpvotes,
    }).returning();

    for (const replyItem of r1Replies) {
      await recordReplyActivity(replyItem.discussionId, replyItem.createdAt);
      await seedUpvotes(replyItem.id, replyItem.upvotes ?? 0, replyItem.authorId);
    }

    // TYPE: General
    const [g1] = await db.insert(discussions).values({
      classId: classItem.id,
      authorId: student.id,
      title: "Hackathon this Weekend!",
      content: "Is anyone planning to attend the City Hackathon this weekend? Looking for teammates proficient in Tailwind CSS.",
      type: "general",
      lastActivityAt: new Date(),
    }).returning();

    const [reply] = await db.insert(discussionReplies).values({
      discussionId: g1.id,
      authorId: students[2]?.id || student.id,
      content: "I'm interested! I've been working with Tailwind for a year now.",
    }).returning();

    if (reply) {
      await recordReplyActivity(reply.discussionId, reply.createdAt);
      await seedUpvotes(reply.id, reply.upvotes ?? 0, reply.authorId);
    }

    // Nested reply
    const [nestedReply] = await db.insert(discussionReplies).values({
      discussionId: g1.id,
      parentId: reply.id,
      authorId: student.id,
      content: "Awesome! Let's meet in the common area after class to discuss.",
    }).returning();

    if (nestedReply) {
      await recordReplyActivity(nestedReply.discussionId, nestedReply.createdAt);
      await seedUpvotes(nestedReply.id, nestedReply.upvotes ?? 0, nestedReply.authorId);
    }
  }

  console.log("\n🎉 Discussion seeding completed successfully!");
}

seedDiscussions()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
