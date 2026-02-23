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

export const departementRelation= relations(departements,({ many })=>({subjects:many(subjects)}));

export const subjectsRelation= relations(subjects,({ one , many })=>({
    departement:one(departements,{
        fields:[subjects.departementId],
        references:[departements.id],
})
}));

export type Departement = typeof departements.$inferSelect;
export type NewDepartement = typeof departements.$inferInsert;

export type subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

