"use client";

import dynamic from "next/dynamic";

const LogsClient = dynamic(() => import("./LogsClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-500 font-medium">Loglar Yükleniyor...</div>
    </div>
  ),
});

export default function LogsPage() {
  return <LogsClient />;
}
