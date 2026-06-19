// Temporäres Debug-Script: zeigt PATH/ENV während postinstall
const { execSync } = require('node:child_process');
const fs = require('node:fs');

const log = `/tmp/debug-postinstall-env.log`;
let out = '';
out += `PATH: ${process.env.PATH}\n`;
out += `HOME: ${process.env.HOME}\n`;
out += `USER: ${process.env.USER}\n`;
out += `PWD: ${process.cwd()}\n`;
out += `npm_config_user_agent: ${process.env.npm_config_user_agent}\n`;

try {
    const which = execSync('which iobroker', { encoding: 'utf8' });
    out += `which iobroker: ${which}`;
} catch (e) {
    out += `which iobroker FAILED: ${e.message}\n`;
}

try {
    const which2 = execSync('command -v iobroker', { encoding: 'utf8', shell: '/bin/bash' });
    out += `command -v iobroker: ${which2}`;
} catch (e) {
    out += `command -v iobroker FAILED: ${e.message}\n`;
}

fs.writeFileSync(log, out);
console.log(out);
