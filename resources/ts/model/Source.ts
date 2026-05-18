import EventEmitter from "events";

export interface SourceData {
	display_title: string
	identifier: string
}

export default class Source extends EventEmitter {

	public title: mw.Title;

	public url: string;

	public docRefId: number;

	public constructor( data: SourceData, docRefId: number ) {
		super();
		this.title = this.getTitleFromIdentifier( data );
		this.url = this.title.getUrl( '' );
		this.docRefId = docRefId;
	}

	public getInlineLink(): string {
		return this.getLink( `[${ this.docRefId }]` );
	}

	public getLinkListRefId(): string {
		return this.getHtmlLink( `[${ this.docRefId }]` );
	}

	public getLinkListItem(): string {
		return this.getHtmlLink( this.title.getMainText(), 'reference-link' );
	}

	private getLink( text: string ): string {
		return `[${ text }](${ this.url } "${ this.title.getPrefixedText() }")`;
	}

	private getHtmlLink( text: string, cls?: string ): string {
		const classes = cls ? [ cls ] : [];
		if ( this.title.exists() === false ) {
			classes.push( 'missing' );
		}
		const clsString = `class="cdx-docs-link ${ classes }"`;

		return `<a title="${ this.title.getPrefixedText() }" ${ clsString } href="${ this.url }">${ text }</a>`;
	}

	private getTitleFromIdentifier( data ) {
		// Identifier is composed of three parts: {wiki_id}|{namespace_id}|{title}
		const parts = ( data.identifier || '' ).split( '|' );
		if ( parts.length !== 3 ) {
			throw new Error( 'Invalid source identifier: ' + data.identifier || '(no identifier)' );
		}
		const wikiId = parts[ 0 ];
		const namespaceId = parts[ 1 ];
		const titleText = parts[ 2 ];
		if ( wikiId !== mw.config.get( 'wgWikiID' ) ) {
			throw new Error( 'Source from different wiki: ' + wikiId );
		}
		return mw.Title.makeTitle( namespaceId, titleText );
	}

	toJSON() {
		return {
			docRefId: this.docRefId,
			url: this.url,
			title: this.title.getPrefixedText()
		};
	}
}
