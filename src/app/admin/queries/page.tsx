'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, Inbox, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ContactQuery {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'New' | 'In Progress' | 'Resolved';
  createdAt: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminQueriesPage() {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const res = await fetch(`${API}/api/contact`);
      const result = await res.json();
      const payload = result.data ?? result;
      setQueries(Array.isArray(payload) ? payload : []);
    } catch {
      setError('Failed to fetch queries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setActionId(id);
    try {
      const res = await fetch(`${API}/api/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      const updated = result.data ?? result;
      setQueries((prev) => prev.map((q) => q._id === id ? updated : q));
    } catch {
      setError('Failed to update status');
    } finally {
      setActionId(null);
    }
  };

  const deleteQuery = async (id: string) => {
    if (!confirm('Are you sure you want to delete this query?')) return;
    setActionId(id + 'del');
    try {
      await fetch(`${API}/api/contact/${id}`, { method: 'DELETE' });
      setQueries((prev) => prev.filter((q) => q._id !== id));
    } catch {
      setError('Failed to delete query');
    } finally {
      setActionId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs font-medium"><Inbox className="w-3 h-3" /> New</span>;
      case 'In Progress':
        return <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'Resolved':
        return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" /> Resolved</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Queries</h1>
          <p className="text-sm text-gray-500">Manage contact form submissions</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : queries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Mail className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">No queries yet</h3>
          <p className="text-sm text-gray-400">When users contact you, their messages will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {queries.map((query) => (
              <div key={query._id} className="p-5 flex flex-col lg:flex-row gap-6 hover:bg-gray-50 transition-colors">
                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(query.status)}
                    <span className="text-xs text-gray-400">
                      {new Date(query.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{query.subject}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <span className="font-medium text-gray-700">{query.name}</span>
                    <span>&bull;</span>
                    <a href={`mailto:${query.email}`} className="text-blue-600 hover:underline">{query.email}</a>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 border border-gray-100">
                    <p className="whitespace-pre-wrap">{query.message}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:w-48 flex flex-col gap-2 justify-start shrink-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Update Status</p>
                  <select
                    value={query.status}
                    onChange={(e) => updateStatus(query._id, e.target.value)}
                    disabled={actionId === query._id}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  
                  <button
                    onClick={() => deleteQuery(query._id)}
                    disabled={actionId === query._id + 'del'}
                    className="mt-auto w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
