import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedFilePath = join(__dirname, '..', 'seed-mega.sql');
const seedSQL = readFileSync(seedFilePath, 'utf-8');

const sections = seedSQL.split(/\n\s*\n(?=--\s*={10,})/);

const section10 = sections[10];

if (section10) {
  const statements = section10.split(';');
  console.log(`Section 10 has ${statements.length} statements\n`);
  
  statements.forEach((stmt, idx) => {
    const trimmed = stmt.trim();
    if (trimmed && !trimmed.split('\n').every(line => line.trim().startsWith('--') || line.trim() === '')) {
      const cleanedStmt = trimmed.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim();
      console.log(`\n=== Statement ${idx} (${cleanedStmt.length} chars) ===`);
      console.log(cleanedStmt);
    }
  });
}
