import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('=== 1. TABLES ===');
  const tables = await prisma.$queryRawUnsafe<any[]>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;`
  );
  console.log(JSON.stringify(tables, null, 2));

  console.log('\n=== 2. COLUMNS ===');
  const columns = await prisma.$queryRawUnsafe<any[]>(
    `SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;`
  );
  console.log(JSON.stringify(columns, null, 2));

  console.log('\n=== 3. ENUMS ===');
  const enums = await prisma.$queryRawUnsafe<any[]>(
    `SELECT t.typname AS enum_name, e.enumlabel AS enum_value FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' ORDER BY enum_name, e.enumsortorder;`
  );
  console.log(JSON.stringify(enums, null, 2));

  console.log('\n=== 4. PRIMARY KEYS ===');
  const pks = await prisma.$queryRawUnsafe<any[]>(
    `SELECT kcu.table_name, kcu.column_name, tc.constraint_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' ORDER BY kcu.table_name, kcu.ordinal_position;`
  );
  console.log(JSON.stringify(pks, null, 2));

  console.log('\n=== 5. FOREIGN KEYS ===');
  const fks = await prisma.$queryRawUnsafe<any[]>(
    `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name, tc.constraint_name, rc.update_rule, rc.delete_rule FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';`
  );
  console.log(JSON.stringify(fks, null, 2));

  console.log('\n=== 6. UNIQUE CONSTRAINTS ===');
  const uqs = await prisma.$queryRawUnsafe<any[]>(
    `SELECT tc.table_name, kcu.column_name, tc.constraint_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public' ORDER BY tc.table_name;`
  );
  console.log(JSON.stringify(uqs, null, 2));

  console.log('\n=== 7. INDEXES ===');
  const indexes = await prisma.$queryRawUnsafe<any[]>(
    `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;`
  );
  console.log(JSON.stringify(indexes, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
