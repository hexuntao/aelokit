import type { auth } from './server';

// https://www.better-auth.com/docs/concepts/typescript#additional-fields
export type Session = typeof auth.$Infer.Session;
export type SessionUser = typeof auth.$Infer.Session.user;

export type { AuthAppCallbacks } from './server';
