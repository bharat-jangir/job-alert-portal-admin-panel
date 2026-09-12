'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Pencil, Trash2, PlusCircle,
  Eye, EyeOff, Building2,
} from 'lucide-react';

interface Organization {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(`${API}/api/organizations`);
      const result = await res.json();
      const payload = result.data ?? result;
      setOrganizations(Array.isArray(payload) ? payload : []);
    } catch {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrganizations(); }, []);

  const toggleActive = async (org: Organization) => {
    setActionId(org._id + 'toggle');
    try {
      const res = await fetch(`${API}/api/organizations/${org._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !org.isActive }),
      });
      const result = await res.json();
      const updated = result.data ?? result;
      setOrganizations((prev) => prev.map((o) => o._id === updated._id ? updated : o));
    } catch {
      setError('Failed to toggle');
    } finally {
      setActionId(null);
    }
  };

  const deleteOrganization = async (id: string) => {
    if (!confirm('Delete this Organization? This cannot be undone.')) return;
    setActionId(id + 'del');
    try {
      await fetch(`${API}/api/organizations/${id}`, { method: 'DELETE' });
      setOrganizations((prev) => prev.filter((o) => o._id !== id));
    } catch {
      setError('Failed to delete');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organizations Management</h1>
            <p className="text-sm text-gray-500">Manage organizations linked to job postings</p>
          </div>
        </div>
        <Link
          href="/admin/organizations/create"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <PlusCircle className="h-4 w-4" /> Add Organization
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Toggle visibility</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">No Organizations yet</h3>
          <p className="text-sm text-gray-400 mb-4">Create your first organization.</p>
          <Link href="/admin/organizations/create" className="inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + Add First Organization
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-6">Name</div>
            <div className="col-span-3">Slug</div>
            <div className="col-span-1 text-center">Active</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          <div className="divide-y divide-gray-100">
            {organizations.map((org) => {
              const busy = actionId !== null;

              return (
                <div
                  key={org._id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors ${org.isActive ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-70'}`}
                >
                  {/* Name */}
                  <div className="col-span-6">
                    <p className="text-sm font-medium text-gray-800 leading-snug">{org.name}</p>
                    {org.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{org.description}</p>}
                  </div>

                  {/* Slug */}
                  <div className="col-span-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {org.slug}
                    </span>
                  </div>

                  {/* Active toggle */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => toggleActive(org)}
                      disabled={busy}
                      title={org.isActive ? 'Active – click to hide' : 'Hidden – click to show'}
                      className={`transition ${org.isActive ? 'text-green-500 hover:text-red-400' : 'text-gray-300 hover:text-green-500'}`}
                    >
                      {org.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Edit / Delete */}
                  <div className="col-span-2 flex justify-center items-center gap-1">
                    <Link
                      href={`/admin/organizations/${org._id}/edit`}
                      className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => deleteOrganization(org._id)}
                      disabled={busy}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400 text-center">
        {organizations.length} Organization{organizations.length !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}
