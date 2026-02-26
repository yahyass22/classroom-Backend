import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { departments, subjects } from './db/schema/app.js';

async function main() {
  try {
    console.log('Performing CRUD operations...');

    // CREATE: Insert a new department
    const [newDept] = await db
      .insert(departments)
      .values({ 
        code: 'CS', 
        name: 'Computer Science', 
        description: 'Department of Computer Science' 
      })
      .returning();

    if (!newDept) {
      throw new Error('Failed to create department');
    }
    
    console.log('✅ CREATE: New department created:', newDept);

    // READ: Select the department
    const foundDept = await db.select().from(departments).where(eq(departments.id, newDept.id));
    console.log('✅ READ: Found department:', foundDept[0]);

    // UPDATE: Change the department name
    const [updatedDept] = await db
      .update(departments)
      .set({ name: 'Computer Science & Engineering' })
      .where(eq(departments.id, newDept.id))
      .returning();
    
    if (!updatedDept) {
      throw new Error('Failed to update department');
    }
    
    console.log('✅ UPDATE: Department updated:', updatedDept);

    // CREATE: Insert a subject linked to the department
    const [newSubject] = await db
      .insert(subjects)
      .values({
        departmentId: newDept.id,
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Learn the basics of programming'
      })
      .returning();

    if (!newSubject) {
      throw new Error('Failed to create subject');
    }

    console.log('✅ CREATE: New subject created:', newSubject);

    // READ: Select subjects with their department
    const foundSubjects = await db.select().from(subjects).where(eq(subjects.id, newSubject.id));
    console.log('✅ READ: Found subject:', foundSubjects[0]);

    // DELETE: Remove the subject first (due to foreign key constraint)
    await db.delete(subjects).where(eq(subjects.id, newSubject.id));
    console.log('✅ DELETE: Subject deleted.');

    // DELETE: Remove the department
    await db.delete(departments).where(eq(departments.id, newDept.id));
    console.log('✅ DELETE: Department deleted.');

    console.log('\nCRUD operations completed successfully.');
  } catch (error) {
    console.error('❌ Error performing CRUD operations:', error);
    process.exit(1);
  }
}

main();
