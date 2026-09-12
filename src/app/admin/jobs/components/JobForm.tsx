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
import Editor from '@monaco-editor/react';

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
  });

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

    // No required or length validations

    // Format validations
    if (formData.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens)';
    }

    if (formData.salary && !/^[0-9]+(\.[0-9]+)?\s*[A-Z]{3}$/.test(formData.salary)) {
      newErrors.salary = 'Salary must be a number followed by currency code (e.g., "50000 USD")';
    }

    if (formData.applyLink && !/^https?:\/\/.+/.test(formData.applyLink)) {
      newErrors.applyLink = 'Must be a valid URL';
    }

    if (formData.totalVacancy && !/^\d+$/.test(formData.totalVacancy)) {
      newErrors.totalVacancy = 'Total vacancy must be a number';
    }

    if (formData.ageLimit && !/^\d+-\d+$/.test(formData.ageLimit)) {
      newErrors.ageLimit = 'Age limit must be in format "min-max" (e.g., "18-35")';
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
      const formattedData = {
        ...formData,
        lastDate: formData.lastDate && !isNaN(new Date(formData.lastDate).getTime())
          ? new Date(formData.lastDate).toISOString()
          : '',
        importantDates: formData.importantDates.map(date => ({
          ...date,
          date: date.date && !isNaN(new Date(date.date).getTime())
            ? new Date(date.date).toISOString()
            : ''
        }))
      };

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
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Job Title</label>
          <Input
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter job title"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">URL Slug</label>
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

      <div>
        <label className="block text-sm font-medium mb-2">HTML Content</label>
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
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter detailed job description"
          className="min-h-[150px]"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Eligibility Criteria</label>
        <Textarea
          value={formData.eligibility}
          onChange={(e) => handleChange('eligibility', e.target.value)}
          placeholder="Enter eligibility criteria"
          className="min-h-[100px]"
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
          <label className="block text-sm font-medium mb-2">Meta Title</label>
          <Input
            value={formData.metaTitle}
            onChange={(e) => handleChange('metaTitle', e.target.value)}
            placeholder="Enter meta title for SEO"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Meta Description</label>
          <Textarea
            value={formData.metaDescription}
            onChange={(e) => handleChange('metaDescription', e.target.value)}
            placeholder="Enter meta description for SEO"
            className="min-h-[100px]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <Input
          value={formData.tags.join(', ')}
          onChange={(e) => handleChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
          placeholder="Enter tags separated by commas"
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
        <label className="block mb-1 font-medium">Job Type</label>
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