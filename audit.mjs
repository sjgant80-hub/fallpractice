// audit.mjs — fallpractice's audit layout, and the chain built from it.
//
// ⚑ THE BYTES MUST NOT CHANGE. There are logs in the wild signed by the old inline writer. If this
// layout differs by one character, every entry a firm has already written stops reproducing and the
// verifier reports its whole history as tampered. Making a real audit trail look forged is a worse
// outcome than not checking it at all, so this is a faithful copy and audit.test.mjs pins it against
// the original formula.
//
// The chain semantics live in the shared, separately-gated audit-chain kernel. Only the byte layout
// is this repo's business.
import { auditChain } from './audit-chain.mjs';

export async function payloadOf(prevHash, entry, index, sha256) {
  const e = (entry && typeof entry === 'object') ? entry : {};
  // The original hashed the payload FIRST and signed that digest, so this layout has to await one.
  // The docHash on the entry is not trusted: it is recomputed, or a forger could pick their own.
  const docHash = await sha256(JSON.stringify(e.payload ?? {}));
  return String(prevHash == null ? '' : prevHash) + docHash + String(e.ts ?? '') + String(e.i ?? '');
}

/** The writer and the checker, from one call, over one layout — so they cannot drift apart. */
export function makeAuditChain(sha256) {
  return auditChain({
    sha256,
    payloadOf: (prev, entry, i) => payloadOf(prev, entry, i, sha256),
    hashField: "hash",
  });
}

export default { payloadOf, makeAuditChain };
