// Note: In this environment, we are using Babel Standalone for the renderer.
const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

const FolderOpen = 'folder-open';
const Settings = 'settings';
const MessageSquare = 'message-square';
const List = 'list';
const Terminal = 'terminal';
const Play = 'play';
const Save = 'save';
const Trash2 = 'trash-2';
const Edit = 'edit';
const Plus = 'plus';
const ChevronRight = 'chevron-right';
const ChevronDown = 'chevron-down';
const ChevronUp = 'chevron-up';
const FileText = 'file-text';
const CodeIcon = 'code';
const CheckCircle = 'check-circle';
const AlertCircle = 'alert-circle';
const RefreshCw = 'refresh-cw';
const Loader2 = 'loader-2';
const Send = 'send';
const X = 'x';
const PanelLeft = 'panel-left';
const PanelRight = 'panel-right';
const PanelBottom = 'panel-bottom';
const Square = 'square';
const History = 'history';
const Maximize2 = 'maximize-2';
const Minimize2 = 'minimize-2';
const Minus = 'minus';
const MoreHorizontal = 'more-horizontal';
const FolderPlus = 'folder-plus';
const FilePlus = 'file-plus';
const FolderIcon = 'folder';
const Type = 'type';
const Brain = 'brain';
const Sparkles = 'sparkles';
const Copy = 'copy';
const ShieldCheck = 'shield-check';
const Users = 'users';
const Eye = 'eye';
const Monitor = 'monitor';

const getFileIcon = (name) => {
    const lowerName = name.toLowerCase();
    const ext = name.split('.').pop().toLowerCase();

    // Exact file matches
    if (lowerName === 'package.json') return { name: 'package', color: '#0dc1d8' };
    if (lowerName === 'package-lock.json') return { name: 'package-search', color: '#0dc1d8' };
    if (lowerName === '.gitignore') return { name: 'git-branch', color: '#f05032' };
    if (lowerName.startsWith('readme')) return { name: 'book-open', color: '#0085ff' };

    switch (ext) {
        case 'js':
            return { name: 'file-text', color: '#f7df1e' }; // JS icon style
        case 'jsx':
            return { name: 'code-2', color: '#61dafb' };
        case 'ts':
            return { name: 'file-text', color: '#3178c6' };
        case 'tsx':
            return { name: 'code-2', color: '#3178c6' };
        case 'html':
        case 'xml':
            return { name: 'code', color: '#e34f26' };
        case 'css':
        case 'scss':
        case 'less':
            return { name: 'code', color: '#264de4' };
        case 'json':
            return { name: 'braces', color: '#cbcb41' };
        case 'py':
            return { name: 'terminal', color: '#3776ab' };
        case 'md':
            return { name: 'file-text', color: '#0085ff' };
        case 'png':
        case 'jpg':
        case 'jpeg':
            return { name: 'image', color: '#bc8cff' };
        case 'svg':
            return { name: 'file-svg', color: '#ffb13b' };
        default:
            return { name: 'file-text', color: 'rgba(255,255,255,0.4)' };
    }
};

const getFolderIcon = (name, isExpanded) => {
    const lowerName = name.toLowerCase();
    let baseIcon = isExpanded ? 'folder-open' : 'folder';
    let color = '#a3a3a3'; // VS Code muted default folder

    if (lowerName === 'src') { baseIcon = 'folder-code'; color = '#ffb13b'; }
    else if (lowerName === 'components') { baseIcon = 'folder-code'; color = '#61dafb'; }
    else if (lowerName === 'hooks') { baseIcon = 'folder-git-2'; color = '#bc8cff'; }
    else if (lowerName === 'services') { baseIcon = 'folder-cog'; color = '#3fb950'; }
    else if (lowerName === 'styles') { baseIcon = 'folder-code'; color = '#1572b6'; }
    else if (lowerName === 'assets') { baseIcon = 'folder-image'; color = '#bc8cff'; }
    else if (lowerName === 'node_modules') { baseIcon = 'folder-tree'; color = '#3fb950'; }

    return { name: baseIcon, color };
};

const Breadcrumbs = ({ activeFile, workspace }) => {
    if (!activeFile || !workspace) return null;

    // Normalize paths for comparison
    const normalizedWorkspace = workspace.replace(/\\/g, '/');
    const normalizedFile = activeFile.replace(/\\/g, '/');

    const relativePath = normalizedFile.startsWith(normalizedWorkspace)
        ? normalizedFile.substring(normalizedWorkspace.length).replace(/^\//, '')
        : normalizedFile;

    const parts = relativePath.split('/').filter(Boolean);
    if (parts.length === 0) return null;

    const fileName = parts.pop();
    const icon = getFileIcon(fileName);

    return (
        <div className="editor-breadcrumbs">
            <Icon name={icon.name} size={14} style={{ color: icon.color, marginRight: 8 }} />
            {parts.map((part, i) => (
                <React.Fragment key={i}>
                    <span className="breadcrumb-part">{part}</span>
                    <Icon name={ChevronRight} size={10} className="breadcrumb-separator" />
                </React.Fragment>
            ))}
            <span className="breadcrumb-file">{fileName}</span>
            <div className="breadcrumb-actions">
                <Icon name={Sparkles} size={14} className="ai-sparkle-btn" title="AI Actions Available (Ctrl+E / Alt+/ for AI Suggest)" />
            </div>
        </div>
    );
};

const getLanguageForFile = (fileName) => {
    if (!window.monaco) return 'plaintext';
    const ext = '.' + fileName.split('.').pop().toLowerCase();
    const languages = window.monaco.languages.getLanguages();
    const lang = languages.find(l => l.extensions && l.extensions.includes(ext));
    return lang ? lang.id : 'plaintext';
};

const FileTree = ({
    files,
    expandedFolders,
    toggleFolder,
    openFile,
    activeFile,
    workspace,
    depth = 0,
    creatingItem,
    setCreatingItem,
    onCreateItem,
    renamingItem,
    setRenamingItem,
    onRenameItem,
    onDeleteItem
}) => {
    const [menuOpen, setMenuOpen] = useState(null);
    const [newItemName, setNewItemName] = useState('');
    const [renameName, setRenameName] = useState('');
    const inputRef = useRef(null);
    const renameRef = useRef(null);

    useEffect(() => {
        if (creatingItem && inputRef.current) {
            inputRef.current.focus();
        }
    }, [creatingItem]);

    useEffect(() => {
        if (renamingItem && renameRef.current) {
            renameRef.current.focus();
            renameRef.current.select();
        }
    }, [renamingItem]);

    const handleCreateSubmit = (e) => {
        if (e.key === 'Enter') {
            if (newItemName.trim()) {
                onCreateItem(creatingItem.parentPath, creatingItem.type, newItemName.trim());
            }
            setCreatingItem(null);
            setNewItemName('');
        } else if (e.key === 'Escape') {
            setCreatingItem(null);
            setNewItemName('');
        }
    };

    const handleRenameSubmit = (e, oldPath) => {
        if (e.key === 'Enter') {
            if (renameName.trim() && renameName.trim() !== renamingItem.oldName) {
                onRenameItem(oldPath, renameName.trim());
            }
            setRenamingItem(null);
        } else if (e.key === 'Escape') {
            setRenamingItem(null);
        }
    };

    const handleCopyStructure = async (rootFile) => {
        // 1. Recursive fetch of structure
        const buildTreeState = async (path, name) => {
            const node = { name, path, children: [], isDirectory: true };
            try {
                const items = await window.api.readDir(path);
                // Sort
                const sorted = items.sort((a, b) => {
                    if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
                    return a.isDirectory ? -1 : 1;
                });

                for (const item of sorted) {
                    if (['node_modules', '.git', 'dist', 'build', '.DS_Store'].includes(item.name)) continue;

                    if (item.isDirectory) {
                        node.children.push(await buildTreeState(item.path, item.name));
                    } else {
                        node.children.push({ name: item.name, isDirectory: false });
                    }
                }
            } catch (e) { console.error("Tree build error", e); }
            return node;
        };

        // 2. Stringify logic
        const generateTreeString = (node, prefix = '') => {
            let result = '';
            const children = node.children || [];

            children.forEach((child, index) => {
                const isLast = index === children.length - 1;
                const connector = isLast ? '└── ' : '├── ';
                const childPrefix = prefix + (isLast ? '    ' : '│   ');

                result += `${prefix}${connector}${child.name}\n`;

                if (child.isDirectory) {
                    result += generateTreeString(child, childPrefix);
                }
            });
            return result;
        };

        try {
            const treeRoot = await buildTreeState(rootFile.path, rootFile.name);
            const header = `${treeRoot.name}\n`;
            const content = header + generateTreeString(treeRoot);
            await navigator.clipboard.writeText(content);

            // Visual feedback via temporary menu text change? 
            // Since we close menu immediately we can't show it there easily.
            // But user will paste it.
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <>
            {files.map(file => {
                const isExpanded = expandedFolders.has(file.path);
                const fileIcon = file.isDirectory
                    ? getFolderIcon(file.name, isExpanded)
                    : getFileIcon(file.name);

                return (
                    <div key={file.path} className="file-tree-item-container" style={{ '--depth': depth }}>
                        <div
                            className={`file-tree-item ${activeFile === file.path ? 'active' : ''}`}
                            onClick={() => file.isDirectory ? toggleFolder(file) : openFile(file)}
                            style={{ paddingLeft: depth * 12 + 2 }}
                        >
                            <div className="chevron-container">
                                {file.isDirectory ? (
                                    <Icon
                                        name={isExpanded ? ChevronDown : ChevronRight}
                                        size={12}
                                        className="chevron"
                                    />
                                ) : (
                                    <div className="file-tree-placeholder" />
                                )}
                            </div>

                            <Icon
                                name={fileIcon.name}
                                size={16}
                                style={{
                                    color: fileIcon.color,
                                    opacity: activeFile === file.path ? 1 : 0.9
                                }}
                                className="file-icon"
                            />

                            {renamingItem && renamingItem.path === file.path ? (
                                <input
                                    ref={renameRef}
                                    className="file-tree-input"
                                    value={renameName}
                                    onChange={(e) => setRenameName(e.target.value)}
                                    onKeyDown={(e) => handleRenameSubmit(e, file.path)}
                                    onBlur={() => {
                                        if (renameName.trim() && renameName.trim() !== renamingItem.oldName) {
                                            onRenameItem(file.path, renameName.trim());
                                        }
                                        setRenamingItem(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ height: 20, fontSize: 13 }}
                                />
                            ) : (
                                <span className="file-name">{file.name}</span>
                            )}

                            <div className="more-actions" onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(menuOpen === file.path ? null : file.path);
                            }}>
                                <Icon name={MoreHorizontal} size={14} />
                            </div>
                        </div>

                        {menuOpen === file.path && (
                            <div className="file-ops-dropdown glass" onMouseLeave={() => setMenuOpen(null)}>
                                <div className="file-ops-item" onClick={(e) => {
                                    e.stopPropagation();
                                    setRenameName(file.name);
                                    setRenamingItem({ path: file.path, oldName: file.name });
                                    setMenuOpen(null);
                                }}>
                                    <Icon name={Edit} size={14} />
                                    <span>Rename</span>
                                </div>
                                <div className="file-ops-item" onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(file.path);
                                    setMenuOpen(null);
                                }}>
                                    <Icon name={Copy} size={14} />
                                    <span>Copy File Path</span>
                                </div>
                                <div className="file-ops-item" onClick={(e) => {
                                    e.stopPropagation();
                                    const relPath = file.path.startsWith(workspace)
                                        ? file.path.substring(workspace.length).replace(/^[\\\/]/, '')
                                        : file.path;
                                    navigator.clipboard.writeText(relPath);
                                    setMenuOpen(null);
                                }}>
                                    <Icon name={Copy} size={14} />
                                    <span>Copy Relative Path</span>
                                </div>
                                {file.path !== workspace && (
                                    <div className="file-ops-item" onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteItem(file.path, file.isDirectory);
                                        setMenuOpen(null);
                                    }}>
                                        <Icon name={Trash2} size={14} style={{ color: '#f85149' }} />
                                        <span>Delete</span>
                                    </div>
                                )}
                                {file.isDirectory && (
                                    <>
                                        <div className="file-ops-item" onClick={(e) => {
                                            e.stopPropagation();
                                            setCreatingItem({ parentPath: file.path, type: 'file' });
                                            setMenuOpen(null);
                                            if (!expandedFolders.has(file.path)) toggleFolder(file);
                                        }}>
                                            <Icon name={FilePlus} size={14} />
                                            <span>New File</span>
                                        </div>
                                        <div className="file-ops-item" onClick={(e) => {
                                            e.stopPropagation();
                                            setCreatingItem({ parentPath: file.path, type: 'folder' });
                                            setMenuOpen(null);
                                            if (!expandedFolders.has(file.path)) toggleFolder(file);
                                        }}>
                                            <Icon name={FolderPlus} size={14} />
                                            <span>New Folder</span>
                                        </div>
                                        <div className="file-ops-item" onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyStructure(file);
                                            setMenuOpen(null);
                                        }}>
                                            <Icon name={List} size={14} />
                                            <span>Copy Project Structure</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {file.isDirectory && isExpanded && (
                            <div className="file-tree-children">
                                {creatingItem && creatingItem.parentPath === file.path && (
                                    <div className="file-tree-input-wrapper" style={{ paddingLeft: (depth + 1) * 12 + 2 }}>
                                        <div className="chevron-container">
                                            <div className="file-tree-placeholder" />
                                        </div>
                                        <Icon
                                            name={creatingItem.type === 'file' ? getFileIcon('new').name : 'folder'}
                                            size={16}
                                            style={{ opacity: 0.6 }}
                                            className="file-icon"
                                        />
                                        <input
                                            ref={inputRef}
                                            className="file-tree-input"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            onKeyDown={handleCreateSubmit}
                                            onBlur={() => {
                                                if (newItemName.trim()) onCreateItem(creatingItem.parentPath, creatingItem.type, newItemName.trim());
                                                setCreatingItem(null);
                                                setNewItemName('');
                                            }}
                                            autoFocus
                                        />
                                    </div>
                                )}
                                {file.children && (
                                    <FileTree
                                        files={file.children}
                                        expandedFolders={expandedFolders}
                                        toggleFolder={toggleFolder}
                                        openFile={openFile}
                                        activeFile={activeFile}
                                        workspace={workspace}
                                        depth={depth + 1}
                                        creatingItem={creatingItem}
                                        setCreatingItem={setCreatingItem}
                                        onCreateItem={onCreateItem}
                                        renamingItem={renamingItem}
                                        setRenamingItem={setRenamingItem}
                                        onRenameItem={onRenameItem}
                                        onDeleteItem={onDeleteItem}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </>
    );
};

const Icon = ({ name, size = 16, className = '', style = {}, ...props }) => {
    const iconRef = useRef(null);

    useEffect(() => {
        if (window.lucide && iconRef.current) {
            // Use a stable way to render the icon that won't confuse React
            iconRef.current.innerHTML = `<i data-lucide="${name}"></i>`;
            window.lucide.createIcons({
                root: iconRef.current, // Scoped to this element
                attrs: {
                    width: size,
                    height: size,
                    'stroke-width': 2,
                    class: className,
                    style: 'display: block; margin: 0; padding: 0;'
                }
            });
        }
    }, [name, size, className]);

    return (
        <span
            ref={iconRef}
            className={`lucide-icon-wrapper ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size + 'px',
                height: size + 'px',
                flexShrink: 0,
                ...style
            }}
            {...props}
        />
    );
};

const Markdown = ({ content, timestamp }) => {
    const html = useMemo(() => {
        if (!content) return '';
        if (!window.marked || !window.DOMPurify) return content;
        try {
            let displayContent = content;
            if (timestamp) {
                // Check if message is raw JSON but failed detection
                const trimmed = content.trim();
                if (trimmed.startsWith('{') && trimmed.endsWith('}') && !content.includes('```')) {
                    displayContent = '```json\n' + content + '\n```';
                }
            }

            let rawHtml = window.marked.parse(displayContent);

            if (timestamp) {
                // Inject timestamp into the last paragraph for efficient space usage
                const lastPIndex = rawHtml.lastIndexOf('</p>');
                const timestampHtml = `<span class="message-time">${timestamp}</span>`;

                if (lastPIndex !== -1) {
                    rawHtml = rawHtml.substring(0, lastPIndex) + timestampHtml + rawHtml.substring(lastPIndex);
                } else {
                    rawHtml += timestampHtml;
                }
            }

            return window.DOMPurify.sanitize(rawHtml, {
                ADD_TAGS: ['button', 'span'],
                ADD_ATTR: ['data-code', 'class'],
                FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
                FORBID_ATTR: ['id', 'name']
            });
        } catch (e) {
            console.error("Markdown parse error", e);
            return content;
        }
    }, [content, timestamp]);

    const handleCopy = (e) => {
        const btn = e.target.closest('.copy-code-btn');
        if (btn) {
            const encodedCode = btn.getAttribute('data-code');
            const textArea = document.createElement("textarea");
            textArea.innerHTML = encodedCode;
            const code = textArea.value;

            navigator.clipboard.writeText(code);
            const originalText = btn.innerText;
            btn.innerText = 'Copied!';
            btn.classList.add('success');
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('success');
            }, 2000);
        }
    };

    useEffect(() => {
        // Find code blocks and inject copy buttons
        // Marked generates <pre><code>...</code></pre>
    }, [html]);

    return (
        <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: html }}
            onClick={handleCopy}
        />
    );
};

// --- SIMPLIFIED AGENT LOGIC (NO HARDCODED CONSTRAINTS) ---
const AGENT_MODES = {
    CHAT: 'chat',
    AUTONOMOUS: 'autonomous',
    FILE_EDIT: 'file_edit'
};

// No hardcoded prompts - direct AI communication
const AGENT_PROMPTS = {};

// Intent detection: Return AUTONOMOUS when in agent mode, otherwise CHAT
const detectAgentIntent = (goal, messages, composerMode) => {
    // If explicitly in agent mode, return AUTONOMOUS
    if (composerMode === 'agent') {
        return AGENT_MODES.AUTONOMOUS;
    }

    // Otherwise, default to CHAT
    return AGENT_MODES.CHAT;
};
// -------------------------

class AIService {
    constructor(settings) {
        this.settings = settings;
        this.model = settings.model || 'deepseek/deepseek-chat';
    }

    getBaseUrl() {
        if (this.model.startsWith('together/')) {
            return "https://api.together.xyz/v1";
        }
        return "https://openrouter.ai/api/v1";
    }

    getApiKey() {
        if (this.model.startsWith('together/')) {
            return this.settings.togetherKey;
        }
        return this.settings.apiKey;
    }

    async chat(messages, onStream, signal, overrideModel, tools = null) {
        const activeModel = overrideModel || this.model;

        if (activeModel.startsWith('together/')) {
            const requestId = Math.random().toString(36).substring(7);

            return new Promise(async (resolve, reject) => {
                let fullText = "";
                let fullReasoning = "";

                if (signal) {
                    if (signal.aborted) return reject(new Error("Request aborted"));
                    signal.addEventListener('abort', () => {
                        window.api.abortTogetherChat(requestId);
                        cleanupChunk();
                        cleanupDone();
                        cleanupError();
                        reject(new Error("Aborted"));
                    }, { once: true });
                }

                let partialLine = "";
                const cleanupChunk = window.api.onTogetherChunk(requestId, (chunk) => {
                    if (signal?.aborted) return;

                    const text = partialLine + chunk;
                    const lines = text.split("\n");
                    partialLine = lines.pop(); // Last line might be incomplete

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6);
                            if (data.trim() === "[DONE]") continue;
                            try {
                                const json = JSON.parse(data);
                                const delta = json.choices[0]?.delta;
                                const content = delta?.content || "";
                                const reasoning = delta?.reasoning_content || "";
                                if (content || reasoning) {
                                    fullText += content;
                                    fullReasoning += reasoning;
                                    if (onStream) onStream({ content, reasoning, fullText, fullReasoning });
                                }
                            } catch (e) {
                                // Ignore partial/corrupted chunks during stream
                            }
                        }
                    }
                });

                const cleanupDone = window.api.onTogetherDone(requestId, () => {
                    cleanupChunk();
                    cleanupDone();
                    cleanupError();
                    resolve(fullText);
                });

                const cleanupError = window.api.onTogetherError(requestId, (err) => {
                    cleanupChunk();
                    cleanupDone();
                    cleanupError();
                    reject(new Error(err));
                });

                try {
                    const res = await window.api.togetherProxyChat({
                        messages,
                        model: activeModel,
                        stream: !!onStream,
                        requestId
                    });
                    if (!onStream) resolve(res.choices[0].message.content);
                } catch (err) {
                    cleanupChunk();
                    cleanupDone();
                    cleanupError();
                    reject(err);
                }
            });
        }

        const apiKey = this.getApiKey();
        const baseUrl = this.getBaseUrl();
        const model = activeModel;

        // Validate API key before making request
        if (!apiKey || apiKey.trim() === '') {
            const providerName = this.model.startsWith('together/') ? 'Together AI' : 'OpenRouter';
            throw new Error(`${providerName} API key is missing. Please configure your API key in Settings (gear icon).`);
        }

        // Pass messages directly without hardcoded system constraints
        const hasSystem = messages.some(m => m.role === 'system');
        const finalMessages = messages; // Direct pass-through


        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                signal,
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/kakaiking/anita",
                    "X-Title": "Anita IDE"
                },
                body: JSON.stringify({
                    model: model,
                    messages: finalMessages,
                    stream: !!onStream,
                    max_tokens: 8192,
                    tools: tools,                           // Add tools support
                    tool_choice: tools ? "auto" : undefined // Let AI decide when to use tools
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;

                // Log full error for debugging
                console.error('Provider Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData,
                    model,
                    baseUrl
                });

                // Provide user-friendly error messages based on status code
                if (response.status === 401) {
                    const providerName = baseUrl.includes('openrouter') ? 'OpenRouter' : 'Together AI';
                    const keyUrl = baseUrl.includes('openrouter')
                        ? 'https://openrouter.ai/keys'
                        : 'https://api.together.xyz/settings/api-keys';
                    throw new Error(`Authentication failed: Invalid ${providerName} API key.\n\n⚠️ Note: This app uses ${providerName}, not OpenAI directly.\nGet your ${providerName} API key from: ${keyUrl}`);
                } else if (response.status === 403) {
                    throw new Error(`Access forbidden: Your API key may not have access to this model (${model}).\n\nTry selecting a different model in Settings.`);
                } else if (response.status === 429) {
                    throw new Error(`Rate limit exceeded: Too many requests. Please wait a moment and try again.`);
                } else if (response.status >= 500) {
                    throw new Error(`Provider server error (${response.status}): The AI service is experiencing issues. Please try again later.`);
                } else {
                    throw new Error(`Provider error (${response.status}): ${errorMessage}\n\nFull error: ${JSON.stringify(errorData)}`);
                }
            }

            if (onStream) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = "";
                let fullReasoning = "";

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
                                const delta = json.choices[0]?.delta;
                                const content = delta?.content || "";
                                const reasoning = delta?.reasoning_content || "";

                                if (content || reasoning) {
                                    fullText += content;
                                    fullReasoning += reasoning;
                                    onStream({ content, reasoning, fullText, fullReasoning });
                                }
                            } catch (e) {
                                console.warn("Error parsing stream chunk", e);
                            }
                        }
                    }
                }
                return fullText;
            } else {
                const data = await response.json();
                if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
                if (!data.choices || data.choices.length === 0) throw new Error("No response from AI.");

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
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}

const CustomSelect = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="custom-select-container" ref={containerRef}>
            <button
                className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Icon name={selectedOption.icon} size={14} style={{ marginRight: 6 }} />
                <span>{selectedOption.label}</span>
                <Icon name={isOpen ? ChevronUp : ChevronDown} size={12} style={{ marginLeft: 6, opacity: 0.5 }} />
            </button>
            {isOpen && (
                <div className="custom-select-options glass">
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            className={`custom-select-option ${value === opt.value ? 'active' : ''}`}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            <div style={{ marginRight: 12, display: 'flex', alignItems: 'center', opacity: value === opt.value ? 1 : 0.6 }}>
                                <Icon name={opt.icon} size={18} />
                            </div>
                            <div className="option-info">
                                <div className="option-label">{opt.label}</div>
                                <div className="option-desc">{opt.description}</div>
                            </div>
                            {value === opt.value && <Icon name={CheckCircle} size={14} className="active-check" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'info' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay confirm-overlay">
            <div className="confirm-dialog glass">
                <div className="confirm-dialog-header">
                    <Icon name={type === 'warning' ? AlertCircle : CheckCircle} size={20} className={`confirm-icon ${type}`} />
                    <span>{title || 'Confirmation'}</span>
                </div>
                <div className="confirm-dialog-content">
                    {message}
                </div>
                <div className="confirm-dialog-actions">
                    <button className="btn btn-outline" onClick={onCancel}>{cancelText}</button>
                    <button className={`btn btn-primary ${type === 'warning' ? 'btn-danger' : ''}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

const ChatStatus = ({ status }) => {
    if (!status) return null;

    const getStatusConfig = () => {
        switch (status) {
            case 'thinking':
                return { label: 'Thinking...', icon: 'brain', color: '#bc8cff' };
            case 'generating':
                return { label: 'Generating...', icon: 'sparkles', color: '#58a6ff' };
            case 'loading':
                return { label: 'Loading...', icon: 'loader-2', color: '#8b949e' };
            case 'processing':
                return { label: 'Processing Plan...', icon: 'list', color: '#3fb950' };
            default:
                return { label: 'Working...', icon: 'loader-2', color: '#8b949e' };
        }
    };

    const config = getStatusConfig();

    return (
        <div className="chat-status-indicator">
            <div className="status-dot-wrapper">
                <div className="status-dot" style={{ backgroundColor: config.color }}></div>
                <div className="status-dot-ping" style={{ backgroundColor: config.color }}></div>
            </div>
            <Icon name={config.icon} size={14} style={{ color: config.color }} className={status === 'loading' || status === 'thinking' ? 'spin' : ''} />
            <span className="status-label" style={{ color: config.color }}>{config.label}</span>
        </div>
    );
};

// ========================
// PROJECT WIZARD MODAL
// ========================
const ProjectWizardModal = ({ isOpen, onClose, onCreateProject }) => {
    const [selectedFramework, setSelectedFramework] = useState(null);
    const [projectName, setProjectName] = useState('');
    const frameworks = window.FrameworkTemplates?.getAllFrameworks() || [];

    if (!isOpen) return null;

    const handleCreate = () => {
        if (selectedFramework && projectName.trim()) {
            onCreateProject(selectedFramework, projectName.trim());
            setSelectedFramework(null);
            setProjectName('');
            onClose();
        }
    };

    return (
        <div className="project-wizard-overlay" onClick={onClose}>
            <div className="project-wizard-modal" onClick={(e) => e.stopPropagation()}>
                <div className="project-wizard-header">
                    <h2>
                        <Icon name="folder-plus" size={20} />
                        Create New Project
                    </h2>
                    <button className="project-wizard-close" onClick={onClose}>
                        <Icon name="x" size={18} />
                    </button>
                </div>

                <div className="project-wizard-content">
                    <div className="project-wizard-section">
                        <label>Project Name</label>
                        <input
                            type="text"
                            className="project-name-input"
                            placeholder="my-awesome-project"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                            autoFocus
                        />
                    </div>

                    <div className="project-wizard-section">
                        <label>Choose Framework</label>
                        <div className="framework-grid">
                            {frameworks.map(fw => (
                                <div
                                    key={fw.id}
                                    className={`framework-card ${selectedFramework?.id === fw.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedFramework(fw)}
                                >
                                    <div className="framework-icon" style={{ backgroundColor: `${fw.color}20`, color: fw.color }}>
                                        <Icon name={fw.icon} size={24} />
                                    </div>
                                    <span className="framework-name">{fw.name}</span>
                                    <span className="framework-desc">{fw.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="project-wizard-footer">
                    <button className="wizard-btn wizard-btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="wizard-btn wizard-btn-primary"
                        onClick={handleCreate}
                        disabled={!selectedFramework || !projectName.trim()}
                    >
                        <Icon name="sparkles" size={16} />
                        Create Project
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========================
// GETTING STARTED TAB
// ========================
const GettingStartedTab = ({ framework, projectName, onCopyCommand, onOpenTerminal }) => {
    if (!framework) return null;

    const formatCommand = (cmd) => {
        return window.FrameworkTemplates?.formatCommand(cmd, projectName) || cmd;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        if (onCopyCommand) onCopyCommand(text);
    };

    return (
        <div className="getting-started-container">
            <div className="getting-started-header">
                <div className="getting-started-framework">
                    <div
                        className="framework-badge"
                        style={{ backgroundColor: `${framework.color}20`, color: framework.color }}
                    >
                        <Icon name={framework.icon} size={18} />
                        {framework.name}
                    </div>
                </div>
                <h1>Get Started with {projectName}</h1>
                <p>Follow these steps to set up your development environment</p>
            </div>

            <div className="setup-steps">
                {framework.installSteps.map((step, index) => (
                    <div key={step.id} className="setup-step">
                        <div className="setup-step-header">
                            <div className="step-number">{index + 1}</div>
                            <h3>{step.title}</h3>
                        </div>

                        <div className="setup-step-content">
                            {step.description && <p>{step.description}</p>}

                            {step.type === 'download' && step.url && (
                                <a
                                    href={step.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="step-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.api?.openExternal?.(step.url) || window.open(step.url, '_blank');
                                    }}
                                >
                                    <Icon name="external-link" size={14} />
                                    {step.url.replace('https://', '').split('/')[0]}
                                </a>
                            )}

                            {step.type === 'env' && step.steps && (
                                <ul className="env-steps">
                                    {step.steps.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            )}

                            {step.type === 'terminal' && step.command && (
                                <div className="step-command">
                                    <code>{formatCommand(step.command)}</code>
                                    <button
                                        className="copy-command-btn"
                                        onClick={() => copyToClipboard(formatCommand(step.command))}
                                    >
                                        <Icon name="copy" size={12} />
                                        Copy
                                    </button>
                                </div>
                            )}

                            {step.expectedOutput && (
                                <p style={{ opacity: 0.6, fontSize: 12, marginTop: 8 }}>
                                    ℹ️ {step.expectedOutput}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// @-Mention Autocomplete Dropdown Component
const MentionAutocomplete = ({ files, query, position, selectedIndex, onSelect, onClose, onIndexChange }) => {
    const dropdownRef = useRef(null);

    // Filter files based on query
    const filteredFiles = useMemo(() => {
        if (!files || files.length === 0) return [];

        // Flatten file tree to get all files
        const flattenFiles = (fileList, parentPath = '') => {
            let result = [];
            fileList.forEach(file => {
                const relativePath = parentPath ? `${parentPath}/${file.name}` : file.name;
                if (!file.isDirectory) {
                    result.push({
                        name: file.name,
                        path: file.path,
                        relativePath: relativePath
                    });
                }
                if (file.children && file.children.length > 0) {
                    result = result.concat(flattenFiles(file.children, relativePath));
                }
            });
            return result;
        };

        const allFiles = flattenFiles(files);

        if (!query) return allFiles.slice(0, 10);

        const lowerQuery = query.toLowerCase();
        return allFiles
            .filter(f =>
                f.name.toLowerCase().includes(lowerQuery) ||
                f.relativePath.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 10);
    }, [files, query]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!position) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                onIndexChange(Math.min(selectedIndex + 1, filteredFiles.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                onIndexChange(Math.max(selectedIndex - 1, 0));
            } else if (e.key === 'Enter' && filteredFiles.length > 0) {
                e.preventDefault();
                onSelect(filteredFiles[selectedIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [position, selectedIndex, filteredFiles, onSelect, onClose, onIndexChange]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (position) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [position, onClose]);

    if (!position || filteredFiles.length === 0) return null;

    return (
        <div
            ref={dropdownRef}
            className="mention-autocomplete glass"
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                zIndex: 10000
            }}
        >
            {filteredFiles.map((file, index) => {
                const icon = getFileIcon(file.name);
                return (
                    <div
                        key={file.path}
                        className={`mention-item ${index === selectedIndex ? 'selected' : ''}`}
                        onClick={() => onSelect(file)}
                        onMouseEnter={() => onIndexChange(index)}
                    >
                        <Icon name={icon.name} size={14} style={{ color: icon.color }} />
                        <span className="mention-name">{file.name}</span>
                        <span className="mention-path">{file.relativePath}</span>
                    </div>
                );
            })}
        </div>
    );
};

const App = () => {
    const [workspace, setWorkspace] = useState(null);
    const [files, setFiles] = useState([]);
    const [activeFile, setActiveFile] = useState(null);
    const [tabs, setTabs] = useState([]);
    const [settings, setSettings] = useState({
        apiKey: '',
        theme: 'dark',
        model: 'deepseek/deepseek-chat',
        userBubbleColor: '#58a6ff',
        aiBubbleColor: '#161b22',
        userTextColor: '#000000',
        aiTextColor: '#e6edf3',
        chatBgImage: '',
        userBubbleBgImage: '',
        aiBubbleBgImage: '',
        togetherKey: '',
        startupHelloColor: '#e6edf3',
        startupMsgColor: '#8b949e',
        agentExecutionMode: 'permission' // 'permission' or 'autonomous'
    });
    const [showSettings, setShowSettings] = useState(false);
    const [activeSettingsMenu, setActiveSettingsMenu] = useState('AI Model');
    const [expandedAccordions, setExpandedAccordions] = useState(new Set(['chat']));
    const [activeTab, setActiveTab] = useState('chat');
    const [composerInput, setComposerInput] = useState('');
    const [logs, setLogs] = useState([]);
    const [sessions, setSessions] = useState([]);
    // Unified status state for chats (independent tabs)
    const stopExecutionRef = useRef({}); // Map of chatId -> boolean
    const abortControllersRef = useRef({}); // Map of chatId -> AbortController



    // Layout State
    const [isLeftSidebarVisible, setIsLeftSidebarVisible] = useState(true);
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
    const [isTerminalVisible, setIsTerminalVisible] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [rightPanelWidth, setRightPanelWidth] = useState(380);
    const [terminalHeight, setTerminalHeight] = useState(240);
    const [resizing, setResizing] = useState(null); // 'left', 'right', 'bottom'
    const [isHistorySidebarVisible, setIsHistorySidebarVisible] = useState(false);
    const [isCentralPanelVisible, setIsCentralPanelVisible] = useState(true);
    const [tokenUsage, setTokenUsage] = useState({ session: 0, total: 0 });
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [terminals, setTerminals] = useState([{
        id: 't1',
        logs: [],
        input: '',
        history: [],
        historyIndex: -1,
        cwd: '',
        cwdInput: ''
    }]);
    const [activeTerminalId, setActiveTerminalId] = useState('t1');
    const [composerMode, setComposerMode] = useState('chat');

    // @-Mention Autocomplete State
    const [previewFile, setPreviewFile] = useState(null);
    const [hoveredTab, setHoveredTab] = useState(null);
    const [isDevServerRunning, setIsDevServerRunning] = useState(false);
    const [devServerUrl, setDevServerUrl] = useState(null);
    const [devServerTerminalId, setDevServerTerminalId] = useState(null);
    const [mentionQuery, setMentionQuery] = useState(null); // { query: 'in', startIndex: 5 }
    const [mentionDropdownPosition, setMentionDropdownPosition] = useState(null); // { top, left }
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

    const [creatingItem, setCreatingItem] = useState(null); // { parentPath, type }
    const [renamingItem, setRenamingItem] = useState(null); // { path, oldName }
    const [explorerMenuOpen, setExplorerMenuOpen] = useState(false);
    const [isTerminalHeaderExpanded, setIsTerminalHeaderExpanded] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm, onCancel, confirmText, cancelText, type }

    // Project Wizard State
    const [showProjectWizard, setShowProjectWizard] = useState(false);
    const [selectedFramework, setSelectedFramework] = useState(null);
    const [projectName, setProjectName] = useState('');
    const [gettingStartedTab, setGettingStartedTab] = useState(null); // { framework, projectName }

    // File-Scoped Chat State
    const [fileChats, setFileChats] = useState({}); // { [filePath]: chatObject }
    const [activeFileChatPath, setActiveFileChatPath] = useState(null);

    const handleStop = (chatId = activeChatId) => {
        if (abortControllersRef.current[chatId]) {
            abortControllersRef.current[chatId].abort();
            delete abortControllersRef.current[chatId];
        }
        setChats(prev => prev.map(c => c.id === chatId ? {
            ...c,
            isPlanning: false,
            aiStatus: null,
            isAgentExecuting: false,
            messages: c.messages.filter(m => !m.isLoading)
        } : c));
        stopExecutionRef.current[chatId] = true;
        addLog(null, "Operation cancelled by user.");
    };

    // Chat Sessions State
    const [chats, setChats] = useState([{
        id: 'default',
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
        aiStatus: null,
        isPlanning: false,
        isAgentExecuting: false
    }]);
    const [activeChatId, setActiveChatId] = useState('default');
    const [openChatIds, setOpenChatIds] = useState(['default']);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
    const isPlanning = activeChat?.isPlanning || false;
    const aiStatus = activeChat?.aiStatus || null;
    const isAgentExecuting = activeChat?.isAgentExecuting || false;

    // Refs for safe access in dynamic execution loops
    const sessionsRef = useRef(sessions);
    const workspaceRef = useRef(workspace);

    useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
    useEffect(() => { workspaceRef.current = workspace; }, [workspace]);

    const monacoRef = useRef(null);
    const editorContainerRef = useRef(null);
    const terminalInputRef = useRef(null);
    const composerRef = useRef(null);

    // Refs for safe access in callbacks/commands
    const activeFileRef = useRef(activeFile);
    const saveFileRef = useRef(null); // Will be assigned via effect

    useEffect(() => { activeFileRef.current = activeFile; }, [activeFile]);
    // saveFileRef is updated in a separate effect below since saveFile is defined later

    const ai = useMemo(() => {
        console.log('DEBUG: Creating AIService with key length:', settings.apiKey?.length, 'Model:', settings.model);
        if (!settings.apiKey) console.warn('DEBUG: API Key is missing!');
        return new AIService(settings);
    }, [settings.apiKey, settings.model]);

    // AgentManager for function calling
    const agentManagerRef = useRef(null);

    // Helper to refresh active file content from disk
    const refreshActiveFile = async () => {
        if (!activeFile || !monacoRef.current) return;
        try {
            const content = await window.api.readFile(activeFile);

            // Update Monaco Model
            const models = window.monaco.editor.getModels();
            const uri = window.monaco.Uri.file(activeFile.replace(/\\/g, '/'));
            const model = models.find(m => m.uri.toString() === uri.toString());

            if (model) {
                const currentContent = model.getValue();
                if (currentContent !== content) {
                    // Update content only if changed to preserve cursor if possible (though setValue resets it)
                    // For full file replacements, setValue is appropriate
                    model.setValue(content);
                }
            }

            // Update Tabs State
            setTabs(prev => prev.map(t =>
                t.path === activeFile ? { ...t, content, isDirty: false } : t
            ));

        } catch (e) {
            console.error("Failed to refresh active file:", e);
        }
    };

    // Initialize Instance whenever AI changes (Class is now global window.AgentManager)
    useEffect(() => {
        if (settings.apiKey && window.AgentManager && ai) {
            console.log("Initializing new AgentManager instance");
            try {
                agentManagerRef.current = new window.AgentManager(ai, {
                    addLog: (msg) => addLog(null, msg),
                    updateUI: () => setChats(prev => [...prev]),
                    updateSession: (sessionId, updates) => {
                        setChats(prev => prev.map(c => ({
                            ...c,
                            agentSessions: (c.agentSessions || []).map(s =>
                                s.id === sessionId ? { ...s, ...updates } : s
                            )
                        })));
                    },
                    loadFiles: (workspace) => loadFiles(workspace),
                    refreshActiveFile: () => refreshActiveFile()
                });
                console.log("AgentManager initialized successfully");
            } catch (err) {
                console.error("Error creating AgentManager:", err);
            }
        }
    }, [settings.apiKey, ai, activeFile]); // Added activeFile dependency so closure captures current activeFile

    const updateChat = (chatId, updates) => {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, ...updates } : c));
    };

    const clearChat = (chatId) => {
        setChats(prev => prev.map(c => c.id === chatId ? {
            ...c,
            messages: [],
            agentSessions: [],
            lastUpdatedAt: Date.now()
        } : c));

        // Focus the composer input after clearing
        setTimeout(() => {
            if (composerRef.current) {
                composerRef.current.focus();
            }
        }, 100);
    };

    const [showScrollUp, setShowScrollUp] = useState(false);
    const [showScrollDown, setShowScrollDown] = useState(false);

    const chatContainerRef = useRef(null);

    const handleChatScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;

        setShowScrollDown(scrollHeight - scrollTop - clientHeight >= 50);
        setShowScrollUp(scrollTop >= 50);

        // Debounce or optimize this in a real app, but for now direct update is acceptable if not too frequent
        // Using a ref to track pending updates could be better, but we need it in state for persistence
        // Let's use a timeout to debounce
        if (window.scrollTimeout) clearTimeout(window.scrollTimeout);
        window.scrollTimeout = setTimeout(() => {
            setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, scrollTop } : c));
        }, 500);
    };

    // Restore scroll position on chat switch
    useLayoutEffect(() => {
        if (chatContainerRef.current && activeChat) {
            // Restore saved position or default to bottom if not set (legacy/new)
            // But wait, if it's a new chat or we want "exact position", we trust the value.
            // If scrollTop is undefined, it might be 0 or bottom. 
            // Let's assume if undefined/null, we go to bottom (legacy behavior)
            // If it is a number (including 0), we restore it.
            if (typeof activeChat.scrollTop === 'number') {
                chatContainerRef.current.scrollTop = activeChat.scrollTop;
            } else {
                // Legacy fallback: scroll to bottom
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }

            // Initialize button visibility immediately
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            setShowScrollDown(scrollHeight - scrollTop - clientHeight >= 50);
            setShowScrollUp(scrollTop >= 50);
        }
    }, [activeChatId]); // Only when ID switches

    // Scroll to bottom ONLY on new messages, not switch
    // Scroll to bottom ONLY on new messages, not switch
    const prevMessagesLen = useRef(0);
    const prevChatIdRef = useRef(activeChatId);

    useEffect(() => {
        // If chat changed, don't scroll, just reset tracker
        if (activeChatId !== prevChatIdRef.current) {
            prevMessagesLen.current = activeChat?.messages?.length || 0;
            prevChatIdRef.current = activeChatId;
            return;
        }

        if (activeChat?.messages) {
            // Check if messages length actually increased
            if (activeChat.messages.length > prevMessagesLen.current) {
                const el = document.getElementById('chat-end');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
            prevMessagesLen.current = activeChat.messages.length;

            // Recalculate button visibility whenever messages change/load
            if (chatContainerRef.current) {
                // Use a small timeout to allow layout to settle after new messages render
                setTimeout(() => {
                    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
                    setShowScrollDown(scrollHeight - scrollTop - clientHeight >= 50);
                    setShowScrollUp(scrollTop >= 50);
                }, 100);
            }
        }
    }, [activeChat?.messages, activeChatId]);

    useEffect(() => {
        const init = async () => {
            const path = await window.api.getWorkspacePath();
            if (path) {
                setWorkspace(path);
                setTerminals(prev => prev.map(t => ({ ...t, cwd: path, cwdInput: path })));
                loadFiles(path);
            }
            const tcwd = await window.api.getTerminalCwd(activeTerminalId);
            if (tcwd) {
                setTerminals(prev => prev.map(t => t.id === 't1' ? { ...t, cwd: tcwd, cwdInput: tcwd } : t));
            }
            const defaultSettings = {
                apiKey: '',
                theme: 'dark',
                model: 'deepseek/deepseek-chat',
                userBubbleColor: '#58a6ff',
                aiBubbleColor: '#161b22',
                userTextColor: '#000000',
                aiTextColor: '#e6edf3',
                chatBgImage: '',
                userBubbleBgImage: '',
                aiBubbleBgImage: '',
                togetherKey: '',
                startupHelloColor: '#e6edf3',
                startupMsgColor: '#8b949e',
                agentExecutionMode: 'permission'
            };
            const s = await window.api.getSettings();
            if (s) {
                // Migrate from legacy or problematic models
                if (!s.model ||
                    s.model.includes('deepseek-r1:free') ||
                    s.model.includes('70b-chat-hf') ||
                    s.model.includes('Llama-3-70b')
                ) {
                    s.model = 'deepseek/deepseek-chat';
                }
                setSettings(prev => ({ ...defaultSettings, ...prev, ...s }));
            }
            const usage = await window.api.getTokenUsage();
            if (usage) setTokenUsage(usage);

            const savedSessions = await window.api.getSessions();
            if (savedSessions) setSessions(savedSessions);
            const savedChats = await window.api.getChats() || [];
            const savedActiveId = await window.api.getActiveChatId();
            const savedOpenIds = await window.api.getOpenChatIds() || [];

            if (savedChats.length > 0) {
                // Ensure backward compatibility: add agentSessions if missing
                const normalizedChats = savedChats.map(chat => ({
                    ...chat,
                    agentSessions: chat.agentSessions || []
                }));
                setChats(normalizedChats);
                setOpenChatIds(savedOpenIds.length > 0 ? savedOpenIds : [savedChats[0].id]);

                // Validate active ID
                const isValidActive = savedChats.find(c => c.id === savedActiveId);
                const fallbackId = savedOpenIds.length > 0 ? savedOpenIds[0] : savedChats[0].id;
                setActiveChatId(isValidActive ? savedActiveId : fallbackId);

                setHistoryLoaded(true);
            } else {
                // Always start with a fresh chat on launch if nothing saved
                const newChatId = 'c-' + Date.now();
                const freshChat = {
                    id: newChatId,
                    title: 'New Chat',
                    messages: [],
                    agentSessions: [], // Store agent execution sessions for persistence
                    createdAt: Date.now(),
                    lastUpdatedAt: Date.now()
                };

                setChats([freshChat]);
                setOpenChatIds([newChatId]);
                setActiveChatId(newChatId);
                setHistoryLoaded(true);
            }

            if (!s || !s.apiKey) setShowSettings(true);


            if (window.marked) {
                // Use the modern .use API for consistent rendering
                window.marked.use({
                    renderer: {
                        code(args, language) {
                            let code = typeof args === 'object' ? args.text : args;
                            let lang = typeof args === 'object' ? (args.lang || 'code') : (language || 'code');

                            if (typeof code !== 'string') code = String(code || '');

                            const escapedCode = code
                                .replace(/&/g, "&amp;")
                                .replace(/</g, "&lt;")
                                .replace(/>/g, "&gt;")
                                .replace(/"/g, "&quot;")
                                .replace(/'/g, "&#039;");

                            return `
                                <div class="code-block-wrapper">
                                    <div class="code-block-header">
                                        <span>${lang}</span>
                                        <button class="copy-code-btn" data-code="${escapedCode}">Copy</button>
                                    </div>
                                    <pre><code class="language-${lang}">${code}</code></pre>
                                </div>
                            `;
                        }
                    },
                    breaks: true,
                    gfm: true
                });
            }
            if (window.api.onTerminalData) {
                window.api.onTerminalData(({ terminalId, data }) => {
                    const cleanData = data.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                    if (!cleanData) return;

                    setTerminals(prev => prev.map(t => {
                        if (t.id === terminalId) {
                            // URL Sniffing for Dev Server
                            if (isDevServerRunning && !devServerUrl) {
                                const urlMatch = cleanData.match(/http:\/\/localhost:\d+/);
                                if (urlMatch) {
                                    setDevServerUrl(urlMatch[0]);
                                    addLog(null, `Dev Server detected at ${urlMatch[0]}`, 'info');
                                }
                            }

                            const lastLog = t.logs[t.logs.length - 1];
                            if (lastLog && lastLog.type === 'terminal' && (Date.now() - lastLog.timestamp < 1000)) {
                                const newLogs = [...t.logs];
                                newLogs[newLogs.length - 1] = { ...lastLog, msg: lastLog.msg + cleanData };
                                return { ...t, logs: newLogs.slice(-200) };
                            } else {
                                return {
                                    ...t,
                                    logs: [...t.logs.slice(-200), {
                                        id: Date.now() + Math.random(),
                                        timestamp: Date.now(),
                                        msg: cleanData,
                                        type: 'terminal',
                                        time: new Date().toLocaleTimeString()
                                    }]
                                };
                            }
                        }
                        return t;
                    }));
                });
            }
        };
        if (window.lucide) {
            window.lucide.createIcons();
        }
        init();
    }, []);

    // Effect to refresh icons when relevant state changes
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [activeChatId, openChatIds, isHistorySidebarVisible, isCentralPanelVisible, chats, showScrollUp, showScrollDown]);

    // Dedicated Monaco Initialization and Lifecycle Effect
    useEffect(() => {
        if (!isCentralPanelVisible) {
            if (monacoRef.current) {
                // Properly dispose all models and the editor instance
                const models = window.monaco?.editor?.getModels() || [];
                models.forEach(m => m.dispose());
                monacoRef.current.dispose();
                monacoRef.current = null;
            }
            return;
        }

        if (window.require) {
            // Configure Monaco Loader to use the CDN
            window.require.config({
                paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }
            });

            window.require(['vs/editor/editor.main'], function () {
                const container = editorContainerRef.current;
                if (container) {
                    // Ensure no double initialization
                    if (monacoRef.current) {
                        return; // Already initialized
                    }

                    monacoRef.current = window.monaco.editor.create(container, {
                        theme: 'vs-dark',
                        automaticLayout: true,
                        fontSize: 14,
                        fontFamily: "'Fira Code', 'Cascadia Code', 'Source Code Pro', monospace",
                        fontLigatures: true,
                        minimap: { enabled: true, side: 'right', renderCharacters: false, maxColumn: 120 },
                        folding: true,
                        foldingHighlight: true,
                        foldingStrategy: 'indentation',
                        showFoldingControls: 'mouseover',
                        renderIndentGuides: true,
                        highlightActiveIndentGuide: true,
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        mouseWheelZoom: true,
                        bracketPairColorization: { enabled: true },
                        padding: { top: 12, bottom: 8 },
                        scrollbar: {
                            verticalScrollbarSize: 10,
                            horizontalScrollbarSize: 10,
                            useShadows: false,
                            vertical: 'visible',
                            horizontal: 'visible'
                        },
                        fixedOverflowWidgets: true,
                        roundedSelection: true,
                        overviewRulerBorder: false,
                        quickSuggestions: { other: true, comments: true, strings: true },
                        parameterHints: { enabled: true },
                        suggestOnTriggerCharacters: true,
                        tabCompletion: "on",
                        wordBasedSuggestions: "allDocuments",
                    });

                    // Register AI Inline Suggestion Provider
                    window.monaco.languages.registerCompletionItemProvider('*', {
                        triggerCharacters: ['.', ' ', '(', '{'],
                        provideCompletionItems: async (model, position) => {
                            // Only trigger manually or on specific logic to avoid overwhelming
                            // We'll use a specific indicator or just check if it's a "low confidence" area
                            const line = model.getLineContent(position.lineNumber);
                            if (!line.trim().endsWith('/') && !line.includes('// AI:')) return { suggestions: [] };

                            const text = model.getValue();
                            const offset = model.getOffsetAt(position);
                            const context = text.substring(Math.max(0, offset - 1000), offset);

                            try {
                                const response = await ai.chat([{
                                    role: 'system',
                                    content: `You are a code completion engine. Predict the next few tokens of code. Return ONLY the code, no markdown, no explanation.`
                                }, {
                                    role: 'user',
                                    content: `Context:\n${context}`
                                }]);

                                if (response) {
                                    return {
                                        suggestions: [{
                                            label: 'AI Suggestion',
                                            kind: window.monaco.languages.CompletionItemKind.Snippet,
                                            insertText: response.trim(),
                                            detail: 'Generated by AI',
                                            range: {
                                                startLineNumber: position.lineNumber,
                                                endLineNumber: position.lineNumber,
                                                startColumn: position.column,
                                                endColumn: position.column
                                            }
                                        }]
                                    };
                                }
                            } catch (e) { console.error(e); }
                            return { suggestions: [] };
                        }
                    });

                    // Immediate layout refresh
                    monacoRef.current.layout();

                    // ResizeObserver for reliable layout updates
                    const ro = new ResizeObserver(() => {
                        if (monacoRef.current) {
                            monacoRef.current.layout();
                        }
                    });
                    ro.observe(container);

                    // Add AI Context Menu Action
                    monacoRef.current.addAction({
                        id: 'ai-explain',
                        label: 'Explain Code with AI',
                        keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyE],
                        contextMenuGroupId: 'navigation',
                        contextMenuOrder: 1,
                        run: (ed) => {
                            const selection = ed.getSelection();
                            const text = ed.getModel().getValueInRange(selection) || ed.getModel().getValue();
                            if (text) {
                                setComposerInput(`Explain this code segment from ${activeFile.split(/[\\/]/).pop()}:\n\n\`\`\`${activeFile.split('.').pop()}\n${text}\n\`\`\``);
                                setIsRightPanelVisible(true);
                                setActiveTab('chat');
                                if (composerRef.current) {
                                    composerRef.current.focus();
                                }
                            }
                        }
                    });

                    monacoRef.current.addAction({
                        id: 'ai-fix',
                        label: 'Suggest Fix with AI',
                        keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyMod.Shift | window.monaco.KeyCode.KeyF],
                        contextMenuGroupId: 'navigation',
                        contextMenuOrder: 2,
                        run: (ed) => {
                            const selection = ed.getSelection();
                            const text = ed.getModel().getValueInRange(selection);
                            if (text) {
                                setComposerInput(`Identify issues and suggest improvements for this code segment:\n\n\`\`\`${activeFile.split('.').pop()}\n${text}\n\`\`\``);
                                setIsRightPanelVisible(true);
                                setActiveTab('chat');
                                if (composerRef.current) {
                                    composerRef.current.focus();
                                }
                            } else {
                                addLog(null, "Please select code to fix", "info");
                            }
                        }
                    });

                    // Global Save Command
                    monacoRef.current.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyS, () => {
                        if (activeFileRef.current && saveFileRef.current) {
                            saveFileRef.current(activeFileRef.current);
                        }
                    });

                    // Restore active file if panel was just toggled on
                    if (activeFile) {
                        const tab = tabs.find(t => t.path === activeFile);
                        if (tab) openFile(tab);
                    }
                }
            });
        }

        return () => {
            if (monacoRef.current) {
                monacoRef.current.dispose();
                monacoRef.current = null;
            }
        };
    }, [isCentralPanelVisible]);

    useEffect(() => {
        if (monacoRef.current && activeFile) {
            setTimeout(() => {
                monacoRef.current.layout();
            }, 100);
        }
    }, [activeFile]);

    // Navigation Cursor for Chat
    const navCursorRef = useRef(null); // null = at bottom; number = index of user message

    // Reset cursor when chat changes
    useEffect(() => {
        navCursorRef.current = null;
    }, [activeChatId]);

    const handleChatNavigation = (direction) => {
        if (!activeChat || !activeChat.messages) return;

        const userMessages = activeChat.messages.filter(m => m.role === 'user');
        if (userMessages.length === 0) return;

        if (direction === 'down') {
            navCursorRef.current = null;
            const el = document.getElementById('chat-end');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        if (direction === 'up') {
            if (navCursorRef.current === null) {
                // First click up: go to last user message
                navCursorRef.current = userMessages.length - 1;
            } else {
                // Subsequent clicks: go to previous
                navCursorRef.current = Math.max(0, navCursorRef.current - 1);
            }

            const targetMsg = userMessages[navCursorRef.current];
            if (targetMsg) {
                const el = document.getElementById(targetMsg.id);
                // Align to top as requested ("becomes the very top message")
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    // Scroll terminal to bottom only when active terminal updates
    const activeTerminalLogs = useMemo(() =>
        terminals.find(t => t.id === activeTerminalId)?.logs,
        [terminals, activeTerminalId]);

    useEffect(() => {
        // Only scroll if the active terminal actually grew
        const el = document.getElementById('logs-end');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, [activeTerminalLogs, activeTerminalId]);

    // Old scroll effect removed in favor of controlled one above
    /*
    useEffect(() => {
        const el = document.getElementById('chat-end');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, [activeChat?.messages, activeChatId]);
    */

    // Auto-save chats whenever any state changes
    useEffect(() => {
        if (historyLoaded) {
            // Only save chats that have messages
            const chatsToSave = chats.filter(c => c.messages.length > 0).map(c => ({
                ...c,
                messages: c.messages.filter(m => !m.isLoading)
            }));
            window.api.saveChats(chatsToSave);
            window.api.saveOpenChatIds(openChatIds);
            window.api.saveActiveChatId(activeChatId);
        }
    }, [chats, openChatIds, activeChatId, historyLoaded]);


    const createNewChat = () => {
        const existingTitles = new Set(chats.map(c => c.title));
        let newTitle = 'New Chat';
        if (existingTitles.has(newTitle)) {
            let counter = 1;
            while (existingTitles.has(`New Chat(${counter})`)) {
                counter++;
            }
            newTitle = `New Chat(${counter})`;
        }

        const newChat = {
            id: 'c-' + Date.now(),
            title: newTitle,
            messages: [],
            agentSessions: [], // Store agent execution sessions for persistence
            createdAt: Date.now(),
            lastUpdatedAt: Date.now(),
            aiStatus: null,
            isPlanning: false,
            isAgentExecuting: false
        };
        setChats(prev => [...prev, newChat]);
        setOpenChatIds(prev => [...prev, newChat.id]);
        setActiveChatId(newChat.id);
    };

    const closeChatTab = (id, e) => {
        e.stopPropagation();
        const newOpenIds = openChatIds.filter(oid => oid !== id);
        setOpenChatIds(newOpenIds);

        if (activeChatId === id) {
            setActiveChatId(newOpenIds.length > 0 ? newOpenIds[newOpenIds.length - 1] : null);
        }
    };



    // Drag Resizing Listeners
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!resizing) return;

            if (resizing === 'left') {
                const newWidth = Math.max(150, Math.min(600, e.clientX));
                setSidebarWidth(newWidth);
            } else if (resizing === 'right') {
                const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
                setRightPanelWidth(newWidth);
            } else if (resizing === 'bottom') {
                // Simple resizing behavior: Standard Show/Hide
                // Clamp height between 100px and window height
                const newHeight = Math.max(100, Math.min(window.innerHeight - 100, window.innerHeight - e.clientY));
                setTerminalHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            setResizing(null);
            document.body.classList.remove('is-resizing', 'resizing-left', 'resizing-right', 'resizing-bottom');
        };

        if (resizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.classList.add('is-resizing', `resizing-${resizing}`);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing, isTerminalVisible]);

    const loadFiles = async (path, customExpandedPaths = null) => {
        try {
            // CRITICAL: Always use current expandedFolders state to preserve expansion
            // Only use customExpandedPaths when explicitly provided (e.g., during rename)
            const exp = customExpandedPaths !== null ? customExpandedPaths : expandedFolders;

            const fetchDirRecursive = async (dirPath) => {
                const results = await window.api.readDir(dirPath);
                const sorted = results.sort((a, b) => {
                    if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
                    return a.isDirectory ? -1 : 1;
                });

                for (const file of sorted) {
                    if (file.isDirectory && exp.has(file.path)) {
                        file.children = await fetchDirRecursive(file.path);
                    }
                }
                return sorted;
            };

            const rootChildren = await fetchDirRecursive(path);
            const rootName = path.split(/[\\\/]/).filter(Boolean).pop() || 'Project';

            setFiles([{
                name: rootName,
                path: path,
                isDirectory: true,
                children: rootChildren
            }]);

            // Only add root path if not using custom expanded paths
            if (customExpandedPaths === null) {
                setExpandedFolders(prev => {
                    const next = new Set(prev);
                    next.add(path);
                    return next;
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Auto-refresh file explorer
    useEffect(() => {
        if (window.api.onFileChange) {
            window.api.onFileChange(({ eventType, filename }) => {
                // Determine if we should refresh based on filename (optional, but already filtered in main)
                // We just reload the current workspace
                if (workspaceRef.current) {
                    loadFiles(workspaceRef.current);
                }
            });
        }
    }, []);

    const onCreateItem = async (parentPath, type, name) => {
        const fullPath = `${parentPath}\\${name}`;
        try {
            if (type === 'file') {
                await window.api.writeFile(fullPath, '');
                openFile({ path: fullPath, name, isDirectory: false });
            } else {
                await window.api.createFolder(fullPath);
                // Auto-expand the newly created folder
                setExpandedFolders(prev => {
                    const next = new Set(prev);
                    next.add(fullPath);
                    return next;
                });
            }

            // Ensure parent folder is expanded
            setExpandedFolders(prev => {
                const next = new Set(prev);
                next.add(parentPath);
                return next;
            });

            addLog(null, `Created ${type}: ${name}`);
            loadFiles(workspaceRef.current);
        } catch (err) {
            addLog(null, `Error creating ${type}: ${err.message}`, 'error');
        }
    };


    const onDeleteItem = (path, isDirectory) => {
        setConfirmDialog({
            title: `Delete ${isDirectory ? 'Folder' : 'File'}`,
            message: `Are you sure you want to delete ${path.split(/[\\/]/).pop()}? This cannot be undone.`,
            confirmText: 'Delete',
            type: 'warning',
            onConfirm: async () => {
                try {
                    await window.api.deletePath(path);
                    addLog(null, `Deleted ${path}`);

                    // Close tab if file or if inside folder
                    if (!isDirectory) {
                        setTabs(prev => prev.filter(t => t.path !== path));
                        if (activeFile === path) setActiveFile(null);
                    } else {
                        // If folder, close all tabs inside it
                        setTabs(prev => prev.filter(t => !t.path.startsWith(path + '\\') && t.path !== path));
                        if (activeFile && (activeFile === path || activeFile.startsWith(path + '\\'))) setActiveFile(null);
                    }

                    // Reload files
                    loadFiles(workspace);
                    setConfirmDialog(null);
                } catch (err) {
                    addLog(null, `Error deleting: ${err.message}`, 'error');
                    setConfirmDialog(null);
                }
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    const onRenameItem = async (oldPath, newName) => {
        const parentDir = oldPath.substring(0, oldPath.lastIndexOf('\\'));
        const newPath = `${parentDir}\\${newName}`;
        try {
            await window.api.renamePath(oldPath, newPath);
            addLog(null, `Renamed to ${newName}`);

            const nextExp = new Set();
            expandedFolders.forEach(p => {
                if (p === oldPath) nextExp.add(newPath);
                else if (p.startsWith(oldPath + '\\')) nextExp.add(p.replace(oldPath, newPath));
                else nextExp.add(p);
            });
            setExpandedFolders(nextExp);

            if (activeFile === oldPath || activeFile?.startsWith(oldPath + '\\')) {
                setActiveFile(activeFile.replace(oldPath, newPath));
            }
            setTabs(prev => prev.map(t => {
                if (t.path === oldPath || t.path.startsWith(oldPath + '\\')) {
                    return { ...t, path: t.path.replace(oldPath, newPath), name: t.path === oldPath ? newName : t.name };
                }
                return t;
            }));

            loadFiles(workspace, nextExp);
        } catch (err) {
            addLog(null, `Error renaming: ${err.message}`, 'error');
        }
    };


    const toggleFolder = async (folder) => {
        const path = folder.path;
        const newExpanded = new Set(expandedFolders);

        if (newExpanded.has(path)) {
            newExpanded.delete(path);
            setExpandedFolders(newExpanded);
            return; // Collapsing - just update state and return
        } else {
            newExpanded.add(path);
            setExpandedFolders(newExpanded);
        }

        // If children already loaded, we're done (just needed to update expanded state above)
        if (folder.children) {
            return;
        }

        // Need to load children - do it immutably
        try {
            const children = await window.api.readDir(path);
            const sortedChildren = children.sort((a, b) => {
                if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
                return a.isDirectory ? -1 : 1;
            });

            // Immutably update the file tree
            const updateFolderChildren = (items) => {
                return items.map(item => {
                    if (item.path === path) {
                        // Found the folder - return new object with children
                        return { ...item, children: sortedChildren };
                    } else if (item.children && item.isDirectory) {
                        // Recursively search in children
                        return { ...item, children: updateFolderChildren(item.children) };
                    }
                    return item;
                });
            };

            setFiles(updateFolderChildren(files));
        } catch (err) {
            console.error('Error loading folder children:', err);
        }
    };

    const handleSelectWorkspace = async () => {
        const path = await window.api.selectWorkspace();
        if (path) {
            setWorkspace(path);
            setTerminals(prev => prev.map(t => ({ ...t, cwd: path, cwdInput: path })));
            loadFiles(path);
        }
    };

    // Handle project creation from wizard
    const handleCreateProject = (framework, projectName) => {
        // Store the getting started info
        setGettingStartedTab({ framework, projectName });

        // Open the central panel with editor + terminal visible
        setIsCentralPanelVisible(true);
        setIsTerminalVisible(true);
        setIsRightPanelVisible(false); // Chat hidden by default

        // Close any other tabs and set active to getting-started pseudo-tab
        setActiveFile('__getting-started__');

        addLog(null, `🚀 Starting new ${framework.name} project: ${projectName}`, 'info');
    };

    const addLog = (terminalId, msg, type = 'info') => {
        const targetId = terminalId || activeTerminalId;
        setTerminals(prev => prev.map(t => {
            if (t.id === targetId) {
                return {
                    ...t,
                    logs: [...t.logs.slice(-100), { id: Date.now() + Math.random(), msg, type, time: new Date().toLocaleTimeString() }]
                };
            }
            return t;
        }));
    };

    const openFile = async (file) => {
        if (file.isDirectory) return;
        try {
            let tab = tabs.find(t => t.path === file.path);
            if (!tab) {
                const content = await window.api.readFile(file.path);
                tab = { ...file, content, isDirty: false };
                setTabs(prev => [...prev, tab]);
            }
            setActiveFile(file.path);

            if (monacoRef.current) {
                const language = getLanguageForFile(file.name);

                // Normalize path for Monaco URI
                const normalizedPath = file.path.replace(/\\/g, '/');
                const uri = window.monaco.Uri.file(normalizedPath);
                let model = window.monaco.editor.getModel(uri);

                if (!model) {
                    // Fallback to empty string if content is missing
                    const initialContent = tab.content || '';
                    model = window.monaco.editor.createModel(initialContent, language, uri);
                    model.onDidChangeContent(() => {
                        setTabs(currentTabs => currentTabs.map(t =>
                            t.path === file.path ? { ...t, isDirty: true } : t
                        ));
                    });
                } else {
                    // Update language if it changed or wasn't set correctly
                    window.monaco.editor.setModelLanguage(model, language);

                    if (!model.getValue() && tab.content) {
                        model.setValue(tab.content);
                    }
                }

                monacoRef.current.setModel(model);

                // Force a series of layout refreshes to handle deep CSS transitions and focus
                const refreshLayout = () => {
                    if (monacoRef.current) {
                        monacoRef.current.layout();
                        monacoRef.current.focus();
                    }
                };

                refreshLayout();
                setTimeout(refreshLayout, 50);
                setTimeout(refreshLayout, 250);
            }

            // FILE-SCOPED CHAT: Create or activate chat for this file
            // Check if a file-scoped chat already exists for this file in the chats array
            const existingFileChat = chats.find(c => c.isFileScoped && c.filePath === file.path);

            if (!existingFileChat) {
                // Create new file-scoped chat
                const newFileChatId = 'file-' + Date.now();
                const newFileChat = {
                    id: newFileChatId,
                    filePath: file.path,
                    fileName: file.name,
                    title: `💬 ${file.name}`,
                    messages: [],
                    agentSessions: [],
                    createdAt: Date.now(),
                    lastUpdatedAt: Date.now(),
                    aiStatus: null,
                    isPlanning: false,
                    isAgentExecuting: false,
                    isFileScoped: true // Mark as file-scoped
                };

                // Update fileChats mapping for quick lookup
                setFileChats(prev => ({ ...prev, [file.path]: newFileChat }));

                // Add to main chats array for rendering
                setChats(prev => [...prev, newFileChat]);
                setOpenChatIds(prev => [...prev, newFileChatId]);
                setActiveChatId(newFileChatId);
            } else {
                // Activate existing file chat
                if (!openChatIds.includes(existingFileChat.id)) {
                    setOpenChatIds(prev => [...prev, existingFileChat.id]);
                }
                setActiveChatId(existingFileChat.id);

                // Update fileChats mapping to keep it in sync
                setFileChats(prev => ({ ...prev, [file.path]: existingFileChat }));
            }

            // Show chat panel when file is opened
            setIsRightPanelVisible(true);
            setActiveFileChatPath(file.path);

        } catch (err) {
            addLog(null, `Error opening file: ${err.message}`, 'error');
        }
    };

    // Session Persistence
    const canAutoSave = useRef(false); // Default to FALSE to prevent overwriting initial state
    const hasRestoredSession = useRef(false);

    useEffect(() => {
        if (!workspace || hasRestoredSession.current) return;

        const restoreSession = async () => {
            console.log('Starting session restoration check...');
            try {
                const editorState = await window.api.getEditorState();

                if (editorState) {
                    const { openFilePaths, activeFilePath, expandedFolderPaths, fullTabs } = editorState;
                    console.log('Found session data:', { files: openFilePaths?.length, folders: expandedFolderPaths?.length });

                    // Restore expanded folders AND trigger file reload to populate tree
                    if (expandedFolderPaths && Array.isArray(expandedFolderPaths)) {
                        const newExpandedSet = new Set(expandedFolderPaths);
                        setExpandedFolders(newExpandedSet);
                        // Force reload of files with new expanded paths so children are fetched
                        await loadFiles(workspace, newExpandedSet);
                    }

                    // Restore Tabs with Dirty State
                    if (fullTabs && Array.isArray(fullTabs)) {
                        for (const tabData of fullTabs) {
                            // File object structure
                            const fileObj = {
                                path: tabData.path,
                                name: tabData.name,
                                isDirectory: false
                            };

                            // 1. Open the file (loads disk content)
                            await openFile(fileObj);

                            // 2. If it was dirty, apply the changes on top to enable Undo
                            if (tabData.isDirty && tabData.content) {
                                // We need to wait a tick for Monaco to initialize the model with disk content
                                await new Promise(r => setTimeout(r, 100));

                                const uri = window.monaco.Uri.file(tabData.path);
                                const model = window.monaco.editor.getModel(uri);

                                if (model) {
                                    const currentDiskContent = model.getValue();

                                    // Make sure we actually have a diff
                                    if (currentDiskContent !== tabData.content) {
                                        // Use pushEditOperations to enable Undo
                                        const fullRange = model.getFullModelRange();
                                        model.pushEditOperations(
                                            [],
                                            [{
                                                range: fullRange,
                                                text: tabData.content
                                            }],
                                            () => null
                                        );

                                        // Mark as dirty in UI
                                        setTabs(prev => prev.map(t =>
                                            t.path === tabData.path ? { ...t, isDirty: true } : t
                                        ));
                                    }
                                }
                            }
                        }

                        if (activeFilePath) {
                            setActiveFile(activeFilePath);
                        }
                    } else if (openFilePaths && Array.isArray(openFilePaths)) {
                        // Legacy Fallback
                        for (const filePath of openFilePaths) {
                            const name = filePath.replace(/\\/g, '/').split('/').pop();
                            await openFile({ path: filePath, name, isDirectory: false });
                        }
                        if (activeFilePath) setActiveFile(activeFilePath);
                    }
                } else {
                    // Try legacy localStorage if no file-store data
                    const legacyData = localStorage.getItem('anita_session_v1');
                    if (legacyData) {
                        const { openFilePaths, activeFilePath, expandedFolderPaths } = JSON.parse(legacyData);
                        if (expandedFolderPaths) {
                            const newExpandedSet = new Set(expandedFolderPaths);
                            setExpandedFolders(newExpandedSet);
                            await loadFiles(workspace, newExpandedSet);
                        }
                        if (openFilePaths) {
                            for (const filePath of openFilePaths) {
                                const name = filePath.replace(/\\/g, '/').split('/').pop();
                                await openFile({ path: filePath, name, isDirectory: false });
                            }
                            if (activeFilePath) setActiveFile(activeFilePath);
                        }
                    }
                }
            } catch (e) {
                console.error("Session restore failed", e);
            } finally {
                // Enable saving ONLY after we have finished attempting to restore
                // Use a small buffer to strictly ensure the state updates have settled
                setTimeout(() => {
                    canAutoSave.current = true;
                    hasRestoredSession.current = true;
                    console.log('Session restoration finished. Auto-save is now ENABLED.');
                }, 1000);
            }
        };

        // Delay slightly to ensure editor/environment is ready
        setTimeout(restoreSession, 500);
    }, [workspace]);

    useEffect(() => {
        // STRICTLY BLOCK saving until restoration is complete
        if (!canAutoSave.current) {
            // console.log('Auto-save blocked: restoration pending');
            return;
        }

        // Debounce saving slightly or just save on change
        const session = {
            openFilePaths: tabs.map(t => t.path),
            activeFilePath: activeFile,
            expandedFolderPaths: Array.from(expandedFolders),
            // Persist full tab state including dirty content
            fullTabs: tabs.map(t => ({
                path: t.path,
                name: t.name,
                isDirty: t.isDirty,
                content: t.isDirty ? t.content : null // Only save content if dirty
            }))
        };

        // Use backend storage instead of localStorage
        window.api.saveEditorState(session).catch(e => console.error(e));
        // Legacy fallback cleanup
        localStorage.removeItem('anita_session_v1');
    }, [tabs, activeFile, expandedFolders]);

    const saveFile = async (path) => {
        const tab = tabs.find(t => t.path === path);
        if (!tab) return;

        try {
            const uri = window.monaco.Uri.file(path);
            const model = window.monaco.editor.getModel(uri);
            const content = model ? model.getValue() : tab.content;

            await window.api.writeFile(path, content);
            setTabs(prev => prev.map(t => t.path === path ? { ...t, content, isDirty: false } : t));
            addLog(null, `Saved ${tab.name}`);
        } catch (err) {
            addLog(null, `Error saving file: ${err.message}`, 'error');
        }
    };

    const startDevServer = async () => {
        setIsDevServerRunning(true);
        // Ensure terminal is visible
        if (!isTerminalVisible) setIsTerminalVisible(true);

        // helper to find project root
        let projectRoot = workspace || '';
        if (activeFile) {
            try {
                // Simple path manipulation to walk up
                // Assuming Windows paths mostly based on user context, but handling both separators is safer
                let currentDir = activeFile.substring(0, Math.max(activeFile.lastIndexOf('/'), activeFile.lastIndexOf('\\')));

                // Guard against infinite loops or going up too far (stop at workspace or simple depth limit)
                let attempts = 0;
                while (currentDir && currentDir.length > (workspace?.length || 0) && attempts < 10) {
                    const pkgPath = currentDir + (currentDir.includes('/') ? '/' : '\\') + 'package.json';
                    const exists = await window.api.pathExists(pkgPath);
                    if (exists) {
                        projectRoot = currentDir;
                        addLog(null, `Detected project root at: ${projectRoot}`, 'info');
                        break;
                    }
                    // Move up
                    const lastSep = Math.max(currentDir.lastIndexOf('/'), currentDir.lastIndexOf('\\'));
                    if (lastSep === -1) break;
                    currentDir = currentDir.substring(0, lastSep);
                    attempts++;
                }
            } catch (e) {
                console.warn('Failed to detect project root:', e);
            }
        }

        // Manual addTerminal logic to capture ID robustly
        const newId = 't-' + Date.now();
        const newTerminal = {
            id: newId,
            logs: [],
            input: '',
            history: [],
            historyIndex: -1,
            cwd: projectRoot, // Use detected root
            cwdInput: projectRoot
        };

        setTerminals(prev => [...prev, newTerminal]);
        setActiveTerminalId(newId);

        // CRITICAL: Sync CWD with backend process so runCommand uses the correct dir
        await window.api.setTerminalCwd(newId, projectRoot);

        // Wait slightly for UI to settle then send command
        setTimeout(async () => {
            // Send directly to the known ID
            await window.api.sendTerminalInput(newId, 'npm start');
        }, 500);
    };

    // Update saveFileRef
    useEffect(() => { saveFileRef.current = saveFile; }, [saveFile]);

    const closeFile = async (e, path) => {
        if (e) e.stopPropagation();
        const tab = tabs.find(t => t.path === path);
        if (!tab) return;

        const finalizeClose = () => {
            setTabs(prev => {
                const newTabs = prev.filter(t => t.path !== path);

                if (activeFile === path) {
                    if (newTabs.length > 0) {
                        openFile(newTabs[newTabs.length - 1]);
                    } else {
                        setActiveFile(null);
                        if (monacoRef.current) monacoRef.current.setModel(null);
                    }
                }
                return newTabs;
            });

            // Cleanup model
            const uri = window.monaco.Uri.file(path);
            const model = window.monaco.editor.getModel(uri);
            if (model) model.dispose();
        };

        if (tab.isDirty) {
            setConfirmDialog({
                title: 'Unsaved Changes',
                message: `${tab.name} has unsaved changes. Save before closing?`,
                confirmText: 'Save and Close',
                cancelText: 'Discard and Close',
                type: 'warning',
                onConfirm: async () => {
                    await saveFile(path);
                    finalizeClose();
                    setConfirmDialog(null);
                },
                onCancel: () => {
                    finalizeClose();
                    setConfirmDialog(null);
                }
            });
            return;
        }

        finalizeClose();
    };

    // Helper: Find file in workspace by name
    const findFileInWorkspace = async (fileName, workspace) => {
        const searchInDir = async (dir) => {
            try {
                const items = await window.api.readDir(dir);
                for (const item of items) {
                    // Skip node_modules and other common ignore directories
                    if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist' || item.name === 'build') {
                        continue;
                    }

                    if (!item.isDirectory && item.name === fileName) {
                        return item.path;
                    } else if (item.isDirectory) {
                        const found = await searchInDir(item.path);
                        if (found) return found;
                    }
                }
            } catch (e) {
                // Ignore permission errors
            }
            return null;
        };
        return await searchInDir(workspace);
    };

    // NEW: Agent handler using function calling
    const handleStartAgentWithFunctionCalling = async (goal) => {
        if (!workspace) {
            addLog(null, "Please select a workspace first.", "error");
            return;
        }
        if (!agentManagerRef.current) {
            addLog(null, "Agent not initialized. Please check your API key.", "error");
            return;
        }

        const targetChatId = activeChatId;

        // Extract @-mentioned files from goal
        const mentionRegex = /@([\w.-]+)/g;
        const mentions = goal.match(mentionRegex) || [];

        let enhancedGoal = goal;

        // Read content of mentioned files
        if (mentions.length > 0) {
            addLog(null, `📎 Found ${mentions.length} file reference(s): ${mentions.join(', ')}`);

            const mentionedFileContents = await Promise.all(
                mentions.map(async (mention) => {
                    const fileName = mention.replace('@', '');

                    // Search for file in workspace
                    const filePath = await findFileInWorkspace(fileName, workspace);

                    if (filePath) {
                        try {
                            const content = await window.api.readFile(filePath);
                            addLog(null, `✅ Loaded context from ${fileName}`);
                            return { fileName, filePath, content };
                        } catch (e) {
                            addLog(null, `⚠️ Could not read ${fileName}: ${e.message}`);
                            return { fileName, error: e.message };
                        }
                    } else {
                        addLog(null, `⚠️ File not found: ${fileName}`);
                        return { fileName, error: 'File not found' };
                    }
                })
            );

            // Enhance goal with file contexts
            if (mentionedFileContents.some(f => f.content)) {
                enhancedGoal += '\n\n**Referenced Files:**\n';
                mentionedFileContents.forEach(({ fileName, content, error }) => {
                    if (content) {
                        const ext = fileName.split('.').pop();
                        enhancedGoal += `\n### @${fileName}\n\`\`\`${ext}\n${content}\n\`\`\`\n`;
                    } else {
                        enhancedGoal += `\n### @${fileName}\n(Error: ${error})\n`;
                    }
                });
            }
        }

        addLog(null, `🚀 Starting agent with function calling: ${goal}`);

        // Create agent session with enhanced goal and active file
        const sessionId = await agentManagerRef.current.startSession(
            enhancedGoal,
            targetChatId,
            workspace,
            activeFile  // Pass active file for file-scoped context
        );

        // Add session to chat
        setChats(prev => prev.map(c => {
            if (c.id === targetChatId) {
                return {
                    ...c,
                    agentSessions: [...(c.agentSessions || []), {
                        id: sessionId,
                        goal: goal,
                        status: 'running',
                        logs: [],
                        createdAt: Date.now()
                    }],
                    isAgentExecuting: true
                };
            }
            return c;
        }));
    };

    // @-Mention Handlers
    const handleMentionSelect = (file) => {
        if (!mentionQuery) return;

        const { startIndex } = mentionQuery;
        // Don't use substring as it might be outdated if user typed more
        // Re-construct based on start index and current cursor
        const beforeMention = composerInput.substring(0, startIndex);

        // Find where the mention part ends (space or end of string)
        const afterStartIndex = composerInput.substring(startIndex);
        const match = afterStartIndex.match(/^@[\w.-]*/);
        const matchLength = match ? match[0].length : 0;

        const afterMention = composerInput.substring(startIndex + matchLength);

        // Insert @filename
        const newValue = beforeMention + `@${file.name} ` + afterMention;
        setComposerInput(newValue);

        // Close dropdown
        setMentionQuery(null);
        setMentionDropdownPosition(null);
        setSelectedMentionIndex(0);

        // Refocus input
        if (composerRef.current) {
            composerRef.current.focus();
            // Set cursor after the inserted mention
            const newCursorPos = (beforeMention + `@${file.name} `).length;
            setTimeout(() => {
                composerRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        }
    };

    const handleMentionClose = () => {
        setMentionQuery(null);
        setMentionDropdownPosition(null);
        setSelectedMentionIndex(0);
    };


    const runAutonomousLoop = async (chatId, goal) => {
        const MAX_STEPS = 50;
        let stepCount = 0;
        let running = true;

        // Create a new session for this run
        const sessionId = Date.now();
        const initialSession = {
            id: sessionId,
            chatId,
            timestamp: new Date().toISOString(),
            goal,
            mode: 'autonomous',
            status: 'running',
            history: [], // For the Agent's reasoning context
            logs: [] // For the UI
        };

        // Add to this chat's agentSessions array instead of global sessions
        setChats(prev => prev.map(c => {
            if (c.id === chatId) {
                return {
                    ...c,
                    agentSessions: [initialSession, ...(c.agentSessions || [])]
                };
            }
            return c;
        }));

        // Add session message to chat
        setChats(prev => prev.map(c => {
            if (c.id === chatId) {
                // Remove the temporary loading message
                const cleanMessages = c.messages.filter(m => !m.isLoading);
                return {
                    ...c,
                    messages: [...cleanMessages, {
                        id: 'msg-' + sessionId,
                        role: 'assistant',
                        type: 'agent_session',
                        sessionId: sessionId,
                        timestamp: new Date().toLocaleTimeString()
                    }]
                };
            }
            return c;
        }));

        // Helper to update session state
        const updateSession = (updates) => {
            setChats(prev => prev.map(c => {
                if (c.id === chatId) {
                    return {
                        ...c,
                        agentSessions: (c.agentSessions || []).map(s =>
                            s.id === sessionId ? { ...s, ...updates } : s
                        )
                    };
                }
                return c;
            }));
        };

        // Helper to add log
        const logStep = (message, type = 'info') => {
            const entry = { timestamp: new Date().toLocaleTimeString(), message, type };
            // Functional update for logs to avoid stale state
            setChats(prev => prev.map(c => {
                if (c.id === chatId) {
                    return {
                        ...c,
                        agentSessions: (c.agentSessions || []).map(s => {
                            if (s.id === sessionId) {
                                return { ...s, logs: [...(s.logs || []), entry] };
                            }
                            return s;
                        })
                    };
                }
                return c;
            }));
            addLog(null, message, type);
        };

        const agentHistory = [
            { role: 'system', content: AGENT_PROMPTS[AGENT_MODES.AUTONOMOUS] },
            { role: 'user', content: `Goal: ${goal}. Start.` }
        ];

        logStep(`Autonomous Agent started. Goal: ${goal}`);

        while (running && stepCount < MAX_STEPS) {
            // Check stop signal
            if (stopExecutionRef.current[chatId]) {
                logStep("Execution stopped by user.", 'warning');
                updateSession({ status: 'stopped' });
                break;
            }

            stepCount++;
            logStep(`Thinking... (Step ${stepCount})`);
            updateSession({ status: 'thinking' });

            try {
                // 1. THINK
                let thoughtProcess = null;
                const response = await ai.chat(
                    agentHistory,
                    null, // No stream for internal thought
                    null, // signal
                    "together/meta-llama/Llama-3.3-70B-Instruct-Turbo" // Strong model for reasoning
                );

                // Parse
                try {
                    const jsonMatch = response.match(/\{[\s\S]*\}/);
                    const jsonStr = jsonMatch ? jsonMatch[0] : response;
                    thoughtProcess = JSON.parse(jsonStr);
                } catch (e) {
                    logStep("Failed to parse thought. Retrying...", 'error');
                    agentHistory.push({ role: 'user', content: "Invalid JSON. Output STRICT JSON." });
                    continue;
                }

                if (!thoughtProcess) continue;

                logStep(`Thought: ${thoughtProcess.thoughts}`);
                agentHistory.push({ role: 'assistant', content: JSON.stringify(thoughtProcess) });

                // 2. ACT
                updateSession({ status: 'executing' });
                let toolResult = "";

                if (thoughtProcess.tool === 'DONE') {
                    logStep("Task Completed Successfully.", 'success');
                    updateSession({ status: 'finished' });
                    running = false;
                    toolResult = "Success";
                } else if (thoughtProcess.tool === 'ASK_USER') {
                    logStep(`Question: ${thoughtProcess.args[0]}`, 'warning');
                    updateSession({ status: 'awaiting_input' });
                    running = false;
                    toolResult = "Waiting for user input";
                } else {
                    // Execute Tool
                    const { tool, args } = thoughtProcess;
                    logStep(`Action: ${tool} ${JSON.stringify(args)}`);

                    try {
                        if (tool === 'READ_FILE') {
                            const content = await window.api.readFile(args[0]);
                            toolResult = content;
                        } else if (tool === 'WRITE_FILE') {
                            await window.api.writeFile(args[0], args[1]);
                            toolResult = "File written successfully.";
                            // Refresh file tree
                            loadFiles(workspace);
                        } else if (tool === 'LIST_DIR') {
                            const files = await window.api.readDir(args[0] || '.');
                            toolResult = files.map(f => f.name + (f.isDirectory ? '/' : '')).join('\n');
                        } else if (tool === 'RUN_COMMAND') {
                            const res = await window.api.executeCommand('autonomous_term', args[0]);
                            toolResult = res.success ? res.stdout : `Error: ${res.stderr}`;
                        } else {
                            toolResult = `Unknown tool: ${tool}`;
                        }
                    } catch (err) {
                        toolResult = `Error: ${err.message}`;
                    }
                }

                logStep(`Result: ${toolResult.substring(0, 100)}...`);

                // 3. OBSERVE
                agentHistory.push({ role: 'user', content: `Tool Output: ${toolResult}` });

            } catch (err) {
                logStep(`Loop Error: ${err.message}`, 'error');
                updateSession({ status: 'error' });
                running = false;
            }
        }

        // Cleanup: Reset chat status when loop finishes (success, error, or stopped)
        updateChat(chatId, {
            isPlanning: false,
            aiStatus: null,
            isAgentExecuting: false
        });
    };

    const handleSubmitProposal = async () => {
        if (isPlanning || isAgentExecuting) return handleStop();
        if (!composerInput.trim()) return;
        if (!workspace) {
            addLog(null, "Please select a workspace first.", "error");
            return;
        }
        if (!settings.apiKey) return setShowSettings(true);

        const goal = composerInput;
        setComposerInput('');
        const targetChatId = activeChatId;

        updateChat(targetChatId, {
            isPlanning: true,
            aiStatus: 'thinking'
        });

        const currentController = new AbortController();
        abortControllersRef.current[targetChatId] = currentController;
        const signal = currentController.signal;

        const userMsg = {
            id: 'u-' + Date.now(),
            role: 'user',
            content: goal,
            timestamp: new Date().toLocaleTimeString()
        };

        const currentActiveChat = chats.find(c => c.id === targetChatId);
        if (!currentActiveChat) return;

        const loadingMsg = {
            id: 'l-' + Date.now(),
            role: 'assistant',
            isLoading: true,
            timestamp: new Date().toLocaleTimeString()
        };

        const updatedMessages = [...currentActiveChat.messages, userMsg, loadingMsg];

        // Update local state for immediate feedback
        setChats(prev => prev.map(c => c.id === targetChatId ? { ...c, messages: updatedMessages, lastUpdatedAt: Date.now() } : c));

        try {
            // Smart Logic: Detect intent based on user prompt and selected mode
            addLog(null, `Processing ${composerMode} request...`);

            let systemInstruction = "";
            let intentMode = AGENT_MODES.CHAT;

            if (composerMode === 'agent') {
                intentMode = detectAgentIntent(goal, currentActiveChat ? currentActiveChat.messages : [], composerMode);
            } else {
                // Auto-upgrade to Agent Mode if intent is high even in Chat
                const detected = detectAgentIntent(goal, currentActiveChat ? currentActiveChat.messages : [], 'chat');
                if (detected === AGENT_MODES.CLARIFY || detected === AGENT_MODES.HANDOFF || detected === AGENT_MODES.PLAN) {
                    intentMode = detected;
                    setComposerMode('agent'); // Force UI to reflect the switch
                    addLog(null, `Auto-Switching to Agent Mode: ${intentMode.toUpperCase()}`);
                }
            }

            addLog(null, `Agent Strategy: ${intentMode.toUpperCase()}`);

            if (intentMode !== AGENT_MODES.CHAT) {
                if (intentMode === AGENT_MODES.AUTONOMOUS) {
                    addLog(null, "Starting Agent with Function Calling...");
                    // Use new function calling agent
                    await handleStartAgentWithFunctionCalling(goal);
                    return;
                }

                // Construct text-based system instruction for other modes (Clarify, Handoff)
                // Construct the full prompt with Windows safeguards
                systemInstruction = AGENT_PROMPTS[intentMode] + `

WINDOWS GUIDELINES:
- Starting directory is ALWAYS the workspace root.
- Use 'cd folder && command' for sub-directory operations. Do not assume you are in a folder unless you cd into it.
- NEVER use 'pwd', 'ls', 'rm -rf', 'touch', or 'cat'. Use 'cd', 'dir', 'del /s /q', 'type'.
- PATHS: Use backslashes '\\' or forward slashes '/' consistently.
`;
            } else {
                systemInstruction = AGENT_PROMPTS[AGENT_MODES.CHAT];
            }

            const messagesForAI = updatedMessages
                .filter(m => m.content)
                .map(m => ({ role: m.role, content: m.content }));

            // AUTO-INJECT FILE CONTEXT (GitHub Copilot-style)
            // If a file is currently open, automatically include its context
            let fileContextMessage = null;
            if (activeFile) {
                const activeTab = tabs.find(t => t.path === activeFile);
                if (activeTab) {
                    const fileName = activeTab.name || activeFile.split(/[/\\]/).pop();
                    const language = getLanguageForFile(fileName);
                    const fileContent = activeTab.content || '';

                    fileContextMessage = {
                        role: 'system',
                        content: `# Active File Context

**File:** \`${activeFile}\`
**Language:** ${language}

\`\`\`${language}
${fileContent}
\`\`\`

The user is currently working on this file. Use this context to provide relevant assistance.`
                    };
                }
            }

            // Add the system instruction for this specific call
            const finalMessages = fileContextMessage
                ? [{ role: 'system', content: systemInstruction }, fileContextMessage, ...messagesForAI]
                : [{ role: 'system', content: systemInstruction }, ...messagesForAI];

            if (intentMode === AGENT_MODES.PLAN) {
                finalMessages.push({
                    role: 'system',
                    content: "IMPORTANT: Return ONLY the JSON object. Do not output any introductory text or markdown formatting. Start immediately with '{'."
                });
            }

            let streamContent = "";
            let streamReasoning = "";

            // FORCE a stricter model if we are in PLANNING mode to prevent "yapping"
            let overrideModel = null;
            if (intentMode === AGENT_MODES.PLAN) {
                overrideModel = "together/meta-llama/Llama-3.3-70B-Instruct-Turbo";
                addLog(null, "⚡ Switching to Llama 3.3 Turbo for strict Agent Planning");
            }

            // --- CRITICAL FIX FOR ARGUMENT ORDER ---
            // The aiservice.chat signature is: chat(messages, onStream, signal, overrideModel)
            // We must pass signal as 3rd arg and overrideModel as 4th

            const response = await ai.chat(
                finalMessages,
                (chunk) => {
                    streamContent = chunk.fullText;
                    streamReasoning = chunk.fullReasoning;

                    setChats(prev => prev.map(c => {
                        if (c.id === targetChatId) {
                            const isJSON = streamContent.trim().startsWith('{');
                            const isPlanMode = intentMode === AGENT_MODES.PLAN;
                            const showDraftingMessage = isJSON || isPlanMode;

                            return {
                                ...c,
                                aiStatus: 'generating',
                                messages: c.messages.map(m =>
                                    m.id === loadingMsg.id ? {
                                        ...m,
                                        content: showDraftingMessage ? "_Anita is drafting a technical implementation plan..._" : streamContent,
                                        reasoning: streamReasoning,
                                        isLoading: !streamContent && !streamReasoning,
                                        isDrafting: showDraftingMessage
                                    } : m
                                )
                            };
                        }
                        return c;
                    }));
                },
                signal,                // 3rd argument: AbortSignal
                overrideModel          // 4th argument: override model
            );

            let proposal = null;
            let isPlan = false;

            // Step 1: Robust extraction - find the FIRST valid JSON object using brace counting
            let jsonCandidate = null;
            const firstBrace = response.indexOf('{');

            if (firstBrace !== -1) {
                let balance = 0;
                let inString = false;
                let escape = false;

                for (let i = firstBrace; i < response.length; i++) {
                    const char = response[i];

                    if (escape) {
                        escape = false;
                        continue;
                    }

                    if (char === '\\') {
                        escape = true;
                        continue;
                    }

                    if (char === '"') {
                        inString = !inString;
                        continue;
                    }

                    if (!inString) {
                        if (char === '{') {
                            balance++;
                        } else if (char === '}') {
                            balance--;
                            if (balance === 0) {
                                // Found the matching closing brace
                                jsonCandidate = response.substring(firstBrace, i + 1);
                                break;
                            }
                        }
                    }
                }
            }

            // Fallback: if brace counting failed (e.g. simple unbalanced string or incomplete), try regex as backup
            if (!jsonCandidate) {
                const jsonRegex = /\{[\s\S]*?(plan|tasks)[\s\S]*\}/i;
                const match = response.match(jsonRegex);
                if (match) jsonCandidate = match[0];
            }

            if (jsonCandidate) {
                // CRITICAL: Fix malformed JSON from AI that has actual newlines in content fields
                // The AI often puts literal newlines instead of \\n, which breaks JSON parsing
                // We need to fix this BEFORE attempting to parse

                // Step 1: Pre-process to fix actual newlines in "content" fields
                try {
                    // Find key JSON fields that might contain newlines and escape them
                    jsonCandidate = jsonCandidate.replace(
                        /"(content|thoughts|reasoning|description)":\s*"((?:[^"\\]|\\.)*)"/gs,
                        (match, key, contentValue) => {
                            // Escape actual newlines to \\n
                            const fixed = contentValue
                                .replace(/\r\n/g, '\\n')  // Windows line endings
                                .replace(/\n/g, '\\n')     // Unix line endings
                                .replace(/\r/g, '\\n');    // Old Mac line endings
                            return `"${key}": "${fixed}"`;
                        }
                    );
                } catch (fixErr) {
                    console.warn("Failed to pre-fix JSON newlines:", fixErr);
                }

                try {
                    // Try parsing directly FIRST (safest)
                    const parsed = JSON.parse(jsonCandidate);
                    if (parsed.tasks || parsed.plan) {
                        proposal = parsed;
                        isPlan = true;
                    }
                } catch (e) {
                    // Step 2: Sloppy JSON Recovery (Intermediate)
                    try {
                        let cleaned = jsonCandidate
                            .replace(/\/\/.*$/gm, '') // Remove comments

                            // 1. Standardize main keys (plan, tasks, thoughts)
                            .replace(/([{,]\s*)"?plan"?\s*[:\s]\s*/gi, '$1"plan": ')
                            .replace(/([{,]\s*)"?tasks"?\s*[:\s]\s*/gi, '$1"tasks": ')
                            .replace(/([{,]\s*)"?thoughts"?\s*[:\s]\s*/gi, '$1"thoughts": ')

                            // 2. Fix the "Key Value," pattern (missing quotes and colon)
                            // Matches: id 1, or description Create a page,
                            .replace(/([{,]\s*)"?(id|description|task|type|path|content|command|thoughts)"?\s+([^,{}]+)(?=[,}]|$)/gi, (m, p1, p2, p3) => {
                                let val = p3.trim();
                                if (/^\d+$/.test(val)) return p1 + '"' + p2.toLowerCase() + '": ' + val;
                                if (!val.startsWith('"')) val = '"' + val.replace(/"/g, '\\"') + '"';
                                if (p1.includes('{') || p1.includes(',')) return p1 + '"' + p2.toLowerCase() + '": ' + val;
                                return m;
                            })

                            // 3. Fix unquoted string values for normally quoted keys
                            .replace(/("plan"|"description"|"path"|"content"|"command"|"thoughts")\s*[:]\s*([^"{}\[\]\s\d][^,{}\[\]\n]*?)\s*(?=[,\]\}]|$)/g, '$1: "$2"')

                            // 4. Standard JSON fixes
                            .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Quote keys
                            .replace(/:\s*'([^']*)'/g, ': "$1"') // Fix single quotes
                            .replace(/,\s*([}\]])/g, '$1'); // Trailing commas

                        // 5. Fix common "tasks as object" hallucination
                        if (cleaned.includes('"tasks": {') && !cleaned.includes('"tasks": [')) {
                            cleaned = cleaned.replace(/"tasks":\s*\{/, '"tasks": [');
                            cleaned = cleaned.replace(/\}\s*$/m, ']}');
                        }

                        const parsed = JSON.parse(cleaned);
                        if (parsed.tasks || parsed.plan) {
                            proposal = parsed;
                            isPlan = true;
                        }
                    } catch (e2) {
                        // JSON parsing completely failed - reject this response
                        console.error("JSON parsing failed completely:", e2);
                        addLog(null, "❌ Failed to parse AI response as valid JSON. Please try again.", 'error');
                    }
                }
            }

            if (isPlan) {
                updateChat(targetChatId, { aiStatus: 'processing' });
                // Handling Agent Session
                const newSession = {
                    id: Date.now(),
                    chatId: targetChatId,
                    timestamp: new Date().toISOString(),
                    goal,
                    plan: proposal.plan || "No plan description provided.",
                    thoughts: proposal.thoughts || "",
                    tasks: proposal.tasks.map((t, idx) => ({
                        id: t.id || (Date.now() + idx),
                        description: t.description || t.task || t.name || t.label || `Task ${idx + 1}`,
                        type: t.type || 'unknown',
                        path: t.path || '',
                        content: t.content || '',
                        command: t.command || '',
                        status: 'pending'
                    })).filter(t => t.description),
                    status: 'awaiting_approval'
                };

                setSessions(prev => {
                    const updated = [newSession, ...prev];
                    window.api.saveSessions(updated);
                    return updated;
                });

                const summaryMsg = {
                    id: 'agent-' + Date.now(),
                    role: 'assistant',
                    type: 'agent_session',
                    sessionId: newSession.id,
                    timestamp: new Date().toLocaleTimeString()
                };

                setChats(prev => prev.map(c => c.id === targetChatId ? {
                    ...c,
                    isPlanning: false,
                    aiStatus: null,
                    messages: [...c.messages.filter(m => m.id !== loadingMsg.id && !m.isLoading), summaryMsg]
                } : c));
                addLog(null, `Planner: execution plan generated.`);
            } else {
                // Handling Regular Chat
                // We already updated the message via streaming, but let's ensure final state
                setChats(prev => prev.map(c => {
                    if (c.id === targetChatId) {
                        const newMessages = c.messages.map(m =>
                            (m.id === loadingMsg.id) ? {
                                ...m,
                                content: response,
                                reasoning: streamReasoning,
                                timestamp: new Date().toLocaleTimeString(),
                                isLoading: false
                            } : m
                        );

                        // Handle Chat Title Generation
                        const isOriginalDefault = c.title === 'New Chat' || c.title.startsWith('New Chat(');
                        const userMessages = newMessages.filter(m => m.role === 'user');

                        if (isOriginalDefault && userMessages.length === 1) {
                            generateChatTitle(userMessages[0].content).then(generatedTitle => {
                                if (generatedTitle) {
                                    setChats(latestChats => latestChats.map(lc =>
                                        lc.id === targetChatId ? { ...lc, title: generatedTitle } : lc
                                    ));
                                }
                            });
                        }
                        return {
                            ...c,
                            isPlanning: false,
                            aiStatus: null,
                            messages: newMessages
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log("Request cancelled successfully");
            } else {
                console.error(err);
                addLog(null, `Error: ${err.message}`, "error");

                // Display error message in chat for better visibility
                const errorMsg = {
                    id: 'error-' + Date.now(),
                    role: 'assistant',
                    content: `❌ **Error**: ${err.message}\n\n${err.message.includes('API key') ? '💡 **Tip**: Click the Settings icon (⚙️) in the top-right corner to configure your API key.' : ''}`,
                    timestamp: new Date().toLocaleTimeString(),
                    isError: true
                };

                setChats(prev => prev.map(c => c.id === targetChatId ? {
                    ...c,
                    isPlanning: false,
                    aiStatus: null,
                    messages: [...c.messages.filter(m => !m.isLoading), errorMsg]
                } : c));
            }
        } finally {
            if (abortControllersRef.current[targetChatId] === currentController) {
                delete abortControllersRef.current[targetChatId];
            }
        }
    };

    const generateChatTitle = async (userPrompt) => {
        try {
            const titlePrompt = `Generate a VERY short and concise title (maximum 3-4 words) for this chat conversation.

User's first message: "${userPrompt}"

CRITICAL INSTRUCTIONS:
- Output ONLY the title itself
- NO explanations, reasoning, or extra text
- NO code blocks or markdown formatting
- NO quotes around the title
- Just the plain title text

Examples:
User: "hi" -> Simple Greeting
User: "help me build a website" -> Website Development
User: "fix this bug in my code" -> Bug Fix Request

Title:`;
            const response = await ai.chat([{ role: "user", content: titlePrompt }]);

            // Extract clean title from response
            let cleanTitle = response.trim();

            // Remove any markdown code blocks
            cleanTitle = cleanTitle.replace(/```[\s\S]*?```/g, '').trim();
            cleanTitle = cleanTitle.replace(/`([^`]*)`/g, '$1').trim();

            // Remove common prefixes that the AI might add
            cleanTitle = cleanTitle.replace(/^(Title:|Here's the title:|The title is:|Response:|Output:)\s*/i, '');

            // Remove quotes
            cleanTitle = cleanTitle.replace(/^["']|["']$/g, '');

            // Take only the first line (in case AI added extra text)
            cleanTitle = cleanTitle.split('\n')[0].trim();

            // If it's still too long or contains explanation text, take first 50 chars
            if (cleanTitle.length > 50) {
                cleanTitle = cleanTitle.substring(0, 50).trim();
            }

            // Fallback if extraction failed
            if (!cleanTitle || cleanTitle.length === 0) {
                return userPrompt.substring(0, 30).trim();
            }

            return cleanTitle;
        } catch (err) {
            console.error("Failed to generate title", err);
            return null;
        }
    };

    const repairSession = async (sessionId, autoExecute = false, chatId, failedTaskOverride = null) => {
        const session = sessionsRef.current.find(s => s.id === sessionId);
        if (!session) return false;

        const failedTask = failedTaskOverride || session.tasks.find(t => t.status === 'error');
        if (!failedTask) return false;

        if (chatId) updateChat(chatId, { isPlanning: true, aiStatus: 'thinking' });
        addLog(null, `Requesting AI repair for: ${failedTask.description}...`);

        const repairPrompt = `You are Anita, an elite AI developer on Windows.
One of the tasks in your implementation plan has failed. Analyze the error and provide a precision fix.

CRITICAL PROTOCOL:
1. ROOT CAUSE ANALYSIS: Determine exactly why it failed.
2. DIRECTORY AWARENESS: Windows requires specific paths. If unsure where you are, find out first.
3. CONCATENATE COMMANDS: On Windows, use 'cd folder && other-command' to ensure context.
4. PREVENT LOOPS: If the error is the same as a previous failure, do NOT repeat the same fix. CHANGE STRATEGY.
5. EXISTING DIRECTORY ERROR: If 'create-react-app' failed because folder exists, DO NOT try to delete it. Just 'cd' into it and continue.
6. CONTINUATION: Provide ONLY the tasks needed to overcome this hurdle and verify it.
7. FORBIDDEN: Do NOT use 'pwd', 'ls', 'rm'. Use 'cd', 'dir', 'del'.

ORIGINAL GOAL: "${session.goal}"
CURRENT PLAN: ${session.plan}

FAILED TASK:
- Description: ${failedTask.description}
- Type: ${failedTask.type}
${failedTask.command ? `- Command: ${failedTask.command}` : ''}
${failedTask.path ? `- Path: ${failedTask.path}` : ''}

ERROR ENCOUTERED:
"${failedTask.error || 'Unknown Error'}"

REMAINING TASKS:
${session.tasks.filter(t => t.status === 'pending').map(t => `- ${t.description}`).join('\n')}

Respond ONLY with JSON:
{
  "thoughts": "Root cause analysis...",
  "tasks": [
    { "description": "Fix step...", "type": "terminal", "command": "..." }
  ]
}`;

        try {
            const currentController = new AbortController();
            if (chatId) abortControllersRef.current[chatId] = currentController;

            const agentModel = "together/meta-llama/Llama-3.3-70B-Instruct-Turbo";
            const response = await ai.chat([{ role: 'user', content: repairPrompt }], null, currentController.signal, agentModel);

            let repairProposal = null;
            const match = response.match(/\{[\s\S]*"tasks"[\s\S]*\}/);
            const jsonCandidate = match ? match[0] : response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);

            if (jsonCandidate) {
                try {
                    repairProposal = JSON.parse(jsonCandidate);
                } catch (e) {
                    // Sloppy JSON Recovery
                    const cleaned = jsonCandidate.replace(/\/\/.*$/gm, '').replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:\s*'([^']*)'/g, ': "$1"').replace(/,\s*([}\]])/g, '$1');
                    repairProposal = JSON.parse(cleaned);
                }
            }

            if (repairProposal?.tasks?.length) {
                setSessions(prevSessions => {
                    const updated = prevSessions.map(s => {
                        if (s.id === sessionId) {
                            const failedIdx = s.tasks.findIndex(t => t.id === failedTask.id);
                            const newTasks = repairProposal.tasks.map((t, i) => ({
                                ...t,
                                id: Date.now() + i,
                                status: 'pending'
                            }));

                            const updatedTasks = [...s.tasks];
                            updatedTasks[failedIdx] = { ...failedTask, status: 'repaired', error: (failedTask.error || "Error") + " (Repaired)" };
                            updatedTasks.splice(failedIdx + 1, 0, ...newTasks);

                            return {
                                ...s,
                                tasks: updatedTasks,
                                status: autoExecute ? 'running' : 'awaiting_approval',
                                thoughts: `[REPAIR] ${repairProposal.thoughts}\n\n${s.thoughts || ''}`
                            };
                        }
                        return s;
                    });
                    window.api.saveSessions(updated);
                    return updated;
                });

                // Only add chat message if NOT auto-executing (user manually clicked repair)
                if (!autoExecute && chatId) {
                    setChats(prev => prev.map(c => {
                        if (c.id === chatId) {
                            return {
                                ...c,
                                messages: [...c.messages, {
                                    id: 'repair-' + Date.now(),
                                    role: 'assistant',
                                    type: 'agent_session',
                                    sessionId: session.id,
                                    timestamp: new Date().toLocaleTimeString(),
                                    isRepair: true,
                                    content: `**Repair Analysis:** ${repairProposal.thoughts}\n\nI have updated the plan with fix steps. You can now resume.`
                                }]
                            };
                        }
                        return c;
                    }));
                }
                addLog(null, `✅ Auto-repair successful. Continuing execution...`);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Repair failed", e);
            addLog(null, `AI repair failed: ${e.message}`, 'error');
            return false;
        } finally {
            if (chatId) {
                updateChat(chatId, { isPlanning: false, aiStatus: null });
                delete abortControllersRef.current[chatId];
            }
        }
    };


    const executeSession = async (sessionId, chatId) => {
        let currentSessions = await window.api.getSessions() || sessionsRef.current;
        let session = currentSessions.find(s => s.id === sessionId);
        if (!session) return;

        // Capture context frozen for this execution run
        const executionTerminalId = activeTerminalId;
        const rootPath = workspaceRef.current;
        let currentExecutionDir = rootPath; // Allow tracking directory changes during session

        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'running' } : s));
        if (chatId) {
            updateChat(chatId, { isAgentExecuting: true });
            stopExecutionRef.current[chatId] = false;
        }
        addLog(null, `Agent execution started...`);

        let consecutiveFailureCount = 0;
        const MAX_AUTO_REPAIRS = 5;

        while (true) {
            // Re-fetch state for each task to remain sync with potential repairs
            const latestSessions = await window.api.getSessions() || sessionsRef.current;
            const currentSession = latestSessions.find(s => s.id === sessionId);
            if (!currentSession) break;

            const nextTaskIdx = currentSession.tasks.findIndex(t => t.status === 'pending' || t.status === 'active');
            if (nextTaskIdx === -1 || (chatId && stopExecutionRef.current[chatId])) break;

            const task = currentSession.tasks[nextTaskIdx];

            // Mark task as active in local state for UI feedback
            setSessions(prev => prev.map(s => s.id === sessionId ? {
                ...s,
                tasks: s.tasks.map(t => t.id === task.id ? { ...t, status: 'active' } : t)
            } : s));

            // Log what's being executed
            if (task.type === 'terminal' && task.command) {
                addLog(null, `> ${task.command}`);
            } else {
                addLog(null, `Agent: ${task.description}`);
            }
            let success = false;
            let errorMsg = "";

            try {
                if (task.type === 'file_edit') {
                    // Logic: If task path is absolute or starts with root, use it.
                    // Otherwise, prefix with currentExecutionDir!
                    // BUT, simple "src/App.js" check is ambiguous if currentExecutionDir is root.
                    // We trust currentExecutionDir which defaults to root and updates on CD.

                    const normalizedTaskPath = task.path.replace(/\\/g, '/').replace(/^\//, '');
                    let fullPath;

                    // Specific heuristic for "Step 101" issue:
                    // If the path assumes project root but we are at workspace root, adjust it.
                    // However, relying on CD tracking is cleaner. assuming valid CD tasks.

                    if (normalizedTaskPath.startsWith(rootPath.replace(/\\/g, '/'))) {
                        fullPath = normalizedTaskPath; // Already absolute-ish
                    } else {
                        // Join with CURRENT tracked execution dir
                        fullPath = currentExecutionDir + (currentExecutionDir.endsWith('\\') ? '' : '\\') + normalizedTaskPath.replace(/\//g, '\\');
                    }

                    const exists = await window.api.pathExists(fullPath);
                    let shouldWrite = true;

                    if (exists) {
                        const current = await window.api.readFile(fullPath);
                        if (current === task.content) {
                            addLog(null, `Skipping ${task.path} (identical content)`);
                            shouldWrite = false;
                        }
                    }

                    if (shouldWrite) {
                        await window.api.writeFile(fullPath, task.content || "");
                        addLog(null, `File ${exists ? 'updated' : 'created'}: ${fullPath}`);
                    }

                    // ... (keeping lint logic same, but maybe it should run in currentExecutionDir?)
                    loadFiles(rootPath);

                } else if (task.type === 'terminal') {
                    const run = async () => {
                        setIsTerminalVisible(true);
                        setIsCentralPanelVisible(true);

                        // Detect CD commands to update context for future file edits
                        if (task.command.trim().startsWith('cd ')) {
                            const targetDir = task.command.trim().slice(3).trim();
                            // We can't easily resolve relative paths without real fs interaction, 
                            // but window.api.executeCommand handles the real CD in the terminal process.
                            // We need to fetch the NEW cwd from the terminal after execution.
                        }

                        const result = await window.api.executeCommand(executionTerminalId, task.command);

                        // Sync our logical execution dir with the terminal's actual CWD
                        if (result.success) {
                            const newCwd = await window.api.getTerminalCwd(executionTerminalId);
                            if (newCwd) {
                                currentExecutionDir = newCwd;
                                addLog(null, `Context updated: ${currentExecutionDir}`);
                            }
                        }

                        return result;
                    };

                    const result = await new Promise(resolve => {
                        if (settings.agentExecutionMode === 'autonomous') {
                            run().then(resolve);
                        } else {
                            setConfirmDialog({
                                title: 'Command Approval',
                                message: `Execute: ${task.command}`,
                                type: 'info',
                                onConfirm: () => { setConfirmDialog(null); run().then(resolve); },
                                onCancel: () => { setConfirmDialog(null); resolve({ success: false, error: 'Declined' }); }
                            });
                        }
                    });

                    success = result.success;
                    errorMsg = result.stderr || result.error;
                    if (errorMsg === 'Declined') {
                        setSessions(prev => prev.map(s => s.id === sessionId ? {
                            ...s,
                            tasks: s.tasks.map(t => t.id === task.id ? { ...t, status: 'cancelled' } : t)
                        } : s));
                        break;
                    }
                } else if (task.type === 'summary') {
                    const summaryMsg = { id: 'sum-' + Date.now(), role: 'assistant', content: `**Implementation Complete**\n\n${task.content}`, timestamp: new Date().toLocaleTimeString() };
                    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, summaryMsg], lastUpdatedAt: Date.now() } : c));
                    success = true;
                }
            } catch (err) {
                success = false;
                errorMsg = err.message;
            }

            if (success) {
                setSessions(prev => {
                    const updated = prev.map(s => s.id === sessionId ? {
                        ...s,
                        tasks: s.tasks.map(t => t.id === task.id ? { ...t, status: 'finished' } : t)
                    } : s);
                    window.api.saveSessions(updated);
                    return updated;
                });
                // Reset failure count only on verified success if needed, effectively kept tracked per-session run now.
            } else {
                setSessions(prev => {
                    const updated = prev.map(s => s.id === sessionId ? {
                        ...s,
                        tasks: s.tasks.map(t => t.id === task.id ? { ...t, status: 'error', error: errorMsg } : t)
                    } : s);
                    window.api.saveSessions(updated);
                    return updated;
                });

                if (consecutiveFailureCount < MAX_AUTO_REPAIRS) {
                    consecutiveFailureCount++;
                    addLog(null, `Attempting auto-repair (${consecutiveFailureCount}/${MAX_AUTO_REPAIRS})...`);
                    const repaired = await repairSession(sessionId, true, chatId, { ...task, error: errorMsg });
                    // Ensure tracking index is reset or handled by repair having modified tasks
                    if (repaired) continue;
                }
                break;
            }
        }

        // Final cleanup
        setSessions(prev => {
            const updated = prev.map(s => {
                if (s.id === sessionId) {
                    const allDone = s.tasks.every(t => t.status === 'finished' || t.status === 'repaired' || t.status === 'summary');
                    return { ...s, status: allDone ? 'finished' : 'error' };
                }
                return s;
            });
            window.api.saveSessions(updated);
            return updated;
        });

        if (chatId) updateChat(chatId, { isAgentExecuting: false });
        loadFiles(rootPath);
    };

    const toggleTerminal = () => {
        if (!isTerminalVisible && terminalHeight < 150) {
            setTerminalHeight(240);
        }
        setIsTerminalVisible(!isTerminalVisible);
    };

    const handleTerminalInput = async (e) => {
        const activeTerminal = terminals.find(t => t.id === activeTerminalId);
        if (!activeTerminal) return;

        if (e.key === 'Enter') {
            const input = activeTerminal.input;
            if (!input.trim()) return;

            setTerminals(prev => prev.map(t => {
                if (t.id === activeTerminalId) {
                    return {
                        ...t,
                        input: '',
                        history: [input, ...t.history],
                        historyIndex: -1
                    };
                }
                return t;
            }));

            // Echo input to logs
            addLog(activeTerminalId, `Phil > ${input} `, 'terminal');
            await window.api.sendTerminalInput(activeTerminalId, input);

            // Refresh CWD after a short delay
            setTimeout(async () => {
                const updatedCwd = await window.api.getTerminalCwd(activeTerminalId);
                setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, cwd: updatedCwd, cwdInput: updatedCwd } : t));
            }, 100);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (activeTerminal.historyIndex < activeTerminal.history.length - 1) {
                const newIndex = activeTerminal.historyIndex + 1;
                const prevCommand = activeTerminal.history[newIndex];
                setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, historyIndex: newIndex, input: prevCommand } : t));
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (activeTerminal.historyIndex > 0) {
                const newIndex = activeTerminal.historyIndex - 1;
                const nextCommand = activeTerminal.history[newIndex];
                setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, historyIndex: newIndex, input: nextCommand } : t));
            } else if (activeTerminal.historyIndex === 0) {
                setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, historyIndex: -1, input: '' } : t));
            }
        }
    };

    const handleDirectorySubmit = async () => {
        const activeTerminal = terminals.find(t => t.id === activeTerminalId);
        if (!activeTerminal) return;

        if (!activeTerminal.cwdInput.trim() || activeTerminal.cwdInput === activeTerminal.cwd) {
            setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, cwdInput: t.cwd } : t));
            return;
        }

        const result = await window.api.setTerminalCwd(activeTerminalId, activeTerminal.cwdInput.trim());
        if (result.success) {
            setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, cwd: result.path, cwdInput: result.path } : t));
            addLog(activeTerminalId, `Directory changed to: ${result.path} `, 'info');
        } else {
            addLog(activeTerminalId, `Failed to change directory: ${result.error} `, 'error');
            setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, cwdInput: t.cwd } : t));
        }
    };

    const addTerminal = () => {
        const newId = 't-' + Date.now();
        const newTerminal = {
            id: newId,
            logs: [],
            input: '',
            history: [],
            historyIndex: -1,
            cwd: workspace || '',
            cwdInput: workspace || ''
        };
        setTerminals([...terminals, newTerminal]);
        setActiveTerminalId(newId);
    };

    const closeTerminal = async (id, e) => {
        if (e) e.stopPropagation();
        if (terminals.length <= 1) return;

        await window.api.closeTerminal(id);
        const newTerminals = terminals.filter(t => t.id !== id);
        setTerminals(newTerminals);
        if (activeTerminalId === id) {
            setActiveTerminalId(newTerminals[newTerminals.length - 1].id);
        }
    };

    const onResizerMouseDown = (dir) => (e) => {
        if (e.target.closest('button') || e.target.closest('.terminal-cwd-box')) return;
        e.preventDefault();
        setResizing(dir);
    };

    return (
        <div className={`app-container theme-${settings.theme}`}>
            <header className="header glass">
                <div className="header-left">
                    <img src="assets/logo.png" className="header-logo" alt="Anita" />
                    <div className="title" style={{ marginLeft: 8 }}>Anita</div>
                </div>

                <div className="header-center">
                    <span>anita1</span>
                </div>

                <div className="header-right">
                    <div className="header-actions">
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button
                                className={`btn-icon-sm ${isLeftSidebarVisible ? 'active' : ''}`}
                                onClick={() => setIsLeftSidebarVisible(!isLeftSidebarVisible)}
                                title="Toggle Explorer"
                            >
                                <Icon name={PanelLeft} size={14} />
                            </button>
                            <button
                                className={`btn-icon-sm ${isTerminalVisible ? 'active' : ''}`}
                                onClick={() => {
                                    const newVisible = !isTerminalVisible;
                                    setIsTerminalVisible(newVisible);
                                    if (newVisible && !isCentralPanelVisible) {
                                        setIsCentralPanelVisible(true);
                                    }
                                }}
                                title="Toggle Terminal"
                            >
                                <Icon name={PanelBottom} size={14} />
                            </button>
                            <button
                                className={`btn-icon-sm ${isRightPanelVisible ? 'active' : ''}`}
                                onClick={() => setIsRightPanelVisible(!isRightPanelVisible)}
                                title="Toggle Chat"
                            >
                                <Icon name={PanelRight} size={14} />
                            </button>
                            <button
                                className={`btn-icon-sm ${!isCentralPanelVisible ? 'active' : ''}`}
                                onClick={() => {
                                    const willBeExpanded = isCentralPanelVisible; // If true, it's about to become false (expanded)
                                    setIsCentralPanelVisible(!isCentralPanelVisible);
                                    if (willBeExpanded) {
                                        setIsTerminalVisible(false);
                                    }
                                }}
                                title={isCentralPanelVisible ? "Expand Chat" : "Show Editor"}
                            >
                                <Icon name={Maximize2} size={14} />
                            </button>
                        </div>

                        <div className="token-usage" style={{ fontSize: '11px', marginLeft: 12, marginRight: 8 }}>
                            Tokens: {tokenUsage.session} <span style={{ opacity: 0.5 }}>/ {tokenUsage.total}</span>
                        </div>

                        <button className="btn-icon-sm" onClick={() => setShowSettings(true)} title="Settings">
                            <Icon name={Settings} size={16} />
                        </button>
                    </div>

                    <div className="window-controls">
                        <button className="ctrl-btn" onClick={() => window.api.minimize()}>
                            <Icon name={Minus} size={14} />
                        </button>
                        <button className="ctrl-btn" onClick={() => window.api.maximize()}>
                            <Icon name={Square} size={12} />
                        </button>
                        <button className="ctrl-btn close" onClick={() => window.api.close()}>
                            <Icon name={X} size={14} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="app-main">
                <aside className={`sidebar ${isLeftSidebarVisible ? '' : 'collapsed'}`} style={{ width: isLeftSidebarVisible ? sidebarWidth : 0 }}>
                    <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 8, position: 'relative' }}>
                        <span>EXPLORER</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-icon-sm" onClick={() => loadFiles(workspace)} title="Refresh Explorer">
                                <Icon name={RefreshCw} size={14} />
                            </button>
                            <button className="btn-icon-sm" onClick={() => setExplorerMenuOpen(!explorerMenuOpen)} title="Explorer Actions">
                                <Icon name={MoreHorizontal} size={14} />
                            </button>
                        </div>

                        {explorerMenuOpen && (
                            <div className="file-ops-dropdown glass" style={{ top: '30px', right: '8px', minWidth: '180px' }} onMouseLeave={() => setExplorerMenuOpen(false)}>
                                <div className="file-ops-item" onClick={() => {
                                    setShowProjectWizard(true);
                                    setExplorerMenuOpen(false);
                                }} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, marginBottom: 4 }}>
                                    <Icon name="sparkles" size={14} style={{ color: '#a78bfa' }} />
                                    <span style={{ color: '#a78bfa', fontWeight: 500 }}>Create New Project</span>
                                </div>
                                <div className="file-ops-item" onClick={() => {
                                    handleSelectWorkspace();
                                    setExplorerMenuOpen(false);
                                }}>
                                    <Icon name={FolderOpen} size={14} />
                                    <span>Change Directory</span>
                                </div>
                                <div className="file-ops-item" onClick={() => {
                                    loadFiles(workspace);
                                    setExplorerMenuOpen(false);
                                }}>
                                    <Icon name={RefreshCw} size={14} />
                                    <span>Refresh All</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="scrollable">
                        <FileTree
                            files={files}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            openFile={openFile}
                            activeFile={activeFile}
                            workspace={workspace}
                            depth={0}
                            creatingItem={creatingItem}
                            setCreatingItem={setCreatingItem}
                            onCreateItem={onCreateItem}
                            renamingItem={renamingItem}
                            setRenamingItem={setRenamingItem}
                            renamingItem={renamingItem}
                            setRenamingItem={setRenamingItem}
                            onRenameItem={onRenameItem}
                            onDeleteItem={onDeleteItem}
                        />
                    </div>

                    {isLeftSidebarVisible && <div className="resizer-handle" onMouseDown={onResizerMouseDown('left')} style={{ position: 'absolute', right: -3, top: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 100 }} />}
                </aside>

                {isCentralPanelVisible && (
                    <main className="main-content">
                        <div className="editor-area">
                            {(tabs.length > 0 || gettingStartedTab) && (
                                <div className="editor-tabs">
                                    {/* Getting Started Tab */}
                                    {gettingStartedTab && (
                                        <div
                                            className={`editor-tab ${activeFile === '__getting-started__' ? 'active' : ''}`}
                                            onClick={() => setActiveFile('__getting-started__')}
                                        >
                                            <Icon name="sparkles" size={14} style={{ color: '#a78bfa' }} className="tab-icon" />
                                            <span className="tab-name-text">Get Started: {gettingStartedTab.projectName}</span>
                                            <button className="tab-close" onClick={(e) => {
                                                e.stopPropagation();
                                                setGettingStartedTab(null);
                                                if (activeFile === '__getting-started__') {
                                                    setActiveFile(tabs.length > 0 ? tabs[0].path : null);
                                                }
                                            }}>
                                                <Icon name={X} size={12} />
                                            </button>
                                        </div>
                                    )}
                                    {/* Regular File Tabs */}
                                    {tabs.map(tab => {
                                        const icon = getFileIcon(tab.name);
                                        return (
                                            <div
                                                key={tab.path}
                                                className={`editor-tab ${activeFile === tab.path ? 'active' : ''}`}
                                                onClick={() => openFile(tab)}
                                                onMouseEnter={() => setHoveredTab(tab.path)}
                                                onMouseLeave={() => setHoveredTab(null)}
                                                style={{ position: 'relative', paddingRight: 55 }} // Make room for icons
                                            >
                                                <Icon name={icon.name} size={14} style={{ color: icon.color }} className="tab-icon" />
                                                <span className="tab-name-text">{tab.name}</span>

                                                {/* Dirty indicator - only show if NOT hovering or not in preview/hover interaction state */}
                                                {tab.isDirty && !hoveredTab && previewFile !== tab.path && <div className="dirty-dot" />}

                                                {/* Action Icons (Eye/Code) */}
                                                {(hoveredTab === tab.path || previewFile === tab.path) && (
                                                    <button
                                                        className="tab-action-btn"
                                                        style={{
                                                            position: 'absolute',
                                                            right: 32, // Left of close button with margin
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: 2,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            color: 'var(--text-secondary)'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (previewFile === tab.path) {
                                                                setPreviewFile(null); // Switch back to code
                                                            } else {
                                                                setPreviewFile(tab.path); // Switch to preview
                                                            }
                                                        }}
                                                        title={previewFile === tab.path ? "Back to Code" : "Live Preview"}
                                                    >
                                                        <Icon name={previewFile === tab.path ? CodeIcon : Eye} size={13} />
                                                    </button>
                                                )}

                                                <button className="tab-close" onClick={(e) => closeFile(e, tab.path)}>
                                                    <Icon name={X} size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <Breadcrumbs activeFile={activeFile} workspace={workspace} />

                            <div className="editor-main-wrapper">
                                {/* Preview Container */}

                                <div className="preview-container" style={{ height: '100%', width: '100%', background: 'white', display: (activeFile && activeFile === previewFile && activeFile !== '__getting-started__') ? 'flex' : 'none', flexDirection: 'column' }}>
                                    {(activeFile && activeFile === previewFile && activeFile !== '__getting-started__') && (() => {
                                        const tab = tabs.find(t => t.path === activeFile);
                                        const ext = activeFile.split('.').pop().toLowerCase();

                                        if (['html', 'htm'].includes(ext)) {
                                            // For HTML, use an iframe with srcDoc
                                            // Ideally we'd resolve relative links but for now basic srcDoc
                                            // Note: We need a way to get the content update if it's dirty? 
                                            // The prompt implies seeing the file. We can use tab.content if dirty, or load from disk.
                                            // Since we have tab.content in state, let's use that.
                                            return (
                                                <iframe
                                                    srcDoc={tab?.content || ''}
                                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                                    title="Live Preview"
                                                    sandbox="allow-scripts" // Basic security
                                                />
                                            );
                                        } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
                                            return (
                                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e' }}>
                                                    <img src={`file://${activeFile}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Preview" />
                                                </div>
                                            );
                                        } else {
                                            // Check if it's a web-app file (JS/TS/CSS)
                                            if (['js', 'jsx', 'ts', 'tsx', 'css', 'json'].includes(ext)) {
                                                if (devServerUrl) {
                                                    return (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                            <div style={{ padding: '4px 8px', background: '#eee', borderBottom: '1px solid #ccc', fontSize: '12px', display: 'flex', justifyContent: 'space-between', color: '#333' }}>
                                                                <span>Previewing: {devServerUrl}</span>
                                                                <button onClick={() => setDevServerUrl(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}>Reset</button>
                                                            </div>
                                                            <iframe
                                                                src={devServerUrl}
                                                                style={{ width: '100%', flex: 1, border: 'none' }}
                                                                title="App Preview"
                                                            />
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ padding: 40, color: '#333', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                            <Icon name={Monitor} size={48} style={{ marginBottom: 20, opacity: 0.2 }} />
                                                            <h3>Web App Preview</h3>
                                                            <p style={{ maxWidth: 300, marginBottom: 20, opacity: 0.7 }}>
                                                                To preview this file live, we need to run your development server (e.g., localhost:3000).
                                                            </p>
                                                            <button
                                                                className="btn btn-primary"
                                                                onClick={startDevServer}
                                                                disabled={isDevServerRunning}
                                                            >
                                                                {isDevServerRunning ? 'Starting Server...' : 'Start Dev Server (npm start)'}
                                                            </button>

                                                            {isDevServerRunning && (
                                                                <p style={{ fontSize: 12, marginTop: 10, opacity: 0.6 }}>
                                                                    Check the terminal for output. Waiting for localhost URL...
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            }

                                            return (
                                                <div style={{ padding: 20, color: '#333', textAlign: 'center' }}>
                                                    <h3>Preview not available</h3>
                                                    <p>This file type ({ext}) cannot be previewed in this mode.</p>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ marginTop: 10 }}
                                                        onClick={() => setPreviewFile(null)}
                                                    >
                                                        Back to Code
                                                    </button>
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>

                                {/* Monaco Editor - hidden when getting started tab is active OR preview is active */}
                                <div
                                    id="monaco-editor-instance"
                                    ref={editorContainerRef}
                                    className="monaco-container-node"
                                    style={{
                                        visibility: (activeFile && activeFile !== '__getting-started__' && activeFile !== previewFile) ? 'visible' : 'hidden',
                                        display: (activeFile === '__getting-started__' || activeFile === previewFile) ? 'none' : 'block'
                                    }}
                                ></div>

                                {/* Getting Started Tab */}
                                {activeFile === '__getting-started__' && gettingStartedTab && (
                                    <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg-primary)' }}>
                                        <GettingStartedTab
                                            framework={gettingStartedTab.framework}
                                            projectName={gettingStartedTab.projectName}
                                            onCopyCommand={(cmd) => addLog(null, `Copied: ${cmd}`, 'info')}
                                        />
                                    </div>
                                )}

                                {/* Empty State */}
                                {!activeFile && !gettingStartedTab && (
                                    <div className="empty-state">
                                        <Icon name={CodeIcon} size={64} style={{ opacity: 0.05 }} />
                                        <p>Select a file to begin editing</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            className="bottom-panel"
                            style={{ height: terminalHeight, display: isTerminalVisible ? 'flex' : 'none' }}
                        >
                            <div className="terminal-tabs" onMouseDown={onResizerMouseDown('bottom')} style={{ cursor: 'row-resize' }}>
                                {terminals.map((t, idx) => (
                                    <div
                                        key={t.id}
                                        className={`terminal-tab ${activeTerminalId === t.id ? 'active' : ''}`}
                                        onClick={() => setActiveTerminalId(t.id)}
                                        onMouseDown={e => e.stopPropagation()}
                                    >
                                        <Icon name={Terminal} size={14} />
                                        <span>Terminal {idx + 1}</span>
                                        {terminals.length > 1 && (
                                            <button className="close-tab" onClick={(e) => closeTerminal(t.id, e)} onMouseDown={e => e.stopPropagation()}>
                                                <Icon name={X} size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button className="add-tab-btn" onClick={addTerminal} title="Add Terminal" onMouseDown={e => e.stopPropagation()}>
                                    <Icon name={Plus} size={14} />
                                </button>

                                <div style={{ flex: 1 }} />
                                <button
                                    className={`terminal-header-toggle ${isTerminalHeaderExpanded ? 'expanded' : ''}`}
                                    onClick={() => setIsTerminalHeaderExpanded(!isTerminalHeaderExpanded)}
                                    onMouseDown={e => e.stopPropagation()}
                                    title={isTerminalHeaderExpanded ? "Collapse Header" : "Expand Header"}
                                >
                                    <Icon name={ChevronDown} size={16} />
                                </button>
                            </div>
                            <div
                                className={`terminal-header ${isTerminalHeaderExpanded ? 'visible' : 'hidden'}`}
                                style={{ cursor: 'row-resize', userSelect: 'none' }}
                                onMouseDown={onResizerMouseDown('bottom')}
                            >
                                <div className="terminal-header-left">
                                    <input
                                        className="terminal-cwd-box"
                                        value={terminals.find(t => t.id === activeTerminalId)?.cwdInput || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, cwdInput: val } : t));
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        onBlur={handleDirectorySubmit}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.target.blur())}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        title="Click to edit current directory"
                                    />
                                </div>
                                <div className="header-actions" onMouseDown={e => e.stopPropagation()}>
                                    <button className="btn-icon-sm" onClick={() => setIsTerminalVisible(false)} title="Close Panel">
                                        <Icon name={Minimize2} size={14} />
                                    </button>
                                    <button className="btn-icon-sm" onClick={(e) => {
                                        e.stopPropagation();
                                        setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, logs: [] } : t));
                                    }} title="Clear Logs">
                                        <Icon name={Trash2} size={12} />
                                    </button>
                                </div>
                            </div>
                            <div
                                className="terminal-content scrollable"
                                onClick={() => {
                                    const selection = window.getSelection();
                                    if (selection.type !== 'Range') {
                                        terminalInputRef.current?.focus();
                                    }
                                }}
                            >
                                {terminals.find(t => t.id === activeTerminalId)?.logs.map(log => (
                                    <div key={log.id} className={`log-entry ${log.type}`}>
                                        <span className="log-time">{log.time}</span>
                                        <div className="log-content-wrapper">
                                            {log.type === 'terminal' && !log.msg.startsWith('Phil > ') && (
                                                <div className="log-response-icon">A</div>
                                            )}
                                            <span>{log.msg}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="terminal-input-line">
                                    <span className="terminal-prompt">Phil &gt;</span>
                                    <input
                                        ref={terminalInputRef}
                                        type="text"
                                        className="terminal-input"
                                        value={terminals.find(t => t.id === activeTerminalId)?.input || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, input: val } : t));
                                        }}
                                        onKeyDown={handleTerminalInput}
                                    />
                                </div>
                                <div id="logs-end"></div>
                            </div>
                        </div>
                    </main>
                )}

                <aside className={`right-panel ${isRightPanelVisible ? '' : 'collapsed'} ${!isCentralPanelVisible ? 'expanded' : ''}`} style={{ width: (isRightPanelVisible && isCentralPanelVisible) ? rightPanelWidth : (isRightPanelVisible ? 'auto' : 0) }}>
                    {isRightPanelVisible && isCentralPanelVisible && <div className="resizer-handle-left" onMouseDown={onResizerMouseDown('right')} style={{ position: 'absolute', left: -3, top: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 100 }} />}


                    <div className="scrollable" style={{ background: 'var(--bg-secondary)' }} ref={chatContainerRef} onScroll={handleChatScroll}>
                        <div className="chat-view">
                            {settings.chatBgImage && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundImage: `url(${settings.chatBgImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundAttachment: 'scroll',
                                    opacity: 0.35,
                                    zIndex: 0,
                                    pointerEvents: 'none'
                                }} />
                            )}
                            <div className="chat-sessions-bar">
                                <div className="sessions-list scrollable-x">
                                    {(() => {
                                        // Only show the active chat if it's file-scoped
                                        const activeChat = chats.find(c => c.id === activeChatId);
                                        if (!activeChat || !activeChat.isFileScoped) return null;

                                        // Get file icon
                                        const fileIcon = activeChat.fileName
                                            ? getFileIcon(activeChat.fileName)
                                            : null;

                                        return (
                                            <div
                                                key={activeChat.id}
                                                className="chat-tab active file-scoped"
                                            >
                                                {fileIcon && (
                                                    <Icon name={fileIcon.name} size={12} style={{ color: fileIcon.color, marginRight: 4 }} />
                                                )}
                                                <span className="tab-title">{activeChat.fileName}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                {/* Clear Chat Button */}
                                {(() => {
                                    const activeChat = chats.find(c => c.id === activeChatId);
                                    if (!activeChat || activeChat.messages.length === 0) return null;

                                    return (
                                        <button
                                            className="add-chat-btn"
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to clear this chat? This will delete all messages and cannot be undone.')) {
                                                    clearChat(activeChatId);
                                                }
                                            }}
                                            title="Clear Chat"
                                            style={{ marginLeft: 'auto' }}
                                        >
                                            <Icon name={Trash2} size={12} />
                                        </button>
                                    );
                                })()}
                            </div>

                            {/* Off-canvas History Sidebar */}
                            <div className={`history-sidebar ${isHistorySidebarVisible ? 'open' : ''}`}>
                                <div className="history-sidebar-header">
                                    <span>Chat History</span>
                                    <button className="close-btn" onClick={() => setIsHistorySidebarVisible(false)}>
                                        <Icon name={X} size={14} />
                                    </button>
                                </div>
                                <div className="history-sidebar-content scrollable">
                                    {(() => {
                                        const sortedChats = [...chats]
                                            .filter(c => c.messages.length > 0)
                                            .sort((a, b) => (b.lastUpdatedAt || b.createdAt) - (a.lastUpdatedAt || a.createdAt));
                                        const groups = {};

                                        sortedChats.forEach(chat => {
                                            const date = new Date(chat.lastUpdatedAt || chat.createdAt);
                                            const today = new Date();
                                            const yesterday = new Date();
                                            yesterday.setDate(today.getDate() - 1);

                                            let dayKey;
                                            if (date.toDateString() === today.toDateString()) {
                                                dayKey = 'Today';
                                            } else if (date.toDateString() === yesterday.toDateString()) {
                                                dayKey = 'Yesterday';
                                            } else {
                                                dayKey = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
                                            }

                                            if (!groups[dayKey]) groups[dayKey] = [];
                                            groups[dayKey].push(chat);
                                        });

                                        return Object.entries(groups).map(([day, dayChats]) => (
                                            <div key={day} className="history-group">
                                                <div className="history-group-title">{day}</div>
                                                {dayChats.map(chat => (
                                                    <div
                                                        key={chat.id}
                                                        className={`history-item ${activeChatId === chat.id ? 'active' : ''}`}
                                                        onClick={() => {
                                                            if (!openChatIds.includes(chat.id)) {
                                                                setOpenChatIds(prev => [...prev, chat.id]);
                                                            }
                                                            setActiveChatId(chat.id);
                                                            setIsHistorySidebarVisible(false);
                                                        }}
                                                    >
                                                        <Icon name={MessageSquare} size={14} style={{ marginRight: 10, opacity: 0.6 }} />
                                                        <div className="history-item-info">
                                                            <div className="history-item-title">{chat.title}</div>
                                                            <div className="history-item-date">
                                                                {new Date(chat.lastUpdatedAt || chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>

                                                    </div>
                                                ))}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {isHistorySidebarVisible && (
                                <div className="history-sidebar-overlay" onClick={() => setIsHistorySidebarVisible(false)} />
                            )}

                            {(!activeChat || activeChat.messages.length === 0) ? (
                                <div className="welcome-msg" style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 32,
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {activeChat?.isFileScoped ? (
                                        // File-scoped chat welcome message
                                        <>
                                            {(() => {
                                                const fileIcon = getFileIcon(activeChat.fileName);
                                                return (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        marginBottom: 16,
                                                        padding: '12px 24px',
                                                        background: 'rgba(167, 139, 250, 0.1)',
                                                        borderRadius: 12,
                                                        border: '1px solid rgba(167, 139, 250, 0.2)'
                                                    }}>
                                                        <Icon name={fileIcon.name} size={32} style={{ color: fileIcon.color }} />
                                                        <span style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{activeChat.fileName}</span>
                                                    </div>
                                                );
                                            })()}
                                            <h2 style={{ fontFamily: 'Outfit', fontSize: 20, marginBottom: 12, color: '#a78bfa' }}>
                                                What would you like to do with this file?
                                            </h2>
                                            <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: '450px', color: 'var(--text-secondary)' }}>
                                                Describe the changes you want in natural language.<br />
                                                I'll edit <strong style={{ color: '#fff' }}>{activeChat.fileName}</strong> exactly how you need it.
                                            </p>
                                        </>
                                    ) : (
                                        // Regular chat welcome message
                                        <>
                                            <h2 style={{ fontFamily: 'Outfit', fontSize: 24, marginBottom: 12, color: settings.startupHelloColor || 'var(--text-primary)' }}>Hello!</h2>
                                            <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: '500px', color: settings.startupMsgColor || 'var(--text-secondary)' }}>
                                                I'm your A.N.I.T.A (Advanced Neuro-Intelligent Task Assistant).<br /> Tell me what you'd like to build and I'll help you achieve it in a jiffy😉.
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="messages-list">
                                    {activeChat.messages.map((m) => {
                                        if (m.type === 'agent_session') {
                                            // Read session from this chat's agentSessions array (not global sessions)
                                            const session = (activeChat.agentSessions || []).find(s => s.id === m.sessionId);
                                            if (!session) return null;

                                            if (session.mode === 'autonomous') {
                                                return (
                                                    <div key={m.id} className="session-card inline-session autonomous" style={{ borderColor: 'var(--accent-primary)' }}>
                                                        <div className="session-header">
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <strong style={{ fontSize: '15px', color: 'var(--accent-primary)' }}>⚡ {session.goal}</strong>
                                                                <span style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
                                                                    Autonomous Mode • {session.timestamp ? new Date(session.timestamp).toLocaleString() : 'Recent'}
                                                                </span>
                                                            </div>
                                                            <span className={`status-badge ${session.status}`}>{session.status.replace('_', ' ')}</span>
                                                        </div>

                                                        <div className="autonomous-logs" style={{
                                                            marginTop: 12,
                                                            maxHeight: '300px',
                                                            overflowY: 'auto',
                                                            background: 'rgba(0,0,0,0.2)',
                                                            borderRadius: 8,
                                                            padding: 12,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 8
                                                        }}>
                                                            {session.logs && session.logs.map((log, idx) => (
                                                                <div key={idx} style={{
                                                                    fontSize: '12px',
                                                                    fontFamily: 'monospace',
                                                                    color: log.type === 'error' ? 'var(--accent-error)' :
                                                                        log.type === 'warning' ? '#f0ad4e' :
                                                                            log.type === 'success' ? 'var(--accent-success)' : 'var(--text-secondary)'
                                                                }}>
                                                                    <span style={{ opacity: 0.5, marginRight: 8 }}>{log.timestamp}</span>
                                                                    {log.message}
                                                                </div>
                                                            ))}
                                                            {session.status === 'running' && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', opacity: 0.7 }}>
                                                                    <Icon name={Loader2} size={12} className="spin" />
                                                                    <span>Agent is working...</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {session.status === 'awaiting_input' && (
                                                            <div style={{ marginTop: 12, padding: 8, background: 'rgba(255, 177, 59, 0.1)', borderRadius: 6, border: '1px solid rgba(255, 177, 59, 0.2)' }}>
                                                                <strong style={{ color: '#ffb13b', fontSize: '12px' }}>Waiting for User Input</strong>
                                                                <div style={{ fontSize: '11px', opacity: 0.8 }}>Resume by typing in the chat... (Not implemented yet)</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={m.id} className="session-card inline-session">
                                                    <div className="session-header">
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <strong style={{ fontSize: '15px' }}>{session.goal}</strong>
                                                            <span style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
                                                                {session.timestamp ? new Date(session.timestamp).toLocaleString() : 'Recent'}
                                                            </span>
                                                        </div>
                                                        <span className={`status-badge ${session.status}`}>{session.status.replace('_', ' ')}</span>
                                                    </div>
                                                    <div className="plan-text-wrapper">
                                                        <Markdown content={session.plan} />
                                                    </div>
                                                    {session.thoughts && (
                                                        <div className="agent-thought glass">
                                                            <div className="thought-header">
                                                                <Icon name={Brain} size={12} />
                                                                <span>Agent Reasoning</span>
                                                            </div>
                                                            <div className="thought-content">{session.thoughts}</div>
                                                        </div>
                                                    )}
                                                    <div className="task-list">
                                                        {session.tasks.map(t => (
                                                            <div key={t.id} className={`task-item ${t.status}`}>
                                                                {t.status === 'finished' ? (
                                                                    <Icon name={CheckCircle} size={14} style={{ color: 'var(--accent-success)' }} />
                                                                ) : t.status === 'active' ? (
                                                                    <Icon name={RefreshCw} size={14} className="spin" style={{ color: 'var(--accent-primary)' }} />
                                                                ) : (
                                                                    <div className="dot" />
                                                                )}
                                                                <span>{t.description}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="session-footer" style={{ marginTop: 16 }}>
                                                        {session.status === 'awaiting_approval' && (
                                                            <button
                                                                className="btn btn-primary"
                                                                style={{ width: '100%' }}
                                                                onClick={() => executeSession(session.id, activeChatId)}
                                                            >
                                                                Start Execution
                                                            </button>
                                                        )}
                                                        {session.status === 'finished' && (
                                                            <button
                                                                className="btn btn-outline"
                                                                style={{ width: '100%' }}
                                                            >
                                                                Review Changes
                                                            </button>
                                                        )}
                                                        {session.status === 'error' && (
                                                            <div className="error-container" style={{ textAlign: 'center' }}>
                                                                <div className="error-message" style={{ color: 'var(--accent-error)', fontSize: '11px' }}>
                                                                    Execution encountered an error.
                                                                </div>
                                                                {session.tasks.find(t => t.status === 'error')?.error && (
                                                                    <div className="error-detail glass">
                                                                        <strong>Error:</strong> {session.tasks.find(t => t.status === 'error').error}
                                                                    </div>
                                                                )}
                                                                <button
                                                                    className="btn btn-primary"
                                                                    style={{ width: '100%' }}
                                                                    onClick={() => repairSession(session.id, false, activeChatId)}
                                                                >
                                                                    <Icon name={RefreshCw} size={14} style={{ marginRight: 8 }} />
                                                                    Re-do with AI Fix
                                                                </button>
                                                            </div>
                                                        )}
                                                        {session.analysis && (
                                                            <div className="repair-analysis glass">
                                                                <strong>Repair Analysis:</strong>
                                                                <div style={{ fontStyle: 'italic', opacity: 0.8 }}>{session.analysis}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={m.id}
                                                id={m.id}
                                                className={`message-bubble ${m.role} ${m.isLoading ? 'loading' : ''}`}
                                                style={{
                                                    backgroundColor: m.role === 'user' ? (settings.userBubbleColor || '#58a6ff') : (settings.aiBubbleColor || '#161b22'),
                                                    backgroundImage: m.role === 'user'
                                                        ? (settings.userBubbleBgImage ? `url(${settings.userBubbleBgImage})` : 'none')
                                                        : (settings.aiBubbleBgImage ? `url(${settings.aiBubbleBgImage})` : 'none'),
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    color: m.role === 'user'
                                                        ? (settings.userTextColor || '#000000')
                                                        : (settings.aiTextColor || '#e6edf3'),
                                                    border: (m.role !== 'user' && !settings.aiBubbleBgImage) ? '1px solid var(--border-color)' : 'none'
                                                }}
                                            >
                                                <div className="message-content">
                                                    {m.isLoading ? (
                                                        <Icon name={Loader2} className="spin" size={16} />
                                                    ) : m.role === 'assistant' ? (
                                                        <div className="assistant-message-flow">
                                                            {m.reasoning && (
                                                                <div className="thought-process glass">
                                                                    <div className="thought-header">
                                                                        <Icon name={Brain} size={14} />
                                                                        <span>Thought Process</span>
                                                                    </div>
                                                                    <div className="thought-content">
                                                                        {m.reasoning}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {m.content && <Markdown content={m.content} timestamp={m.timestamp} />}
                                                        </div>
                                                    ) : (
                                                        <div className="user-message-flow">
                                                            <span>{m.content}</span>
                                                            <span className="message-time">{m.timestamp}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div id="chat-end"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="chat-nav-buttons">
                        <button
                            className={`chat-nav-btn ${showScrollUp ? 'visible' : ''}`}
                            onClick={() => handleChatNavigation('up')}
                            title="Previous User Message"
                        >
                            <Icon name={ChevronUp} size={20} />
                        </button>
                        <button
                            className={`chat-nav-btn ${showScrollDown ? 'visible' : ''}`}
                            onClick={() => handleChatNavigation('down')}
                            title="Scroll to Bottom"
                        >
                            <Icon name={ChevronDown} size={20} />
                        </button>
                    </div>

                    <div className="composer-area">
                        <ChatStatus status={aiStatus} />
                        <div className={`composer-wrapper ${composerInput ? 'has-text' : ''}`}>
                            {mentionQuery && (
                                <MentionAutocomplete
                                    files={files}
                                    query={mentionQuery.query}
                                    position={mentionDropdownPosition}
                                    selectedIndex={selectedMentionIndex}
                                    onSelect={handleMentionSelect}
                                    onClose={handleMentionClose}
                                    onIndexChange={setSelectedMentionIndex}
                                />
                            )}
                            <textarea
                                ref={composerRef}
                                className="composer-input"
                                placeholder={composerMode === 'agent' ? "Describe what you want to build..." : "Ask a question..."}
                                value={composerInput}
                                onChange={(e) => {
                                    setComposerInput(e.target.value);
                                    if (composerRef.current) {
                                        composerRef.current.style.height = 'auto';
                                        composerRef.current.style.height = composerRef.current.scrollHeight + 'px';
                                    }

                                    // Mention detection
                                    const value = e.target.value;
                                    const cursorPos = e.target.selectionStart;
                                    const textBeforeCursor = value.substring(0, cursorPos);
                                    const mentionMatch = textBeforeCursor.match(/@([\w.-]*)$/);

                                    if (mentionMatch) {
                                        const query = mentionMatch[1];
                                        const startIndex = cursorPos - mentionMatch[0].length;
                                        const rect = e.target.getBoundingClientRect();

                                        // Calculate position (approximation since we can't get exact caret coords easily)
                                        // We place it above the textarea, shifted right based on cursor index
                                        // A better solution would use a caret coordinates library, but this is a good MVP
                                        setMentionQuery({ query, startIndex });
                                        setMentionDropdownPosition({
                                            top: rect.top - 310, // Max height (300) + gap (10)
                                            left: rect.left + (Math.min(textBeforeCursor.length, 50) * 8) + 10 // Max 50 chars width
                                        });
                                        // Reset index when new query starts
                                        if (!mentionQuery || mentionQuery.query !== query) {
                                            setSelectedMentionIndex(0);
                                        }
                                    } else {
                                        setMentionQuery(null);
                                        setMentionDropdownPosition(null);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    // If autocomplete is open, it handles arrow keys/enter via global listener
                                    // But we need to prevent default behavior for some keys here
                                    if (mentionQuery && mentionDropdownPosition) {
                                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Tab') {
                                            e.preventDefault();
                                            return;
                                        }
                                        if (e.key === 'Escape') {
                                            e.preventDefault();
                                            handleMentionClose();
                                            return;
                                        }
                                    }

                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitProposal();
                                        if (composerRef.current) composerRef.current.style.height = 'auto';
                                    }
                                }}
                            />
                            <div className="composer-actions">
                                {!composerInput && (
                                    <div className="composer-mode-container">
                                        <CustomSelect
                                            value={composerMode}
                                            onChange={setComposerMode}
                                            options={[
                                                {
                                                    value: 'chat',
                                                    label: 'Chat',
                                                    icon: MessageSquare,
                                                    description: 'Direct AI chat for questions and guidance'
                                                },
                                                {
                                                    value: 'agent',
                                                    label: 'Agent',
                                                    icon: CodeIcon,
                                                    description: 'Powerful automation for code implementation'
                                                }
                                            ]}
                                        />
                                    </div>
                                )}
                                <button className="send-btn" onClick={handleSubmitProposal}>
                                    {(isPlanning || isAgentExecuting) ? <Icon name={Square} size={14} fill="currentColor" /> : <Icon name={Send} size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div >

            {
                showSettings && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <button className="modal-close-btn" onClick={() => setShowSettings(false)}>
                                <Icon name={X} size={20} />
                            </button>
                            <div className="modal-sidebar">
                                <div className="modal-sidebar-title">Settings</div>
                                <div
                                    className={`settings-menu-item ${activeSettingsMenu === 'AI Model' ? 'active' : ''}`}
                                    onClick={() => setActiveSettingsMenu('AI Model')}
                                >
                                    <Icon name={CodeIcon} size={18} />
                                    <span>AI Model</span>
                                </div>
                                <div
                                    className={`settings-menu-item ${activeSettingsMenu === 'Display' ? 'active' : ''}`}
                                    onClick={() => setActiveSettingsMenu('Display')}
                                >
                                    <Icon name={Maximize2} size={18} />
                                    <span>Display</span>
                                </div>
                                <div
                                    className={`settings-menu-item ${activeSettingsMenu === 'Agents' ? 'active' : ''}`}
                                    onClick={() => setActiveSettingsMenu('Agents')}
                                >
                                    <Icon name={Users} size={18} />
                                    <span>Agents</span>
                                </div>
                            </div>

                            <div className="modal-content-area">
                                {activeSettingsMenu === 'AI Model' && (
                                    <div className="settings-content-centered">
                                        <div className="settings-section-title">AI Model</div>
                                        <div className="field" style={{ width: '100%' }}>
                                            <label>OpenRouter API Key</label>
                                            <input
                                                type="password"
                                                placeholder="sk-or-..."
                                                className="input"
                                                value={settings.apiKey}
                                                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                            />
                                        </div>
                                        <div className="field" style={{ width: '100%' }}>
                                            <label>Coding Model</label>
                                            <select
                                                className="input"
                                                value={settings.model}
                                                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                                            >
                                                <option value="deepseek/deepseek-chat">DeepSeek Chat (Preferred)</option>
                                                <option value="deepseek/deepseek-coder">DeepSeek Coder</option>
                                                <option value="xiaomi/mimo-v2-flash:free">MiMo-V2 Flash (Xiaomi - Free)</option>
                                                <option value="mistralai/devstral-2512:free">Devstral 2 2512 (Mistral - Free)</option>
                                                <option value="kwaipilot/kat-coder-pro:free">KAT-Coder-Pro V1 (Kwai - Free)</option>
                                                <option value="google/gemini-flash-1.5-8b">Gemini Flash 1.5</option>
                                                <option value="mistralai/mistral-7b-instruct:free">Mistral 7B (Free)</option>
                                            </select>
                                        </div>
                                        <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, width: '100%' }}>
                                            <button className="btn btn-primary" style={{ padding: '12px 48px' }} onClick={async () => {
                                                await window.api.saveSettings(settings);
                                                setShowSettings(false);
                                            }}>Save Changes</button>
                                        </div>
                                    </div>
                                )}

                                {activeSettingsMenu === 'Display' && (
                                    <div>
                                        <div className="settings-section-title">Display</div>

                                        <div className={`accordion ${expandedAccordions.has('chat') ? 'expanded' : ''} `}>
                                            <div className="accordion-header" onClick={() => {
                                                const newSet = new Set(expandedAccordions);
                                                if (newSet.has('chat')) newSet.delete('chat');
                                                else newSet.add('chat');
                                                setExpandedAccordions(newSet);
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <Icon name={MessageSquare} size={18} />
                                                    <span>Chat Personalization</span>
                                                </div>
                                                <Icon name={expandedAccordions.has('chat') ? ChevronUp : ChevronDown} size={18} />
                                            </div>
                                            {expandedAccordions.has('chat') && (
                                                <div className="accordion-content">
                                                    <div className="inner-accordion-container">
                                                        {/* Sender's Bubble Accordion */}
                                                        <div className={`inner-accordion ${expandedAccordions.has('sender-bubble') ? 'expanded' : ''}`}>
                                                            <div className="inner-accordion-header" style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => {
                                                                const newSet = new Set(expandedAccordions);
                                                                if (newSet.has('sender-bubble')) newSet.delete('sender-bubble');
                                                                else newSet.add('sender-bubble');
                                                                setExpandedAccordions(newSet);
                                                            }}>
                                                                <span>Sender's Chat Bubble</span>
                                                                <Icon name={expandedAccordions.has('sender-bubble') ? ChevronUp : ChevronDown} size={14} />
                                                            </div>
                                                            {expandedAccordions.has('sender-bubble') && (
                                                                <div style={{ padding: '0 16px 16px' }}>
                                                                    <div className="color-picker-row">
                                                                        <div style={{ display: 'flex', gap: 12 }}>
                                                                            <div className="color-input-wrapper" title="Bubble Color">
                                                                                <input
                                                                                    type="color"
                                                                                    value={settings.userBubbleColor || '#58a6ff'}
                                                                                    onChange={(e) => setSettings({ ...settings, userBubbleColor: e.target.value })}
                                                                                />
                                                                            </div>
                                                                            <div className="color-input-wrapper" title="Text Color" style={{ borderColor: 'var(--text-secondary)' }}>
                                                                                <Icon name={Type} size={14} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1, color: settings.userTextColor }} />
                                                                                <input
                                                                                    type="color"
                                                                                    value={settings.userTextColor || '#000000'}
                                                                                    onChange={(e) => setSettings({ ...settings, userTextColor: e.target.value })}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div
                                                                            className="color-preview-bubble"
                                                                            style={{
                                                                                backgroundColor: settings.userBubbleColor || '#58a6ff',
                                                                                backgroundImage: settings.userBubbleBgImage ? `url(${settings.userBubbleBgImage})` : 'none',
                                                                                backgroundSize: 'cover',
                                                                                backgroundPosition: 'center',
                                                                                color: settings.userTextColor || '#000000'
                                                                            }}
                                                                        >
                                                                            User Message Preview
                                                                        </div>
                                                                    </div>
                                                                    <div className="field" style={{ marginTop: 12 }}>
                                                                        <label style={{ fontSize: '11px', opacity: 0.6, marginBottom: 4, display: 'block' }}>Bubble Background Image</label>
                                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                                            <button className="btn btn-outline" style={{ flex: 1, height: 30, fontSize: '11px', padding: '0 8px' }} onClick={() => document.getElementById('user-bubble-bg-input').click()}>
                                                                                Upload Image
                                                                            </button>
                                                                            {settings.userBubbleBgImage && (
                                                                                <button className="btn btn-icon-sm" onClick={() => setSettings({ ...settings, userBubbleBgImage: '' })}>
                                                                                    <Icon name={X} size={12} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <input
                                                                            id="user-bubble-bg-input"
                                                                            type="file"
                                                                            accept="image/*"
                                                                            style={{ display: 'none' }}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files[0];
                                                                                if (file) {
                                                                                    const reader = new FileReader();
                                                                                    reader.onload = (event) => setSettings({ ...settings, userBubbleBgImage: event.target.result });
                                                                                    reader.readAsDataURL(file);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* AI Response Accordion */}
                                                        <div className={`inner-accordion ${expandedAccordions.has('ai-bubble') ? 'expanded' : ''}`}>
                                                            <div className="inner-accordion-header" style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => {
                                                                const newSet = new Set(expandedAccordions);
                                                                if (newSet.has('ai-bubble')) newSet.delete('ai-bubble');
                                                                else newSet.add('ai-bubble');
                                                                setExpandedAccordions(newSet);
                                                            }}>
                                                                <span>AI Response</span>
                                                                <Icon name={expandedAccordions.has('ai-bubble') ? ChevronUp : ChevronDown} size={14} />
                                                            </div>
                                                            {expandedAccordions.has('ai-bubble') && (
                                                                <div style={{ padding: '0 16px 16px' }}>
                                                                    <div className="color-picker-row">
                                                                        <div style={{ display: 'flex', gap: 12 }}>
                                                                            <div className="color-input-wrapper" title="Bubble Color">
                                                                                <input
                                                                                    type="color"
                                                                                    value={settings.aiBubbleColor || '#161b22'}
                                                                                    onChange={(e) => setSettings({ ...settings, aiBubbleColor: e.target.value })}
                                                                                />
                                                                            </div>
                                                                            <div className="color-input-wrapper" title="Text Color" style={{ borderColor: 'var(--text-secondary)' }}>
                                                                                <Icon name={Type} size={14} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1, color: settings.aiTextColor }} />
                                                                                <input
                                                                                    type="color"
                                                                                    value={settings.aiTextColor || '#e6edf3'}
                                                                                    onChange={(e) => setSettings({ ...settings, aiTextColor: e.target.value })}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div
                                                                            className="color-preview-bubble"
                                                                            style={{
                                                                                backgroundColor: settings.aiBubbleColor || '#161b22',
                                                                                border: '1px solid var(--border-color)',
                                                                                backgroundImage: settings.aiBubbleBgImage ? `url(${settings.aiBubbleBgImage})` : 'none',
                                                                                backgroundSize: 'cover',
                                                                                backgroundPosition: 'center',
                                                                                color: settings.aiTextColor || '#e6edf3'
                                                                            }}
                                                                        >
                                                                            AI Response Preview
                                                                        </div>
                                                                    </div>
                                                                    <div className="field" style={{ marginTop: 12 }}>
                                                                        <label style={{ fontSize: '11px', opacity: 0.6, marginBottom: 4, display: 'block' }}>Bubble Background Image</label>
                                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                                            <button className="btn btn-outline" style={{ flex: 1, height: 30, fontSize: '11px', padding: '0 8px' }} onClick={() => document.getElementById('ai-bubble-bg-input').click()}>
                                                                                Upload Image
                                                                            </button>
                                                                            {settings.aiBubbleBgImage && (
                                                                                <button className="btn btn-icon-sm" onClick={() => setSettings({ ...settings, aiBubbleBgImage: '' })}>
                                                                                    <Icon name={X} size={12} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <input
                                                                            id="ai-bubble-bg-input"
                                                                            type="file"
                                                                            accept="image/*"
                                                                            style={{ display: 'none' }}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files[0];
                                                                                if (file) {
                                                                                    const reader = new FileReader();
                                                                                    reader.onload = (event) => setSettings({ ...settings, aiBubbleBgImage: event.target.result });
                                                                                    reader.readAsDataURL(file);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Background Image Accordion */}
                                                        <div className={`inner-accordion ${expandedAccordions.has('bg-image') ? 'expanded' : ''}`}>
                                                            <div className="inner-accordion-header" style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => {
                                                                const newSet = new Set(expandedAccordions);
                                                                if (newSet.has('bg-image')) newSet.delete('bg-image');
                                                                else newSet.add('bg-image');
                                                                setExpandedAccordions(newSet);
                                                            }}>
                                                                <span>Background Image</span>
                                                                <Icon name={expandedAccordions.has('bg-image') ? ChevronUp : ChevronDown} size={14} />
                                                            </div>
                                                            {expandedAccordions.has('bg-image') && (
                                                                <div style={{ padding: '0 16px 16px' }}>
                                                                    <div className="field" style={{ marginTop: 8 }}>
                                                                        <label style={{ fontSize: '11px', opacity: 0.6, marginBottom: 8, display: 'block' }}>Choose a local image for chat background</label>
                                                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                                            <button
                                                                                className="btn btn-outline"
                                                                                style={{ flex: 1, height: 36, padding: '0 12px', fontSize: '12px' }}
                                                                                onClick={() => document.getElementById('bg-image-input').click()}
                                                                            >
                                                                                <Icon name={FolderOpen} size={14} style={{ marginRight: 8 }} />
                                                                                Upload Image
                                                                            </button>
                                                                            {settings.chatBgImage && (
                                                                                <button
                                                                                    className="btn btn-icon-sm"
                                                                                    title="Remove Background"
                                                                                    onClick={() => setSettings({ ...settings, chatBgImage: '' })}
                                                                                >
                                                                                    <Icon name={X} size={14} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <input
                                                                            id="bg-image-input"
                                                                            type="file"
                                                                            accept="image/*"
                                                                            style={{ display: 'none' }}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files[0];
                                                                                if (file) {
                                                                                    const reader = new FileReader();
                                                                                    reader.onload = (event) => {
                                                                                        setSettings({ ...settings, chatBgImage: event.target.result });
                                                                                    };
                                                                                    reader.readAsDataURL(file);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    {settings.chatBgImage && (
                                                                        <div style={{ marginTop: 16, width: '100%', height: 100, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                                            <img src={settings.chatBgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`accordion ${expandedAccordions.has('startup-text') ? 'expanded' : ''} `}>
                                            <div className="accordion-header" onClick={() => {
                                                const newSet = new Set(expandedAccordions);
                                                if (newSet.has('startup-text')) newSet.delete('startup-text');
                                                else newSet.add('startup-text');
                                                setExpandedAccordions(newSet);
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <Icon name={Type} size={18} />
                                                    <span>Startup Text</span>
                                                </div>
                                                <Icon name={expandedAccordions.has('startup-text') ? ChevronUp : ChevronDown} size={18} />
                                            </div>
                                            {expandedAccordions.has('startup-text') && (
                                                <div className="accordion-content">
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <span style={{ fontSize: '13px', opacity: 0.8 }}>"Hello!" Color</span>
                                                            <div className="color-input-wrapper">
                                                                <input
                                                                    type="color"
                                                                    value={settings.startupHelloColor || '#e6edf3'}
                                                                    onChange={(e) => setSettings({ ...settings, startupHelloColor: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <span style={{ fontSize: '13px', opacity: 0.8 }}>Message Color</span>
                                                            <div className="color-input-wrapper">
                                                                <input
                                                                    type="color"
                                                                    value={settings.startupMsgColor || '#8b949e'}
                                                                    onChange={(e) => setSettings({ ...settings, startupMsgColor: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
                                            <button className="btn btn-outline" style={{ color: 'var(--accent-error)', borderColor: 'rgba(248, 81, 73, 0.2)' }} onClick={async () => {
                                                const defaults = {
                                                    userBubbleColor: '#58a6ff',
                                                    aiBubbleColor: '#161b22',
                                                    userTextColor: '#000000',
                                                    aiTextColor: '#e6edf3',
                                                    chatBgImage: '',
                                                    userBubbleBgImage: '',
                                                    aiBubbleBgImage: '',
                                                    startupHelloColor: '#e6edf3',
                                                    startupMsgColor: '#8b949e'
                                                };
                                                const updatedSettings = { ...settings, ...defaults };
                                                setSettings(updatedSettings);
                                                await window.api.saveSettings(updatedSettings);
                                            }}>Reset to Default</button>
                                            <button className="btn btn-primary" onClick={async () => {
                                                await window.api.saveSettings(settings);
                                                setShowSettings(false);
                                            }}>Apply Changes</button>
                                        </div>
                                    </div>
                                )}

                                {activeSettingsMenu === 'Agents' && (
                                    <div>
                                        <div className="settings-section-title">Agents</div>
                                        <div className={`accordion ${expandedAccordions.has('agent-permissions') ? 'expanded' : ''} `}>
                                            <div className="accordion-header" onClick={() => {
                                                const newSet = new Set(expandedAccordions);
                                                if (newSet.has('agent-permissions')) newSet.delete('agent-permissions');
                                                else newSet.add('agent-permissions');
                                                setExpandedAccordions(newSet);
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <Icon name={ShieldCheck} size={18} />
                                                    <span>Permissions</span>
                                                </div>
                                                <Icon name={expandedAccordions.has('agent-permissions') ? ChevronUp : ChevronDown} size={18} />
                                            </div>
                                            {expandedAccordions.has('agent-permissions') && (
                                                <div className="accordion-content">
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Agent asking for permission before execution</span>
                                                        <select
                                                            className="input"
                                                            style={{ width: 'auto', minWidth: '240px' }}
                                                            value={settings.agentExecutionMode}
                                                            onChange={(e) => setSettings({ ...settings, agentExecutionMode: e.target.value })}
                                                        >
                                                            <option value="permission">asks for permission before every critical execution</option>
                                                            <option value="autonomous">AI fully runs autonomously</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                                            <button className="btn btn-primary" style={{ padding: '12px 48px' }} onClick={async () => {
                                                await window.api.saveSettings(settings);
                                                setShowSettings(false);
                                            }}>Save Changes</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {
                confirmDialog && (
                    <ConfirmDialog
                        isOpen={true}
                        {...confirmDialog}
                    />
                )
            }

            <ProjectWizardModal
                isOpen={showProjectWizard}
                onClose={() => setShowProjectWizard(false)}
                onCreateProject={handleCreateProject}
            />
        </div >
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
