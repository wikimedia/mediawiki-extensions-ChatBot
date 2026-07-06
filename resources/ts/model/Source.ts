import EventEmitter from "events";
// noinspection ES6UnusedImports
import hook from "types-mediawiki/mw/hook";

export interface SourceData {
	display_title: string
	identifier: string,
	url: string
}

export default class Source extends EventEmitter {

	public title: mw.Title;

	public url: string;

	public docRefId: number;

	private wikiId: string;
	private namespaceId: number;
	private titleText: string;

	public constructor( data: SourceData, docRefId: number ) {
		super();
		this.title = this.getTitleFromIdentifier( data );
		this.url = data.url;
		this.docRefId = docRefId;
	}

	public getInlineLink(): string {
		return this.getLink( `[${ this.docRefId }]` );
	}

	public getLinkListRefId(): HTMLAnchorElement {
		return this.getHtmlLink( `[${ this.docRefId }]` );
	}

	public getLinkListItem(): HTMLAnchorElement {
		return this.getHtmlLink( this.title.getMainText(), 'reference-link' );
	}

	private getLink( text: string ): string {
		return `[${ text }](${ this.url } "${ this.title.getPrefixedText() }")`;
	}

	private getHtmlLink( text: string, cls?: string ): HTMLAnchorElement {
		const classes = cls ? [ cls ] : [];
		if ( this.title.exists() === false ) {
			classes.push( 'missing' );
		}
		const clsString = `cdx-docs-link ${ classes }`;

		const anchor = document.createElement( 'a' );
		anchor.href = this.title.getUrl( '' );
		anchor.title = this.title.getPrefixedText();
		anchor.className = clsString;
		anchor.textContent = text;

		const linkData = {
			wikiId: this.wikiId,
			namespaceId: this.namespaceId,
			titleText: this.titleText,
			url: this.url,
			anchor: anchor,
			title: this.title
		};
		if ( this.wikiId !== mw.config.get( 'wgWikiID' ) ) {
			mw.hook( 'chatbot.source.foreignWikiTitle' ).fire( linkData );
		}
		return linkData.anchor;
	}

	private getTitleFromIdentifier( data: SourceData ): mw.Title {
		// Identifier is composed of three parts: {wiki_id}|{namespace_id}|{title}
		const parts = ( data.identifier || '' ).split( '|' );
		if ( parts.length !== 3 ) {
			throw new Error( 'Invalid source identifier: ' + data.identifier || '(no identifier)' );
		}
		this.wikiId = parts[ 0 ];
		this.namespaceId = Number( parts[ 1 ] );
		this.titleText = parts[ 2 ];
		return mw.Title.makeTitle( this.namespaceId, this.titleText );
	}

	toJSON() {
		return {
			docRefId: this.docRefId,
			url: this.url,
			title: this.title.getPrefixedText()
		};
	}
}
