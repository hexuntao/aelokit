import { loadWorkspaceEnv } from '@repo/env/load';

export default async function listUsers() {
  loadWorkspaceEnv(import.meta.dirname);
  const [{ getDb }, { user }] = await Promise.all([
    import('../src/db/index.js'),
    import('../src/db/schema.js'),
  ]);
  const db = await getDb();

  try {
    const users = await db.select({ email: user.email }).from(user);

    // Extract emails from users
    const emails: string[] = users.map((user) => user.email);

    console.log(`Total users: ${emails.length}`);

    // Output all emails joined with comma
    console.log(emails.join(', '));

    console.log('List users completed');
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

listUsers();
