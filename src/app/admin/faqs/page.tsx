'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronUp, ChevronDown, Pencil, Trash2, PlusCircle,
  Eye, EyeOff, GripVertical, HelpCircle,
} from 'lucide-react';

interface Faq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchFaqs = async () => {
    try {
      const res = await fetch(`${API}/api/faqs`);
      const result = await res.json();
      const payload = result.data ?? result;
      setFaqs(Array.isArray(payload) ? payload : []);
    } catch {
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const move = async (id: string, dir: 'move-up' | 'move-down') => {
    setActionId(id + dir);
    try {
      const res = await fetch(`${API}/api/faqs/${id}/${dir}`, { method: 'PATCH' });
      const result = await res.json();
      const payload = result.data ?? result;
      setFaqs(Array.isArray(payload) ? payload : []);
    } catch {
      setError('Failed to reorder');
    } finally {
      setActionId(null);
    }
  };

  const toggleActive = async (faq: Faq) => {
    setActionId(faq._id + 'toggle');
    try {
      const res = await fetch(`${API}/api/faqs/${faq._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !faq.isActive }),
      });
      const result = await res.json();
      const updated = result.data ?? result;
      setFaqs((prev) => prev.map((f) => f._id === updated._id ? updated : f));
    } catch {
      setError('Failed to toggle');
    } finally {
      setActionId(null);
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ? This cannot be undone.')) return;
    setActionId(id + 'del');
    try {
      await fetch(`${API}/api/faqs/${id}`, { method: 'DELETE' });
      setFaqs((prev) => prev.filter((f) => f._id !== id));
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
          <HelpCircle className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
            <p className="text-sm text-gray-500">Use ▲ ▼ arrows to change display order on the public FAQ page</p>
          </div>
        </div>
        <Link
          href="/admin/faqs/create"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <PlusCircle className="h-4 w-4" /> Add FAQ
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error} <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><GripVertical className="h-3 w-3" /> Order</span>
        <span className="flex items-center gap-1"><ChevronUp className="h-3 w-3" /><ChevronDown className="h-3 w-3" /> Move</span>
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Toggle visibility</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <HelpCircle className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">No FAQs yet</h3>
          <p className="text-sm text-gray-400 mb-4">Create your first FAQ to display on the public page.</p>
          <Link href="/admin/faqs/create" className="inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + Add First FAQ
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">Question</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1 text-center">Active</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          <div className="divide-y divide-gray-100">
            {faqs.map((faq, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === faqs.length - 1;
              const busy = actionId !== null;

              return (
                <div
                  key={faq._id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-start transition-colors ${faq.isActive ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-70'}`}
                >
                  {/* Order number + move buttons */}
                  <div className="col-span-1 flex flex-col items-center gap-0.5 pt-0.5">
                    <button
                      disabled={isFirst || busy}
                      onClick={() => move(faq._id, 'move-up')}
                      className="text-gray-400 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition p-0.5"
                      title="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold text-gray-400 leading-none">{faq.order}</span>
                    <button
                      disabled={isLast || busy}
                      onClick={() => move(faq._id, 'move-down')}
                      className="text-gray-400 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition p-0.5"
                      title="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Question + answer preview */}
                  <div className="col-span-6">
                    <p className="text-sm font-medium text-gray-800 leading-snug">{faq.question}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{faq.answer}</p>
                  </div>

                  {/* Category */}
                  <div className="col-span-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {faq.category || 'General'}
                    </span>
                  </div>

                  {/* Active toggle */}
                  <div className="col-span-1 flex justify-center pt-1">
                    <button
                      onClick={() => toggleActive(faq)}
                      disabled={busy}
                      title={faq.isActive ? 'Active – click to hide' : 'Hidden – click to show'}
                      className={`transition ${faq.isActive ? 'text-green-500 hover:text-red-400' : 'text-gray-300 hover:text-green-500'}`}
                    >
                      {faq.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Edit / Delete */}
                  <div className="col-span-2 flex justify-center items-center gap-1 pt-0.5">
                    <Link
                      href={`/admin/faqs/${faq._id}/edit`}
                      className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => deleteFaq(faq._id)}
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
        {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''} total · {faqs.filter((f) => f.isActive).length} visible on public page
      </p>
    </div>
  );
}
