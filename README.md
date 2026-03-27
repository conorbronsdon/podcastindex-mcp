<div align="center">

# Podcast Index MCP Server

Connect Claude to the Podcast Index API. Search podcasts, track appearances, monitor trends.

[![GitHub stars](https://img.shields.io/github/stars/conorbronsdon/podcastindex-mcp?style=social)](https://github.com/conorbronsdon/podcastindex-mcp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![npm version](https://img.shields.io/npm/v/podcastindex-mcp?style=flat-square)](https://www.npmjs.com/package/podcastindex-mcp)
[![Podcast](https://img.shields.io/badge/Podcast-Chain_of_Thought-purple?style=flat-square)](https://chainofthought.show)
[![X](https://img.shields.io/badge/X-@ConorBronsdon-black?style=flat-square&logo=x)](https://x.com/ConorBronsdon)

</div>

---


## Prerequisites

- Node.js 18+
- Free Podcast Index API credentials -- get them at [api.podcastindex.org](https://api.podcastindex.org/)

## Installation

```bash
git clone https://github.com/conorbronsdon/podcastindex-mcp.git
cd podcastindex-mcp
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

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

### Claude Code

Add to your project's `.mcp.json`:

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

## Tools

| Tool | Description |
|------|-------------|
| `search_by_person` | Search for episodes where a person appeared as host or guest. Returns matches across all indexed podcasts. |
| `search_by_term` | Full-text search across all podcasts by topic, show name, or keyword. |
| `podcast_by_feed_url` | Look up a podcast by RSS feed URL. Returns feed ID, iTunes ID, categories, last update, and feed health. |
| `podcast_by_feed_id` | Look up a podcast by its Podcast Index feed ID. Returns full metadata. |
| `trending_podcasts` | Get currently trending podcasts, with optional language and category filters. |
| `episodes_by_feed_id` | Get episodes for a specific podcast by feed ID. |
| `recent_episodes` | Get the most recently published episodes across the entire index. |
| `categories_list` | Get the full list of Podcast Index categories and their IDs. |

## Example Prompts

Once configured, you can ask Claude things like:

- "Search Podcast Index for all episodes featuring Satya Nadella as a guest"
- "What are the trending technology podcasts right now?"
- "Look up the feed health for https://feeds.transistor.fm/chain-of-thought and list the last 5 episodes"

## Development

Build the project:

```bash
npm run build
```

Watch for changes during development:

```bash
npm run watch
```

### Adding a new tool

1. Add the API method to `src/api-client.ts`
2. Add type guard and argument types to `src/types.ts`
3. Add the tool definition and handler to `src/tool-handlers.ts`
4. Rebuild with `npm run build`

## License

MIT
