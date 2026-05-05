<?php

namespace ChatBot\Rest;

use ChatBot\Util\MarkdownToWikitext;
use MediaWiki\Rest\SimpleHandler;
use Wikimedia\ParamValidator\ParamValidator;

class ConvertMarkdownToWikitextHandler extends SimpleHandler {

	/**
	 * @return false
	 */
	public function needsReadAccess() {
		return false;
	}

	/**
	 * @return \MediaWiki\Rest\Response
	 */
	public function execute() {
		$markdown = $this->getValidatedBody()['markdown'] ?? '';
		$converter = new MarkdownToWikitext();
		$wikitext = $converter->convert( $markdown );
		return $this->getResponseFactory()->createJson( [ 'wikitext' => $wikitext ] );
	}

	/**
	 * @return array[]
	 */
	public function getBodyParamSettings(): array {
		return [
			'markdown' => [
				static::PARAM_SOURCE => 'body',
				ParamValidator::PARAM_TYPE => 'string',
				ParamValidator::PARAM_REQUIRED => true,
			]
		];
	}
}
