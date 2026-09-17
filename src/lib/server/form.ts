import type { BaseIssue } from 'valibot';

export function formString(data: FormData, key: string): string {
	const value = data.get(key);
	return typeof value === 'string' ? value : '';
}

export function formStrings(data: FormData, key: string): string[] {
	return data
		.getAll(key)
		.filter((value): value is string => typeof value === 'string' && value.length > 0);
}

export function firstValidationError(issues: BaseIssue<unknown>[]): string {
	return issues[0]?.message ?? 'Invalid input';
}

export function parseTagNames(value: string): string[] {
	return value
		.split(',')
		.map((name) => name.trim())
		.filter((name) => name.length > 0)
		.slice(0, 20);
}
