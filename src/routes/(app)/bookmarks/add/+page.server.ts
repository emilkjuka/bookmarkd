import { createBookmarkAction, previewBookmarkAction } from '#lib/server/bookmarks/actions';

export const load = () => ({});

export const actions = {
	previewBookmark: previewBookmarkAction,
	createBookmark: createBookmarkAction
};
