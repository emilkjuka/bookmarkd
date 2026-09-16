import { z } from 'zod';

export const urlSchema = z
	.string()
	.trim()
	.min(1, 'URL is required')
	.url('Enter a valid URL')
	.refine((value) => {
		try {
			const protocol = new URL(value).protocol;
			return protocol === 'http:' || protocol === 'https:';
		} catch {
			return false;
		}
	}, 'URL must start with http:// or https://');

export const bookmarkPreviewSchema = z.object({
	url: urlSchema
});

export const bookmarkCreateSchema = z.object({
	url: urlSchema,
	title: z.string().trim().max(500).optional(),
	description: z.string().trim().max(2000).optional(),
	notes: z.string().trim().max(5000).optional(),
	categoryId: z.string().uuid().optional().or(z.literal('')),
	newCategory: z.string().trim().max(50).optional(),
	tagIds: z.array(z.string().uuid()).max(20).optional(),
	newTags: z.string().trim().max(500).optional()
});

export const bookmarkUpdateSchema = bookmarkCreateSchema.extend({
	id: z.string().uuid(),
	title: z.string().trim().min(1, 'Title is required').max(500)
});

export const bookmarkDeleteSchema = z.object({
	id: z.string().uuid()
});

export const bookmarkTogglePinSchema = z.object({
	id: z.string().uuid()
});

export const categorySchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(50),
	color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/, 'Pick a valid color')
		.optional()
		.or(z.literal('')),
	urlPatterns: z.string().trim().max(1000).optional().or(z.literal(''))
});

export const categoryUpdateSchema = categorySchema.extend({
	id: z.string().uuid()
});

export const categoryDeleteSchema = z.object({
	id: z.string().uuid()
});

export const tagSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(50)
});

export const tagUpdateSchema = tagSchema.extend({
	id: z.string().uuid()
});

export const tagDeleteSchema = z.object({
	id: z.string().uuid()
});

export type BookmarkCreateInput = z.infer<typeof bookmarkCreateSchema>;
export type BookmarkUpdateInput = z.infer<typeof bookmarkUpdateSchema>;
