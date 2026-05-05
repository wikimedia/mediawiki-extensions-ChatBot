import EventEmitter from "events";
import ClosePopup from "../model/ClosePopup";
import Message from "../model/Message";
import BrowserStorage from "./BrowserStorage";
import Accessibility from "./Accessibility";
import SizePopup from "../model/SizePopup";

declare const mw: any;
declare const blueSpiceDiscovery: any;
declare const discovery_cookie: any;

export enum ChatSizeMode {
	Small = "small",
	Medium = "medium",
	Large = "large"
}

export default class Dom extends EventEmitter {
	public static readonly EVENT_OPEN_CHAT: string = "openChat";

	public static readonly EVENT_CLOSE_CHAT: string = "closeChat";

	public static readonly EVENT_MINIMIZE_CHAT: string = "minimizeChat";

	public static readonly EVENT_SEND_MESSAGE: string = "sendMessage";

	public static readonly EVENT_MOUSE_WHEEL_USED: string = "wheelUsed";

	public static readonly EVENT_FOLLOWUP: string = "followup";

	private chat: HTMLElement;

	private chatBody: HTMLElement;

	private followUpPanel: HTMLElement;

	private restoreSessionMessage: HTMLElement;

	private chatContainer: HTMLElement;

	private statusMessageContainer: HTMLElement;

	private errorMessageContainer: HTMLElement;

	private dismissErrorButton: HTMLElement;

	private sendButton: HTMLButtonElement;

	private maximizeButton: HTMLButtonElement;

	private minimizeButton: HTMLButtonElement;

	private resizeButton: HTMLButtonElement;

	private closeButton: HTMLButtonElement;

	private mediumSizeContentWrapper: HTMLElement;

	private messageInput: HTMLInputElement;

	private answerProcessingMessage: HTMLElement;

	private loadingIndicator: HTMLElement;

	private chatBanner: HTMLElement;

	private closeDialog: ClosePopup;

	private resizeDialog: SizePopup;

	private mode: ChatSizeMode;

	private browserStorage: BrowserStorage;

	private accessibility: Accessibility;

	public constructor() {
		super();
		this.browserStorage = new BrowserStorage();
		this.initDomElements();
		this.accessibility = new Accessibility( this.statusMessageContainer, this.chatContainer )
		this.mode = ChatSizeMode.Small;
	}

	public appendMessage( message: Message ): void {
		this.chatBody.appendChild( message.element );
	}

	public unappendMessage( message: Message ): void {
		this.chatBody.removeChild( message.element );
	}

	public appendError( error: string ): void {

	}

	public disableSendMessages(): void {
		this.sendButton.setAttribute( 'disabled', 'disabled' );
		this.messageInput.setAttribute( 'disabled', 'disabled' );
	}

	public enableSendMessages(): void {
		this.sendButton.removeAttribute( 'disabled' );
		this.messageInput.removeAttribute( 'disabled' );

		this.messageInput.focus();

		this.messageInput.style.height = 'auto';
		this.messageInput.style.height = Math.min( this.messageInput.scrollHeight, 140 ) + 'px';
	}

	public displayErrorMessage( message: string, clearOld = false ): void {
		const errorMessage = document.createElement( 'div' );
		errorMessage.classList.add( 'error' );
		errorMessage.innerText = message;
		if ( clearOld ) {
			this.errorMessageContainer.innerHTML = '';
		}
		this.errorMessageContainer.appendChild( errorMessage );
		this.errorMessageContainer.style.display = 'block';
		this.hideRestoreSessionMessage();
	}

	public clearErrors(): void {
		this.errorMessageContainer.innerHTML = '';
		this.errorMessageContainer.style.display = 'none';
	}

	public hideBanner(): void {
		this.chatBanner.classList.add( 'invisible' );
	}

	public showBanner(): void {
		this.chatBanner.classList.remove( 'invisible' );
	}

	public clearMessageInput(): void {
		this.messageInput.value = '';
	}

	public showLoadingIndicator(): void {
		this.loadingIndicator.classList.remove( 'hidden' );
		Dom.scroll( this.loadingIndicator );
	}

	public hideLoadingIndicator(): void {
		this.loadingIndicator.classList.add( 'hidden' );
	}

	public showRestoreSessionMessage(): void {
		this.restoreSessionMessage.classList.remove( 'hidden' );
		this.accessibility.setStatus( mw.message( 'chatbot-restore-session-text' ).text() );
	}

	public hideRestoreSessionMessage(): void {
		this.restoreSessionMessage.classList.add( 'hidden' );
	}

	public clearChat(): void {
		this.chatBody.innerHTML = '';
		this.messageInput.value = '';
		this.clearFollowUpOptions();
	}

	public getChatBody(): HTMLElement {
		return this.chatBody;
	}

	public setAnswerIsBeingProcessedMessage( show: boolean ) {
		if ( show ) {
			this.answerProcessingMessage = document.createElement( 'div' );
			this.answerProcessingMessage.classList.add( 'answer-processing' );
			this.chatBody.appendChild( this.answerProcessingMessage );
			Dom.scroll( this.answerProcessingMessage, "end" );
			this.accessibility.setStatus( mw.message( 'chatbot-answer-processing' ).text() );

			return
		}

		this.answerProcessingMessage.remove();
	}

	public toggleChat(): void {
		if ( this.chatContainer.classList.contains( 'hidden' ) ) {
			this.maximizeChat();
			return;
		}
		this.minimizeChat();
	}

	public maximizeChat(): void {
		this.chatContainer.classList.remove( 'hidden' );
		//this.maximizeButton.classList.add( 'hidden' );
		this.emit( Dom.EVENT_OPEN_CHAT );
		// TODO: Remove if possible to attach to event fired above
		const event = new Event( Dom.EVENT_OPEN_CHAT );
		window.dispatchEvent( event );
		this.browserStorage.setMaximized();
		this.accessibility.enableFocusTrap( this.resizeButton, this.sendButton );
	}

	public minimizeChat(): void {
		this.chatContainer.classList.add( 'hidden' );
		this.maximizeButton.classList.remove( 'hidden' );
		this.clearChat();
		this.setMode( ChatSizeMode.Small );
		this.browserStorage.unsetMaximized();

		this.emit( Dom.EVENT_MINIMIZE_CHAT );
		// TODO: Remove is possible to attach to event fired above
		const event = new Event( Dom.EVENT_MINIMIZE_CHAT );
		window.dispatchEvent( event );
		this.accessibility.disableFocusTrap();
	}

	public setChatButtonActive( isActive: boolean ): void {
		if ( isActive ) {
			this.maximizeButton.classList.add( 'active' );
		} else {
			this.maximizeButton.classList.remove( 'active' );
		}
	}

	public setMode( mode: ChatSizeMode ): void {
		if ( this.mode === mode ) {
			return;
		}

		this.browserStorage.setMode( mode );

		if ( window.hasOwnProperty( 'blueSpiceDiscovery' ) && mode !== ChatSizeMode.Small ) {
			this.preserveSidebarState();
			blueSpiceDiscovery.ui.hideSidebarPrimary();
			blueSpiceDiscovery.ui.hideSidebarSecondary();
		}

		if ( mode === ChatSizeMode.Medium ) {
			this.chat.classList.add( 'medium' );
			this.chat.classList.remove( 'large' );
			this.mode = ChatSizeMode.Medium;
			this.toggleContentAndChatSideBySide( true );
			document.body.style.overflow = 'auto';
			this.accessibility.setStatus( mw.message( 'chatbot-status-mode-side-by-side' ).text() );

			return;
		}

		if ( mode === ChatSizeMode.Small ) {
			if ( window.hasOwnProperty( 'blueSpiceDiscovery' ) ) {
				this.restoreSidebarState();
			}
			this.toggleContentAndChatSideBySide( false );
			this.chat.classList.remove( 'medium' );
			this.chat.classList.remove( 'large' );
			document.body.style.overflow = 'auto';
			this.mode = ChatSizeMode.Small;
			this.accessibility.setStatus( mw.message( 'chatbot-status-mode-normal' ).text() );

			return;
		}

		this.toggleContentAndChatSideBySide( false );
		this.chat.classList.remove( 'medium' );
		this.chat.classList.add( 'large' );
		document.body.style.overflow = 'hidden';
		this.mode = ChatSizeMode.Large;
		this.accessibility.setStatus( mw.message( 'chatbot-status-mode-full-screen' ).text() );
	}

	public showFollowUpOptions( followUps: string[] ): void {
		this.followUpPanel.classList.remove( 'hidden' );
		this.followUpPanel.innerHTML = ''; // Clear previous options
		if ( typeof followUps === 'string' ) {
			followUps = (followUps as string).split(';');
		}
		if ( followUps.length < 1 ) {
			return;
		}

		followUps.forEach( ( followUp: string ) => {
			const button = document.createElement( 'button' );
			button.classList.add( 'followup-option' );
			button.innerText = followUp;
			button.addEventListener( 'click', () => {
				this.emit( Dom.EVENT_FOLLOWUP, followUp );
			} );
			this.followUpPanel.appendChild( button );
		} );
	}

	public clearFollowUpOptions(): void {
		this.followUpPanel.classList.add( 'hidden' );
		this.followUpPanel.innerHTML = '';
	}

	private preserveSidebarState(): void {
		const preserve_obj = {};

		const sbPriState = discovery_cookie.get( 'sb-pri-cnt' );
		Object.assign( preserve_obj, { 'sb-pri-cnt': sbPriState } );

		const sbSecState = discovery_cookie.get( 'sb-sec-cnt' );
		Object.assign( preserve_obj, { 'sb-sec-cnt': sbSecState } );

		discovery_cookie.set(
			'chatbotPreserve',
			JSON.stringify( preserve_obj )
		);
	}

	private restoreSidebarState(): void {
		const preserve = discovery_cookie.get( 'chatbotPreserve' );
		let preserve_obj = {};
		if ( preserve ) {
			preserve_obj = JSON.parse( preserve );

			for ( const id in preserve_obj ) {
				const sbState = discovery_cookie.get( id );
				if ( sbState === 'false' ) {
					blueSpiceDiscovery.ui.toggleSidebar( id, preserve_obj[ id ] );
				} else {
					blueSpiceDiscovery.ui.toggleSidebar( id, sbState );
				}
			}
		}
	}

	private initFollowUpPanel(): void {
		this.followUpPanel = document.getElementById( 'followUpPanel' ) as HTMLElement;
	}

	public static scroll( element: HTMLElement, block: ScrollLogicalPosition = "start" ): void {
		element.scrollIntoView( { behavior: 'instant', block: block } );
	}

	private onSendMessage(): void {
		this.emit( Dom.EVENT_SEND_MESSAGE, this.messageInput.value );
	}

	private resizeChat(): void {
		if ( !this.resizeDialog ) {
			this.resizeDialog = new SizePopup( this.resizeButton.parentElement, this.resizeButton, this.mode );
			this.resizeDialog.on( SizePopup.RESIZE, this.onResizeChat.bind( this ) );
		}
		this.resizeDialog.toggle();
		this.resizeDialog.updateActive( this.mode );
	}

	private onResizeChat( mode: ChatSizeMode ): void {
		this.setMode( mode );
	}

	private toggleContentAndChatSideBySide( active: boolean ): void {
		if ( active ) {
			document.body.classList.add( 'chatbot-medium-content-wrapper' );
		} else {
			document.body.classList.remove( 'chatbot-medium-content-wrapper' );
		}
	}

	private onCloseChat(): void {
		if ( !this.closeDialog ) {
			this.closeDialog = new ClosePopup( this.closeButton.parentElement, this.closeButton );
			this.closeDialog.on( ClosePopup.CLOSE, this.closeChat.bind( this ) );
		}
		this.closeDialog.toggle();
	}

	private closeChat(): void {
		this.minimizeChat();
		this.emit( Dom.EVENT_CLOSE_CHAT );
	}

	private onDismissError(): void {
		this.errorMessageContainer.style.display = 'none';
	}

	private initDomElements(): void {
		this.maximizeButton = document.getElementById( 'maximizeChat' ) as HTMLButtonElement;
		this.maximizeButton.addEventListener( 'click', this.toggleChat.bind( this ) );
		if ( this.browserStorage.getRunningSession() ) {
			this.setChatButtonActive( true );
		}

		this.minimizeButton = document.getElementById( 'minimizeChat' ) as HTMLButtonElement;
		this.minimizeButton.addEventListener( 'click', this.minimizeChat.bind( this ) );

		this.resizeButton = document.getElementById( 'resizeChat' ) as HTMLButtonElement;
		this.resizeButton.addEventListener( 'click', this.resizeChat.bind( this ) );

		this.closeButton = document.getElementById( 'closeChat' ) as HTMLButtonElement;
		this.closeButton.addEventListener( 'click', this.onCloseChat.bind( this ) );

		this.sendButton = document.getElementById( 'sendMessage' ) as HTMLButtonElement;
		this.sendButton.addEventListener( 'click', this.onSendMessage.bind( this ) );

		this.dismissErrorButton = document.getElementById( 'dismissError' ) as HTMLElement;
		this.dismissErrorButton.addEventListener( 'click', this.onDismissError.bind( this ) );

		this.messageInput = document.getElementById( 'messageInput' ) as HTMLInputElement;
		this.messageInput.addEventListener( "keydown", ( event: KeyboardEvent ) => {
			if ( event.key === 'Enter' && !event.ctrlKey ) {
				event.preventDefault();
				this.onSendMessage();
				return;
			}
			// Set the height to the scrollHeight up to a maximum value
			this.messageInput.style.height = Math.min( this.messageInput.scrollHeight, 140 ) + 'px';

			if ( event.key === 'Enter' && event.ctrlKey ) {
				event.preventDefault();
				const start = this.messageInput.selectionStart;
				const end = this.messageInput.selectionEnd;
				const value = this.messageInput.value;

				this.messageInput.value = value.substring( 0, start ) + "\n" + value.substring( end );
				this.messageInput.selectionStart = this.messageInput.selectionEnd = start + 1;
				return;
			}
		} );

		this.messageInput.addEventListener( "input", () => {
			if ( this.messageInput.scrollHeight < 80 ) {
				return;
			}
			this.messageInput.style.height = 'auto';
			// Set the height to the scrollHeight up to a maximum value
			this.messageInput.style.height = Math.min( this.messageInput.scrollHeight, 140 ) + 'px';
		} );
		// Make input not resizable.  By default 3 rows, max 6 rows, then scroll
		this.messageInput.style.resize = 'none';
		this.messageInput.setAttribute( 'rows', '3' );

		this.chat = document.getElementById( 'chat' ) as HTMLElement;

		this.chatContainer = document.getElementById( 'chatContainer' ) as HTMLElement;
		this.chatContainer.classList.add( 'hidden' );

		this.chatBody = document.getElementById( 'chatBody' ) as HTMLElement;
		this.chatBody.addEventListener( "wheel", ( event ) => {
			this.emit( Dom.EVENT_MOUSE_WHEEL_USED, event );
		} );

		this.errorMessageContainer = document.getElementById( 'errorMessageContainer' ) as HTMLElement;

		// Use bluespice wcag status container
		this.statusMessageContainer = document.createElement( 'div' ) as HTMLElement;
		this.statusMessageContainer.setAttribute( 'id', 'chatbot-status-cnt' );
		this.statusMessageContainer.classList.add( 'visually-hidden' );
		this.statusMessageContainer.setAttribute( 'role', 'status' );
		this.chat.append( this.statusMessageContainer );

		this.restoreSessionMessage = document.getElementById( 'restoreSessionMessage' ) as HTMLElement;
		this.restoreSessionMessage.classList.add( 'hidden' );

		this.mediumSizeContentWrapper = document.createElement( 'div' ) as unknown as HTMLElement;
		this.mediumSizeContentWrapper.classList.add( 'chatbot-medium-content-wrapper' );

		this.loadingIndicator = document.getElementById( 'loadingIndicator' ) as HTMLElement;
		this.loadingIndicator.classList.add( 'hidden' );

		this.initFollowUpPanel();
	}
}
