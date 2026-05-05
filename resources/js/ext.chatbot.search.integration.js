$( () => {
	if ( !window.chatbotSearchHookInitialized ) {
		window.chatbotSearchHookInitialized = true;

		if ( !ext.chatbot.util.isEnabled() ) {
			return;
		}
		let aiSummaryInstance = null;
		let $aiContainerCnt = null;

		function hideSummary() {
			if ( $aiContainerCnt ) {
				$aiContainerCnt.empty();
			}
		}

		mw.hook( 'bs.extendedsearch.searchcenter.execSearch' ).add( ( $searchPanel, query ) => {
			hideSummary();
		} );

		mw.hook( 'bs.extendedsearch.searchcenter.getResults' ).add( async ( $searchPanel, response, query ) => {
			hideSummary();
			if ( response.exception || response.total === 0 ) {
				return;
			}
			if ( !await ext.chatbot.util.getConfigItem( 'searchSummaryEnabled' ) ) {
				return;
			}
			const ragResults = [];
			for ( let i = 0; i < response.results.length; i++ ) {
				const result = response.results[i];
				if ( result.rag_id && result.rag_id !== '' ) {
					ragResults.push( result.rag_id );
				}
			}
			if ( ragResults.length === 0 ) {
				return;
			}

			if ( !$aiContainerCnt || !$aiContainerCnt.length ) {
				$aiContainerCnt = $( '<div>' ).attr( 'id', 'chatbot-search-ai-result' );
				$searchPanel.prepend( $aiContainerCnt );
			}

			aiSummaryInstance = new ext.chatbot.ui.AISummary( {
				searchTerm: query.searchTerm,
				results: ragResults
			} );
			$aiContainerCnt.append( aiSummaryInstance.$element );
			aiSummaryInstance.connect( this, {
				error: ( errMsg ) => {
					console.error( 'ChatBot AI Summary: Error occurred', errMsg );
				}
			} );
		} );
	}
} );
