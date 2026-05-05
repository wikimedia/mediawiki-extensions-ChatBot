<?php

namespace Chatbot\ConfigDefinition;

use BlueSpice\ConfigDefinition\BooleanSetting;
use BlueSpice\ConfigDefinition\IOverwriteGlobal;

class ChatBotEnableSearchSummary extends BooleanSetting implements IOverwriteGlobal {

	private const EXTENSION_CHATBOT = 'ChatBot';

	/**
	 * @return string[]
	 */
	public function getPaths() {
		return [
			static::MAIN_PATH_FEATURE . '/' . static::FEATURE_SKINNING . '/' . self::EXTENSION_CHATBOT,
			static::MAIN_PATH_EXTENSION . '/' . self::EXTENSION_CHATBOT . '/' . static::FEATURE_SKINNING,
			static::MAIN_PATH_PACKAGE . '/' . static::PACKAGE_PRO . '/' . self::EXTENSION_CHATBOT,
		];
	}

	/**
	 * @return string
	 */
	public function getGlobalName() {
		return "wgChatBotEnableSearchSummary";
	}

	/**
	 * @return string
	 */
	public function getLabelMessageKey() {
		return 'chatbot-config-enable-search-summary-label';
	}

	/**
	 * @return string
	 */
	public function getHelpMessageKey() {
		return 'chatbot-config-enable-search-summary-help';
	}
}
