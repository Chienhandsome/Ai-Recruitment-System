const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Connecting to Supabase PostgreSQL database...');
  await client.connect();

  console.log('Fetching database schema details...');

  const tablesRes = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;`
  );

  const columnsRes = await client.query(
    `SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;`
  );

  const enumsRes = await client.query(
    `SELECT t.typname AS enum_name, e.enumlabel AS enum_value FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' ORDER BY enum_name, e.enumsortorder;`
  );

  const pksRes = await client.query(
    `SELECT kcu.table_name, kcu.column_name, tc.constraint_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' ORDER BY kcu.table_name, kcu.ordinal_position;`
  );

  const fksRes = await client.query(
    `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name, tc.constraint_name, rc.update_rule, rc.delete_rule FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';`
  );

  const uqsRes = await client.query(
    `SELECT tc.table_name, kcu.column_name, tc.constraint_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public' ORDER BY tc.table_name;`
  );

  const indexesRes = await client.query(
    `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;`
  );

  const report = {
    tables: tablesRes.rows,
    columns: columnsRes.rows,
    enums: enumsRes.rows,
    pks: pksRes.rows,
    fks: fksRes.rows,
    uqs: uqsRes.rows,
    indexes: indexesRes.rows
  };

  const outputPath = require('path').join(__dirname, 'db_schema_actual.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Successfully saved actual database schema to ' + outputPath);
}

main()
  .catch((e) => {
    console.error('Error fetching schema:', e);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
