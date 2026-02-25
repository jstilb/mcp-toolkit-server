# MCP Toolkit Server

[![npm](https://img.shields.io/npm/v/@jstilb/mcp-toolkit-server.svg)](https://www.npmjs.com/package/@jstilb/mcp-toolkit-server)
[![Tests](https://github.com/jstilb/mcp-toolkit-server/actions/workflows/test.yml/badge.svg)](https://github.com/jstilb/mcp-toolkit-server/actions/workflows/test.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

MCP (Model Context Protocol) server implementing tools, resources, and prompts with dependency-injected providers and mock mode for demos.

## Overview

A top-tier implementation of an MCP server using the `@modelcontextprotocol/sdk`. Demonstrates all 2025 MCP spec features:

- **Tools**: Text analysis (summarize, sentiment, entities), Brave web search, weather, smart_summarize (sampling), configure_analysis (elicitation)
- **Sampling**: `smart_summarize` sends `sampling/createMessage` to the connected client (bidirectional MCP)
- **Elicitation**: `configure_analysis` uses `elicitation/create` for structured user follow-up questions
- **Tool annotations**: All tools include `readOnlyHint`, `idempotentHint`, `destructiveHint`, `openWorldHint` per 2025 MCP spec
- **outputSchema**: Text analysis tools declare structured output schemas
- **Resources**: Server config, tool catalog, health status
- **Prompts**: Research topic, text analysis, weather briefing templates
- **Production providers**: Real Brave Search API and OpenWeatherMap when `MCP_MODE=production`

Everything runs in mock mode by default — no API keys needed.

## Features

| Feature | Description |
|---------|-------------|
| 7 MCP tools | Summarize, sentiment, entities, brave search, weather, smart_summarize, configure_analysis |
| MCP sampling | `smart_summarize` sends sampling/createMessage to client |
| MCP elicitation | `configure_analysis` uses elicitation/create with JSON schema |
| Tool annotations | 2025 spec readOnlyHint, idempotentHint, destructiveHint, openWorldHint |
| outputSchema | Structured output schemas for text analysis tools |
| 3 resources | Config, tools catalog, health check |
| 3 prompt templates | Research, analysis, weather briefing |
| Mock mode | Deterministic responses, no API keys |
| Production mode | Real Brave Search API + OpenWeatherMap |
| Provider DI | Swap mock/production at runtime via `MCP_MODE` |
| Zod validation | Type-safe input schemas |
| Result type | Explicit error handling |

## Installation

```bash
npm install -g @jstilb/mcp-toolkit-server
```

Or run directly without installing:

```bash
npx @jstilb/mcp-toolkit-server
```

Or clone for development:

```bash
git clone https://github.com/jstilb/mcp-toolkit-server.git
cd mcp-toolkit-server
npm install
```

## Quick Start

### Demo Mode

```bash
make demo
# or
npm run demo
```

## Claude Desktop Integration

Add to your Claude Desktop config (`claude_desktop_config.json`):

**Mock mode (no API keys needed):**

```json
{
  "mcpServers": {
    "mcp-toolkit": {
      "command": "npx",
      "args": ["@jstilb/mcp-toolkit-server"],
      "env": {
        "MCP_MODE": "mock"
      }
    }
  }
}
```

**Production mode (with real APIs):**

```json
{
  "mcpServers": {
    "mcp-toolkit": {
      "command": "npx",
      "args": ["@jstilb/mcp-toolkit-server"],
      "env": {
        "MCP_MODE": "production",
        "BRAVE_API_KEY": "your-brave-api-key",
        "OPENWEATHERMAP_API_KEY": "your-openweathermap-api-key"
      }
    }
  }
}
```

Claude Desktop config file locations:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

## Claude Code Integration

Use with Claude Code (claude.ai/code):

```bash
# Add to your project's MCP config
claude mcp add @jstilb/mcp-toolkit-server

# Or run directly in a project session
claude --mcp-server "npx @jstilb/mcp-toolkit-server"
```

You can also add it to your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "mcp-toolkit": {
      "command": "npx",
      "args": ["@jstilb/mcp-toolkit-server"],
      "env": {
        "MCP_MODE": "mock"
      }
    }
  }
}
```

### Using MCP Features in Claude Code

Once connected, Claude Code can use all server tools:

```
# Summarize text with client-side LLM (sampling)
> Use smart_summarize to summarize: "Your long text here..."

# Configure analysis with follow-up questions (elicitation)
> Use configure_analysis on this text

# Search the web (mock mode returns structured mock results)
> Use brave_web_search to find "MCP protocol examples"

# Get weather
> Use get_weather for "San Francisco"
```

### Development

```bash
bun run dev      # Watch mode
bun run build    # Compile TypeScript
bun run test     # Run tests with coverage
```

## Architecture

```
src/
  server.ts        # MCP server setup (tools, resources, prompts)
  config.ts        # Environment-based configuration
  result.ts        # Result<T, E> type for error handling
  tools/
    text-analysis.ts  # Summarize, sentiment, entity extraction
    web-search.ts     # Web search tool
    weather.ts        # Weather tool
  resources/
    index.ts       # MCP resources (config, tools, health)
  prompts/
    index.ts       # MCP prompt templates
  providers/
    provider.ts    # Provider interfaces
    mock.ts        # Mock implementations
    index.ts       # Provider factory
```

See [docs/architecture.md](docs/architecture.md) for detailed diagrams.

## API Reference

### Tools

| Tool | Description | Input |
|------|-------------|-------|
| `summarize` | Summarize text | `{text, maxLength?}` |
| `analyze_sentiment` | Sentiment analysis | `{text}` |
| `extract_entities` | Named entity extraction | `{text, types?}` |
| `web_search` | Web search | `{query, maxResults?}` |
| `get_weather` | Current weather | `{location, unit?}` |

### Resources

| URI | Description |
|-----|-------------|
| `toolkit://config` | Server configuration |
| `toolkit://tools` | Available tools catalog |
| `toolkit://health` | Health and status |

### Prompts

| Name | Description | Arguments |
|------|-------------|-----------|
| `research_topic` | Research workflow | `topic`, `depth?` |
| `analyze_text` | Text analysis workflow | `text` |
| `weather_briefing` | Weather report | `location` |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_MODE` | `mock` | `mock`, `production`, or `hybrid` |
| `BRAVE_API_KEY` | - | Brave Search API key (production mode) |
| `OPENWEATHERMAP_API_KEY` | - | OpenWeatherMap API key (production mode) |
| `MCP_MAX_CONCURRENT` | `5` | Max concurrent tool calls |
| `MCP_TOOL_TIMEOUT_MS` | `30000` | Tool call timeout |

## Testing

```bash
make test              # All tests with coverage
make test-unit         # Unit tests only
make lint              # ESLint + Prettier
make type-check        # TypeScript strict check
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests first (TDD)
4. Implement your feature
5. Run `make check`
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.


## Related Projects

- [ai-assistant](https://github.com/jstilb/ai-assistant) — Autonomous AI assistant powered by Claude Code
- [context-engineering-toolkit](https://github.com/jstilb/context-engineering-toolkit) — Context window optimization tools
- [agent-orchestrator](https://github.com/jstilb/agent-orchestrator) — Multi-agent orchestration with LangGraph
