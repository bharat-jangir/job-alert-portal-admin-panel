'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, UserPlus } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, AdminRole } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface UserRow { _id: string; name: string; email: string; role: AdminRole; isActive: boolean; createdAt: string }

const ROLES = [
  { value: AdminRole.VIEWER, label: 'Viewer: read only' },
  { value: AdminRole.EDITOR, label: 'Editor: create & edit, submit for review' },
  { value: AdminRole.PUBLISHER, label: 'Publisher: publish, delete, manage content' },
  { value: AdminRole.SUPER_ADMIN, label: 'Super admin: everything incl. users' },
];

const errMsg = (e: any, fallback: string) => {
  const m = e?.response?.data?.error?.message ?? e?.response?.data?.message;
  return m ? (Array.isArray(m) ? m.join(', ') : String(m)) : fallback;
};

function UsersInner() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: AdminRole.EDITOR });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/users');
      setUsers(r.data?.data ?? []);
    } catch (e) {
      toast.error(errMsg(e, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('User created');
      setForm({ name: '', email: '', password: '', role: AdminRole.EDITOR });
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not create user'));
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>, ok: string) => {
    try {
      await api.patch(`/users/${id}`, body);
      toast.success(ok);
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Update failed'));
    }
  };

  const resetPassword = (u: UserRow) => {
    const password = prompt(`New password for ${u.email} (min 8 characters):`);
    if (password) patch(u._id, { password }, 'Password reset');
  };

  const remove = async (u: UserRow) => {
    if (!confirm(`Delete ${u.email}? This cannot be undone. Deactivating is usually better.`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Delete failed'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Users</h1>

      <form onSubmit={create} className="bg-white rounded-lg shadow p-4 grid gap-3 md:grid-cols-5 items-end">
        <div><label className="text-sm font-medium">Name</label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="text-sm font-medium">Email</label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="text-sm font-medium">Password</label><Input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <div>
          <label className="text-sm font-medium">Role</label>
          <select className="w-full p-2 border rounded-md bg-white" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label.split(':')[0]}</option>)}
          </select>
        </div>
        <Button type="submit" disabled={saving}><UserPlus className="h-4 w-4 mr-1" />{saving ? 'Adding…' : 'Add user'}</Button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td className="p-4" colSpan={4}>Loading…</td></tr>
            ) : users.map((u) => {
              const self = u._id === me?.id;
              return (
                <tr key={u._id}>
                  <td className="p-3"><div className="font-medium">{u.name}{self && ' (you)'}</div><div className="text-gray-500">{u.email}</div></td>
                  <td className="p-3">
                    <select
                      className="p-1 border rounded bg-white disabled:opacity-60"
                      value={u.role}
                      disabled={self}
                      onChange={(e) => patch(u._id, { role: e.target.value }, 'Role updated')}
                    >
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label.split(':')[0]}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.isActive ? 'Active' : 'Deactivated'}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => resetPassword(u)}>Reset password</Button>
                      {!self && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => patch(u._id, { isActive: !u.isActive }, u.isActive ? 'User deactivated' : 'User activated')}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => remove(u)} aria-label="Delete user"><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">{ROLES.map((r) => r.label).join(' · ')}</p>
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRoles={[AdminRole.SUPER_ADMIN]}>
      <UsersInner />
    </ProtectedRoute>
  );
}
