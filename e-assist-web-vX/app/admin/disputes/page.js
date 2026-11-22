'use client';
// [NEW] Dispute queue (tracker #23)
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatNaira } from '@/lib/utils';
import { PageHead, StatusPill, Table, Td } from '@/components/admin/ui';

export default function Disputes() {
  const [rows, setRows] = useState(null);
  useEffect(() => { adminApi.disputes().then(setRows); }, []);
  return (
    <>
      <PageHead title="Dispute queue" sub="Funds stay in escrow until you pick one of three explicit outcomes." />
      <Table head={['Task', 'Raised by', 'Reason', 'Amount', 'Status', '']} empty={rows && rows.length === 0 ? 'No disputes. 🎉' : null}>
        {rows?.map((d) => (
          <tr key={d.id}>
            <Td className="font-semibold">{d.taskTitle}</Td>
            <Td>{d.raisedBy.name}</Td>
            <Td>{d.reason}</Td>
            <Td>{formatNaira(d.amount)}</Td>
            <Td><StatusPill status={d.status === 'open' ? 'disputed' : 'resolved'} /></Td>
            <Td><Link href={`/admin/disputes/${d.id}`} className="text-xs font-semibold text-navy underline">{d.status === 'open' ? 'Resolve' : 'View'}</Link></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
