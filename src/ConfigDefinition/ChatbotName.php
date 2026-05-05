<?php

namespace Chatbot\ConfigDefinition;

use BlueSpice\ConfigDefinition\IOverwriteGlobal;
use BlueSpice\ConfigDefinition\StringSetting;

class ChatbotName extends StringSetting implements IOverwriteGlobal {

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
		return "wgChatBotName";
	}

	/**
	 * @return string
	 */
	public function getLabelMessageKey() {
		return 'chatbot-config-name-label';
	}

	/**
	 * @return string
	 */
	public function getHelpMessageKey() {
		return 'chatbot-config-name-help';
	}
}
