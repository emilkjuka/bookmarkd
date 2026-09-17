import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseBookmarkTargetFromPath, quickSaveBookmark } from '#lib/server/bookmarks/save-url';

export const GET: RequestHandler = async ({ params, locals, url, fetch, cookies }) => {
	if (!locals.user) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	const target = parseBookmarkTargetFromPath(params.target);
	if (!target) error(400, 'Paste a full http(s) URL after /save/');

	await quickSaveBookmark(locals.user.id, target, cookies, fetch);
	error(500, 'Unreachable');
};
