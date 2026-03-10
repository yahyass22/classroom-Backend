import "dotenv/config";
import { db } from "./db/index.js";
import { 
  discussions, 
  discussionReplies, 
  discussionViews, 
} from "./db/schema/discussions.js";
import { classes, enrollments, subjects } from "./db/schema/app.js";
import { user } from "./db/schema/auth.js";
import { eq, sql } from "drizzle-orm";

async function seedDiscussionsFull() {
  console.log("🌱 Starting diverse discussions seed...");

  // 1. Fetch available data
  const students = await db.select().from(user).where(eq(user.role, 'student')).limit(100);
  const teachers = await db.select().from(user).where(eq(user.role, 'teacher')).limit(20);
  
  // Get more classes to show variety
  const allClasses = await db.select({
    id: classes.id,
    name: classes.name,
    teacherId: classes.teacherId,
    subjectId: classes.subjectId,
    subjectName: subjects.name,
    subjectCode: subjects.code
  })
  .from(classes)
  .innerJoin(subjects, eq(classes.subjectId, subjects.id))
  .limit(10);

  if (allClasses.length === 0 || students.length === 0 || teachers.length === 0) {
    console.error("❌ Need classes, students, and teachers to seed discussions.");
    process.exit(1);
  }

  // Topic pools by category
  const csTopics = [
    {
      type: "question" as const,
      title: "Complexity of the proposed sorting algorithm",
      content: "I was looking at the optimized bubble sort we discussed. Is it still O(n^2) in the average case even with the swap flag?",
      replies: [
        { role: 'teacher', content: "Yes, the swap flag only helps with the best case (already sorted) making it O(n). Average and worst case remain O(n^2) because of the nested loops.", isAccepted: true },
        { role: 'student', content: "That makes sense. I guess that's why we prefer Quicksort or Mergesort for larger datasets." }
      ]
    },
    {
      type: "resource" as const,
      title: "Visualizing Git Branching and Merging",
      content: "I found this interactive tool that really helps visualize how HEAD moves during rebase vs merge. It helped me fix my detached HEAD state today.",
      replies: [
        { role: 'student', content: "Can you share the link? I'm still struggling with merge conflicts." }
      ]
    },
    {
      type: "question" as const,
      title: "Difference between Interface and Abstract Class",
      content: "When should I use an Interface over an Abstract Class for the project architecture? I'm leaning towards interfaces for the plugin system.",
      replies: [
        { role: 'student', content: "Use interfaces when you want to define a contract for what a class should do, without dictated how it does it. Use abstract classes when you want to share code among several closely related classes." },
        { role: 'teacher', content: "Spot on. For a plugin system, interfaces are much more flexible.", isAccepted: true }
      ]
    },
    {
      type: "question" as const,
      title: "REST vs GraphQL for the final project",
      content: "Which one is better for our project requirements? I'm worried about over-fetching with REST but GraphQL seems more complex to set up.",
      replies: [
        { role: 'teacher', content: "For this course, REST is perfectly fine and easier to debug. Stick with REST unless you have a very specific reason for GraphQL.", isAccepted: true }
      ]
    },
    {
      type: "resource" as const,
      title: "Essential VS Code Extensions",
      content: "I've compiled a list of extensions like Prettier, ESLint, and GitLens that every developer in this class should use.",
      replies: [
        { role: 'student', content: "Don't forget the 'Error Lens' extension, it's a lifesaver!" }
      ]
    }
  ];

  const mathTopics = [
    {
      type: "question" as const,
      title: "Intuition behind the Chain Rule",
      content: "I can apply the formula, but I'm having trouble visualizing why we multiply the derivatives of the outer and inner functions.",
      replies: [
        { role: 'teacher', content: "Think of it as ratios of change. If 'y' changes 3x as fast as 'u', and 'u' changes 2x as fast as 'x', then 'y' must change 3 * 2 = 6x as fast as 'x'.", isAccepted: true }
      ]
    },
    {
      type: "general" as const,
      title: "Study session for the upcoming midterm",
      content: "Is anyone interested in reviewing the practice problems for Linear Algebra this Thursday in the common room?",
      replies: [
        { role: 'student', content: "I'm interested. I'm specifically struggling with Eigenvalues." },
        { role: 'student', content: "I can help with those! I'll be there at 5 PM." }
      ]
    },
    {
      type: "question" as const,
      title: "Understanding the Central Limit Theorem",
      content: "Why does the distribution of sample means approach a normal distribution regardless of the population distribution?",
      replies: [
        { role: 'teacher', content: "It's one of the most beautiful results in statistics. As long as you have a large enough sample size, the 'averaging' effect smooths out the quirks of the original distribution.", isAccepted: true }
      ]
    }
  ];

  const genericTopics = [
    {
      type: "announcement" as const,
      title: "Class Schedule Update",
      content: "Please note that the lecture on Wednesday will start 15 minutes late due to a faculty meeting. We will still cover the full material.",
      isPinned: true,
      replies: []
    },
    {
      type: "general" as const,
      title: "Reference materials and textbooks",
      content: "Does anyone have a copy of the 4th edition? The library only has the 3rd, and I want to make sure the exercise numbers match.",
      replies: [
        { role: 'student', content: "The exercises are slightly different. I have the PDF version if you need to cross-reference." }
      ]
    },
    {
      type: "announcement" as const,
      title: "Project Milestone 1 Feedback",
      content: "I have finished grading the first milestone. Generally good work, but pay more attention to the documentation requirements for the next phase.",
      replies: [
        { role: 'student', content: "Where can we see the specific comments, Professor?" },
        { role: 'teacher', content: "They should be visible on the submission portal under the 'Feedback' tab." }
      ]
    },
    {
      type: "question" as const,
      title: "Late submission policy",
      content: "If I submit my assignment 2 hours late due to technical issues, is there a penalty?",
      replies: [
        { role: 'teacher', content: "There is a 5% deduction for every 12 hours late. 2 hours would fall into the first bracket.", isAccepted: true }
      ]
    },
    {
      type: "general" as const,
      title: "Internship Opportunities",
      content: "Our department just received a list of summer internships. Check the 'Resources' section in the portal for the PDF list.",
      replies: [
        { role: 'student', content: "Thanks for sharing! Are any of these remote-friendly?" }
      ]
    },
    {
      type: "announcement" as const,
      title: "Guest Lecture: Industry Expert",
      content: "Next Tuesday, we'll have a guest speaker from Google talk about large-scale system design. Don't miss it!",
      isPinned: true,
      replies: []
    }
  ];

  for (const classItem of allClasses) {
    console.log(`\n🏫 Seeding: ${classItem.name} (${classItem.subjectCode})`);
    
    // Pick topics based on subject code
    let topicPool = [...genericTopics];
    if (classItem.subjectCode.startsWith('CS') || classItem.subjectCode.startsWith('SE')) {
      topicPool = [...csTopics, ...genericTopics];
    } else if (classItem.subjectCode.startsWith('MATH') || classItem.subjectCode.startsWith('PHYS')) {
      topicPool = [...mathTopics, ...genericTopics];
    }

    // Shuffle and pick 3-5 topics per class
    const selectedTopics = topicPool.sort(() => 0.5 - Math.random()).slice(0, 4);

    const enrolledStudents = await db.select({ id: user.id })
      .from(enrollments)
      .innerJoin(user, eq(enrollments.studentId, user.id))
      .where(eq(enrollments.classId, classItem.id))
      .limit(30);

    const pool = enrolledStudents.length > 5 ? enrolledStudents : students;
    const classTeacherId = classItem.teacherId;

    for (const template of selectedTopics) {
      const authorId = template.type === 'announcement' ? classTeacherId : pool[Math.floor(Math.random() * pool.length)].id;
      
      const [newDiscussion] = await db.insert(discussions).values({
        classId: classItem.id,
        authorId: authorId,
        title: template.title,
        content: template.content,
        type: template.type,
        isPinned: template.isPinned || false,
        viewCount: Math.floor(Math.random() * 200) + 20,
        createdAt: new Date(Date.now() - (Math.random() * 10 * 24 * 60 * 60 * 1000)), // Last 10 days
      }).returning();

      console.log(`   - [${template.type.toUpperCase()}] ${template.title}`);

      // Add random views
      const viewers = pool.slice(0, 15);
      if (viewers.length > 0) {
        const viewData = viewers.map(v => ({
            discussionId: newDiscussion.id,
            userId: v.id,
            viewedAt: new Date()
        }));
        await db.insert(discussionViews).values(viewData).onConflictDoNothing();
      }

      // Add replies
      for (const replyTemplate of template.replies) {
        const replyAuthorId = replyTemplate.role === 'teacher' ? classTeacherId : pool[Math.floor(Math.random() * pool.length)].id;
        
        await db.insert(discussionReplies).values({
          discussionId: newDiscussion.id,
          authorId: replyAuthorId,
          content: replyTemplate.content,
          isAccepted: replyTemplate.isAccepted || false,
          upvotes: Math.floor(Math.random() * 15),
          createdAt: new Date(newDiscussion.createdAt.getTime() + (Math.random() * 24 * 60 * 60 * 1000)),
        });

        // Update counts
        await db.update(discussions)
          .set({ 
            replyCount: sql`${discussions.replyCount} + 1`,
            lastActivityAt: new Date()
          })
          .where(eq(discussions.id, newDiscussion.id));
      }
    }
  }

  console.log("\n🎉 Diverse discussion seeding completed!");
}

seedDiscussionsFull()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
