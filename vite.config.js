import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		port: 5173,
	},
	preview: {
		port: 4173,
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
	},
});