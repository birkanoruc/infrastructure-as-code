"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

export default function LogsClient() {
  const { id } = useParams();
  const router = useRouter();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Bağlanıyor...");

  const [searchTerm, setSearchTerm] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  const downloadLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:3000/api/instances/${id}/logs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const text = await res.text();
      const blob = new Blob([text], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kovan-app-${id}-logs.txt`;
      a.click();
    } catch (err) {
      alert("Loglar indirilemedi.");
    }
  };

  useEffect(() => {
    if (!terminalRef.current || !id) return;
    
    let term: Terminal;
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const initTerminal = () => {
      term = new Terminal({
        cursorBlink: false,
        disableStdin: true,
        theme: { background: "#0f172a", foreground: "#f8fafc" },
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        fontSize: 13,
        cols: 110,
        rows: 35,
        convertEol: true,
      });

      term.open(terminalRef.current!);

      const connect = () => {
        const token = localStorage.getItem("token");
        ws = new WebSocket(`ws://127.0.0.1:3000/ws/logs/${id}?token=${token}`);

        ws.onopen = () => {
          setStatus("Canlı");
          term.writeln("\x1b[32m[✓]\x1b[0m Bağlantı kuruldu, loglar akıyor...\r\n");
        };

        ws.onmessage = (event) => {
          term.write(event.data);
          if (autoScroll) {
            term.scrollToBottom();
          }
        };

        ws.onclose = () => {
          setStatus("Yeniden Bağlanıyor...");
          term.writeln("\r\n\x1b[33m[!]\x1b[0m Bağlantı koptu, 3sn içinde tekrar deneniyor...\r\n");
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => ws.close();
      };

      connect();
    };

    const timeoutId = setTimeout(initTerminal, 100);

    return () => {
      clearTimeout(timeoutId);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
      if (term) term.dispose();
    };
  }, [id, autoScroll]);

  return (
    <div className="page-container">
      <div className="flex justify-between items-end">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              Uygulama Logları <span className="text-muted-text text-2xl ml-2">#{id}</span>
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === "Canlı" ? "bg-accent" : "bg-amber-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${status === "Canlı" ? "bg-accent" : "bg-amber-500"}`}></span>
            </span>
            <span className="text-sm font-medium text-muted-text">{status}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${autoScroll ? "bg-accent text-white border-accent" : "bg-card text-muted-text border-card-border hover:bg-hover-bg"}`}
          >
            {autoScroll ? "Otomatik Kaydırma: AÇIK" : "Otomatik Kaydırma: KAPALI"}
          </button>
          <button 
            onClick={downloadLogs}
            className="px-4 py-2 bg-card border border-card-border hover:bg-hover-bg text-foreground text-xs font-bold rounded-xl transition-all flex items-center shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Logları İndir (.txt)
          </button>
        </div>
      </div>

      {/* Log Window */}
      <div className="h-[70vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-card-border flex flex-col">
        <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-white/5">
          <div className="text-[10px] font-mono text-slate-500">REALTIME LOG STREAM</div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span>#{id} SESSION</span>
          </div>
        </div>
        <div className="flex-1 w-full h-full p-4 overflow-hidden" ref={terminalRef}></div>
      </div>
    </div>
  );
}
