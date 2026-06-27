import { browser } from '$app/environment';

// Mock credential — swap for a real backend call later. Kept here so the whole
// auth surface lives in one file.
export const MOCK_EMAIL = 'admin@saliguard.vn';
export const MOCK_PASSWORD = 'saliguard123';

const SESSION_KEY = 'saliguard_session';
const NETWORK_DELAY_MS = 600;

export interface Session {
	email: string;
	ts: number;
}

export interface LoginResult {
	ok: boolean;
	error?: string;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Authenticate against the mock credential. Simulates ~600ms of network latency
 * and persists the session on success. Replace the body with a real API call
 * when the backend `POST /api/login` exists.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
	await delay(NETWORK_DELAY_MS);
	if (email !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
		return { ok: false, error: 'Email hoặc mật khẩu không đúng' };
	}
	setSession(email);
	return { ok: true };
}

export function setSession(email: string): void {
	if (!browser) return;
	const session: Session = { email, ts: Date.now() };
	localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
	if (!browser) return null;
	const raw = localStorage.getItem(SESSION_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as Session;
	} catch {
		return null;
	}
}

export function clearSession(): void {
	if (!browser) return;
	localStorage.removeItem(SESSION_KEY);
}
