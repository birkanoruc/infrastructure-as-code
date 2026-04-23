"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Instance {
  id: number;
  name: string;
  subdomain: string;
  image_tag: string;
  port: number;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:3000/api/instances")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setInstances(data.data);
        }
      })
      .catch((err) => console.error("API Hatası:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Kovan Panel
            </h1>
            <p className="text-slate-500 mt-1">Uygulamalarınızı yönetin</p>
          </div>
          <Link
            href="/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            + Yeni Uygulama
          </Link>
        </header>

        {/* Content */}
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
                    <th className="pb-3 font-medium px-4">Port</th>
                    <th className="pb-3 font-medium px-4">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {instances.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-medium text-slate-700">{inst.name}</td>
                      <td className="py-4 px-4">
                        <a
                          href={`http://${inst.subdomain}.kovan.local`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {inst.subdomain}.kovan.local
                        </a>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {inst.image_tag}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-500">{inst.port}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            inst.status === "running"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {inst.status === "running" ? (
                            <><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span> Çalışıyor</>
                          ) : (
                            inst.status
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
