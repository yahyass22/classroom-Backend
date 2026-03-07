import "dotenv/config";
import { db } from "./db/index.js";
import { 
  departments, 
  subjects, 
  teachers, 
  teacherSubjects,
  classes, 
  enrollments 
} from "./db/schema/app.js";
import { user } from "./db/schema/auth.js";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting comprehensive database seed...\n");

  // Clear existing data (in reverse order of dependencies)
  console.log("🧹 Clearing existing data...");
  await db.delete(enrollments);
  await db.delete(teacherSubjects);
  await db.delete(classes);
  await db.delete(teachers);
  await db.delete(subjects);
  await db.delete(departments);
  await db.delete(user).where(eq(user.role, 'student'));
  await db.delete(user).where(eq(user.role, 'teacher'));
  await db.delete(user).where(eq(user.role, 'admin'));
  console.log("✅ Data cleared\n");

  // ============ DEPARTMENTS (12 total) ============
  console.log("📚 Creating departments...");
  const departmentData = [
    { code: "CS", name: "Computer Science", description: "Computing and software development" },
    { code: "IT", name: "Information Technology", description: "IT systems and networking" },
    { code: "MATH", name: "Mathematics", description: "Mathematical sciences" },
    { code: "STAT", name: "Statistics", description: "Statistical analysis and probability" },
    { code: "PHYS", name: "Physics", description: "Physical sciences" },
    { code: "CHEM", name: "Chemistry", description: "Chemical sciences" },
    { code: "BIO", name: "Biology", description: "Life sciences" },
    { code: "ENG", name: "English", description: "Language and literature" },
    { code: "HIST", name: "History", description: "Historical studies" },
    { code: "ECON", name: "Economics", description: "Economic theory and applications" },
    { code: "PSY", name: "Psychology", description: "Behavioral and mental sciences" },
    { code: "ME", name: "Mechanical Engineering", description: "Mechanical systems design" },
  ];

  await db.insert(departments).values(departmentData);
  const departmentsList = await db.select().from(departments).orderBy(departments.id);
  console.log(`✅ Created ${departmentsList.length} departments\n`);

  // ============ SUBJECTS (36 total, 3 per department) ============
  console.log("📖 Creating subjects...");
  const subjectData = [
    // Computer Science
    { departmentId: departmentsList[0].id, code: "CS101", name: "Introduction to Programming", description: "Learn programming basics with Python" },
    { departmentId: departmentsList[0].id, code: "CS201", name: "Data Structures", description: "Advanced data structures and algorithms" },
    { departmentId: departmentsList[0].id, code: "CS301", name: "Database Systems", description: "Database design and SQL" },
    // Information Technology
    { departmentId: departmentsList[1].id, code: "IT101", name: "Computer Networks", description: "Networking fundamentals" },
    { departmentId: departmentsList[1].id, code: "IT201", name: "Web Technologies", description: "HTML, CSS, JavaScript" },
    { departmentId: departmentsList[1].id, code: "IT301", name: "Cloud Computing", description: "Cloud platforms and services" },
    // Mathematics
    { departmentId: departmentsList[2].id, code: "MATH101", name: "Calculus I", description: "Differential calculus" },
    { departmentId: departmentsList[2].id, code: "MATH201", name: "Linear Algebra", description: "Matrix theory and vector spaces" },
    { departmentId: departmentsList[2].id, code: "MATH301", name: "Discrete Mathematics", description: "Logic and set theory" },
    // Statistics
    { departmentId: departmentsList[3].id, code: "STAT101", name: "Introduction to Statistics", description: "Descriptive and inferential statistics" },
    { departmentId: departmentsList[3].id, code: "STAT201", name: "Probability Theory", description: "Probability and distributions" },
    { departmentId: departmentsList[3].id, code: "STAT301", name: "Statistical Modeling", description: "Regression and ANOVA" },
    // Physics
    { departmentId: departmentsList[4].id, code: "PHYS101", name: "Physics I", description: "Classical mechanics" },
    { departmentId: departmentsList[4].id, code: "PHYS201", name: "Physics II", description: "Electricity and magnetism" },
    { departmentId: departmentsList[4].id, code: "PHYS301", name: "Quantum Mechanics", description: "Introduction to quantum physics" },
    // Chemistry
    { departmentId: departmentsList[5].id, code: "CHEM101", name: "Chemistry I", description: "General chemistry" },
    { departmentId: departmentsList[5].id, code: "CHEM201", name: "Organic Chemistry", description: "Organic compounds and reactions" },
    { departmentId: departmentsList[5].id, code: "CHEM301", name: "Physical Chemistry", description: "Thermodynamics and kinetics" },
    // Biology
    { departmentId: departmentsList[6].id, code: "BIO101", name: "Introduction to Biology", description: "Cell biology and genetics" },
    { departmentId: departmentsList[6].id, code: "BIO201", name: "Human Anatomy", description: "Human body systems" },
    { departmentId: departmentsList[6].id, code: "BIO301", name: "Molecular Biology", description: "DNA and protein synthesis" },
    // English
    { departmentId: departmentsList[7].id, code: "ENG101", name: "English Composition", description: "Writing and composition" },
    { departmentId: departmentsList[7].id, code: "ENG201", name: "British Literature", description: "Survey of British literature" },
    { departmentId: departmentsList[7].id, code: "ENG301", name: "Creative Writing", description: "Fiction and poetry writing" },
    // History
    { departmentId: departmentsList[8].id, code: "HIST101", name: "World History", description: "Global historical overview" },
    { departmentId: departmentsList[8].id, code: "HIST201", name: "American History", description: "US history from colonization" },
    { departmentId: departmentsList[8].id, code: "HIST301", name: "European History", description: "European history since 1789" },
    // Economics
    { departmentId: departmentsList[9].id, code: "ECON101", name: "Microeconomics", description: "Individual economic behavior" },
    { departmentId: departmentsList[9].id, code: "ECON201", name: "Macroeconomics", description: "Economy-wide phenomena" },
    { departmentId: departmentsList[9].id, code: "ECON301", name: "Econometrics", description: "Statistical methods in economics" },
    // Psychology
    { departmentId: departmentsList[10].id, code: "PSY101", name: "Introduction to Psychology", description: "Fundamentals of psychology" },
    { departmentId: departmentsList[10].id, code: "PSY201", name: "Developmental Psychology", description: "Human development across lifespan" },
    { departmentId: departmentsList[10].id, code: "PSY301", name: "Cognitive Psychology", description: "Memory and perception" },
    // Mechanical Engineering
    { departmentId: departmentsList[11].id, code: "ME101", name: "Engineering Mechanics", description: "Statics and dynamics" },
    { departmentId: departmentsList[11].id, code: "ME201", name: "Thermodynamics", description: "Energy and heat transfer" },
    { departmentId: departmentsList[11].id, code: "ME301", name: "Fluid Mechanics", description: "Fluid behavior and applications" },
  ];

  await db.insert(subjects).values(subjectData);
  const subjectsList = await db.select().from(subjects).orderBy(subjects.id);
  console.log(`✅ Created ${subjectsList.length} subjects\n`);

  // ============ USERS (Teachers + Students + Admins) ============
  console.log("👥 Creating users...");
  
  // Teachers (24 total, 2 per department)
  const teacherUsers = [];
  for (let i = 0; i < 24; i++) {
    const deptIndex = Math.floor(i / 2);
    teacherUsers.push({
      id: `teacher-${i + 1}`,
      name: `Dr. Teacher ${i + 1}`,
      email: `teacher${i + 1}@university.edu`,
      emailVerified: true,
      role: "teacher" as const,
    });
  }

  // Students (200 total)
  const studentUsers = [];
  for (let i = 0; i < 200; i++) {
    studentUsers.push({
      id: `student-${i + 1}`,
      name: `Student ${i + 1}`,
      email: `student${i + 1}@university.edu`,
      emailVerified: true,
      role: "student" as const,
    });
  }

  // Admins (3 total)
  const adminUsers = [
    { id: "admin-1", name: "Admin User 1", email: "admin1@university.edu", emailVerified: true, role: "admin" as const },
    { id: "admin-2", name: "Admin User 2", email: "admin2@university.edu", emailVerified: true, role: "admin" as const },
    { id: "admin-3", name: "Admin User 3", email: "admin3@university.edu", emailVerified: true, role: "admin" as const },
  ];

  await db.insert(user).values([...teacherUsers, ...studentUsers, ...adminUsers]);
  console.log(`✅ Created ${teacherUsers.length} teachers, ${studentUsers.length} students, ${adminUsers.length} admins\n`);

  // ============ TEACHERS RECORDS ============
  console.log("👨‍🏫 Creating teacher records...");
  const teacherRecords = [];
  for (let i = 0; i < 24; i++) {
    const deptIndex = Math.floor(i / 2);
    teacherRecords.push({
      departmentId: departmentsList[deptIndex].id,
      employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
      firstName: `Teacher${i + 1}`,
      lastName: `Name${i + 1}`,
      email: `teacher${i + 1}@university.edu`,
      specialization: `Specialization ${i + 1}`,
    });
  }
  await db.insert(teachers).values(teacherRecords);
  const teachersList = await db.select().from(teachers).orderBy(teachers.id);
  console.log(`✅ Created ${teachersList.length} teacher records\n`);

  // ============ TEACHER_SUBJECTS (link teachers to subjects) ============
  console.log("📚 Creating teacher-subject assignments...");
  const teacherSubjectData = [];
  
  // Assign each teacher to 1-3 subjects in their department
  for (const teacher of teachersList) {
    // Get subjects in teacher's department
    const deptSubjects = subjectsList.filter(s => s.departmentId === teacher.departmentId);
    
    // Assign teacher to 1-3 subjects
    const numSubjects = Math.min(deptSubjects.length, 1 + (teacher.id % 3));
    for (let i = 0; i < numSubjects; i++) {
      const subject = deptSubjects[i];
      if (subject) {
        teacherSubjectData.push({
          teacherId: teacher.id,
          subjectId: subject.id,
        });
      }
    }
  }
  
  await db.insert(teacherSubjects).values(teacherSubjectData).onConflictDoNothing();
  console.log(`✅ Created ${teacherSubjectData.length} teacher-subject assignments\n`);

  // ============ CLASSES (48 total, 4 per department) ============
  console.log("🏫 Creating classes...");
  const classData = [];
  const statuses = ["active", "active", "active", "inactive", "archived"]; // Weighted towards active
  
  let classIndex = 0;
  for (const subject of subjectsList) {
    // Create 1-2 classes per subject
    const numClasses = subject.id % 3 === 0 ? 2 : 1;
    
    for (let c = 0; c < numClasses; c++) {
      // Use teacher user ID (not teachers.id)
      const teacherUserIndex = classIndex % teacherUsers.length;
      const teacherUserId = teacherUsers[teacherUserIndex].id; // This is the user.id
      const status = statuses[classIndex % statuses.length];
      
      // Add schedules for some classes
      const schedules = classIndex % 3 === 0 ? [
        { day: "Monday", startTime: "09:00", endTime: "10:30" },
        { day: "Wednesday", startTime: "09:00", endTime: "10:30" },
      ] : classIndex % 3 === 1 ? [
        { day: "Tuesday", startTime: "14:00", endTime: "15:30" },
        { day: "Thursday", startTime: "14:00", endTime: "15:30" },
      ] : [
        { day: "Monday", startTime: "11:00", endTime: "12:30" },
        { day: "Friday", startTime: "11:00", endTime: "12:30" },
      ];

      classData.push({
        subjectId: subject.id,
        teacherId: teacherUserId, // Reference user.id, not teachers.id
        inviteCode: `${subject.code}-${String.fromCharCode(65 + c)}`,
        name: `${subject.name} - Section ${String.fromCharCode(65 + c)}`,
        description: `Section ${String.fromCharCode(65 + c)}, ${new Date().getFullYear()}`,
        capacity: 30 + (classIndex % 31), // 30-60
        status: status as "active" | "inactive" | "archived",
        schedules: schedules,
      });
      classIndex++;
    }
  }

  await db.insert(classes).values(classData);
  const classesList = await db.select().from(classes).orderBy(classes.id);
  console.log(`✅ Created ${classesList.length} classes\n`);

  // ============ ENROLLMENTS (600 total, spread across all departments) ============
  console.log("📝 Creating enrollments...");
  const enrollmentData = [];
  
  // Spread enrollments across different months for trend charts
  const months = [
    "2025-07-15T10:00:00Z",
    "2025-08-15T10:00:00Z",
    "2025-09-15T10:00:00Z",
    "2025-10-15T10:00:00Z",
    "2025-11-15T10:00:00Z",
    "2025-12-15T10:00:00Z",
    "2026-01-15T10:00:00Z",
    "2026-02-15T10:00:00Z",
  ];

  let enrollmentCount = 0;
  
  // Enroll students in classes across ALL departments
  for (const classItem of classesList) {
    // Each class gets 10-20 students
    const numStudents = 10 + (classItem.id % 11);
    
    for (let i = 0; i < numStudents; i++) {
      // Pick students ensuring distribution
      const studentId = `student-${((classItem.id + i) % 200) + 1}`;
      const monthIndex = enrollmentCount % months.length;
      
      enrollmentData.push({
        studentId: studentId,
        classId: classItem.id,
        createdAt: new Date(months[monthIndex]),
      });
      enrollmentCount++;
    }
  }

  await db.insert(enrollments).values(enrollmentData).onConflictDoNothing();
  console.log(`✅ Created ${enrollmentData.length} enrollments\n`);

  // ============ SUMMARY ============
  console.log("\n🎉 Database seeding completed successfully!\n");
  console.log("📊 Summary:");
  console.log(`   - ${departmentsList.length} departments`);
  console.log(`   - ${subjectsList.length} subjects`);
  console.log(`   - ${teachersList.length} teachers`);
  console.log(`   - ${classesList.length} classes`);
  console.log(`   - ${enrollmentData.length} enrollments`);
  console.log(`   - ${teacherUsers.length} teacher users`);
  console.log(`   - ${studentUsers.length} student users`);
  console.log(`   - ${adminUsers.length} admin users`);
  
  console.log("\n📈 Chart Data Distribution:");
  console.log(`   - Students enrolled across all ${departmentsList.length} departments`);
  console.log(`   - Classes with varied statuses (active/inactive/archived)`);
  console.log(`   - Enrollments spread across ${months.length} months`);
  console.log(`   - Schedules with different days and times for heatmap`);
  
  console.log("\n🎨 Dashboard charts should now display properly!\n");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
