"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NetworkingPage() {
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    fetch("http://127.0.0.1:3000/api/networking", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setNetworks(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-10 text-center text-muted-text">Ağ topolojisi yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 p-8 text-foreground">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Ağ Yönetimi</h1>
            <p className="text-muted-text mt-1 font-medium">İzole Docker ağları ve uygulama topolojisi</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2 bg-card border border-card-border text-foreground rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-medium shadow-sm"
          >
            Geri Dön
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {networks.length === 0 ? (
              <div className="bg-card rounded-2xl border border-card-border p-12 text-center text-muted-text">
                Henüz aktif bir ağ bulunamadı.
              </div>
            ) : (
              networks.map((net) => (
                <div key={net.id} className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-card-border flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        🌐
                      </div>
                      <div>
                        <h3 className="font-bold">{net.name}</h3>
                        <p className="text-xs text-muted-text font-mono uppercase">{net.id.substring(0, 12)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-muted-text uppercase">Subnet</p>
                      <p className="text-sm font-mono">{net.subnet}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-xs font-bold text-muted-text uppercase mb-4 tracking-wider">Bağlı Konteynerler</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {net.containers.length === 0 ? (
                        <p className="text-sm text-muted-text italic col-span-2">Bu ağda henüz aktif konteyner yok.</p>
                      ) : (
                        net.containers.map((container: any) => (
                          <div key={container.id} className="p-4 bg-background border border-card-border rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-sm">{container.name}</span>
                              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 text-[8px] font-black rounded uppercase">Online</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-muted-text">IP Adresi</span>
                                <span className="font-mono">{container.ipv4}</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="text-muted-text">MAC</span>
                                <span className="font-mono">{container.mac}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
              <h3 className="font-bold mb-4">Ağ İstatistikleri</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Toplam İzole Ağ</p>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{networks.length}</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase mb-1">Aktif Bağlantı</p>
                  <p className="text-2xl font-black text-purple-700 dark:text-purple-300">
                    {networks.reduce((acc, net) => acc + net.containers.length, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 dark:shadow-none">
                <h3 className="font-bold mb-2">Güvenlik Notu</h3>
                <p className="text-xs opacity-90 leading-relaxed">
                    Uygulamalarınız kendi özel ağlarında birbirlerine konteyner isimleri üzerinden (Dahili DNS) erişebilirler. Dış dünyadan tamamen izoledirler.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
