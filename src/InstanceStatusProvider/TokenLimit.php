<?php

namespace ChatBot\InstanceStatusProvider;

use BlueSpice\InstanceStatus\IStatusProvider;
use ChatBot\TokenUsage;
use MediaWiki\Html\Html;
use MediaWiki\Message\Message;

class TokenLimit implements IStatusProvider {

	/**
	 * @param TokenUsage $tokenUsage
	 */
	public function __construct(
		private readonly TokenUsage $tokenUsage
	) {
	}

	/**
	 * @return string
	 */
	public function getLabel(): string {
		return Message::newFromKey( 'chatbot-instance-status-token-limit' )->text();
	}

	/**
	 * @return string
	 */
	public function getValue(): string {
		$data = $this->tokenUsage->getCreditUsage( \RequestContext::getMain()->getUser() );
		if ( !$data ) {
			return '-';
		}
		if ( $data['total'] === -1 ) {
			return Message::newFromKey( 'chatbot-instance-status-unlimited' )->text();
		}
		$text = sprintf(
			'%d / %d (%.2f%%)',
			$data['used'],
			$data['total'],
			$data['percent']
		);

		$color = '';
		if ( $data['percent'] === 100 ) {
			$color = 'red';
		} elseif ( $data['percent'] >= 80 ) {
			$color = 'orange';
		}
		if ( $data['isReached'] ) {
			$text .= ' ' . Message::newFromKey( 'chatbot-instance-status-limit-reached' )->text();
		}
		if ( $data['daysUntilReset' ] ) {
			$text .= ' ' . Message::newFromKey(
				'chatbot-instance-status-days-until-reset',
				$data['daysUntilReset']
			)->text();
		}
		return Html::element( 'span', [ 'style' => "color: $color" ], $text );
	}

	/**
	 * @return string
	 */
	public function getIcon(): string {
		return 'robot';
	}

	/**
	 * @return int
	 */
	public function getPriority(): int {
		return 10;
	}

}
