import express from "express";
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {user} from "../db/schema/index.js";
import {db} from '../db/index.js'

const router = express.Router();

// get all users with optional search filtering, role filtering and pagination
router.get('/', async (req, res) => {
    try {
        const { search, role, page, limit } = req.query;
        const toPositiveInt = (value: unknown, fallback: number) => {
            const raw = Array.isArray(value) ? value[0] : value;
            const parsed = Number.parseInt(String(raw ?? ''), 10);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
        };
        const currentpage = toPositiveInt(page, 1);
        const limitperpage = toPositiveInt(limit, 10);
        const offset = (currentpage - 1) * limitperpage;
        const filterconditions = [];

        // if search query exists search by user name or user email
        const searchTerm = typeof search === 'string' ? search.trim() : undefined;
        if (searchTerm) {
            filterconditions.push(
                or(
                    ilike(user.name, `%${searchTerm}%`),
                    ilike(user.email, `%${searchTerm}%`)
                )
            );
        }

        // if role filter exists match by role
        const roleTerm = typeof role === 'string' ? role.trim() : undefined;
        if (roleTerm) {
            filterconditions.push(eq(user.role, roleTerm as any));
        }

        // combining all filters
        const whereClause = filterconditions.length > 0 ? and(...filterconditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(user)
            .where(whereClause);
            
        const totalCount = countResult[0]?.count ?? 0;
        
        const usersList = await db.select({
            ...getTableColumns(user)
        }).from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitperpage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentpage,
                limit: limitperpage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitperpage),
            }
        });

    } catch (e) {
        console.error(`GET /users error: ${e}`);
        console.error(`GET /users error stack: ${e instanceof Error ? e.stack : 'N/A'}`);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

export default router;
