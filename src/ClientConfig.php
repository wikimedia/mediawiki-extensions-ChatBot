<?php

namespace ChatBot;

use MediaWiki\MediaWikiServices;

class ClientConfig {

	/**
	 * @return array
	 */
	public static function getConfig(): array {
		$mainConfig = MediaWikiServices::getInstance()->getMainConfig();

		return [
			'searchSummaryEnabled' => $mainConfig->get( 'ChatBotEnableSearchSummary' ),
		];
	}
}
