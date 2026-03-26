# Podcast Index MCP Server

An MCP server for the [Podcast Index](https://podcastindex.org/) API. Search podcasts, track host/guest appearances across the ecosystem, monitor trending shows, and check feed health.

## Configuration

Add to your Claude Code MCP config (`.mcp.json`):

```json
{
  "mcpServers": {
    "podcastindex": {
      "command": "node",
      "args": ["/path/to/podcastindex-mcp/build/index.js"],
      "env": {
        "PODCASTINDEX_API_KEY": "your-api-key",
        "PODCASTINDEX_API_SECRET": "your-api-secret"
      }
    }
  }
}
```

Get free API credentials at [api.podcastindex.org](https://api.podcastindex.org/).

## Available Tools

### search_by_person

Search for podcast episodes where a specific person appeared as host or guest. Returns results across all indexed podcasts.

```json
{
  "q": "Conor Bronsdon",
  "max": 20,
  "fulltext": true
}
```

### search_by_term

Full-text search across all podcasts in the index.

```json
{
  "q": "developer tools AI",
  "max": 10
}
```

### podcast_by_feed_url

Look up a podcast by its RSS feed URL. Returns feed ID, iTunes ID, categories, last update time, and feed health status.

```json
{
  "url": "https://feeds.transistor.fm/chain-of-thought"
}
```

### podcast_by_feed_id

Look up a podcast by its Podcast Index feed ID.

```json
{
  "id": 123456
}
```

### trending_podcasts

Get trending podcasts with optional language and category filters.

```json
{
  "max": 20,
  "lang": "en",
  "cat": "Technology"
}
```

### episodes_by_feed_id

Get episodes for a specific podcast. Use `podcast_by_feed_url` first to get the feed ID.

```json
{
  "id": 123456,
  "max": 10
}
```

### recent_episodes

Get the most recent episodes across the entire index.

```json
{
  "max": 10,
  "excludeString": "Rerun"
}
```

### categories_list

Get the full list of Podcast Index categories and their IDs.

```json
{}
```

## Building

```bash
npm install
npm run build
```

## License

MIT
