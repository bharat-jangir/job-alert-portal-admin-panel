'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';

export default function AccountPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast.error('New passwords do not match');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed');
      setCurrent(''); setNew(''); setConfirm('');
    } catch (err: any) {
      const m = err?.response?.data?.error?.message ?? err?.response?.data?.message;
      toast.error(m ? (Array.isArray(m) ? m.join(', ') : String(m)) : 'Could not change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My account</h1>
      <div className="bg-white rounded-lg shadow p-4 text-sm">
        <div><span className="text-gray-500">Name:</span> {user?.name || '-'}</div>
        <div><span className="text-gray-500">Email:</span> {user?.email}</div>
        <div><span className="text-gray-500">Role:</span> {user?.role}</div>
      </div>
      <form onSubmit={submit} className="bg-white rounded-lg shadow p-4 space-y-3">
        <h2 className="font-semibold">Change password</h2>
        <Input type="password" required placeholder="Current password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        <Input type="password" required minLength={8} placeholder="New password (min 8 characters)" value={newPassword} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" />
        <Input type="password" required minLength={8} placeholder="Repeat new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</Button>
      </form>
    </div>
  );
}
