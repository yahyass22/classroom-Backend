import express from "express";
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {departments, subjects} from "../db/schema";
import {db} from '../db'

const router= express.Router();

//get all subjects with optiinal search filtering and pagenation
router.get('/', async (req , res  ) => {
    try {
         const {search , department ,page=1, limit = 10} = req.query;
         const currentpage = Math.max(1, +page);
         const limitperpage  = Math.max(1, +limit);
         const offset = (currentpage - 1) * limitperpage;
         const filterconditions = [];
         //if search query exists search by subject name or subject code
        if (search) {
            filterconditions.push(
                or(
                    ilike(subjects.name , `%${search}%`),
                    ilike(subjects.code, `%${search}%`)

                )
            );
        }
        //if department filter exists match by name
        if (department) {
            filterconditions.push(ilike(departments.name, `%${department}%`));
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
        res.status(500).json({error:'Failed to get subjects', details: e instanceof Error ? e.message : String(e)});

    }
})
export default router;