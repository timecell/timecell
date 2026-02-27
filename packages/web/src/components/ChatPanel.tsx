import { useState, useRef, useEffect, useCallback } from "react";
import {
	MessageSquare,
	Settings,
	Send,
	Bot,
	User,
	ChevronDown,
	ChevronRight,
	Sparkles,
	Plus,
	AlertCircle,
	X,
} from "lucide-react";
import { useChat } from "../hooks/useChat";
import { ApiKeySetup } from "./ApiKeySetup";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatPanelProps {
	portfolio: {
		totalValueUsd: number;
		btcPercentage: number;
		btcPriceUsd: number;
		monthlyBurnUsd: number;
		liquidReserveUsd: number;
	};
	temperatureScore?: number;
	currencySymbol?: string;
}

interface ToolCall {
	name: string;
	result?: string;
	status?: "success" | "error" | "warning";
}

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	toolCalls?: ToolCall[];
	isStreaming?: boolean;
	timestamp: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(ts: number): string {
	const diff = Math.floor((Date.now() - ts) / 1000);
	if (diff < 10) return "just now";
	if (diff < 60) return `${diff}s ago`;
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	return `${Math.floor(diff / 86400)}d ago`;
}

/** Simple markdown-to-JSX renderer. Handles bold, italic, inline code, code blocks, and bullet lists. */
function renderMarkdown(text: string): React.ReactNode[] {
	const lines = text.split("\n");
	const nodes: React.ReactNode[] = [];
	let codeBlock = false;
	let codeLines: string[] = [];
	let codeKey = 0;

	function inlineFormat(line: string, key: string | number): React.ReactNode {
		// Process inline formatting using split approach
		const parts: React.ReactNode[] = [];
		let remaining = line;
		let partIdx = 0;

		while (remaining.length > 0) {
			// Bold **text**
			const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
			// Inline code `text`
			const codeMatch = remaining.match(/`([^`]+)`/);
			// Italic *text* (single asterisk, not double)
			const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

			// Find the earliest match
			const matches = [
				boldMatch ? { type: "bold", match: boldMatch } : null,
				codeMatch ? { type: "code", match: codeMatch } : null,
				italicMatch ? { type: "italic", match: italicMatch } : null,
			]
				.filter(Boolean)
				.sort((a, b) => (a!.match.index ?? 0) - (b!.match.index ?? 0));

			if (matches.length === 0) {
				parts.push(remaining);
				break;
			}

			const first = matches[0]!;
			const idx = first.match.index ?? 0;

			if (idx > 0) {
				parts.push(remaining.slice(0, idx));
			}

			const pk = `${key}-${partIdx++}`;
			if (first.type === "bold") {
				parts.push(
					<strong key={pk} className="font-semibold text-white">
						{first.match[1]}
					</strong>,
				);
			} else if (first.type === "code") {
				parts.push(
					<code
						key={pk}
						className="px-1.5 py-0.5 rounded bg-slate-700 text-orange-300 text-xs font-mono"
					>
						{first.match[1]}
					</code>,
				);
			} else if (first.type === "italic") {
				parts.push(
					<em key={pk} className="italic text-slate-300">
						{first.match[1]}
					</em>,
				);
			}

			remaining = remaining.slice(idx + first.match[0].length);
		}

		return <span key={key}>{parts}</span>;
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Code block toggle
		if (line.trimStart().startsWith("```")) {
			if (codeBlock) {
				nodes.push(
					<pre
						key={`code-${codeKey++}`}
						className="rounded-lg bg-slate-950 border border-slate-700 p-3 text-xs font-mono text-slate-300 overflow-x-auto my-2"
					>
						{codeLines.join("\n")}
					</pre>,
				);
				codeLines = [];
				codeBlock = false;
			} else {
				codeBlock = true;
			}
			continue;
		}

		if (codeBlock) {
			codeLines.push(line);
			continue;
		}

		// Empty line
		if (line.trim() === "") {
			nodes.push(<div key={`br-${i}`} className="h-2" />);
			continue;
		}

		// Bullet points
		if (/^\s*[-*]\s/.test(line)) {
			const content = line.replace(/^\s*[-*]\s/, "");
			nodes.push(
				<div key={`li-${i}`} className="flex gap-2 ml-1">
					<span className="text-slate-500 flex-shrink-0 mt-0.5">&#x2022;</span>
					<span className="text-sm leading-relaxed">
						{inlineFormat(content, `li-c-${i}`)}
					</span>
				</div>,
			);
			continue;
		}

		// Regular paragraph
		nodes.push(
			<p key={`p-${i}`} className="text-sm leading-relaxed">
				{inlineFormat(line, `p-c-${i}`)}
			</p>,
		);
	}

	// Unclosed code block
	if (codeBlock && codeLines.length > 0) {
		nodes.push(
			<pre
				key={`code-${codeKey}`}
				className="rounded-lg bg-slate-950 border border-slate-700 p-3 text-xs font-mono text-slate-300 overflow-x-auto my-2"
			>
				{codeLines.join("\n")}
			</pre>,
		);
	}

	return nodes;
}

function toolCallLabel(name: string): string {
	const labels: Record<string, string> = {
		crash_survival: "Ran crash survival analysis",
		ruin_test: "Ran ruin test",
		temperature: "Checked market temperature",
		action_plan: "Generated action plan",
		position_sizing: "Calculated position sizing",
		conviction_check: "Checked conviction level",
	};
	return labels[name] ?? `Ran ${name.replace(/_/g, " ")}`;
}

function toolStatusColor(status?: string): string {
	switch (status) {
		case "success":
			return "text-emerald-400";
		case "error":
			return "text-red-400";
		case "warning":
			return "text-amber-400";
		default:
			return "text-slate-400";
	}
}

function toolStatusBorder(status?: string): string {
	switch (status) {
		case "success":
			return "border-emerald-500/30";
		case "error":
			return "border-red-500/30";
		case "warning":
			return "border-amber-500/30";
		default:
			return "border-slate-700";
	}
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToolCallCard({ tool }: { tool: ToolCall }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div
			className={`rounded-lg border ${toolStatusBorder(tool.status)} bg-slate-900/60 text-xs mb-2`}
		>
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-800/50 transition-colors rounded-lg"
			>
				<span className="text-slate-500">&#x1f527;</span>
				<span className="text-slate-300 flex-1">{toolCallLabel(tool.name)}</span>
				{expanded ? (
					<ChevronDown className="w-3 h-3 text-slate-500" />
				) : (
					<ChevronRight className="w-3 h-3 text-slate-500" />
				)}
			</button>
			{expanded && tool.result && (
				<div
					className={`px-3 pb-2 text-xs ${toolStatusColor(tool.status)} leading-relaxed border-t border-slate-800`}
				>
					<div className="pt-2">{tool.result}</div>
				</div>
			)}
		</div>
	);
}

function StreamingIndicator() {
	return (
		<div className="flex items-center gap-1.5 px-4 py-3">
			<Bot className="w-4 h-4 text-slate-500 flex-shrink-0" />
			<div className="flex gap-1">
				<span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
				<span
					className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"
					style={{ animationDelay: "0.2s" }}
				/>
				<span
					className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"
					style={{ animationDelay: "0.4s" }}
				/>
			</div>
		</div>
	);
}

function MessageBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";
	const [, setTick] = useState(0);

	// Update relative time every 30s
	useEffect(() => {
		const interval = setInterval(() => setTick((t) => t + 1), 30_000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
			<div
				className={`max-w-[85%] ${isUser ? "order-1" : "order-1"}`}
			>
				{/* Tool calls (assistant only, shown before content) */}
				{!isUser && message.toolCalls && message.toolCalls.length > 0 && (
					<div className="mb-1">
						{message.toolCalls.map((tool, idx) => (
							<ToolCallCard key={`${message.id}-tool-${idx}`} tool={tool} />
						))}
					</div>
				)}

				{/* Bubble */}
				{message.content && (
					<div
						className={`rounded-2xl px-4 py-3 ${
							isUser
								? "bg-orange-500/20 border border-orange-500/20 text-orange-100"
								: "bg-slate-800 border border-slate-700 text-slate-200"
						}`}
					>
						{/* Icon + content */}
						<div className="flex gap-2">
							{!isUser && (
								<Bot className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
							)}
							<div className="min-w-0 flex-1">
								{isUser ? (
									<p className="text-sm leading-relaxed whitespace-pre-wrap">
										{message.content}
									</p>
								) : (
									<div className="space-y-1">
										{renderMarkdown(message.content)}
									</div>
								)}
							</div>
							{isUser && (
								<User className="w-4 h-4 text-orange-400/60 flex-shrink-0 mt-0.5" />
							)}
						</div>
					</div>
				)}

				{/* Streaming indicator */}
				{message.isStreaming && !message.content && <StreamingIndicator />}

				{/* Timestamp */}
				<div
					className={`text-[10px] text-slate-600 mt-1 ${isUser ? "text-right" : "text-left"} px-1`}
				>
					{relativeTime(message.timestamp)}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Suggested questions
// ---------------------------------------------------------------------------

const SUGGESTED_QUESTIONS = [
	"Can I survive a crash?",
	"What should I do with my portfolio?",
	"Is it a good time to buy Bitcoin?",
	"How much should I allocate to BTC?",
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChatPanel({
	portfolio,
	temperatureScore,
	currencySymbol = "$",
}: ChatPanelProps) {
	const {
		messages,
		sendMessage,
		isLoading,
		error,
		clearMessages,
		apiKey,
		setApiKey,
		model,
		setModel,
	} = useChat();

	const [input, setInput] = useState("");
	const [showSettings, setShowSettings] = useState(false);
	const [dismissedError, setDismissedError] = useState<string | null>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	// Auto-resize textarea
	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		const maxHeight = 4 * 24; // ~4 lines
		el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
	}, [input]);

	const handleSend = useCallback(async () => {
		const trimmed = input.trim();
		if (!trimmed || isLoading) return;
		setInput("");
		await sendMessage(trimmed);
	}, [input, isLoading, sendMessage]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);

	const handleSuggestion = useCallback(
		(q: string) => {
			sendMessage(q);
		},
		[sendMessage],
	);

	const handleNewChat = useCallback(() => {
		clearMessages();
		setInput("");
		setDismissedError(null);
	}, [clearMessages]);

	const showError = error && error !== dismissedError;
	const hasMessages = messages.length > 0;
	const hasApiKey = !!apiKey;

	return (
		<>
			<div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
				{/* ── Header ── */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
					<div className="flex items-center gap-2">
						<Sparkles className="w-4 h-4 text-orange-400" />
						<h2 className="text-sm font-semibold text-white">TimeCell AI</h2>
					</div>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={handleNewChat}
							className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
							title="New chat"
						>
							<Plus className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={() => setShowSettings(true)}
							className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
							title="Settings"
						>
							<Settings className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* ── Message list ── */}
				<div className="flex-1 overflow-y-auto px-4 py-4">
					{/* Error banner */}
					{showError && (
						<div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 mb-4 text-xs text-red-400">
							<AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
							<span className="flex-1">{error}</span>
							<button
								type="button"
								onClick={() => setDismissedError(error)}
								className="p-0.5 hover:text-red-300 transition-colors"
							>
								<X className="w-3 h-3" />
							</button>
						</div>
					)}

					{/* No API key state */}
					{!hasApiKey && !hasMessages && (
						<div className="flex flex-col items-center justify-center h-full text-center px-4">
							<div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
								<MessageSquare className="w-6 h-6 text-slate-500" />
							</div>
							<h3 className="text-base font-semibold text-white mb-2">
								Your AI Investing Advisor
							</h3>
							<p className="text-sm text-slate-400 mb-5 max-w-xs">
								To start chatting, add your Claude API key. Your key stays local
								and is sent directly to Anthropic.
							</p>
							<button
								type="button"
								onClick={() => setShowSettings(true)}
								className="rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-medium py-2.5 px-5 transition-colors text-sm"
							>
								Add API Key
							</button>
						</div>
					)}

					{/* Empty state with suggestions */}
					{hasApiKey && !hasMessages && (
						<div className="flex flex-col items-center justify-center h-full text-center px-4">
							<div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
								<Sparkles className="w-6 h-6 text-orange-400" />
							</div>
							<h3 className="text-base font-semibold text-white mb-1">
								Ask me anything
							</h3>
							<p className="text-sm text-slate-400 mb-6 max-w-xs">
								I can analyze your portfolio, run crash simulations, and give
								you personalized investing guidance.
							</p>
							<div className="grid grid-cols-1 gap-2 w-full max-w-xs">
								{SUGGESTED_QUESTIONS.map((q) => (
									<button
										key={q}
										type="button"
										onClick={() => handleSuggestion(q)}
										className="text-left rounded-xl border border-slate-700 bg-slate-800/50 hover:border-orange-500/30 hover:bg-orange-500/5 px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
									>
										{q}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Messages */}
					{hasMessages &&
						messages.map((msg: ChatMessage) => (
							<MessageBubble key={msg.id} message={msg} />
						))}

					{/* Loading indicator */}
					{isLoading &&
						(!messages.length ||
							!messages[messages.length - 1]?.isStreaming) && (
							<StreamingIndicator />
						)}

					<div ref={messagesEndRef} />
				</div>

				{/* ── Input area ── */}
				<div className="border-t border-slate-800 px-4 py-3">
					<div className="flex items-end gap-2">
						<textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={
								hasApiKey
									? "Ask about your portfolio..."
									: "Add an API key to start..."
							}
							disabled={!hasApiKey || isLoading}
							rows={1}
							className="flex-1 resize-none rounded-xl bg-slate-800 border border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white text-sm py-2.5 px-4 outline-none transition-colors placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
						/>
						<button
							type="button"
							onClick={handleSend}
							disabled={!input.trim() || !hasApiKey || isLoading}
							className="flex-shrink-0 p-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
						>
							<Send className="w-4 h-4" />
						</button>
					</div>
					<p className="text-[10px] text-slate-600 mt-1.5 text-center">
						AI-powered analysis based on the Bitcoin Investing Framework. Not
						financial advice.
					</p>
				</div>
			</div>

			{/* Settings modal */}
			<ApiKeySetup
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				apiKey={apiKey}
				onApiKeyChange={setApiKey}
				model={model}
				onModelChange={setModel}
			/>
		</>
	);
}
