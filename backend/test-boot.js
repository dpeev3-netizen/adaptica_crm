const { execSync } = require('child_process');
try {
  console.log('Booting server...');
  execSync('npx.cmd ts-node src/index.ts', { stdio: 'pipe', encoding: 'utf-8' });
  console.log('Server booted successfully.');
} catch (e) {
  console.log('Server crashed.');
  require('fs').writeFileSync('crash-full.txt', e.stderr + '\n\nSTDOUT:\n' + e.stdout);
}
