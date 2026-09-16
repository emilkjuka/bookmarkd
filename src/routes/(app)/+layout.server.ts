import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { listCategories } from '#lib/server/categories/service';
import { listTags } from '#lib/server/tags/service';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');

	const [categories, tags] = await Promise.all([
		listCategories(locals.user.id),
		listTags(locals.user.id)
	]);

	return {
		user: locals.user,
		categories,
		tags
	};
};
