declare global {
	namespace mw {
		interface ChatBotHook {
			add(...handler: Array<(...args: unknown[]) => unknown>): ChatBotHook;
			fire(...data: unknown[]): ChatBotHook;
			remove(handler: (...args: unknown[]) => unknown): ChatBotHook;
		}

		function hook(event: string): ChatBotHook;
	}
}

export {};
