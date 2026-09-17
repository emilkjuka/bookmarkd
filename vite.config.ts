import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { iconify } from './plugins/iconify.ts';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	// loadEnv reads .env files only; Docker build passes ORIGIN via process.env (.env is dockerignored)
	const origin = env.ORIGIN || process.env.ORIGIN;

	return {
		plugins: [
			tailwindcss(),
			sveltekit({
				alias: {
					$iconify: 'node_modules/.iconify/generated.css',
					$iconifyTypes: 'node_modules/.iconify/generated.d.ts'
				},
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
					experimental: { async: true }
				},
				paths: {
					origin: origin || undefined
				},
				adapter: adapter({ out: 'build' }),
				experimental: { remoteFunctions: true }
			}),
			iconify({ iconSets: ['lucide'] })
		]
	};
});
