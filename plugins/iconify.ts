import type { Plugin } from 'vite';
import { promises as fs } from 'fs';
import path from 'path';
import { getIconsCSS } from '@iconify/utils/lib/css/icons';
import type { IconifyJSON } from '@iconify/types';

export const outputPath = path.join(import.meta.dirname, '../node_modules/.iconify/generated.css');
export const typesOutputPath = path.join(
	import.meta.dirname,
	'../node_modules/.iconify/generated.d.ts'
);

export type IconifyGeneratorOptions = {
	iconSets?: string[];
};

// Scans .svelte files for any quoted `<iconSet>--<name>` string literal
// (e.g. `name="lucide--home"`, or inside a dynamic expression like
// `name={cond ? 'lucide--x' : 'lucide--plus'}`), then emits a single CSS
// file with mask-based icon classes plus a matching `IconName` union type.
// In dev, all icons in the configured sets are emitted for fast iteration;
// in prod, only the icons actually referenced in source are kept.
export const iconify = (opts: IconifyGeneratorOptions = {}): Plugin => {
	const { iconSets: configuredIconSets = ['lucide'] } = opts;

	const iconNames = new Set<string>();
	const isDev = process.env.NODE_ENV === 'development';
	const iconLiteralRegex = new RegExp(
		`['"](${configuredIconSets.map((s) => s.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')).join('|')})--[a-z0-9-]+['"]`,
		'gu'
	);

	const scanDirectory = async (dir: string): Promise<void> => {
		const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			try {
				if (entry.isDirectory()) {
					await scanDirectory(fullPath);
				} else if (entry.name.endsWith('.svelte') || entry.name.endsWith('.ts')) {
					const content = await fs.readFile(fullPath, 'utf-8');
					extractIconNames(content);
				}
			} catch (error) {
				console.warn(`Error scanning entry for icons: ${fullPath}`, error);
			}
		}
	};

	const extractIconNames = (content: string): void => {
		for (const match of content.matchAll(iconLiteralRegex)) {
			iconNames.add(match[0].slice(1, -1));
		}
	};

	const generateIconCSS = async (): Promise<void> => {
		try {
			const allSets = Array.from(new Set(configuredIconSets));
			const setsCss = (
				await Promise.all(
					allSets.map(async (set) => {
						const data = (await import(`@iconify-json/${set}/icons.json`, {
							with: { type: 'json' }
						})) as { default: IconifyJSON };
						const json = data.default;
						const prefix = `${set}--`;
						const requested = (
							isDev
								? Object.keys(json.icons)
								: Array.from(iconNames)
										.filter((icon) => icon.startsWith(prefix))
										.map((icon) => icon.replace(prefix, ''))
						).filter((icon) => Object.keys(json.icons).includes(icon));
						if (requested.length === 0) return '';
						return getIconsCSS(json, requested, { mode: 'mask' })
							.replace(new RegExp(`\\.icon--${set}\\s*\\{[^}]*\\}`, 'gu'), '')
							.replace(new RegExp(`\\.icon--${set}.icon--${set}--`, 'gu'), `.icon--${set}--`);
					})
				)
			).join('');

			const availableBySet = await Promise.all(
				allSets.map(async (set) => {
					const data = (await import(`@iconify-json/${set}/icons.json`, {
						with: { type: 'json' }
					})) as { default: IconifyJSON };
					return Object.keys(data.default.icons).map((n) => `\`${set}--${n}\``);
				})
			);
			const union = availableBySet.flat();
			const dts = union.length
				? `export type IconName = ${union.join(' | ')};\n`
				: `export type IconName = ${allSets.map((s) => `\`${s}--\${string}\``).join(' | ')};\n`;

			const typesOutDir = path.dirname(path.resolve(typesOutputPath));
			await fs.mkdir(typesOutDir, { recursive: true });
			await fs.writeFile(path.resolve(typesOutputPath), dts);

			const outputDir = path.dirname(path.resolve(outputPath));
			await fs.mkdir(outputDir, { recursive: true });
			await fs.writeFile(path.resolve(outputPath), setsCss);
		} catch (error) {
			console.error('Error generating icon CSS:', error);
		}
	};

	return {
		name: 'iconify-generator',
		async buildStart() {
			iconNames.clear();
			await scanDirectory('src');
			await generateIconCSS();
		}
	};
};
