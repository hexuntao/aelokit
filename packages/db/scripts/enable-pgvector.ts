import { loadWorkspaceEnv } from '@repo/env/load';
import postgres from 'postgres';
import { serverEnv } from '@repo/env/server';

async function enablePgvector() {
  loadWorkspaceEnv(import.meta.dirname);

  const databaseUrl = serverEnv.DATABASE_URL;
  console.log('Enabling pgvector extension...');
  console.log('Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  const sql = postgres(databaseUrl);

  try {
    await sql.unsafe('CREATE EXTENSION IF NOT EXISTS vector');

    const result = await sql`
      SELECT * FROM pg_extension WHERE extname = 'vector'
    `;

    if (result.length > 0) {
      console.log('✓ pgvector extension is enabled');
      console.log('  Extension info:', result[0]);
    } else {
      console.log('✗ pgvector extension is not found');
      console.log('  Please install pgvector on your PostgreSQL server first');
    }
  } catch (error) {
    console.error('Error enabling pgvector:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

enablePgvector().catch((error) => {
  console.error('Failed to enable pgvector:', error);
  process.exit(1);
});
