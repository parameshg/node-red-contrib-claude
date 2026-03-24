module.exports = function (RED) {
    function ClaudeApiNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Static config from node properties (used as defaults)
        const defaultModel        = config.model        || "claude-sonnet-4-6";
        const defaultMaxTokens    = parseInt(config.maxTokens) || 1024;
        const defaultSystemPrompt = config.systemPrompt || undefined;
        const defaultTemperature  = config.temperature !== "" ? parseFloat(config.temperature) : undefined;
        const defaultTopP         = config.topP        !== "" ? parseFloat(config.topP)        : undefined;
        const defaultTopK         = config.topK        !== "" ? parseInt(config.topK)          : undefined;

        node.on("input", async function (msg) {
            // --- Resolve parameters: msg properties override node config ---
            const model        = msg.model        || defaultModel;
            const maxTokens    = msg.maxTokens    || defaultMaxTokens;
            const systemPrompt = msg.systemPrompt !== undefined ? msg.systemPrompt : defaultSystemPrompt;
            const temperature  = msg.temperature  !== undefined ? parseFloat(msg.temperature) : defaultTemperature;
            const topP         = msg.topP         !== undefined ? parseFloat(msg.topP)        : defaultTopP;
            const topK         = msg.topK         !== undefined ? parseInt(msg.topK)          : defaultTopK;

            // Query text comes from msg.payload
            const query = (typeof msg.payload === "string") ? msg.payload : JSON.stringify(msg.payload);

            if (!query) {
                node.error("No query text found in msg.payload", msg);
                node.status({ fill: "red", shape: "dot", text: "missing payload" });
                return;
            }

            // Retrieve API key from credentials
            const apiKey = node.credentials && node.credentials.apiKey;
            if (!apiKey) {
                node.error("No Anthropic API key configured", msg);
                node.status({ fill: "red", shape: "dot", text: "no API key" });
                return;
            }

            // Build the request body
            const body = {
                model,
                max_tokens: maxTokens,
                messages: [{ role: "user", content: query }]
            };
            if (systemPrompt)                                      body.system      = systemPrompt;
            if (temperature !== undefined && !isNaN(temperature)) body.temperature = temperature;
            if (topP        !== undefined && !isNaN(topP))        body.top_p       = topP;
            if (topK        !== undefined && !isNaN(topK))        body.top_k       = topK;

            node.status({ fill: "blue", shape: "dot", text: "Thinking…" });

            try {
                const https = require("https");
                const payload = JSON.stringify(body);

                const response = await new Promise((resolve, reject) => {
                    const options = {
                        hostname: "api.anthropic.com",
                        path: "/v1/messages",
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": apiKey,
                            "anthropic-version": "2023-06-01",
                            "Content-Length": Buffer.byteLength(payload)
                        }
                    };

                    const req = https.request(options, (res) => {
                        let data = "";
                        res.on("data", chunk => data += chunk);
                        res.on("end", () => {
                            try {
                                resolve({ status: res.statusCode, body: JSON.parse(data) });
                            } catch (e) {
                                reject(new Error("Failed to parse API response: " + data));
                            }
                        });
                    });

                    req.on("error", reject);
                    req.write(payload);
                    req.end();
                });

                if (response.status !== 200) {
                    const errMsg = response.body?.error?.message || JSON.stringify(response.body);
                    node.error(`API error ${response.status}: ${errMsg}`, msg);
                    node.status({ fill: "red", shape: "dot", text: `error ${response.status}` });
                    msg.payload    = null;
                    msg.claudeError = { status: response.status, message: errMsg };
                    node.send(msg);
                    return;
                }

                // Extract the text response
                const textContent = response.body.content?.find(c => c.type === "text");
                msg.payload   = textContent ? textContent.text : "";
                msg.claudeRaw = response.body;   // full response on msg.claudeRaw for power users

                node.status({ fill: "green", shape: "dot", text: "OK" });
                node.send(msg);

            } catch (err) {
                node.error("Claude API request failed: " + err.message, msg);
                node.status({ fill: "red", shape: "dot", text: "request failed" });
            }
        });

        node.on("close", function () {
            node.status({});
        });
    }

    RED.nodes.registerType("claude", ClaudeApiNode, {
        credentials: {
            apiKey: { type: "password" }
        }
    });
};
