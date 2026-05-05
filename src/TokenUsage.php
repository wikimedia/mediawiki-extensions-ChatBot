<?php

namespace ChatBot;

use Config;
use MediaWiki\Http\HttpRequestFactory;
use MediaWiki\Permissions\Authority;
use MWStake\MediaWiki\Component\TokenAuthenticator\UserTokenAuthenticator;
use Random\RandomException;

class TokenUsage {

	/**
	 * @param string $wikiId
	 * @param Config $config
	 * @param HttpRequestFactory $requestFactory
	 * @param UserTokenAuthenticator $tokenGenerator
	 */
	public function __construct(
		private readonly string $wikiId,
		private readonly Config $config,
		private readonly HttpRequestFactory $requestFactory,
		private readonly UserTokenAuthenticator $tokenGenerator
	) {
	}

	/**
	 * @return int|null
	 */
	public function getTokenLimit(): ?int {
		return $this->config->get( 'ChatBotTokenLimit' ) ?? null;
	}

	/**
	 * @param Authority $actor
	 * @param string|null $wikiId
	 * @return array|null
	 * @throws RandomException
	 */
	public function getCreditUsage( Authority $actor, ?string $wikiId = null ): ?array {
		$stats = $this->getActualUsage( $actor, $wikiId );
		if ( !$stats ) {
			return null;
		}
		if ( $stats['tokenLimit'] === -1 ) {
			return [
				'total' => -1,
				'used' => $this->convertToCredits( $stats['tokenUsage'] ),
				'percent' => 0,
				'isReached' => false,
				'daysUntilReset' => 0,
			];
		}
		$total = $this->convertToCredits( $stats['tokenLimit'] );
		$used = min( $this->convertToCredits( $stats['tokenUsage'] ), $total );
		return [
			'total' => $total,
			'used' => $used,
			'percent' => min( $total > 0 ? ( $used / $total ) * 100 : 0, 100 ),
			'isReached' => $stats['isReached'],
			'daysUntilReset' => $stats['daysUntilReset'],
		];
	}

	/**
	 * @param Authority $actor
	 * @param string|null $wikiId
	 * @return array|null
	 * @throws RandomException
	 */
	public function getActualUsage( Authority $actor, ?string $wikiId = null ): ?array {
		$service = $this->config->get( 'ChatBotService' );
		if ( !$service || !isset( $service['url'] ) || !$service['url'] ) {
			return null;
		}
		$data = $this->makeCall( $actor, $service['url'], $wikiId );
		if ( !$data ) {
			return null;
		}
		return $data;
	}

	/**
	 * @return string
	 */
	public function getOrganizationId(): string {
		$configured = $this->config->get( 'ChatBotOrganizationId' );
		if ( !$configured ) {
			return $this->wikiId;
		}
		return $configured;
	}

	/**
	 * @param int $count
	 * @return int
	 */
	private function convertToCredits( int $count ): int {
		$conversionRate = $this->config->get( 'ChatBotCreditConversionRate' ) ?? 1000;
		return (int)ceil( $count / $conversionRate );
	}

	/**
	 * @param Authority $actor
	 * @param string $url
	 * @param string|null $wikiId
	 * @return array|null
	 * @throws RandomException
	 */
	private function makeCall( Authority $actor, string $url, ?string $wikiId ): ?array {
		$url = trim( $url, '/' );
		$token = $this->tokenGenerator->generateTokenWithIssuer( $actor->getUser() );
		$request = $this->requestFactory->create( wfAppendQuery( $url, [
			'token' => $token,
			'path' => 'token_usage',
			'org_id' => $this->getOrganizationId(),
			'wiki_id' => $wikiId ?? ''
		] ) );

		$status = $request->execute();
		if ( !$status->isOK() ) {
			return null;
		}
		$content = $request->getContent();
		$data = json_decode( $content, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return null;
		}

		return [
			'tokenLimit' => $data['token_limit'],
			'requestLimit' => $data['request_limit'],
			'tokenUsage' => $data['token_usage'] ?? 0,
			'requestUsage' => $data['request_usage'] ?? 0,
			'isReached' => $data['limit_reached'] ?? false,
			'daysUntilReset' => $data['days_until_reset'] ?? null
		];
	}

}
