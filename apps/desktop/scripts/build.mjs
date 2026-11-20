import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(new URL("../dist/renderer/", import.meta.url), { recursive: true });

await Promise.all([
	build({
		absWorkingDir: root,
		entryPoints: ["src/main.ts"],
		outfile: "dist/main.mjs",
		bundle: true,
		platform: "node",
		format: "esm",
		target: "node24",
		external: ["electron"],
	}),
	build({
		absWorkingDir: root,
		entryPoints: ["src/preload.ts"],
		outfile: "dist/preload.cjs",
		bundle: true,
		platform: "node",
		format: "cjs",
		target: "node24",
		external: ["electron"],
	}),
	build({
		absWorkingDir: root,
		entryPoints: ["src/renderer/main.tsx"],
		outfile: "dist/renderer/app.js",
		bundle: true,
		platform: "browser",
		format: "esm",
		target: "es2022",
		jsx: "automatic",
		define: { "process.env.NODE_ENV": '"production"' },
		minify: true,
		sourcemap: true,
		logLevel: "info",
	}),
	copyFile(
		new URL("../src/renderer/index.html", import.meta.url),
		new URL("../dist/renderer/index.html", import.meta.url),
	),
]);
