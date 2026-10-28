import morgan from 'morgan';
import { Request, Response } from 'express';

// ANSI styling
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  white: '\x1b[97m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',

  // Badges
  bgGet: '\x1b[46m\x1b[30m\x1b[1m',
  bgPost: '\x1b[42m\x1b[30m\x1b[1m',
  bgPut: '\x1b[43m\x1b[30m\x1b[1m',
  bgPatch: '\x1b[45m\x1b[37m\x1b[1m',
  bgDelete: '\x1b[41m\x1b[37m\x1b[1m',

  bg2xx: '\x1b[32m\x1b[1m',
  bg3xx: '\x1b[36m\x1b[1m',
  bg4xx: '\x1b[33m\x1b[1m',
  bg5xx: '\x1b[31m\x1b[1m',
};

const getMethodBadge = (method: string): string => {
  switch (method) {
    case 'GET':
      return `${c.bgGet} GET ${c.reset}`;
    case 'POST':
      return `${c.bgPost} POST ${c.reset}`;
    case 'PUT':
      return `${c.bgPut} PUT ${c.reset}`;
    case 'PATCH':
      return `${c.bgPatch} PATCH ${c.reset}`;
    case 'DELETE':
      return `${c.bgDelete} DEL ${c.reset}`;
    default:
      return `${c.dim} ${method} ${c.reset}`;
  }
};

const getStatusBadge = (statusStr?: string): string => {
  const status = Number(statusStr) || 0;
  if (status >= 500) return `${c.bg5xx}✖ ${status}${c.reset}`;
  if (status >= 400) return `${c.bg4xx}⚠ ${status}${c.reset}`;
  if (status >= 300) return `${c.bg3xx}↷ ${status}${c.reset}`;
  if (status >= 200) return `${c.bg2xx}✔ ${status}${c.reset}`;
  return `${c.gray}${status}${c.reset}`;
};

const formatLatency = (msStr?: string): string => {
  const ms = parseFloat(msStr || '0');
  if (ms > 500) return `${c.red}${ms.toFixed(1)}ms${c.reset}`;
  if (ms > 100) return `${c.yellow}${ms.toFixed(1)}ms${c.reset}`;
  return `${c.green}${ms.toFixed(1)}ms${c.reset}`;
};

export const requestLogger = morgan((tokens, req: Request, res: Response) => {
  const now = new Date();
  const time = `${c.gray}${now.toLocaleTimeString()}${c.reset}`;
  const method = getMethodBadge(tokens.method(req, res) || 'GET');
  const url = `${c.bold}${c.white}${tokens.url(req, res)}${c.reset}`;
  const status = getStatusBadge(tokens.status(req, res));
  const latency = formatLatency(tokens['response-time'](req, res));

  return ` ${time}  ${method} ${url} ${c.gray}→${c.reset} ${status} ${c.gray}(${latency}${c.gray})${c.reset}`;
});
