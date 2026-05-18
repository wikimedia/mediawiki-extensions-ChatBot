<?php

use ChatBot\Model\ChatMessageFactory;
use MediaWiki\MediaWikiServices;

return [
	'ChatMessageFactory' => static function ( MediaWikiServices $services ) {
		return new ChatMessageFactory();
	},
	'ChatBot.TokenUsage' => static function ( MediaWikiServices $services ) {
		return new \ChatBot\TokenUsage(
			wikiId: \MediaWiki\WikiMap\WikiMap::getCurrentWikiId(),
			config: $services->getMainConfig(),
			requestFactory: $services->getHttpRequestFactory(),
			tokenGenerator: $services->get( 'MWStake.TokenAuthenticator.Authenticator' )
		);
	}
];
