import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Returns the path to the mcp.json config file.
 * scope: 'project' => .claude/mcp.json in cwd
 * scope: 'global'  => ~/.claude/mcp.json
 */
export function getConfigPath(scope) {
  if (scope === 'global') {
    return path.join(os.homedir(), '.claude', 'mcp.json');
  }
  return path.join(process.cwd(), '.claude', 'mcp.json');
}

/**
 * Reads existing mcp.json or returns an empty config object.
 */
export function readConfig(configPath) {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { mcpServers: {} };
  }
}

/**
 * Builds the mcpServers block for the Splunk connector.
 */
export function buildServerBlock({ endpoint, token, tlsVerify }) {
  const args = ['-y', 'mcp-remote', endpoint.replace(/\/$/, ''), '--header', `Authorization: Bearer ${token}`];

  const block = { command: 'npx', args };

  if (!tlsVerify) {
    block.env = { NODE_TLS_REJECT_UNAUTHORIZED: '0' };
  }

  return block;
}

/**
 * Writes the updated config back to disk, creating parent dirs as needed.
 */
export function writeConfig(configPath, config) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

/**
 * Merges the Splunk server block into the existing config and writes it.
 * Returns the config path that was written.
 */
export function saveServerConfig({ endpoint, token, tlsVerify, scope, serverName = 'splunk-mcp-server' }) {
  const configPath = getConfigPath(scope);
  const config = readConfig(configPath);

  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers[serverName] = buildServerBlock({ endpoint, token, tlsVerify });

  writeConfig(configPath, config);
  return configPath;
}
