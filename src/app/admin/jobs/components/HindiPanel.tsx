'use client';

import { useState } from 'react';
import { Languages, Loader2, Sparkles, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/RichTextEditor';
import { SectionsEditor, cleanSections, type Section } from '@/components/SectionsEditor';

/** The Hindi version of a post's text. Dates, links, slug and numbers are shared with the English post. */
export interface HiTranslation {
  title?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  eligibility?: string;
  updateNote?: string;
  organization?: string;
  location?: string;
  salary?: string;
  totalVacancy?: string;
  ageLimit?: string;
  importantDateLabels?: string[];
  sections?: Section[];
  status?: 'machine' | 'reviewed';
}

/** What the post form sends: nothing when untouched, `{}` when the Hindi version was removed. */
export function hindiPayload(hi: HiTranslation | undefined, touched: boolean): Record<string, any> | undefined {
  if (!touched) return undefined;
  if (!hi) return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(hi)) {
    if (k === 'sections') { const s = cleanSections((v as Section[]) ?? []); if (s.length) out.sections = s; }
    else if (k === 'importantDateLabels') {
      const labels = [...((v as string[]) ?? [])];
      while (labels.length && !labels[labels.length - 1]?.trim()) labels.pop();
      if (labels.length) out.importantDateLabels = labels;
    } else if (typeof v === 'string' && v.trim()) out[k] = v.trim();
  }
  // a Hindi version without a title is not a version: the public site ignores it, so do not store it
  return out.title ? { hi: out } : {};
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {hint && <p className="mb-1 text-xs text-gray-500">English: <span className="italic">{hint}</span></p>}
      {children}
    </div>
  );
}

export function HindiPanel({
  jobId, value, onChange, english,
}: {
  jobId?: string;
  value: HiTranslation | undefined;
  /** `undefined` means "no Hindi version". Called with touched=true on every edit. */
  onChange: (next: HiTranslation | undefined) => void;
  english: {
    title: string; description: string; metaTitle?: string; metaDescription?: string; organization: string; location: string;
    updateNote: string; totalVacancy: string; ageLimit?: string; salary: string; sections: Section[]; importantDates: { label: string }[];
  };
}) {
  const [open, setOpen] = useState(!!value?.title);
  const [busy, setBusy] = useState(false);
  const hi = value ?? {};
  const set = (patch: Partial<HiTranslation>) => onChange({ ...hi, ...patch });
  const has = !!hi.title;
  const label = has ? (hi.status === 'reviewed' ? 'Hindi version: reviewed' : 'Hindi version: automatic, not yet checked') : 'No Hindi version yet';
  const badge = has ? (hi.status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800') : 'bg-gray-100 text-gray-600';

  const translate = async (force = false) => {
    if (!jobId) return toast.error('Save the post first, then translate it.');
    if (has && !force && !confirm('Replace the current Hindi text with a new automatic translation?')) return;
    setBusy(true);
    try {
      const res = await api.post(`/jobs/id/${jobId}/translate`, { force: has || force });
      const d = res.data?.data ?? res.data;
      if (d?.translation) {
        onChange(d.translation);
        setOpen(true);
        toast.success(`Translated${d.acceptable ? '' : ' (low confidence: please read it carefully)'}. ${d.stats?.reverted ?? 0} string(s) kept in English because a number or link would have changed.`);
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message ?? e.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!confirm('Remove the Hindi version of this post? The English post is not affected.')) return;
    onChange(undefined);
  };

  return (
    <div className="rounded-lg border-2 border-orange-200 bg-orange-50/30 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Languages className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-medium">हिन्दी (Hindi) version</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>{label}</span>
        <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => setOpen(!open)}>
          {open ? 'Hide' : has ? 'Edit' : 'Add Hindi'}
        </Button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Shown at <code>/hi/…</code>. Dates, links, vacancies and the URL slug are shared with the English post and cannot differ.
        A post without a Hindi version simply stays English-only.
      </p>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={() => translate()} disabled={busy} className="bg-orange-600 text-white hover:bg-orange-700">
              {busy ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Translating…</> : <><Sparkles className="mr-1.5 h-4 w-4" />Translate from English (AI)</>}
            </Button>
            <span className="text-xs text-gray-500">Translates the <strong>saved</strong> English post{jobId ? '' : ' (save it first)'}. Numbers, links and dates are never changed by the AI.</span>
            {has && (
              <Button type="button" size="sm" variant="outline" className="ml-auto text-red-600" onClick={remove}>
                <Trash2 className="mr-1.5 h-4 w-4" />Remove Hindi version
              </Button>
            )}
          </div>

          <Field label="Title (हिन्दी)" hint={english.title}>
            <Input lang="hi" value={hi.title ?? ''} onChange={(e) => set({ title: e.target.value })} placeholder="पोस्ट का शीर्षक" maxLength={300} />
          </Field>
          <Field label="Short description" hint={english.description}>
            <Textarea lang="hi" value={hi.description ?? ''} onChange={(e) => set({ description: e.target.value })} rows={3} maxLength={1000} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SEO title" hint={english.metaTitle}>
              <Input lang="hi" value={hi.metaTitle ?? ''} onChange={(e) => set({ metaTitle: e.target.value })} maxLength={160} placeholder="empty: the Hindi title is used" />
            </Field>
            <Field label="SEO description" hint={english.metaDescription}>
              <Input lang="hi" value={hi.metaDescription ?? ''} onChange={(e) => set({ metaDescription: e.target.value })} maxLength={400} placeholder="empty: the short description is used" />
            </Field>
            <Field label="Organization" hint={english.organization}>
              <Input lang="hi" value={hi.organization ?? ''} onChange={(e) => set({ organization: e.target.value })} maxLength={200} />
            </Field>
            <Field label="Location" hint={english.location}>
              <Input lang="hi" value={hi.location ?? ''} onChange={(e) => set({ location: e.target.value })} maxLength={200} />
            </Field>
            <Field label="Total vacancy" hint={english.totalVacancy}>
              <Input lang="hi" value={hi.totalVacancy ?? ''} onChange={(e) => set({ totalVacancy: e.target.value })} maxLength={100} />
            </Field>
            <Field label="Age limit" hint={english.ageLimit}>
              <Input lang="hi" value={hi.ageLimit ?? ''} onChange={(e) => set({ ageLimit: e.target.value })} maxLength={100} />
            </Field>
            <Field label="Salary" hint={english.salary}>
              <Input lang="hi" value={hi.salary ?? ''} onChange={(e) => set({ salary: e.target.value })} maxLength={200} />
            </Field>
            <Field label="Update note" hint={english.updateNote}>
              <Input lang="hi" value={hi.updateNote ?? ''} onChange={(e) => set({ updateNote: e.target.value })} maxLength={300} />
            </Field>
          </div>

          {english.importantDates.some((d) => d.label) && (
            <div>
              <label className="mb-1 block text-sm font-medium">Important date labels</label>
              <p className="mb-2 text-xs text-gray-500">Only the labels are translated; the dates stay the same as the English post.</p>
              <div className="space-y-2">
                {english.importantDates.map((d, i) => (
                  <div key={i} className="grid items-center gap-2 md:grid-cols-2">
                    <span className="text-sm text-gray-600">{d.label || '(no label)'}</span>
                    <Input
                      lang="hi"
                      value={hi.importantDateLabels?.[i] ?? ''}
                      onChange={(e) => {
                        const labels = [...(hi.importantDateLabels ?? [])];
                        while (labels.length < english.importantDates.length) labels.push('');
                        labels[i] = e.target.value;
                        set({ importantDateLabels: labels });
                      }}
                      maxLength={200}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Eligibility (हिन्दी)</label>
            <RichTextEditor value={hi.eligibility ?? ''} onChange={(v) => set({ eligibility: v })} placeholder="पात्रता…" />
          </div>

          <div className="rounded-lg border bg-white p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h4 className="font-medium">Content blocks (हिन्दी)</h4>
              <Button
                type="button" variant="outline" size="sm"
                disabled={!english.sections.length}
                onClick={() => {
                  if ((hi.sections?.length ?? 0) && !confirm('Replace the Hindi blocks with a copy of the English ones?')) return;
                  set({ sections: JSON.parse(JSON.stringify(english.sections)) });
                }}
              >
                <Copy className="mr-1.5 h-4 w-4" />Copy English blocks to translate by hand
              </Button>
              <span className="text-xs text-gray-500">Keep the same tables and links; change the words.</span>
            </div>
            <SectionsEditor value={hi.sections ?? []} onChange={(v) => set({ sections: v })} postType="" />
          </div>

          <label className="flex items-start gap-2 rounded-md border bg-white p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={hi.status === 'reviewed'}
              onChange={(e) => set({ status: e.target.checked ? 'reviewed' : 'machine' })}
            />
            <span>
              <strong>I have read this Hindi version and it is correct.</strong>
              <span className="block text-xs text-gray-500">
                Until this is ticked, readers see a note that the page was translated automatically, and the crawler may refresh it when the source changes.
              </span>
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
