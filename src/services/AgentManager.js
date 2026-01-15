/**
 * AgentManager.js
 * 
 * Manages autonomous agent sessions using OpenRouter function calling.
 * Replaces the old JSON-parsing approach with native tool use.
 */

window.AgentManager = class AgentManager {
    constructor(aiService, callbacks) {
        this.ai = aiService;
        this.addLog = callbacks.addLog;
        this.addMessage = callbacks.addMessage;
        this.updateUI = callbacks.updateUI;
        this.updateSession = callbacks.updateSession;
        this.loadFiles = callbacks.loadFiles; // For refreshing file explorer
        this.refreshActiveFile = callbacks.refreshActiveFile; // For refreshing editor content
        this.sessions = new Map(); // sessionId -> session data
    }

    /**
     * Start a new agent session
     * @param {string} goal - The user's goal/task
     * @param {string} chatId - The chat ID this session belongs to
     * @param {string} workspace - The workspace path
     * @param {string} activeFile - The currently active file path (optional)
     * @returns {number} sessionId
     */
    async startSession(goal, chatId, workspace, activeFile = null, image = null, settings = null) {
        const sessionId = Date.now();

        // Read active file content if provided
        let activeFileContent = '';
        let activeFileName = '';
        let relativeActiveFilePath = '';
        let activeFileLanguage = 'plaintext';

        if (activeFile) {
            try {
                activeFileContent = await window.api.readFile(activeFile);
                activeFileName = activeFile.split(/[/\\]/).pop();

                // Calculate relative path for context
                if (activeFile.startsWith(workspace)) {
                    relativeActiveFilePath = activeFile.slice(workspace.length).replace(/^[/\\]/, '').replace(/\\/g, '/');
                } else {
                    relativeActiveFilePath = activeFileName;
                }

                activeFileLanguage = this.getLanguageForFile(activeFileName);
            } catch (e) {
                console.warn('Could not read active file:', e);
            }
        }

        // If image is provided, use vision model to analyze it first
        let imageDescription = '';
        if (image && settings?.visionModel) {
            this.addLog('🖼️ Analyzing image with vision model...');
            try {
                const visionResponse = await this.ai.chat(
                    [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Analyze this image in detail. Describe what you see, including UI elements, colors, layout, text, and any other relevant details. Be specific and thorough as this description will be used by a coding assistant to implement the UI.'
                                },
                                { type: 'image_url', image_url: { url: image } }
                            ]
                        }
                    ],
                    null,  // no streaming
                    null,  // no abort signal
                    settings.visionModel  // use vision model
                );

                imageDescription = visionResponse;
                this.addLog(`✅ Vision analysis complete`);
                console.log('Image description:', imageDescription);
            } catch (error) {
                this.addLog(`⚠️ Vision model error: ${error.message}`);
                console.error('Vision model error:', error);
                // Continue without image description
            }
        }

        const session = {
            id: sessionId,
            chatId: chatId,
            goal: goal,
            workspace: workspace,
            activeFile: activeFile,
            activeFileName: activeFileName,
            relativeActiveFilePath: relativeActiveFilePath,
            status: 'running',
            history: [
                {
                    role: 'system',
                    content: `You are an autonomous coding agent with access to file operations and terminal commands.

${activeFile ? `**Current File Context:**
File: ${activeFileName}
Relative Path: ${relativeActiveFilePath} (ALWAYS use this path when modifying the file)
Absolute Path: ${activeFile}

\`\`\`${activeFileLanguage}
${activeFileContent}
\`\`\`

` : ''}${imageDescription ? `**Image Description:**
The user has provided an image that shows the following:
${imageDescription}

` : ''}**Your Goal:** ${goal}

**Available Tools:**
- read_file: Read file contents to examine existing code
- write_file: MODIFY existing files ONLY (do NOT create new files - only update the active file or @-mentioned files)
- list_directory: List directory contents to explore project structure
- run_command: Execute terminal commands (npm, git, etc.)
- ask_user: Ask for clarification when needed

**IMPORTANT CONSTRAINTS:**
- You can ONLY modify existing files (the currently open file or files mentioned with @filename)
- DO NOT create new files - this is a file-scoped editor
- ALWAYS use the relative path "${relativeActiveFilePath}" when modifying the active file
- Focus on improving/modifying the active file based on the user's request
- If you need to reference other files, ask the user to @mention them

**Instructions:**
1. ${activeFile ? `You are currently working on ${relativeActiveFilePath} - this is the file you should modify` : 'Think step-by-step about the task'}
2. If the user mentions other files with @filename, you can read and reference those files
3. Use tools as needed to accomplish the goal
4. Always read files before modifying them (unless you already have the content)
5. Provide complete file contents when writing, not snippets
6. When finished, respond with a summary of what you accomplished

Begin working on the task now.`
                },

                {
                    role: 'user',
                    content: `Start working on: ${goal}`
                }
            ],
            logs: [],
            createdAt: Date.now()
        };

        this.sessions.set(sessionId, session);

        // Start the agent loop (don't await - runs in background)
        this.runAgentLoop(sessionId).catch(err => {
            this.addLog(`Agent session ${sessionId} error: ${err.message}`);
            this.updateSession(sessionId, { status: 'error', error: err.message });
        });

        return sessionId;
    }

    /**
     * Main agent loop - runs until completion or error
     */
    async runAgentLoop(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const MAX_STEPS = 50;
        let stepCount = 0;

        this.addLog(`🤖 Agent started: ${session.goal}`);

        while (session.status === 'running' && stepCount < MAX_STEPS) {
            stepCount++;
            this.addLog(`💭 Step ${stepCount}: Thinking...`);
            this.updateSession(sessionId, { status: 'thinking', currentStep: stepCount });

            try {
                // Call AI with tools
                const response = await this.ai.chat(
                    session.history,
                    null,           // no streaming for agent loop
                    null,           // no abort signal
                    null,           // use default model
                    window.AGENT_TOOLS     // pass tools for function calling
                );

                // Validate response structure
                if (!response) {
                    throw new Error('AI returned null response');
                }

                // Log the full response for debugging - but truncate if too large
                const responseStr = JSON.stringify(response);
                if (responseStr.length > 500) {
                    console.log('Agent AI Response (truncated):', responseStr.substring(0, 500) + '...');
                } else {
                    console.log('Agent AI Response:', response);
                }

                // Check if response has the expected structure
                if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
                    // Log the actual response to help debug
                    this.addLog(`⚠️ Unexpected API response format`);
                    console.error('Full response object:', response);
                    console.error('Response type:', typeof response);
                    console.error('Is string?:', typeof response === 'string');

                    // If it's a string, it means AIService returned content directly (shouldn't happen with tools)
                    if (typeof response === 'string') {
                        throw new Error(`API returned string instead of object. This suggests tools were not properly sent to the API. Response: "${response.substring(0, 100)}..."`);
                    }

                    throw new Error(`AI response missing choices array. Check console for full response details.`);
                }

                // Extract the message from response
                const message = response.choices[0].message;

                if (!message) {
                    throw new Error('AI response missing message object');
                }

                // Add AI's response to history
                session.history.push(message);

                // Check if AI wants to use tools
                if (message.tool_calls && message.tool_calls.length > 0) {
                    this.updateSession(sessionId, { status: 'executing' });

                    // Execute each tool call
                    for (const toolCall of message.tool_calls) {
                        const toolName = toolCall.function.name;
                        let toolArgs;

                        try {
                            toolArgs = JSON.parse(toolCall.function.arguments);
                        } catch (e) {
                            this.addLog(`⚠️ Failed to parse tool arguments: ${e.message}`);
                            continue;
                        }

                        this.addLog(`🔧 Executing: ${toolName}(${JSON.stringify(toolArgs).substring(0, 50)}...)`);

                        // Execute the tool
                        const result = await this.executeTool(
                            toolName,
                            toolArgs,
                            session
                        );

                        // Add tool result to history (required by OpenAI spec)
                        session.history.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: JSON.stringify(result)
                        });

                        // Log result (truncated)
                        const resultStr = JSON.stringify(result);
                        const truncated = resultStr.length > 100
                            ? resultStr.substring(0, 100) + '...'
                            : resultStr;
                        this.addLog(`✅ Result: ${truncated}`);
                    }

                    // Continue loop - AI will process tool results in next iteration
                    this.updateUI();
                    continue;
                }

                // No tool calls - AI is providing final response
                if (message.content) {
                    this.addLog(`✨ Agent: ${message.content}`);

                    // Add final message to chat UI
                    if (this.addMessage) {
                        this.addMessage(session.chatId, {
                            role: 'assistant',
                            content: message.content,
                            timestamp: Date.now()
                        });
                    }

                    this.updateSession(sessionId, {
                        status: 'finished',
                        finalMessage: message.content, // Used by UI to show final outcome
                        completedAt: Date.now()
                    });
                    session.status = 'finished';
                    break;
                }

                // Edge case: no tools and no content
                this.addLog('⚠️ AI returned empty response');
                break;

            } catch (error) {
                this.addLog(`❌ Error: ${error.message}`);
                this.updateSession(sessionId, {
                    status: 'error',
                    error: error.message
                });
                session.status = 'error';
                break;
            }

            this.updateUI();
        }

        // Check if max steps reached
        if (stepCount >= MAX_STEPS) {
            this.addLog('⚠️ Max steps reached (50)');
            this.updateSession(sessionId, {
                status: 'max_steps_reached',
                completedAt: Date.now()
            });
        }

        this.updateUI();
    }

    /**
     * Execute a tool and return the result
     */
    async executeTool(toolName, args, session) {
        try {
            switch (toolName) {
                case 'read_file': {
                    const content = await window.api.readFile(args.file_path);
                    return {
                        success: true,
                        content: content,
                        file_path: args.file_path
                    };
                }

                case 'write_file': {
                    // SAFETY CHECK: Ensure file exists before modifying
                    // Try to read it first to verify existence and correct path
                    // If it fails, it likely means the agent has the wrong path
                    let fileExists = false;
                    try {
                        await window.api.readFile(args.file_path);
                        fileExists = true;
                    } catch (e) {
                        fileExists = false;
                    }

                    if (!fileExists) {
                        // Allow specific exception ONLY if it matches strict active file path (rare case of new file in correct place?)
                        // But we want to BLOCK new files generally.
                        // So if it doesn't exist, we reject it and tell the agent the correct path.

                        // Suggest the correct path if we have one
                        const suggestion = session.relativeActiveFilePath
                            ? `Did you mean '${session.relativeActiveFilePath}'?`
                            : "Please verify the path using list_directory first.";

                        // Throwing error returns it to the agent so it can retry
                        throw new Error(`File '${args.file_path}' does not exist. You are restricted to modifying EXISTING files only. ${suggestion}`);
                    }

                    await window.api.writeFile(args.file_path, args.content);

                    // Refresh file explorer if loadFiles callback exists
                    if (this.loadFiles && session.workspace) {
                        this.loadFiles(session.workspace);
                    }

                    // Refresh active file editor if callback provided
                    if (this.refreshActiveFile) {
                        this.refreshActiveFile();
                    }

                    return {
                        success: true,
                        message: `File written successfully: ${args.file_path}`,
                        file_path: args.file_path,
                        bytes_written: args.content.length
                    };
                }

                case 'list_directory': {
                    const path = args.path || '.';
                    const files = await window.api.readDir(path);
                    return {
                        success: true,
                        path: path,
                        files: files.map(f => ({
                            name: f.name,
                            type: f.isDirectory ? 'directory' : 'file',
                            path: f.path
                        }))
                    };
                }

                case 'run_command': {
                    const result = await window.api.executeCommand(
                        'autonomous_term',
                        args.command
                    );
                    return {
                        success: result.success,
                        command: args.command,
                        stdout: result.stdout || '',
                        stderr: result.stderr || '',
                        exit_code: result.success ? 0 : 1
                    };
                }

                case 'ask_user': {
                    // Pause the agent and wait for user input
                    session.status = 'awaiting_user_input';
                    session.pendingQuestion = args.question;

                    this.updateSession(session.id, {
                        status: 'awaiting_user_input',
                        pendingQuestion: args.question
                    });

                    return {
                        success: true,
                        message: 'Question sent to user. Waiting for response.',
                        question: args.question
                    };
                }

                default:
                    return {
                        success: false,
                        error: `Unknown tool: ${toolName}`,
                        available_tools: AGENT_TOOLS.map(t => t.function.name)
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                tool: toolName,
                args: args
            };
        }
    }

    /**
     * Resume a paused session with user's response
     */
    resumeSession(sessionId, userResponse) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            this.addLog(`Session ${sessionId} not found`);
            return;
        }

        if (session.status !== 'awaiting_user_input') {
            this.addLog(`Session ${sessionId} is not awaiting input (status: ${session.status})`);
            return;
        }

        this.addLog(`👤 User response: ${userResponse}`);

        // Add user's response to history
        session.history.push({
            role: 'user',
            content: `User's answer to "${session.pendingQuestion}": ${userResponse}`
        });

        // Clear pending question and resume
        session.status = 'running';
        session.pendingQuestion = null;

        this.updateSession(sessionId, {
            status: 'running',
            pendingQuestion: null
        });

        // Resume the agent loop
        this.runAgentLoop(sessionId).catch(err => {
            this.addLog(`Agent resume error: ${err.message}`);
            this.updateSession(sessionId, { status: 'error', error: err.message });
        });
    }

    /**
     * Stop a running session
     */
    stopSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.status = 'stopped';
            this.updateSession(sessionId, {
                status: 'stopped',
                stoppedAt: Date.now()
            });
            this.addLog(`🛑 Session ${sessionId} stopped by user`);
        }
    }

    /**
     * Get session data
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    /**
     * Delete a session
     */
    deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }

    /**
     * Get language identifier for a file based on extension
     */
    getLanguageForFile(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'php': 'php',
            'rb': 'ruby',
            'swift': 'swift',
            'kt': 'kotlin',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'xml': 'xml',
            'md': 'markdown',
            'sh': 'bash',
            'yaml': 'yaml',
            'yml': 'yaml'
        };
        return languageMap[ext] || 'plaintext';
    }
}
