'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowDown, ArrowUp, Plus, Trash2, X, Palette, RotateCcw } from 'lucide-react';

/**
 * Styling and design configuration for an individual section / element.
 */
export type BlockStyles = {
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  borderRadius?: string;
  padding?: string;
  margin?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  className?: string;
  customCss?: string;
};

/**
 * Structured post body. Mirrors the backend zod schema (post-sections.schema.ts).
 * Blocks render as typed components on the public site and feed JSON-LD, unlike raw HTML.
 */
type Align = 'left' | 'center' | 'right';
export type Leaf =
  | { type: 'paragraph'; text: string; styles?: BlockStyles }
  | { type: 'heading'; level: 2 | 3 | 4; text: string; styles?: BlockStyles }
  | { type: 'list'; title?: string; ordered: boolean; items: string[]; styles?: BlockStyles }
  | { type: 'steps'; title?: string; items: string[]; styles?: BlockStyles }
  | { type: 'image'; src: string; alt: string; caption?: string; link?: string; styles?: BlockStyles }
  | { type: 'button'; label: string; url: string; style: 'primary' | 'secondary' | 'outline'; align: Align; styles?: BlockStyles }
  | { type: 'keyvalue'; title?: string; items: { label: string; value: string }[]; styles?: BlockStyles }
  | { type: 'callout'; tone: 'info' | 'warning' | 'success'; text: string; styles?: BlockStyles }
  | { type: 'quote'; text: string; cite?: string; style: 'quote' | 'pull'; styles?: BlockStyles }
  | { type: 'links'; title?: string; items: { label: string; url: string }[]; styles?: BlockStyles }
  | { type: 'download'; label: string; url: string; fileType?: string; size?: string; styles?: BlockStyles }
  | { type: 'separator'; style: 'line' | 'dots' | 'space'; styles?: BlockStyles };

export type Section =
  | Leaf
  | { type: 'table'; title?: string; headers: string[]; rows: string[][]; align?: Align[]; styles?: BlockStyles }
  | { type: 'faq'; title?: string; items: { question: string; answer: string }[]; styles?: BlockStyles }
  | { type: 'accordion'; title?: string; items: { title: string; content: string }[]; styles?: BlockStyles }
  | { type: 'timeline'; title?: string; items: { date: string; title: string; text?: string }[]; styles?: BlockStyles }
  | { type: 'gallery'; title?: string; images: { src: string; alt: string; caption?: string }[]; styles?: BlockStyles }
  | { type: 'video'; url: string; title: string; caption?: string; styles?: BlockStyles }
  | { type: 'audio'; src: string; title?: string; styles?: BlockStyles }
  | { type: 'embed'; url: string; title: string; caption?: string; height: number; styles?: BlockStyles }
  | { type: 'code'; code: string; language?: string; styles?: BlockStyles }
  | { type: 'toc'; title?: string; styles?: BlockStyles }
  | { type: 'ad'; slot: string; styles?: BlockStyles }
  | { type: 'columns'; columns: { blocks: Leaf[] }[]; styles?: BlockStyles }
  | { type: 'html'; html: string; styles?: BlockStyles };

type BlockDef = { type: Section['type']; label: string; make: () => Section };
const B = (type: Section['type'], label: string, make: () => Section): BlockDef => ({ type, label, make });

/** Grouped like the WordPress block inserter. */
const GROUPS: { name: string; blocks: BlockDef[] }[] = [
  { name: 'Text', blocks: [
    B('paragraph', 'Paragraph', () => ({ type: 'paragraph', text: '' })),
    B('heading', 'Heading', () => ({ type: 'heading', level: 2, text: '' })),
    B('quote', 'Quote', () => ({ type: 'quote', text: '', cite: '', style: 'quote' })),
    B('list', 'List', () => ({ type: 'list', title: '', ordered: false, items: [''] })),
    B('code', 'Code', () => ({ type: 'code', code: '', language: '' })),
  ] },
  { name: 'Data', blocks: [
    B('table', 'Table', () => ({ type: 'table', title: '', headers: ['Detail', 'Info'], rows: [['', '']] })),
    B('keyvalue', 'Info card', () => ({ type: 'keyvalue', title: '', items: [{ label: '', value: '' }] })),
    B('timeline', 'Timeline', () => ({ type: 'timeline', title: '', items: [{ date: '', title: '', text: '' }] })),
    B('steps', 'Steps', () => ({ type: 'steps', title: 'How to apply', items: [''] })),
  ] },
  { name: 'Media', blocks: [
    B('image', 'Image', () => ({ type: 'image', src: '', alt: '', caption: '', link: '' })),
    B('gallery', 'Gallery', () => ({ type: 'gallery', title: '', images: [{ src: '', alt: '', caption: '' }] })),
    B('video', 'Video', () => ({ type: 'video', url: '', title: '', caption: '' })),
    B('audio', 'Audio', () => ({ type: 'audio', src: '', title: '' })),
    B('embed', 'Embed', () => ({ type: 'embed', url: '', title: '', caption: '', height: 500 })),
    B('download', 'File download', () => ({ type: 'download', label: '', url: '', fileType: 'pdf', size: '' })),
  ] },
  { name: 'Interactive', blocks: [
    B('faq', 'FAQ (SEO)', () => ({ type: 'faq', title: '', items: [{ question: '', answer: '' }] })),
    B('accordion', 'Accordion', () => ({ type: 'accordion', title: '', items: [{ title: '', content: '' }] })),
    B('links', 'Links', () => ({ type: 'links', title: 'Important links', items: [{ label: '', url: '' }] })),
    B('button', 'Button', () => ({ type: 'button', label: '', url: '', style: 'primary', align: 'left' })),
    B('callout', 'Callout', () => ({ type: 'callout', tone: 'info', text: '' })),
  ] },
  { name: 'Layout', blocks: [
    B('columns', 'Columns', () => ({ type: 'columns', columns: [{ blocks: [] }, { blocks: [] }] })),
    B('separator', 'Separator', () => ({ type: 'separator', style: 'line' })),
    B('toc', 'Table of contents', () => ({ type: 'toc', title: '' })),
    B('ad', 'Ad slot', () => ({ type: 'ad', slot: 'in-article-1' })),
  ] },
  { name: 'Advanced', blocks: [
    B('html', 'Custom HTML', () => ({ type: 'html', html: '' })),
  ] },
];
const LEAF_TYPES: Section['type'][] = ['paragraph', 'heading', 'list', 'steps', 'image', 'button', 'keyvalue', 'callout', 'quote', 'links', 'download', 'separator'];
const LEAF_BLOCKS = GROUPS.flatMap((g) => g.blocks).filter((b) => LEAF_TYPES.includes(b.type));

const t = (rows: string[][], headers = ['Detail', 'Info'], title = ''): Section => ({ type: 'table', title, headers, rows });
const steps = (items: string[]): Section => ({ type: 'steps', title: 'How to apply', items });
const links = (): Section => ({ type: 'links', title: 'Important links', items: [{ label: 'Official website', url: '' }] });

/** One-click starting points per post type so editors fill a form instead of designing a page. */
export const TEMPLATES: Record<string, Section[]> = {
  job: [
    { type: 'paragraph', text: '' },
    t([['Post name', ''], ['Vacancies', '']], ['Post', 'Vacancies'], 'Vacancy details'),
    t([['General / OBC', ''], ['SC / ST', '']], ['Category', 'Fee'], 'Application fee'),
    { type: 'list', title: 'Eligibility', ordered: false, items: [''] },
    steps(['']),
    links(),
    { type: 'faq', title: '', items: [{ question: '', answer: '' }] },
  ],
  'online-form': [
    { type: 'paragraph', text: '' },
    t([['General', ''], ['OBC', ''], ['SC', ''], ['ST', '']], ['Category', 'Vacancies'], 'Vacancy by category'),
    t([['General / OBC', ''], ['SC / ST', '']], ['Category', 'Fee'], 'Application fee'),
    { type: 'list', title: 'Selection process', ordered: true, items: [''] },
    steps(['']),
    links(),
  ],
  result: [
    { type: 'callout', tone: 'success', text: '' },
    t([['Exam', ''], ['Status', 'Declared'], ['Next stage', '']]),
    steps(['']),
    links(),
  ],
  'admit-card': [
    t([['Exam', ''], ['Mode', ''], ['Exam date', '']]),
    steps(['']),
    { type: 'list', title: 'Documents to carry', ordered: false, items: [''] },
    links(),
  ],
  'answer-key': [t([['Exam', ''], ['Objection fee', '']]), steps(['']), links()],
  syllabus: [
    t([['', '', '', '']], ['Section', 'Questions', 'Marks', 'Time'], 'Exam pattern'),
    { type: 'list', title: 'Topics', ordered: false, items: [''] },
    links(),
  ],
  default: [{ type: 'paragraph', text: '' }, t([['', '']]), links()],
};

const moveItem = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

function Lines({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input value={it} placeholder={placeholder} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} />
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Remove">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ''])}>
        <Plus className="h-4 w-4 mr-1" /> Add row
      </Button>
    </div>
  );
}

function Title({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return <Input value={value ?? ''} placeholder="Block title (optional)" onChange={(e) => onChange(e.target.value)} className="mb-2 font-medium" />;
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 space-y-1"><span>{label}</span>{children}</label>;
}
const FORMAT_HINT = 'Formatting: **bold**  *italic*  [link text](https://…)  `code`  ~~strike~~';

function ColumnLeafBlock({
  b,
  onUpdate,
  onDelete,
}: {
  b: Leaf;
  onUpdate: (nb: Leaf) => void;
  onDelete: () => void;
}) {
  const [openStyle, setOpenStyle] = useState(false);
  return (
    <div className="border rounded bg-white p-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-gray-400">{b.type}</span>
          <button
            type="button"
            onClick={() => setOpenStyle(!openStyle)}
            className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] transition-colors ${
              hasStyles(b.styles)
                ? 'bg-blue-100 text-blue-700 font-medium'
                : openStyle
                ? 'bg-gray-200 text-gray-800'
                : 'text-gray-400 hover:text-gray-700'
            }`}
            title="Style block"
          >
            <Palette className="h-2.5 w-2.5" />
            <span>Style</span>
            {hasStyles(b.styles) && <span className="w-1 h-1 rounded-full bg-blue-600" />}
          </button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onDelete}
          aria-label="Delete block"
        >
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>
      {openStyle && (
        <BlockStylesEditor
          styles={b.styles}
          onChange={(newStyles) => onUpdate({ ...b, styles: newStyles })}
          onClose={() => setOpenStyle(false)}
        />
      )}
      <BlockBody s={b} set={onUpdate as any} />
    </div>
  );
}

function BlockBody({ s, set }: { s: Section; set: (s: Section) => void }) {
  switch (s.type) {
    case 'paragraph':
      return (
        <div>
          <Textarea value={s.text} rows={4} placeholder="Write a paragraph…" onChange={(e) => set({ ...s, text: e.target.value })} />
          <p className="mt-1 text-xs text-gray-400">{FORMAT_HINT}</p>
        </div>
      );
    case 'heading':
      return (
        <div className="flex gap-2">
          <select className="border rounded-md px-2" value={s.level} onChange={(e) => set({ ...s, level: Number(e.target.value) as 2 | 3 | 4 })}>
            <option value={2}>H2</option><option value={3}>H3</option><option value={4}>H4</option>
          </select>
          <Input value={s.text} placeholder="Heading text" onChange={(e) => set({ ...s, text: e.target.value })} />
        </div>
      );
    case 'callout':
      return (
        <div className="space-y-2">
          <select className="border rounded-md px-2 py-1" value={s.tone} onChange={(e) => set({ ...s, tone: e.target.value as any })}>
            <option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option>
          </select>
          <Textarea value={s.text} rows={2} onChange={(e) => set({ ...s, text: e.target.value })} />
        </div>
      );
    case 'list':
      return (
        <div>
          <Title value={s.title} onChange={(title) => set({ ...s, title })} />
          <label className="text-sm flex items-center gap-2 mb-2">
            <input type="checkbox" checked={s.ordered} onChange={(e) => set({ ...s, ordered: e.target.checked })} /> Numbered list
          </label>
          <Lines items={s.items} onChange={(items) => set({ ...s, items })} />
        </div>
      );
    case 'steps':
      return (
        <div>
          <Title value={s.title} onChange={(title) => set({ ...s, title })} />
          <Lines items={s.items} placeholder="Step…" onChange={(items) => set({ ...s, items })} />
        </div>
      );
    case 'table':
      return (
        <div className="space-y-2">
          <Title value={s.title} onChange={(title) => set({ ...s, title })} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {s.headers.map((_, c) => (
                    <th key={c} className="p-1 pb-0">
                      <select className="w-full border rounded text-xs py-0.5 text-gray-500" value={s.align?.[c] ?? 'left'}
                        onChange={(e) => set({ ...s, align: s.headers.map((__, cc) => (cc === c ? (e.target.value as Align) : s.align?.[cc] ?? 'left')) })}>
                        <option value="left">Align left</option><option value="center">Center</option><option value="right">Right</option>
                      </select>
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
                <tr>
                  {s.headers.map((h, c) => (
                    <th key={c} className="p-1">
                      <Input value={h} className="font-semibold bg-gray-50" onChange={(e) => set({ ...s, headers: s.headers.map((x, k) => (k === c ? e.target.value : x)) })} />
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {s.rows.map((row, r) => (
                  <tr key={r}>
                    {s.headers.map((_, c) => (
                      <td key={c} className="p-1">
                        <Input value={row[c] ?? ''} onChange={(e) => set({ ...s, rows: s.rows.map((rw, k) => (k === r ? s.headers.map((__, cc) => (cc === c ? e.target.value : rw[cc] ?? '')) : rw)) })} />
                      </td>
                    ))}
                    <td>
                      <Button type="button" variant="ghost" size="icon" onClick={() => set({ ...s, rows: s.rows.filter((_, k) => k !== r) })} aria-label="Remove row">
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => set({ ...s, rows: [...s.rows, s.headers.map(() => '')] })}><Plus className="h-4 w-4 mr-1" /> Row</Button>
            <Button type="button" variant="outline" size="sm" disabled={s.headers.length >= 12} onClick={() => set({ ...s, headers: [...s.headers, ''], rows: s.rows.map((r) => [...r, '']) })}><Plus className="h-4 w-4 mr-1" /> Column</Button>
            <Button type="button" variant="outline" size="sm" disabled={s.headers.length <= 1} onClick={() => set({ ...s, headers: s.headers.slice(0, -1), rows: s.rows.map((r) => r.slice(0, -1)) })}>− Column</Button>
          </div>
        </div>
      );
    case 'links':
      return (
        <div className="space-y-2">
          <Title value={s.title} onChange={(title) => set({ ...s, title })} />
          {s.items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <Input value={it.label} placeholder="Label" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
              <Input value={it.url} placeholder="https://…" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)) })} />
              <Button type="button" variant="ghost" size="icon" onClick={() => set({ ...s, items: s.items.filter((_, k) => k !== i) })} aria-label="Remove"><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set({ ...s, items: [...s.items, { label: '', url: '' }] })}><Plus className="h-4 w-4 mr-1" /> Link</Button>
        </div>
      );
    case 'faq':
      return (
        <div className="space-y-3">
          <Title value={s.title} onChange={(title) => set({ ...s, title })} />
          {s.items.map((it, i) => (
            <div key={i} className="space-y-1 border rounded-md p-2">
              <div className="flex gap-2">
                <Input value={it.question} placeholder="Question" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, question: e.target.value } : x)) })} />
                <Button type="button" variant="ghost" size="icon" onClick={() => set({ ...s, items: s.items.filter((_, k) => k !== i) })} aria-label="Remove"><X className="h-4 w-4" /></Button>
              </div>
              <Textarea value={it.answer} rows={2} placeholder="Answer" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, answer: e.target.value } : x)) })} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set({ ...s, items: [...s.items, { question: '', answer: '' }] })}><Plus className="h-4 w-4 mr-1" /> Question</Button>
        </div>
      );
    case 'quote':
      return (
        <div className="space-y-2">
          <select className="border rounded-md px-2 py-1" value={s.style} onChange={(e) => set({ ...s, style: e.target.value as 'quote' | 'pull' })}>
            <option value="quote">Quote</option><option value="pull">Pull quote (large)</option>
          </select>
          <Textarea value={s.text} rows={3} placeholder="Quote text" onChange={(e) => set({ ...s, text: e.target.value })} />
          <Input value={s.cite ?? ''} placeholder="Source / author (optional)" onChange={(e) => set({ ...s, cite: e.target.value })} />
        </div>
      );
    case 'code':
      return (
        <div className="space-y-2">
          <Input value={s.language ?? ''} placeholder="Language (optional, e.g. js, json)" onChange={(e) => set({ ...s, language: e.target.value })} />
          <Textarea value={s.code} rows={6} className="font-mono text-xs" onChange={(e) => set({ ...s, code: e.target.value })} />
        </div>
      );
    case 'keyvalue':
      return (
        <div className="space-y-2">
          <Title value={s.title} onChange={(title) => set({ ...s, title })} />
          {s.items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <Input value={it.label} placeholder="Label" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
              <Input value={it.value} placeholder="Value" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)) })} />
              <Button type="button" variant="ghost" size="icon" onClick={() => set({ ...s, items: s.items.filter((_, k) => k !== i) })} aria-label="Remove"><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set({ ...s, items: [...s.items, { label: '', value: '' }] })}><Plus className="h-4 w-4 mr-1" /> Row</Button>
        </div>
      );
    case 'timeline':
      return (
        <div className="space-y-2">
          <Title value={s.title} onChange={(title) => set({ ...s, title })} />
          {s.items.map((it, i) => (
            <div key={i} className="border rounded-md p-2 space-y-1">
              <div className="flex gap-2">
                <Input value={it.date} placeholder="Date / label (e.g. 15 Jan 2026)" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, date: e.target.value } : x)) })} />
                <Input value={it.title} placeholder="Title" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} />
                <Button type="button" variant="ghost" size="icon" onClick={() => set({ ...s, items: s.items.filter((_, k) => k !== i) })} aria-label="Remove"><X className="h-4 w-4" /></Button>
              </div>
              <Input value={it.text ?? ''} placeholder="Details (optional)" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)) })} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set({ ...s, items: [...s.items, { date: '', title: '', text: '' }] })}><Plus className="h-4 w-4 mr-1" /> Event</Button>
        </div>
      );
    case 'accordion':
      return (
        <div className="space-y-3">
          <Title value={s.title} onChange={(title) => set({ ...s, title })} />
          {s.items.map((it, i) => (
            <div key={i} className="space-y-1 border rounded-md p-2">
              <div className="flex gap-2">
                <Input value={it.title} placeholder="Heading" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} />
                <Button type="button" variant="ghost" size="icon" onClick={() => set({ ...s, items: s.items.filter((_, k) => k !== i) })} aria-label="Remove"><X className="h-4 w-4" /></Button>
              </div>
              <Textarea value={it.content} rows={2} placeholder="Content" onChange={(e) => set({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, content: e.target.value } : x)) })} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set({ ...s, items: [...s.items, { title: '', content: '' }] })}><Plus className="h-4 w-4 mr-1" /> Item</Button>
          <p className="text-xs text-gray-400">Not used for Google FAQ rich results — use the FAQ block for that.</p>
        </div>
      );
    case 'image':
      return (
        <div className="space-y-2">
          <Field label="Image URL (https://…)"><Input value={s.src} placeholder="https://…/photo.jpg" onChange={(e) => set({ ...s, src: e.target.value })} /></Field>
          <Field label="Alt text (describe the image — important for SEO and accessibility)">
            <Input value={s.alt} onChange={(e) => set({ ...s, alt: e.target.value })} />
          </Field>
          {s.src && !s.alt.trim() && <p className="text-xs text-amber-600">Missing alt text.</p>}
          <Field label="Caption (optional)"><Input value={s.caption ?? ''} onChange={(e) => set({ ...s, caption: e.target.value })} /></Field>
          <Field label="Link when clicked (optional)"><Input value={s.link ?? ''} placeholder="https://…" onChange={(e) => set({ ...s, link: e.target.value })} /></Field>
          {s.src && /^https?:\/\//.test(s.src) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.src} alt={s.alt} className="max-h-40 rounded border" />
          )}
        </div>
      );
    case 'gallery':
      return (
        <div className="space-y-2">
          <Title value={s.title} onChange={(title) => set({ ...s, title })} />
          {s.images.map((im, i) => (
            <div key={i} className="flex gap-2">
              <Input value={im.src} placeholder="Image URL" onChange={(e) => set({ ...s, images: s.images.map((x, k) => (k === i ? { ...x, src: e.target.value } : x)) })} />
              <Input value={im.alt} placeholder="Alt text" onChange={(e) => set({ ...s, images: s.images.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)) })} />
              <Input value={im.caption ?? ''} placeholder="Caption" onChange={(e) => set({ ...s, images: s.images.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)) })} />
              <Button type="button" variant="ghost" size="icon" onClick={() => set({ ...s, images: s.images.filter((_, k) => k !== i) })} aria-label="Remove"><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set({ ...s, images: [...s.images, { src: '', alt: '', caption: '' }] })}><Plus className="h-4 w-4 mr-1" /> Image</Button>
        </div>
      );
    case 'video':
      return (
        <div className="space-y-2">
          <Field label="YouTube or Vimeo link"><Input value={s.url} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => set({ ...s, url: e.target.value })} /></Field>
          <Field label="Title (for accessibility)"><Input value={s.title} onChange={(e) => set({ ...s, title: e.target.value })} /></Field>
          <Field label="Caption (optional)"><Input value={s.caption ?? ''} onChange={(e) => set({ ...s, caption: e.target.value })} /></Field>
        </div>
      );
    case 'audio':
      return (
        <div className="space-y-2">
          <Field label="Audio file URL (mp3, ogg…)"><Input value={s.src} placeholder="https://…/file.mp3" onChange={(e) => set({ ...s, src: e.target.value })} /></Field>
          <Field label="Title (optional)"><Input value={s.title ?? ''} onChange={(e) => set({ ...s, title: e.target.value })} /></Field>
        </div>
      );
    case 'embed':
      return (
        <div className="space-y-2">
          <Field label="Embed URL — Google Docs / Drive / Maps / Forms only"><Input value={s.url} placeholder="https://docs.google.com/…/preview" onChange={(e) => set({ ...s, url: e.target.value })} /></Field>
          <Field label="Title (for accessibility)"><Input value={s.title} onChange={(e) => set({ ...s, title: e.target.value })} /></Field>
          <div className="flex gap-2">
            <Field label="Height (px)"><Input type="number" min={100} max={1500} value={s.height} onChange={(e) => set({ ...s, height: Number(e.target.value) || 500 })} /></Field>
            <div className="flex-1"><Field label="Caption (optional)"><Input value={s.caption ?? ''} onChange={(e) => set({ ...s, caption: e.target.value })} /></Field></div>
          </div>
        </div>
      );
    case 'download':
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input value={s.label} placeholder="Label (e.g. Official notification)" onChange={(e) => set({ ...s, label: e.target.value })} />
            <Input value={s.fileType ?? ''} className="w-24" placeholder="pdf" onChange={(e) => set({ ...s, fileType: e.target.value })} />
            <Input value={s.size ?? ''} className="w-28" placeholder="2.4 MB" onChange={(e) => set({ ...s, size: e.target.value })} />
          </div>
          <Input value={s.url} placeholder="https://…/file.pdf" onChange={(e) => set({ ...s, url: e.target.value })} />
        </div>
      );
    case 'button':
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input value={s.label} placeholder="Button text" onChange={(e) => set({ ...s, label: e.target.value })} />
            <select className="border rounded-md px-2" value={s.style} onChange={(e) => set({ ...s, style: e.target.value as any })}>
              <option value="primary">Primary</option><option value="secondary">Dark</option><option value="outline">Outline</option>
            </select>
            <select className="border rounded-md px-2" value={s.align} onChange={(e) => set({ ...s, align: e.target.value as Align })}>
              <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
            </select>
          </div>
          <Input value={s.url} placeholder="https://…" onChange={(e) => set({ ...s, url: e.target.value })} />
        </div>
      );
    case 'separator':
      return (
        <select className="border rounded-md px-2 py-1" value={s.style} onChange={(e) => set({ ...s, style: e.target.value as any })}>
          <option value="line">Line</option><option value="dots">Dots</option><option value="space">Empty space</option>
        </select>
      );
    case 'toc':
      return (
        <div>
          <Title value={s.title} onChange={(title) => set({ ...s, title })} />
          <p className="text-xs text-gray-500">Built automatically from the H2/H3 headings in this post (needs at least two).</p>
        </div>
      );
    case 'ad':
      return (
        <div>
          <Field label="Slot name (lowercase, numbers, hyphens)"><Input value={s.slot} onChange={(e) => set({ ...s, slot: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></Field>
          <p className="mt-1 text-xs text-gray-500">Reserves an ad-sized box on the public page (no layout shift). Hook your ad network to <code>[data-ad-slot]</code>.</p>
        </div>
      );
    case 'columns':
      return (
        <div className="space-y-2">
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${s.columns.length}, minmax(0, 1fr))` }}>
            {s.columns.map((col, c) => (
              <div key={c} className="border rounded-md p-2 space-y-2 bg-gray-50/50">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                  <span>Column {c + 1}</span>
                  <select
                    className="border rounded px-1 py-0.5 font-normal"
                    value=""
                    onChange={(e) => {
                      const def = LEAF_BLOCKS.find((b) => b.type === e.target.value);
                      if (def) set({ ...s, columns: s.columns.map((cc, k) => (k === c ? { blocks: [...cc.blocks, def.make() as Leaf] } : cc)) });
                    }}
                  >
                    <option value="">+ Add block…</option>
                    {LEAF_BLOCKS.map((b) => <option key={b.type} value={b.type}>{b.label}</option>)}
                  </select>
                </div>
                {col.blocks.map((b, k) => (
                  <ColumnLeafBlock
                    key={k}
                    b={b}
                    onUpdate={(nb) => set({ ...s, columns: s.columns.map((cc, kk) => (kk === c ? { blocks: cc.blocks.map((x, j) => (j === k ? nb : x)) } : cc)) })}
                    onDelete={() => set({ ...s, columns: s.columns.map((cc, kk) => (kk === c ? { blocks: cc.blocks.filter((_, j) => j !== k) } : cc)) })}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={s.columns.length >= 4} onClick={() => set({ ...s, columns: [...s.columns, { blocks: [] }] })}><Plus className="h-4 w-4 mr-1" /> Column</Button>
            <Button type="button" variant="outline" size="sm" disabled={s.columns.length <= 2} onClick={() => set({ ...s, columns: s.columns.slice(0, -1) })}>− Column</Button>
          </div>
        </div>
      );
    case 'html':
      return <Textarea value={s.html} rows={6} className="font-mono text-xs" placeholder="<p>Custom HTML (sanitised on save)</p>" onChange={(e) => set({ ...s, html: e.target.value })} />;
  }
}

/** Check if any styling property is populated */
export function hasStyles(styles?: BlockStyles): boolean {
  if (!styles) return false;
  return Object.values(styles).some((v) => typeof v === 'string' && v.trim().length > 0);
}

/** Prunes empty/blank styling fields */
export function cleanBlockStyles(styles?: BlockStyles): BlockStyles | undefined {
  if (!styles) return undefined;
  const out: BlockStyles = {};
  if (styles.textColor?.trim()) out.textColor = styles.textColor.trim();
  if (styles.bgColor?.trim()) out.bgColor = styles.bgColor.trim();
  if (styles.borderColor?.trim()) out.borderColor = styles.borderColor.trim();
  if (styles.borderWidth?.trim()) out.borderWidth = styles.borderWidth.trim();
  if (styles.borderStyle && styles.borderStyle !== 'none') out.borderStyle = styles.borderStyle;
  if (styles.borderRadius?.trim()) out.borderRadius = styles.borderRadius.trim();
  if (styles.padding?.trim()) out.padding = styles.padding.trim();
  if (styles.margin?.trim()) out.margin = styles.margin.trim();
  if (styles.fontSize?.trim()) out.fontSize = styles.fontSize.trim();
  if (styles.fontWeight?.trim()) out.fontWeight = styles.fontWeight.trim();
  if (styles.textAlign) out.textAlign = styles.textAlign;
  if (styles.className?.trim()) out.className = styles.className.trim();
  if (styles.customCss?.trim()) out.customCss = styles.customCss.trim();
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Visual styling editor panel for individual section/element */
export function BlockStylesEditor({
  styles,
  onChange,
  onClose,
}: {
  styles?: BlockStyles;
  onChange: (s?: BlockStyles) => void;
  onClose: () => void;
}) {
  const cur = styles || {};
  const update = (patch: Partial<BlockStyles>) => {
    const next = { ...cur, ...patch };
    onChange(next);
  };
  const clearAll = () => {
    onChange(undefined);
  };

  const bgPresets = [
    { label: 'Transparent', value: '' },
    { label: 'Light Gray', value: '#f3f4f6' },
    { label: 'Light Blue', value: '#eff6ff' },
    { label: 'Light Yellow', value: '#fefce8' },
    { label: 'Light Green', value: '#f0fdf4' },
    { label: 'Light Red', value: '#fef2f2' },
    { label: 'Light Purple', value: '#faf5ff' },
    { label: 'Dark', value: '#111827' },
  ];

  const textPresets = [
    { label: 'Default', value: '' },
    { label: 'Dark Gray', value: '#1f2937' },
    { label: 'Blue', value: '#1d4ed8' },
    { label: 'Green', value: '#15803d' },
    { label: 'Red', value: '#b91c1c' },
    { label: 'Amber', value: '#b45309' },
    { label: 'Purple', value: '#7e22ce' },
    { label: 'White', value: '#ffffff' },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 my-2 text-xs space-y-3 shadow-inner">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Palette className="h-4 w-4 text-blue-600" />
          <span>Section Styling & CSS</span>
        </div>
        <div className="flex items-center gap-2">
          {hasStyles(styles) && (
            <button
              type="button"
              onClick={clearAll}
              className="text-red-600 hover:text-red-700 flex items-center gap-1 text-[11px] font-medium"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 text-[11px] font-medium px-2 py-0.5 rounded border bg-white shadow-sm"
          >
            Done
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Background Color */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Background Color</label>
          <div className="flex flex-wrap gap-1.5 items-center mb-1.5">
            {bgPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => update({ bgColor: p.value || undefined })}
                className={`w-5 h-5 rounded-full border border-slate-300 transition-all ${
                  (cur.bgColor || '') === p.value ? 'ring-2 ring-blue-500 scale-110' : ''
                }`}
                style={{ backgroundColor: p.value || '#ffffff' }}
                title={p.label}
              />
            ))}
          </div>
          <Input
            value={cur.bgColor || ''}
            placeholder="#f3f4f6 or rgba(...)"
            onChange={(e) => update({ bgColor: e.target.value })}
            className="h-7 text-xs bg-white"
          />
        </div>

        {/* Text Color */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Text Color</label>
          <div className="flex flex-wrap gap-1.5 items-center mb-1.5">
            {textPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => update({ textColor: p.value || undefined })}
                className={`w-5 h-5 rounded-full border border-slate-300 transition-all ${
                  (cur.textColor || '') === p.value ? 'ring-2 ring-blue-500 scale-110' : ''
                }`}
                style={{ backgroundColor: p.value || '#000000' }}
                title={p.label}
              />
            ))}
          </div>
          <Input
            value={cur.textColor || ''}
            placeholder="#1d4ed8 or color"
            onChange={(e) => update({ textColor: e.target.value })}
            className="h-7 text-xs bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-slate-200">
        {/* Padding */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Padding</label>
          <select
            className="w-full border rounded px-2 py-1 bg-white text-xs"
            value={cur.padding || ''}
            onChange={(e) => update({ padding: e.target.value || undefined })}
          >
            <option value="">Default</option>
            <option value="0px">None (0px)</option>
            <option value="8px">Small (8px)</option>
            <option value="16px">Medium (16px)</option>
            <option value="24px">Large (24px)</option>
            <option value="32px">XL (32px)</option>
          </select>
        </div>

        {/* Margin Bottom */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Margin Bottom</label>
          <select
            className="w-full border rounded px-2 py-1 bg-white text-xs"
            value={cur.margin || ''}
            onChange={(e) => update({ margin: e.target.value || undefined })}
          >
            <option value="">Default</option>
            <option value="0px">None (0px)</option>
            <option value="8px">Small (8px)</option>
            <option value="16px">Medium (16px)</option>
            <option value="24px">Large (24px)</option>
          </select>
        </div>

        {/* Text Align */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Text Alignment</label>
          <select
            className="w-full border rounded px-2 py-1 bg-white text-xs"
            value={cur.textAlign || ''}
            onChange={(e) => update({ textAlign: (e.target.value as any) || undefined })}
          >
            <option value="">Default</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>

        {/* Font Weight */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Font Weight</label>
          <select
            className="w-full border rounded px-2 py-1 bg-white text-xs"
            value={cur.fontWeight || ''}
            onChange={(e) => update({ fontWeight: e.target.value || undefined })}
          >
            <option value="">Default</option>
            <option value="normal">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="bold">Bold</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-slate-200">
        {/* Border Width */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Border Width</label>
          <select
            className="w-full border rounded px-2 py-1 bg-white text-xs"
            value={cur.borderWidth || ''}
            onChange={(e) => update({ borderWidth: e.target.value || undefined })}
          >
            <option value="">None</option>
            <option value="1px">1px</option>
            <option value="2px">2px</option>
            <option value="3px">3px</option>
            <option value="4px">4px</option>
          </select>
        </div>

        {/* Border Style */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Border Style</label>
          <select
            className="w-full border rounded px-2 py-1 bg-white text-xs"
            value={cur.borderStyle || 'solid'}
            onChange={(e) => update({ borderStyle: (e.target.value as any) || undefined })}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="double">Double</option>
          </select>
        </div>

        {/* Border Color */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Border Color</label>
          <Input
            value={cur.borderColor || ''}
            placeholder="#e2e8f0 or color"
            onChange={(e) => update({ borderColor: e.target.value })}
            className="h-7 text-xs bg-white"
          />
        </div>

        {/* Border Radius */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Border Radius</label>
          <select
            className="w-full border rounded px-2 py-1 bg-white text-xs"
            value={cur.borderRadius || ''}
            onChange={(e) => update({ borderRadius: e.target.value || undefined })}
          >
            <option value="">Default</option>
            <option value="0px">None (0px)</option>
            <option value="4px">Small (4px)</option>
            <option value="8px">Medium (8px)</option>
            <option value="12px">Large (12px)</option>
            <option value="16px">XL (16px)</option>
            <option value="9999px">Pill / Circle</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
        {/* Custom CSS / Tailwind classes */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            Custom Classes (Tailwind / CSS)
          </label>
          <Input
            value={cur.className || ''}
            placeholder="e.g. shadow-md hover:shadow-lg transition-all"
            onChange={(e) => update({ className: e.target.value })}
            className="h-7 text-xs bg-white font-mono"
          />
        </div>

        {/* Inline CSS Rules */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            Inline CSS Rules
          </label>
          <Input
            value={cur.customCss || ''}
            placeholder="e.g. box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 4px solid #2563eb;"
            onChange={(e) => update({ customCss: e.target.value })}
            className="h-7 text-xs bg-white font-mono"
          />
        </div>
      </div>
    </div>
  );
}

/** Drops empty rows/blocks so the API's validation never trips on half-filled blocks. */
export function cleanSections(sections: Section[]): Section[] {
  const out: Section[] = [];
  for (const s of sections) {
    const styles = cleanBlockStyles(s.styles);
    const withSt = <T extends Section>(block: T): T => (styles ? { ...block, styles } : block);

    switch (s.type) {
      case 'paragraph': if (s.text.trim()) out.push(withSt(s)); break;
      case 'heading': if (s.text.trim()) out.push(withSt(s)); break;
      case 'callout': if (s.text.trim()) out.push(withSt(s)); break;
      case 'html': if (s.html.trim()) out.push(withSt(s)); break;
      case 'code': if (s.code.trim()) out.push(withSt({ ...s, language: s.language?.trim() || undefined })); break;
      case 'quote': if (s.text.trim()) out.push(withSt({ ...s, cite: s.cite?.trim() || undefined })); break;
      case 'image': if (s.src.trim()) out.push(withSt({ ...s, src: s.src.trim(), caption: s.caption?.trim() || undefined, link: s.link?.trim() || undefined })); break;
      case 'gallery': {
        const images = s.images.filter((i) => i.src.trim()).map((i) => ({ ...i, src: i.src.trim(), caption: i.caption?.trim() || undefined }));
        if (images.length) out.push(withSt({ ...s, title: s.title?.trim() || undefined, images }));
        break;
      }
      case 'video': if (s.url.trim() && s.title.trim()) out.push(withSt({ ...s, caption: s.caption?.trim() || undefined })); break;
      case 'audio': if (s.src.trim()) out.push(withSt({ ...s, title: s.title?.trim() || undefined })); break;
      case 'embed': if (s.url.trim() && s.title.trim()) out.push(withSt({ ...s, caption: s.caption?.trim() || undefined })); break;
      case 'download': if (s.label.trim() && s.url.trim()) out.push(withSt({ ...s, fileType: s.fileType?.trim() || undefined, size: s.size?.trim() || undefined })); break;
      case 'button': if (s.label.trim() && s.url.trim()) out.push(withSt(s)); break;
      case 'ad': if (s.slot.trim()) out.push(withSt(s)); break;
      case 'separator': out.push(withSt(s)); break;
      case 'toc': out.push(withSt({ ...s, title: s.title?.trim() || undefined })); break;
      case 'keyvalue': {
        const items = s.items.filter((i) => i.label.trim() && i.value.trim());
        if (items.length) out.push(withSt({ ...s, title: s.title?.trim() || undefined, items }));
        break;
      }
      case 'timeline': {
        const items = s.items.filter((i) => i.date.trim() && i.title.trim()).map((i) => ({ ...i, text: i.text?.trim() || undefined }));
        if (items.length) out.push(withSt({ ...s, title: s.title?.trim() || undefined, items }));
        break;
      }
      case 'accordion': {
        const items = s.items.filter((i) => i.title.trim() && i.content.trim());
        if (items.length) out.push(withSt({ ...s, title: s.title?.trim() || undefined, items }));
        break;
      }
      case 'columns': {
        const columns = s.columns.map((c) => ({ blocks: cleanSections(c.blocks) as Leaf[] }));
        if (columns.some((c) => c.blocks.length)) out.push(withSt({ ...s, columns }));
        break;
      }
      case 'list':
      case 'steps': {
        const items = s.items.map((i) => i.trim()).filter(Boolean);
        if (items.length) out.push(withSt({ ...s, title: s.title?.trim() || undefined, items }));
        break;
      }
      case 'table': {
        const rows = s.rows.filter((r) => r.some((c) => c.trim()));
        if (rows.length) out.push(withSt({ ...s, title: s.title?.trim() || undefined, rows }));
        break;
      }
      case 'links': {
        const items = s.items.filter((i) => i.label.trim() && i.url.trim());
        if (items.length) out.push(withSt({ ...s, title: s.title?.trim() || undefined, items }));
        break;
      }
      case 'faq': {
        const items = s.items.filter((i) => i.question.trim() && i.answer.trim());
        if (items.length) out.push(withSt({ ...s, title: s.title?.trim() || undefined, items }));
        break;
      }
    }
  }
  return out;
}

export function SectionsEditor({ value, onChange, postType }: { value: Section[]; onChange: (v: Section[]) => void; postType: string }) {
  const [openStyleId, setOpenStyleId] = useState<number | null>(null);

  const applyTemplate = () => {
    if (value.length && !confirm('Replace the current blocks with the template?')) return;
    onChange(JSON.parse(JSON.stringify(TEMPLATES[postType] ?? TEMPLATES.default)));
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={applyTemplate}>
          Use {postType ? `"${postType}"` : 'default'} template
        </Button>
        <span className="text-xs text-gray-500">Structured blocks power rich results in Google and a consistent layout.</span>
      </div>

      {value.length === 0 && <p className="text-sm text-gray-500 border border-dashed rounded-md p-4 text-center">No blocks yet. Add one below or start from a template.</p>}

      {value.map((s, i) => (
        <div key={i} className="border rounded-lg bg-white shadow-sm">
          <div className="flex items-center justify-between px-3 py-1.5 border-b bg-gray-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">{s.type}</span>
              {hasStyles(s.styles) && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-medium">
                  <Palette className="h-2.5 w-2.5" />
                  Styled
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOpenStyleId(openStyleId === i ? null : i)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  openStyleId === i
                    ? 'bg-blue-600 text-white font-medium'
                    : hasStyles(s.styles)
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
                title="Customize Section Styles & CSS"
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Style</span>
              </button>
              <div className="h-4 w-px bg-gray-200 mx-0.5" />
              <Button type="button" variant="ghost" size="icon" disabled={i === 0} onClick={() => onChange(moveItem(value, i, -1))} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" disabled={i === value.length - 1} onClick={() => onChange(moveItem(value, i, 1))} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Delete block"><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
          </div>

          {openStyleId === i && (
            <div className="px-3 pt-2">
              <BlockStylesEditor
                styles={s.styles}
                onChange={(next) => onChange(value.map((x, k) => (k === i ? { ...x, styles: next } : x)))}
                onClose={() => setOpenStyleId(null)}
              />
            </div>
          )}

          <div className="p-3">
            <BlockBody s={s} set={(next) => onChange(value.map((x, k) => (k === i ? next : x)))} />
          </div>
        </div>
      ))}

      <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Add block</p>
        {GROUPS.map((g) => (
          <div key={g.name} className="flex flex-wrap items-center gap-2">
            <span className="w-20 shrink-0 text-xs text-gray-500">{g.name}</span>
            {g.blocks.map((b) => (
              <Button key={b.type} type="button" variant="outline" size="sm" onClick={() => onChange([...value, b.make()])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> {b.label}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
