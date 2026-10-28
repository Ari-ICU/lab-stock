import app from './app.js';
import { config } from './config/index.js';
import { testDatabaseConnection } from './config/database.js';
import { initializeDatabase } from './database/initDb.js';

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
  magenta: '\x1b[35m',
  bgBlue: '\x1b[44m\x1b[97m\x1b[1m',
};

app.listen(PORT, async () => {
  const localUrl = `http://localhost:${PORT}`;
  const healthUrl = `http://localhost:${PORT}/api/v1/health`;
  const swaggerUrl = `http://localhost:${PORT}/api/docs`;

  // Test PostgreSQL connection
  const dbStatus = await testDatabaseConnection();
  let dbLabel = `${c.yellow}○ Standalone / Offline (${dbStatus.message})${c.reset}`;

  if (dbStatus.connected) {
    dbLabel = `${c.green}● Connected (PostgreSQL)${c.reset}`;
    // Auto-run schema initialization and bcrypt seeding if tables do not exist
    const initResult = await initializeDatabase();
    if (!initResult.success) {
      console.warn(`⚠️ Database schema auto-check: ${initResult.message}`);
    }
  }

  console.log(`
 ${c.bgBlue} LAB STOCK API GATEWAY ${c.reset}  ${c.green}● Production Ready${c.reset}

  ${c.gray}│${c.reset}  ${c.bold}Local Server:${c.reset}   ${c.cyan}${localUrl}${c.reset}
  ${c.gray}│${c.reset}  ${c.bold}Swagger Docs:${c.reset}   ${c.magenta}${swaggerUrl}${c.reset}
  ${c.gray}│${c.reset}  ${c.bold}Health Check:${c.reset}   ${c.cyan}${healthUrl}${c.reset}
  ${c.gray}│${c.reset}  ${c.bold}Database:${c.reset}       ${dbLabel}
  ${c.gray}│${c.reset}  ${c.bold}Environment:${c.reset}    ${c.yellow}${config.nodeEnv}${c.reset}
  ${c.gray}│${c.reset}  ${c.bold}Security:${c.reset}       ${c.green}Bcrypt (work: 12) + Cryptographic JWT (HS256) + Strict RBAC${c.reset}
`);
});
