'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X } from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import Editor from '@monaco-editor/react';
import { SectionsEditor, cleanSections, type Section } from '@/components/SectionsEditor';
import { useAuth, AdminRole } from '@/lib/auth-context';

// Define enums to match backend
enum ExperienceLevel {
  ENTRY = 'ENTRY',
  MID = 'MID',
  SENIOR = 'SENIOR',
  EXECUTIVE = 'EXECUTIVE'
}

enum QualificationLevel {
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  BACHELORS = 'BACHELORS',
  MASTERS = 'MASTERS',
  PHD = 'PHD',
  OTHER = 'OTHER'
}

// Job Categories are now fetched dynamically

interface ImportantDate {
  label: string;
  date: string;
}

interface JobFormData {
  title: string;
  slug: string;
  htmlContent: string;
  organization: string;
  organizationId?: string;
  location: string;
  salary: string;
  qualification: QualificationLevel;
  experience: ExperienceLevel;
  lastDate: string;
  applyLink: string;
  description: string;
  eligibility: string;
  totalVacancy: string;
  ageLimit?: string;
  isBulletin: boolean;
  // isActive: boolean;
  tags: string[];
  importantDates: ImportantDate[];
  metaTitle?: string;
  metaDescription?: string;
  sourceUrl?: string;
  type: string;
  categoryId?: string;
  status: string;
  scheduledAt: string;
  states: string;
  canonicalUrl: string;
  ogImage: string;
  updateNote: string;
  sections: Section[];
}

interface JobFormProps {
  job?: any;
  onSuccess: () => void;
}

// Add helper function for date formatting
const formatDateForInput = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
};

export function JobForm({ job, onSuccess }: JobFormProps) {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [organizations, setOrganizations] = useState<{_id: string, name: string}[]>([]);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canPublish = hasPermission([AdminRole.PUBLISHER]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgsRes = await api.get('/organizations/active');
        const orgsData = orgsRes.data?.data ?? orgsRes.data;
        setOrganizations(Array.isArray(orgsData) ? orgsData : []);

        const catRes = await api.get('/job-categories/active');
        const catData = catRes.data?.data ?? catRes.data;
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (err) {
        console.error('Failed to load data', err);
      }
    };
    fetchData();
  }, []);

  const loadRevisions = async () => {
    if (!job?._id) return;
    try {
      const res = await api.get(`/jobs/id/${job._id}/revisions`);
      setRevisions(res.data?.data ?? []);
    } catch {}
  };
  useEffect(() => { loadRevisions(); }, [job?._id]);

  const restoreRevision = async (revisionId: string, version: number) => {
    if (!confirm(`Restore version ${version}? The current content is saved as a new revision first.`)) return;
    try {
      await api.post(`/jobs/id/${job._id}/revisions/${revisionId}/restore`);
      toast.success(`Restored version ${version}`);
      router.refresh();
      window.location.reload();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Restore failed');
    }
  };

  const [formData, setFormData] = useState<JobFormData>({
    title: job?.title || '',
    slug: job?.slug || '',
    htmlContent: job?.htmlContent || '',
    organization: job?.organization || '',
    organizationId: typeof job?.organizationId === 'object' ? job?.organizationId?._id : (job?.organizationId || ''),
    location: job?.location || '',
    salary: job?.salary || '',
    qualification: job?.qualification || QualificationLevel.BACHELORS,
    experience: job?.experience || ExperienceLevel.ENTRY,
    lastDate: formatDateForInput(job?.lastDate),
    applyLink: job?.applyLink || '',
    description: job?.description || '',
    eligibility: job?.eligibility || '',
    totalVacancy: job?.totalVacancy || '',
    ageLimit: job?.ageLimit || '',
    isBulletin: job?.isBulletin ?? false,
    // isActive: job?.isActive ?? true,
    tags: job?.tags || [],
    importantDates: job?.importantDates?.map((date: any) => ({
      label: date.label,
      date: formatDateForInput(date.date)
    })) || [],
    metaTitle: job?.metaTitle || '',
    metaDescription: job?.metaDescription || '',
    sourceUrl: job?.sourceUrl || '',
    type: job?.type || '',
    categoryId: typeof job?.categoryId === 'object' ? job?.categoryId?._id : (job?.categoryId || ''),
    status: job?.status || 'draft',
    scheduledAt: formatDateForInput(job?.scheduledAt),
    states: (job?.states || []).join(', '),
    canonicalUrl: job?.canonicalUrl || '',
    ogImage: job?.ogImage || '',
    updateNote: job?.updateNote || '',
    sections: job?.sections || [],
  });

  const [tagInput, setTagInput] = useState(job?.tags?.join(', ') || '');
  const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({});

  useEffect(() => {
    if (isEditorOpen) {
      setHtmlCode(formData.htmlContent);
    }
  }, [isEditorOpen, formData.htmlContent]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setHtmlCode(value);
      handleChange('htmlContent', value);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof JobFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.type) newErrors.type = 'Choose a job type';
    if (formData.status === 'scheduled' && (!formData.scheduledAt || new Date(formData.scheduledAt) <= new Date())) {
      newErrors.scheduledAt = 'Pick a future date to schedule';
    }

    // Format validations
    if (formData.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens)';
    }

    if (formData.applyLink && !/^https?:\/\/.+/.test(formData.applyLink)) {
      newErrors.applyLink = 'Must be a valid URL';
    }

    if (formData.sourceUrl && !/^https?:\/\/.+/.test(formData.sourceUrl)) {
      newErrors.sourceUrl = 'Must be a valid URL';
    }

    // Allow empty importantDates (no validation at all)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImportantDateChange = (index: number, field: keyof ImportantDate, value: string) => {
    setFormData(prev => ({
      ...prev,
      importantDates: prev.importantDates.map((date, i) => 
        i === index ? { ...date, [field]: value } : date
      )
    }));
  };

  const addImportantDate = () => {
    setFormData(prev => ({
      ...prev,
      importantDates: [...prev.importantDates, { label: '', date: '' }]
    }));
  };

  const removeImportantDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      importantDates: prev.importantDates.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      const iso = (v: string) => (v && !isNaN(new Date(v).getTime()) ? new Date(v).toISOString() : undefined);
      const { states, sections, scheduledAt, lastDate, importantDates, ...rest } = formData;
      const formattedData: Record<string, any> = {
        ...rest,
        lastDate: iso(lastDate),
        scheduledAt: formData.status === 'scheduled' ? iso(scheduledAt) : undefined,
        states: states.split(',').map((x) => x.trim()).filter(Boolean),
        sections: cleanSections(sections),
        importantDates: importantDates
          .filter((d) => d.label || d.date)
          .map((d) => ({ label: d.label, date: iso(d.date) })),
      };
      // empty strings -> omitted (the API treats them as "not set")
      for (const k of Object.keys(formattedData)) if (formattedData[k] === '') delete formattedData[k];

      if (job) {
        await api.patch(`/jobs/id/${job._id}`, formattedData);
        toast.success('Job updated successfully');
      } else {
        await api.post('/jobs', formattedData);
        toast.success('Job created successfully');
      }
      
      router.push('/admin/jobs');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving job:', error);
      
      const apiMsg = error.response?.data?.error?.message ?? error.response?.data?.message;
      if (apiMsg) {
        toast.error(Array.isArray(apiMsg) ? apiMsg.join(', ') : String(apiMsg));
      } else {
        toast.error('Failed to save job. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 border border-red-500 rounded-md">
        <h2 className="text-red-500 font-bold">Error Loading Form</h2>
        <p className="text-sm text-red-400">{error.message}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-full p-2 border rounded-md bg-white"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="review">In review</option>
              {(canPublish || formData.status === 'published') && <option value="published" disabled={!canPublish}>Published</option>}
              {(canPublish || formData.status === 'scheduled') && <option value="scheduled" disabled={!canPublish}>Scheduled</option>}
              {(canPublish || formData.status === 'archived') && <option value="archived" disabled={!canPublish}>Archived (hidden)</option>}
            </select>
            {!canPublish && <p className="text-xs text-gray-500 mt-1">Only publishers can make a post live. Save as draft or submit it for review.</p>}
          </div>
          {formData.status === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium mb-1">Publish at</label>
              <Input type="datetime-local" value={formData.scheduledAt} onChange={(e) => handleChange('scheduledAt', e.target.value)} />
              {errors.scheduledAt && <p className="text-red-500 text-sm mt-1">{errors.scheduledAt}</p>}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Update note <span className="text-gray-400 font-normal">(shown to readers when you change a live post)</span></label>
          <Input value={formData.updateNote} placeholder="e.g. Last date extended to 30 June" onChange={(e) => handleChange('updateNote', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Job Title <span className="text-red-500">*</span></label>
          <Input
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter job title"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL Slug <span className="text-red-500">*</span></label>
          <p className="text-xs text-gray-500 mb-2">
            The exact text that will appear in the web address (e.g., website.com/jobs/<strong>your-slug-here</strong>). Use only lowercase letters, numbers, and hyphens.
          </p>
          <Input
            value={formData.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            placeholder="job-title-slug"
          />
          {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Organization</label>
          <select
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.organizationId}
            onChange={(e) => {
              const selectedOrg = organizations.find(o => o._id === e.target.value);
              setFormData(prev => ({
                ...prev,
                organizationId: e.target.value,
                organization: selectedOrg ? selectedOrg.name : ''
              }));
            }}
          >
            <option value="">Select an organization</option>
            {organizations.map(org => (
              <option key={org._id} value={org._id}>{org.name}</option>
            ))}
          </select>
          {errors.organization && <p className="text-red-500 text-sm mt-1">{errors.organization}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <Input
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Enter job location"
          />
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Qualification</label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.qualification}
            onChange={(e) => handleChange('qualification', e.target.value)}
          >
            {Object.values(QualificationLevel).map((level) => (
              <option key={level} value={level}>
                {level.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Experience Level</label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.experience}
            onChange={(e) => handleChange('experience', e.target.value)}
          >
            {Object.values(ExperienceLevel).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Salary</label>
          <Input
            value={formData.salary}
            onChange={(e) => handleChange('salary', e.target.value)}
            placeholder="e.g., 120000 USD"
          />
          {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Last Date to Apply</label>
          <Input
            type="datetime-local"
            value={formData.lastDate}
            onChange={(e) => handleChange('lastDate', e.target.value)}
          />
          {errors.lastDate && <p className="text-red-500 text-sm mt-1">{errors.lastDate}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Apply Link</label>
        <Input
          value={formData.applyLink}
          onChange={(e) => handleChange('applyLink', e.target.value)}
          placeholder="https://example.com/apply"
        />
        {errors.applyLink && <p className="text-red-500 text-sm mt-1">{errors.applyLink}</p>}
      </div>
      <div className="rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-1">Structured content</h3>
        <p className="text-sm text-gray-500 mb-3">Build the page from typed blocks (tables, steps, links, FAQ). Shown before the free-form content below.</p>
        <SectionsEditor value={formData.sections} onChange={(v) => handleChange('sections', v)} postType={formData.type} />
      </div>


      <div>
        <label className="block text-sm font-medium mb-2">Detailed Content (HTML)</label>
        <div className="space-y-2">
          <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="w-full">
                Open HTML Editor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full w-full h-screen p-0 gap-0">
              <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
                <DialogTitle>HTML Editor</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditorOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogHeader>
              <div className="grid grid-cols-2 h-[calc(100vh-4rem)]">
                <div className="h-full border-r">
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    value={htmlCode}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
                <div className="h-full">
                  <iframe
                    srcDoc={htmlCode}
                    title="preview"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Textarea
            value={formData.htmlContent}
            onChange={(e) => handleChange('htmlContent', e.target.value)}
            placeholder="Enter HTML content for the job posting"
            className="min-h-[200px] font-mono"
          />
          {errors.htmlContent && <p className="text-red-500 text-sm mt-1">{errors.htmlContent}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Job Description</label>
        <RichTextEditor
          value={formData.description}
          onChange={(val) => handleChange('description', val)}
          placeholder="Enter detailed job description"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Eligibility Criteria</label>
        <RichTextEditor
          value={formData.eligibility}
          onChange={(val) => handleChange('eligibility', val)}
          placeholder="Enter eligibility criteria"
        />
        {errors.eligibility && <p className="text-red-500 text-sm mt-1">{errors.eligibility}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Total Vacancy</label>
          <Input
            value={formData.totalVacancy}
            onChange={(e) => handleChange('totalVacancy', e.target.value)}
            placeholder="e.g., 2"
          />
          {errors.totalVacancy && <p className="text-red-500 text-sm mt-1">{errors.totalVacancy}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Age Limit (Optional)</label>
          <Input
            value={formData.ageLimit}
            onChange={(e) => handleChange('ageLimit', e.target.value)}
            placeholder="e.g., 25-45"
          />
          {errors.ageLimit && <p className="text-red-500 text-sm mt-1">{errors.ageLimit}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Important Dates</h3>
        {formData.importantDates.map((date, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Label</label>
              <Input
                value={date.label}
                onChange={(e) => handleImportantDateChange(index, 'label', e.target.value)}
                placeholder="e.g., Application Deadline"
              />
              {errors[`importantDates.${index}.label` as keyof JobFormData] && (
                <p className="text-red-500 text-sm mt-1">
                  {errors[`importantDates.${index}.label` as keyof JobFormData]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="datetime-local"
                value={date.date}
                onChange={(e) => handleImportantDateChange(index, 'date', e.target.value)}
              />
              {errors[`importantDates.${index}.date` as keyof JobFormData] && (
                <p className="text-red-500 text-sm mt-1">
                  {errors[`importantDates.${index}.date` as keyof JobFormData]}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => removeImportantDate(index)}
              className="mt-2"
            >
              Remove Date
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addImportantDate}
        >
          Add Important Date
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">SEO Information</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Meta Title</label>
          <p className="text-xs text-gray-500 mb-2">
            The title that appears in Google search results and browser tabs. Keep it under 60 characters for best SEO.
          </p>
          <Input
            value={formData.metaTitle}
            onChange={(e) => handleChange('metaTitle', e.target.value)}
            placeholder="Enter meta title for SEO"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Meta Description</label>
          <p className="text-xs text-gray-500 mb-2">
            A short summary of the job that appears below the title in search results. Keep it between 150-160 characters.
          </p>
          <Textarea
            value={formData.metaDescription}
            onChange={(e) => handleChange('metaDescription', e.target.value)}
            placeholder="Enter meta description for SEO"
            className="min-h-[100px]"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">States</label>
        <p className="text-xs text-gray-500 mb-2">Comma separated (e.g. Bihar, Uttar Pradesh, All India). Powers the "jobs in state" pages.</p>
        <Input value={formData.states} onChange={(e) => handleChange('states', e.target.value)} placeholder="Bihar, Jharkhand" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Canonical URL <span className="text-gray-400 font-normal">(optional)</span></label>
          <Input value={formData.canonicalUrl} onChange={(e) => handleChange('canonicalUrl', e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Social share image <span className="text-gray-400 font-normal">(optional)</span></label>
          <Input value={formData.ogImage} onChange={(e) => handleChange('ogImage', e.target.value)} placeholder="https://…/image.jpg" />
        </div>
      </div>

      <div className="rounded-lg border p-4 bg-white">
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Google preview</p>
        <p className="text-blue-700 text-lg leading-snug truncate">{(formData.metaTitle || formData.title || 'Page title').slice(0, 70)}</p>
        <p className="text-green-700 text-sm truncate">yoursite.com › {formData.type || 'type'} › {formData.slug || 'slug'}</p>
        <p className="text-sm text-gray-600 line-clamp-2">{formData.metaDescription || formData.description || 'Meta description appears here.'}</p>
        <p className={`text-xs mt-2 ${(formData.metaTitle || formData.title).length > 60 ? 'text-orange-600' : 'text-gray-400'}`}>
          Title {(formData.metaTitle || formData.title).length}/60 · Description {(formData.metaDescription || '').length}/160
        </p>
      </div>


      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <p className="text-xs text-gray-500 mb-2">
          Keywords related to the job. Type a word and type a comma (,) to separate multiple tags. Example: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">government, bihar, inspector</span>
        </p>
        <Input
          value={tagInput}
          onChange={(e) => {
            setTagInput(e.target.value);
            handleChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean));
          }}
          placeholder="e.g., government, bihar, inspector"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-base font-medium">Active Status</label>
          <div className="text-sm text-muted-foreground">
            Set whether this job posting is active or not
          </div>
        </div>
        <Switch
          disabled={true}
          checked={true}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-base font-medium">Show in Bulletin</label>
          <div className="text-sm text-muted-foreground">
            Feature this job on the homepage's Latest Bulletin & Announcements section
          </div>
        </div>
        <Switch
          checked={formData.isBulletin}
          onCheckedChange={(checked) => handleChange('isBulletin', checked)}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Job Type <span className="text-red-500">*</span></label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={formData.categoryId || ''}
          onChange={e => {
            const selectedCat = categories.find(c => c._id === e.target.value);
            setFormData(prev => ({
              ...prev,
              categoryId: e.target.value,
              type: selectedCat ? selectedCat.slug : ''
            }));
          }}
          required
        >
          <option value="">Select a Job Type</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>{category.name}</option>
          ))}
        </select>
        {errors.type && <div className="text-red-500 text-sm">{errors.type}</div>}
      </div>

      {job && revisions.length > 0 && (
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-medium">Revision history ({revisions.length})</summary>
          <ul className="mt-3 divide-y text-sm">
            {revisions.map((r) => (
              <li key={r._id} className="py-2 flex items-center justify-between gap-3">
                <span>
                  <strong>v{r.version}</strong> · {new Date(r.createdAt).toLocaleString()}
                  {r.editorName ? ` · ${r.editorName}` : ''}{r.note ? ` · ${r.note}` : ''}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => restoreRevision(r._id, r.version)}>Restore</Button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
        </Button>
      </div>
    </form>
  );
} 