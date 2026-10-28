import app from './app.js';
import { config } from './config/index.js';

const PORT = config.port;

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  white: '\x1b[97m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m\x1b[97m\x1b[1m',
};

app.listen(PORT, () => {
  const localUrl = `http://localhost:${PORT}`;
  const healthUrl = `http://localhost:${PORT}/api/v1/health`;

  console.log(`
 ${c.bgBlue} LAB STOCK API GATEWAY ${c.reset}  ${c.green}● Ready${c.reset}

  ${c.gray}│${c.reset}  ${c.bold}Local:${c.reset}       ${c.cyan}${localUrl}${c.reset}
  ${c.gray}│${c.reset}  ${c.bold}Health:${c.reset}      ${c.cyan}${healthUrl}${c.reset}
  ${c.gray}│${c.reset}  ${c.bold}Mode:${c.reset}        ${c.yellow}${config.nodeEnv}${c.reset}
  ${c.gray}│${c.reset}  ${c.bold}Monitoring:${c.reset}  ${c.green}Live Morgan UI Logger${c.reset}
`);
});
