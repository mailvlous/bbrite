import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface MarkdownResult {
  html: string;
  excerpt?: string;
}

export async function renderMarkdown(content: string): Promise<MarkdownResult> {
  try {
    const html = await marked(content);
    const sanitized = DOMPurify.sanitize(html);
    
    // Extract excerpt (first 200 chars of plain text)
    const tempDiv = { innerHTML: sanitized };
    const plainText = (tempDiv.innerHTML || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&[#\w]+;/g, ' ')
      .trim();
    const excerpt = plainText.substring(0, 200);
    
    return { html: sanitized, excerpt };
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return { html: '', excerpt: '' };
  }
}
