/**
 * AgentUserInput Component
 * 
 * Displays when the autonomous agent asks a question (ASK_USER tool)
 * and allows the user to respond, resuming agent execution.
 */

const { useState } = React;

function AgentUserInput({ agentManager }) {
    const [userInput, setUserInput] = useState('');

    // Get the first session (active autonomous session)
    const session = agentManager?.sessions?.[0];

    // Only show if agent is awaiting user input
    if (!session || session.status !== 'awaiting_user_input' || !session.pendingQuestion) {
        return null;
    }

    const handleSubmit = () => {
        if (!userInput.trim()) return;

        agentManager.resumeWithUserInput(session.id, userInput);
        setUserInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="agent-user-input-container">
            <div className="agent-question-header">
                <Icon name="MessageCircleQuestion" size={18} />
                <span>Agent Question</span>
            </div>

            <div className="agent-question">
                {session.pendingQuestion}
            </div>

            <div className="input-row">
                <input
                    type="text"
                    className="agent-input"
                    placeholder="Type your response and press Enter..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    autoFocus
                />
                <button
                    className="agent-submit-btn"
                    onClick={handleSubmit}
                    disabled={!userInput.trim()}
                >
                    <Icon name="Send" size={16} />
                    Send
                </button>
            </div>
        </div>
    );
}

// Export for use in App.js
window.AgentUserInput = AgentUserInput;
