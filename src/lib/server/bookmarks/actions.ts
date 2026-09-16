import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
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
import { firstZodError, formString, formStrings, parseTagNames } from '#lib/server/form';

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
	const parsed = bookmarkPreviewSchema.safeParse({
		url: formString(await event.request.formData(), 'url')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'preview' as const });
	}

	try {
		const preview = await fetchPageMetadata(parsed.data.url);
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
	const parsed = bookmarkCreateSchema.safeParse(writePayload(await event.request.formData()));
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'create' as const });
	}

	try {
		await createBookmark(userId, {
			url: parsed.data.url,
			title: parsed.data.title,
			description: parsed.data.description,
			notes: parsed.data.notes,
			categoryId: parsed.data.categoryId || null,
			newCategory: parsed.data.newCategory,
			tagIds: parsed.data.tagIds,
			newTags: parseTagNames(parsed.data.newTags ?? '')
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
	const parsed = bookmarkUpdateSchema.safeParse({
		...writePayload(data),
		id: formString(data, 'id')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'update' as const });
	}

	try {
		await updateBookmark(userId, parsed.data.id, {
			url: parsed.data.url,
			title: parsed.data.title,
			description: parsed.data.description,
			notes: parsed.data.notes,
			categoryId: parsed.data.categoryId || null,
			newCategory: parsed.data.newCategory,
			tagIds: parsed.data.tagIds,
			newTags: parseTagNames(parsed.data.newTags ?? '')
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
	const parsed = bookmarkDeleteSchema.safeParse({
		id: formString(await event.request.formData(), 'id')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'delete' as const });
	}

	try {
		await deleteBookmark(userId, parsed.data.id);
		return { deleted: true, intent: 'delete' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not delete bookmark',
			intent: 'delete' as const
		});
	}
}

export async function togglePinBookmarkAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const parsed = bookmarkTogglePinSchema.safeParse({
		id: formString(await event.request.formData(), 'id')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'togglePin' as const });
	}

	try {
		await toggleBookmarkPin(userId, parsed.data.id);
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
