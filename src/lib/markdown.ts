import { marked, Renderer } from "marked";
import markedKatex from "marked-katex-extension";

export interface MarkdownResult {
  html: string;
  excerpt?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(value: string): string | null {
  const url = value.trim();
  if (/^(?:https?:|mailto:)/i.test(url) || /^(?:[/.#]|$)/.test(url)) return url;
  return null;
}

const renderer = new Renderer();

marked.use(markedKatex({ throwOnError: false }));

renderer.html = ({ text }) => escapeHtml(text);
renderer.link = function ({ href, title, tokens }) {
  const label = this.parser.parseInline(tokens);
  const url = safeUrl(href);
  if (!url) return label;
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
  if (/\.pdf(?:[?#].*)?$/i.test(url)) {
    const safeHref = escapeHtml(url);
    return `<span class="pdf-attachment"><a class="pdf-attachment-link" href="${safeHref}"${titleAttribute} target="_blank" rel="noopener">${label}</a><iframe class="pdf-preview" src="${safeHref}" title="PDF preview" loading="lazy"></iframe></span>`;
  }
  return `<a href="${escapeHtml(url)}"${titleAttribute}>${label}</a>`;
};
renderer.image = ({ href, title, text }) => {
  const url = safeUrl(href);
  if (!url) return escapeHtml(text);
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
  return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text)}"${titleAttribute}>`;
};

export async function renderMarkdown(content: string): Promise<MarkdownResult> {
  try {
    const previewContent = content.replace(
      /!\[\[assets\/([^\]|]+\.pdf)(?:\|([^\]]+))?\]\]/gi,
      (_match, filename: string, label: string | undefined) =>
        `[${label || filename.replace(/\.pdf$/i, "")}](/assets/${filename})`,
    );
    // Quartz/GFM treats single newlines as soft breaks inside a paragraph.
    const html = await marked(previewContent, { renderer, gfm: true, breaks: false });
    const excerpt = html
      .replace(/<[^>]*>/g, " ")
      .replace(/&[#\w]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 200);

    return { html, excerpt };
  } catch (error) {
    console.error("Error rendering markdown:", error);
    throw error;
  }
}
