<?php

namespace ChatBot\Util;

class MarkdownToWikitext {
	public function convert( string $markdown ): string {
		$lines = preg_split( '/\r\n|\r|\n/', $markdown );
		$out = [];

		$inFence = false;
		$fenceLang = null;
		$buffer = [];

		$n = count( $lines );
		for ( $i = 0; $i < $n; $i++ ) {
			$line = $lines[$i];

			// --- Code fences ---
			if ( preg_match( '/^```(\w+)?\s*$/', $line, $m ) ) {
				if ( !$inFence ) {
					$inFence = true;
					$fenceLang = $m[1] ?? null;
					$buffer = [];
				} else {
					// close fence
					$code = trim( implode( "\n", $buffer ), "\n" );
					if ( $fenceLang ) {
						$out[] = "<pre><code class=\"language-" . $this->escapeAttr( $fenceLang ) . "\">" . $code . "</code></pre>";
					} else {
						$out[] = "<pre><code>" . $code . "</code></pre>";
					}
					$inFence = false;
					$fenceLang = null;
					$buffer = [];
				}
				continue;
			}

			if ( $inFence ) {
				$buffer[] = $line;
				continue;
			}

			// --- Table start detection: collect consecutive lines that look like table rows ---
			if ( preg_match( '/^\s*\|.*\|\s*$/', $line ) ) {
				$tableLines = [];
				$j = $i;
				while ( $j < $n && preg_match( '/^\s*\|.*\|\s*$/', $lines[$j] ) ) {
					$tableLines[] = $lines[$j];
					$j++;
				}
				$out[] = $this->convertTable( $tableLines );
				// advance index to last table line
				$i = $j - 1;
				continue;
			}

			// --- Headings ---
			if ( preg_match( '/^(#{1,6})\s+(.*)$/', $line, $m ) ) {
				$level = strlen( $m[1] );
				// Map markdown level to MediaWiki equals (keep as simple mapping)
				// ensures at least '=='
				$equals = str_repeat( '=', max( 2, $level + 1 ) );
				$title = $this->inlineTransform( $m[2] );
				$out[] = $equals . ' ' . $title . ' ' . $equals;
				continue;
			}

			// --- Horizontal rule ---
			if ( preg_match( '/^\s*(\*\s*\*\s*\*|-{3,}|_{3,})\s*$/', $line ) ) {
				$out[] = '----';
				continue;
			}

			// --- Blockquote ---
			if ( preg_match( '/^\s*>\s?(.*)$/', $line, $m ) ) {
				$out[] = '> ' . $this->inlineTransform( $m[1] );
				continue;
			}

			// --- Lists (unordered and ordered) ---
			if ( preg_match( '/^(\s*)([-*+]|\d+\.)\s+(.*)$/', $line, $m ) ) {
				// count indentation levels by 2 spaces per depth (approx)
				$indentChars = strlen( $m[1] );
				$depth = (int)floor( $indentChars / 2 );
				$symbol = $m[2];
				$content = $this->inlineTransform( $m[3] );

				if ( preg_match( '/^\d+\.$/', $symbol ) ) {
					// ordered list: use '#' repeated by depth+1
					$prefix = str_repeat( '#', $depth + 1 );
				} else {
					// unordered list: use '*' repeated by depth+1
					$prefix = str_repeat( '*', $depth + 1 );
				}

				$out[] = $prefix . ' ' . $content;
				continue;
			}

			// --- Images inline (simple full-line image) ---
			if ( preg_match( '/!\[([^\]]*)\]\(\s*([^\s\)]+)(?:\s+"([^"]*)")?\s*\)\s*$/', trim( $line ), $m ) ) {
				$alt = $m[1];
				$src = $m[2];
				$caption = $m[3] ?? '';
				// treat as local file reference if not an absolute URL
				if ( !preg_match( '/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//', $src ) ) {
					$out[] = "[[File:" . $src . ( $alt !== '' ? '|' . $alt : '' ) . ( $caption !== '' ? '|' . $caption : '' ) . "]]";
				} else {
					// external image -> HTML img
					$attr = 'src="' . $this->escapeAttr( $src ) . '"';
					if ( $alt !== '' ) {
						$attr .= ' alt="' . $this->escapeAttr( $alt ) . '"';
					}
					if ( $caption !== '' ) {
						$attr .= ' title="' . $this->escapeAttr( $caption ) . '"';
					}
					$out[] = '<img ' . $attr . ' />';
				}
				continue;
			}

			// --- Normal text / Inline transforms ---
			if ( trim( $line ) !== '' ) {
				$out[] = $this->inlineTransform( $line );
			} else {
				$out[] = '';
			}
		}

		return implode( "\n", $out );
	}

	/**
	 * Convert inline markdown constructs to wikitext/HTML snippets.
	 * Important: inline code content is NOT escaped (keeps literal code).
	 */
	private function inlineTransform( string $text ): string {
		// Protect and convert inline code first (no escaping inside)
		$text = preg_replace_callback( '/`([^`]+)`/', static function ( $m ) {
			return '<code>' . $m[1] . '</code>';
		}, $text );

		// Bold (*** already handled by combination of bold+italic if needed)
		$text = preg_replace( '/\*\*(.+?)\*\*/s', "'''$1'''", $text );
		$text = preg_replace( '/__(.+?)__/s', "'''$1'''", $text );

		// Italic
		$text = preg_replace( '/\*(.+?)\*/s', "''$1''", $text );
		$text = preg_replace( '/_(.+?)_/s', "''$1''", $text );

		// Strikethrough
		$text = preg_replace( '/~~(.+?)~~/s', '<s>$1</s>', $text );

		// External links [label](http://...)
		$text = preg_replace_callback( '/\[(.*?)\]\(\s*(https?:\/\/[^\s\)]+)(?:\s+"([^"]*)")?\s*\)/', static function ( $m ) {
			$label = trim( $m[1] );
			$url = $m[2];
			if ( $label === '' || $label === $url ) {
				return "[$url]";
			} else {
				return "[$url $label]";
			}
		}, $text );

		// Internal links [label](/Page or /Page/Subpage)
		$text = preg_replace_callback( '/\[(.*?)\]\(\s*\/([^\s\)]+)(?:\s+"([^"]*)")?\s*\)/', static function ( $m ) {
			$label = trim( $m[1] );
			$page = trim( $m[2], '/' );
			if ( $label === '' || $label === $page ) {
				return "[[$page]]";
			}
			return "[[$page|$label]]";
		}, $text );

		// Remove Markdown hard line breaks (two or more spaces before newline)
		$text = preg_replace( "/ {2,}\n/", "\n", $text );

		return $text;
	}

	/**
	 * Convert a slice of consecutive markdown table lines (each like "| a | b |")
	 * to a MediaWiki wikitable. Expects $tableLines as an array of strings.
	 */
	private function convertTable( array $tableLines ): string {
		// Parse rows into arrays of cells
		$rows = [];
		foreach ( $tableLines as $line ) {
			$trim = trim( $line );
			// remove outer pipes if present
			if ( substr( $trim, 0, 1 ) === '|' ) {
				$trim = substr( $trim, 1 );
			}
			if ( substr( $trim, -1 ) === '|' ) {
				$trim = substr( $trim, 0, -1 );
			}
			$cells = array_map( 'trim', preg_split( '/\s*\|\s*/', $trim ) );
			$rows[] = $cells;
		}

		$hasHeader = false;
		$headerCells = [];
		$dataStart = 0;

		if ( count( $rows ) >= 2 ) {
			// Check if second row is a separator like --- | :---: | --- etc.
			$second = $rows[1];
			$allSep = true;
			foreach ( $second as $c ) {
				if ( !preg_match( '/^:?-{3,}:?$/', $c ) ) {
					$allSep = false;
					break;
				}
			}
			if ( $allSep ) {
				$hasHeader = true;
				$headerCells = $rows[0];
				$dataStart = 2;
			}
		}

		$out = [];
		$out[] = '{| class="wikitable"';

		if ( $hasHeader ) {
			$out[] = '|-';
			$hdr = array_map( [ $this, 'inlineTransform' ], $headerCells );
			$out[] = '! ' . implode( ' !! ', $hdr );
		}

		for ( $r = $dataStart; $r < count( $rows ); $r++ ) {
			$row = $rows[$r];
			$out[] = '|-';
			$cells = array_map( [ $this, 'inlineTransform' ], $row );
			$out[] = '| ' . implode( ' || ', $cells );
		}

		$out[] = '|}';
		return implode( "\n", $out );
	}

	/**
	 * small helper to escape attribute values (used for fence language)
	 */
	private function escapeAttr( string $s ): string {
		return htmlspecialchars( $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8' );
	}
}
