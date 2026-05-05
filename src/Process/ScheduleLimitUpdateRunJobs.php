<?php

namespace ChatBot\Process;

use MediaWiki\Extension\WikiRAG\Scheduler;
use MediaWiki\Status\Status;
use MWStake\MediaWiki\Component\RunJobsTrigger\IHandler;
use MWStake\MediaWiki\Component\RunJobsTrigger\Interval;

final class ScheduleLimitUpdateRunJobs implements IHandler {

	/**
	 * @param Scheduler $scheduler
	 */
	public function __construct(
		private readonly Scheduler $scheduler
	) {
	}

	/**
	 * @return string
	 */
	public function getKey() {
		return 'chatbot-update-limits';
	}

	/**
	 * @return Status
	 */
	public function run() {
		if ( $this->scheduler->scheduleContextProvider( 'token-limit' ) ) {
			return Status::newGood();
		}
		return Status::newFatal( 'Failed to schedule token limit update.' );
	}

	/**
	 * @return Interval\OnceEveryHour
	 */
	public function getInterval() {
		return new Interval\OnceADay();
	}
}
