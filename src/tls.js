/**
 * Builds Node.js fetch options and sets process env flags for TLS handling.
 * When tlsVerify is false (self-signed certs), NODE_TLS_REJECT_UNAUTHORIZED is
 * temporarily set to "0" so the validate step itself can reach the endpoint.
 */
export function applyTlsSettings(tlsVerify) {
  if (!tlsVerify) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  } else {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }
}

export function buildEnvBlock(tlsVerify) {
  if (!tlsVerify) {
    return { NODE_TLS_REJECT_UNAUTHORIZED: '0' };
  }
  return {};
}
