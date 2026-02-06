# Architecture

## MCP Server Overview

```
+---------------------------+
|     MCP Client (Claude)   |
+---------------------------+
        | stdio/SSE
+---------------------------+
|      MCP Server           |
|  (server.ts)              |
+--+--------+--------+-----+
   |        |        |
+--+--+ +---+---+ +--+--+
|Tools| |Resources| |Prompts|
+--+--+ +---+---+ +--+--+
   |        |        |
+--+--------+--------+-----+
|     Provider Layer        |
| (DI: Mock / Production)  |
+--+--------+--------+-----+
   |        |        |
  Text    Search   Weather
Provider Provider Provider
```

## Component Details

### Server (server.ts)
- Creates MCP Server instance
- Registers all handlers for tools, resources, prompts
- Routes incoming requests to appropriate handlers
- Validates input using Zod schemas

### Tools Layer
Three tool categories with typed input/output:

1. **Text Analysis** (text-analysis.ts)
   - Summarization via LLM provider
   - Sentiment analysis (heuristic-based, no API needed)
   - Entity extraction (pattern-based, no API needed)

2. **Web Search** (web-search.ts)
   - Delegates to search provider
   - Returns ranked results with scores

3. **Weather** (weather.ts)
   - Delegates to weather provider
   - Returns structured weather data

### Provider Layer (Dependency Injection)
All external services are abstracted behind interfaces:

```typescript
interface TextProvider {
  complete(prompt: string, options?: CompletionOptions): Promise<Result<string>>;
}

interface WebSearchProvider {
  search(query: string, maxResults?: number): Promise<Result<SearchResult[]>>;
}

interface WeatherProvider {
  getWeather(location: string): Promise<Result<WeatherData>>;
}
```

**Mock providers** return deterministic data for testing and demos.
**Production providers** would call real APIs (OpenAI, search engines, weather APIs).

### Error Handling
Uses Result type pattern throughout:

```typescript
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Forces explicit error handling at every call site.

## Data Flow

### Tool Call
```
Client Request
  -> Server validates input (Zod)
  -> Routes to tool handler
  -> Tool delegates to provider
  -> Provider returns Result<T>
  -> Server formats response
  -> Client receives result
```

### Resource Read
```
Client Request (uri)
  -> Server matches URI
  -> Reads current state
  -> Returns JSON content
```

### Prompt Get
```
Client Request (name, args)
  -> Server matches prompt
  -> Generates parameterized messages
  -> Client uses messages for interaction
```
