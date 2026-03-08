import { integer, boolean, pgEnum, pgTable, primaryKey, text, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth.js";
import { classes } from "./app.js";

export const discussionTypeEnum = pgEnum("discussion_type", ["general", "question", "announcement", "resource"]);

export const discussions = pgTable("discussions", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
    authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    content: text('content').notNull(),
    type: discussionTypeEnum("type").notNull().default("general"),
    isPinned: boolean('is_pinned').default(false).notNull(),
    isLocked: boolean('is_locked').default(false).notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    replyCount: integer('reply_count').default(0).notNull(),
    lastActivityAt: timestamp('last_activity_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    idx_discussions_class: index('idx_discussions_class').on(table.classId),
    idx_discussions_author: index('idx_discussions_author').on(table.authorId),
    idx_discussions_type: index('idx_discussions_type').on(table.type),
    idx_discussions_pinned: index('idx_discussions_pinned').on(table.isPinned),
    idx_discussions_last_activity: index('idx_discussions_last_activity').on(table.lastActivityAt),
}));

export const discussionReplies = pgTable("discussion_replies", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    discussionId: integer('discussion_id').notNull().references(() => discussions.id, { onDelete: 'cascade' }),
    parentId: integer('parent_id').references(() => discussionReplies.id, { onDelete: 'cascade' }),

    authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    upvotes: integer('upvotes').default(0).notNull(),
    downvotes: integer('downvotes').default(0).notNull(),
    isAccepted: boolean('is_accepted').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    idx_replies_discussion: index('idx_replies_discussion').on(table.discussionId),
    idx_replies_author: index('idx_replies_author').on(table.authorId),
    idx_replies_parent: index('idx_replies_parent').on(table.parentId),
    idx_replies_accepted: index('idx_replies_accepted').on(table.isAccepted),
}));

export const discussionViews = pgTable("discussion_views", {
    discussionId: integer('discussion_id').notNull().references(() => discussions.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at').defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey(table.discussionId, table.userId),
    idx_views_user: index('idx_views_user').on(table.userId),
}));

export const discussionVotes = pgTable("discussion_votes", {
    replyId: integer('reply_id').notNull().references(() => discussionReplies.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    voteType: varchar('vote_type', { length: 10 }).notNull(), // 'up' or 'down'
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey(table.replyId, table.userId),
    idx_votes_user: index('idx_votes_user').on(table.userId),
}));

// Relations
export const discussionsRelations = relations(discussions, ({ one, many }) => ({
    class: one(classes, {
        fields: [discussions.classId],
        references: [classes.id],
    }),
    author: one(user, {
        fields: [discussions.authorId],
        references: [user.id],
    }),
    replies: many(discussionReplies),
    views: many(discussionViews),
}));

export const discussionRepliesRelations = relations(discussionReplies, ({ one, many }) => ({
    discussion: one(discussions, {
        fields: [discussionReplies.discussionId],
        references: [discussions.id],
    }),
    parent: one(discussionReplies, {
        fields: [discussionReplies.parentId],
        references: [discussionReplies.id],
    }),
    author: one(user, {
        fields: [discussionReplies.authorId],
        references: [user.id],
    }),
    votes: many(discussionVotes),
}));

export const discussionViewsRelations = relations(discussionViews, ({ one }) => ({
    discussion: one(discussions, {
        fields: [discussionViews.discussionId],
        references: [discussions.id],
    }),
    user: one(user, {
        fields: [discussionViews.userId],
        references: [user.id],
    }),
}));

export const discussionVotesRelations = relations(discussionVotes, ({ one }) => ({
    reply: one(discussionReplies, {
        fields: [discussionVotes.replyId],
        references: [discussionReplies.id],
    }),
    user: one(user, {
        fields: [discussionVotes.userId],
        references: [user.id],
    }),
}));

// Types
export type Discussion = typeof discussions.$inferSelect;
export type NewDiscussion = typeof discussions.$inferInsert;

export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type NewDiscussionReply = typeof discussionReplies.$inferInsert;

export type DiscussionView = typeof discussionViews.$inferSelect;
export type NewDiscussionView = typeof discussionViews.$inferInsert;

export type DiscussionVote = typeof discussionVotes.$inferSelect;
export type NewDiscussionVote = typeof discussionVotes.$inferInsert;
