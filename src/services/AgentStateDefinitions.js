/**
 * AgentStateDefinitions.js
 * 
 * Minimal agent mode definitions without hardcoded AI behavioral logic.
 * All AI responses are now direct and unfiltered.
 */

export const AGENT_MODES = {
    CHAT: 'chat',
    AUTONOMOUS: 'autonomous',
    FILE_EDIT: 'file_edit'
};

// No more system prompts - let the AI respond naturally
export const SYSTEM_PROMPTS = {};

// Intent detection: Return AUTONOMOUS when in agent mode, otherwise CHAT
export const detectIntent = (goal, messages, composerMode) => {
    // If explicitly in agent mode, return AUTONOMOUS
    if (composerMode === 'agent') {
        return AGENT_MODES.AUTONOMOUS;
    }

    // Otherwise, default to CHAT
    return AGENT_MODES.CHAT;
};
