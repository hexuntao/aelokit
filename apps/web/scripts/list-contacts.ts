import { loadWorkspaceEnv } from '@repo/env/load';
import { Resend } from 'resend';

export default async function listContacts() {
  loadWorkspaceEnv(import.meta.dirname);
  const { serverEnv } = await import('@repo/env/server');
  const resend = new Resend(serverEnv.RESEND_API_KEY);
  const contacts = await resend.contacts.list({});

  // print all emails
  const emails: string[] = [];
  if (Array.isArray(contacts.data?.data)) {
    for (const contact of contacts.data.data) {
      emails.push(contact.email);
    }
  } else {
    console.error('contacts is not iterable');
  }

  console.log(emails.join(', '));
  console.log('List contacts completed');
}

listContacts();
