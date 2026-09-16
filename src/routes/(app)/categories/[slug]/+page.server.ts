import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listBookmarks } from '#lib/server/bookmarks/service';
import { getCategoryBySlug } from '#lib/server/categories/service';
import {
	addBookmarkFormActions,
	deleteBookmarkAction,
	previewBookmarkAction,
	togglePinBookmarkAction,
	updateBookmarkAction
} from '#lib/server/bookmarks/actions';
import { sidebarCategoryActions, sidebarTagActions } from '#lib/server/categories/actions';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const category = await getCategoryBySlug(locals.user!.id, params.slug);
	if (!category) error(404, 'Category not found');

	const q = url.searchParams.get('q') ?? '';
	const bookmarks = await listBookmarks(locals.user!.id, {
		q: q || undefined,
		categorySlug: params.slug
	});

	return { bookmarks, q, category };
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
