import * as v from 'valibot';
import type { InferOutput } from 'valibot';
import { normalizeUrlInput } from '#lib/url';

export const urlSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'URL is required'),
	v.transform(normalizeUrlInput),
	v.url('Enter a valid URL'),
	v.check((value) => {
		try {
			const protocol = new URL(value).protocol;
			return protocol === 'http:' || protocol === 'https:';
		} catch {
			return false;
		}
	}, 'URL must start with http:// or https://')
);

const optionalTrimmedString = (max: number) =>
	v.optional(v.pipe(v.string(), v.trim(), v.maxLength(max)));

const optionalUuidOrEmpty = () =>
	v.optional(v.union([v.pipe(v.string(), v.uuid()), v.literal('')]));

const bookmarkFields = {
	url: urlSchema,
	title: optionalTrimmedString(500),
	description: optionalTrimmedString(2000),
	notes: optionalTrimmedString(5000),
	categoryId: optionalUuidOrEmpty(),
	newCategory: optionalTrimmedString(50),
	tagIds: v.optional(v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.maxLength(20))),
	newTags: optionalTrimmedString(500)
};

export const bookmarkPreviewSchema = v.object({
	url: urlSchema
});

export const bookmarkCreateSchema = v.object(bookmarkFields);

export const bookmarkUpdateSchema = v.object({
	...bookmarkFields,
	id: v.pipe(v.string(), v.uuid()),
	title: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Title is required'),
		v.maxLength(500)
	)
});

export const bookmarkDeleteSchema = v.object({
	id: v.pipe(v.string(), v.uuid())
});

export const bookmarkTogglePinSchema = v.object({
	id: v.pipe(v.string(), v.uuid())
});

export const categorySchema = v.object({
	name: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Name is required'),
		v.maxLength(50)
	),
	color: v.optional(
		v.union([
			v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/, 'Pick a valid color')),
			v.literal('')
		])
	),
	urlPatterns: v.optional(v.union([v.pipe(v.string(), v.trim(), v.maxLength(1000)), v.literal('')]))
});

export const categoryUpdateSchema = v.object({
	...categorySchema.entries,
	id: v.pipe(v.string(), v.uuid())
});

export const categoryDeleteSchema = v.object({
	id: v.pipe(v.string(), v.uuid())
});

export const tagSchema = v.object({
	name: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Name is required'),
		v.maxLength(50)
	)
});

export const tagUpdateSchema = v.object({
	...tagSchema.entries,
	id: v.pipe(v.string(), v.uuid())
});

export const tagDeleteSchema = v.object({
	id: v.pipe(v.string(), v.uuid())
});

export type BookmarkCreateInput = InferOutput<typeof bookmarkCreateSchema>;
export type BookmarkUpdateInput = InferOutput<typeof bookmarkUpdateSchema>;
