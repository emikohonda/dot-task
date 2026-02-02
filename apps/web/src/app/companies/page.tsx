import React from 'react';

type company = {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
}

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">取引先</h1>
      <p className="text-slate-600">ここに取引先の内容が入ります。</p>
    </div>
  );
}