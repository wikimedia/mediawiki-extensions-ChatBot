# Configuration for the used AI service

Prompt that is being relayed to the AI service can be configured from the wiki directly

## Prompts
You can override default prompts used when generating responses from AI service:

`MediaWiki:chatbot-prompts-contextualize` - change the prompt that is used to contextualize user's
query using the chat history. It's used as a preprocessor for the user query and is executed before
the main prompt.

`MediaWiki:Chatbot-prompts-main` - Main system prompt for the AI service
