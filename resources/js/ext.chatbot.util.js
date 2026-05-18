ext = ext || {};
ext.chatbot = ext.chatbot || {};

const getServiceUrl = () => {
	if ( !mw.config.get( 'chatBotServiceUrl' ) ) {
		throw new Error( 'ext.chatbot.directResponse: ChatBot service URL is not configured.' );
	}
	return mw.config.get( 'chatBotServiceUrl' ).replace( /\/+$/, '' ) + '/';
};
const makeServiceCall = async ( path, params ) => {
	params = params || {};
	const serviceUrl = getServiceUrl();
	params.token = await mws.tokenAuthenticator.generateToken( true );

	path = path.replace( /^\/+/, '' );
	params.path = path;

	await mw.loader.using( 'mediawiki.ForeignApi' );

	const api = new mw.ForeignApi( serviceUrl, {
		anonymous: true
	} );
	return await api.get( params );
};

ext.chatbot.util = {
	isEnabled: function() {
		try {
			getServiceUrl();
			return true;
		} catch ( e ) {
			return false;
		}
	},
	directQuestion: async ( question, callback ) => {
		await ext.chatbot.util.executeWebSocketQuery( 'oneoff', {
			msg: question,
		}, callback );
	},
	searchSummary: async ( term, results, callback ) => {
		await ext.chatbot.util.executeWebSocketQuery( 'operation', {
			msg: '',
			meta: {
				action: 'search-summary',
				term: term,
				results: results
			}
		}, callback );
	},
	executeWebSocketQuery: async ( type, payload, callback ) => {
		const serviceUrl = getServiceUrl();
		const token = await mws.tokenAuthenticator.generateToken( true );

		const timeout = setTimeout( () => {
			callback( { eventType: 'error', error: 'Connection timeout' } );
			if ( this.socket ) {
				this.socket.close();
			}
			throw new Error( 'ChatBot direct query: Connection timeout' );
		}, 30000 );
		this.socket = new WebSocket(serviceUrl + '?token=' + token +  '&ping=0');
		this.socket.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.connection) {
				if (data.error) {
					this.socket.close();
					throw new Error('ChatBot direct WS connection error: ' + data.error);
				}

				// Upon successful connection, send the query
				payload.action = type;
				this.socket.send( JSON.stringify( payload ) );
				return;
			}
			// Stream started / response received
			clearTimeout(timeout);
			callback(data);
			if (data.eventType === 'streamEnd') {
				this.socket.close();
			}
		};
	},
	session: {
		delete: async ( sessionId ) => makeServiceCall( '/delete_session', { session_id: sessionId } ),
		get_topic: async ( sessionId ) => makeServiceCall( '/get_session_topic', { session_id: sessionId } ),
		summarize: async ( sessionId ) => makeServiceCall( '/summarize_session', { session_id: sessionId } )
	},
	message: {
		get_topic: async ( message ) => makeServiceCall( '/get_message_topic', { message: message } ),
		convertToWikitext: async ( message ) => {
			const response = await fetch(mw.util.wikiScript( 'rest' ) + '/chatbot/convert-md', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ markdown: message } ),
			});

			if ( !response.ok ) throw new Error( response.statusText );
			const json = await response.json();
			return json.wikitext;
		}
	},
	getConfigItem: async ( item ) => {
		const config = await require( './../config.json' );
		return config[ item ] || null;
	}
};