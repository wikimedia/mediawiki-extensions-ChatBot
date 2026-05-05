<?php

namespace ChatBot\WikiRAG\ContextProvider;

use ChatBot\TokenUsage;
use MediaWiki\Extension\WikiRAG\IContextProvider;

class TokenLimits implements IContextProvider {

	/**
	 * @param TokenUsage $tokenUsage
	 */
	public function __construct(
		private readonly TokenUsage $tokenUsage
	) {
	}

	/**
	 * @inheritDoc
	 */
	public function provide(): string {
		return json_encode( [
			'org_id' => $this->tokenUsage->getOrganizationId(),
			'token_limit' => $this->tokenUsage->getTokenLimit(),
			'request_limit' => -1,
			'strategy' => 'token',
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
