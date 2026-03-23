// ─────────────────────────────────────────────────
// FILE: src/utils/markdownRenderer.js
// ─────────────────────────────────────────────────

/**
 * Markdown → HTML renderer for Yatra AI itineraries.
 * Handles: h2, h3, bold, italic, links, tables,
 *          blockquotes, horizontal rules, ul/li, paragraphs.
 */
export const renderMarkdown = (text) => {
  // ── Helpers ──────────────────────────────────────────────────────────────

  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;');

  /**
   * Process inline elements on an already-escaped string:
   * links, bold, italic.
   * NOTE: we must NOT escape again — caller escapes first.
   */
  const inline = (s) =>
    s
      // [text](url) — open in new tab, styled as accent link
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>'
      )
      // **bold**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // *italic*
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // ── Line-by-line processing ───────────────────────────────────────────────

  const lines = text.split('\n');
  const out   = [];
  let i       = 0;

  while (i < lines.length) {
    const raw      = lines[i];
    const stripped = raw.trim();

    // ── Table (header + separator on next line) ──────────────────────────
    if (stripped.startsWith('|') && i + 1 < lines.length) {
      const nextStripped = lines[i + 1]?.trim() ?? '';
      if (/^\|?[-| :]+\|?$/.test(nextStripped)) {
        const headerCells = stripped
          .split('|')
          .filter(c => c.trim())
          .map(c => `<th>${inline(escapeHtml(c.trim()))}</th>`)
          .join('');

        const bodyRows = [];
        let j = i + 2;
        while (j < lines.length && lines[j].trim().startsWith('|')) {
          const cells = lines[j].trim()
            .split('|')
            .filter(c => c.trim())
            .map(c => `<td>${inline(escapeHtml(c.trim()))}</td>`)
            .join('');
          bodyRows.push(`<tr>${cells}</tr>`);
          j++;
        }

        out.push(
          `<table><thead><tr>${headerCells}</tr></thead>` +
          `<tbody>${bodyRows.join('')}</tbody></table>`
        );
        i = j;
        continue;
      }
    }

    // ── Horizontal rule ──────────────────────────────────────────────────
    if (/^---+$/.test(stripped) || /^\*\*\*+$/.test(stripped)) {
      out.push('<hr class="md-hr" />');
      i++;
      continue;
    }

    // ── Blockquote ───────────────────────────────────────────────────────
    if (stripped.startsWith('> ')) {
      const content = inline(escapeHtml(stripped.slice(2)));
      out.push(`<blockquote class="md-blockquote">${content}</blockquote>`);
      i++;
      continue;
    }

    // ── H2 ───────────────────────────────────────────────────────────────
    if (stripped.startsWith('## ')) {
      const content = inline(escapeHtml(stripped.slice(3)));
      out.push(`<h2>${content}</h2>`);
      i++;
      continue;
    }

    // ── H3 ───────────────────────────────────────────────────────────────
    if (stripped.startsWith('### ')) {
      const content = inline(escapeHtml(stripped.slice(4)));
      out.push(`<h3>${content}</h3>`);
      i++;
      continue;
    }

    // ── H4 (bold day headers like **Day 1 — Theme**) ─────────────────────
    if (stripped.startsWith('#### ')) {
      const content = inline(escapeHtml(stripped.slice(5)));
      out.push(`<h4>${content}</h4>`);
      i++;
      continue;
    }

    // ── List item ────────────────────────────────────────────────────────
    if (/^[-•*] /.test(stripped)) {
      // Collect consecutive list items
      const items = [];
      while (i < lines.length && /^[-•*] /.test(lines[i].trim())) {
        const itemText = inline(escapeHtml(lines[i].trim().replace(/^[-•*] /, '')));
        items.push(`<li>${itemText}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // ── Numbered list ────────────────────────────────────────────────────
    if (/^\d+\. /.test(stripped)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        const itemText = inline(escapeHtml(lines[i].trim().replace(/^\d+\. /, '')));
        items.push(`<li>${itemText}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // ── Empty line → spacer ───────────────────────────────────────────────
    if (!stripped) {
      out.push('<div class="md-spacer"></div>');
      i++;
      continue;
    }

    // ── Regular paragraph ─────────────────────────────────────────────────
    out.push(`<p>${inline(escapeHtml(stripped))}</p>`);
    i++;
  }

  return out.join('\n');
};