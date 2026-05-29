interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Base Adresse Nationale (BAN) MCP — France's official keyless geocoding API
 * (api-adresse.data.gouv.fr). Covers French addresses, streets, localities and
 * communes only. Responses are GeoJSON FeatureCollections; each feature's
 * `score` is 0-1 (higher = better match). Keyless, no auth.
 */


const BASE = 'https://api-adresse.data.gouv.fr';
const UA = 'pipeworx-mcp-ban-fr/1.0 (+https://pipeworx.io)';

const TYPES = ['housenumber', 'street', 'locality', 'municipality'] as const;

const tools: McpToolExport['tools'] = [
  {
    name: 'geocode',
    description:
      'Forward-geocode a French address, street, locality or commune. Returns scored GeoJSON matches (score 0-1) with label, coordinates, postcode, citycode (INSEE) and context. France only.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Free-text query, e.g. "8 bd du port" or "rue de la paix paris".' },
        limit: { type: 'number', description: 'Max results (default 5, server caps at 20).' },
        type: { type: 'string', enum: [...TYPES], description: 'Restrict to a feature type.' },
        postcode: { type: 'string', description: 'Filter by 5-digit postal code, e.g. "95000".' },
        citycode: { type: 'string', description: 'Filter by INSEE commune code, e.g. "95127".' },
        autocomplete: { type: 'boolean', description: 'Treat q as a partial/autocomplete prefix (default false).' },
        lat: { type: 'number', description: 'Latitude to bias/prioritise results geographically (pair with lon).' },
        lon: { type: 'number', description: 'Longitude to bias/prioritise results geographically (pair with lat).' },
      },
      required: ['q'],
    },
  },
  {
    name: 'reverse_geocode',
    description:
      'Reverse-geocode a coordinate to the nearest French address/feature. Returns scored GeoJSON matches with label, postcode, citycode (INSEE), context and distance (metres). France only.',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude (WGS84).' },
        lon: { type: 'number', description: 'Longitude (WGS84).' },
        type: { type: 'string', enum: [...TYPES], description: 'Restrict to a feature type.' },
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'search_municipality',
    description:
      'Look up a French commune (municipality) by name to resolve its INSEE citycode, postcode, population and centre coordinates. Shortcut for geocode with type=municipality.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Commune name, e.g. "montpellier".' },
        limit: { type: 'number', description: 'Max results (default 5).' },
      },
      required: ['q'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'geocode': {
      const params = new URLSearchParams({ q: reqStr(args, 'q', '"8 bd du port"') });
      setNum(params, 'limit', args.limit);
      setStr(params, 'type', args.type);
      setStr(params, 'postcode', args.postcode);
      setStr(params, 'citycode', args.citycode);
      if (args.autocomplete !== undefined) params.set('autocomplete', args.autocomplete ? '1' : '0');
      setNum(params, 'lat', args.lat);
      setNum(params, 'lon', args.lon);
      return banGet(`/search/?${params}`);
    }
    case 'reverse_geocode': {
      const params = new URLSearchParams({
        lat: String(reqNum(args, 'lat')),
        lon: String(reqNum(args, 'lon')),
      });
      setStr(params, 'type', args.type);
      return banGet(`/reverse/?${params}`);
    }
    case 'search_municipality': {
      const params = new URLSearchParams({ q: reqStr(args, 'q', '"montpellier"'), type: 'municipality' });
      setNum(params, 'limit', args.limit);
      return banGet(`/search/?${params}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function banGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`BAN: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

function reqNum(args: Record<string, unknown>, key: string): number {
  const v = typeof args[key] === 'string' ? Number(args[key]) : args[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`Required argument "${key}" must be a number.`);
  return v;
}

function setStr(params: URLSearchParams, key: string, v: unknown): void {
  if (typeof v === 'string' && v.trim()) params.set(key, v);
}

function setNum(params: URLSearchParams, key: string, v: unknown): void {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n === 'number' && Number.isFinite(n)) params.set(key, String(n));
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
