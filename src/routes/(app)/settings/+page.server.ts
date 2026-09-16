import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { accountFormActions } from '#lib/server/account/actions';
import { auth } from '#lib/server/auth';
import { addBookmarkFormActions } from '#lib/server/bookmarks/actions';
import {
	settingsFormActions,
	sidebarCategoryActions,
	sidebarTagActions
} from '#lib/server/categories/actions';

export const actions: Actions = {
	...accountFormActions,
	...sidebarCategoryActions,
	...sidebarTagActions,
	...addBookmarkFormActions,
	...settingsFormActions,
	signOut: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		redirect(303, '/login');
	}
};
