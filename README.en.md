# claude-saver

[中文](README.md) | **English**

A Claude Code plugin: **once a conversation gets long, bringing up a new feature pops up a "New conversation" button**. One click **opens a fresh conversation, passes along a handoff brief, and archives the current one**. You can also just type `new` or 「換」 ("switch"). Set `LONG_CHAT_LANG=en` for English notices.

## Why use it

The longer a conversation gets, the more context has to be resent every turn, so each turn costs more tokens and runs slower. Switching to a fresh conversation at the right moment and carrying over only the key points is cheaper and keeps Claude more focused.

## Features

- **A button when you start something new**: once the context passes 150k tokens, bringing up a new feature or topic makes Claude first show a "New conversation / Do it here" button, so you don't have to type anything. Continuing unfinished work, corrections, and follow-up questions carry on as usual without the button.
- **Only a few reminders**: a one-line notice appears when the context first passes 150k, then once more for every additional 50k.
- **One-click handoff**: click "New conversation", or type 「換」 ("switch") or 「開新」 ("open new") — in English, `new` / `handoff` — and Claude will:
  1. Open a new conversation, automatically incrementing the number in its name (「對話-3」 → 「對話-4」, i.e. "Chat-3" → "Chat-4")
  2. Attach a handoff brief: what's done, what isn't, open to-dos, and rules to keep in mind
  3. Once the new one is confirmed running, move child conversations to the top level, then archive the current one. Archiving also archives idle child conversations, so moving them first keeps them safe
- **Successor conversations stand on their own**: a new conversation whose name is the current number plus 1, however it was opened (including a proposal card from Claude that you clicked), moves to the top level and the previous conversation is archived automatically. If the old one has already ended its turn, the new one finishes this itself.
- **Groups keep each project together**: the new conversation and its child conversations go into the same sidebar group (one per project), and so do child conversations you open along the way. In the default permission mode, the desktop app asks you before moving a conversation, and the sidebar may switch to a view that shows groups.

## Installation

Run in Claude Code:

```
/plugin marketplace add littlehole2025/claude-saver
/plugin install claude-saver@claude-saver
```

It takes effect once you start a new conversation after installing.

## Requirements

- [Node.js](https://nodejs.org/) installed on your computer (the hook runs with `node`)
- **One-click handoff only works in the Claude desktop app (Code tab)**, because opening and archiving conversations relies on tools only the desktop app provides. The terminal CLI has no button; instead, Claude will suggest in one sentence that you start a new conversation yourself.

## Configuration

Adjust with environment variables (you can put them under `"env"` in `~/.claude/settings.json`):

| Variable | Default | Description |
| --- | --- | --- |
| `LONG_CHAT_TOKENS` | `150000` | Token count above which the button starts appearing |
| `LONG_CHAT_STEP` | `50000` | How many more tokens before the notice is shown again |
| `LONG_CHAT_LANG` | `zh-TW` | Notice language: `zh-TW` or `en` |

For example:

```json
{
  "env": {
    "LONG_CHAT_TOKENS": "120000",
    "LONG_CHAT_LANG": "en"
  }
}
```

## How it works

Every time you send a message, a `UserPromptSubmit` hook reads the token usage of the last reply in the transcript (which equals the current context size). Once it's over the threshold:

- Every turn, it tells Claude the current size, and Claude decides whether your message starts a new feature; if so, it shows the new-conversation button first
- The notice you see appears only when the threshold is first crossed and then at every additional 50k (levels already shown are recorded in the system temp folder)

`PostToolUse` and `PreToolUse` hooks run only when Claude opens a conversation, moves one to the top level, or archives one, and remind it to file the new conversation under the project's group.

## License

MIT
