import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { safeRedirectPath } from '#lib/auth/redirect';

export const load: PageServerLoad = ({ locals, url }) => {
	const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));
	if (locals.user) redirect(303, redirectTo);
	return { redirectTo };
};
