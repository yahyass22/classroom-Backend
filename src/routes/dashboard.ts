import { Router } from "express";
import { db } from "../db/index.js";
import { classes, enrollments, subjects, teachers, departments } from "../db/schema/app.js";
import { user } from "../db/schema/auth.js";
import { eq, sql, desc } from "drizzle-orm";

const router = Router();

// Get dashboard statistics
router.get("/stats", async (_req, res) => {
  try {
    const [
      totalStudentsResult,
      totalClassesResult,
      totalTeachersResult,
      totalSubjectsResult,
      totalRevenueResult,
    ] = await Promise.all([
      // Total students (users with role 'student')
      db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .where(eq(user.role, "student")),
      
      // Total active classes
      db
        .select({ count: sql<number>`count(*)` })
        .from(classes)
        .where(eq(classes.status, "active")),
      
      // Total teachers
      db.select({ count: sql<number>`count(*)` }).from(teachers),
      
      // Total subjects
      db.select({ count: sql<number>`count(*)` }).from(subjects),
      
      // Total revenue (sum of enrollment fees - placeholder calculation)
      db
        .select({ count: sql<number>`count(*)` })
        .from(enrollments),
    ]);

    const stats = {
      totalStudents: Number(totalStudentsResult[0]?.count ?? 0),
      totalClasses: Number(totalClassesResult[0]?.count ?? 0),
      totalTeachers: Number(totalTeachersResult[0]?.count ?? 0),
      totalSubjects: Number(totalSubjectsResult[0]?.count ?? 0),
      totalEnrollments: Number(totalRevenueResult[0]?.count ?? 0),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ 
      error: "Failed to fetch statistics",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get enrollment trends (monthly)
router.get("/enrollment-trends", async (_req, res) => {
  try {
    console.log("Fetching enrollment trends...");
    const trends = await db
      .select({
        month: sql<string>`to_char(${enrollments.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
      })
      .from(enrollments)
      .groupBy(sql`to_char(${enrollments.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${enrollments.createdAt}, 'YYYY-MM')`)
      .limit(12);

    console.log("Enrollment trends result:", trends);

    const enrollmentTrends = trends.map((t) => ({
      month: t.month,
      count: Number(t.count),
    }));

    res.json(enrollmentTrends);
  } catch (error) {
    console.error("Error fetching enrollment trends:", error);
    res.status(500).json({ 
      error: "Failed to fetch enrollment trends",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get recent classes with enrollment count
router.get("/recent-classes", async (_req, res) => {
  try {
    const recentClasses = await db
      .select({
        id: classes.id,
        name: classes.name,
        status: classes.status,
        capacity: classes.capacity,
        bannerUrl: classes.bannerUrl,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        teacherName: user.name,
        teacherEmail: user.email,
        enrollmentCount: sql<number>`count(${enrollments.studentId})`,
      })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .leftJoin(enrollments, eq(classes.id, enrollments.classId))
      .groupBy(classes.id, subjects.name, subjects.code, user.name, user.email)
      .orderBy(desc(classes.createdAt))
      .limit(10);

    const formattedClasses = recentClasses.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      capacity: c.capacity,
      bannerUrl: c.bannerUrl,
      subject: {
        name: c.subjectName ?? "N/A",
        code: c.subjectCode ?? "N/A",
      },
      teacher: {
        name: c.teacherName ?? "N/A",
        email: c.teacherEmail ?? "N/A",
      },
      enrolledStudents: Number(c.enrollmentCount),
    }));

    res.json(formattedClasses);
  } catch (error) {
    console.error("Error fetching recent classes:", error);
    res.status(500).json({ 
      error: "Failed to fetch recent classes",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get department-wise statistics
router.get("/department-stats", async (_req, res) => {
  try {
    const deptStats = await db
      .select({
        departmentName: departments.name,
        departmentCode: departments.code,
        teacherCount: sql<number>`count(distinct ${teachers.id})`,
        subjectCount: sql<number>`count(distinct ${subjects.id})`,
        classCount: sql<number>`count(distinct ${classes.id})`,
      })
      .from(departments)
      .leftJoin(teachers, eq(departments.id, teachers.departmentId))
      .leftJoin(subjects, eq(departments.id, subjects.departmentId))
      .leftJoin(classes, eq(subjects.id, classes.subjectId))
      .groupBy(departments.id, departments.name, departments.code);

    const formattedStats = deptStats.map((d) => ({
      name: d.departmentName,
      code: d.departmentCode,
      teacherCount: Number(d.teacherCount),
      subjectCount: Number(d.subjectCount),
      classCount: Number(d.classCount),
    }));

    res.json(formattedStats);
  } catch (error) {
    console.error("Error fetching department stats:", error);
    res.status(500).json({ 
      error: "Failed to fetch department statistics",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get student performance by class (for student performance table)
router.get("/student-performance", async (req, res) => {
  try {
    const { page = "1", limit = "10", department } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = db
      .select({
        studentId: user.id,
        studentName: user.name,
        studentEmail: user.email,
        className: classes.name,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        departmentName: departments.name,
        enrolledAt: enrollments.createdAt,
      })
      .from(enrollments)
      .leftJoin(user, eq(enrollments.studentId, user.id))
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(eq(user.role, "student"));

    if (department) {
      query = query.where(eq(departments.name, department as string));
    }

    const [results, totalCountResult] = await Promise.all([
      query.limit(limitNum).offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
        .leftJoin(user, eq(enrollments.studentId, user.id))
        .leftJoin(classes, eq(enrollments.classId, classes.id))
        .leftJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(departments, eq(subjects.departmentId, departments.id))
        .where(eq(user.role, "student")),
    ]);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);

    const formattedResults = results.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName ?? "N/A",
      studentEmail: r.studentEmail ?? "N/A",
      class: {
        name: r.className ?? "N/A",
      },
      subject: {
        name: r.subjectName ?? "N/A",
        code: r.subjectCode ?? "N/A",
      },
      department: r.departmentName ?? "N/A",
      enrolledAt: r.enrolledAt,
    }));

    res.json({
      data: formattedResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching student performance:", error);
    res.status(500).json({ 
      error: "Failed to fetch student performance",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
