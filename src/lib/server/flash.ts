import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import type { FlashMessage } from '#lib/types';

export type { FlashMessage };

const FLASH_COOKIE = 'bookmarkd_flash';

export function setFlash(cookies: Cookies, flash: FlashMessage) {
	cookies.set(FLASH_COOKIE, JSON.stringify(flash), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 30,
		secure: import.meta.env.PROD
	});
}

export function consumeFlash(cookies: Cookies): FlashMessage | null {
	const raw = cookies.get(FLASH_COOKIE);
	if (!raw) return null;

	cookies.delete(FLASH_COOKIE, { path: '/' });

	try {
		const parsed = JSON.parse(raw) as FlashMessage;
		if (
			(parsed.type === 'success' || parsed.type === 'error' || parsed.type === 'info') &&
			typeof parsed.message === 'string'
		) {
			return parsed;
		}
	} catch {
		// ignore malformed cookie
	}

	return null;
}

export function redirectWithFlash(
	cookies: Cookies,
	location: string,
	flash: FlashMessage
): never {
	setFlash(cookies, flash);
	redirect(303, location);
}
