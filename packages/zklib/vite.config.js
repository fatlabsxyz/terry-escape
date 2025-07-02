import dts from "vite-plugin-dts";
import { defineConfig } from "vite";
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/zklib.js'),
			name: 'zklib',
			fileName: 'zklib',
		},
	},
	plugins: [ mkcert(), dts({ insertTypesEntry: true }) ],
	server: {
		headers: {
			"Cross-Origin-Embedder-Policy": "require-corp",
			"Cross-Origin-Opener-Policy": "same-origin"
		}
	},
});
