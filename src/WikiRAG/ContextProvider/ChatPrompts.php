<?php

namespace ChatBot\WikiRAG\ContextProvider;

use MediaWiki\Extension\WikiRAG\IContextProvider;
use MediaWiki\Message\Message;

class ChatPrompts implements IContextProvider {

	/**
	 * @inheritDoc
	 */
	public function provide(): string {
		return json_encode( [
			'contextualize' => Message::newFromKey( 'chatbot-prompts-contextualize' )->text(),
			'main' => Message::newFromKey( 'chatbot-prompts-main' )->text(),
		] );
	}

	/**
	 * @inheritDoc
	 */
	public function canProvide(): bool {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function getExtension(): string {
		return 'json';
	}
}
