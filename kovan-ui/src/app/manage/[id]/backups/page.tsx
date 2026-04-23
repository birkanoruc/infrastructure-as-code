"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Backup {
  id: number;
  filename: string;
  size: number;
  created_at: string;
}

export default function ManageBackups() {
  const { id } = useParams();
  const router = useRouter();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:3000/api/instances/${id}/backups`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === "success") {
        setBackups(data.data || []);
      }
    } catch (err) {
      console.error("Yedekler yüklenemedi", err);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:3000/api/instances/${id}/backups`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === "success") {
        fetchBackups();
      } else {
        alert("Hata: " + data.error);
      }
    } catch (err) {
      alert("Yedekleme sırasında bir hata oluştu.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [id]);

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + " MB";
  };

  if (loading) return <div className="py-20 text-center text-muted-text">Yedekler listeleniyor...</div>;

  return (
    <div className="mt-4 flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center">
             <span className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center mr-3 text-sm">📦</span>
             Sistem Yedekleri
          </h2>
          <p className="text-xs text-muted-text mt-1">Uygulamanızın dosya ve veritabanı durumlarını yedekleyin.</p>
        </div>
        <button
          onClick={createBackup}
          disabled={creating}
          className="bg-accent hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-accent/20 flex items-center disabled:opacity-50"
        >
          {creating ? (
             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : <span className="mr-2">+</span>}
          {creating ? "Yedekleniyor..." : "Yeni Yedek Oluştur"}
        </button>
      </div>

      <div className="section-card !p-0 overflow-hidden">
        {backups.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-hover-bg rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📁</div>
            <h3 className="text-lg font-bold text-foreground">Henüz yedek yok</h3>
            <p className="text-sm text-muted-text max-w-xs mx-auto mt-2">İlk yedeğinizi oluşturarak verilerinizi güvence altına alın.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-card-border">
                <th className="px-6 py-4 text-[10px] font-bold text-muted-text uppercase tracking-widest">Yedek Dosyası</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted-text uppercase tracking-widest text-center">Boyut</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted-text uppercase tracking-widest text-center">Tarih</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted-text uppercase tracking-widest text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-hover-bg transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-background border border-card-border flex items-center justify-center mr-3 text-sm">📄</div>
                      <span className="font-bold text-foreground text-sm group-hover:text-accent transition-colors">{b.filename}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-mono text-muted-text bg-background px-2 py-1 rounded border border-card-border">{formatSize(b.size)}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-muted-text font-medium">
                    {new Date(b.created_at).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        className="px-3 py-1.5 bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest"
                        onClick={async () => {
                          if (confirm("Bu yedeği geri yüklemek istediğinize emin misiniz? Mevcut tüm veriler silinecektir.")) {
                            const token = localStorage.getItem("token");
                            try {
                              const res = await fetch(`http://127.0.0.1:3000/api/instances/${id}/backups/${b.id}/restore`, {
                                method: "POST",
                                headers: { "Authorization": `Bearer ${token}` }
                              });
                              if (res.ok) {
                                alert("Geri yükleme başarılı!");
                                router.push(`/manage/${id}`);
                              }
                            } catch (err) {
                              alert("İşlem hatası.");
                            }
                          }
                        }}
                      >
                        Geri Yükle
                      </button>
                      <button className="p-1.5 text-muted-text hover:text-red-500 transition-colors">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-start">
        <span className="mr-3 mt-0.5 text-amber-500">⚠️</span>
        <p className="text-[11px] text-amber-600/80 leading-relaxed font-medium">
          <strong>Önemli Not:</strong> Yedekleme işlemi sırasında uygulamanız kısa süreliğine erişilemez olabilir. 
          Veri tutarlılığı için veritabanı işlemlerinin durduğu bir zaman diliminde yedek alınması önerilir.
        </p>
      </div>
    </div>
  );
}
