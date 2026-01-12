const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const { exec, spawn } = require('child_process');
const workspace = 'c:\\Users\\kakai\\OneDrive\\Desktop\\CODEX\\CODEX MAX\\anita-app';

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'GET') {
        let filePath = '.' + req.url;
        if (filePath === './') filePath = './test-index.html';

        try {
            const content = await fs.readFile(filePath);
            const ext = path.extname(filePath);
            const contentType = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.png': 'image/png'
            }[ext] || 'text/plain';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } catch (e) {
            res.writeHead(404);
            res.end('Not found');
        }
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const data = body ? JSON.parse(body) : {};
            const url = new URL(req.url, `http://${req.headers.host}`);
            const action = url.pathname.slice(1);

            console.log(`[Bridge] Action: ${action}`, data);

            let result;
            switch (action) {
                case 'read-dir':
                    const files = await fs.readdir(data.path, { withFileTypes: true });
                    result = files.map(f => ({ name: f.name, path: path.join(data.path, f.name), isDirectory: f.isDirectory() }));
                    break;
                case 'read-file':
                    result = await fs.readFile(data.path, 'utf-8');
                    break;
                case 'write-file':
                    await fs.ensureDir(path.dirname(data.path));
                    await fs.writeFile(data.path, data.content);
                    result = true;
                    break;
                case 'path-exists':
                    result = await fs.pathExists(data.path);
                    break;
                case 'execute-command':
                    // Real terminal command execution
                    const proc = exec(data.command, { cwd: workspace });
                    let stdout = '', stderr = '';
                    proc.stdout.on('data', d => stdout += d);
                    proc.stderr.on('data', d => stderr += d);
                    result = await new Promise(resolve => {
                        proc.on('close', code => resolve({ success: code === 0, stdout, stderr }));
                    });
                    break;
                case 'get-settings':
                    const Store = require('electron-store');
                    const store = new Store();
                    result = {
                        apiKey: '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',
                        togetherKey: store.get('togetherKey'),
                        theme: store.get('theme', 'dark'),
                        model: store.get('model', 'deepseek/deepseek-chat')
                    };
                    break;
                case 'get-workspace-path':
                    result = workspace;
                    break;
                case 'save-chats':
                case 'save-sessions':
                case 'save-active-chat-id':
                case 'save-open-chat-ids':
                    result = true; // Just pretend we saved
                    break;
                case 'get-chats':
                case 'get-sessions':
                case 'get-open-chat-ids':
                case 'get-token-usage':
                    result = [];
                    break;
                default:
                    console.warn(`[Bridge] Unknown action: ${action}`);
                    result = { error: 'Unknown action' };
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (err) {
            console.error(`[Bridge] Error:`, err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    });
});

server.listen(8000, () => {
    console.log('Anita Bridge Server running on http://localhost:8000');
});
