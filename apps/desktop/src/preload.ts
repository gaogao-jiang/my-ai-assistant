import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi } from "./shared/desktop-api.ts";

const api: DesktopApi = {
	getAppInfo: () => ipcRenderer.invoke("desktop:get-app-info"),
};
contextBridge.exposeInMainWorld("desktop", api);
