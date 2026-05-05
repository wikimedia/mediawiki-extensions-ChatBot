<?php

namespace ChatBot\Model;

use DateTime;
use Exception;
use MediaWiki\MediaWikiServices;

class ChatMessage {
	private function __construct(
		private string $role,
		private string $content,
		private string $timestamp,
		private array $sources
	) {
	}

	/**
	 * @param array $message
	 *
	 * @return ChatMessage
	 * @throws Exception
	 */
	public static function fromMessageJson( array $message ): ChatMessage {
		return new ChatMessage(
			$message['role'],
			$message['content'],
			$message['timestamp'],
			$message['sources'] ?? []
		);
	}

	/**
	 * @return string
	 */
	public function getRole(): string {
		return $this->role;
	}

	/**
	 * @return string
	 */
	public function getContent(): string {
		$urlUtils = MediaWikiServices::getInstance()->getUrlUtils();
		$dom = new \DOMDocument();
		$dom->loadHTML( '<html><head><meta charset=\"UTF-8\"></head><body>' . $this->content . '</body></html>' );
		$links = $dom->getElementsByTagName( 'a' );
		foreach ( $links as $link ) {
			$link->setAttribute( 'href', $urlUtils->expand( $link->getAttribute( 'href' ) ) );
		}

		return $dom->saveHTML( $dom->getElementsByTagName( 'body' )->item( 0 ) );
	}

	/**
	 * @return array
	 */
	public function getSources(): array {
		return $this->sources;
	}

	/**
	 * @return string
	 * @throws \DateMalformedStringException
	 */
	public function getDate(): string {
		$date = new DateTime( $this->timestamp );

		return $date->format( 'Y-m-d H:i:s' );
	}
}
