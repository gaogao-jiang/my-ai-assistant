import { useEffect, useRef, useState } from "react";
import type { AppInfo } from "../shared/desktop-api.ts";

interface Message {
	id: string;
	text: string;
}

interface Conversation {
	id: string;
	title: string;
	draft: string;
	messages: Message[];
}

function newConversation(): Conversation {
	return { id: crypto.randomUUID(), title: "新会话", draft: "", messages: [] };
}

export function App() {
	const [conversations, setConversations] = useState<Conversation[]>(() => [newConversation()]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
	const [bridgeError, setBridgeError] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const messageEndRef = useRef<HTMLDivElement>(null);
	const current = conversations.find((conversation) => conversation.id === activeId) ?? conversations[0];

	useEffect(() => {
		if (!window.desktop) {
			setBridgeError("桌面接口不可用，请使用 npm start 启动 Electron 窗口。");
			return;
		}
		void window.desktop
			.getAppInfo()
			.then(setAppInfo)
			.catch(() => setBridgeError("应用信息读取失败，请重启桌面窗口。"));
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Session switches and new messages must resync DOM scroll and focus.
	useEffect(() => {
		messageEndRef.current?.scrollIntoView({ block: "end" });
		textareaRef.current?.focus();
	}, [current.id, current.messages.length]);

	function updateDraft(draft: string) {
		setConversations((items) => items.map((item) => (item.id === current.id ? { ...item, draft } : item)));
	}

	function saveMessage() {
		const text = current.draft.trim();
		if (!text) return;
		setConversations((items) =>
			items.map((item) =>
				item.id === current.id
					? {
							...item,
							title: item.messages.length === 0 ? text.replace(/\s+/g, " ").slice(0, 24) : item.title,
							draft: "",
							messages: [...item.messages, { id: crypto.randomUUID(), text }],
						}
					: item,
			),
		);
	}

	return (
		<div className="app-shell">
			<aside className="sidebar" aria-label="会话导航">
				<div className="brand">
					<span className="brand-mark" aria-hidden="true">
						π
					</span>
					<div>
						<strong>Pi 桌面助手</strong>
						<span className="brand-subtitle">你的个人工作空间</span>
					</div>
				</div>
				<button
					className="new-conversation"
					type="button"
					onClick={() => {
						const conversation = newConversation();
						setConversations((items) => [conversation, ...items]);
						setActiveId(conversation.id);
					}}
				>
					<span aria-hidden="true">＋</span>新建会话
				</button>
				<div className="list-heading">
					<span>会话</span>
					<span>{conversations.length}</span>
				</div>
				<nav className="conversation-list" aria-label="会话列表">
					{conversations.map((conversation) => (
						<button
							type="button"
							key={conversation.id}
							className={`conversation ${conversation.id === current.id ? "active" : ""}`}
							aria-current={conversation.id === current.id ? "page" : undefined}
							onClick={() => setActiveId(conversation.id)}
							title={conversation.title}
						>
							<span className="conversation-icon" aria-hidden="true">
								◇
							</span>
							<span className="conversation-copy">
								<span>{conversation.title}</span>
								<small>
									{conversation.messages.length ? `${conversation.messages.length} 条本地消息` : "还没有消息"}
								</small>
							</span>
						</button>
					))}
				</nav>
				<div className="sidebar-footer">
					<p>
						会话仅保留在当前窗口
						<br />
						关闭后不会保存
					</p>
					<button className="settings-button" type="button" onClick={() => setSettingsOpen(true)}>
						<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
							<path d="M4 7h16M4 17h16" />
							<circle cx="9" cy="7" r="3" fill="#f3f5f8" />
							<circle cx="15" cy="17" r="3" fill="#f3f5f8" />
						</svg>
						设置
					</button>
				</div>
			</aside>
			<main className="workspace">
				<header className="workspace-header">
					<div>
						<h1>{current.title}</h1>
						<span>桌面界面预览</span>
					</div>
					<span className="connection-badge">
						<i aria-hidden="true" />
						尚未连接
					</span>
				</header>
				<div className="model-notice">
					<span className="notice-dot" aria-hidden="true" />
					<div>
						<strong>尚未配置模型</strong>
						<span>当前仅供界面体验，不会发送请求或生成回答。</span>
					</div>
					<button type="button" onClick={() => setSettingsOpen(true)}>
						查看设置<span aria-hidden="true"> →</span>
					</button>
				</div>
				{bridgeError && (
					<p className="bridge-error" role="alert">
						{bridgeError}
					</p>
				)}
				<section className="message-list" aria-label="消息列表">
					{current.messages.length === 0 ? (
						<div className="empty-state">
							<span className="empty-mark" aria-hidden="true">
								π
							</span>
							<h2>从一个想法开始</h2>
							<p>
								在这里整理问题，留下一段思考。
								<br />
								连接模型后，就能和你的 AI 助手对话。
							</p>
							<div className="empty-note">
								<span aria-hidden="true">◇</span>尚未连接模型 · 消息仅保留在当前窗口
							</div>
						</div>
					) : (
						<div className="message-content">
							{current.messages.map((message) => (
								<article className="message" key={message.id}>
									<div className="message-meta">
										<strong>你</strong>
										<span>仅本地 · 未发送</span>
									</div>
									<p>{message.text}</p>
								</article>
							))}
							<output className="unsent-notice">
								尚未连接模型，以上消息未发送。配置与真实对话将在后续步骤接入。
							</output>
							<div ref={messageEndRef} />
						</div>
					)}
				</section>
				<div className="composer-area">
					<form
						className="composer"
						onSubmit={(event) => {
							event.preventDefault();
							saveMessage();
						}}
					>
						<label className="sr-only" htmlFor="message-input">
							输入消息
						</label>
						<textarea
							ref={textareaRef}
							id="message-input"
							placeholder="写下你的问题或想法…"
							value={current.draft}
							onChange={(event) => updateDraft(event.target.value)}
							rows={3}
						/>
						<div className="composer-toolbar">
							<span className="composer-hint">Enter 换行 · 发送仅保留本地</span>
							<div className="composer-actions">
								<button className="stop-button" type="button" disabled title="尚未连接模型，没有正在生成的回答">
									<span aria-hidden="true">■</span>停止
								</button>
								<button className="send-button" type="submit" disabled={!current.draft.trim()}>
									发送<span aria-hidden="true"> ↑</span>
								</button>
							</div>
						</div>
					</form>
					<p className="composer-footnote">尚未连接 AI 模型 · 不会产生模型调用费用</p>
				</div>
			</main>
			{settingsOpen && <SettingsDialog appInfo={appInfo} onDismiss={() => setSettingsOpen(false)} />}
		</div>
	);
}

function SettingsDialog({ appInfo, onDismiss }: { appInfo: AppInfo | null; onDismiss: () => void }) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		ref.current?.showModal();
	}, []);
	return (
		<dialog ref={ref} className="settings-dialog" aria-labelledby="settings-title" onClose={onDismiss}>
			<div className="dialog-header">
				<h2 id="settings-title">设置</h2>
				<form method="dialog">
					<button type="submit" aria-label="关闭设置">
						×
					</button>
				</form>
			</div>
			<div className="settings-status">
				<span className="connection-badge">
					<i aria-hidden="true" />
					尚未连接
				</span>
				<h3>模型尚未配置</h3>
				<p>这一步只提供桌面窗口与交互界面。模型选择、API 密钥配置和真实对话尚未接入。</p>
			</div>
			<dl className="settings-details">
				<div>
					<dt>模型</dt>
					<dd>尚未配置</dd>
				</div>
				<div>
					<dt>会话保存</dt>
					<dd>仅当前窗口内存</dd>
				</div>
				<div>
					<dt>应用版本</dt>
					<dd>{appInfo ? appInfo.version : "读取中"}</dd>
				</div>
				<div>
					<dt>Electron</dt>
					<dd>{appInfo ? appInfo.electron : "读取中"}</dd>
				</div>
			</dl>
			<p className="settings-footer">本阶段无需填写 API 密钥。</p>
		</dialog>
	);
}
