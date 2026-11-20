import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, dialog, ipcMain, Menu, session } from "electron";
import type { AppInfo } from "./shared/desktop-api.ts";

app.setName("Pi 桌面助手");
const rendererPath = join(import.meta.dirname, "renderer", "index.html");
const rendererUrl = pathToFileURL(rendererPath).href;

async function createWindow(): Promise<void> {
	const window = new BrowserWindow({
		title: "Pi 桌面助手",
		width: 1180,
		height: 800,
		minWidth: 640,
		minHeight: 540,
		backgroundColor: "#ffffff",
		show: false,
		autoHideMenuBar: true,
		webPreferences: {
			preload: join(import.meta.dirname, "preload.cjs"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			webSecurity: true,
		},
	});
	window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
	window.webContents.on("will-navigate", (event) => event.preventDefault());
	window.webContents.on("will-attach-webview", (event) => event.preventDefault());
	window.once("ready-to-show", () => window.show());
	try {
		await window.loadFile(rendererPath);
	} catch (error) {
		console.error(error);
		dialog.showErrorBox("窗口加载失败", "无法加载桌面界面，请在 apps/desktop 中重新运行 npm start。");
		app.quit();
	}
}

void app
	.whenReady()
	.then(async () => {
		Menu.setApplicationMenu(null);
		session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
		session.defaultSession.setPermissionCheckHandler(() => false);
		ipcMain.handle("desktop:get-app-info", (event): AppInfo => {
			// IPC is a trust boundary: only the window's own top-level document may call this method.
			if (event.senderFrame !== event.sender.mainFrame || event.senderFrame?.url !== rendererUrl) {
				throw new Error("不允许此页面访问应用信息");
			}
			return { version: app.getVersion(), electron: process.versions.electron, connection: "not-connected" };
		});
		await createWindow();
		app.on("activate", () => {
			if (BrowserWindow.getAllWindows().length === 0) void createWindow();
		});
	})
	.catch((error: unknown) => {
		console.error("桌面应用启动失败：", error);
		app.quit();
	});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
