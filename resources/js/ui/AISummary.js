ext = ext || {};
ext.chatbot = ext.chatbot || {};
ext.chatbot.ui = ext.chatbot.ui || {};

ext.chatbot.ui.AISummary = function ( cfg ) {
	cfg = cfg || {};
	ext.chatbot.ui.AISummary.super.call( this, cfg );
	this.searchTerm = cfg.searchTerm;
	this.results = cfg.results || [];
	
	this.serviceUrl = mw.config.get( 'chatBotServiceUrl' );
	this.summary = '';
	this.streamMetadata = [];
	this.$element.addClass( 'chatbot-search-ai-summary' );
	this.$element.addClass( 'loading' );

	this.setHeading();
	this.showLoadingSkeleton();
	this.pendingMessage = '';
	this.inhibitReception = false;

	mw.loader.using( 'ext.chatbot.util' ).then( () => {
		ext.chatbot.util.searchSummary(
			this.searchTerm, this.results,
			( ch ) => { this.processQueryAnswer( ch ); }
		);
	} );
};

OO.inheritClass( ext.chatbot.ui.AISummary, OO.ui.Widget );

ext.chatbot.ui.AISummary.prototype.processQueryAnswer = function ( response ) {
	if ( this.inhibitReception ) {
		return;
	}
	if ( response.error ) {
		this.showEmpty( response.message );
		return;
	}

	this.$element.removeClass( 'loading' );
	this.initContainer();
	let parsed = '';
	if ( response.eventType === 'packet' || response.eventType === 'message' ) {
		let text = response.message.toString();
		if ( text === '' ) {
			text = '\n';
		}
		this.pendingMessage += text;
		if ( this.pendingMessage.length < 15) {
			return;
		}
		if ( this.isNoSummary( this.pendingMessage ) ) {
			return;
		}

		parsed = marked.parse( this.pendingMessage, { async: false } );
		this.$summaryDiv.html( parsed );
	} else if ( response.eventType === 'metadata' ) {
		if ( response.metadata.status !== 'OK' ) {
			this.showError( response.metadata.reason );
			return;
		}
		if ( this.isNoSummary( response.metadata.content ) ) {
			return;
		}
		parsed = marked.parse( response.metadata.content, { async: false } );
		this.$summaryDiv.html( parsed );
		this.setExpandButton();
	}
};

ext.chatbot.ui.AISummary.prototype.isNoSummary = function ( message ) {
	if ( message.includes( 'nosummary' ) ) {
		this.inhibitReception = true;
		this.showEmpty();
		return true;
	}
	return false;
};

ext.chatbot.ui.AISummary.prototype.showEmpty = function () {
	this.$content = null;
	this.$element.empty();
	this.$element.removeClass( 'loading' );
	const $emptyCnt = $( '<div>' ).addClass( 'chatbot-search-ai-summary-empty' );
	$emptyCnt.append( $( '<span>' ).addClass( 'chatbot-icon-ai' ) );
	$emptyCnt.append( $( '<span>' ).addClass( 'chatbot-search-ai-summary-empty-body' ).text(
		mw.message( 'chatbot-search-ai-summary-default-empty-label' ).text()
	) );
	this.$element.append( $emptyCnt );
};

ext.chatbot.ui.AISummary.prototype.initContainer = function () {
	if ( this.$content ) {
		return;
	}
	this.$element.empty();
	this.setHeading();
	this.$content = $( '<div>' ).addClass( 'chatbot-search-ai-summary-content' );
	this.$element.append( this.$content );
	this.$summaryCnt = $( '<div>' ).addClass( 'chatbot-search-ai-summary-answer' );
	this.$summaryDiv = $( '<div>' ).addClass( 'chatbot-search-ai-summary-answer-inner' );
	this.$summaryCnt.append( this.$summaryDiv );
	$( this.$summaryCnt ).addClass( 'short' );
	this.$content.append( this.$summaryCnt );
};

ext.chatbot.ui.AISummary.prototype.showLoadingSkeleton = function () {
	if ( !this.$skeleton ) {
		this.$skeleton = $( '<div>' ).addClass( 'chatbot-search-ai-summary-skeleton' );
	}
	this.$element.append( this.$skeleton );
};

ext.chatbot.ui.AISummary.prototype.showError = function ( error ) {
	console.log( 'chatbot-external-error-' + error.trim()  );
	const msg = mw.message( 'chatbot-external-error-' + error );
	if ( msg.exists() ) {
		error = msg.text();
	}
	const $error = $( '<div>' ).addClass( 'chatbot-search-ai-summary-error' ).text( error );
	$( this.$summaryCnt ).removeClass( 'short' );
	this.$element.append( $error );
};

ext.chatbot.ui.AISummary.prototype.setHeading = function () {
	const $heading = $( '<div>' ).addClass( 'chatbot-search-ai-summary-header' );
	const $iconCnt = $( '<span>' ).addClass( 'chatbot-icon-ai' );
	const $headerCnt = $( '<span>' ).addClass( 'chatbot-search-header' ).text(
		mw.message( 'chatbot-search-ai-result-summary-label' ).text() );
	$heading.append( $iconCnt );
	$heading.append( $headerCnt );
	this.$element.append( $heading );
};

ext.chatbot.ui.AISummary.prototype.setExpandButton = function () {
	if ( this.$summaryDiv.outerHeight() < 120 ) {
		return;
	}
	this.expandButton = new OO.ui.ButtonWidget( {
		framed: false,
		indicator: 'down',
		label: mw.message( 'chatbot-search-ai-result-expand-btn-label' ).text()
	} );
	this.expandButton.connect( this, {
		click: () => {
			this.expandButton.toggle();
			$( this.$summaryCnt ).removeClass( 'short' );
		}
	} );
	this.$content.append( this.expandButton.$element );
};
