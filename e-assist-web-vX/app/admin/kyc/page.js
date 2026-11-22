'use client';
// [NEW] KYC queue. Nothing is approved from the list; open the applicant first (mockup rule).
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { timeAgo } from '@/lib/utils';
import { PageHead, StatusPill, Table, Td } from '@/components/admin/ui';

export default function KycQueue() {
  const [rows, setRows] = useState(null);
  useEffect(() => { adminApi.kycList().then(setRows); }, []);
  return (
    <>
      <PageHead title="KYC queue" sub="Review full applicant details before approving. Nothing is approved from the list view." />
      <Table head={['Applicant', 'Role', 'Submitted', 'Status', '']} empty={rows && rows.length === 0 ? 'No submissions yet.' : null}>
        {rows?.map((k) => (
          <tr key={k.id}>
            <Td className="font-semibold">{k.name}</Td>
            <Td>{k.role}</Td>
            <Td>{timeAgo(k.submittedAt)}</Td>
            <Td><StatusPill status={k.status === 'rejected' ? 'rejected' : k.status} /></Td>
            <Td><Link href={`/admin/kyc/${k.id}`} className="text-xs font-semibold text-navy underline">{k.status === 'pending' ? 'Review' : 'View'}</Link></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
