export type Category = {
	id: string;
	name: string;
	slug: string;
	color: string | null;
	urlPatterns: string[];
};

export type Tag = {
	id: string;
	name: string;
	slug: string;
};

export type Bookmark = {
	id: string;
	url: string;
	title: string;
	description: string | null;
	faviconUrl: string | null;
	imageUrl: string | null;
	notes: string | null;
	categoryId: string | null;
	pinned: boolean;
	pinnedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	category: Category | null;
	tags: Tag[];
};

export type FlashMessage = {
	type: 'success' | 'error' | 'info';
	message: string;
};

export type PageMetadata = {
	url: string;
	title: string;
	description: string | null;
	faviconUrl: string | null;
	imageUrl: string | null;
};
