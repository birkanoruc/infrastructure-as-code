"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Backup {
  id: number;
  filename: string;
  size: number;
  created_at: string;
}

export default function BackupsPage() {
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
        alert("Yedek başarıyla alındı.");
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800">
              ← Geri
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Yedekleme Yönetimi <span className="text-slate-400 text-xl font-medium">#{id}</span>
            </h1>
          </div>
          <button
            onClick={createBackup}
            disabled={creating}
            className={`inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 ${creating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {creating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Yedek Alınıyor...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Yeni Yedek Oluştur
              </>
            )}
          </button>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Yedekler listeleniyor...</div>
          ) : backups.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Henüz yedek yok</h3>
              <p className="text-slate-500">Uygulamanızın ilk yedeğini yukarıdaki butona tıklayarak alabilirsiniz.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Yedek Dosyası</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Boyut</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <span className="font-medium text-slate-700">{b.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatSize(b.size)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(b.created_at).toLocaleString("tr-TR")}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold mr-4"
                        onClick={async () => {
                          if (confirm("Bu yedeği geri yüklemek istediğinize emin misiniz? Mevcut tüm veriler silinecektir.")) {
                            const token = localStorage.getItem("token");
                            try {
                              const res = await fetch(`http://127.0.0.1:3000/api/instances/${id}/backups/${b.id}/restore`, {
                                method: "POST",
                                headers: { "Authorization": `Bearer ${token}` }
                              });
                              const data = await res.json();
                              if (data.status === "success") {
                                alert("Geri yükleme başarılı!");
                                router.push("/"); // Ana sayfaya dön
                              } else {
                                alert("Hata: " + data.error);
                              }
                            } catch (err) {
                              alert("İşlem sırasında bir hata oluştu.");
                            }
                          }
                        }}
                      >
                        Geri Yükle
                      </button>
                      <button className="text-red-500 hover:text-red-700 text-xs font-bold">
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start">
          <svg className="w-5 h-5 text-amber-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15.667c-.77 1.333.192 3 1.732 3z"></path></svg>
          <p className="text-sm text-amber-800">
            <strong>Not:</strong> Yedekleme işlemi sırasında uygulamanız kısa süreliğine erişilemez olabilir (Dosya tutarlılığı için). Veritabanı yedeklerinde verinin tam tutarlılığı için uygulamanın durdurulması önerilir.
          </p>
        </div>
      </div>
    </div>
  );
}
