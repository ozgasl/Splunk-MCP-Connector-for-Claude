import { applyTlsSettings } from './tls.js';

const MCP_INITIALIZE_BODY = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'splunk-mcp-connector', version: '1.0.0' },
  },
});

/**
 * Sends an MCP initialize request to the Splunk endpoint.
 * Returns { ok: true } on success or { ok: false, error: string } on failure.
 */
export async function validateConnection({ endpoint, token, tlsVerify = true }) {
  applyTlsSettings(tlsVerify);

  const url = endpoint.replace(/\/$/, '');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      body: MCP_INITIALIZE_BODY,
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: `Authentication failed (HTTP ${res.status}). Check your encrypted token.` };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `Server returned HTTP ${res.status}. ${body.slice(0, 200)}` };
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('json') && !contentType.includes('event-stream')) {
      return { ok: false, error: `Unexpected content-type: ${contentType}. Is this a Splunk MCP endpoint?` };
    }

    return { ok: true };
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return { ok: false, error: 'Connection timed out after 10 seconds.' };
    }
    if (err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || err.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
      return {
        ok: false,
        error: 'TLS certificate verification failed. Re-run setup and choose to skip TLS verification for self-signed certs.',
      };
    }
    return { ok: false, error: err.message };
  }
}
