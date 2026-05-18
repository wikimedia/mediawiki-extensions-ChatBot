import Message from "./Message";
import Source, { SourceData } from "./Source";
import MessageParser from "../utils/MessageParser";
import { ChatHistoryAiMessage } from "../SessionManager";
import SourceFactory from "../utils/SourceFactory";
import Dom from "../utils/Dom";

declare const mw: any;

declare global {
	interface Window {
		ext: { chatbot: any }
	}
}

export default class MessageReceived extends Message {
	private static readonly STREAM_DELAY: number = 30;

	private static readonly STREAMING_ATTR = 'streaming';

	public static readonly STREAM_FINISHED_EVENT: string = "streamFinished";

	public static readonly EVENT_EXPORT_REQUESTED: string = "exportRequested";

	public sourcesData: SourceData[];

	public sources: Source[];

	public constructor( message: string | null, timestamp: string ) {
		super( message, timestamp );

		this.messageText.setAttribute( 'aria-live', 'assertive' );
	}

	public appendText( text: string ) {
		if ( text === '' ) {
			text = '\n';
		}
		this.message += text;
		this.messageText.innerHTML = MessageParser.parseMarkup( this.message );
		this.scrollToBottom();
	}

	public startStreaming(): void {
		this.messageText.setAttribute( 'aria-busy', 'true' );
		this.addAttribute( MessageReceived.STREAMING_ATTR );
		this.message = '';
	}

	public stopStreaming( response: ChatHistoryAiMessage ): void {
		this.removeAttribute( MessageReceived.STREAMING_ATTR );
		this.allowScrolling();

		this.messageText.setAttribute( 'aria-busy', 'false' );
		this.patchUpSyntaxIfNecessary( response.content );

		this.emit( MessageReceived.STREAM_FINISHED_EVENT );
		this.appendMessageButtons();
		this.appendSourceList( response.sources );
		this.scrollToBottom();
	}

	/**
	 * Due to streaming being done in chunks (duh), it's possible that some markup
	 * is left unclosed or otherwise broken. This method checks if the final content
	 * is different from the streamed content, and if so, fixes it up
	 *
	 * @param fullContent
	 * @private
	 */
	private patchUpSyntaxIfNecessary( fullContent: string ): void {
		const parsed = MessageParser.parseMarkup( fullContent );
		if ( parsed !== this.messageText.innerHTML ) {
			this.message = fullContent;
			this.messageText.innerHTML = parsed;
		}
	}

	public appendSourceList( sourcesData: SourceData[] ): void {
		this.sourcesData = sourcesData;
		if ( sourcesData.length === 0 ) {
			return;
		}

		const container = document.createElement( 'div' );
		container.classList.add( 'reference-list' );

		const list = document.createElement( 'div' );
		list.classList.add( 'reference-list-items' );

		const expandButton = document.createElement( 'button' );
		expandButton.setAttribute( 'aria-expanded', "false" );
		expandButton.classList.add( 'expand-button' );
		expandButton.classList.add( 'cdx-button' );
		expandButton.classList.add( 'cdx-button--action-progressive' );
		expandButton.classList.add( 'cdx-button--weight-quiet' );
		expandButton.textContent = mw.message( 'chatbot-reference-list-button' ).text();
		expandButton.addEventListener( 'click', () => {
			container.classList.toggle( 'expanded' );
			if ( !container.classList.contains( 'expanded' ) ) {
				expandButton.setAttribute( 'aria-expanded', "false" );
				Dom.scroll( expandButton, "end" );
			} else {
				expandButton.setAttribute( 'aria-expanded', "true" );
			}
		} );

		container.appendChild( expandButton );
		container.appendChild( list );

		this.sources = this.sourcesData.map( SourceFactory.createFromJson ) as Source[];

		this.sources.sort( ( a, b ) => a.docRefId - b.docRefId ).forEach( ( reference ) => {
			list.insertAdjacentHTML( 'beforeend', reference.getLinkListRefId() );
			list.insertAdjacentHTML( 'beforeend', reference.getLinkListItem() );
		} );

		this.messageTextContainer.appendChild( container );
	}

	public appendMessageButtons(): void {
		const btns = document.createElement( 'div' );
		btns.classList.add( 'message-buttons' );
		const copyBtn = this.createCopyButton();
		copyBtn.setAttribute( "title", mw.message( 'chatbot-copy-button-title' ).text() );
		btns.appendChild( copyBtn );

		const saveAsPageBtn = this.createSaveAsPageButton();
		saveAsPageBtn.setAttribute( 'title', mw.message( 'chatbot-save-page-button-title' ).text() );
		btns.appendChild( saveAsPageBtn );
		this.messageContainer.appendChild( btns );
	}

	public appendSavedPageLink( href: string, title: string ): void {
		const pageLink = document.createElement( 'a' );
		pageLink.classList.add( 'chatbot-saved-msg-link' );
		pageLink.textContent = 'Message saved to ' + title;
		pageLink.setAttribute( 'href', href );
		
		this.messageContainer.appendChild( pageLink );
	}

	private createCopyButton(): HTMLElement {
		const buttonCopy = document.createElement( 'button' );
		buttonCopy.classList.add( 'copy' );
		buttonCopy.classList.add( 'cdx-button' );
		buttonCopy.classList.add( 'cdx-button--icon-only' );
		buttonCopy.classList.add( 'cdx-button--weight-quiet' );

		const buttonIcon = document.createElement( 'span' );
		buttonIcon.classList.add( 'cdx-button__icon' );
		buttonIcon.classList.add( 'cdx-css-icon--copy' );
		buttonIcon.classList.add( 'chatbot-btn-icon' );
		buttonIcon.setAttribute( 'aria-hidden', 'true' );
		buttonCopy.appendChild( buttonIcon );

		buttonCopy.addEventListener( 'click', async () => {
			const text = await window.ext.chatbot.util.message.convertToWikitext( this.message )

			navigator.clipboard.write( [
				new ClipboardItem({
					'text/html': new Blob([this.messageText.innerHTML], { type: 'text/html' }),
					'text/plain': new Blob([text], { type: 'text/plain' })
				})
			]);
			mw.notify( mw.message( 'chatbot-copy-to-clipboard' ).text() );
		} );

		return buttonCopy;
	}

	private createSaveAsPageButton(): HTMLElement {
		const buttonSavePage = document.createElement( 'button' );
		buttonSavePage.classList.add( 'copy' );
		buttonSavePage.classList.add( 'cdx-button' );
		buttonSavePage.classList.add( 'cdx-button--icon-only' );
		buttonSavePage.classList.add( 'cdx-button--weight-quiet' );

		const buttonIcon = document.createElement( 'span' );
		buttonIcon.classList.add( 'cdx-button__icon' );
		buttonIcon.classList.add( 'cdx-css-icon--savepage' );
		buttonIcon.classList.add( 'chatbot-btn-icon' );
		buttonIcon.setAttribute( 'aria-hidden', 'true' );
		buttonSavePage.appendChild( buttonIcon );

		buttonSavePage.addEventListener( 'click', () => {
			this.emit( MessageReceived.EVENT_EXPORT_REQUESTED, this );
		} );

		return buttonSavePage;
	}
}
