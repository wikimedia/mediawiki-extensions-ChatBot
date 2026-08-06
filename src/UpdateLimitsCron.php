<?php

namespace ChatBot;

use ChatBot\Process\ScheduleLimitUpdate;
use MediaWiki\MediaWikiServices;
use MediaWiki\Registration\ExtensionRegistry;
use MWStake\MediaWiki\Component\ProcessManager\ManagedProcess;
use MWStake\MediaWiki\Component\WikiCron\WikiCronManager;

class UpdateLimitsCron {

	/**
	 * @return void
	 */
	public static function register(): void {
		if ( defined( 'MW_PHPUNIT_TEST' ) || defined( 'MW_QUIBBLE_CI' ) ) {
			return;
		}

		if ( !ExtensionRegistry::getInstance()->isLoaded( 'WikiRAG' ) ) {
			return;
		}

		/** @var WikiCronManager $cronManager */
		$cronManager = MediaWikiServices::getInstance()->getService( 'MWStake.WikiCronManager' );
		$cronManager->registerCron( 'chatbot-update-limits', '0 4 * * *', new ManagedProcess( [
			'schedule-export' => [
				'class' => ScheduleLimitUpdate::class,
				'services' => [ 'WikiRAG.Scheduler' ],
			]
		] ) );
	}
}
