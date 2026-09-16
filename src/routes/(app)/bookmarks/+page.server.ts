import type { PageServerLoad } from './$types';
import { listBookmarks } from '#lib/server/bookmarks/service';
import {
	addBookmarkFormActions,
	deleteBookmarkAction,
	previewBookmarkAction,
	togglePinBookmarkAction,
	updateBookmarkAction
} from '#lib/server/bookmarks/actions';
import { sidebarCategoryActions, sidebarTagActions } from '#lib/server/categories/actions';

export const load: PageServerLoad = async ({ locals, url }) => {
	const q = url.searchParams.get('q') ?? '';
	const filters = { q: q || undefined };
	const [pinnedBookmarks, bookmarks] = await Promise.all([
		listBookmarks(locals.user!.id, { ...filters, pinned: true }),
		listBookmarks(locals.user!.id, { ...filters, pinned: false })
	]);
	return { pinnedBookmarks, bookmarks, q };
};

export const actions = {
	...sidebarCategoryActions,
	...sidebarTagActions,
	...addBookmarkFormActions,
	preview: previewBookmarkAction,
	update: updateBookmarkAction,
	delete: deleteBookmarkAction,
	togglePin: togglePinBookmarkAction
};
