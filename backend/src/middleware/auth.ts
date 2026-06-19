/**
 * Generic OIDC bearer token middleware for Fastify.
 *
 * Works with any OIDC-compliant identity provider:
 *   - Azure AD: OIDC_ISSUER_URL=https://login.microsoftonline.com/<tenant>/v2.0
 *   - Authentik: OIDC_ISSUER_URL=https://authentik.host/application/o/<slug>/
 *   - Any other OIDC IdP that exposes standard discovery metadata
 *
 * Validates bearer tokens via introspection, falling back to the userinfo
 * endpoint. Upserts a local user row so audit logs carry real user identity.
 *
 * Set OIDC_DISABLED=true to bypass verification in local dev without an IdP.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as oidcClient from 'openid-client';
import { prisma } from '../db/prisma';
import { config } from '../config/config';

interface OidcClaims {
  sub: string;
  preferred_username?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

declare module 'fastify' {
  interface FastifyRequest {
    oidcClaims: OidcClaims;
    actorSub: string;
  }
}

// Cached after first discovery — not re-initialized per request
let oidcConfig: oidcClient.Configuration | null = null;

async function getOidcConfig(): Promise<oidcClient.Configuration> {
  if (oidcConfig) return oidcConfig;

  const auth = config.oidcClientSecret
    ? oidcClient.ClientSecretPost(config.oidcClientSecret)
    : oidcClient.None();

  oidcConfig = await oidcClient.discovery(
    new URL(config.oidcIssuerUrl),
    config.oidcClientId,
    undefined,
    auth
  );

  return oidcConfig;
}

async function resolveClaimsFromToken(token: string): Promise<OidcClaims> {
  const cfg = await getOidcConfig();

  // Try introspection first (works for both opaque tokens and JWTs)
  try {
    const result = await oidcClient.tokenIntrospection(cfg, token);
    if (result.active) {
      return result as unknown as OidcClaims;
    }
    throw new Error('Token is not active');
  } catch {
    // Fall through to userinfo — some IdPs don't expose introspection
  }

  // Userinfo endpoint validates the token implicitly
  const userinfo = await oidcClient.fetchUserInfo(cfg, token, oidcClient.skipSubjectCheck);
  return userinfo as unknown as OidcClaims;
}

async function upsertUser(claims: OidcClaims, server: FastifyInstance) {
  try {
    await prisma.user.upsert({
      where: { oidcSub: claims.sub },
      update: {
        username: claims.preferred_username ?? claims.sub,
        displayName: claims.name,
        email: claims.email,
        lastSeenAt: new Date(),
      },
      create: {
        oidcSub: claims.sub,
        username: claims.preferred_username ?? claims.sub,
        displayName: claims.name,
        email: claims.email,
        role: 'technician',
      },
    });
  } catch (err) {
    server.log.warn('User upsert failed:', err);
  }
}

export async function registerAuthHook(server: FastifyInstance) {
  if (config.oidcDisabled) {
    server.log.warn('OIDC_DISABLED=true — all requests run as dev/system user');
    server.addHook('onRequest', async (request: FastifyRequest) => {
      request.oidcClaims = { sub: 'system', preferred_username: 'dev', name: 'Dev User' };
      request.actorSub = 'system';
    });
    return;
  }

  server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.url === '/ping') return;
    // Probe self-service (heartbeat, device ingest) authenticates by API key,
    // not OIDC — these are hit by unattended scanners on customer LANs.
    if (request.url.startsWith('/probe/')) return;

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing bearer token' });
    }

    const token = authHeader.slice(7);

    try {
      const claims = await resolveClaimsFromToken(token);
      request.oidcClaims = claims;
      request.actorSub = claims.sub;

      // Fire-and-forget — don't block the response on the DB write
      upsertUser(claims, server);
    } catch (err) {
      server.log.warn('Auth failed:', err);
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
  });
}
