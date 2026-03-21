const { execSync } = require('child_process');
const fs = require('fs');
try {
  const output = execSync('npx tauri init --help').toString();
  fs.writeFileSync('tauri_help.txt', output);
} catch (e) {
  fs.writeFileSync('tauri_help.txt', e.stdout ? e.stdout.toString() : e.toString());
}
