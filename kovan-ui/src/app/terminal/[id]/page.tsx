"use client";

import dynamic from "next/dynamic";

// xterm.js tarayıcı ortamına ihtiyaç duyduğu için (SSR uyumsuz), bu bileşeni sadece istemcide (client-side) yüklüyoruz.
const TerminalClient = dynamic(() => import("./TerminalClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-500 font-medium">Terminal Yükleniyor...</div>
    </div>
  ),
});

export default function TerminalPage() {
  return <TerminalClient />;
}
