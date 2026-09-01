import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

export interface MarkdownResult {
  html: string;
  excerpt?: string;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeHighlight)
  .use(rehypeKatex)
  .use(rehypeSanitize, {
    // Allow more tags for editing
    tagNames: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "p",
      "a",
      "ul",
      "ol",
      "nl",
      "li",
      "b",
      "i",
      "strong",
      "em",
      "u",
      "s",
      "sup",
      "sub",
      "br",
      "img",
      "pre",
      "code",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "span",
      "div",
      "hr",
      "del",
      "ins",
      "mark",
      "small",
      "cite",
      "abbr",
      "dfn",
      "kbd",
      "samp",
      "var",
    ],
    attributes: {
      "*": ["className"],
      a: ["href", "title"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["className"],
      span: ["className"],
      div: ["className"],
    },
  })
  .use(rehypeStringify);

export async function renderMarkdown(
  content: string
): Promise<MarkdownResult> {
  try {
    const vfile = await processor.process(content);
    const html = String(vfile);

    // Generate excerpt from first paragraph
    const excerptMatch = html.match(/<p>(.*?)<\/p>/);
    const excerpt = excerptMatch
      ? excerptMatch[1].replace(/<[^>]*>/g, "").substring(0, 200)
      : "";

    return { html, excerpt };
  } catch (error) {
    console.error("Error rendering markdown:", error);
    return { html: `<p>${escapeHtml(content)}</p>`, excerpt: content.substring(0, 200) };
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
