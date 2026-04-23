"use client";

import dynamic from "next/dynamic";

const TerminalClient = dynamic(() => import("../../../terminal/[id]/TerminalClient"), {
  ssr: false,
  loading: () => (
    <div className="py-20 text-center text-muted-text">
      <div className="inline-block animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mb-4"></div>
      <p>Terminal Modülü Hazırlanıyor...</p>
    </div>
  ),
});

export default function ManageTerminal() {
  return <TerminalClient />;
}
