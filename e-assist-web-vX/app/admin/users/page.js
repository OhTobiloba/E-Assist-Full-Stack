'use client';
// [NEW] Users: search, suspend / reactivate.
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { ActionLink, PageHead, StatusPill, Table, Td } from '@/components/admin/ui';

export default function Users() {
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState('');
  const load = useCallback(() => adminApi.users({ search }).then(setRows), [search]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  async function toggle(u) {
    await adminApi.userSetStatus(u.id, u.status === 'suspended' ? 'active' : 'suspended');
    load();
  }
  return (
    <>
      <PageHead title="Users" sub="Search, review activity, suspend or reactivate accounts."
        right={<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone" className="w-60 rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-navy" />} />
      <Table head={['Name', 'Role', 'Tasks', 'Rating', 'Status', '']} empty={rows && rows.length === 0 ? 'No users found.' : null}>
        {rows?.map((u) => (
          <tr key={u.id}>
            <Td className="font-semibold">{u.name}<div className="text-[11px] font-normal text-muted">{u.phone}</div></Td>
            <Td className="capitalize">{u.roles.join(' + ')}</Td>
            <Td>{u.tasks}</Td>
            <Td>{u.rating ? `★ ${Number(u.rating).toFixed(1)}` : '·'}</Td>
            <Td><StatusPill status={u.status} /></Td>
            <Td><ActionLink danger={u.status !== 'suspended'} onClick={() => toggle(u)}>{u.status === 'suspended' ? 'Reactivate' : 'Suspend'}</ActionLink></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
