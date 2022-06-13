import toast from 'react-hot-toast';
import { Connection } from '@solana/web3.js';

export async function confirmTransaction (
  connection: Connection,
  txid: string
) {
  const confirmation = connection.confirmTransaction(txid);
  toast.promise(confirmation, {
    loading: 'Confirming Transaction',
    success: 'Transaction Confirmed',
    error: 'Transaction Failed'
  });
  const confirmed = await confirmation;
  if (confirmed.value.err !== null) {
    toast.error('Transaction Failed');
    return false;
  };
  return true;
};