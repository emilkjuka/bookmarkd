import { isRedirect, type Cookies } from '@sveltejs/kit';
import { safeParse } from 'valibot';
import { urlSchema } from '#lib/schemas/bookmark';
import { redirectWithFlash } from '#lib/server/flash';
import { createBookmark } from '#lib/server/bookmarks/service';

export function parseBookmarkTarget(raw: string | null | undefined): string | null {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;

	const parsed = safeParse(urlSchema, trimmed);
	return parsed.success ? parsed.output : null;
}

/** Parse a path like `https://example.com/article` from `/save/https://example.com/article`. */
export function parseBookmarkTargetFromPath(path: string | undefined): string | null {
	if (!path) return null;
	const trimmed = path.startsWith('/') ? path.slice(1) : path;
	if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return null;
	return parseBookmarkTarget(trimmed);
}

export async function quickSaveBookmark(
	userId: string,
	targetUrl: string,
	cookies: Cookies,
	fetchFn?: typeof fetch
): Promise<never> {
	try {
		await createBookmark(userId, { url: targetUrl }, fetchFn);
	} catch (error) {
		if (isRedirect(error)) throw error;

		const message = error instanceof Error ? error.message : 'Could not save bookmark';
		if (/already saved/i.test(message)) {
			redirectWithFlash(cookies, '/bookmarks', {
				type: 'info',
				message: 'You already saved this URL.'
			});
		}
		redirectWithFlash(cookies, '/bookmarks', { type: 'error', message });
	}

	redirectWithFlash(cookies, '/bookmarks', {
		type: 'success',
		message: 'Bookmark saved.'
	});
}
