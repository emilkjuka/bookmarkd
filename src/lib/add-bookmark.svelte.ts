import { getContext, setContext } from 'svelte';

const KEY = Symbol('add-bookmark');

export type AddBookmarkApi = {
	open: () => void;
};

export function setAddBookmarkContext(api: AddBookmarkApi) {
	setContext(KEY, api);
}

export function getAddBookmarkContext(): AddBookmarkApi | undefined {
	return getContext<AddBookmarkApi | undefined>(KEY);
}
