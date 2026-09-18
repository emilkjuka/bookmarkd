import type { Actions } from './$types';
import { accountFormActions } from '#lib/server/account/actions';
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
	...settingsFormActions
};
