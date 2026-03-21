const { execSync } = require('child_process');
const fs = require('fs');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  fs.writeFileSync('tsc-out.txt', 'NO ERRORS');
} catch (e) {
  fs.writeFileSync('tsc-out.txt', e.stdout.toString() + e.stderr.toString());
}
