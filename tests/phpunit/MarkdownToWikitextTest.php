<?php

namespace ChatBot\Tests;

use ChatBot\Util\MarkdownToWikitext;
use PHPUnit\Framework\TestCase;

class MarkdownToWikitextTest extends TestCase {

	/**
	 * @covers \ChatBot\Util\MarkdownToWikitext::convert
	 * @return void
	 */
	public function testConversion() {
		$input = file_get_contents( __DIR__ . '/data/markdown_input.md' );
		$expectedOutput = file_get_contents( __DIR__ . '/data/wikitext_output.wiki' );

		$converter = new MarkdownToWikitext();
		$actualOutput = $converter->convert( $input );

		$this->assertEquals( $expectedOutput, $actualOutput );
	}
}
