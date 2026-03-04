import "dotenv/config";
import { db } from "./db/index.js";
import { departments, subjects, teachers, classes, enrollments } from "./db/schema/app.js";
import { user } from "./db/schema/auth.js";

async function seed() {
  console.log("🌱 Starting database seed...");

  // Create departments
  console.log("Creating departments...");
  await db
    .insert(departments)
    .values([
      { code: "CS", name: "Computer Science", description: "Computing and software development" },
      { code: "MATH", name: "Mathematics", description: "Mathematical sciences" },
      { code: "PHYS", name: "Physics", description: "Physical sciences" },
      { code: "CHEM", name: "Chemistry", description: "Chemical sciences" },
      { code: "ENG", name: "English", description: "Language and literature" },
    ])
    .onConflictDoNothing();

  const departmentsList = await db.select().from(departments).orderBy(departments.id).limit(5);
  console.log(`✅ Using ${departmentsList.length} departments`);

  if (departmentsList.length < 5) {
    console.error("❌ Need at least 5 departments to continue");
    process.exit(1);
  }

  // Create subjects
  console.log("Creating subjects...");
  await db
    .insert(subjects)
    .values([
      { departmentId: departmentsList[0].id, code: "CS101", name: "Introduction to Programming", description: "Learn programming basics" },
      { departmentId: departmentsList[0].id, code: "CS201", name: "Data Structures", description: "Advanced data structures" },
      { departmentId: departmentsList[0].id, code: "CS301", name: "Algorithms", description: "Algorithm design and analysis" },
      { departmentId: departmentsList[0].id, code: "CS401", name: "Database Systems", description: "Database design and management" },
      { departmentId: departmentsList[1].id, code: "MATH101", name: "Calculus I", description: "Differential calculus" },
      { departmentId: departmentsList[1].id, code: "MATH201", name: "Linear Algebra", description: "Matrix theory and linear spaces" },
      { departmentId: departmentsList[2].id, code: "PHYS101", name: "Physics I", description: "Classical mechanics" },
      { departmentId: departmentsList[3].id, code: "CHEM101", name: "Chemistry I", description: "General chemistry" },
      { departmentId: departmentsList[4].id, code: "ENG101", name: "English Composition", description: "Writing and composition" },
    ])
    .onConflictDoNothing();

  const subjectsList = await db.select().from(subjects).orderBy(subjects.id).limit(9);
  console.log(`✅ Using ${subjectsList.length} subjects`);

  // Create users (students and teachers)
  console.log("Creating users...");
  const createdUsers = await db
    .insert(user)
    .values([
      // Teachers
      { id: "teacher-1", name: "Dr. John Smith", email: "john.smith@university.edu", emailVerified: true, role: "teacher" },
      { id: "teacher-2", name: "Prof. Jane Doe", email: "jane.doe@university.edu", emailVerified: true, role: "teacher" },
      { id: "teacher-3", name: "Dr. Bob Wilson", email: "bob.wilson@university.edu", emailVerified: true, role: "teacher" },
      // Students
      { id: "student-1", name: "Alice Johnson", email: "alice@student.edu", emailVerified: true, role: "student" },
      { id: "student-2", name: "Bob Brown", email: "bob@student.edu", emailVerified: true, role: "student" },
      { id: "student-3", name: "Charlie Davis", email: "charlie@student.edu", emailVerified: true, role: "student" },
      { id: "student-4", name: "Diana Miller", email: "diana@student.edu", emailVerified: true, role: "student" },
      { id: "student-5", name: "Eve Wilson", email: "eve@student.edu", emailVerified: true, role: "student" },
      { id: "student-6", name: "Frank Taylor", email: "frank@student.edu", emailVerified: true, role: "student" },
      { id: "student-7", name: "Grace Anderson", email: "grace@student.edu", emailVerified: true, role: "student" },
      { id: "student-8", name: "Henry Thomas", email: "henry@student.edu", emailVerified: true, role: "student" },
      { id: "student-9", name: "Ivy Jackson", email: "ivy@student.edu", emailVerified: true, role: "student" },
      { id: "student-10", name: "Jack White", email: "jack@student.edu", emailVerified: true, role: "student" },
      { id: "student-11", name: "Kate Harris", email: "kate@student.edu", emailVerified: true, role: "student" },
      { id: "student-12", name: "Leo Martin", email: "leo@student.edu", emailVerified: true, role: "student" },
      { id: "student-15", name: "Mary Garcia", email: "mary@student.edu", emailVerified: true, role: "student" },
      { id: "student-16", name: "Nick Robinson", email: "nick@student.edu", emailVerified: true, role: "student" },
      { id: "student-17", name: "Olivia Clark", email: "olivia@student.edu", emailVerified: true, role: "student" },
      { id: "student-18", name: "Paul Lewis", email: "paul@student.edu", emailVerified: true, role: "student" },
      { id: "student-19", name: "Quinn Lee", email: "quinn@student.edu", emailVerified: true, role: "student" },
      { id: "student-20", name: "Rachel Walker", email: "rachel@student.edu", emailVerified: true, role: "student" },
    ])
    .onConflictDoNothing();

  console.log(`✅ Created users`);

  // Create teachers records
  console.log("Creating teacher records...");
  await db
    .insert(teachers)
    .values([
      { departmentId: departmentsList[0].id, employeeId: "EMP001", firstName: "John", lastName: "Smith", email: "john.smith@university.edu", specialization: "Software Engineering" },
      { departmentId: departmentsList[0].id, employeeId: "EMP002", firstName: "Jane", lastName: "Doe", email: "jane.doe@university.edu", specialization: "Data Science" },
      { departmentId: departmentsList[1].id, employeeId: "EMP003", firstName: "Bob", lastName: "Wilson", email: "bob.wilson@university.edu", specialization: "Applied Mathematics" },
    ])
    .onConflictDoNothing();

  console.log(`✅ Created teacher records`);

  // Create classes
  console.log("Creating classes...");
  await db
    .insert(classes)
    .values([
      { subjectId: subjectsList[0].id, teacherId: "teacher-1", inviteCode: "CS101-A", name: "Intro to Programming - Section A", description: "Fall 2025", capacity: 50, status: "active" },
      { subjectId: subjectsList[1].id, teacherId: "teacher-1", inviteCode: "CS201-A", name: "Data Structures - Section A", description: "Fall 2025", capacity: 40, status: "active" },
      { subjectId: subjectsList[2].id, teacherId: "teacher-2", inviteCode: "CS301-A", name: "Algorithms - Section A", description: "Fall 2025", capacity: 35, status: "active" },
      { subjectId: subjectsList[3].id, teacherId: "teacher-2", inviteCode: "CS401-A", name: "Database Systems - Section A", description: "Fall 2025", capacity: 45, status: "active" },
      { subjectId: subjectsList[4].id, teacherId: "teacher-3", inviteCode: "MATH101-A", name: "Calculus I - Section A", description: "Fall 2025", capacity: 60, status: "active" },
      { subjectId: subjectsList[5].id, teacherId: "teacher-3", inviteCode: "MATH201-A", name: "Linear Algebra - Section A", description: "Fall 2025", capacity: 50, status: "active" },
      { subjectId: subjectsList[6].id, teacherId: "teacher-1", inviteCode: "PHYS101-A", name: "Physics I - Section A", description: "Fall 2025", capacity: 55, status: "active" },
      { subjectId: subjectsList[7].id, teacherId: "teacher-2", inviteCode: "CHEM101-A", name: "Chemistry I - Section A", description: "Fall 2025", capacity: 50, status: "active" },
      { subjectId: subjectsList[8].id, teacherId: "teacher-3", inviteCode: "ENG101-A", name: "English Composition - Section A", description: "Fall 2025", capacity: 30, status: "active" },
    ])
    .onConflictDoNothing();

  const classesList = await db.select().from(classes).orderBy(classes.id).limit(9);
  console.log(`✅ Using ${classesList.length} classes`);

  // Create enrollments with different dates for chart visualization
  console.log("Creating enrollments...");
  const enrollmentData = [];
  
  // Generate enrollments with dates spread across past months
  const students = [
    "student-1", "student-2", "student-3", "student-4", "student-5",
    "student-6", "student-7", "student-8", "student-9", "student-10",
    "student-11", "student-12", "student-15", "student-16", "student-17",
    "student-18", "student-19", "student-20"
  ];
  
  // Create enrollments spread across different months
  const months = [
    "2025-07-01T10:00:00Z",
    "2025-08-01T10:00:00Z",
    "2025-09-01T10:00:00Z",
    "2025-10-01T10:00:00Z",
    "2025-11-01T10:00:00Z",
    "2025-12-01T10:00:00Z",
    "2026-01-01T10:00:00Z",
    "2026-02-01T10:00:00Z",
  ];

  let enrollmentIndex = 0;
  for (const classItem of classesList) {
    const numStudents = Math.floor(Math.random() * 10) + 5; // 5-15 students per class
    for (let i = 0; i < numStudents && enrollmentIndex < students.length; i++) {
      const monthIndex = enrollmentIndex % months.length;
      enrollmentData.push({
        studentId: students[enrollmentIndex],
        classId: classItem.id,
        createdAt: new Date(months[monthIndex]),
      });
      enrollmentIndex++;
    }
  }

  await db.insert(enrollments).values(enrollmentData).onConflictDoNothing();
  console.log(`✅ Created ${enrollmentData.length} enrollments`);

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - ${departmentsList.length} departments`);
  console.log(`   - ${subjectsList.length} subjects`);
  console.log(`   - ${classesList.length} classes`);
  console.log(`   - ${enrollmentData.length} enrollments (new)`);
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
