// Framework Templates - Knowledge base for project creation wizard
// Each framework contains setup instructions, file structure, and create commands

const FRAMEWORKS = {
    'react-cra': {
        id: 'react-cra',
        name: 'React (Create React App)',
        icon: 'atom',
        color: '#61DAFB',
        description: 'Official React starter with zero config',
        createCommand: 'npx create-react-app',
        installSteps: [
            {
                id: 1,
                title: 'Install Node.js',
                type: 'download',
                url: 'https://nodejs.org/',
                description: 'Download and install the LTS version (recommended). This includes npm (Node Package Manager).'
            },
            {
                id: 2,
                title: 'Add Node.js to PATH',
                type: 'env',
                steps: [
                    'Open System Properties → Environment Variables',
                    'Under "System Variables", find and select "Path"',
                    'Click Edit → New → Add: C:\\Program Files\\nodejs\\',
                    'Click OK on all dialogs',
                    'Restart any open terminals'
                ]
            },
            {
                id: 3,
                title: 'Verify Installation',
                type: 'terminal',
                command: 'node --version && npm --version',
                expectedOutput: 'Should show version numbers like v18.x.x and 9.x.x'
            },
            {
                id: 4,
                title: 'Create React App',
                type: 'terminal',
                command: 'npx create-react-app {projectName}',
                description: 'This will create a new folder with all React dependencies'
            },
            {
                id: 5,
                title: 'Start Development Server',
                type: 'terminal',
                command: 'cd {projectName} && npm start',
                description: 'Opens your app at http://localhost:3000'
            }
        ],
        fileStructure: {
            'src/App.js': 'Main application component - your app starts here',
            'src/App.css': 'Styles for the App component',
            'src/index.js': 'Entry point - renders App to the DOM',
            'src/index.css': 'Global styles',
            'public/index.html': 'HTML template',
            'package.json': 'Project dependencies and scripts'
        }
    },

    'react-vite': {
        id: 'react-vite',
        name: 'React + Vite',
        icon: 'zap',
        color: '#646CFF',
        description: 'Lightning-fast React with Vite bundler',
        createCommand: 'npm create vite@latest',
        installSteps: [
            {
                id: 1,
                title: 'Install Node.js',
                type: 'download',
                url: 'https://nodejs.org/',
                description: 'Download and install the LTS version (v18 or later recommended).'
            },
            {
                id: 2,
                title: 'Add Node.js to PATH',
                type: 'env',
                steps: [
                    'Open System Properties → Environment Variables',
                    'Under "System Variables", find and select "Path"',
                    'Click Edit → New → Add: C:\\Program Files\\nodejs\\',
                    'Click OK on all dialogs'
                ]
            },
            {
                id: 3,
                title: 'Verify Installation',
                type: 'terminal',
                command: 'node --version && npm --version',
                expectedOutput: 'Should show version numbers'
            },
            {
                id: 4,
                title: 'Create Vite Project',
                type: 'terminal',
                command: 'npm create vite@latest {projectName} -- --template react',
                description: 'Creates a new Vite + React project'
            },
            {
                id: 5,
                title: 'Install Dependencies',
                type: 'terminal',
                command: 'cd {projectName} && npm install',
                description: 'Installs all required packages'
            },
            {
                id: 6,
                title: 'Start Development Server',
                type: 'terminal',
                command: 'npm run dev',
                description: 'Opens your app at http://localhost:5173'
            }
        ],
        fileStructure: {
            'src/App.jsx': 'Main application component',
            'src/App.css': 'Styles for the App component',
            'src/main.jsx': 'Entry point',
            'src/index.css': 'Global styles',
            'index.html': 'HTML template (in root)',
            'vite.config.js': 'Vite configuration',
            'package.json': 'Project dependencies and scripts'
        }
    },

    'vue': {
        id: 'vue',
        name: 'Vue 3',
        icon: 'layers',
        color: '#42B883',
        description: 'Progressive JavaScript framework',
        createCommand: 'npm create vue@latest',
        installSteps: [
            {
                id: 1,
                title: 'Install Node.js',
                type: 'download',
                url: 'https://nodejs.org/',
                description: 'Download and install the LTS version.'
            },
            {
                id: 2,
                title: 'Add Node.js to PATH',
                type: 'env',
                steps: [
                    'Open System Properties → Environment Variables',
                    'Add C:\\Program Files\\nodejs\\ to Path variable'
                ]
            },
            {
                id: 3,
                title: 'Create Vue Project',
                type: 'terminal',
                command: 'npm create vue@latest {projectName}',
                description: 'Follow the prompts to configure your project'
            },
            {
                id: 4,
                title: 'Install Dependencies',
                type: 'terminal',
                command: 'cd {projectName} && npm install'
            },
            {
                id: 5,
                title: 'Start Development Server',
                type: 'terminal',
                command: 'npm run dev',
                description: 'Opens your app at http://localhost:5173'
            }
        ],
        fileStructure: {
            'src/App.vue': 'Main application component',
            'src/main.js': 'Entry point',
            'src/components/': 'Reusable Vue components',
            'index.html': 'HTML template',
            'vite.config.js': 'Vite configuration'
        }
    },

    'angular': {
        id: 'angular',
        name: 'Angular',
        icon: 'box',
        color: '#DD0031',
        description: 'Full-featured TypeScript framework by Google',
        createCommand: 'npx @angular/cli new',
        installSteps: [
            {
                id: 1,
                title: 'Install Node.js',
                type: 'download',
                url: 'https://nodejs.org/',
                description: 'Angular requires Node.js v18.13 or later.'
            },
            {
                id: 2,
                title: 'Add Node.js to PATH',
                type: 'env',
                steps: [
                    'Open System Properties → Environment Variables',
                    'Add C:\\Program Files\\nodejs\\ to Path variable'
                ]
            },
            {
                id: 3,
                title: 'Install Angular CLI',
                type: 'terminal',
                command: 'npm install -g @angular/cli',
                description: 'Installs the Angular command-line tool globally'
            },
            {
                id: 4,
                title: 'Create Angular Project',
                type: 'terminal',
                command: 'ng new {projectName}',
                description: 'Follow prompts for routing and stylesheet format'
            },
            {
                id: 5,
                title: 'Start Development Server',
                type: 'terminal',
                command: 'cd {projectName} && ng serve',
                description: 'Opens your app at http://localhost:4200'
            }
        ],
        fileStructure: {
            'src/app/app.component.ts': 'Root component TypeScript',
            'src/app/app.component.html': 'Root component template',
            'src/app/app.component.css': 'Root component styles',
            'src/main.ts': 'Entry point',
            'angular.json': 'Angular workspace configuration'
        }
    },

    'nextjs': {
        id: 'nextjs',
        name: 'Next.js',
        icon: 'triangle',
        color: '#000000',
        description: 'React framework with SSR and routing',
        createCommand: 'npx create-next-app@latest',
        installSteps: [
            {
                id: 1,
                title: 'Install Node.js',
                type: 'download',
                url: 'https://nodejs.org/',
                description: 'Download and install Node.js LTS version.'
            },
            {
                id: 2,
                title: 'Add Node.js to PATH',
                type: 'env',
                steps: [
                    'Open System Properties → Environment Variables',
                    'Add C:\\Program Files\\nodejs\\ to Path variable'
                ]
            },
            {
                id: 3,
                title: 'Create Next.js Project',
                type: 'terminal',
                command: 'npx create-next-app@latest {projectName}',
                description: 'Follow prompts for TypeScript, ESLint, Tailwind, etc.'
            },
            {
                id: 4,
                title: 'Start Development Server',
                type: 'terminal',
                command: 'cd {projectName} && npm run dev',
                description: 'Opens your app at http://localhost:3000'
            }
        ],
        fileStructure: {
            'app/page.js': 'Home page component (App Router)',
            'app/layout.js': 'Root layout',
            'app/globals.css': 'Global styles',
            'next.config.js': 'Next.js configuration',
            'package.json': 'Project dependencies'
        }
    },

    'nodejs': {
        id: 'nodejs',
        name: 'Node.js / Express',
        icon: 'server',
        color: '#339933',
        description: 'Backend JavaScript with Express',
        createCommand: 'manual',
        installSteps: [
            {
                id: 1,
                title: 'Install Node.js',
                type: 'download',
                url: 'https://nodejs.org/',
                description: 'Download and install the LTS version.'
            },
            {
                id: 2,
                title: 'Add Node.js to PATH',
                type: 'env',
                steps: [
                    'Open System Properties → Environment Variables',
                    'Add C:\\Program Files\\nodejs\\ to Path variable'
                ]
            },
            {
                id: 3,
                title: 'Create Project Folder',
                type: 'terminal',
                command: 'mkdir {projectName} && cd {projectName}'
            },
            {
                id: 4,
                title: 'Initialize npm',
                type: 'terminal',
                command: 'npm init -y',
                description: 'Creates package.json'
            },
            {
                id: 5,
                title: 'Install Express',
                type: 'terminal',
                command: 'npm install express',
                description: 'Adds Express.js framework'
            },
            {
                id: 6,
                title: 'Create index.js',
                type: 'file',
                description: 'Create index.js with basic Express server code'
            },
            {
                id: 7,
                title: 'Start Server',
                type: 'terminal',
                command: 'node index.js',
                description: 'Server runs at http://localhost:3000'
            }
        ],
        fileStructure: {
            'index.js': 'Main server entry point',
            'routes/': 'API route handlers',
            'package.json': 'Project dependencies'
        },
        starterCode: {
            'index.js': `const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to your Express API!' });
});

app.listen(PORT, () => {
    console.log(\`Server running at http://localhost:\${PORT}\`);
});`
        }
    },

    'flask': {
        id: 'flask',
        name: 'Python / Flask',
        icon: 'flask',
        color: '#3776AB',
        description: 'Lightweight Python web framework',
        createCommand: 'manual',
        installSteps: [
            {
                id: 1,
                title: 'Install Python',
                type: 'download',
                url: 'https://www.python.org/downloads/',
                description: 'Download Python 3.10+ and check "Add to PATH" during install.'
            },
            {
                id: 2,
                title: 'Verify Python Installation',
                type: 'terminal',
                command: 'python --version && pip --version',
                expectedOutput: 'Should show Python 3.x.x and pip version'
            },
            {
                id: 3,
                title: 'Create Project Folder',
                type: 'terminal',
                command: 'mkdir {projectName} && cd {projectName}'
            },
            {
                id: 4,
                title: 'Create Virtual Environment',
                type: 'terminal',
                command: 'python -m venv venv',
                description: 'Creates isolated Python environment'
            },
            {
                id: 5,
                title: 'Activate Virtual Environment',
                type: 'terminal',
                command: '.\\venv\\Scripts\\activate',
                description: 'Windows: .\\venv\\Scripts\\activate | Mac/Linux: source venv/bin/activate'
            },
            {
                id: 6,
                title: 'Install Flask',
                type: 'terminal',
                command: 'pip install flask'
            },
            {
                id: 7,
                title: 'Create app.py',
                type: 'file',
                description: 'Create app.py with basic Flask code'
            },
            {
                id: 8,
                title: 'Run Development Server',
                type: 'terminal',
                command: 'python app.py',
                description: 'Server runs at http://localhost:5000'
            }
        ],
        fileStructure: {
            'app.py': 'Main Flask application',
            'templates/': 'HTML templates',
            'static/': 'CSS, JS, images',
            'requirements.txt': 'Python dependencies'
        },
        starterCode: {
            'app.py': `from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify(message='Welcome to your Flask API!')

if __name__ == '__main__':
    app.run(debug=True)`
        }
    }
};

// Helper to get framework by ID
function getFramework(id) {
    return FRAMEWORKS[id] || null;
}

// Get all frameworks as array for dropdown
function getAllFrameworks() {
    return Object.values(FRAMEWORKS);
}

// Replace {projectName} placeholder in commands
function formatCommand(command, projectName) {
    return command.replace(/{projectName}/g, projectName);
}

// Export for use in App.js
window.FrameworkTemplates = {
    FRAMEWORKS,
    getFramework,
    getAllFrameworks,
    formatCommand
};
