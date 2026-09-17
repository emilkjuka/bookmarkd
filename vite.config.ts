import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { iconify } from './plugins/iconify.ts';

export default defineConfig({
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

			adapter: adapter({ out: 'build' }),
			experimental: { remoteFunctions: true }
		}),
		iconify({ iconSets: ['lucide'] })
	]
});
