# Splunk MCP Connector — Claude Instructions

This project connects Claude Code to the Splunk MCP Server. When the `splunk-mcp-server` MCP connection is active, you have access to the following tools.

## Available Tool Namespaces

### Core Splunk Tools (`splunk_*`)

| Tool | Purpose |
|---|---|
| `splunk_run_search` | Execute an SPL search query and return results |
| `splunk_get_indexes` | List available Splunk indexes |
| `splunk_get_saved_searches` | Retrieve saved searches and reports |
| `splunk_get_knowledge_objects` | Fetch lookups, macros, field aliases, etc. |
| `splunk_get_alerts` | List configured alerts |
| `splunk_get_fired_alerts` | List recently triggered alerts |

### Splunk AI Assistant Tools (`saia_*`)

| Tool | Purpose |
|---|---|
| `saia_generate_spl` | Generate an SPL query from a natural language description |
| `saia_explain_spl` | Explain what an SPL query does in plain English |
| `saia_optimize_spl` | Suggest optimizations for an existing SPL query |

## Important Notes

- **MCP tokens are exclusive to MCP.** The encrypted token used to connect cannot be used for direct Splunk REST API calls. Never attempt `fetch` or `curl` against the Splunk REST API using the MCP token.
- **RBAC applies.** Your token is scoped to your Splunk user's role. If a tool call fails with a permissions error, the user needs a Splunk admin to grant the `mcp_user` role or extend their access.
- **Read-only by default.** The MCP server includes safety guardrails that prevent destructive operations. Stick to search and discovery tools unless you have explicit confirmation to write data.
- **SPL time ranges.** When running searches, always include a time range (e.g., `earliest=-1h latest=now`) to avoid full-index scans.

## Example Usage

```
# Run a search
Use splunk_run_search with SPL: index=_internal sourcetype=splunkd earliest=-15m latest=now | stats count by log_level

# Generate SPL from natural language
Use saia_generate_spl: "show me failed login attempts in the last hour grouped by user"

# Explore available data
Use splunk_get_indexes to see what data is available, then splunk_get_knowledge_objects to find relevant lookups.
```
