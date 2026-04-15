/**
 * API Proxy Middleware — intercepts all requests and forwards to upstream services.
 *
 * Architecture:
 *   Consumer App → API Gateway (/api/v1/*)
 *                              │
 *              ┌───────────────┴──────────────────┐
 *              │                                  │
 *         /search/*, /homepage/*,          everything else
 *         /recommend/*, /api/homepage/*,
 *         /api/search/*, /api/stores/*
 *              │                                  │
 *              ▼                                  ▼
 *       rez-search-service              rez-backend monolith
 *       (SEARCH_SERVICE_URL)           (MONOLITH_URL)
 *
 * Env vars:
 *   MONOLITH_URL         — backend monolith URL (default: http://localhost:5001)
 *   SEARCH_SERVICE_URL   — search microservice URL (default: http://localhost:4003)
 *   AUTH_SERVICE_URL     — auth microservice URL (optional)
 *   PAYMENT_SERVICE_URL — payment microservice URL (optional)
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const logger = new Logger('ApiProxyMiddleware');

// ── Upstream service URLs ─────────────────────────────────────────────────
const MONOLITH_URL = process.env.MONOLITH_URL || 'http://localhost:5001';
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:4003';

// ── Paths that go to the search microservice ───────────────────────────────
// Both native paths (/search/*) and monolith compat paths (/api/search/*) are
// routed to the search service so that requests arriving via either format work.
const SEARCH_PATH_PREFIXES = [
  '/search',
  '/homepage',
  '/recommend',
  '/api/search',
  '/api/homepage',
  '/api/stores/search',
  '/api/stores/nearby',
  '/api/stores/trending',
  '/api/products/search',
  '/api/products/filters',
  '/api/recommendations',
  '/api/homepage/user-context',
  '/api/homepage/sections',
];

function shouldRouteToSearch(path: string): boolean {
  const normalized = path.toLowerCase();
  return SEARCH_PATH_PREFIXES.some((p) => normalized.startsWith(p.toLowerCase()));
}

/**
 * Build http-proxy-middleware options for a given target.
 *
 * pathRewrite strips the NestJS global prefix '/api/v1' from the incoming
 * request URL before forwarding. The middleware sees the full URL including
 * the prefix, so we remove it here.
 */
function buildProxyOptions(target: string, logPrefix: string) {
  return {
    target,
    changeOrigin: true,
    pathRewrite: (rawPath: string) => {
      const rewritten = rawPath.replace(/^\/api\/v1/, '') || '/';
      logger.debug(`[${logPrefix}] → ${target}${rewritten}`);
      return rewritten;
    },
    onProxyReq: (proxyReq: any, req: Request) => {
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
      if (req.headers['x-rez-region']) {
        proxyReq.setHeader('X-Rez-Region', req.headers['x-rez-region'] as string);
      }
      if (req.headers['x-device-fingerprint']) {
        proxyReq.setHeader('X-Device-Fingerprint', req.headers['x-device-fingerprint'] as string);
      }
      if (req.headers['x-device-os']) {
        proxyReq.setHeader('X-Device-OS', req.headers['x-device-os'] as string);
      }
    },
    onError: (err: Error, req: Request, res: Response) => {
      logger.error(`[PROXY ERROR] ${req.path}: ${err.message}`);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          error: 'Upstream service unavailable',
          path: req.path,
        });
      }
    },
    logLevel: 'debug' as const,
  };
}

@Injectable()
export class ApiProxyMiddleware implements NestMiddleware {
  private monolithProxy = createProxyMiddleware(buildProxyOptions(MONOLITH_URL, 'MONOLITH'));
  private searchProxy = createProxyMiddleware(buildProxyOptions(SEARCH_SERVICE_URL, 'SEARCH'));

  use(req: Request, res: Response, next: NextFunction): void {
    const { path } = req;

    // Don't proxy internal endpoints — let NestJS handle them
    if (path === '/health' || path.startsWith('/api/docs')) {
      return next();
    }

    const target = shouldRouteToSearch(path) ? SEARCH_SERVICE_URL : MONOLITH_URL;
    const proxy = shouldRouteToSearch(path) ? this.searchProxy : this.monolithProxy;

    logger.log(`${req.method} ${path} → ${target}`);
    proxy(req as any, res as any, next);
  }
}
