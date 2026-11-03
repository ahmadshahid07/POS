const cp = require('child_process');
const electronPath = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const proc = cp.spawn(electronPath, ['.', ...process.argv.slice(2)], {
  env,
  stdio: 'inherit',
  windowsHide: false,
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
