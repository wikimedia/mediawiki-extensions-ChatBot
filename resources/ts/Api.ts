import EventEmitter from "events";
import { ChatHistoryAiMessage, ChatHistoryMessage, Role } from "./SessionManager";
import { SourceData } from "./model/Source";

declare const mw: any;
declare const mws: any;
declare const ext: any;

export interface StreamDeltaObject {
	query_id: string;
	delta: { text: string };
	type: string;
}

interface ChatResponse {
	status: string,
	session_id: string,
	message: string,
	sources: SourceData[],
	follow_up_questions: string[]
}

export default class Api extends EventEmitter {
	public static readonly EVENT_SESSION_AVAILABLE = 'session-available';

	public static readonly EVENT_SOCKET_MESSAGE = 'socket-message';

	public static readonly EVENT_STREAM_ERROR = 'stream-error';

	public static readonly EVENT_CONNECTED = 'connected';

	public static readonly EVENT_CONNECTION_ERROR = 'connection-error';

	public static readonly EVENT_SOCKET_CLOSED = 'socket-close';

	private readonly serviceUrl: string;

	private socket: WebSocket;

	public static readonly EVENT_ERROR: string = "error";

	public static readonly STREAM_EVENT_DELTA: string = "delta";

	private streamMetadata = {};

	private runningSessionId = null;

	private connectionTimer = null;

	private reconnectTimer = null;

	private reconnectAttempts = 0;

	public constructor(
		serviceUrl: string
	) {
		super();

		this.serviceUrl = serviceUrl;
	}

	public async connect( sessionId ): Promise<void> {
		this.runningSessionId = sessionId;
		const token = await this.getChatToken();
		if ( this.socket ) {
			return;
		}
		this.socket = new WebSocket( this.serviceUrl + '?token=' + token + ( sessionId ? '&session_id=' + sessionId : '' ) );
		// Wait 5 seconds for connection to be established, otherwise drop it and try again
		this.connectionTimer = setTimeout( () => {
			this.socket.close();
			this.socket = null;
		}, 5000 );

		this.socket.onopen = () => {
			// Connection established
			this.clearConnectionTimeout();
		};
		this.socket.onerror = ( error ) => {
			// Error causes connection to be closed, so we handle it in onclose
			this.clearConnectionTimeout();
			this.socket = null;
			this.emit( Api.EVENT_ERROR, mw.message( 'chatbot-connection-error' ).text() );
		}
		this.socket.onmessage = ( event: MessageEvent ) => {
			this.processSocketEvent( event );
		};
		this.socket.onclose = ( event ) => {
			this.socket = null;
			this.emit( Api.EVENT_SOCKET_CLOSED );
			if ( event.code !== 1000 ) {
				// Non-normal closure
				this.reconnect();
			}
		}
	}

	public isConnected(): boolean {
		return this.socket && this.socket.readyState === WebSocket.OPEN;
	}

	private clearConnectionTimeout() {
		if ( this.connectionTimer !== null ) {
			clearTimeout( this.connectionTimer );
			this.connectionTimer = null;
		}
		if ( this.reconnectTimer ) {
			clearTimeout( this.reconnectTimer );
			this.reconnectTimer = null;
		}
	}

	private reconnect() {
		this.clearConnectionTimeout();
		if ( this.reconnectAttempts >= 5 ) {
			console.debug( "ChatBot: Maximum reconnect attempts reached, giving up" );
			this.emit( Api.EVENT_ERROR, mw.message( 'chatbot-connection-error-final' ).text() );
			return;
		}
		console.debug( "ChatBot WSS connection closed, trying to reconnect" );
		this.reconnectTimer = setTimeout( () => {
			this.reconnectAttempts++;
			this.connect( this.runningSessionId );
		}, 1000 );
	}

	public async disconnect(): Promise<void> {
		if ( this.socket ) {
			this.socket.close( 1000, "Closed chat" );
			this.socket = null;
		}
	}

	private async processSocketEvent( event: MessageEvent ): Promise<void> {
		const data = JSON.parse( event.data );
		data.action = data.action || null;
		if ( data.connection ) {
			if ( data.error ) {
				this.emit( Api.EVENT_CONNECTION_ERROR, data.session_id || '' );
				console.warn( 'ChatBot: Failed to restore session, starting a new one' );
				// Go on with a new session
			}
			this.emit( Api.EVENT_CONNECTED, data.session_id || '', data.history || [] );
			this.runningSessionId = data.session_id || null;
			console.debug( 'ChatBot: connection to chat established' );
			return;
		}
		if ( data.error ) {
			this.emit( Api.EVENT_STREAM_ERROR, data.message );
			return;
		}

		if ( data.eventType === 'metadata' ) {
			// This is a metadata packet, containing session_id and other metadata, happens at the end of the stream
			this.streamMetadata[ data.streamId ] = data.metadata;
			this.emit( Api.EVENT_SESSION_AVAILABLE, data.metadata.session_id );
			this.runningSessionId = data.metadata.session_id;
			if ( data.metadata.status === 'failed' ) {
				this.emit( Api.EVENT_STREAM_ERROR, data.metadata.reason );
				return;
			}
		} else if ( data.eventType === 'streamEnd' || data.eventType === 'end' ) {
			// "Publish" the message
			if ( this.streamMetadata[ data.streamId ] ) {
				const metadata = this.streamMetadata[ data.streamId ];
				this.emit( Api.EVENT_SOCKET_MESSAGE, this.processQueryAnswer( {
					status: metadata.status,
					session_id: metadata.session_id,
					message: metadata.message || metadata.response || '',
					sources: metadata.sources,
					// There seems to be a typo in service response, requiring this compatibility fix
					// Should be removed eventually
					follow_up_questions: metadata.follow_up_questions || metadata[ 'follow_up-questions' ] || []
				} ) );
			}
		} else {
			// Regular packets of streaming data - deltas
			this.emit( Api.STREAM_EVENT_DELTA, data.message );
		}
	}

	private async getChatToken(): Promise<string> {
		return mws.tokenAuthenticator.generateToken( true );
	}

	public async sendMessage( query: string, sessionId: string ) {
		if ( this.socket && this.socket.readyState === WebSocket.OPEN ) {
			this.socket.send( JSON.stringify( {
				action: 'user-message',
				msg: query,
				session_id: sessionId
			} ) );
		}
	}

	private processQueryAnswer( response: ChatResponse ): ChatHistoryAiMessage {
		return {
			role: Role.AI,
			content: response.message,
			timestamp: new Date().toISOString(),
			follow_up_questions: response.follow_up_questions ?? [],
			sources: response.sources ?? [],
		};
	}

	public downloadChatHistory( chatHistory: ChatHistoryMessage[], filename: string, format: string ): void {
		if ( format === 'pdf' ) {
			this.downloadChatHistoryPdf( chatHistory, filename );

			return;
		}

		throw new Error( `Export format ${ format } not supported` );
	}

	public async requestMessageTopic( message: string ): Promise<string> {
		const res = await ext.chatbot.util.message.get_topic( message );
		if ( !( 'topic' in res ) ) {
			console.warn( 'ChatBot: Failed to get message topic' );
			return '';
		}
		return res.topic;
	}

	public async deleteSession( sessionId: string ): Promise<void> {
		this.runningSessionId = null;
		await ext.chatbot.util.session.delete( sessionId )
	}

	private async downloadChatHistoryPdf( chatHistory: ChatHistoryMessage[], filename: string ): Promise<void> {
		filename += '.pdf';
		const url = `${ mw.config.get( 'wgScriptPath' ) }/rest.php/chatbot/export-pdf?filename=${ filename }`;
		const response = await fetch( url, {
			method: 'POST',
			body: JSON.stringify( { history: chatHistory } ),
			headers: {
				'Accept': 'application/pdf',
				'Content-Type': 'application/json'
			}
		} );

		const blob = await response.blob();
		this.executeDownloadFile( blob, filename );
	}

	private executeDownloadFile( blob: Blob, filename: string ): void {
		const blobUrl = window.URL.createObjectURL( blob );
		const a = document.createElement( 'a' );
		a.href = blobUrl;
		a.download = filename;
		document.body.appendChild( a );
		a.click();
		document.body.removeChild( a );
		window.URL.revokeObjectURL( blobUrl );
	}
}
