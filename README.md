# node-red-contrib-claude

A [Node-RED](https://nodered.org/) node for interacting with the [Anthropic Claude API](https://docs.anthropic.com/en/api/getting-started).

## Requirements

- Node-RED >= 2.0.0
- Node.js >= 14.0.0
- An [Anthropic API key](https://console.anthropic.com/)

## Installation

**From npm** (once published):
```bash
cd ~/.node-red
npm install node-red-contrib-claude
```

**From source** (local development):
```bash
cd ~/.node-red
npm install /path/to/node-red-contrib-claude
```

Then restart Node-RED. The **claude** node will appear in the **AI** category of the palette.

## Configuration

Open the node's properties panel and enter your Anthropic API key. All other fields are optional defaults that can be overridden per-message at runtime.

| Property    | Default             | Description                         |
|-------------|---------------------|-------------------------------------|
| API Key     | —                   | Your Anthropic API key (`sk-ant-…`) |
| Model       | `claude-sonnet-4-6` | Claude model ID                     |
| Max Tokens  | `1024`              | Maximum tokens to generate          |
| System Prompt | *(none)*          | System prompt sent with every message |
| Temperature | *(model default)*   | Sampling temperature (0–1)          |
| Top P       | *(model default)*   | Nucleus sampling (0–1)              |
| Top K       | *(model default)*   | Top-k sampling (integer ≥ 1)        |

## Usage

### Input

| Property          | Type   | Required | Description                               |
|-------------------|--------|----------|-------------------------------------------|
| `msg.payload`     | string | Yes      | The prompt / query text sent to Claude    |
| `msg.model`        | string | No       | Override the model for this message          |
| `msg.maxTokens`    | number | No       | Override max tokens for this message         |
| `msg.systemPrompt` | string | No       | Override the system prompt for this message  |
| `msg.temperature`  | number | No       | Override temperature for this message        |
| `msg.topP`        | number | No       | Override top-p for this message           |
| `msg.topK`        | number | No       | Override top-k for this message           |

Non-string payloads are automatically serialized to JSON before being sent.

### Output (success)

| Property        | Type   | Description                                        |
|-----------------|--------|----------------------------------------------------|
| `msg.payload`   | string | The text response from Claude                      |
| `msg.claudeRaw` | object | Full API response (usage stats, stop reason, etc.) |

### Output (API error)

| Property          | Type   | Description                             |
|-------------------|--------|-----------------------------------------|
| `msg.payload`     | null   |                                         |
| `msg.claudeError` | object | `{ status: <HTTP code>, message: "" }`  |

The node still forwards the message downstream on API errors so flows can handle them explicitly.

### Node status indicators

| Color | Text           | Meaning                        |
|-------|----------------|--------------------------------|
| Blue  | Thinking…      | Waiting for API response       |
| Green | OK             | Request succeeded              |
| Red   | error `<code>` | API returned a non-200 status  |
| Red   | missing payload| `msg.payload` was empty        |
| Red   | no API key     | API key not configured         |
| Red   | request failed | Network/connection error       |

## Example Flows

Import `examples/flows.json` via **Menu → Import** in the Node-RED editor. It contains four ready-to-use flows:

| Tab | What it shows |
|-----|---------------|
| **1 - Basic Q&A** | Inject a question → claude → debug. The simplest possible usage. |
| **2 - System Prompt** | System prompt set in the node config so Claude always responds as a Python tutor. |
| **3 - Runtime Overrides** | A function node sets `msg.model`, `msg.systemPrompt`, and `msg.maxTokens` before calling the claude node, overriding the node config per-message. |
| **4 - Error Handling** | A switch node branches on `msg.claudeError` (null = success, non-null = API error) so failures are handled explicitly. |

> After importing, open each claude node and enter your Anthropic API key before deploying.

## Project Structure

```
claude.js    — Node-RED runtime (registers node type, handles API calls)
claude.html  — Node-RED editor UI and help panel
package.json — Package manifest and node-red node registration
```

## License

MIT © Paramesh Gunasekaran
