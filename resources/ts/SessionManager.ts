import Dom from "./utils/Dom";
import BrowserStorage from "./utils/BrowserStorage";
import MessageFactory from "./utils/MessageFactory";
import Message from "./model/Message";
import MessageReceived from "./model/MessageReceived";
import { SourceData } from "./model/Source";
import Api from "./Api";
import EventEmitter from "events";

export enum Role {
	AI = "assistant",
	HUMAN = "user"
}

export interface ChatHistoryMessage {
	role: Role,
	content: string
	timestamp: string
}

export interface ChatHistoryAiMessage extends ChatHistoryMessage {
	follow_up_questions: string[],
	sources: SourceData[],
}

export default class SessionManager extends EventEmitter {
	public static readonly EVENT_LOAD_LAST_ANSWER: string = "loadLastAnswer";

	private chatHistory: ChatHistoryMessage[] = [];

	private browserStorage: BrowserStorage;

	private messageFactory: MessageFactory;

	private dom: Dom;

	private api: Api;

	public sessionId: string;

	private historyInitialized: boolean = false;

	private messageList: MessageReceived[] = [];

	public constructor( dom: Dom, api: Api ) {
		super();

		this.dom = dom;
		this.api = api;
		this.messageFactory = new MessageFactory( this.dom );

		this.api.on( Api.EVENT_SESSION_AVAILABLE, async ( sessionId: string ) => {
			if ( sessionId !== this.sessionId ) {
				this.sessionId = sessionId;
				this.browserStorage.setRunningSession( sessionId );
				this.dom.setChatButtonActive( true );
			}
		} );
		this.api.on( Api.EVENT_CONNECTED, this.onConnected.bind( this ) );
		this.api.on( Api.EVENT_CONNECTION_ERROR, this.onConnectionError.bind( this ) );
		this.dom.on( Dom.EVENT_OPEN_CHAT, this.restoreSession.bind( this ) );
		this.dom.on( Dom.EVENT_MINIMIZE_CHAT, () => this.historyInitialized = false );
		this.dom.on( Dom.EVENT_CLOSE_CHAT, this.clearSession.bind( this ) );

		this.init();
	}

	public getRawChatHistory(): ChatHistoryMessage[] {
		return this.chatHistory;
	}

	private init(): void {
		this.browserStorage = new BrowserStorage();
		const mode = this.browserStorage.getMode();
		if ( mode ) {
			this.dom.setMode( mode );
		}

		const maximized = this.browserStorage.getMaximizedState();
		if ( maximized ) {
			this.dom.maximizeChat();
		}
	}

	private async onConnected( sessionId, history ): Promise<void> {
		if ( !this.historyInitialized ) {
			await this.initChatHistory( sessionId, history );
		}
		this.dom.clearErrors();
		this.dom.hideRestoreSessionMessage();
		this.dom.enableSendMessages();
		this.historyInitialized = true;
	}

	private async onConnectionError(): Promise<void> {
		this.sessionId = '';
		this.browserStorage.deleteCurrentSession();
	}

	private async restoreSession(): Promise<void> {
		const sessionId = await this.initSessionId();
		this.dom.disableSendMessages();
		this.dom.showRestoreSessionMessage();
		this.api.connect( sessionId );
	}

	private clearSession(): void {
		this.historyInitialized = false;
		if ( this.sessionId ) {
			this.browserStorage.deleteCurrentSession();
			this.api.deleteSession( this.sessionId );
		}
		this.api.disconnect();
		this.browserStorage.clearAll();
		this.dom.setChatButtonActive( false );
	}

	private async initSessionId(): Promise<string> {
		this.sessionId = this.browserStorage.getRunningSession();
		return this.sessionId;
	}

	private async initChatHistory( sessionId: string, chatHistory ): Promise<boolean> {
		if ( !sessionId ) {
			//this.dom.showBanner();
			this.messageFactory.createGreetingMessage();
			return true;
		}
		this.chatHistory = chatHistory;

		chatHistory.forEach( ( message, index, arr ) => {
			message = {
				role: message.role,
				content: message.content,
				timestamp: message.timestamp,
				sources: message.ai_metadata.sources || [],
				follow_up_questions: message.ai_metadata.follow_up_questions || []
			}
			// Compat
			if ( message.role === 'ai' ) {
				message.role = Role.AI;
			}
			if ( message.role === Role.AI ) {
				// If it is the last item in the chat history, append the buttons, follow-up options and scroll to the bottom
				const isLast = index === arr.length - 1;

				const answer = this.addAiMessage( message as ChatHistoryAiMessage, isLast );
				if ( isLast ) {
					Dom.scroll( answer.element );
				}
				this.addReceivedMessage( answer );
			} else if ( message.role === Role.HUMAN ) {
				this.addHumanMessage( message );
			} else {
				this.throwError( mw.message( 'chatbot-unknown-role', message.role ).text() );
			}
		} );
		return true;
	}

	public addReceivedMessage( message: MessageReceived ): void {
		this.messageList.push( message );
		message.on( MessageReceived.EVENT_EXPORT_REQUESTED, ( text ) => {
			this.emit( MessageReceived.EVENT_EXPORT_REQUESTED, text );
		} );
	}

	private addAiMessage( message: ChatHistoryAiMessage, isLast: boolean ): MessageReceived {
		const answer = this.messageFactory.createReceivedMessage(
			message.content,
			message.timestamp,
		);

		answer.appendSourceList( message.sources || [] );
		answer.appendMessageButtons();

		if ( isLast ) {
			this.dom.showFollowUpOptions( message.follow_up_questions );
		}

		return answer;
	}

	private addHumanMessage( message: ChatHistoryMessage ): Message {
		return this.messageFactory.createSentMessage(
			message.content,
			message.timestamp
		);
	}

	private throwError( message: string ): void {
		this.dom.displayErrorMessage( message );
		throw new Error( message );
	}
}
