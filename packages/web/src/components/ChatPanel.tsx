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

import type { ChatMessage } from "../hooks/useChat";

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

		// Table detection: line starts with |
		if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
			const tableRows: string[][] = [];
			let j = i;
			while (j < lines.length && lines[j].trim().startsWith("|") && lines[j].trim().endsWith("|")) {
				const row = lines[j].trim();
				// Skip separator rows (|---|---|)
				if (/^\|[\s\-:]+\|$/.test(row.replace(/\|/g, m => m).replace(/[|\s\-:]/g, ""))) {
					j++;
					continue;
				}
				if (/^\|[-\s:|]+\|$/.test(row)) {
					j++;
					continue;
				}
				const cells = row.slice(1, -1).split("|").map(c => c.trim());
				tableRows.push(cells);
				j++;
			}
			if (tableRows.length > 0) {
				const [header, ...body] = tableRows;
				nodes.push(
					<div key={`table-${i}`} className="overflow-x-auto my-2">
						<table className="w-full text-xs border-collapse">
							<thead>
								<tr className="border-b border-slate-700">
									{header.map((cell, ci) => (
										<th key={ci} className="text-left px-3 py-2 text-slate-400 font-medium">
											{inlineFormat(cell, `th-${i}-${ci}`)}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{body.map((row, ri) => (
									<tr key={ri} className="border-b border-slate-800/50">
										{row.map((cell, ci) => (
											<td key={ci} className="px-3 py-1.5 text-slate-300">
												{inlineFormat(cell, `td-${i}-${ri}-${ci}`)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>,
				);
			}
			i = j - 1; // Skip past table rows
			continue;
		}

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

		// Headings (### H3, ## H2, # H1)
		if (/^#{1,3}\s/.test(line)) {
			const level = line.match(/^(#{1,3})\s/)![1].length;
			const content = line.replace(/^#{1,3}\s/, "");
			const sizeClass = level === 1 ? "text-base font-bold" : level === 2 ? "text-sm font-bold" : "text-sm font-semibold";
			nodes.push(
				<p key={`h-${i}`} className={`${sizeClass} text-white mt-2 mb-1`}>
					{inlineFormat(content, `h-c-${i}`)}
				</p>,
			);
			continue;
		}

		// Numbered lists (1. item, 2. item)
		if (/^\s*\d+\.\s/.test(line)) {
			const match = line.match(/^\s*(\d+)\.\s(.*)/)!;
			nodes.push(
				<div key={`ol-${i}`} className="flex gap-2 ml-1">
					<span className="text-slate-500 flex-shrink-0 text-sm tabular-nums">{match[1]}.</span>
					<span className="text-sm leading-relaxed">
						{inlineFormat(match[2], `ol-c-${i}`)}
					</span>
				</div>,
			);
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

function inferToolStatus(result: string): "success" | "error" | "warning" {
	try {
		const parsed = JSON.parse(result);
		if (parsed.error) return "error";
		if (parsed.ruinTestPassed === false || parsed.survivalScore < 50) return "warning";
		return "success";
	} catch {
		return "success";
	}
}

function toolStatusColor(status: string): string {
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

function toolStatusBorder(status: string): string {
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

function ToolCallCard({ tool }: { tool: { name: string; input: Record<string, unknown>; result: string } }) {
	const [expanded, setExpanded] = useState(false);
	const status = inferToolStatus(tool.result);

	return (
		<div className="text-xs mb-1">
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				className="flex items-center gap-1.5 text-left hover:text-slate-300 transition-colors py-0.5"
			>
				<span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${status === "success" ? "bg-emerald-400/70" : status === "error" ? "bg-red-400/70" : "bg-amber-400/70"}`} />
				<span className="text-slate-500">{toolCallLabel(tool.name)}</span>
				{expanded ? (
					<ChevronDown className="w-3 h-3 text-slate-600" />
				) : (
					<ChevronRight className="w-3 h-3 text-slate-600" />
				)}
			</button>
			{expanded && (
				<div
					className={`ml-3 mt-1 mb-2 pl-3 border-l-2 ${toolStatusBorder(status)} text-xs ${toolStatusColor(status)} leading-relaxed`}
				>
					<pre className="whitespace-pre-wrap break-words font-mono">{tool.result}</pre>
				</div>
			)}
		</div>
	);
}

const TOOL_LABELS: Record<string, string> = {
	run_crash_survival: "Analyzing crash scenarios",
	generate_action_plan: "Building action plan",
	check_temperature: "Checking market temperature",
	calculate_position_sizing: "Calculating position size",
	run_ruin_test: "Running ruin test",
	run_sleep_test: "Running sleep test",
	get_selling_rules: "Checking selling rules",
	get_dca_recommendation: "Calculating DCA strategy",
};

function StreamingIndicator({ toolName }: { toolName?: string | null }) {
	const label = toolName ? TOOL_LABELS[toolName] ?? `Running ${toolName}` : "Thinking";
	return (
		<div className="flex items-center gap-2 px-4 py-3">
			<Bot className="w-4 h-4 text-slate-500 flex-shrink-0" />
			<div className="flex items-center gap-1.5">
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
				<span className="text-xs text-slate-500">{label}...</span>
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

				{/* Streaming cursor — shown inside the bubble while content is arriving */}
				{message.isStreaming && message.content && (
					<span className="inline-block w-0.5 h-3.5 bg-orange-400 ml-0.5 animate-pulse align-middle" />
				)}

				{/* Streaming indicator — shown before first text chunk */}
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
	"I'd like to check my portfolio",
	"Can I survive a crash?",
	"What should I do with my Bitcoin?",
	"Is it a good time to buy?",
];

const WELCOME_MESSAGE: ChatMessage = {
	id: "welcome_msg",
	role: "assistant",
	content: `Welcome! I'm your AI Chief Investment Officer. 👋

Tell me about your portfolio and I'll give you a personalized analysis. I need a few numbers:

• **Total portfolio value** (all assets)
• **How much is in Bitcoin** (percentage or dollar amount)
• **Monthly expenses** (your burn rate)
• **Liquid cash reserve** (non-invested savings)

You can type something like "I have $500k total, 15% in Bitcoin, $8k/month expenses, and $50k in cash" — or just tell me one number at a time and I'll ask for the rest.`,
	timestamp: 0,
};

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
		activeToolName,
		error,
		clearMessages,
		cancelRequest,
		apiKey,
		setApiKey,
		model,
		setModel,
	} = useChat(portfolio, temperatureScore, undefined, currencySymbol);

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
			setInput(q);
			textareaRef.current?.focus();
		},
		[],
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
			<div className="flex flex-col h-full bg-slate-950">
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

					{/* Welcome message + suggestions (API key set, no messages yet) */}
					{hasApiKey && !hasMessages && (
						<div className="flex flex-col gap-4 pt-2">
							<MessageBubble message={WELCOME_MESSAGE} />
							<div className="grid grid-cols-1 gap-2 px-1 pb-2">
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

					{/* Loading indicator — only show when no streaming message is active (tool execution phase) */}
					{isLoading && !messages.some((m) => m.isStreaming) && (
						<StreamingIndicator toolName={activeToolName} />
					)}

					<div ref={messagesEndRef} />
				</div>

				{/* ── Input area (hidden when no API key and no messages) ── */}
				<div className={`border-t border-slate-800 px-4 py-3 ${!hasApiKey && !hasMessages ? "hidden" : ""}`}>
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
						{isLoading ? (
						<button
							type="button"
							onClick={cancelRequest}
							className="flex-shrink-0 p-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-colors"
							title="Stop"
						>
							<div className="w-4 h-4 flex items-center justify-center">
								<div className="w-3 h-3 rounded-sm bg-white" />
							</div>
						</button>
					) : (
						<button
							type="button"
							onClick={handleSend}
							disabled={!input.trim() || !hasApiKey}
							className="flex-shrink-0 p-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
						>
							<Send className="w-4 h-4" />
						</button>
					)}
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
