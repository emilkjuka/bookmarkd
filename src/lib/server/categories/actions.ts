import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import {
	categoryDeleteSchema,
	categorySchema,
	categoryUpdateSchema,
	tagDeleteSchema,
	tagSchema,
	tagUpdateSchema
} from '#lib/schemas/bookmark';
import { createCategory, deleteCategory, updateCategory } from '#lib/server/categories/service';
import { createTag, deleteTag, updateTag } from '#lib/server/tags/service';
import { firstZodError, formString } from '#lib/server/form';

function requireUserId(event: RequestEvent): string {
	const userId = event.locals.user?.id;
	if (!userId) throw new Error('Unauthorized');
	return userId;
}

export async function createCategoryAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const data = await event.request.formData();
	const parsed = categorySchema.safeParse({
		name: formString(data, 'name'),
		color: formString(data, 'color'),
		urlPatterns: formString(data, 'urlPatterns')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'category' as const });
	}

	try {
		await createCategory(userId, parsed.data);
		return { saved: true, intent: 'category' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not save category',
			intent: 'category' as const
		});
	}
}

export async function updateCategoryAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const data = await event.request.formData();
	const parsed = categoryUpdateSchema.safeParse({
		id: formString(data, 'id'),
		name: formString(data, 'name'),
		color: formString(data, 'color'),
		urlPatterns: formString(data, 'urlPatterns')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'category' as const });
	}

	try {
		await updateCategory(userId, parsed.data.id, parsed.data);
		return { saved: true, intent: 'category' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not update category',
			intent: 'category' as const
		});
	}
}

export async function deleteCategoryAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const parsed = categoryDeleteSchema.safeParse({
		id: formString(await event.request.formData(), 'id')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'category' as const });
	}

	try {
		await deleteCategory(userId, parsed.data.id);
		return { deleted: true, intent: 'category' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not delete category',
			intent: 'category' as const
		});
	}
}

export async function createTagAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const parsed = tagSchema.safeParse({
		name: formString(await event.request.formData(), 'name')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'tag' as const });
	}

	try {
		await createTag(userId, parsed.data.name);
		return { saved: true, intent: 'tag' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not save tag',
			intent: 'tag' as const
		});
	}
}

export async function updateTagAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const data = await event.request.formData();
	const parsed = tagUpdateSchema.safeParse({
		id: formString(data, 'id'),
		name: formString(data, 'name')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'tag' as const });
	}

	try {
		await updateTag(userId, parsed.data.id, parsed.data.name);
		return { saved: true, intent: 'tag' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not update tag',
			intent: 'tag' as const
		});
	}
}

export async function deleteTagAction(event: RequestEvent) {
	const userId = requireUserId(event);
	const parsed = tagDeleteSchema.safeParse({
		id: formString(await event.request.formData(), 'id')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'tag' as const });
	}

	try {
		await deleteTag(userId, parsed.data.id);
		return { deleted: true, intent: 'tag' as const };
	} catch (error) {
		return fail(400, {
			message: error instanceof Error ? error.message : 'Could not delete tag',
			intent: 'tag' as const
		});
	}
}

export const sidebarCategoryActions = {
	createCategory: createCategoryAction
};

export const sidebarTagActions = {
	createTag: createTagAction
};

export const settingsFormActions = {
	updateCategory: updateCategoryAction,
	deleteCategory: deleteCategoryAction,
	createTag: createTagAction,
	updateTag: updateTagAction,
	deleteTag: deleteTagAction
};
