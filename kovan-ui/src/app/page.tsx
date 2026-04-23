"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./components/ThemeToggle";

interface Instance {
  id: number;
  name: string;
  subdomain: string;
  custom_domain: string;
  image_tag: string;
  port: number;
  status: string;
  git_url: string;
  cpu_limit: number;
  memory_limit: number;
  created_at: string;
}

interface Metric {
  cpu_percentage: number;
  memory_usage_mb: number;
  memory_limit_mb: number;
}

export default function Dashboard() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [metrics, setMetrics] = useState<Record<number, Metric>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchInstances = async () => {
      try {
        const res = await fetch("http://127.0.0.1:3000/api/instances", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data.status === "success") {
          setInstances(data.data);
        }
      } catch (err) {
        console.error("Instances fetching failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInstances();
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(`ws://127.0.0.1:3000/ws/metrics?token=${token}`);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMetrics(data);
        } catch (err) {
          console.error("WS Parse Hatası:", err);
        }
      };

      ws.onclose = () => {
        console.log("WS Metrics koptu, 5sn içinde tekrar deneniyor...");
        reconnectTimeout = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);  return (
    <div className="page-container">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-text mt-1 text-sm font-medium">Uygulamalarınızın canlı durumunu izleyin.</p>
        </div>
        
        <button
          onClick={() => router.push("/create")}
          className="bg-accent hover:opacity-90 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-95 flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span>Yeni Uygulama</span>
        </button>
      </div>

      <div className="section-card !p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mb-4"></div>
            <p className="text-muted-text font-medium">Veriler yükleniyor...</p>
          </div>
        ) : instances.length === 0 ? (
          <div className="text-center py-20 px-6">
             <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
             </div>
             <h2 className="text-xl font-bold text-foreground">Henüz uygulama yok</h2>
             <p className="text-muted-text mt-2 max-w-sm mx-auto">Hemen ilk uygulamanızı oluşturun ve Kovan'ın gücünü keşfedin.</p>
             <button onClick={() => router.push("/create")} className="mt-6 px-6 py-2 bg-accent text-white rounded-lg font-bold">Uygulama Oluştur</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-card-border">
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-text uppercase tracking-widest">Proje</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-text uppercase tracking-widest">Domain</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-text uppercase tracking-widest text-center">Durum</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-text uppercase tracking-widest text-center">Kaynaklar</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-text uppercase tracking-widest text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                  {instances.map((inst) => {
                    const instMetrics = metrics[inst.id];
                    return (
                      <tr key={inst.id} className="hover:bg-hover-bg transition-colors group">
                        <td className="py-5 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm group-hover:text-accent transition-colors">{inst.name}</span>
                            <div className="flex items-center mt-1 space-x-2">
                              <span className="text-[10px] font-mono text-muted-text bg-background px-1.5 py-0.5 rounded border border-card-border">
                                {inst.image_tag}
                              </span>
                              {inst.git_url && (
                                <span className="text-[10px] text-accent font-bold flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                  Git
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex flex-col">
                            <a
                              href={`http://${inst.subdomain}.kovan.local`}
                              target="_blank" rel="noreferrer"
                              className="text-accent hover:underline text-sm font-medium"
                            >
                              {inst.subdomain}.kovan.local
                            </a>
                            {inst.custom_domain && (
                              <span className="text-[10px] text-muted-text flex items-center mt-1">
                                🔗 {inst.custom_domain}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            inst.status === "running" 
                            ? "bg-green-500/10 text-green-500 border-green-500/20" 
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${inst.status === "running" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                            {inst.status === "running" ? "Aktif" : "Durduruldu"}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-center">
                          {inst.status === "running" ? (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center space-x-2 text-[10px] font-mono">
                                <span className="text-foreground font-bold">{instMetrics?.cpu_percentage.toFixed(1) || "0.0"}% CPU</span>
                                <span className="text-muted-text">/</span>
                                <span className="text-foreground font-bold">{instMetrics?.memory_usage_mb.toFixed(0) || "0"} MB</span>
                              </div>
                              <div className="text-[9px] text-muted-text mt-1 uppercase tracking-tighter">
                                Limit: {inst.cpu_limit || "∞"} CPU • {inst.memory_limit || "∞"}MB
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-text text-xs">—</span>
                          )}
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div className="flex justify-end space-x-2">
                            {inst.status === "running" && (
                              <>
                                <Link
                                  href={`/files/${inst.id}`}
                                  className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-sm"
                                >
                                  <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                                  Dosyalar
                                </Link>
                                <Link
                                  href={`/terminal/${inst.id}`}
                                  className="inline-flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors shadow-lg"
                                >
                                  <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                  Terminal
                                </Link>
                                <Link
                                  href={`/logs/${inst.id}`}
                                  className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors border border-blue-100"
                                >
                                  <svg className="w-4 h-4 mr-1.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                  Loglar
                                </Link>
                                <Link
                                  href={`/backups/${inst.id}`}
                                  className="inline-flex items-center px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg transition-colors border border-amber-100"
                                >
                                  <svg className="w-4 h-4 mr-1.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                                  Yedekler
                                </Link>
                                <Link
                                  href={`/firewall/${inst.id}`}
                                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg transition-colors border border-indigo-100"
                                >
                                  <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                  Firewall
                                </Link>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
}
