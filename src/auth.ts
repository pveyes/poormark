import { DidResolver, getPds, MemoryCache } from '@atproto/identity';
import { AuthRequiredError, parseReqNsid, verifyJwt } from '@atproto/xrpc-server';
import { FastifyRequest } from "fastify";
import { Identity } from './types.js';

export async function getAuthUser(
  req: FastifyRequest,
): Promise<Identity | null> {
  const { authorization = '' } = req.headers
  if (!authorization.startsWith('Bearer ')) {
    throw new AuthRequiredError()
  }
  const jwt = authorization.replace('Bearer ', '').trim()
  const nsid = parseReqNsid(req)
  const parsed = await verifyJwt(jwt, null, nsid, async (did: string) => {
    return didResolver.resolveAtprotoKey(did)
  })
  
  return getIdentity(parsed.iss)
}

const didCache = new MemoryCache()
const didResolver = new DidResolver({
  plcUrl: 'https://plc.directory',
  didCache
})

export async function getIdentity(
  did: string,
): Promise<Identity | null> {
  const identity = await didResolver.resolve(did)
  if (!identity) {
    return null
  }

  const pds = getPds(identity)

  return {
    did: identity.id,
    pds: pds || 'https://bsky.social',
  }
}
