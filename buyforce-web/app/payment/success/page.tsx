'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');

  return (
    <div>
      <h1>Payment Successful 🎉</h1>
      <p>Group ID: {groupId}</p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading payment details...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
