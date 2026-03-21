const fs = require('fs');

// We use native fs and a rudimentary glob implementation or child_process find
const { execSync } = require('child_process');

// Find all .tsx files
const fileListText = execSync('dir /s /b src\\*.tsx').toString();
const files = fileListText.split('\n').map(l => l.trim()).filter(l => l);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  const originalContent = content;

  // Replace fetch('/api/...
  content = content.replace(/fetch\(['"]\/api\/(.*?)['"](.*?)\)/g, "fetchWithToken('/$1'$2)");
  content = content.replace(/fetch\(`\/api\/(.*?)`(.*?)\)/g, "fetchWithToken(`/$1`$2)");

  changed = content !== originalContent;

  // add import if missing
  if (changed && !content.includes('fetchWithToken')) {
    // try to find the last import to interject
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) lastImportIdx = i;
    }
    const importStmt = `import { fetchWithToken } from '@/lib/api';`;
    if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, importStmt);
    } else {
        lines.unshift(importStmt);
    }
    content = lines.join('\n');
  }

  if (content !== originalContent) {
      console.log('Modified:', file);
      fs.writeFileSync(file, content);
  }
});
console.log('Codemod complete');
