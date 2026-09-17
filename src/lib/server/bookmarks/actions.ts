import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { safeParse } from 'valibot';
import {
	bookmarkCreateSchema,
	bookmarkDeleteSchema,
	bookmarkPreviewSchema,
	bookmarkTogglePinSchema,
	bookmarkUpdateSchema
} from '#lib/schemas/bookmark';
import {
	createBookmark,
	deleteBookmark,
	toggleBookmarkPin,
	updateBookmark
} from '#lib/server/bookmarks/service';
import { fetchPageMetadata } from '#lib/server/bookmarks/metadata';
import { setFlash } from '#lib/server/flash';
import { firstValidationError, formString, formStrings, parseTagNames } from '#lib/server/form';

function requireUserId(event: RequestEvent): string {
	const userId = event.locals.user?.id;
	if (!userId) throw new Error('Unauthorized');
	return userId;
}

function writePayload(data: FormData) {
	return {
		url: formString(data, 'url'),
		title: formString(data, 'title'),
		description: formString(data, 'description'),
		notes: formString(data, 'notes'),
		categoryId: formString(data, 'categoryId'),
		newCategory: formString(data, 'newCategory'),
		tagIds: formStrings(data, 'tagIds'),
		newTags: formString(data, 'newTags')
	};
}

export async function previewBookmarkAction(event: RequestEvent) {
	const parsed = safeParse(bookmarkPreviewSchema, {
		url: formString(await event.request.formData(), 'url')
	});
	if (!parsed.success) {
		return fail(400, { message: firstValidationError(parsed.issues), intent: 'preview' as const });
	}

	try {
		const preview = await fetchPageMetadata(parsed.output.url);
		return { preview, intent: 'preview' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not fetch that page',
			intent: 'preview' as const
		});
	}
}

export async function createBookmarkAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const parsed = safeParse(bookmarkCreateSchema, writePayload(await event.request.formData()));
	if (!parsed.success) {
		return fail(400, { message: firstValidationError(parsed.issues), intent: 'create' as const });
	}

	try {
		await createBookmark(userId, {
			url: parsed.output.url,
			title: parsed.output.title,
			description: parsed.output.description,
			notes: parsed.output.notes,
			categoryId: parsed.output.categoryId || null,
			newCategory: parsed.output.newCategory,
			tagIds: parsed.output.tagIds,
			newTags: parseTagNames(parsed.output.newTags ?? '')
		});
		return { saved: true, intent: 'create' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not save bookmark',
			intent: 'create' as const
		});
	}
}

export async function updateBookmarkAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const data = await event.request.formData();
	const parsed = safeParse(bookmarkUpdateSchema, {
		...writePayload(data),
		id: formString(data, 'id')
	});
	if (!parsed.success) {
		return fail(400, { message: firstValidationError(parsed.issues), intent: 'update' as const });
	}

	try {
		await updateBookmark(userId, parsed.output.id, {
			url: parsed.output.url,
			title: parsed.output.title,
			description: parsed.output.description,
			notes: parsed.output.notes,
			categoryId: parsed.output.categoryId || null,
			newCategory: parsed.output.newCategory,
			tagIds: parsed.output.tagIds,
			newTags: parseTagNames(parsed.output.newTags ?? '')
		});
		return { saved: true, intent: 'update' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not update bookmark',
			intent: 'update' as const
		});
	}
}

export async function deleteBookmarkAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const parsed = safeParse(bookmarkDeleteSchema, {
		id: formString(await event.request.formData(), 'id')
	});
	if (!parsed.success) {
		return fail(400, { message: firstValidationError(parsed.issues), intent: 'delete' as const });
	}

	try {
		await deleteBookmark(userId, parsed.output.id);
		setFlash(event.cookies, { type: 'success', message: 'Bookmark deleted.' });
		return { deleted: true, intent: 'delete' as const };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Could not delete bookmark';
		setFlash(event.cookies, { type: 'error', message });
		return fail(400, {
			message,
			intent: 'delete' as const
		});
	}
}

export async function togglePinBookmarkAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const parsed = safeParse(bookmarkTogglePinSchema, {
		id: formString(await event.request.formData(), 'id')
	});
	if (!parsed.success) {
		return fail(400, { message: firstValidationError(parsed.issues), intent: 'togglePin' as const });
	}

	try {
		await toggleBookmarkPin(userId, parsed.output.id);
		return { toggled: true, intent: 'togglePin' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not update pin',
			intent: 'togglePin' as const
		});
	}
}

export const bookmarkFormActions = {
	preview: previewBookmarkAction,
	create: createBookmarkAction,
	update: updateBookmarkAction,
	delete: deleteBookmarkAction,
	togglePin: togglePinBookmarkAction
};

export const addBookmarkFormActions = {
	prefill: previewBookmarkAction,
	createBookmark: createBookmarkAction
};
