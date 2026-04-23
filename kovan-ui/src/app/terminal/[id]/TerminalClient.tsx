"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

export default function TerminalClient() {
  const { id } = useParams();
  const router = useRouter();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Bağlanıyor...");

  useEffect(() => {
    if (!terminalRef.current || !id) return;
    
    let term: Terminal;
    let ws: WebSocket;

    const initTerminal = () => {
      // xterm.js kurulumu (FitAddon'un React 18 ile oluşturduğu hatayı önlemek için statik boyut kullanıyoruz)
      term = new Terminal({
        cursorBlink: true,
        theme: {
          background: "#0f172a", // slate-900
          foreground: "#f8fafc", // slate-50
          cursor: "#3b82f6",     // blue-500
        },
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        fontSize: 14,
        cols: 100, // Varsayılan sütun
        rows: 30,  // Varsayılan satır
      });

      // DOM hazır olduğunda ekrana çiz
      term.open(terminalRef.current!);

      const token = localStorage.getItem("token");

      // WebSocket bağlantısı
      ws = new WebSocket(`ws://127.0.0.1:3000/ws/terminal/${id}?token=${token}`);

      ws.onopen = () => {
        setStatus("Bağlandı");
        term.writeln("\r\n\x1b[32m[✓]\x1b[0m Kovan Web Terminaline Başarıyla Bağlanıldı.\r\n");
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onclose = () => {
        setStatus("Bağlantı Kesildi");
        term.writeln("\r\n\x1b[31m[x]\x1b[0m Bağlantı kesildi.\r\n");
      };

      term.onData((data) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    };

    // React render edip div boyutlarını hesapladıktan sonra başlat (100ms gecikme)
    const timeoutId = setTimeout(() => {
      initTerminal();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (ws) ws.close();
      if (term) term.dispose();
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans flex flex-col items-center">
      <div className="w-full max-w-5xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 transition-colors">
              ← Geri
            </button>
            <h1 className="text-2xl font-bold text-slate-800">
              Uygulama Terminali <span className="text-slate-400 text-lg">#{id}</span>
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === "Bağlandı" ? "bg-green-400" : "bg-amber-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${status === "Bağlandı" ? "bg-green-500" : "bg-amber-500"}`}></span>
            </span>
            <span className="text-sm font-medium text-slate-600">{status}</span>
          </div>
        </div>

        {/* Terminal Window (Glassmorphism Container) */}
        <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-700/50 flex flex-col">
          {/* Mac Like Header */}
          <div className="bg-slate-800 px-4 py-3 flex items-center border-b border-slate-700/50">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="mx-auto text-xs font-medium text-slate-400">root@kovan-app</div>
          </div>
          {/* Terminal Content */}
          <div className="flex-1 w-full h-full min-h-[400px] p-4 overflow-hidden" ref={terminalRef}></div>
        </div>
      </div>
    </div>
  );
}
