# ChatBot

## Installation
Make sure to install composer dependencies:

Configure `$GLOBALS['wgChatBotService']['url']` in your `LocalSettings.php`;

## Direct responses

If you want to get AI answer outside of chat, use

```js
mw.loader.load( 'ext.chatbot.search.directResponse' )
ext.chatbot.directResponse(
	'what is bluespice?', // Query
	(d) => { console.log( d );}, // Callback, will receive response/stream packages
	false // Should stream response? default true
)

```

This will create no session on backend

## Token counting/limiting

By default, there are no limits (but service tracks token usage anyway)

To enable token counting/limiting, set following variable

```php
$GLOBALS['wgChatBotTokenLimit'] = 1000 * 1000; // 1 million tokens per month
```

For farms, where one limit is shared between multiple instances, set

```php
// By default, organization ID is wiki ID (single wiki - single organization)
$GLOBALS['wgChatBotOrganizationId'] = 'my-farm-organization-id';
```

For displaying limits, we use credits, to set conversion rate, set

```php
$GLOBALS['wgChatBotCreditConversionRate] = 1000; // 1000 tokens = 1 credit (default)
```

This will show 1000 tokens available if limit is set to 1 million tokens.

Token limits are passed from the wiki to the AI service via RAG mechanism. Updated once a day via runJobs.
Limits shown on `Special:InstanceStatus` are coming from the AI service directly, so it may take up to 24 hours to reflect changes.