import { defineConfig } from "vite";
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [ mkcert() ],
	server: {
	  headers: {
	    "Cross-Origin-Embedder-Policy": "require-corp",
		"Cross-Origin-Opener-Policy": "same-origin"
	  }
	},
});
