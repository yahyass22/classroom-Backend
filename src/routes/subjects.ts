import express from "express";
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {departments, subjects} from "../db/schema/app.js";
import {db} from '../db/index.js'

const router= express.Router();

//get all subjects with optiinal search filtering and pagenation
router.get('/', async (req , res  ) => {
    try {
        const { search, department, page, limit } = req.query;
        const toPositiveInt = (value: unknown, fallback: number) => {
            const raw = Array.isArray(value) ? value[0] : value;
            const parsed = Number.parseInt(String(raw ?? ''), 10);
           return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
        };
        const currentpage = toPositiveInt(page, 1);
        const limitperpage = toPositiveInt(limit, 10);
         const offset = (currentpage - 1) * limitperpage;
         const filterconditions = [];
         //if search query exists search by subject name or subject code

        const searchTerm = typeof search === 'string' ? search.trim() : undefined;
        if (searchTerm) {
            filterconditions.push(
                or(
                    ilike(subjects.name , `%${searchTerm}%`),
                    ilike(subjects.code, `%${searchTerm}%`)

                )
            );
        }
        //if department filter exists match by name
        const departmentTerm = typeof department === 'string' ? department.trim() : undefined;
         if (departmentTerm) {
             filterconditions.push(ilike(departments.name, `%${departmentTerm}%`));
        }

        //combining all filters
        const whereClause = filterconditions.length > 0 ? and(...filterconditions): undefined;
        const countResult= await db
            .select({ count: sql<number>`count(*)`})
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);
        const totalCount= countResult[0]?.count ?? 0;
        const subjectsList= await db.select({...getTableColumns(subjects), department:{...getTableColumns(departments)}
        }).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause).orderBy(desc(subjects.createdAt))
            .limit(limitperpage)
            .offset(offset);

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentpage,
                limit: limitperpage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitperpage),
            }
        });

    } catch (e) {
        console.error(`GET /subjects error: ${e}`);
        console.error(`GET /subjects error stack: ${e instanceof Error ? e.stack : 'N/A'}`);
        res.status(500).json({ error: 'Failed to get subjects' });

    }
})
export default router;