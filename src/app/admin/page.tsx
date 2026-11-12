'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Eye, FileEdit, Mail, MousePointerClick, Send, Clock } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth, AdminRole } from '@/lib/auth-context';

interface Stats {
  posts: { total: number; published: number; draft: number; review: number; scheduled: number; archived: number };
  byType: { type: string; count: number }[];
  totalViews: number;
  totalApplyClicks: number;
  recent: { _id: string; title: string; type: string; status: string; updatedAt: string }[];
  pendingReview: { _id: string; title: string; type: string; updatedAt: string }[];
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function AdminDashboard() {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [newQueries, setNewQueries] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/jobs/stats').then((r) => setStats(r.data?.data)).catch(() => setError('Could not load stats'));
    if (hasPermission([AdminRole.EDITOR])) {
      api.get('/contact').then((r) => setNewQueries((r.data?.data ?? []).filter((q: any) => q.status === 'New').length)).catch(() => {});
    }
  }, [hasPermission]);

  const tiles = stats
    ? [
        { label: 'Published', value: stats.posts.published, icon: Briefcase, href: '/admin/jobs' },
        { label: 'Drafts', value: stats.posts.draft, icon: FileEdit, href: '/admin/jobs' },
        { label: 'Awaiting review', value: stats.posts.review, icon: Send, href: '/admin/jobs' },
        { label: 'Scheduled', value: stats.posts.scheduled, icon: Clock, href: '/admin/jobs' },
        { label: 'Total page views', value: stats.totalViews, icon: Eye },
        { label: 'Apply clicks', value: stats.totalApplyClicks, icon: MousePointerClick },
        ...(newQueries !== null ? [{ label: 'New queries', value: newQueries, icon: Mail, href: '/admin/queries' }] : []),
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/admin/jobs/create" className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">+ New post</Link>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!stats && !error && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((t) => {
              const card = (
                <Card className={t.href ? 'hover:shadow-md transition' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.label}</CardTitle>
                    <t.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold">{fmt(t.value)}</div></CardContent>
                </Card>
              );
              return t.href ? <Link key={t.label} href={t.href}>{card}</Link> : <div key={t.label}>{card}</div>;
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Needs review</CardTitle></CardHeader>
              <CardContent>
                {stats.pendingReview.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {stats.pendingReview.map((p) => (
                      <li key={p._id} className="py-2 flex justify-between gap-2">
                        <Link href={`/admin/jobs/${p._id}/edit`} className="text-blue-600 hover:underline truncate">{p.title}</Link>
                        <span className="text-gray-400 shrink-0">{p.type}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Recently edited</CardTitle></CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {stats.recent.map((p) => (
                    <li key={p._id} className="py-2 flex justify-between gap-2">
                      <Link href={`/admin/jobs/${p._id}/edit`} className="text-blue-600 hover:underline truncate">{p.title}</Link>
                      <span className="text-gray-400 shrink-0 capitalize">{p.status}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Published by type</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.byType.map((t) => (
                  <div key={t.type} className="flex items-center gap-3 text-sm">
                    <span className="w-32 text-gray-600">{t.type}</span>
                    <div className="flex-1 bg-gray-100 rounded h-2">
                      <div className="bg-blue-500 h-2 rounded" style={{ width: `${(t.count / Math.max(...stats.byType.map((x) => x.count))) * 100}%` }} />
                    </div>
                    <span className="w-10 text-right font-medium">{t.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
