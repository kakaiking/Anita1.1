/**
 * AgentTools.js
 * 
 * Tool definitions for OpenRouter function calling.
 * These tools enable the AI agent to interact with the IDE:
 * - Read and write files
 * - List directories
 * - Execute terminal commands
 * - Ask user questions
 */

window.AGENT_TOOLS = [
    {
        type: "function",
        function: {
            name: "read_file",
            description: "Read the contents of a file from the workspace. Use this to examine existing code before making changes.",
            parameters: {
                type: "object",
                properties: {
                    file_path: {
                        type: "string",
                        description: "Path to the file relative to workspace root (e.g., 'src/App.js' or 'package.json')"
                    }
                },
                required: ["file_path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "write_file",
            description: "Modify an existing file in the workspace. Use this to update the currently open file or @-mentioned files. Always provide the COMPLETE file content, not just snippets or changes. DO NOT use this to create new files - only modify existing ones.",
            parameters: {
                type: "object",
                properties: {
                    file_path: {
                        type: "string",
                        description: "Path to the EXISTING file to modify (e.g., 'src/components/Button.jsx'). This file must already exist."
                    },
                    content: {
                        type: "string",
                        description: "The complete updated content for the file. Must be the full file, not partial."
                    }
                },
                required: ["file_path", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_directory",
            description: "List all files and folders in a directory. Useful for exploring project structure.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Directory path to list. Use '.' for workspace root, or a relative path like 'src/components'"
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "run_command",
            description: "Execute a terminal command in the workspace. Use for npm commands, git operations, etc.",
            parameters: {
                type: "object",
                properties: {
                    command: {
                        type: "string",
                        description: "The command to execute (e.g., 'npm install react-router-dom' or 'git status')"
                    }
                },
                required: ["command"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ask_user",
            description: "Ask the user a question when you need clarification or additional information to proceed.",
            parameters: {
                type: "object",
                properties: {
                    question: {
                        type: "string",
                        description: "The question to ask the user"
                    }
                },
                required: ["question"]
            }
        }
    }
];
