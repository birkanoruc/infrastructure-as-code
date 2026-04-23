"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [s3, setS3] = useState<any>({ endpoint: "", access_key: "", secret_key: "", bucket: "", region: "us-east-1", is_active: false });
  const [newKeyName, setNewKeyName] = useState("");
  const [newWhName, setNewWhName] = useState("");
  const [newWhUrl, setNewWhUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
      const [kRes, wRes, sRes] = await Promise.all([
        fetch("http://127.0.0.1:3000/api/keys", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://127.0.0.1:3000/api/webhooks", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://127.0.0.1:3000/api/s3", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const kData = await kRes.json();
      const wData = await wRes.json();
      const sData = await sRes.json();
      setKeys(kData.data || []);
      setWebhooks(wData.data || []);
      if (sData.data) setS3(sData.data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveS3 = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:3000/api/s3", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(s3)
    });
    if (res.ok) alert("S3 ayarları kaydedildi.");
  };

  // ... (rest of the functions remain)

  const createKey = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:3000/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newKeyName })
    });
    const data = await res.json();
    if (data.status === "success") {
      alert(`Yeni API Key oluşturuldu: ${data.key}\n\nLÜTFEN BU ANAHTARI GÜVENLİ BİR YERE KAYDEDİN. BİR DAHA GÖSTERİLMEYECEKTİR.`);
      setNewKeyName("");
      fetchData();
    }
  };

  const createWebhook = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:3000/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newWhName, url: newWhUrl, events: ["deploy.success", "deploy.error"] })
    });
    if (res.ok) {
      setNewWhName("");
      setNewWhUrl("");
      fetchData();
    }
  };

  const deleteItem = async (type: string, id: number) => {
    const token = localStorage.getItem("token");
    await fetch(`http://127.0.0.1:3000/api/${type}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchData();
  };

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Geliştirici Ayarları</h1>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-card border border-card-border rounded-lg text-sm text-muted-text hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            Dashboard'a Dön
          </button>
        </div>

        {/* API Keys Section */}
        <section className="bg-card rounded-2xl shadow-sm border border-card-border p-8 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-2">API Anahtarları (API Keys)</h2>
          <p className="text-sm text-muted-text mb-6">Programatik erişim için kvp_ ile başlayan güvenli anahtarlar.</p>
          
          <div className="flex space-x-2 mb-6">
            <input 
              type="text" placeholder="Anahtar İsmi (örn: GitHub Actions)"
              value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 px-4 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button onClick={createKey} className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-bold hover:opacity-90 transition-colors">
              Anahtar Üret
            </button>
          </div>

          <div className="space-y-3">
            {keys.map(k => (
              <div key={k.id} className="flex justify-between items-center p-4 bg-background rounded-xl border border-card-border">
                <div>
                  <p className="font-bold text-foreground text-sm">{k.name}</p>
                  <p className="font-mono text-xs text-muted-text mt-1">{k.key_masked}</p>
                </div>
                <button onClick={() => deleteItem("keys", k.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Kaldır</button>
              </div>
            ))}
          </div>
        </section>

        {/* Webhooks Section */}
        <section className="bg-card rounded-2xl shadow-sm border border-card-border p-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Webhooks</h2>
          <p className="text-sm text-muted-text mb-6">Deployment bittiğinde veya hata aldığında bildirim gönderilecek adresler.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input 
              type="text" placeholder="İsim (örn: Discord Altyapısı)"
              value={newWhName} onChange={(e) => setNewWhName(e.target.value)}
              className="px-4 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input 
              type="text" placeholder="Webhook URL"
              value={newWhUrl} onChange={(e) => setNewWhUrl(e.target.value)}
              className="px-4 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button onClick={createWebhook} className="w-full py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-colors mb-6">
            Webhook Ekle
          </button>

          <div className="space-y-3">
            {webhooks.map(w => (
              <div key={w.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="overflow-hidden pr-4">
                  <p className="font-bold text-slate-700 text-sm">{w.name}</p>
                  <p className="font-mono text-[10px] text-slate-400 mt-1 truncate">{w.url}</p>
                </div>
                <div className="flex items-center space-x-4 shrink-0">
                   <div className="flex space-x-1">
                      {w.events.map((e: string) => <span key={e} className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-bold rounded uppercase">{e}</span>)}
                   </div>
                   <button onClick={() => deleteItem("webhooks", w.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* S3 Remote Storage Section (v3 Step 4) */}
        <section className="bg-card rounded-2xl shadow-sm border border-card-border p-8 mt-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Bulut Yedekleme (S3 Remote Storage)</h2>
          <p className="text-sm text-muted-text mb-6">Yedeklerinizi AWS S3, Cloudflare R2 veya Minio üzerine güvenle saklayın.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-text uppercase ml-1">S3 Endpoint</label>
              <input 
                type="text" placeholder="https://s3.amazonaws.com"
                value={s3.endpoint} onChange={(e) => setS3({...s3, endpoint: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-text uppercase ml-1">Bucket Adı</label>
              <input 
                type="text" placeholder="my-backups"
                value={s3.bucket} onChange={(e) => setS3({...s3, bucket: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-text uppercase ml-1">Access Key ID</label>
              <input 
                type="text" placeholder="AKIA..."
                value={s3.access_key} onChange={(e) => setS3({...s3, access_key: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-text uppercase ml-1">Secret Access Key</label>
              <input 
                type="password" placeholder="********"
                value={s3.secret_key} onChange={(e) => setS3({...s3, secret_key: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-background border border-card-border rounded-xl mb-6">
            <div>
              <p className="text-sm font-bold text-foreground">S3 Yedeklemeyi Aktif Et</p>
              <p className="text-xs text-muted-text italic">Aktif edildiğinde her yeni yedek buluta gönderilir.</p>
            </div>
            <input 
              type="checkbox" 
              checked={s3.is_active} onChange={(e) => setS3({...s3, is_active: e.target.checked})}
              className="w-5 h-5 accent-accent"
            />
          </div>

          <button onClick={saveS3} className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 dark:shadow-none">
            S3 Yapılandırmasını Kaydet
          </button>
        </section>
      </div>
    </div>
  );
}
