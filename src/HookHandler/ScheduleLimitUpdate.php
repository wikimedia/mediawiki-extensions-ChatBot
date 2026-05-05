<?php

namespace ChatBot\HookHandler;

use ExtensionRegistry;
use MediaWiki\Hook\MediaWikiServicesHook;
use MWStake\MediaWiki\Component\ProcessManager\ManagedProcess;

class ScheduleLimitUpdate implements MediaWikiServicesHook {

	/**
	 * Neo
	 * @inheritDoc
	 */
	public function onMediaWikiServices( $services ) {
		if ( defined( 'MW_PHPUNIT_TEST' ) || defined( 'MW_QUIBBLE_CI' ) ) {
			return;
		}
		if ( !ExtensionRegistry::getInstance()->isLoaded( 'WikiRAG' ) ) {
			return;
		}
		/** @var WikiCronManager $cronManager */
		$cronManager = $services->getService( 'MWStake.WikiCronManager' );
		$cronManager->registerCron( 'chatbot-update-limits', '0 4 * * *', new ManagedProcess( [
			'schedule-export' => [
				'class' => \ChatBot\Process\ScheduleLimitUpdate::class,
				'services' => [ 'WikiRAG.Scheduler' ],
			]
		] ) );
	}

	/**
	 * 5.2
	 * @inheritDoc
	 */
	public function onMWStakeRunJobsTriggerRegisterHandlers( array &$handlers ) {
		$handlers['chatbot-update-limits'] = [
			'class' => \ChatBot\Process\ScheduleLimitUpdateRunJobs::class,
			'services' => [ 'WikiRAG.Scheduler' ]
		];
	}
}
