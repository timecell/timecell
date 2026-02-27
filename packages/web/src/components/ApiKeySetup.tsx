import { useState, useCallback } from "react";
import { X, Eye, EyeOff, Key, Trash2, ExternalLink } from "lucide-react";

export interface ApiKeySetupProps {
	isOpen: boolean;
	onClose: () => void;
	apiKey: string | null;
	onApiKeyChange: (key: string) => void;
	model: string;
	onModelChange: (model: string) => void;
}

const MODELS = [
	{
		id: "claude-sonnet-4-6",
		label: "Claude Sonnet 4.6",
		desc: "Fast & affordable (~$0.01/message)",
	},
	{
		id: "claude-opus-4-6",
		label: "Claude Opus 4.6",
		desc: "Most capable (~$0.05/message)",
	},
	{
		id: "claude-haiku-4-5-20251001",
		label: "Claude Haiku 4.5",
		desc: "Fastest & cheapest (~$0.002/message)",
	},
] as const;

export function ApiKeySetup({
	isOpen,
	onClose,
	apiKey,
	onApiKeyChange,
	model,
	onModelChange,
}: ApiKeySetupProps) {
	const [keyInput, setKeyInput] = useState(apiKey ?? "");
	const [showKey, setShowKey] = useState(false);
	const [confirmClear, setConfirmClear] = useState(false);

	const handleSave = useCallback(() => {
		const trimmed = keyInput.trim();
		if (trimmed) {
			onApiKeyChange(trimmed);
			onClose();
		}
	}, [keyInput, onApiKeyChange, onClose]);

	const handleClear = useCallback(() => {
		if (!confirmClear) {
			setConfirmClear(true);
			return;
		}
		onApiKeyChange("");
		setKeyInput("");
		setConfirmClear(false);
	}, [confirmClear, onApiKeyChange]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleSave();
			}
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}
		},
		[handleSave, onClose],
	);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
			<div className="w-full max-w-sm mx-4 rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-5 animate-in fade-in duration-300">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Key className="w-4 h-4 text-orange-400" />
						<h2 className="text-lg font-semibold text-white">AI Settings</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* API Key Input */}
				<div className="space-y-2">
					<label className="text-sm font-medium text-slate-300">
						Your Claude API Key
					</label>
					<div className="relative">
						<input
							type={showKey ? "text" : "password"}
							value={keyInput}
							onChange={(e) => setKeyInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="sk-ant-..."
							autoFocus
							className="w-full rounded-xl bg-slate-800 border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white text-sm py-2.5 pl-4 pr-10 outline-none transition-colors font-mono"
						/>
						<button
							type="button"
							onClick={() => setShowKey(!showKey)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
						>
							{showKey ? (
								<EyeOff className="w-4 h-4" />
							) : (
								<Eye className="w-4 h-4" />
							)}
						</button>
					</div>
					<p className="text-xs text-slate-500">
						Your key is stored locally and sent directly to Anthropic. It never
						touches our servers.
					</p>
				</div>

				{/* Model Selector */}
				<div className="space-y-2">
					<label className="text-sm font-medium text-slate-300">Model</label>
					<div className="space-y-1.5">
						{MODELS.map((m) => (
							<button
								key={m.id}
								type="button"
								onClick={() => onModelChange(m.id)}
								className={`w-full text-left rounded-lg px-3 py-2.5 border transition-colors ${
									model === m.id
										? "border-orange-500/50 bg-orange-500/10"
										: "border-slate-700 bg-slate-800/50 hover:border-slate-600"
								}`}
							>
								<div className="flex items-center gap-2">
									<div
										className={`w-2 h-2 rounded-full flex-shrink-0 ${
											model === m.id ? "bg-orange-400" : "bg-slate-600"
										}`}
									/>
									<div className="min-w-0">
										<div
											className={`text-sm font-medium ${
												model === m.id ? "text-orange-300" : "text-slate-300"
											}`}
										>
											{m.label}
										</div>
										<div className="text-xs text-slate-500">{m.desc}</div>
									</div>
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Get a key link */}
				<a
					href="https://console.anthropic.com"
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-400 transition-colors"
				>
					Don't have a key? Get one at console.anthropic.com
					<ExternalLink className="w-3 h-3" />
				</a>

				{/* Actions */}
				<div className="flex items-center gap-3 pt-1">
					<button
						type="button"
						onClick={handleSave}
						disabled={!keyInput.trim()}
						className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2.5 px-4 transition-colors text-sm"
					>
						Save
					</button>
					{apiKey && (
						<button
							type="button"
							onClick={handleClear}
							className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
								confirmClear
									? "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
									: "border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30"
							}`}
						>
							<Trash2 className="w-3.5 h-3.5" />
							{confirmClear ? "Confirm" : "Clear"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
