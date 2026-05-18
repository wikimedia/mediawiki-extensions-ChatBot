// noinspection ES6UnusedImports
import message from "types-mediawiki/mw/message";
// noinspection ES6UnusedImports
import config from "types-mediawiki/mw/config";
// noinspection ES6UnusedImports
import Title from "types-mediawiki/mw/Title";
import Api from "types-mediawiki/mw/Api";
import user from "types-mediawiki/mw/user";

import MessageFactory from "./utils/MessageFactory";
import Dom from "./utils/Dom";
import MessageReceived from "./model/MessageReceived";
import MessageParser from "./utils/MessageParser";
import SessionManager, { ChatHistoryAiMessage, ChatHistoryMessage, Role } from "./SessionManager";
import ChatbotApi from "./Api";
import Message from "./model/Message";
import Source, { SourceData } from "./model/Source";

declare global {
	interface Window {
		ext: { chatbot: any }
	}
}

export default class ChatBot {

	private api: ChatbotApi;

	private dom: Dom;

	public sessionId: string;

	private currentMessage: MessageReceived;

	private messageFactory: MessageFactory;

	private sessionManager: SessionManager;

	public constructor(
		serviceUrl: string
	) {
		this.dom = new Dom();

		if ( !serviceUrl ) {
			this.throwError( mw.message( 'chatbot-missing-config' ).text() );
		}

		this.dom.on( Dom.EVENT_SEND_MESSAGE, this.sendMessage.bind( this ) );
		this.dom.on( Dom.EVENT_FOLLOWUP, this.sendMessage.bind( this ) );
		//this.dom.on( Dom.EVENT_EXPORT_CHAT, this.exportChat.bind( this ) );
		this.dom.on( Dom.EVENT_MOUSE_WHEEL_USED, this.setAutoScrolling.bind( this ) );

		this.messageFactory = new MessageFactory( this.dom );

		this.api = new ChatbotApi( serviceUrl );
		this.api.on( ChatbotApi.EVENT_ERROR, this.onSocketError.bind( this ) );
		this.api.on( ChatbotApi.EVENT_SOCKET_CLOSED, this.onSocketClose.bind( this ) );
		this.api.on( ChatbotApi.EVENT_SOCKET_MESSAGE, this.receiveMessage.bind( this ) );
		this.api.on( ChatbotApi.STREAM_EVENT_DELTA, this.onStreamEventDelta.bind( this ) );
		this.api.on( ChatbotApi.EVENT_STREAM_ERROR, this.onStreamError.bind( this ) );

		this.dom.on( Dom.EVENT_MINIMIZE_CHAT, () => this.api.disconnect() );

		this.sessionManager = new SessionManager( this.dom, this.api );
		// Events from MessageReceived buttons
		this.sessionManager.on( MessageReceived.EVENT_EXPORT_REQUESTED, this.onMessageExportRequested.bind( this ) );
	}

	private async sendMessage( message: string ): Promise<void> {
		if ( !message ) {
			return;
		}
		this.currentMessage = null;

		this.dom.clearFollowUpOptions();

		this.messageFactory.createSentMessage( message );

		this.dom.disableSendMessages();
		this.dom.setAnswerIsBeingProcessedMessage( true );

		await this.api.sendMessage( message, this.sessionManager.sessionId );
	}

	public receiveMessage( message: ChatHistoryAiMessage ): void {
		this.finalizeStreamEvent( message );
	}

	private onStreamError( error: string ): void {
		this.dom.setAnswerIsBeingProcessedMessage( false );
		if ( this.currentMessage ) {
			this.dom.unappendMessage( this.currentMessage )
			this.currentMessage = null;
		}
		this.dom.clearMessageInput();
		this.dom.enableSendMessages();
		this.throwError( error );
	}

	private onStreamEventDelta( delta: string ): void {
		if ( !this.currentMessage ) {
			this.currentMessage = this.messageFactory.createReceivedMessage();
			this.currentMessage.startStreaming();
			this.currentMessage.on( MessageReceived.STREAM_FINISHED_EVENT, this.onStreamFinished.bind( this ) );
			this.dom.setAnswerIsBeingProcessedMessage( false );
		}

		this.currentMessage.appendText( delta );
	}

	private onStreamFinished(): void {
		this.dom.clearMessageInput();
		this.dom.enableSendMessages();

		this.currentMessage.scrollToBottom();
		this.sessionManager.addReceivedMessage( this.currentMessage );
		this.currentMessage = null;
	}

	private finalizeStreamEvent( response: ChatHistoryAiMessage ): void {
		if ( !this.currentMessage ) {
			return;
		}

		this.dom.showFollowUpOptions( response.follow_up_questions );
		this.currentMessage.stopStreaming( response );
	}

	private onSocketError( message: string ): void {
		this.throwError( message, true );
	}

	private onSocketClose(): void {
		this.dom.disableSendMessages();
	}

	async onMessageExportRequested( message: MessageReceived ) {
		// If successful, onMessageTopic will be called with the response
		const text = MessageParser.parseMarkup( message.message ).replace( /<[^>]*>/g, '' );
		this.dom.showLoadingIndicator();
		let topic: string;
		try {
			topic = await this.api.requestMessageTopic( text );
			if ( !topic ) {
				topic = "Chat message - " + new Date().toLocaleString();
			}
		} catch ( error ) {
			this.dom.hideLoadingIndicator();
			this.throwError( mw.message( 'chatbot-api-error-topic-api-label' ).text() );
		}

		try {
			const username = mw.user.getName();
			const pageTitle = mw.Title.makeTitle( 2, username + '/Bot/' + topic );
			await this.saveToWikipage( message, pageTitle.getPrefixedDb() );
			const statusMessage = this.messageFactory.createReceivedMessage(
				mw.message( 'chatbot-save-page-saved-label', pageTitle.getPrefixedDb(), topic ).parse() );
			statusMessage.element.classList.add( 'chatbot-saved-message' );
			Dom.scroll( message.element );
			this.dom.hideLoadingIndicator();
		} catch ( error ) {
			this.dom.hideLoadingIndicator();
			this.throwError( mw.message( 'chatbot-api-error', error ).text() );
		}
	}

	private async saveToWikipage( message: MessageReceived, pageTitle: string ): Promise<void> {
		try {
			const mwApi = new mw.Api();
			let text = await window.ext.chatbot.util.message.convertToWikitext( message.message )
			text  += this.getResourcesText( message );

			await mwApi.postWithToken( 'csrf', {
				action: 'edit',
				title: pageTitle,
				text: text,
				contentmodel: 'wikitext'
			} );
		} catch ( error ) {
			this.throwError( mw.message( 'chatbot-api-error', error.message ).text() );
		}

	}

	private getResourcesText( message: MessageReceived ): string {
		const sources: Source[] = message.sources;
		if ( !sources || sources.length === 0 ) {
			return '';
		}
		let text = mw.message( 'chatbot-save-page-resources-label' ).text() + '\n\n';
		for( const i in sources ) {
			text = text + '[[' + sources[i].title.getPrefixedDb() + ']]' + '\n';
		}
		return "\n\n" + text;
	}

	private async exportChat( format: string ): Promise<void> {
		const chatHistory = this.sessionManager.getRawChatHistory();

		if ( !chatHistory || chatHistory.length === 0 ) {
			return this.throwError( mw.message( 'chatbot-export-error' ).text() );
		}

		const dateString = new Date().toLocaleDateString() + "_" + new Date().toLocaleTimeString( [], { timeStyle: 'short' } );

		try {
			chatHistory.forEach( ( item: ChatHistoryMessage ) => {
				if ( !item.content ) {
					item.content = '';
				}
				item.content = MessageParser.parseMarkup( item.content );
			} );
			this.api.downloadChatHistory( chatHistory, `ExportHdP-Chatbot_${ dateString }`, format );
		} catch ( error ) {
			this.throwError( mw.message( 'chatbot-api-error', error.message ).text() );
		}
	}

	private setAutoScrolling( event: WheelEvent ): void {
		if ( !this.currentMessage ) {
			return;
		}

		const scrolledDown = event.deltaY > 0;
		if ( scrolledDown ) {
			const element = event.currentTarget as HTMLElement;
			const buffer = 600;
			const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + buffer;

			if ( atBottom ) {
				this.currentMessage.allowScrolling();

				return;
			}
		}

		this.currentMessage.preventScrolling();
	}

	private throwError( message: string, clearOld = false ): void {
		const localized = mw.message( 'chatbot-external-error-' + message );
		if ( localized.exists() ) {
			message = localized.text();
		}
		this.dom.displayErrorMessage( message, clearOld );
		throw new Error( message );
	}
}

function onReady() {
	new ChatBot(
		mw.config.get( 'chatBotServiceUrl' ) as string
	);
}

if ( document.readyState !== "loading" ) {
	onReady();
} else {
	document.addEventListener( "DOMContentLoaded", onReady );
}
