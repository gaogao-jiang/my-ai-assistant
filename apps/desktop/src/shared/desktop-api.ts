export interface AppInfo {
	version: string;
	electron: string;
	connection: "not-connected";
}

/** The renderer can read application metadata, but cannot access Node or arbitrary IPC. */
export interface DesktopApi {
	getAppInfo: () => Promise<AppInfo>;
}
