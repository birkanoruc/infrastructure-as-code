"use client";

import dynamic from "next/dynamic";

const LogsClient = dynamic(() => import("../../../logs/[id]/LogsClient"), {
  ssr: false,
  loading: () => (
    <div className="py-20 text-center text-muted-text">
      <div className="inline-block animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mb-4"></div>
      <p>Log Modülü Yükleniyor...</p>
    </div>
  ),
});

export default function ManageLogs() {
  // We can eventually move LogsClient here or just keep using it.
  // For consistency with the layout, we should probably refactor LogsClient to not have its own header.
  return <LogsClient />;
}
