import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listBookmarks } from '#lib/server/bookmarks/service';
import { getTagBySlug } from '#lib/server/tags/service';
import {
	addBookmarkFormActions,
	deleteBookmarkAction,
	previewBookmarkAction,
	togglePinBookmarkAction,
	updateBookmarkAction
} from '#lib/server/bookmarks/actions';
import { sidebarCategoryActions, sidebarTagActions } from '#lib/server/categories/actions';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const tag = await getTagBySlug(locals.user!.id, params.slug);
	if (!tag) error(404, 'Tag not found');

	const q = url.searchParams.get('q') ?? '';
	const bookmarks = await listBookmarks(locals.user!.id, {
		q: q || undefined,
		tagSlug: params.slug
	});

	return { bookmarks, q, tag };
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
