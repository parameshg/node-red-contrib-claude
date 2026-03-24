# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`node-red-contrib-claude` is a Node-RED node that integrates with the Anthropic Claude API. It follows the standard Node-RED dual-file node pattern.

## Commands

```bash
# Install dependencies (none external, but sets up node_modules)
npm install

# Run tests (placeholder — no tests yet)
npm test
```

To develop locally, install the package into a Node-RED instance:
```bash
cd ~/.node-red && npm install /path/to/node-red-contrib-claude
```

## Architecture

The node is defined by exactly two files:

- **`claude.js`** — Runtime implementation. Exports a Node-RED module function that registers the `claude` node type. Handles input messages, calls `api.anthropic.com/v1/messages` via the built-in `https` module (no SDK), parses responses, and sets node status.
- **`claude.html`** — UI definition. Contains three `<script>` blocks: node registration/validation (with defaults), the editor form template, and the help panel.

**`package.json`** declares the node type under `"node-red".nodes` and defines `apiKey` as a password-type credential managed by Node-RED's credential system.

### Message flow

Input `msg.payload` is the user prompt. Node config properties (`model`, `maxTokens`, `temperature`, `topP`, `topK`) serve as defaults but are overridable per-message via identically-named `msg.*` properties.

On success: `msg.payload` = response text, `msg.claudeRaw` = full API response object.
On error: `msg.payload` = null, `msg.claudeError` = `{ status, message }`.

### API call details

- Endpoint: `POST https://api.anthropic.com/v1/messages`
- Auth header: `x-api-key` (from Node-RED credentials, never in node config)
- API version header: `anthropic-version: 2023-06-01`
- Default model: `claude-sonnet-4-6`, default maxTokens: `1024`
- `temperature`, `topP`, `topK` are omitted from the request body when not set
