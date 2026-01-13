export class AIService {
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = "https://openrouter.ai/api/v1";
    }

    async chat(messages, onStream, signal = null, overrideModel = null, tools = null) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/kakaiking/anita",
                "X-Title": "Anita IDE"
            },
            body: JSON.stringify({
                model: overrideModel || this.model,
                messages: messages,
                stream: !!onStream,
                tools: tools,                           // Add tools support
                tool_choice: tools ? "auto" : undefined // Let AI decide when to use tools
            }),
            signal: signal
        });

        // Handle API errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || errorData.message || `API Error: ${response.status} ${response.statusText}`;
            throw new Error(errorMessage);
        }

        if (onStream) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            let partialLine = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const text = partialLine + chunk;
                const lines = text.split("\n");
                partialLine = lines.pop();

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") continue;
                        try {
                            const json = JSON.parse(data);
                            const content = json.choices[0]?.delta?.content || "";
                            fullText += content;
                            onStream(content);
                        } catch (e) {
                            console.error("Error parsing stream", e);
                        }
                    }
                }
            }
            return fullText;
        } else {
            const data = await response.json();
            if (data.usage) {
                window.api.updateTokenUsage(data.usage.total_tokens);
            }

            // Return full response when tools are used (to access tool_calls)
            // Return just content for regular chat (backward compatible)
            if (tools) {
                return data;
            }
            return data.choices[0].message.content;
        }
    }
}
