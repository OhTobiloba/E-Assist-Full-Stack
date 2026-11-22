'use client';
// [NEW] Ledger: every naira through escrow.
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatNaira } from '@/lib/utils';
import { PageHead, Table, Td } from '@/components/admin/ui';

const TYPE = { deposit: 'Deposit', escrow_hold: 'Escrow hold', escrow_release: 'Release', escrow_refund: 'Refund', cancel_fee: 'Cancel fee', withdrawal: 'Withdrawal' };
const fmt = (ts) => new Date(ts).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function Transactions() {
  const [rows, setRows] = useState(null);
  useEffect(() => { adminApi.transactions().then(setRows); }, []);
  return (
    <>
      <PageHead title="Transactions" sub="Every naira moving through escrow: deposits, holds, releases, withdrawals, refunds, commission." />
      <Table head={['Time', 'Type', 'User', 'Task', 'Amount', 'Commission']} empty={rows && rows.length === 0 ? 'No transactions yet.' : null}>
        {rows?.map((t) => (
          <tr key={t.id}>
            <Td>{fmt(t.time)}</Td>
            <Td className="font-semibold">{TYPE[t.type] || t.type}</Td>
            <Td>{t.user}</Td>
            <Td>{t.task || '·'}</Td>
            <Td>{formatNaira(t.amount)}</Td>
            <Td>{t.commission ? formatNaira(t.commission) : '·'}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
