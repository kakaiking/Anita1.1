import { AGENT_MODES, SYSTEM_PROMPTS } from './AgentStateDefinitions.js';

export class AgentManager {
    constructor(aiService, addLog, updateUI) {
        this.ai = aiService;
        this.addLog = addLog;
        this.updateUI = updateUI;
        this.sessions = []; // { id, goal, history, status, variables }
        this.activeSessionId = null;
    }

    // --- OLD FLOW (Deprecated-ish, keeping for reference if needed, or we can replace usage) ---
    // We will redirect "createProposal" to the new flow if we want "Vibe Coding" to be default.
    // For now, let's keep it but add the new Autonomous Flow.

    async startAutonomousSession(goal) {
        const session = {
            id: Date.now(),
            goal,
            mode: AGENT_MODES.AUTONOMOUS,
            history: [], // [{ role, content }]
            conversation: [], // For UI display
            status: 'running',
            variables: {
                workingDirectory: '.' // Track current working directory
            }
        };
        this.sessions.unshift(session);
        this.activeSessionId = session.id;
        this.updateUI();

        this.addLog(`Agent: Starting autonomous session for "${goal}"`);

        // Start the loop
        this.runAppBuilderLoop(session);
        return session;
    }

    async runAppBuilderLoop(session) {
        const MAX_STEPS = 50;
        let stepCount = 0;

        // Initial Context (only if not resuming)
        if (session.history.length === 0) {
            session.history.push({
                role: 'system',
                content: SYSTEM_PROMPTS[AGENT_MODES.AUTONOMOUS]
            });
            session.history.push({
                role: 'user',
                content: `Goal: ${session.goal}. Start.`
            });
        }

        while (session.status === 'running' && stepCount < MAX_STEPS) {
            stepCount++;
            this.addLog(`Agent: Thinking (Step ${stepCount})...`);

            try {
                // 1. THINK
                const response = await this.ai.chat(session.history);
                const thoughtProcess = this.parseResponse(response);

                if (!thoughtProcess) {
                    this.addLog("Agent: Error parsing response. Retrying...");
                    session.history.push({ role: 'user', content: "Invalid JSON. Please output STRICT JSON as requested." });
                    continue;
                }

                this.addLog(`Agent Thought: ${thoughtProcess.thoughts}`);

                // 2. ACT
                const result = await this.executeTool(thoughtProcess.tool, thoughtProcess.args, session);

                // 3. OBSERVE
                session.history.push({
                    role: 'assistant',
                    content: JSON.stringify(thoughtProcess)
                });
                session.history.push({
                    role: 'user',
                    content: `Tool Output: ${JSON.stringify(result)}\n\n[Context] Current Working Directory: ${session.variables.workingDirectory}`
                });

                // Handle DONE or ASK_USER
                if (thoughtProcess.tool === 'DONE') {
                    session.status = 'finished';
                    this.addLog("Agent: Task Completed.");
                } else if (thoughtProcess.tool === 'ASK_USER') {
                    // Don't update status here - executeTool already did it
                    // Just log and exit the loop
                    this.addLog(`Agent asks: ${thoughtProcess.args[0]}`);
                    break; // Exit loop to wait for user input
                }

            } catch (error) {
                this.addLog(`Agent Error: ${error.message}`);
                session.status = 'error';
            }

            this.updateUI();
        }
    }

    resumeWithUserInput(sessionId, userInput) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session || session.status !== 'awaiting_user_input') {
            this.addLog("Error: Cannot resume - session not found or not awaiting input");
            return;
        }

        this.addLog(`User Response: ${userInput}`);

        // Add user's response to history
        session.history.push({
            role: 'user',
            content: `User Response: ${userInput}`
        });

        // Clear pending question and resume
        session.pendingQuestion = null;
        session.status = 'running';
        this.updateUI();

        // Resume the agent loop
        this.runAppBuilderLoop(session);
    }

    parseResponse(text) {
        try {
            // Attempt to extract JSON if mixed with text
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : text;
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("JSON Parse Error", e);
            return null;
        }
    }

    async executeTool(toolName, args, session) {
        try {
            switch (toolName) {
                case 'READ_FILE':
                    return await window.api.readFile(args[0]);
                case 'WRITE_FILE':
                    // Resolve path relative to working directory if not absolute
                    let filePath = args[0];
                    if (!filePath.includes(':') && !filePath.startsWith('/')) {
                        // Relative path - resolve against working directory
                        const workingDir = session?.variables?.workingDirectory || '.';
                        if (workingDir !== '.') {
                            filePath = `${workingDir}/${filePath}`;
                        }
                    }
                    await window.api.writeFile(filePath, args[1]);
                    return `File written successfully to ${filePath}`;
                case 'LIST_DIR':
                    const files = await window.api.readDir(args[0] || '.');
                    // Simplify output for LLM
                    return files.map(f => f.name + (f.isDirectory ? '/' : '')).join('\n');
                case 'RUN_COMMAND':
                    const command = args[0];

                    // CRITICAL: Detect project creation BEFORE executing command
                    let isProjectCreation = false;
                    let projectName = null;

                    if (session && (command.includes('npm create') || command.includes('npx create'))) {
                        this.addLog(`Agent: DEBUG - Detected project creation command: ${command}`);
                        const match = command.match(/(?:npm create|npx create)[^\s]+\s+([^\s-]+)/);
                        this.addLog(`Agent: DEBUG - Regex match result: ${match ? match[1] : 'NO MATCH'}`);

                        if (match && match[1]) {
                            isProjectCreation = true;
                            projectName = match[1];
                            this.addLog(`Agent: DEBUG - Will set CWD to: ${projectName} after command completes`);
                        }
                    }

                    // Execute the command
                    const cmdResult = await window.api.executeCommand('autonomous_term', command);

                    // CRITICAL: Wait for project creation to complete, then set CWD
                    if (isProjectCreation && projectName) {
                        try {
                            // Wait for npm create to finish (it runs in background)
                            this.addLog(`Agent: DEBUG - Waiting 3 seconds for project creation to complete...`);
                            await new Promise(resolve => setTimeout(resolve, 3000));

                            const workspace = await window.api.getWorkspacePath();
                            this.addLog(`Agent: DEBUG - Workspace path: ${workspace}`);

                            const projectPath = `${workspace}\\${projectName}`;
                            this.addLog(`Agent: DEBUG - Full project path: ${projectPath}`);

                            // Update session working directory
                            session.variables.workingDirectory = projectName;
                            this.addLog(`Agent: Working directory updated to: ${projectName}`);

                            // CRITICAL: Update the actual terminal CWD so commands run in the right place
                            const cwdResult = await window.api.setTerminalCwd('autonomous_term', projectPath);
                            this.addLog(`Agent: Terminal CWD set to: ${projectPath}`);
                            this.addLog(`Agent: DEBUG - setTerminalCwd result: ${JSON.stringify(cwdResult)}`);
                        } catch (error) {
                            this.addLog(`Agent: ERROR setting terminal CWD: ${error.message}`);
                            console.error('Terminal CWD error:', error);
                        }
                    }
                    // Track explicit cd commands
                    else if (session && command.trim().startsWith('cd ')) {
                        const newDir = command.trim().substring(3).trim();
                        if (newDir) {
                            session.variables.workingDirectory = newDir;
                            this.addLog(`Agent: Working directory changed to: ${newDir}`);
                        }
                    }

                    return cmdResult.success ? cmdResult.stdout : `Error: ${cmdResult.stderr}`;
                case 'ASK_USER':
                    session.status = 'awaiting_user_input';
                    session.pendingQuestion = args[0]; // Store the question for UI
                    this.updateUI();
                    return `Waiting for user response to: "${args[0]}"`;
                case 'DONE':
                    return "Success";
                default:
                    return `Unknown tool: ${toolName}`;
            }
        } catch (e) {
            return `Tool Execution Error: ${e.message}`;
        }
    }

    // Keep legacy method signature to avoid breaking App.js immediately, 
    // but redirect logic or warn if necessary.
    // For now, let's allow the old "createProposal" to exist for the "Plan" button if it exists,
    // but we can also add a bridge.

    async createProposal(goal) {
        // Redirect to new autonomous flow?
        // Or keep parallel? Let's keep existing logic just in case, 
        // but maybe we can just start the autonomous session here if that's what we want.
        // The prompt asked to "make anita exactly like Emergent AI" which implies replacing the old flow.
        // Let's TRY to use the new flow.

        return this.startAutonomousSession(goal);
    }
}
