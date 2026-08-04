# mcp-ban-fr

Base Adresse Nationale (BAN) MCP — France's official keyless geocoding API

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `geocode` | Forward-geocode a French address, street, locality or commune. Returns scored GeoJSON matches (score 0-1) with label, coordinates, postcode, citycode (INSEE) and context. France only. |
| `reverse_geocode` | Reverse-geocode a coordinate to the nearest French address/feature. Returns scored GeoJSON matches with label, postcode, citycode (INSEE), context and distance (metres). France only. |
| `search_municipality` | Look up a French commune (municipality) by name to resolve its INSEE citycode, postcode, population and centre coordinates. Shortcut for geocode with type=municipality. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "ban-fr": {
      "url": "https://gateway.pipeworx.io/ban-fr/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Ban Fr data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
