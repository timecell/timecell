import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const isVercel = process.env.VERCEL === "1";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	base: isVercel ? "/app/" : "/",
	define: {
		// Expose standalone flag to client code
		"import.meta.env.VITE_STANDALONE": JSON.stringify(isVercel ? "true" : "false"),
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 3738,
		host: "0.0.0.0",
		proxy: {
			"/api": "http://localhost:3737",
		},
	},
});
