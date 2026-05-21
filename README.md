# Splunk MCP Connector for Claude

A CLI setup wizard that configures [Claude Code](https://code.claude.com) to connect to the [Splunk MCP Server](https://splunkbase.splunk.com/app/7931), giving Claude direct access to Splunk search, indexes, saved searches, and AI-generated SPL.

## Prerequisites

- **Node.js ≥ 18** and **npm** (or `npx`) installed
- **Splunk MCP Server app** installed in your Splunk deployment (Splunkbase app 7931)
- An **encrypted MCP token** generated from the Splunk MCP Server app
- The **MCP server endpoint URL** from the Splunk MCP Server app

## Project scope vs. Global scope

The connector can be cloned **anywhere** on your machine — the clone location does not affect how it works. What matters is the **scope** you choose during setup, which controls where the generated config is written and which Claude Code sessions get Splunk access.

| Scope | Config file written | Splunk tools available |
|---|---|---|
| **Project** | `.claude/mcp.json` inside your **current working directory** | Only when Claude Code is opened in that directory |
| **Global** | `~/.claude/mcp.json` | In **every** Claude Code session on your machine |

**Which should you choose?**
- Use **global** if you query Splunk regularly and want it available across all your repos.
- Use **project** to scope the connection to one specific repo (e.g., a Splunk app under development).

**For project scope:** `cd` into your target project directory _before_ running the setup wizard — the wizard writes the config relative to your current directory.

**For global scope:** run the wizard from any directory; the config is written to `~/.claude/mcp.json`.

## Getting Started

### Step 1 — Generate a Splunk MCP Token

1. Open the **Splunk MCP Server** app in your Splunk deployment
2. Navigate to **Token Management** and generate a new encrypted token
3. Copy the token immediately (it is only displayed once)

> Required capabilities: `edit_tokens_own` + `mcp_tool_admin` (for your own token) or `edit_tokens_all` + `mcp_tool_admin` (for any user).

### Step 2 — Run the Setup Wizard

```bash
# Clone the repo (anywhere on your machine is fine)
git clone https://github.com/ozgasl/splunk-mcp-connector-for-claude.git
cd splunk-mcp-connector-for-claude

# Install dependencies
npm install

# Optional: install globally so `splunk-mcp` is available as a system command
npm install -g .

# Run the setup wizard
splunk-mcp setup
# or without global install:
node bin/splunk-mcp.js setup
```

> **Project scope tip:** if you want the config written into a specific project, `cd` into that project directory first, then run the wizard from there.

The wizard will:
1. Ask for your MCP endpoint URL
2. Ask for your encrypted token (input is masked)
3. Ask whether to skip TLS verification (choose **No** for Splunk Cloud, **Yes** for on-prem with self-signed certs)
4. Validate the connection live before writing any files
5. Write the configuration to `.claude/mcp.json` (project) or `~/.claude/mcp.json` (global)

### Step 3 — Reload Claude Code

Restart Claude Code or run `/mcp` in a Claude Code session to load the new server. Your Splunk tools (`splunk_*` and `saia_*`) will appear automatically.

---

## CLI Reference

### `setup` — Interactive configuration wizard

```bash
node bin/splunk-mcp.js setup
```

### `validate` — Test connection without writing files

```bash
node bin/splunk-mcp.js validate \
  --endpoint https://splunk.example.com:8089/services/mcp \
  --token YOUR_TOKEN

# For self-signed certs:
node bin/splunk-mcp.js validate \
  --endpoint https://splunk.example.com:8089/services/mcp \
  --token YOUR_TOKEN \
  --no-tls-verify
```

### `show-config` — Print the JSON block without writing files

```bash
node bin/splunk-mcp.js show-config \
  --endpoint https://splunk.example.com:8089/services/mcp \
  --token YOUR_TOKEN
```

Pipe the output directly into your config file if you prefer manual setup:

```bash
node bin/splunk-mcp.js show-config \
  --endpoint https://splunk.example.com:8089/services/mcp \
  --token YOUR_TOKEN \
  > .claude/mcp.json
```

---

## Manual Configuration

If you prefer to configure Claude Code manually, add the following to `.claude/mcp.json` in your project (or `~/.claude/mcp.json` globally):

**Splunk Cloud (valid TLS cert):**
```json
{
  "mcpServers": {
    "splunk-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://YOUR_SPLUNK_HOST:8089/services/mcp",
        "--header",
        "Authorization: Bearer YOUR_ENCRYPTED_TOKEN"
      ]
    }
  }
}
```

**On-premises with self-signed certificate:**
```json
{
  "mcpServers": {
    "splunk-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://YOUR_SPLUNK_HOST:8089/services/mcp",
        "--header",
        "Authorization: Bearer YOUR_ENCRYPTED_TOKEN"
      ],
      "env": {
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

See the `examples/` directory for ready-to-copy config files.

---

## Available Splunk Tools

Once connected, Claude Code can use:

| Tool prefix | Description |
|---|---|
| `splunk_*` | Core platform tools: search, indexes, saved searches, knowledge objects, alerts |
| `saia_*` | AI Assistant tools: generate, explain, and optimize SPL queries |

See [CLAUDE.md](./CLAUDE.md) for detailed tool documentation.

---

## Troubleshooting

### `Authentication failed (HTTP 401/403)`
- Ensure you copied the token from the **Splunk MCP Server app** — tokens from Splunk's Settings > Tokens page are not valid here.
- Tokens are encrypted and MCP-only; they cannot be used with the Splunk REST API directly.

### `TLS certificate verification failed`
- Re-run setup and answer **No** to the TLS verification prompt.
- Alternatively, pass `--no-tls-verify` to the `validate` or `show-config` commands.

### `Connection timed out`
- Verify the endpoint URL is correct (default port is `8089`).
- Ensure the Splunk MCP Server app is running and the management port is reachable from your machine.

### Tools not appearing in Claude Code
- Run `/mcp` in Claude Code to check the server status.
- Verify your Splunk user has the `mcp_user` role.
- Check that the Splunk admin has not disabled specific tools in the MCP Server app.

---

## Security Notes

- **Never commit your token.** The `.gitignore` excludes `.env` and `.claude/mcp.json` from git by default.
- Encrypted MCP tokens cannot be reused outside of MCP — they cannot authenticate against the Splunk REST API.
- Each user should generate and manage their own token.

---

## License

Apache 2.0
