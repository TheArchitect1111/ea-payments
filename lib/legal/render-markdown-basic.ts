/**
 * Minimal Markdown → HTML for long-form legal docs (no new dependency).
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g,
    '<a href="$2">$1</a>',
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return out;
}

export function renderLegalMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;
  let inUl = false;
  let inOl = false;
  let inTable = false;

  const closeLists = () => {
    if (inUl) {
      html.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      html.push('</ol>');
      inOl = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      html.push('</tbody></table>');
      inTable = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      closeLists();
      closeTable();
      i += 1;
      continue;
    }

    if (line.startsWith('# ')) {
      closeLists();
      closeTable();
      html.push(`<h1>${inline(line.slice(2))}</h1>`);
      i += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      closeLists();
      closeTable();
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
      i += 1;
      continue;
    }
    if (line.startsWith('### ')) {
      closeLists();
      closeTable();
      html.push(`<h3>${inline(line.slice(4))}</h3>`);
      i += 1;
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      closeLists();
      closeTable();
      html.push('<hr />');
      i += 1;
      continue;
    }

    if (line.includes('|') && line.trim().startsWith('|')) {
      closeLists();
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      const next = lines[i + 1] || '';
      if (/^\|?\s*-+/.test(next)) {
        closeTable();
        html.push('<table><thead><tr>');
        for (const c of cells) html.push(`<th>${inline(c)}</th>`);
        html.push('</tr></thead><tbody>');
        inTable = true;
        i += 2;
        continue;
      }
      if (inTable) {
        html.push('<tr>');
        for (const c of cells) html.push(`<td>${inline(c)}</td>`);
        html.push('</tr>');
        i += 1;
        continue;
      }
    }

    const ul = line.match(/^[-*]\s+(.+)$/);
    if (ul) {
      closeTable();
      if (!inUl) {
        closeLists();
        html.push('<ul>');
        inUl = true;
      }
      html.push(`<li>${inline(ul[1])}</li>`);
      i += 1;
      continue;
    }

    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      closeTable();
      if (!inOl) {
        closeLists();
        html.push('<ol>');
        inOl = true;
      }
      html.push(`<li>${inline(ol[1])}</li>`);
      i += 1;
      continue;
    }

    closeLists();
    closeTable();
    html.push(`<p>${inline(line)}</p>`);
    i += 1;
  }

  closeLists();
  closeTable();
  return html.join('\n');
}
