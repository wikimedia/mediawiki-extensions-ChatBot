import EventEmitter from "events";

export default class Popup extends EventEmitter {

	protected dialog: HTMLElement;

	protected closeButton: HTMLButtonElement;

	protected body: HTMLElement;

	protected expandButton: HTMLButtonElement;

	public constructor( appendTo: HTMLElement, expandButton: HTMLButtonElement ) {
		super();

		this.dialog = document.createElement( 'div' );
		this.dialog.classList.add( 'popup-chatbot-cnt' );
		this.dialog.classList.add( 'cdx-popover' );
		this.dialog.hidden = true;

		this.expandButton = expandButton;
		appendTo.append( this.dialog );
	}

	public init( header: string ) {
		this.dialog.appendChild( this.buildHeader( header ) );
		this.dialog.appendChild( this.buildContent() );
		this.dialog.appendChild( this.buildFooter() );

		const popoverArrow = document.createElement( 'div' );
		popoverArrow.classList.add( 'cdx-popover__arrow' );
		this.dialog.appendChild( popoverArrow );
	}

	protected onFocusOut(): void {
		this.hide();
		this.emit( 'cancel' );
	}

	protected buildHeader( header: string ): HTMLElement {
		const headerCnt = document.createElement( 'header' );
		headerCnt.classList.add( 'popup-header-cnt' );
		headerCnt.classList.add( 'cdx-popover__header' );

		const headerText = document.createElement( 'div' );
		headerText.classList.add( 'cdx-popover__header__title' );
		headerText.textContent = header;
		headerCnt.appendChild( headerText );

		const headerBtnCnt = document.createElement( 'div' );
		headerBtnCnt.classList.add( 'cdx-popover__header__button-wrapper' );

		this.closeButton = document.createElement( 'button' );
		this.closeButton.classList.add( 'cdx-button' );
		this.closeButton.classList.add( 'cdx-button--action-default' );
		this.closeButton.classList.add( 'cdx-button--weight-quiet' );
		this.closeButton.classList.add( 'cdx-button--size-medium' );
		this.closeButton.classList.add( 'cdx-button--icon-only' );
		this.closeButton.classList.add( 'cdx-popover__header__close-button' );
		this.closeButton.setAttribute( 'title', mw.message( 'chatbot-close-popup-close-btn-label' ).text() );

		const closeBtnIcon = document.createElement( 'span' );
		closeBtnIcon.classList.add( 'cdx-button__icon' );
		closeBtnIcon.classList.add( 'cdx-css-icon--close' );

		this.closeButton.appendChild( closeBtnIcon );

		this.closeButton.addEventListener( 'click', () => {
			this.hide();
			this.emit( 'cancel' );
		} );

		headerBtnCnt.appendChild( this.closeButton );
		headerCnt.appendChild( headerBtnCnt );
		return headerCnt;
	}

	protected buildContent(): HTMLElement {
		const contentCnt = document.createElement( 'div' );
		contentCnt.classList.add( 'popup-body-cnt' );
		contentCnt.classList.add( 'cdx-popover__body' );
		contentCnt.appendChild( this.getBody() );

		return contentCnt;
	}

	protected buildFooter(): HTMLElement {
		const popupFooterCnt = document.createElement( 'footer' );
		popupFooterCnt.classList.add( 'cdx-popover__footer' );

		return popupFooterCnt;
	}

	public setBody( body: HTMLElement ) {
		this.body = body;
	}

	public getBody(): HTMLElement {
		return this.body;
	}

	public show(): void {
		this.dialog.hidden = false;
		this.expandButton.setAttribute( 'aria-expanded', 'true' );

		document.addEventListener( 'focusin', ( event: FocusEvent ) => {
			const target = event.target as HTMLElement;
			const popup = this.getActivePopup();
			if ( popup && target && !popup.contains( target ) ) {
				this.onFocusOut();
			}
		} );
		document.addEventListener( 'keydown', ( event: KeyboardEvent ) => {
			if ( event.key === 'Escape' ) {
				this.onFocusOut();
			}
		} );
		document.addEventListener( 'mousedown', ( event: MouseEvent ) => {
			const target = event.target as HTMLElement;
			const popup = this.getActivePopup();
			if ( popup && target && !popup.contains( target ) ) {
				this.onFocusOut();
			}
		} );
	}

	protected getActivePopup(): HTMLElement|null {
		const popups = document.querySelectorAll<HTMLElement>( '.popup-chatbot-cnt' );
		const activePopup = Array.from( popups ).find( p => !p.hasAttribute( 'hidden' ) ) || null;
		return activePopup;
	}

	public hide(): void {
		this.dialog.hidden = true;
		this.expandButton.setAttribute( 'aria-expanded', 'false' );
	}

	public isOpen(): boolean {
		return !this.dialog.hidden;
	}

	public toggle(): void {
		if ( this.dialog.hidden ) {
			this.show();
		} else {
			this.hide();
		}
	}

}
