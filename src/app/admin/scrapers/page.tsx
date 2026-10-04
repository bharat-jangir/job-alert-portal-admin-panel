'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot, PlusCircle, Play, Pencil, Trash2, Globe, CheckCircle2,
  XCircle, AlertCircle, RefreshCw, Layers, ExternalLink
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface ScraperConfig {
  _id: string;
  sourceName: string;
  targetUrl: string;
  listItemSelector: string;
  linkSelector: string;
  isActive: boolean;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'partial' | 'failed';
  lastRunNote?: string;
}

interface RunResult {
  found: number;
  created: number;
  skipped: number;
  errors: string[];
}

export default function AdminScrapersPage() {
  const [configs, setConfigs] = useState<ScraperConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [runResult, setRunResult] = useState<{ id: string; data: RunResult } | null>(null);

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/scraper-configs');
      const payload = res.data?.data ?? res.data;
      setConfigs(Array.isArray(payload) ? payload : []);
    } catch {
      setError('Failed to load scraper configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const runScraper = async (id: string, sourceName: string) => {
    setRunningId(id);
    setRunResult(null);
    toast.info(`Starting scrape for ${sourceName}...`);

    try {
      const res = await api.post(`/scraper/run/${id}`);
      const result: RunResult = res.data?.data ?? res.data;
      setRunResult({ id, data: result });

      if (result.created > 0) {
        toast.success(`Successfully created ${result.created} draft job(s)!`);
      } else {
        toast.info(`Scraped ${result.found} items: ${result.skipped} skipped (already exist), ${result.created} created.`);
      }

      fetchConfigs();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Scrape run failed';
      toast.error(`Error running scraper: ${msg}`);
      setError(`Run failed for ${sourceName}: ${msg}`);
    } finally {
      setRunningId(null);
    }
  };

  const deleteConfig = async (id: string, sourceName: string) => {
    if (!confirm(`Delete scraper config for "${sourceName}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/scraper-configs/${id}`);
      setConfigs((prev) => prev.filter((c) => c._id !== id));
      toast.success('Scraper configuration deleted');
    } catch {
      toast.error('Failed to delete scraper config');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3" /> Success
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Partial
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            Never Run
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Web Scrapers Management</h1>
            <p className="text-sm text-gray-500">
              Configure target websites and triggers to extract raw job posts as reviewable drafts (`isActive: false`).
            </p>
          </div>
        </div>
        <Link
          href="/admin/scrapers/create"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shadow-sm"
        >
          <PlusCircle className="h-4 w-4" /> Add New Target Source
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="underline text-xs font-semibold">Dismiss</button>
        </div>
      )}

      {/* Run Result Alert Box */}
      {runResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> Scrape Execution Summary
            </h3>
            <button onClick={() => setRunResult(null)} className="text-xs text-blue-700 underline">Close</button>
          </div>
          <div className="flex gap-4 text-xs font-medium text-blue-800">
            <span>Items Found: <strong>{runResult.data.found}</strong></span>
            <span>Drafts Created: <strong className="text-green-700">{runResult.data.created}</strong></span>
            <span>Skipped (Duplicates): <strong>{runResult.data.skipped}</strong></span>
            <span>Errors: <strong className={runResult.data.errors.length > 0 ? "text-red-600" : ""}>{runResult.data.errors.length}</strong></span>
          </div>
          {runResult.data.errors.length > 0 && (
            <div className="mt-2 bg-white rounded p-2 text-xs text-red-600 max-h-24 overflow-y-auto space-y-1 border border-red-100">
              {runResult.data.errors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
          <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 text-lg mb-1">No Scraper Configurations Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Configure target portal URLs (e.g. SSC, UPSC, State PSCs) and CSS selectors to automate draft creation.
          </p>
          <Link
            href="/admin/scrapers/create"
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <PlusCircle className="h-4 w-4" /> Add First Scraper Source
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Source Name</th>
                <th className="px-6 py-3.5">Target URL</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5">Last Run</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configs.map((config) => {
                const isRunning = runningId === config._id;

                return (
                  <tr key={config._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {config.sourceName}
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        Item: `{config.listItemSelector}` | Link: `{config.linkSelector}`
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <a
                        href={config.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <span className="truncate">{config.targetUrl}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(config.lastRunStatus)}
                    </td>
                    <td className="px-6 py-4">
                      {config.lastRunAt ? (
                        <div>
                          <div className="text-xs font-medium text-gray-700">
                            {new Date(config.lastRunAt).toLocaleString()}
                          </div>
                          {config.lastRunNote && (
                            <div className="text-[11px] text-gray-400 truncate max-w-xs" title={config.lastRunNote}>
                              {config.lastRunNote}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => runScraper(config._id, config.sourceName)}
                          disabled={isRunning}
                          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition disabled:opacity-50"
                        >
                          {isRunning ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                          {isRunning ? 'Scraping...' : 'Run Now'}
                        </button>

                        <Link
                          href={`/admin/scrapers/${config._id}/edit`}
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Config"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => deleteConfig(config._id, config.sourceName)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Config"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
