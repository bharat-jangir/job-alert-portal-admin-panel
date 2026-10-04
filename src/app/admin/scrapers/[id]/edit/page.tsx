'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Bot, Code2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function EditScraperPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    sourceName: '',
    targetUrl: '',
    listItemSelector: '',
    linkSelector: 'a',
    isActive: true,
    titleSelector: 'h1',
    organizationSelector: '',
    eligibilitySelector: '',
    importantDatesSelector: '',
    applyLinkSelector: '',
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/scraper-configs');
        const payload = res.data?.data ?? res.data;
        const config = Array.isArray(payload) ? payload.find((c: any) => c._id === resolvedParams.id) : null;

        if (!config) {
          setError('Scraper configuration not found');
          return;
        }

        setFormData({
          sourceName: config.sourceName || '',
          targetUrl: config.targetUrl || '',
          listItemSelector: config.listItemSelector || '',
          linkSelector: config.linkSelector || 'a',
          isActive: config.isActive ?? true,
          titleSelector: config.fields?.title?.selector || 'h1',
          organizationSelector: config.fields?.organization?.selector || '',
          eligibilitySelector: config.fields?.eligibility?.selector || '',
          importantDatesSelector: config.fields?.importantDatesContainer?.selector || '',
          applyLinkSelector: config.fields?.applyLink?.selector || '',
        });
      } catch {
        setError('Failed to fetch scraper config details');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [resolvedParams.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      sourceName: formData.sourceName,
      targetUrl: formData.targetUrl,
      listItemSelector: formData.listItemSelector,
      linkSelector: formData.linkSelector,
      isActive: formData.isActive,
      fields: {
        title: { selector: formData.titleSelector, extract: 'text' },
        ...(formData.organizationSelector && {
          organization: { selector: formData.organizationSelector, extract: 'text' },
        }),
        ...(formData.eligibilitySelector && {
          eligibility: { selector: formData.eligibilitySelector, extract: 'text' },
        }),
        ...(formData.importantDatesSelector && {
          importantDatesContainer: { selector: formData.importantDatesSelector, extract: 'text' },
        }),
        ...(formData.applyLinkSelector && {
          applyLink: { selector: formData.applyLinkSelector, extract: 'attr', attrName: 'href' },
        }),
      },
    };

    try {
      await api.patch(`/scraper-configs/${resolvedParams.id}`, payload);
      toast.success('Scraper configuration updated successfully!');
      router.push('/admin/scrapers');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update scraper config';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/scrapers"
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Scraper Source</h1>
            <p className="text-xs text-gray-500">Update target URL and CSS selectors for {formData.sourceName}.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Source Identification */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" /> Target Source Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Source Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sourceName"
                value={formData.sourceName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Target Listing URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="targetUrl"
                value={formData.targetUrl}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Listing Parsing Rules */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-600" /> Listing Page Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                List Item CSS Selector <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="listItemSelector"
                value={formData.listItemSelector}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Detail Page Link Selector <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="linkSelector"
                value={formData.linkSelector}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Detail Page Field Selectors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Code2 className="w-4 h-4 text-green-600" /> Detail Page Field Selectors
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Title Selector <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="titleSelector"
                value={formData.titleSelector}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Organization Selector (Optional)
              </label>
              <input
                type="text"
                name="organizationSelector"
                value={formData.organizationSelector}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Eligibility Selector (Optional)
              </label>
              <input
                type="text"
                name="eligibilitySelector"
                value={formData.eligibilitySelector}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Important Dates Table Selector (Optional)
              </label>
              <input
                type="text"
                name="importantDatesSelector"
                value={formData.importantDatesSelector}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Apply Link Selector (Optional)
              </label>
              <input
                type="text"
                name="applyLinkSelector"
                value={formData.applyLinkSelector}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/admin/scrapers"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Updating...' : 'Update Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
