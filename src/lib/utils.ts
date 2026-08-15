export function timeAgo(iso: string | null): string {
  if (!iso) return 'Recently';
  const date = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 86400)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  if (min == null && max == null) return null;
  const sym = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
  if (min != null && max != null) return `${sym}${min.toLocaleString()} – ${sym}${max.toLocaleString()}`;
  if (min != null) return `${sym}${min.toLocaleString()}+`;
  return `Up to ${sym}${max?.toLocaleString()}`;
}

export function htmlToText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('style, script').forEach((el) => el.remove());
  return div.textContent?.replace(/\s+/g, ' ').trim() || '';
}

export function parseJobDescription(desc: string | null): {
  sections: { heading: string; content: string }[];
  fullText: string;
} {
  if (!desc) return { sections: [], fullText: '' };
  const div = document.createElement('div');
  div.innerHTML = desc;
  div.querySelectorAll('style, script').forEach((el) => el.remove());

  const sections: { heading: string; content: string }[] = [];
  const headingEls = div.querySelectorAll('h1, h2, h3, h4, h5, h6');

  if (headingEls.length > 0) {
    headingEls.forEach((heading) => {
      const headingText = heading.textContent?.trim() || '';
      if (!headingText) return;
      let content = '';
      let sibling = heading.nextElementSibling;
      while (sibling && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(sibling.tagName)) {
        const text = sibling.textContent?.trim();
        if (text) content += (content ? '\n' : '') + text;
        sibling = sibling.nextElementSibling;
      }
      if (content) sections.push({ heading: headingText, content });
    });
  }

  if (sections.length === 0) {
    const paragraphs = div.querySelectorAll('p, li');
    paragraphs.forEach((p) => {
      const text = p.textContent?.trim();
      if (!text) return;
      const prevTag = p.previousElementSibling?.tagName;
      if (prevTag && ['H1', 'H2', 'H3', 'H4'].includes(prevTag)) {
        const headingText = p.previousElementSibling?.textContent?.trim() || '';
        sections.push({ heading: headingText, content: text });
      } else if (p.querySelector('strong') && text.length < 80) {
        sections.push({ heading: text, content: '' });
      } else {
        const lastSection = sections[sections.length - 1];
        if (lastSection && !lastSection.content) {
          lastSection.content = text;
        } else {
          sections.push({ heading: '', content: text });
        }
      }
    });
  }

  if (sections.length === 0) {
    const fullText = div.textContent?.replace(/\s+/g, ' ').trim() || '';
    return { sections: [], fullText };
  }

  const fullText = sections
    .map((s) => (s.heading ? `${s.heading}\n${s.content}` : s.content))
    .join('\n\n');
  return { sections, fullText };
}

export function extractRequirements(desc: string | null): string[] {
  if (!desc) return [];
  const { sections, fullText } = parseJobDescription(desc);
  const reqSection = sections.find((s) =>
    /require|qualification|skill|must have|nice to have|preferred|what you need|you have|you bring|prerequisite/i.test(
      s.heading
    )
  );
  if (reqSection) {
    return reqSection.content
      .split(/[\n\u2022\u00b7]\s*|\d+\.\s/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5 && s.length < 300);
  }
  const liMatches = fullText.match(/(?:^|\n)(?:\u2022|\u00b7|\d+\.)\s*(.+)/g);
  if (liMatches) {
    return liMatches
      .map((s) => s.replace(/^(?:\u2022|\u00b7|\d+\.)\s*/, '').trim())
      .filter((s) => s.length > 5 && s.length < 300)
      .slice(0, 10);
  }
  return [];
}

export async function triggerEdgeFunction(url: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    if (!res.ok) throw new Error(`Failed (${res.status})`);
    const data = await res.json();
    return { success: true, message: data };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
