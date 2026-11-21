# MCP Server Config

This file configures a local Tavily MCP server for use with MCP-compatible coding agents.

## Usage

Point your MCP client at `mcp.json` in this directory, or copy its contents into your global MCP config file.

### Claude Desktop
Append the `mcpServers` block to `%APPDATA%\claude\claude_desktop_config.json` (Windows) or `~/.config/claude/claude_desktop_config.json` (macOS/Linux), then restart Claude Desktop.

### Other MCP clients
- **Cursor**: `cursor` -> settings -> `MCP Servers` -> add custom server pointing to this file
- **Windsurf**: settings -> `MCP Config` -> import `mcp.json`
- **Continue**: `config.yaml` -> paste server definition

## Available Tools
Once connected, you get `tavily_*` tools:
- `tavily_search` — web search
- `tavily_extract` — extract content from a URL
- `tavily_crawl` — deep crawl a domain
- `tavily_map` — map URLs on a domain
- `tavily_discovery` — discover top sites for a query

## Test the API directly (Node)
```bash
node -e "fetch('https://api.tavily.com/search',{method:'POST',headers:{'Authorization':'Bearer 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','Content-Type':'application/json'},body:JSON.stringify({query:'latest AI news',search_depth:'basic'})}).then(r=>r.json()).then(d=>console.log(d.results))"
```

## Install CLI (optional, terminal access)
```bash
curl -fsSL https://cli.tavily.com/install.sh | bash
tvly login --api-key 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
```
