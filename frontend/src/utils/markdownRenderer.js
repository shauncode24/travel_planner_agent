// ─────────────────────────────────────────────────
// FILE: src/utils/markdownRenderer.js
// ─────────────────────────────────────────────────

/**
 * Lightweight markdown → HTML renderer.
 * Handles: h2, h3, bold, ul/li, tables, paragraphs.
 * Used for rendering the Final Answer itinerary.
 */
export const renderMarkdown = (text) => {
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Tables: | head | \n |---|\n | rows |
    .replace(
      /\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g,
      (_, head, body) => {
        const ths = head
          .split('|')
          .filter(c => c.trim())
          .map(c => `<th>${c.trim()}</th>`)
          .join('');
        const rows = body
          .trim()
          .split('\n')
          .map(row => {
            const tds = row
              .split('|')
              .filter(c => c.trim())
              .map(c => `<td>${c.trim()}</td>`)
              .join('');
            return `<tr>${tds}</tr>`;
          })
          .join('');
        return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
      }
    )
    // Headings
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // List items
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Double newlines → paragraphs
    .replace(/\n\n(?!<)/g, '</p><p>');

  return '<p>' + html + '</p>';
};
