import { Router } from "express";
import { db } from "../db/index.js";
import { classes, enrollments, subjects, teachers, departments, teacherSubjects } from "../db/schema/app.js";
import { user } from "../db/schema/auth.js";
import { eq, sql, desc, and } from "drizzle-orm";

const router = Router();

// Get dashboard statistics
router.get("/stats", async (_req, res) => {
  try {
    const [
      totalStudentsResult,
      totalClassesResult,
      totalTeachersResult,
      totalSubjectsResult,
      totalEnrollmentsResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(user).where(eq(user.role, "student")),
      db.select({ count: sql<number>`count(*)` }).from(classes).where(eq(classes.status, "active")),
      db.select({ count: sql<number>`count(*)` }).from(teachers),
      db.select({ count: sql<number>`count(*)` }).from(subjects),
      db.select({ count: sql<number>`count(*)` }).from(enrollments),
    ]);

    const stats = {
      totalStudents: Number(totalStudentsResult[0]?.count ?? 0),
      totalClasses: Number(totalClassesResult[0]?.count ?? 0),
      totalTeachers: Number(totalTeachersResult[0]?.count ?? 0),
      totalSubjects: Number(totalSubjectsResult[0]?.count ?? 0),
      totalEnrollments: Number(totalEnrollmentsResult[0]?.count ?? 0),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get enrollment trends (monthly)
router.get("/enrollment-trends", async (_req, res) => {
  try {
    const trends = await db
      .select({
        month: sql<string>`to_char(${enrollments.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
      })
      .from(enrollments)
      .groupBy(sql`to_char(${enrollments.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${enrollments.createdAt}, 'YYYY-MM')`);

    const enrollmentTrends = trends.map((t) => ({
      month: t.month,
      count: Number(t.count),
    }));

    res.json(enrollmentTrends);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch enrollment trends" });
  }
});

// Get recent classes
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
    res.status(500).json({ error: "Failed to fetch recent classes" });
  }
});

// Get enrollment by department
router.get("/enrollment-by-department", async (_req, res) => {
  try {
    const enrollmentData = await db
      .select({
        departmentName: departments.name,
        month: sql<string>`to_char(${enrollments.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
      })
      .from(enrollments)
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .groupBy(departments.name, sql`to_char(${enrollments.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${enrollments.createdAt}, 'YYYY-MM')`);

    const formattedData = enrollmentData.map((d) => ({
      department: d.departmentName ?? "Unknown",
      month: d.month,
      count: Number(d.count),
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch enrollment by department" });
  }
});

// Get student department distribution
router.get("/student-department-distribution", async (_req, res) => {
  try {
    const studentData = await db
      .select({
        departmentName: departments.name,
        departmentCode: departments.code,
        studentCount: sql<number>`count(distinct ${enrollments.studentId})`,
      })
      .from(departments)
      .leftJoin(subjects, eq(departments.id, subjects.departmentId))
      .leftJoin(classes, eq(subjects.id, classes.subjectId))
      .leftJoin(enrollments, eq(classes.id, enrollments.classId))
      .groupBy(departments.id, departments.name, departments.code)
      .having(sql`count(distinct ${enrollments.studentId}) > 0`)
      .orderBy(desc(sql`count(distinct ${enrollments.studentId})`));

    const formattedData = studentData.map((d) => ({
      name: d.departmentName,
      code: d.departmentCode,
      studentCount: Number(d.studentCount),
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch student distribution" });
  }
});

// Get class status distribution
router.get("/class-status-distribution", async (_req, res) => {
  try {
    const statusData = await db
      .select({
        status: classes.status,
        count: sql<number>`count(*)`,
      })
      .from(classes)
      .groupBy(classes.status);

    const formattedData = statusData.map((d) => ({
      status: d.status,
      count: Number(d.count),
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch class status distribution" });
  }
});

// Get at-risk resources
router.get("/at-risk", async (_req, res) => {
  try {
    const [orphanedClasses, unassignedTeachers] = await Promise.all([
      db
        .select({
          id: classes.id,
          name: classes.name,
          inviteCode: classes.inviteCode,
          type: sql<string>`'class'`,
          reason: sql<string>`'Active with 0 enrollments'`,
        })
        .from(classes)
        .leftJoin(enrollments, eq(classes.id, enrollments.classId))
        .where(eq(classes.status, "active"))
        .groupBy(classes.id)
        .having(sql`count(${enrollments.studentId}) = 0`),

      db
        .select({
          id: teachers.id,
          name: sql<string>`${teachers.firstName} || ' ' || ${teachers.lastName}`,
          inviteCode: teachers.employeeId,
          type: sql<string>`'teacher'`,
          reason: sql<string>`'No subjects assigned'`,
        })
        .from(teachers)
        .leftJoin(teacherSubjects, eq(teachers.id, teacherSubjects.teacherId))
        .groupBy(teachers.id, teachers.firstName, teachers.lastName, teachers.employeeId)
        .having(sql`count(${teacherSubjects.subjectId}) = 0`),
    ]);

    res.json([...orphanedClasses, ...unassignedTeachers]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch at-risk resources" });
  }
});

// Schedule heatmap / routine
router.get("/schedule-heatmap", async (_req, res) => {
  try {
    const activeClasses = await db
      .select({
        id: classes.id,
        name: classes.name,
        schedules: classes.schedules,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        departmentCode: departments.code,
        departmentName: departments.name,
        teacherName: user.name,
        teacherImage: user.image
      })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(eq(classes.status, "active"));

    const routineData: any[] = [];

    activeClasses.forEach((cls) => {
      if (cls.schedules && Array.isArray(cls.schedules)) {
        cls.schedules.forEach((sched: any) => {
          routineData.push({
            classId: cls.id,
            className: cls.name,
            subjectName: cls.subjectName,
            subjectCode: cls.subjectCode,
            departmentCode: cls.departmentCode,
            departmentName: cls.departmentName,
            teacherName: cls.teacherName,
            teacherImage: cls.teacherImage,
            day: sched.day,
            startTime: sched.startTime,
            endTime: sched.endTime
          });
        });
      }
    });

    res.json(routineData);
  } catch (error) {
    console.error("Failed to fetch schedule routine:", error);
    res.status(500).json({ error: "Failed to fetch schedule data" });
  }
});

// Top teachers
router.get("/top-teachers", async (_req, res) => {
  try {
    const teacherData = await db
      .select({
        teacherId: teachers.id,
        teacherName: sql<string>`${teachers.firstName} || ' ' || ${teachers.lastName}`,
        teacherEmail: teachers.email,
        departmentName: departments.name,
        classCount: sql<number>`count(distinct ${classes.id})`,
        studentCount: sql<number>`count(distinct ${enrollments.studentId})`,
      })
      .from(teachers)
      .leftJoin(departments, eq(teachers.departmentId, departments.id))
      .leftJoin(user, eq(teachers.email, user.email))
      .leftJoin(classes, eq(user.id, classes.teacherId))
      .leftJoin(enrollments, eq(classes.id, enrollments.classId))
      .groupBy(teachers.id, departments.name)
      .orderBy(desc(sql`count(distinct ${classes.id})`))
      .limit(10);

    const formattedData = teacherData.map((d) => ({
      id: d.teacherId,
      name: d.teacherName,
      email: d.teacherEmail,
      department: d.departmentName ?? "Unknown",
      classCount: Number(d.classCount),
      studentCount: Number(d.studentCount),
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch top teachers" });
  }
});

// User signup trends
router.get("/user-signup-trends", async (_req, res) => {
  try {
    const trends = await db
      .select({
        month: sql<string>`to_char(${user.createdAt}, 'YYYY-MM')`,
        studentCount: sql<number>`count(*) filter (where ${user.role} = 'student')`,
        teacherCount: sql<number>`count(*) filter (where ${user.role} = 'teacher')`,
      })
      .from(user)
      .groupBy(sql`to_char(${user.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${user.createdAt}, 'YYYY-MM')`);

    const formattedData = trends.map((t) => ({
      month: t.month,
      students: Number(t.studentCount),
      teachers: Number(t.teacherCount),
      total: Number(t.studentCount) + Number(t.teacherCount),
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user signup trends" });
  }
});

export default router;
