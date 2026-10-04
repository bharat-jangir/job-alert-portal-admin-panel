'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Bot, HelpCircle, Code2, Check } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function CreateScraperPage() {
  const router = useRouter();
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
    applyLinkSelector: 'a[href*="apply"], a.apply-btn',
  });

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
      await api.post('/scraper-configs', payload);
      toast.success('Scraper configuration created successfully!');
      router.push('/admin/scrapers');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create scraper config';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className="text-xl font-bold text-gray-900">Add New Scraper Source</h1>
            <p className="text-xs text-gray-500">Configure target URL and CSS selectors for automated draft generation.</p>
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
                placeholder="e.g. SSC CGL Official Notifications"
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
                placeholder="https://ssc.gov.in/notifications"
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
                placeholder="table.notifications-table tr or ul.news-list li"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">CSS selector targeting each row/card on the listing page.</p>
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
                placeholder="a or td.link-col a"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">Selector inside each list item to find the detail page link (`href`).</p>
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
                placeholder="h1.post-title or .heading"
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
                placeholder=".org-name or span.dept"
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
                placeholder=".eligibility-box or #eligibility"
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
                placeholder="table.dates-table"
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
                placeholder="a[href*='apply'], a.apply-btn"
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
            {submitting ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
