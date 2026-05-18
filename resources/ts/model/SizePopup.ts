import { ChatSizeMode } from "../utils/Dom";
import Popup from "./Popup";

declare const mw: any;

export type SizeAndIcon = {
	size: ChatSizeMode,
	element: HTMLElement
};

export default class SizePopup extends Popup {

	public static readonly RESIZE: string = "resize";

	protected activeSize: ChatSizeMode;

	protected sizeBtns: SizeAndIcon[] = [];

	public constructor( appendTo: HTMLElement, sizeButton: HTMLButtonElement, activeSize: ChatSizeMode ) {
		super( appendTo, sizeButton );
		this.activeSize = activeSize;

		super.init( '' );
	}

	protected buildHeader(): HTMLElement {
		const headerCnt = document.createElement( 'header' );
		headerCnt.classList.add( 'popup-header-cnt' );
		headerCnt.classList.add( 'cdx-popover__header' );

		const headerText = document.createElement( 'div' );
		headerText.classList.add( 'cdx-popover__header__title' );
		headerText.textContent = mw.message( 'chatbot-size-popup-title' ).plain();
		headerCnt.appendChild( headerText );
		return headerCnt;
	}

	protected buildContent(): HTMLElement {
		const contentCnt = document.createElement( 'div' );
		contentCnt.classList.add( 'popup-body-cnt' );
		contentCnt.classList.add( 'cdx-popover__body' );

		const sizeBtnCnt = document.createElement( 'div' );
		sizeBtnCnt.classList.add( 'size-popup-btn-cnt' );

		const fullsizeButton = this.getSizeButton( ChatSizeMode.Large );
		sizeBtnCnt.appendChild( fullsizeButton );

		const midsizeButton = this.getSizeButton( ChatSizeMode.Medium );
		sizeBtnCnt.appendChild( midsizeButton );

		const smallsizeButton = this.getSizeButton( ChatSizeMode.Small );
		sizeBtnCnt.appendChild( smallsizeButton );

		contentCnt.appendChild( sizeBtnCnt );
		return contentCnt;
	}

	private getSizeButton( size: ChatSizeMode ): HTMLElement {
		const sizeButton = document.createElement( 'button' );
		sizeButton.classList.add( 'cdx-button' );
		sizeButton.classList.add( 'cdx-button--icon-only' );
		sizeButton.classList.add( 'cdx-button--weight-quiet' );
		sizeButton.setAttribute( 'title', mw.message( 'chatbot-size-' + size + '-button-title' ).text() );
		sizeButton.setAttribute( 'data-size', size );
		sizeButton.addEventListener( 'click', () => {
			this.hide();
			this.emit( SizePopup.RESIZE, size );
		} );

		const sizeButtonIcon = document.createElement( 'span' );
		sizeButtonIcon.classList.add( 'cdx-button__icon' );
		sizeButtonIcon.classList.add( 'cdx-css-icon--resize-' + size );
		sizeButtonIcon.classList.add( 'chatbot-btn-icon' );

		if ( this.activeSize === size ) {
			sizeButtonIcon.style.backgroundColor = '#36c';
		}
		this.sizeBtns.push( {
			size: size,
			element: sizeButtonIcon
		} );
		sizeButton.appendChild( sizeButtonIcon );
		return sizeButton;
	}

	public updateActive( size: ChatSizeMode ): void {
		for ( const i in this.sizeBtns ) {
			if ( this.sizeBtns[i].size === size ) {
				this.sizeBtns[i].element.style.backgroundColor = '#36c';
			} else {
				this.sizeBtns[i].element.removeAttribute( 'style' );
			}
		}
	}

}
