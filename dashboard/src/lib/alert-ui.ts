import type { AlertLevel } from './types';

// Always pair colour with a text label — never colour alone.
export const ALERT_LABEL: Record<AlertLevel, string> = {
	green: 'Safe',
	yellow: 'Caution',
	red: 'Danger'
};

// Solid strip / dot colours per claude.md (green-500, yellow-500, red-600).
export const ALERT_STRIP: Record<AlertLevel, string> = {
	green: 'bg-green-500',
	yellow: 'bg-yellow-500',
	red: 'bg-red-600'
};

// Soft badge background + text.
export const ALERT_BADGE: Record<AlertLevel, string> = {
	green: 'bg-green-50 text-green-700',
	yellow: 'bg-yellow-50 text-yellow-700',
	red: 'bg-red-50 text-red-700'
};

export function relativeTime(iso: string): string {
	const diffMs = Date.now() - new Date(iso).getTime();
	const min = Math.round(diffMs / 60_000);
	if (min < 1) return 'just now';
	if (min < 60) return `${min} min ago`;
	const hr = Math.round(min / 60);
	if (hr < 24) return `${hr} hr ago`;
	const day = Math.round(hr / 24);
	return `${day} day${day > 1 ? 's' : ''} ago`;
}
