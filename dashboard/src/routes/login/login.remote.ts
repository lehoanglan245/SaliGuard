import { form } from '$app/server';
import { loginSchema } from '$lib/schema';

// Server-side `form` remote function. Validates the submission against the same
// Zod schema used for the client preflight. Credential verification and session
// persistence happen client-side (mock auth) — see `$lib/auth`.
export const loginForm = form(loginSchema, async () => {
	return { ok: true as const };
});
