# MCP Toolkit Server

[![Tests](https://github.com/jstilb/mcp-toolkit-server/actions/workflows/test.yml/badge.svg)](https://github.com/jstilb/mcp-toolkit-server/actions/workflows/test.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

MCP (Model Context Protocol) server implementing tools, resources, and prompts with dependency-injected providers and mock mode for demos.

## Overview

A production-quality implementation of an MCP server using the `@modelcontextprotocol/sdk`. Demonstrates all three MCP primitives:

- **Tools**: Text analysis (summarize, sentiment, entities), web search, weather
- **Resources**: Server config, tool catalog, health status
- **Prompts**: Research topic, text analysis, weather briefing templates

Everything runs in mock mode by default -- no API keys needed.

## Features

| Feature | Description |
|---------|-------------|
| 5 MCP tools | Summarize, sentiment, entities, search, weather |
| 3 resources | Config, tools catalog, health check |
| 3 prompt templates | Research, analysis, weather briefing |
| Mock mode | Deterministic responses, no API keys |
| Provider DI | Swap mock/production at runtime |
| Zod validation | Type-safe input schemas |
| Result type | Explicit error handling |

## Installation

```bash
git clone https://github.com/jstilb/mcp-toolkit-server.git
cd mcp-toolkit-server
bun install
```

## Quick Start

### Demo Mode

```bash
make demo
# or
bun run demo
```

### Use with Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "toolkit": {
      "command": "node",
      "args": ["/path/to/mcp-toolkit-server/dist/index.js"],
      "env": { "MCP_MODE": "mock" }
    }
  }
}
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
| `OPENAI_API_KEY` | - | OpenAI key (production mode) |
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
