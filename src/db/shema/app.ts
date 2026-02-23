import {integer, pgTable, timestamp, varchar} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";

const timestamps = {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(()=> new Date()).notNull()
}

export const departements = pgTable("departements", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    code: varchar('code', {length: 50}).notNull().unique(),
    name: varchar('name', {length: 255}).notNull(),
    description: varchar('description', {length: 255}),
    ...timestamps
});

export const subjects = pgTable("subjects", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    departementId: integer('departementID').notNull().references(()=> departements.id , {onDelete:'restrict'}),
    code: varchar('code', {length: 50}).notNull().unique(),
    name: varchar('name', {length: 255}).notNull(),
    description: varchar('description', {length: 255}),
    ...timestamps
});

export const teachers = pgTable("teachers", {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    departementId: integer('departementID').notNull().references(()=> departements.id , {onDelete:'restrict'}),
    employeeId: varchar('employee_id', {length: 50}).notNull().unique(),
    firstName: varchar('first_name', {length: 100}).notNull(),
    lastName: varchar('last_name', {length: 100}).notNull(),
    email: varchar('email', {length: 255}).notNull().unique(),
    phone: varchar('phone', {length: 20}),
    specialization: varchar('specialization', {length: 255}),
    ...timestamps
});

export const departementRelation= relations(departements,({ many })=>({
    subjects: many(subjects),
    teachers: many(teachers)
}));

export const subjectsRelation= relations(subjects,({ one , many })=>({
    departement:one(departements,{
        fields:[subjects.departementId],
        references:[departements.id],
    })
}));

export const teachersRelation= relations(teachers,({ one })=>({
    departement:one(departements,{
        fields:[teachers.departementId],
        references:[departements.id],
    })
}));

export type Departement = typeof departements.$inferSelect;
export type NewDepartement = typeof departements.$inferInsert;

export type subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;

