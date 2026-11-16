'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Play, RefreshCw, CheckCircle2, AlertCircle, Clock, Globe } from 'lucide-react';

interface RunResult {
  adapter: string;
  discovered: number;
  processed: number;
  autoPublished: number;
  heldForReview: number;
  updated: number;
  unchanged: number;
  failed: number;
  errors: string[];
}

interface CrawlerStats {
  total: number;
  inReview: number;
  published: number;
  discovered: number;
  failed: number;
  autoPublished24h: number;
  running: boolean;
  lastRun?: { startedAt: string; finishedAt?: string; results: RunResult[]; error?: string };
  config: { autoPublish: boolean; scheduler: boolean; minConfidence: number; dailyCap: number };
  needsAttention: Array<{
    _id: string;
    url: string;
    title: string;
    status: string;
    reasons: string[];
    job?: { _id: string; title: string; status: string };
  }>;
  recent: Array<{
    _id: string;
    url: string;
    title: string;
    status: string;
    adapterKey: string;
    updatedAt: string;
    jobId?: {
      _id: string;
      title: string;
      slug: string;
      status: string;
    };
  }>;
  registeredAdapters: Array<{ key: string; name: string }>;
}

export function AutoDiscoveryBar({ onJobsUpdated }: { onJobsUpdated?: () => void }) {
  const [stats, setStats] = useState<CrawlerStats | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [selectedAdapter, setSelectedAdapter] = useState<string>('sarkariresult');
  const [limit, setLimit] = useState<number>(15);
  const [maxAi, setMaxAi] = useState<number>(3);
  const [isOpenDetails, setIsOpenDetails] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchStats().then((st) => { if (st?.running) startPolling(); });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async (): Promise<CrawlerStats | null> => {
    try {
      setIsLoadingStats(true);
      const res = await api.get('/scraper/stats');
      let payload = res.data;
      while (payload?.data && payload.total === undefined) {
        payload = payload.data;
      }
      setStats(payload);
      return payload as CrawlerStats;
    } catch (err) {
      console.warn('Could not fetch crawler stats:', err);
      return null;
    } finally {
      setIsLoadingStats(false);
    }
  };

  /** The crawl runs in the background on the server; poll until it reports it has finished. */
  const startPolling = () => {
    setIsCrawling(true);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const st = await fetchStats();
      if (st && !st.running) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setIsCrawling(false);
        const results = st.lastRun?.results ?? [];
        const sum = (k: keyof RunResult) => results.reduce((n, r) => n + (Number(r[k]) || 0), 0);
        if (st.lastRun?.error) {
          toast.error(`Crawl failed: ${st.lastRun.error}`);
        } else {
          toast.success(
            `Done: ${sum('processed')} new (${sum('autoPublished')} published automatically, ${sum('heldForReview')} held for review), ${sum('updated')} updated, ${sum('unchanged')} unchanged, ${sum('failed')} failed.`,
          );
        }
        if (onJobsUpdated) onJobsUpdated();
      }
    }, 3000);
  };

  const handleRunDiscovery = async () => {
    setIsCrawling(true);
    try {
      await api.post('/scraper/crawl', { adapter: selectedAdapter, limit, maxAiExtract: maxAi });
      toast.info('Crawler started in the background. This can take a few minutes.');
      startPolling();
    } catch (err: any) {
      console.error('Crawler trigger error:', err);
      const m = err.response?.data?.error?.message ?? err.response?.data?.message;
      toast.error(Array.isArray(m) ? m.join(', ') : m || err.message || 'Failed to start auto-discovery.');
      setIsCrawling(false);
    }
  };

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                Automated Post Discovery & Change Detector
              </h3>
              <span className="text-[11px] font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                SarkariResult + Extensible Adapters
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Scrapes sources for newly announced vacancies, results, & admit cards and extracts them with Gemini Flash.
              {stats?.config?.autoPublish ? (
                <> Posts that pass the automatic quality checks are <strong className="text-emerald-700">published automatically</strong>; the rest wait in <strong className="text-amber-700">In Review</strong>.</>
              ) : (
                <> Everything is queued in <strong className="text-amber-700">In Review</strong> (auto-publish is off).</>
              )}
            </p>
            {stats?.config && (
              <p className="text-[11px] text-gray-500 mt-1">
                Auto-publish: <strong className={stats.config.autoPublish ? 'text-emerald-700' : 'text-gray-700'}>{stats.config.autoPublish ? 'ON' : 'OFF'}</strong>
                {' · '}Scheduler: <strong>{stats.config.scheduler ? 'ON' : 'OFF'}</strong>
                {' · '}Published automatically (24h): <strong>{stats.autoPublished24h}</strong>/{stats.config.dailyCap}
                {' · '}Min. confidence: <strong>{stats.config.minConfidence}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Adapter Selection */}
          <select
            value={selectedAdapter}
            onChange={(e) => setSelectedAdapter(e.target.value)}
            disabled={isCrawling}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {(stats?.registeredAdapters || [{ key: 'sarkariresult', name: 'SarkariResult.com' }]).map((ad) => (
              <option key={ad.key} value={ad.key}>
                {ad.name}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            onClick={handleRunDiscovery}
            disabled={isCrawling}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            {isCrawling ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Discover & Ingest Now</span>
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
              setIsOpenDetails(!isOpenDetails);
              if (!isOpenDetails) fetchStats();
            }}
            className="text-xs text-blue-700 hover:text-blue-900 underline font-medium px-2 py-1"
          >
            {isOpenDetails ? 'Hide Activity' : 'View Activity'}
          </button>
        </div>
      </div>

      {/* Activity / Stats Accordion */}
      {isOpenDetails && (
        <div className="mt-4 pt-3 border-t border-blue-200/60 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
            <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
              <span className="text-emerald-700">Published</span>
              <span className="font-bold text-emerald-700">{stats?.published ?? 0}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-orange-100 flex items-center justify-between">
              <span className="text-orange-700">Needs attention</span>
              <span className="font-bold text-orange-700">{stats?.needsAttention?.length ?? 0}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100 flex items-center justify-between">
              <span className="text-gray-500">Tracked URLs</span>
              <span className="font-bold text-gray-900">{stats?.total ?? 0}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100 flex items-center justify-between">
              <span className="text-amber-700">In Review</span>
              <span className="font-bold text-amber-700">{stats?.inReview ?? 0}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100 flex items-center justify-between">
              <span className="text-blue-700">Discovered</span>
              <span className="font-bold text-blue-700">{stats?.discovered ?? 0}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-red-100 flex items-center justify-between">
              <span className="text-red-700">Failed / Retried</span>
              <span className="font-bold text-red-700">{stats?.failed ?? 0}</span>
            </div>
          </div>

          {stats?.needsAttention && stats.needsAttention.length > 0 && (
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-orange-700 uppercase tracking-wider mb-1.5">
                Needs your attention
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {stats.needsAttention.map((n) => (
                  <div key={n._id} className="bg-orange-50 px-2.5 py-1.5 rounded border border-orange-100 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-800 truncate">{n.job?.title ?? n.title}</span>
                      {n.job && (
                        <a href={`/admin/jobs/${n.job._id}/edit`} className="text-blue-600 hover:underline font-semibold shrink-0">
                          Review &rarr;
                        </a>
                      )}
                    </div>
                    <ul className="list-disc pl-4 text-orange-800 mt-0.5">
                      {n.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.recent && stats.recent.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Recently Tracked Source Articles
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {stats.recent.map((rec) => (
                  <div
                    key={rec._id}
                    className="flex items-center justify-between bg-white/90 px-2.5 py-1.5 rounded border border-gray-100 text-[11px]"
                  >
                    <div className="truncate max-w-md pr-2">
                      <span className="font-medium text-gray-800">{rec.title}</span>
                      <a
                        href={rec.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-blue-600 block text-[10px] truncate"
                      >
                        {rec.url}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                          rec.status === 'in_review'
                            ? 'bg-amber-100 text-amber-800'
                            : rec.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {rec.status.replace('_', ' ')}
                      </span>
                      {rec.jobId && (
                        <a
                          href={`/admin/jobs/${rec.jobId._id}/edit`}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Edit Post &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

