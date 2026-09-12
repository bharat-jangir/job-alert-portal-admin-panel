import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LINK_TYPES = [
  "RESULT",
  "ANSWERKEY",
  "ADMISSION",
  "ADMITCARD",
  "ONLINEFORM",
  "UPDATE",
  "SYLLABUS",
  "UPCOMING",
  "VERIFICATION",
  "SARKARIYOJANA",
];

const REDIRECT_TYPE = ["internal", "external"];

type RedirectLinkFormProps = {
  initialData?: any;
  onSubmit: (data: any) => void;
  loading?: boolean;
};

type RedirectLinkFormState = {
  type: string;
  targetId?: string;
  slug?: string;
  tag?: string;
  title?: string;
  externalUrl?: string;
  redirectType: string;
  isActive: boolean;
};

export default function RedirectLinkForm({ initialData, onSubmit, loading }: RedirectLinkFormProps) {
  const [form, setForm] = React.useState<RedirectLinkFormState>(
    initialData || {
      type: "",
      targetId: "",
      slug: "",
      tag: "",
      title: "",
      externalUrl: "",
      redirectType: "internal",
      isActive: false,
    }
  );

  React.useEffect(() => {
    setForm(
      initialData || {
        type: "",
        targetId: "",
        slug: "",
        tag: "",
        title: "",
        externalUrl: "",
        redirectType: "internal",
        isActive: false,
      }
    );
  }, [initialData]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm(f => ({
        ...f,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm(f => ({
        ...f,
        [name]: value,
      }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Type</label>
        <select name="type" value={form.type} onChange={handleChange} required className="border rounded px-2 py-1 w-full">
          <option value="">Select Type</option>
          {LINK_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Title</label>
        <Input name="title" value={form.title} onChange={handleChange} required />
      </div>
      <div>
        <label>Slug</label>
        <Input name="slug" value={form.slug} onChange={handleChange} />
      </div>
      <div>
        <label>Tag (Optional)</label>
        <Input name="tag" value={form.tag} onChange={handleChange} placeholder="e.g. upcoming, declared" list="tag-options" />
        <datalist id="tag-options">
          <option value="Upcoming" />
          <option value="Declared" />
          <option value="Started" />
          <option value="Extended" />
          <option value="Postponed" />
          <option value="Cancelled" />
        </datalist>
      </div>
      <div>
        <label>Target ID</label>
        <Input name="targetId" value={form.targetId} onChange={handleChange} />
      </div>
      <div>
        <label>External URL</label>
        <Input name="externalUrl" value={form.externalUrl} onChange={handleChange} />
      </div>
      <div>
        <label>Redirect Type</label>
        <select name="redirectType" value={form.redirectType} onChange={handleChange} required className="border rounded px-2 py-1 w-full">
          {REDIRECT_TYPE.map(rt => (
            <option key={rt} value={rt}>{rt}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} id="isActive" />
        <label htmlFor="isActive">Active</label>
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
    </form>
  );
} 