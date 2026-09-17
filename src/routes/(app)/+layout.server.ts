import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { consumeFlash } from '#lib/server/flash';
import { listCategories } from '#lib/server/categories/service';
import { listTags } from '#lib/server/tags/service';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	if (!locals.user) {
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	const [categories, tags, flash] = await Promise.all([
		listCategories(locals.user.id),
		listTags(locals.user.id),
		Promise.resolve(consumeFlash(cookies))
	]);

	return {
		user: locals.user,
		categories,
		tags,
		flash
	};
};
