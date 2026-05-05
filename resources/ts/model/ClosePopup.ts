import Popup from "./Popup";

declare const mw: any;

export default class ClosePopup extends Popup {

	public static readonly CLOSE: string = "close";

	private exportBtn: HTMLButtonElement;

	public constructor( appendTo: HTMLElement, expandButton: HTMLButtonElement ) {
		super( appendTo, expandButton );
		this.dialog.classList.add( 'popup-chatbot-close-cnt' );
		this.dialog.classList.add( 'cdx-popover' );

		super.init( '' );
	}

	protected buildHeader(): HTMLElement {
		const headerCnt = document.createElement( 'header' );
		headerCnt.classList.add( 'popup-header-cnt' );
		headerCnt.classList.add( 'cdx-popover__header' );

		const headerText = document.createElement( 'div' );
		headerText.classList.add( 'cdx-popover__header__title' );
		headerText.textContent = mw.message( 'chatbot-close-popup-header' ).text()
		headerCnt.appendChild( headerText );
		return headerCnt;
	}

	protected buildContent(): HTMLElement {
		const contentCnt = document.createElement( 'div' );
		contentCnt.classList.add( 'popup-body-close-cnt' );
		contentCnt.classList.add( 'cdx-popover__body' );

		const contentOptionsCnt = document.createElement( 'div' );
		contentOptionsCnt.classList.add( 'popup-content-close-cnt' );
		const contentText = document.createElement( 'p' );
		contentText.classList.add( 'popup-content-label' );
		contentText.innerHTML = mw.message( 'chatbot-close-popup-info-label' ).text();
		contentText.setAttribute( 'role', 'alert');
		contentOptionsCnt.appendChild( contentText );

		contentCnt.appendChild( contentOptionsCnt );
		return contentCnt;
	}

	protected buildFooter(): HTMLElement {
		const popupFooterCnt = document.createElement( 'footer' );
		popupFooterCnt.classList.add( 'cdx-popover__footer' );

		const contentBtnCnt = document.createElement( 'div' );
		contentBtnCnt.classList.add( 'popup-btn-export-cnt' );
		contentBtnCnt.classList.add( 'cdx-popover__footer__actions' );
		contentBtnCnt.classList.add( 'cdx-popover__footer__actions--horizontal' );

		const cancelBtn = document.createElement( 'button' );
		cancelBtn.classList.add( 'cdx-button' );
		cancelBtn.classList.add( 'cdx-button--action-default' );
		cancelBtn.classList.add( 'cdx-button--weight-normal' );
		cancelBtn.classList.add( 'cdx-button--size-medium' );
		cancelBtn.classList.add( 'cdx-button--framed' );
		cancelBtn.classList.add( 'cdx-popover__footer__default-action' );
		cancelBtn.textContent = mw.message( 'chatbot-close-popup-cancel-btn-label' ).text();
		cancelBtn.addEventListener( 'click', this.hide.bind( this ) );
		contentBtnCnt.appendChild( cancelBtn );

		const closeBtn = document.createElement( 'button' );
		closeBtn.classList.add( 'cdx-button' );
		closeBtn.classList.add( 'cdx-button--action-progressive');
		closeBtn.classList.add( 'cdx-button--weight-primary' );
		closeBtn.classList.add( 'cdx-button--size-medium' );
		closeBtn.classList.add( 'cdx-button--framed' );
		closeBtn.classList.add( 'cdx-popover__footer__primary-action' );
		closeBtn.textContent = mw.message( 'chatbot-close-popup-close-btn-label' ).text();
		closeBtn.addEventListener( 'click', this.onClose.bind( this ) );
		contentBtnCnt.appendChild( closeBtn );

		popupFooterCnt.appendChild( contentBtnCnt );
		return popupFooterCnt;
	}

	private onClose(): void {
		this.hide();
		this.emit( ClosePopup.CLOSE );
	}
}
