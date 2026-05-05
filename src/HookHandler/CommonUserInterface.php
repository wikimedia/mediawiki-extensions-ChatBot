<?php

namespace ChatBot\HookHandler;

use ChatBot\Component\ChatBot;
use MediaWiki\Config\Config;
use MediaWiki\Context\RequestContext;
use MediaWiki\Hook\SkinAfterContentHook;
use MediaWiki\Html\Html;

class CommonUserInterface implements SkinAfterContentHook {
	/**
	 * @param Config $config
	 */
	public function __construct( private Config $config ) {
	}

	/**
	 * Note: Do not use MWStakeComponentRegistry to allow registering for other skins as well
	 * @inheritDoc
	 */
	public function onSkinAfterContent( &$data, $skin ) {
		$chatBot = new ChatBot( $this->config );

		$context = RequestContext::getMain();
		if ( !$chatBot->shouldRender( $context ) ) {
			return true;
		}
		$skin->getOutput()->addModules( $chatBot->getRequiredRLModules() );

		$data .= Html::rawElement( 'div',
			[
				'id' => 'chatbot-cnt'
			],
			$chatBot->getHtml()
		);
	}
}
