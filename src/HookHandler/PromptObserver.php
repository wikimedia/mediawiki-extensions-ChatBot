<?php

namespace ChatBot\HookHandler;

use MediaWiki\Extension\WikiRAG\Scheduler;
use MediaWiki\Storage\Hook\PageSaveCompleteHook;

class PromptObserver implements PageSaveCompleteHook {

	/**
	 * @param Scheduler $scheduler
	 */
	public function __construct(
		private Scheduler $scheduler
	) {
	}

	/**
	 * @inheritDoc
	 */
	public function onPageSaveComplete( $wikiPage, $user, $summary, $flags, $revisionRecord, $editResult ) {
		if (
			$wikiPage->getTitle()->getNamespace() !== NS_MEDIAWIKI ||
			(
				strtolower( $wikiPage->getTitle()->getDBkey() ) !== 'chatbot-prompts-contextualize' &&
				strtolower( $wikiPage->getTitle()->getDBkey() ) !== 'chatbot-prompts-main'
			)
		) {
			return;
		}
		$this->scheduler?->scheduleContextProvider( 'chat-prompts' );
	}
}
