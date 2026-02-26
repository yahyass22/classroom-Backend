import { bigint, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth.js";

export interface Schedule {
    day: string;
    startTime: string;
    endTime: string;
}

const timestamps = {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
};

export const departments = pgTable("departments", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }),
    ...timestamps
}, (table) => ({
    idx_departments_code: index('idx_departments_code').on(table.code),
}));

export const subjects = pgTable("subjects", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    departmentId: integer('department_id').notNull().references(() => departments.id, { onDelete: 'restrict' }),
    code: varchar('code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }),
    ...timestamps
}, (table) => ({
    idx_subjects_department: index('idx_subjects_department').on(table.departmentId),
    idx_subjects_department_code: index('idx_subjects_department_code').on(table.departmentId, table.code),
}));

export const teachers = pgTable("teachers", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    departmentId: integer('department_id').notNull().references(() => departments.id, { onDelete: 'restrict' }),
    employeeId: varchar('employee_id', { length: 50 }).notNull().unique(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    specialization: varchar('specialization', { length: 255 }),
    ...timestamps
}, (table) => ({
    idx_teachers_department: index('idx_teachers_department').on(table.departmentId),
    idx_teachers_email: index('idx_teachers_email').on(table.email),
    idx_teachers_employee_id: index('idx_teachers_employee_id').on(table.employeeId),
    idx_teachers_department_email: index('idx_teachers_department_email').on(table.departmentId, table.email),
}));

export const teacherSubjects = pgTable("teacher_subjects", {
    teacherId: integer('teacher_id').notNull().references(() => teachers.id, { onDelete: 'cascade' }),
    subjectId: integer('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
    ...timestamps
}, (table) => ({
    pk: primaryKey(table.teacherId, table.subjectId),
    idx_teacher_subjects_teacher: index('idx_teacher_subjects_teacher').on(table.teacherId),
    idx_teacher_subjects_subject: index('idx_teacher_subjects_subject').on(table.subjectId),
}));

export const classStatusEnum = pgEnum("class_status", ["active", "inactive", "archived"]);

export const classes = pgTable("classes", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    subjectId: integer('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
    teacherId: text('teacher_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
    inviteCode: varchar('invite_code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    bannerCldPubId: text('banner_cld_pub_id'),
    bannerUrl: text('banner_url'),
    description: text('description'),
    capacity: integer('capacity').notNull().default(50),
    status: classStatusEnum("status").notNull().default("active"),
    schedules: jsonb('schedules').$type<Schedule[]>(),
    ...timestamps
}, (table) => ({
    idx_classes_subject: index('idx_classes_subject').on(table.subjectId),
    idx_classes_teacher: index('idx_classes_teacher').on(table.teacherId),
}));

export const enrollments = pgTable("enrollments", {
    studentId: text('student_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
    ...timestamps
}, (table) => ({
    pk: primaryKey(table.studentId, table.classId),
    idx_enrollments_student: index('idx_enrollments_student').on(table.studentId),
    idx_enrollments_class: index('idx_enrollments_class').on(table.classId),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
    subjects: many(subjects),
    teachers: many(teachers),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
    department: one(departments, {
        fields: [subjects.departmentId],
        references: [departments.id],
    }),
    teacherSubjects: many(teacherSubjects),
    classes: many(classes),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
    department: one(departments, {
        fields: [teachers.departmentId],
        references: [departments.id],
    }),
    teacherSubjects: many(teacherSubjects),
}));

export const teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
    teacher: one(teachers, {
        fields: [teacherSubjects.teacherId],
        references: [teachers.id],
    }),
    subject: one(subjects, {
        fields: [teacherSubjects.subjectId],
        references: [subjects.id],
    }),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
    subject: one(subjects, {
        fields: [classes.subjectId],
        references: [subjects.id],
    }),
    teacher: one(user, {
        fields: [classes.teacherId],
        references: [user.id],
    }),
    enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
    student: one(user, {
        fields: [enrollments.studentId],
        references: [user.id],
    }),
    class: one(classes, {
        fields: [enrollments.classId],
        references: [classes.id],
    }),
}));

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;

export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type NewTeacherSubject = typeof teacherSubjects.$inferInsert;

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
