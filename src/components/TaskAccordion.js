// Timer Component - Displays elapsed time from startTime
const { useState, useEffect } = React;

export const Timer = ({ startTime, isRunning = true }) =\u003e {
    const [elapsed, setElapsed] = useState(0);

useEffect(() =\u003e {
    if(!isRunning || !startTime) return;

const interval = setInterval(() =\u003e {
    const now = Date.now();
    const diff = Math.floor((now - startTime) / 1000);
    setElapsed(diff);
}, 100);

return () =\u003e clearInterval(interval);
    }, [startTime, isRunning]);

return (
\u003cspan style = {{
    fontFamily: 'monospace',
        fontSize: '11px',
            opacity: 0.7,
                marginLeft: 8
}}\u003e
{ elapsed } s
\u003c / span\u003e
    );
};

// Task Accordion Item Component
export const TaskAccordionItem = ({ task, sessionId, isExpanded, onToggle, Icon, CheckCircle, ArrowRight, X, RefreshCw, ChevronDown, ChevronRight, Brain, Play, AlertCircle }) =\u003e {
    const getStatusIcon = () =\u003e {
        if (task.status === 'finished') {
    return \u003cIcon name = { CheckCircle } size = { 14} style = {{ color: 'var(--accent-success)' }
} /\u003e;
        } else if (task.status === 'repaired') {
    return \u003cIcon name = { CheckCircle } size = { 14} style = {{ color: '#f0ad4e' }
} title =\"Auto-repaired\" /\u003e;
        } else if (task.status === 'skipped') {
    return \u003cIcon name = { ArrowRight } size = { 14} style = {{ color: 'var(--accent-primary)' }
} title =\"Skipped (not needed)\" /\u003e;
        } else if (task.status === 'error') {
    return \u003cIcon name = { X } size = { 14} style = {{ color: 'var(--accent-error)' }
} /\u003e;
        } else if (task.status === 'active') {
    return \u003cIcon name = { RefreshCw } size = { 14} className =\"spin\" style={{ color: 'var(--accent-primary)' }} /\u003e;
} else {
    return \u003cdiv className =\"dot\" /\u003e;
}
    };

return (
\u003cdiv className = {`task-accordion-item ${task.status}`}\u003e
\u003cdiv
className =\"task-accordion-header\" 
onClick = { onToggle }
style = {{
    cursor: 'pointer',
        display: 'flex',
            alignItems: 'center',
                gap: 8,
                    padding: '8px 0'
}}
\u003e
{ getStatusIcon() }
\u003cspan style = {{ flex: 1 }}\u003e{ task.description } \u003c / span\u003e
\u003cIcon
name = { isExpanded? ChevronDown: ChevronRight }
size = { 14}
style = {{ opacity: 0.5 }}
                /\u003e
\u003c / div\u003e

{
    isExpanded \u0026\u0026(
        \u003cdiv className =\"task-accordion-content\" style={{ 
                    paddingLeft: 24,
        marginTop: 8,
        fontSize: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
                }}\u003e
{/* Thinking Phase */ }
{
    task.executionDetails?.thinkingStartTime \u0026\u0026(
        \u003cdiv className =\"task-phase glass\" style={{ padding: 12, borderRadius: 6 }}\u003e
        \u003cdiv style = {{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        color: '#bc8cff',
        fontWeight: 600
    }} \u003e
\u003cIcon name = { Brain } size = { 12} /\u003e
\u003cspan\u003eThinking\u003c / span\u003e
\u003cTimer
startTime = { task.executionDetails.thinkingStartTime }
isRunning = { task.status === 'active' \u0026\u0026 !task.executionDetails.aiResponse }
    /\u003e
\u003c / div\u003e

{/* Message to Model */ }
{
    task.executionDetails?.messageToModel \u0026\u0026(
        \u003cdiv style = {{ marginTop: 8 }} \u003e
\u003cdiv style = {{
    fontSize: '10px',
        opacity: 0.6,
            marginBottom: 4,
                textTransform: 'uppercase',
                    letterSpacing: '0.5px'
}}\u003e
                                        Message to Model:
\u003c / div\u003e
\u003cdiv style = {{
    background: 'rgba(0,0,0,0.2)',
        padding: 8,
            borderRadius: 4,
                fontFamily: 'monospace',
                    fontSize: '11px',
                        maxHeight: '200px',
                            overflow: 'auto'
}}\u003e
{ task.executionDetails.messageToModel }
\u003c / div\u003e
\u003c / div\u003e
                            )}

{/* Model Response */ }
{
    task.executionDetails?.aiResponse \u0026\u0026(
        \u003cdiv style = {{ marginTop: 8 }} \u003e
\u003cdiv style = {{
    fontSize: '10px',
        opacity: 0.6,
            marginBottom: 4,
                textTransform: 'uppercase',
                    letterSpacing: '0.5px'
}}\u003e
                                        Model Response:
\u003c / div\u003e
\u003cdiv style = {{
    background: 'rgba(0,0,0,0.2)',
        padding: 8,
            borderRadius: 4,
                fontFamily: 'monospace',
                    fontSize: '11px',
                        maxHeight: '200px',
                            overflow: 'auto'
}}\u003e
{ task.executionDetails.aiResponse }
\u003c / div\u003e
\u003c / div\u003e
                            )}
\u003c / div\u003e
                    )}

{/* Execution Phase */ }
{
    task.executionDetails?.executionStartTime \u0026\u0026(
        \u003cdiv className =\"task-phase glass\" style={{ padding: 12, borderRadius: 6 }}\u003e
        \u003cdiv style = {{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        color: '#3fb950',
        fontWeight: 600
    }} \u003e
\u003cIcon name = { Play } size = { 12} /\u003e
\u003cspan\u003eExecuting\u003c / span\u003e
\u003cTimer
startTime = { task.executionDetails.executionStartTime }
isRunning = { task.status === 'active' \u0026\u0026 !!task.executionDetails.aiResponse}
                                /\u003e
\u003c / div\u003e

{/* Execution Logs */ }
{
    task.executionDetails?.executionLogs \u0026\u0026 task.executionDetails.executionLogs.length \u003e 0 \u0026\u0026(
        \u003cdiv style = {{ marginTop: 8 }} \u003e
\u003cdiv style = {{
    fontSize: '10px',
        opacity: 0.6,
            marginBottom: 4,
                textTransform: 'uppercase',
                    letterSpacing: '0.5px'
}}\u003e
                                        Execution Logs:
\u003c / div\u003e
\u003cdiv style = {{
    background: 'rgba(0,0,0,0.2)',
        padding: 8,
            borderRadius: 4,
                fontFamily: 'monospace',
                    fontSize: '11px',
                        maxHeight: '200px',
                            overflow: 'auto',
                                display: 'flex',
                                    flexDirection: 'column',
                                        gap: 4
}}\u003e
{
    task.executionDetails.executionLogs.map((log, idx) =\u003e(
        \u003cdiv key = { idx } style = {{ opacity: 0.9 }} \u003e
\u003cspan style = {{ opacity: 0.5 }}\u003e{ log.timestamp } \u003c / span\u003e { log.message }
\u003c / div\u003e
                                        ))}
\u003c / div\u003e
\u003c / div\u003e
                            )}
\u003c / div\u003e
                    )}

{/* Error Details */ }
{
    task.error \u0026\u0026(
        \u003cdiv className =\"task-phase glass\" style={{ 
                            padding: 12,
        borderRadius: 6,
        borderLeft: '3px solid var(--accent-error)'
                        }}\u003e
\u003cdiv style = {{
    display: 'flex',
        alignItems: 'center',
            gap: 8,
                marginBottom: 8,
                    color: 'var(--accent-error)',
                        fontWeight: 600
}}\u003e
\u003cIcon name = { AlertCircle } size = { 12} /\u003e
\u003cspan\u003eError\u003c / span\u003e
\u003c / div\u003e
\u003cdiv style = {{
    background: 'rgba(248, 81, 73, 0.1)',
        padding: 8,
            borderRadius: 4,
                fontSize: '11px'
}}\u003e
{ task.error }
\u003c / div\u003e
\u003c / div\u003e
                    )}
\u003c / div\u003e
            )}
\u003c / div\u003e
    );
};
