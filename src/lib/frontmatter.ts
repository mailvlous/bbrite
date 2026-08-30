type Metadata = Record<string, unknown>;

export function parseMarkdown(source: string): { metadata: Metadata; body: string } {
  if (!source.startsWith('---')) return { metadata: {}, body: source };
  const end = source.indexOf('\n---', 3);
  if (end < 0) return { metadata: {}, body: source };
  const raw = source.slice(4, end).split('\n');
  const metadata: Metadata = {};
  let active: string | undefined;
  for (const line of raw) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    const item = line.match(/^\s+-\s+(.*)$/);
    if (match) { active = match[1]; metadata[active] = match[2] || ''; }
    else if (item && active) metadata[active] = [...(Array.isArray(metadata[active]) ? metadata[active] as unknown[] : []), item[1]];
  }
  return { metadata, body: source.slice(end + 4).replace(/^\n/, '') };
}

function yamlValue(value: unknown): string {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function serializeMarkdown(metadata: Metadata, body: string): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) { lines.push(`${key}:`, ...value.map(item => `  - ${yamlValue(item)}`)); }
    else if (typeof value === 'boolean' || typeof value === 'number') lines.push(`${key}: ${value}`);
    else lines.push(`${key}: ${String(value).includes(':') ? `"${yamlValue(value)}"` : value}`);
  }
  return `${lines.join('\n')}\n---\n\n${body.trim()}\n`;
}
