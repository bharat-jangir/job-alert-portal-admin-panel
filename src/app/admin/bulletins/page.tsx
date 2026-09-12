'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Megaphone, ExternalLink, XCircle } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  slug: string;
  isBulletin: boolean;
  type: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminBulletinsPage() {
  const [bulletins, setBulletins] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchBulletins = async () => {
    try {
      const res = await fetch(`${API}/api/jobs/bulletins`);
      const result = await res.json();
      const payload = result.data ?? result;
      setBulletins(Array.isArray(payload) ? payload : []);
    } catch {
      setError('Failed to load bulletins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBulletins(); }, []);

  const removeFromBulletin = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`${API}/api/jobs/bulletins/${id}/toggle`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to toggle');
      setBulletins((prev) => prev.filter((j) => j._id !== id));
    } catch {
      setError('Failed to remove from bulletin');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulletin Management</h1>
            <p className="text-sm text-gray-500">Manage the announcements featured on the homepage</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
        </div>
      ) : bulletins.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Megaphone className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">No Bulletins Active</h3>
          <p className="text-sm text-gray-400 mb-4">Edit a job and toggle 'Show in Bulletin' to feature it here.</p>
          <Link href="/admin/jobs" className="inline-block bg-orange-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-700 transition">
            Go to Jobs
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-8">Job Title</div>
            <div className="col-span-2 text-center">Type</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          <div className="divide-y divide-gray-100">
            {bulletins.map((job) => {
              const busy = actionId === job._id;

              return (
                <div key={job._id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition-colors">
                  {/* Title */}
                  <div className="col-span-8">
                    <p className="text-sm font-medium text-gray-800 leading-snug">{job.title}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {job.slug}
                    </span>
                  </div>

                  {/* Type */}
                  <div className="col-span-2 flex justify-center">
                    <span className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                      {job.type}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-center items-center gap-2">
                    <Link
                      href={`/jobs/${job.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </Link>
                    <button
                      onClick={() => removeFromBulletin(job._id)}
                      disabled={busy}
                      className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded transition disabled:opacity-50"
                      title="Remove from Bulletin"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400 text-center">
        {bulletins.length} Active Bulletin{bulletins.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
