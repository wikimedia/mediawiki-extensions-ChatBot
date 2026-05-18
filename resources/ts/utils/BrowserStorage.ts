import {ChatSizeMode} from "./Dom";

declare const mw: any;

export default class BrowserStorage {

	public static readonly CHAT_HISTORY_STORAGE_KEY = 'chatBotHistory';

	public static readonly SESSION_STORAGE_KEY = 'chatBotSessionId';

	public static readonly MODE_STORAGE_KEY = 'chatBotMode';

	public static readonly MAXIMIZED_STORAGE_KEY = 'chatBotMaximized';

	public getMaximizedState(): boolean {
		return !!localStorage.getItem( BrowserStorage.MAXIMIZED_STORAGE_KEY );
	}

	public setMaximized(): void {
		localStorage.setItem( BrowserStorage.MAXIMIZED_STORAGE_KEY, 'true' );
	}

	public unsetMaximized(): void {
		localStorage.removeItem( BrowserStorage.MAXIMIZED_STORAGE_KEY );
	}

	public clearAll(): void {
		sessionStorage.removeItem( BrowserStorage.CHAT_HISTORY_STORAGE_KEY );
		this.deleteCurrentSession();
	}


	public getMode(): ChatSizeMode {
		return localStorage.getItem( BrowserStorage.MODE_STORAGE_KEY ) as unknown as ChatSizeMode;
	}

	public setMode( mode: string ): void {
		return localStorage.setItem( BrowserStorage.MODE_STORAGE_KEY, mode );
	}

	public getRunningSession(): string | null {
		const sessionData = this.getRawSessionData();
		const identifier = this.getCurrentSessionIdentifier();
		if ( identifier in sessionData ) {
			return sessionData[ identifier ];
		}
		return '';
	}

	public setRunningSession( id: string ): void {
		const sessionData = this.getRawSessionData();
		sessionData[ this.getCurrentSessionIdentifier() ] = id;
		localStorage.setItem( BrowserStorage.SESSION_STORAGE_KEY, JSON.stringify( sessionData ) );
	}

	private getRawSessionData() {
		let sessionData = {};
		const raw = localStorage.getItem( BrowserStorage.SESSION_STORAGE_KEY );
		try {
			const data = raw && raw !== 'null' && raw !== 'undefined' ? JSON.parse( raw ) : {};
			if ( typeof data === 'object' ) {
				sessionData = data;
			}
		} catch ( e ) {
			// NOOP
		}
		return sessionData;
	}

	public deleteCurrentSession(): void {
		const sessionData = this.getRawSessionData();
		const identifier = this.getCurrentSessionIdentifier();
		if ( identifier in sessionData ) {
			delete sessionData[ identifier ];
			localStorage.setItem( BrowserStorage.SESSION_STORAGE_KEY, JSON.stringify( sessionData ) );
		}
	}

	private getCurrentSessionIdentifier() {
		const uname = mw.user.isAnon() ? 'anon' : mw.user.getName();
		return uname + '@' + mw.config.get( 'wgWikiID' );
	}
}
