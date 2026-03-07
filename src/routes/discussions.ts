import express from "express";
import { and, desc, eq, getTableColumns, ilike, or, sql, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import {
    discussions, discussionReplies, discussionViews, discussionVotes,
    type NewDiscussion, type NewDiscussionReply
} from "../db/schema/discussions.js";
import { classes } from "../db/schema/app.js";
import { user } from "../db/schema/auth.js";

const router = express.Router();

// Helper to get user from request
const getAuthUser = (req: express.Request) => (req as any).user as {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    image?: string | null;
} | undefined;

// Get ALL discussions across all classes (global view)
// Path: /api/discussions (mounted at /api)
router.get("/discussions", async (req, res) => {
    try {
        const { type, sortBy = 'lastActivityAt', page = 1, limit = 50 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 50), 100);
        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions: any[] = [];

        if (type && type !== 'all') {
            filterConditions.push(eq(discussions.type, type as any));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(discussions)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        // Get discussions with author and class info
        let orderByClause = desc(discussions.isPinned);
        if (sortBy === 'latest') {
            orderByClause = desc(discussions.createdAt);
        } else if (sortBy === 'mostActive') {
            orderByClause = desc(discussions.replyCount);
        } else if (sortBy === 'mostViewed') {
            orderByClause = desc(discussions.viewCount);
        } else if (sortBy === 'unanswered') {
            orderByClause = asc(discussions.replyCount);
        }

        const discussionsList = await db
            .select({
                ...getTableColumns(discussions),
                author: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                },
                class: {
                    id: classes.id,
                    name: classes.name,
                }
            })
            .from(discussions)
            .leftJoin(user, eq(discussions.authorId, user.id))
            .leftJoin(classes, eq(discussions.classId, classes.id))
            .where(whereClause)
            .orderBy(orderByClause, desc(discussions.lastActivityAt))
            .limit(limitPerPage)
            .offset(offset);

        res.json({
            data: discussionsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });
    } catch (error) {
        console.error(`GET /discussions error:`, error);
        res.status(500).json({ error: 'Failed to fetch discussions' });
    }
});

// Helper function to get discussion with author and class info
async function getDiscussionWithDetails(discussionId: number) {
    const [discussion] = await db
        .select({
            ...getTableColumns(discussions),
            author: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
            },
            class: {
                id: classes.id,
                name: classes.name,
            }
        })
        .from(discussions)
        .leftJoin(user, eq(discussions.authorId, user.id))
        .leftJoin(classes, eq(discussions.classId, classes.id))
        .where(eq(discussions.id, discussionId));

    return discussion;
}

// Get single discussion by ID (global endpoint)
router.get("/discussions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const discussionId = parseInt(id);

        if (!Number.isFinite(discussionId)) {
            return res.status(400).json({ error: 'Invalid discussion ID' });
        }

        const discussion = await getDiscussionWithDetails(discussionId);

        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        // Get all replies with author info (flat list, will organize on frontend)
        const replies = await db
            .select({
                ...getTableColumns(discussionReplies),
                author: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                },
                voteCount: sql<number>`COALESCE(
                    (SELECT COUNT(*) FROM discussion_votes WHERE reply_id = discussion_replies.id AND vote_type = 'up') -
                    (SELECT COUNT(*) FROM discussion_votes WHERE reply_id = discussion_replies.id AND vote_type = 'down'),
                    0
                )`
            })
            .from(discussionReplies)
            .leftJoin(user, eq(discussionReplies.authorId, user.id))
            .where(eq(discussionReplies.discussionId, discussionId))
            .orderBy(
                discussionReplies.isAccepted,
                desc(discussionReplies.upvotes),
                asc(discussionReplies.createdAt)
            );

        // Increment view count (track unique views)
        const authUser = getAuthUser(req);
        const userId = authUser?.id;
        if (userId) {
            try {
                await db.insert(discussionViews)
                    .values({ discussionId, userId })
                    .onConflictDoNothing();

                await db.update(discussions)
                    .set({ viewCount: sql`${discussions.viewCount} + 1` })
                    .where(eq(discussions.id, discussionId));
            } catch (e) {
                // Ignore view tracking errors
            }
        }

        res.json({
            data: {
                ...discussion,
                replies
            }
        });
    } catch (error) {
        console.error(`GET /discussions/:id error:`, error);
        res.status(500).json({ error: 'Failed to fetch discussion' });
    }
});

// Get all discussions for a class with filtering and pagination
router.get("/classes/:classId/discussions", async (req, res) => {
    try {
        const { classId } = req.params;
        const { type, sortBy = 'lastActivityAt', page = 1, limit = 20 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 20), 100);
        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [eq(discussions.classId, parseInt(classId))];

        if (type && type !== 'all') {
            filterConditions.push(eq(discussions.type, type as any));
        }

        const whereClause = and(...filterConditions);

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(discussions)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        // Get discussions with author info
        let orderByClause = desc(discussions.isPinned);
        if (sortBy === 'latest') {
            orderByClause = desc(discussions.createdAt);
        } else if (sortBy === 'mostActive') {
            orderByClause = desc(discussions.replyCount);
        } else if (sortBy === 'mostViewed') {
            orderByClause = desc(discussions.viewCount);
        } else if (sortBy === 'unanswered') {
            orderByClause = asc(discussions.replyCount);
        }

        const discussionsList = await db
            .select({
                ...getTableColumns(discussions),
                author: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                }
            })
            .from(discussions)
            .leftJoin(user, eq(discussions.authorId, user.id))
            .where(whereClause)
            .orderBy(orderByClause, desc(discussions.lastActivityAt))
            .limit(limitPerPage)
            .offset(offset);

        res.json({
            data: discussionsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });
    } catch (error) {
        console.error(`GET /classes/:classId/discussions error:`, error);
        res.status(500).json({ error: 'Failed to fetch discussions' });
    }
});

// Get single discussion details with replies
router.get("/classes/:classId/discussions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const discussionId = parseInt(id);

        if (!Number.isFinite(discussionId)) {
            return res.status(400).json({ error: 'Invalid discussion ID' });
        }

        const discussion = await getDiscussionWithDetails(discussionId);

        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        // Get all replies with author info (flat list, will organize on frontend)
        const replies = await db
            .select({
                ...getTableColumns(discussionReplies),
                author: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                },
                voteCount: sql<number>`COALESCE(
                    (SELECT COUNT(*) FROM discussion_votes WHERE reply_id = discussion_replies.id AND vote_type = 'up') -
                    (SELECT COUNT(*) FROM discussion_votes WHERE reply_id = discussion_replies.id AND vote_type = 'down'),
                    0
                )`
            })
            .from(discussionReplies)
            .leftJoin(user, eq(discussionReplies.authorId, user.id))
            .where(eq(discussionReplies.discussionId, discussionId))
            .orderBy(
                discussionReplies.isAccepted,
                desc(discussionReplies.upvotes),
                asc(discussionReplies.createdAt)
            );

        // Increment view count (track unique views)
        const authUser = getAuthUser(req);
        const userId = authUser?.id;
        if (userId) {
            try {
                await db.insert(discussionViews)
                    .values({ discussionId, userId })
                    .onConflictDoNothing();

                await db.update(discussions)
                    .set({ viewCount: sql`${discussions.viewCount} + 1` })
                    .where(eq(discussions.id, discussionId));
            } catch (e) {
                // Ignore view tracking errors
            }
        }

        res.json({
            data: {
                ...discussion,
                replies
            }
        });
    } catch (error) {
        console.error(`GET /classes/:classId/discussions/:id error:`, error);
        res.status(500).json({ error: 'Failed to fetch discussion' });
    }
});

// Create new discussion
router.post("/classes/:classId/discussions", async (req, res) => {
    try {
        const { classId } = req.params;
        const { title, content, type = 'general' } = req.body;
        const authUser = getAuthUser(req);
        const userId = authUser?.id;
        const userRole = authUser?.role;

        console.log('📝 Create discussion request:', {
            classId,
            userId,
            userRole,
            title,
            contentLength: content?.length,
            type
        });

        if (!userId) {
            console.error('❌ Unauthorized: No user ID in session');
            return res.status(401).json({ error: 'Unauthorized. Please log in to create discussions.' });
        }

        if (!title || !content) {
            console.error('❌ Bad request: Missing title or content');
            return res.status(400).json({ error: 'Title and content are required' });
        }

        // Verify class exists
        const [classExists] = await db
            .select({ id: classes.id, name: classes.name })
            .from(classes)
            .where(eq(classes.id, parseInt(classId)));

        if (!classExists) {
            console.error('❌ Class not found:', classId);
            return res.status(404).json({ error: 'Class not found' });
        }

        console.log('✅ Creating discussion in class:', classExists.name);

        const newDiscussion: NewDiscussion = {
            classId: parseInt(classId),
            authorId: userId,
            title,
            content,
            type: type as any,
            isPinned: false,
            isLocked: false,
            viewCount: 0,
            replyCount: 0,
            lastActivityAt: new Date(),
        };

        const [createdDiscussion] = await db
            .insert(discussions)
            .values(newDiscussion)
            .returning();

        console.log('✅ Discussion created successfully:', createdDiscussion?.id);
        res.status(201).json({ data: createdDiscussion });
    } catch (error) {
        console.error('❌ POST /classes/:classId/discussions error:', error);
        res.status(500).json({ error: 'Failed to create discussion' });
    }
});

// Update discussion
router.put("/classes/:classId/discussions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const discussionId = parseInt(id);
        const { title, content, type } = req.body;
        const authUser = getAuthUser(req);
        const userId = authUser?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get existing discussion
        const [existing] = await db
            .select({ authorId: discussions.authorId })
            .from(discussions)
            .where(eq(discussions.id, discussionId));

        if (!existing) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        // Only author can edit
        if (existing.authorId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const [updated] = await db
            .update(discussions)
            .set({
                title: title ?? undefined,
                content: content ?? undefined,
                type: type ? (type as any) : undefined,
                updatedAt: new Date(),
            })
            .where(eq(discussions.id, discussionId))
            .returning();

        res.json({ data: updated });
    } catch (error) {
        console.error(`PUT /classes/:classId/discussions/:id error:`, error);
        res.status(500).json({ error: 'Failed to update discussion' });
    }
});

// Delete discussion
router.delete("/classes/:classId/discussions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const discussionId = parseInt(id);
        const authUser = getAuthUser(req);
        const userId = authUser?.id;
        const userRole = authUser?.role;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get existing discussion
        const [existing] = await db
            .select({ authorId: discussions.authorId })
            .from(discussions)
            .where(eq(discussions.id, discussionId));

        if (!existing) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        // Only author or teacher/admin can delete
        if (existing.authorId !== userId && userRole !== 'teacher' && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await db.delete(discussions).where(eq(discussions.id, discussionId));

        res.json({ message: 'Discussion deleted successfully' });
    } catch (error) {
        console.error(`DELETE /classes/:classId/discussions/:id error:`, error);
        res.status(500).json({ error: 'Failed to delete discussion' });
    }
});

// Pin discussion (teacher only)
router.post("/classes/:classId/discussions/:id/pin", async (req, res) => {
    try {
        const { id } = req.params;
        const discussionId = parseInt(id);
        const authUser = getAuthUser(req);
        const userId = authUser?.id;
        const userRole = authUser?.role;

        if (!userId || (userRole !== 'teacher' && userRole !== 'admin')) {
            return res.status(403).json({ error: 'Forbidden - teachers only' });
        }

        const [updated] = await db
            .update(discussions)
            .set({
                isPinned: sql`NOT ${discussions.isPinned}`,
                updatedAt: new Date(),
            })
            .where(eq(discussions.id, discussionId))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        res.json({ data: updated });
    } catch (error) {
        console.error(`POST /classes/:classId/discussions/:id/pin error:`, error);
        res.status(500).json({ error: 'Failed to pin discussion' });
    }
});

// Lock discussion (teacher only)
router.post("/classes/:classId/discussions/:id/lock", async (req, res) => {
    try {
        const { id } = req.params;
        const discussionId = parseInt(id);
        const authUser = getAuthUser(req);
        const userId = authUser?.id;
        const userRole = authUser?.role;

        if (!userId || (userRole !== 'teacher' && userRole !== 'admin')) {
            return res.status(403).json({ error: 'Forbidden - teachers only' });
        }

        const [updated] = await db
            .update(discussions)
            .set({
                isLocked: sql`NOT ${discussions.isLocked}`,
                updatedAt: new Date(),
            })
            .where(eq(discussions.id, discussionId))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        res.json({ data: updated });
    } catch (error) {
        console.error(`POST /classes/:classId/discussions/:id/lock error:`, error);
        res.status(500).json({ error: 'Failed to lock discussion' });
    }
});

// Get replies for a discussion
router.get("/discussions/:discussionId/replies", async (req, res) => {
    try {
        const { discussionId } = req.params;

        const replies = await db
            .select({
                ...getTableColumns(discussionReplies),
                author: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                }
            })
            .from(discussionReplies)
            .leftJoin(user, eq(discussionReplies.authorId, user.id))
            .where(eq(discussionReplies.discussionId, parseInt(discussionId)))
            .orderBy(
                discussionReplies.isAccepted,
                desc(discussionReplies.upvotes),
                asc(discussionReplies.createdAt)
            );

        res.json({ data: replies });
    } catch (error) {
        console.error(`GET /discussions/:discussionId/replies error:`, error);
        res.status(500).json({ error: 'Failed to fetch replies' });
    }
});

// Create reply
router.post("/discussions/:discussionId/replies", async (req, res) => {
    try {
        const { discussionId } = req.params;
        const { content, parentId } = req.body;
        const authUser = getAuthUser(req);
        const userId = authUser?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Check if discussion exists and is not locked
        const [discussion] = await db
            .select({ isLocked: discussions.isLocked })
            .from(discussions)
            .where(eq(discussions.id, parseInt(discussionId)));

        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        if (discussion.isLocked) {
            return res.status(403).json({ error: 'Discussion is locked' });
        }

        // If parentId provided, verify it exists
        if (parentId) {
            const parentReplies = await db
                .select({ id: discussionReplies.id })
                .from(discussionReplies)
                .where(eq(discussionReplies.id, parseInt(parentId)));

            if (!parentReplies || parentReplies.length === 0) {
                return res.status(404).json({ error: 'Parent reply not found' });
            }
        }

        const newReply: NewDiscussionReply = {
            discussionId: parseInt(discussionId),
            parentId: parentId ? parseInt(parentId) : null,
            authorId: userId,
            content,
            upvotes: 0,
            downvotes: 0,
            isAccepted: false,
        };

        const [createdReply] = await db
            .insert(discussionReplies)
            .values(newReply)
            .returning();

        // Update discussion reply count and last activity
        await db.update(discussions)
            .set({
                replyCount: sql`${discussions.replyCount} + 1`,
                lastActivityAt: new Date(),
            })
            .where(eq(discussions.id, parseInt(discussionId)));

        res.status(201).json({ data: createdReply });
    } catch (error) {
        console.error(`POST /discussions/:discussionId/replies error:`, error);
        res.status(500).json({ error: 'Failed to create reply' });
    }
});

// Update reply
router.put("/discussions/:discussionId/replies/:replyId", async (req, res) => {
    try {
        const { replyId } = req.params;
        const { content } = req.body;
        const authUser = getAuthUser(req);
        const userId = authUser?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const [existing] = await db
            .select({ authorId: discussionReplies.authorId })
            .from(discussionReplies)
            .where(eq(discussionReplies.id, parseInt(replyId)));

        if (!existing) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        if (existing.authorId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const [updated] = await db
            .update(discussionReplies)
            .set({
                content: content ?? undefined,
                updatedAt: new Date(),
            })
            .where(eq(discussionReplies.id, parseInt(replyId)))
            .returning();

        res.json({ data: updated });
    } catch (error) {
        console.error(`PUT /discussions/:discussionId/replies/:replyId error:`, error);
        res.status(500).json({ error: 'Failed to update reply' });
    }
});

// Delete reply
router.delete("/discussions/:discussionId/replies/:replyId", async (req, res) => {
    try {
        const { replyId } = req.params;
        const authUser = getAuthUser(req);
        const userId = authUser?.id;
        const userRole = authUser?.role;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const [existing] = await db
            .select({ authorId: discussionReplies.authorId, discussionId: discussionReplies.discussionId })
            .from(discussionReplies)
            .where(eq(discussionReplies.id, parseInt(replyId)));

        if (!existing) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        if (existing.authorId !== userId && userRole !== 'teacher' && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await db.delete(discussionReplies).where(eq(discussionReplies.id, parseInt(replyId)));

        // Update discussion reply count
        await db.update(discussions)
            .set({ replyCount: sql`GREATEST(0, ${discussions.replyCount} - 1)` })
            .where(eq(discussions.id, existing.discussionId));

        res.json({ message: 'Reply deleted successfully' });
    } catch (error) {
        console.error(`DELETE /discussions/:discussionId/replies/:replyId error:`, error);
        res.status(500).json({ error: 'Failed to delete reply' });
    }
});

// Vote on reply
router.post("/discussions/:discussionId/replies/:replyId/vote", async (req, res) => {
    try {
        const { replyId } = req.params;
        const { voteType } = req.body; // 'up' or 'down'
        const authUser = getAuthUser(req);
        const userId = authUser?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!['up', 'down', null].includes(voteType)) {
            return res.status(400).json({ error: 'Invalid vote type' });
        }

        // Check if vote exists
        const [existingVote] = await db
            .select()
            .from(discussionVotes)
            .where(and(
                eq(discussionVotes.replyId, parseInt(replyId)),
                eq(discussionVotes.userId, userId)
            ));

        if (existingVote) {
            if (voteType === existingVote.voteType) {
                // Remove vote (toggle off)
                await db.delete(discussionVotes)
                    .where(and(
                        eq(discussionVotes.replyId, parseInt(replyId)),
                        eq(discussionVotes.userId, userId)
                    ));
                
                // Update reply vote counts
                const field = existingVote.voteType === 'up' ? 'upvotes' : 'downvotes';
                await db.update(discussionReplies)
                    .set({ [field]: sql`GREATEST(0, ${discussionReplies[field]} - 1)` })
                    .where(eq(discussionReplies.id, parseInt(replyId)));
            } else {
                // Change vote
                await db.update(discussionVotes)
                    .set({ voteType, createdAt: new Date() })
                    .where(and(
                        eq(discussionVotes.replyId, parseInt(replyId)),
                        eq(discussionVotes.userId, userId)
                    ));
                
                // Update reply vote counts
                const oldField = existingVote.voteType === 'up' ? 'upvotes' : 'downvotes';
                const newField = voteType === 'up' ? 'upvotes' : 'downvotes';
                await db.update(discussionReplies)
                    .set({ 
                        [oldField]: sql`GREATEST(0, ${discussionReplies[oldField]} - 1)`,
                        [newField]: sql`${discussionReplies[newField]} + 1`
                    })
                    .where(eq(discussionReplies.id, parseInt(replyId)));
            }
        } else if (voteType) {
            // Create new vote
            await db.insert(discussionVotes)
                .values({ replyId: parseInt(replyId), userId, voteType });
            
            // Update reply vote counts
            const field = voteType === 'up' ? 'upvotes' : 'downvotes';
            await db.update(discussionReplies)
                .set({ [field]: sql`${discussionReplies[field]} + 1` })
                .where(eq(discussionReplies.id, parseInt(replyId)));
        }

        // Return updated reply
        const [updatedReply] = await db
            .select({
                ...getTableColumns(discussionReplies),
                voteCount: sql<number>`COALESCE(
                    (SELECT COUNT(*) FROM discussion_votes WHERE reply_id = discussion_replies.id AND vote_type = 'up') -
                    (SELECT COUNT(*) FROM discussion_votes WHERE reply_id = discussion_replies.id AND vote_type = 'down'),
                    0
                )`
            })
            .from(discussionReplies)
            .where(eq(discussionReplies.id, parseInt(replyId)));

        res.json({ data: updatedReply });
    } catch (error) {
        console.error(`POST /discussions/:discussionId/replies/:replyId/vote error:`, error);
        res.status(500).json({ error: 'Failed to vote on reply' });
    }
});

// Accept answer (teacher only)
router.post("/discussions/:discussionId/replies/:replyId/accept", async (req, res) => {
    try {
        const { discussionId, replyId } = req.params;
        const authUser = getAuthUser(req);
        const userId = authUser?.id;
        const userRole = authUser?.role;

        if (!userId || (userRole !== 'teacher' && userRole !== 'admin')) {
            return res.status(403).json({ error: 'Forbidden - teachers only' });
        }

        // Verify reply belongs to discussion
        const [reply] = await db
            .select({ discussionId: discussionReplies.discussionId })
            .from(discussionReplies)
            .where(eq(discussionReplies.id, parseInt(replyId)));

        if (!reply || reply.discussionId !== parseInt(discussionId)) {
            return res.status(404).json({ error: 'Reply not found in this discussion' });
        }

        // Unset all accepted replies in this discussion
        await db.update(discussionReplies)
            .set({ isAccepted: false })
            .where(eq(discussionReplies.discussionId, parseInt(discussionId)));

        // Toggle the selected reply
        const [currentReply] = await db
            .select({ isAccepted: discussionReplies.isAccepted })
            .from(discussionReplies)
            .where(eq(discussionReplies.id, parseInt(replyId)));

        if (currentReply && !currentReply.isAccepted) {
            await db.update(discussionReplies)
                .set({ isAccepted: true })
                .where(eq(discussionReplies.id, parseInt(replyId)));
        }

        res.json({ message: 'Answer status updated' });
    } catch (error) {
        console.error(`POST /discussions/:discussionId/replies/:replyId/accept error:`, error);
        res.status(500).json({ error: 'Failed to accept answer' });
    }
});

export default router;
