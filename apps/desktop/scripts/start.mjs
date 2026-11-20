import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import electron from "electron";

// Codex and other Electron hosts may set this; the child must run as a desktop app.
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(electron, [fileURLToPath(new URL("../", import.meta.url))], {
	stdio: "inherit",
	env,
	windowsHide: false,
});
child.on("error", (error) => {
	console.error("无法启动桌面窗口：", error.message);
	process.exitCode = 1;
});
child.on("exit", (code) => {
	process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => child.kill());
}
