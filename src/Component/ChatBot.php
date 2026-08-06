<?php

namespace ChatBot\Component;

use MediaWiki\Config\Config;
use MediaWiki\Context\IContextSource;
use MediaWiki\Html\TemplateParser;
use MediaWiki\Message\Message;
use MediaWiki\SpecialPage\SpecialPage;
use MediaWiki\Title\Title;
use MWStake\MediaWiki\Component\CommonUserInterface\Component\Literal;

class ChatBot extends Literal {

	/**
	 * @param Config $config
	 */
	public function __construct( private Config $config ) {
		parent::__construct(
			'chatbot',
			$this->getTemplateHtml()
		);
	}

	/**
	 * @inheritDoc
	 */
	public function getRequiredRLModules(): array {
		return [
			"ext.chatbot",
			"ext.chatbot.attention.seeker"
		];
	}

	/**
	 *
	 * @inheritDoc
	 */
	public function shouldRender( IContextSource $context ): bool {
		$chatBotServiceUrl = $context->getConfig()->get( 'ChatBotService' )['url'] ?? '';
		if ( !$chatBotServiceUrl ) {
			return false;
		}
		if ( !$context->getUser()->isAllowed( 'read' ) ) {
			return false;
		}

		$specialUserLogin = SpecialPage::getSafeTitleFor( 'Userlogin' );
		$title = $context->getTitle();
		if ( $specialUserLogin->equals( $title ) ) {
			return false;
		}

		$context->getOutput()->addJsConfigVars( [
			"chatBotServiceUrl" => $chatBotServiceUrl,
		] );

		return true;
	}

	/**
	 * @return string
	 */
	private function getTemplateHtml(): string {
		$templateParser = new TemplateParser(
			dirname( dirname( __DIR__ ) ) . '/resources/templates'
		);

		$chatName = $this->config->get( 'ChatBotName' );

		return $templateParser->processTemplate( 'Chat', [
			'headline' => $chatName,
			'input_placeholder' => Message::newFromKey( 'chatbot-input-placeholder' )->text(),
			'send_button' => Message::newFromKey( 'chatbot-send-button-title' )->text(),
			'export_button' => Message::newFromKey( 'chatbot-export-button-title' )->text(),
			'resize_button' => Message::newFromKey( 'chatbot-resize-button-title' )->text(),
			'maximize_button' => Message::newFromKey( 'chatbot-maximize-button-title' )->text(),
			'minimize_button' => Message::newFromKey( 'chatbot-minimize-button-title' )->text(),
			'close_button' => Message::newFromKey( 'chatbot-close-button-title' )->text(),
			'restore_session' => Message::newFromKey( 'chatbot-restore-session-text' )->text(),
			'chat_banner_message' => Message::newFromKey( 'chatbot-banner-label' )->parse(),
			'logo_link' => Title::newFromText( 'Chatbot-FAQ' )->getLocalURL(),
			'dismiss_error_button' => Message::newFromKey( 'chatbot-dismiss-error-button-title' )->text(),
			'banner_help_button' => Message::newFromKey( 'chatbot-banner-help-button' )->text(),
			'banner_close_button' => Message::newFromKey( 'chatbot-banner-close-button' )->text(),
			'disclaimer_footer' => Message::newFromKey( 'chatbot-footer-disclaimer' )->parse(),
		] );
	}
}
