<?php

namespace ChatBot\Process;

use MediaWiki\Extension\WikiRAG\Scheduler;
use MWStake\MediaWiki\Component\ProcessManager\IProcessStep;

class ScheduleLimitUpdate implements IProcessStep {

	/**
	 * @param Scheduler $scheduler
	 */
	public function __construct(
		private readonly Scheduler $scheduler
	) {
	}

	/**
	 * @inheritDoc
	 */
	public function execute( $data = [] ): array {
		return [ 'success' => $this->scheduler->scheduleContextProvider( 'token-limit' ) ];
	}
}
