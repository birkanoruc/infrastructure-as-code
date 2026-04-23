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
    <div className="mt-4 flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center">
             <span className="w-8 h-8 bg-slate-800/10 text-slate-800 dark:text-slate-200 rounded-lg flex items-center justify-center mr-3 text-sm">⌨️</span>
             SSH Terminal
          </h2>
          <p className="text-xs text-muted-text mt-1">Uygulama kapsayıcısına doğrudan komut satırı erişimi.</p>
        </div>
        <div className="flex items-center space-x-3 bg-hover-bg px-4 py-2 rounded-xl border border-card-border shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === "Bağlandı" ? "bg-green-400" : "bg-amber-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status === "Bağlandı" ? "bg-green-500" : "bg-amber-500"}`}></span>
          </span>
          <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">{status}</span>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-card-border flex flex-col h-[65vh]">
        <div className="bg-slate-900 px-6 py-3 flex items-center border-b border-white/5">
          <div className="flex space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
          </div>
          <div className="mx-auto text-[10px] font-bold text-slate-500 uppercase tracking-widest">root@kovan-container:{id}</div>
        </div>
        <div className="flex-1 w-full h-full p-6 overflow-hidden" ref={terminalRef}></div>
      </div>
    </div>
  );
}
