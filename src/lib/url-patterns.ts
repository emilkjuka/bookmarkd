export function decodeUrlPatterns(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
	} catch {
		return parseUrlPatterns(raw);
	}
}

export function parseUrlPatterns(input: string | null | undefined): string[] {
	if (!input) return [];
	return [
		...new Set(
			input
				.split(/[\n,]+/)
				.map((line) => line.trim())
				.filter(Boolean)
		)
	];
}

export function serializeUrlPatterns(patterns: string[] | null | undefined): string | null {
	if (!patterns?.length) return null;
	const cleaned = patterns.map((p) => p.trim()).filter(Boolean);
	return cleaned.length ? JSON.stringify(cleaned) : null;
}

function patternToRegExp(pattern: string): RegExp {
	const escaped = pattern
		.trim()
		.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
		.replace(/\*\*/g, '___DOUBLESTAR___')
		.replace(/\*/g, '[^/]*')
		.replace(/___DOUBLESTAR___/g, '.*');
	return new RegExp(escaped, 'i');
}

export function urlMatchesPattern(url: string, pattern: string): boolean {
	const trimmed = pattern.trim();
	if (!trimmed) return false;

	try {
		const parsed = new URL(url);
		const targets = [
			parsed.hostname,
			parsed.host,
			`${parsed.hostname}${parsed.pathname}`,
			parsed.href
		];
		const re = patternToRegExp(trimmed);
		return targets.some((target) => re.test(target));
	} catch {
		return patternToRegExp(trimmed).test(url);
	}
}

export function urlMatchesAnyPattern(url: string, patterns: string[]): boolean {
	return patterns.some((pattern) => urlMatchesPattern(url, pattern));
}
