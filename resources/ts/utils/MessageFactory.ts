import Message from "../model/Message";
import MessageReceived from "../model/MessageReceived";
import Dom from "./Dom";

declare const mw: any;

export default class MessageFactory {
	private readonly dom: Dom;

	private static readonly GREETING_ATTR = 'greeting';

	public constructor( dom: Dom ) {
		this.dom = dom;
	}

	public createSentMessage( messageText: string, isoTimestamp: string = new Date().toISOString() ): Message {
		const message = new Message( messageText, isoTimestamp );
		message.addClass( 'sent' );

		this.dom.appendMessage( message );

		return message;
	}

	public createReceivedMessage(
		messageText: string | null = null,
		isoTimestamp: string = new Date().toISOString()
	): MessageReceived {
		const message = new MessageReceived( messageText, isoTimestamp );
		message.addClass( 'received' );

		this.dom.appendMessage( message );

		return message;
	}

	public createGreetingMessage(): void {
		const message = new Message( mw.message( 'chatbot-greeting' ).text(), new Date().toISOString() );
		message.addClass( 'received' );
		message.addAttribute( MessageFactory.GREETING_ATTR );

		this.dom.appendMessage( message );
	}

	public createErrorMessage( error: string ): void {
		const message = new Message( error, new Date().toISOString() );
		this.dom.appendMessage( message );
	}
}
