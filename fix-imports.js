const fs = require('fs');
const { execSync } = require('child_process');
const fileListText = execSync('dir /s /b src\\*.tsx').toString();
const files = fileListText.split('\n').map(l => l.trim()).filter(l => l);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('fetchWithToken') && !content.includes('import { fetchWithToken }')) {
    const lines = content.split(/\r?\n/);
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) lastImportIdx = i;
    }
    const importStmt = `import { fetchWithToken } from '@/lib/api';`;
    if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, importStmt);
    } else {
        lines.unshift(importStmt);
    }
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Fixed import in', file);
  }
});
console.log('Done fixing imports');
