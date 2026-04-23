"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Instance {
  id: number;
  name: string;
  subdomain: string;
  custom_domain: string;
  image_tag: string;
  port: number;
  status: string;
  git_url: string;
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

    // WebSocket ile metrikleri anlık dinle (Token göndererek)
    const ws = new WebSocket(`ws://127.0.0.1:3000/ws/metrics?token=${token}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMetrics(data);
      } catch (err) {
        console.error("WS Parse Hatası:", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Kovan Paneli</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/login");
              }}
              className="text-slate-500 hover:text-red-500 transition-colors text-sm font-medium"
            >
              Çıkış Yap
            </button>
            <button
              onClick={() => router.push("/create")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              + Yeni Uygulama
            </button>
          </div>
        </header>

        <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Yükleniyor...</div>
          ) : instances.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
                🚀
              </div>
              <h3 className="text-xl font-medium text-slate-700 mb-2">Henüz uygulamanız yok</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Hemen yeni bir uygulama oluşturarak Kovan altyapısının tadını çıkarın.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="pb-3 font-medium px-4">Proje Adı</th>
                    <th className="pb-3 font-medium px-4">Adres (Domain)</th>
                    <th className="pb-3 font-medium px-4">Teknoloji</th>
                    <th className="pb-3 font-medium px-4">Durum</th>
                    <th className="pb-3 font-medium px-4">Canlı CPU</th>
                    <th className="pb-3 font-medium px-4">Canlı RAM</th>
                    <th className="pb-3 font-medium px-4 text-right">Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {instances.map((inst) => {
                    const instMetrics = metrics[inst.id];
                    return (
                      <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-medium text-slate-700">
                          <div className="flex items-center">
                            {inst.name}
                            {inst.git_url && (
                              <span className="ml-2 inline-flex items-center text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200" title={inst.git_url}>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                GitHub
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col space-y-1">
                            <a
                              href={`http://${inst.subdomain}.kovan.local`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {inst.subdomain}.kovan.local
                            </a>
                            {inst.custom_domain && (
                              <a
                                href={`https://${inst.custom_domain}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-600 hover:underline text-xs font-medium flex items-center"
                              >
                                🔒 {inst.custom_domain}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {inst.image_tag}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              inst.status === "running"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {inst.status === "running" ? (
                              <><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span> Çalışıyor</>
                            ) : (
                              inst.status
                            )}
                          </span>
                        </td>
                        {/* CPU Sütunu */}
                        <td className="py-4 px-4 text-sm">
                          {inst.status === "running" ? (
                            instMetrics ? (
                              <div className="flex items-center">
                                <span className="w-10 text-right font-mono text-slate-600 mr-2">
                                  {instMetrics.cpu_percentage.toFixed(2)}%
                                </span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 transition-all duration-500" 
                                    style={{ width: `${Math.min(instMetrics.cpu_percentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Yükleniyor...</span>
                            )
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        {/* RAM Sütunu */}
                        <td className="py-4 px-4 text-sm">
                          {inst.status === "running" ? (
                            instMetrics ? (
                              <div className="flex items-center">
                                <span className="font-mono text-slate-600">
                                  {instMetrics.memory_usage_mb.toFixed(1)} MB
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Yükleniyor...</span>
                            )
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        {/* Aksiyonlar Sütunu */}
                        <td className="py-4 px-4 text-right">
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
    </div>
  );
}
