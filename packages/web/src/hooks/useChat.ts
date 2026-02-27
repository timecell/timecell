// =============================================================================
// useChat — React hook for the TimeCell AI chat experience
// =============================================================================
// Uses the Anthropic SDK directly in the browser (BYOK pattern).
// Implements an agentic tool-use loop: call Claude, resolve tool calls,
// loop until a final text response is produced.

import { useState, useCallback, useRef, useEffect } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { TOOLS, resolveToolCall } from "../lib/tool-definitions";
import { buildSystemPrompt } from "../lib/system-prompt";
import type { PortfolioInput } from "@timecell/engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	toolCalls?: { name: string; input: Record<string, unknown>; result: string }[];
	isStreaming?: boolean;
	timestamp: number;
}

interface AnthropicMessage {
	role: "user" | "assistant";
	content: string | AnthropicContentBlock[];
}

interface AnthropicContentBlock {
	type: "text" | "tool_use" | "tool_result";
	text?: string;
	id?: string;
	name?: string;
	input?: Record<string, unknown>;
	tool_use_id?: string;
	content?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY_API_KEY = "timecell_api_key";
const STORAGE_KEY_MODEL = "timecell_model";
const STORAGE_KEY_HISTORY = "timecell_chat_history";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_MESSAGES = 50;
const MAX_TOOL_LOOPS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
	return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (raw != null && raw !== "") return JSON.parse(raw) as T;
	} catch {
		// corrupted data — use fallback
	}
	return fallback;
}

function saveToStorage(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// localStorage full or unavailable
	}
}

function truncateMessages(messages: ChatMessage[]): ChatMessage[] {
	if (messages.length <= MAX_MESSAGES) return messages;
	return messages.slice(messages.length - MAX_MESSAGES);
}

function extractTextContent(response: Anthropic.Message): string {
	return response.content
		.filter((block): block is Anthropic.TextBlock => block.type === "text")
		.map((block) => block.text)
		.join("");
}

function extractToolUseBlocks(response: Anthropic.Message): Anthropic.ToolUseBlock[] {
	return response.content.filter(
		(block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
	);
}

function classifyError(err: unknown): string {
	if (err instanceof Anthropic.AuthenticationError) {
		return "Invalid API key. Please check your key in settings.";
	}
	if (err instanceof Anthropic.RateLimitError) {
		return "Rate limited. Please wait a moment.";
	}
	if (err instanceof Anthropic.APIConnectionError) {
		return "Network error. Check your connection.";
	}
	if (err instanceof Anthropic.APIError) {
		return `API error: ${err.message}`;
	}
	if (err instanceof Error) {
		return err.message;
	}
	return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChat(
	portfolio: PortfolioInput,
	temperatureScore?: number,
	temperatureZone?: string,
	currencySymbol?: string,
) {
	const [messages, setMessages] = useState<ChatMessage[]>(() => {
		// Clear stale streaming flags — if the page was refreshed mid-stream,
		// persisted messages may still have isStreaming: true.
		const stored = loadFromStorage<ChatMessage[]>(STORAGE_KEY_HISTORY, []);
		return stored.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m));
	});
	const [isLoading, setIsLoading] = useState(false);
	const [activeToolName, setActiveToolName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [apiKey, setApiKeyState] = useState<string | null>(() => {
		const stored = localStorage.getItem(STORAGE_KEY_API_KEY);
		return stored || null; // treat empty string as null
	});
	const [model, setModelState] = useState<string>(() =>
		localStorage.getItem(STORAGE_KEY_MODEL) ?? DEFAULT_MODEL,
	);

	// Abort controller for cancelling in-flight requests
	const abortRef = useRef<AbortController | null>(null);

	// Persist messages when they change
	useEffect(() => {
		saveToStorage(STORAGE_KEY_HISTORY, messages);
	}, [messages]);

	// API key setter (persists to localStorage)
	const setApiKey = useCallback((key: string) => {
		if (key) {
			localStorage.setItem(STORAGE_KEY_API_KEY, key);
			setApiKeyState(key);
		} else {
			localStorage.removeItem(STORAGE_KEY_API_KEY);
			setApiKeyState(null);
		}
		setError(null);
	}, []);

	// Model setter (persists to localStorage)
	const setModel = useCallback((m: string) => {
		localStorage.setItem(STORAGE_KEY_MODEL, m);
		setModelState(m);
	}, []);

	// Clear all messages
	const clearMessages = useCallback(() => {
		setMessages([]);
		localStorage.removeItem(STORAGE_KEY_HISTORY);
	}, []);

	// Cancel in-flight request
	const cancelRequest = useCallback(() => {
		if (abortRef.current) {
			abortRef.current.abort();
			abortRef.current = null;
		}
		setIsLoading(false);
		setActiveToolName(null);
	}, []);

	// ------------------------------------------------------------------
	// Send a message — the core agentic loop
	// ------------------------------------------------------------------

	const sendMessage = useCallback(
		async (text: string) => {
			if (!apiKey) {
				setError("No API key set. Add your Anthropic API key in settings.");
				return;
			}

			if (isLoading) return; // prevent double-sends

			const trimmed = text.trim();
			if (!trimmed) return;

			setError(null);
			setIsLoading(true);
			setActiveToolName(null);

			// Set up abort controller
			const abortController = new AbortController();
			abortRef.current = abortController;

			// Append user message
			const userMessage: ChatMessage = {
				id: generateId(),
				role: "user",
				content: trimmed,
				timestamp: Date.now(),
			};

			setMessages((prev) => truncateMessages([...prev, userMessage]));

			// Build the Anthropic client
			const client = new Anthropic({
				apiKey,
				dangerouslyAllowBrowser: true,
			});

			// Build system prompt with current context
			const systemPrompt = buildSystemPrompt({
				portfolio,
				temperatureScore,
				temperatureZone,
				currencySymbol,
			});

			// Build conversation history for the API
			// Only send text content from stored messages (tool calls are within
			// a single turn and not persisted as structured API messages)
			const apiMessages: AnthropicMessage[] = [];
			for (const msg of [...messages, userMessage]) {
				apiMessages.push({
					role: msg.role,
					content: msg.content,
				});
			}

			// Agentic loop: keep calling Claude until no more tool_use blocks
			let loopCount = 0;
			const collectedToolCalls: ChatMessage["toolCalls"] = [];

			// Working copy of messages for multi-turn tool resolution
			const workingMessages = [...apiMessages];

			try {
				while (loopCount < MAX_TOOL_LOOPS) {
					// Check if cancelled
					if (abortController.signal.aborted) break;

					loopCount++;

					// Use blocking call for intermediate turns (tool-use rounds).
					// We only know if this is the final turn after we see stop_reason,
					// so we always start with a streaming call and check afterwards.
					const stream = client.messages.stream({
						model,
						max_tokens: 4096,
						system: systemPrompt,
						tools: TOOLS as Anthropic.Tool[],
						messages: workingMessages as Anthropic.MessageParam[],
					});

					// Wire up abort: when the controller fires, stop the stream
					const onAbort = () => { stream.abort(); };
					abortController.signal.addEventListener("abort", onAbort, { once: true });

					// Determine if this will be the final (text-only) turn by peeking
					// at the first event. We track accumulated text and tool blocks.
					let accumulatedText = "";
					const streamingMsgId = generateId();
					let streamingMsgAdded = false;

					// Stream events — update UI incrementally for text blocks
					for await (const event of stream) {
						// Stop processing if aborted
						if (abortController.signal.aborted) break;

						if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
							accumulatedText += event.delta.text;

							if (!streamingMsgAdded) {
								// Add placeholder message on first text chunk
								streamingMsgAdded = true;
								const placeholder: ChatMessage = {
									id: streamingMsgId,
									role: "assistant",
									content: accumulatedText,
									toolCalls: collectedToolCalls.length > 0 ? [...collectedToolCalls] : undefined,
									isStreaming: true,
									timestamp: Date.now(),
								};
								setMessages((prev) => truncateMessages([...prev, placeholder]));
							} else {
								// Update existing streaming message with new chunk
								setMessages((prev) =>
									prev.map((m) =>
										m.id === streamingMsgId
											? { ...m, content: accumulatedText }
											: m,
									),
								);
							}
						}
					}

					abortController.signal.removeEventListener("abort", onAbort);

					if (abortController.signal.aborted) break;

					// Get the final accumulated message from the stream
					const response = await stream.finalMessage();

					const toolUseBlocks = extractToolUseBlocks(response);

					// If no tool calls, we have the final response — finalize the streaming message
					if (toolUseBlocks.length === 0) {
						const finalText = extractTextContent(response);

						if (streamingMsgAdded) {
							// Finalize the streaming message already in the list
							setMessages((prev) =>
								prev.map((m) =>
									m.id === streamingMsgId
										? {
												...m,
												content: finalText,
												toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
												isStreaming: false,
											}
										: m,
								),
							);
						} else {
							// No text was streamed (edge case: empty response)
							const assistantMessage: ChatMessage = {
								id: generateId(),
								role: "assistant",
								content: finalText,
								toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
								timestamp: Date.now(),
							};
							setMessages((prev) => truncateMessages([...prev, assistantMessage]));
						}
						break;
					}

					// We have tool calls — remove the streaming placeholder if it was added
					// (it will be re-added with tool results when the final text arrives)
					if (streamingMsgAdded) {
						setMessages((prev) => prev.filter((m) => m.id !== streamingMsgId));
					}

					// Show which tool is running
					setActiveToolName(toolUseBlocks[0].name);

					// Resolve each tool call
					const assistantContent: AnthropicContentBlock[] = response.content.map((block) => {
						if (block.type === "text") {
							return { type: "text" as const, text: block.text };
						}
						if (block.type === "tool_use") {
							return {
								type: "tool_use" as const,
								id: block.id,
								name: block.name,
								input: block.input as Record<string, unknown>,
							};
						}
						return block as unknown as AnthropicContentBlock;
					});

					// Add assistant turn with tool_use blocks
					workingMessages.push({
						role: "assistant",
						content: assistantContent,
					});

					// Resolve tools and build tool_result blocks
					const toolResults: AnthropicContentBlock[] = [];

					for (const toolBlock of toolUseBlocks) {
						const toolInput = toolBlock.input as Record<string, unknown>;
						const result = await resolveToolCall(toolBlock.name, toolInput);

						collectedToolCalls.push({
							name: toolBlock.name,
							input: toolInput,
							result,
						});

						toolResults.push({
							type: "tool_result" as const,
							tool_use_id: toolBlock.id,
							content: result,
						});
					}

					// Add user turn with tool_result blocks
					workingMessages.push({
						role: "user",
						content: toolResults,
					});

					setActiveToolName(null);
				}
			} catch (err: unknown) {
				if (abortController.signal.aborted) {
					// User cancelled — not an error
				} else {
					const errorMessage = classifyError(err);
					setError(errorMessage);
				}
			} finally {
				setIsLoading(false);
				setActiveToolName(null);
				abortRef.current = null;
			}
		},
		[apiKey, isLoading, model, messages, portfolio, temperatureScore, temperatureZone, currencySymbol],
	);

	return {
		messages,
		sendMessage,
		cancelRequest,
		isLoading,
		activeToolName,
		error,
		clearMessages,
		apiKey,
		setApiKey,
		model,
		setModel,
	};
}
