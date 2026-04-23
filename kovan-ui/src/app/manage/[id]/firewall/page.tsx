"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ManageFirewall() {
  const { id } = useParams();
  const [allowedIps, setAllowedIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://127.0.0.1:3000/api/instances`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const inst = data.data.find((i: any) => i.id.toString() === id);
        if (inst && inst.allowed_ips) {
            try {
                setAllowedIps(JSON.parse(inst.allowed_ips));
            } catch(e) { setAllowedIps([]); }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async (updatedIps: string[]) => {
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:3000/api/instances/${id}/firewall`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ allowed_ips: updatedIps }),
      });
      const data = await res.json();
      if (data.status === "success") {
        // Success
      } else {
        alert("Hata: " + data.error);
      }
    } catch (err) {
      alert("Bir hata oluştu.");
    }
    setSaving(false);
  };

  const addIp = () => {
    if (!newIp) return;
    const updated = [...allowedIps, newIp];
    setAllowedIps(updated);
    setNewIp("");
    handleSave(updated);
  };

  const removeIp = (ip: string) => {
    const updated = allowedIps.filter((i) => i !== ip);
    setAllowedIps(updated);
    handleSave(updated);
  };

  if (loading) return <div className="py-20 text-center text-muted-text">Güvenlik kuralları yükleniyor...</div>;

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 section-card">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground flex items-center">
            <span className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center mr-3 text-sm">🛡️</span>
            Erişim Kontrol Listesi (Whitelist)
          </h2>
          <p className="text-sm text-muted-text mt-2 leading-relaxed">
            Bu uygulama sadece aşağıda listelenen IP adreslerinden gelen isteklere cevap verecektir. 
            Eğer liste boşsa, uygulama <strong>herkese açık</strong> olacaktır.
          </p>
        </div>

        <div className="flex space-x-3 mb-8">
          <input
            type="text"
            placeholder="Örn: 192.168.1.1 veya 0.0.0.0/0"
            className="flex-1 px-4 py-3 bg-input-bg border border-card-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
          />
          <button
            onClick={addIp}
            disabled={saving}
            className="px-8 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-accent/20 active:scale-95"
          >
            {saving ? "Ekleniyor..." : "IP Ekle"}
          </button>
        </div>

        <div className="space-y-3">
          {allowedIps.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-card-border rounded-2xl text-muted-text">
              <p className="text-sm">Şu an herhangi bir kısıtlama uygulanmıyor.</p>
              <p className="text-[10px] uppercase font-bold mt-2 tracking-widest opacity-50">Public Access Enabled</p>
            </div>
          ) : (
            allowedIps.map((ip) => (
              <div key={ip} className="flex justify-between items-center p-4 bg-hover-bg/50 rounded-xl border border-card-border group hover:border-accent/50 transition-all">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-mono text-sm text-foreground font-bold">{ip}</span>
                </div>
                <button
                  onClick={() => removeIp(ip)}
                  className="text-muted-text hover:text-red-500 p-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section-card h-fit">
        <h3 className="text-lg font-bold text-foreground mb-4">Güvenlik Özeti</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-background border border-card-border">
            <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-1">Durum</p>
            <div className="flex items-center">
              <span className={`w-2.5 h-2.5 rounded-full mr-2 ${allowedIps.length > 0 ? "bg-amber-500 animate-pulse" : "bg-green-500"}`}></span>
              <span className="text-sm font-bold text-foreground">
                {allowedIps.length > 0 ? "Kısıtmalı (Private)" : "Herkese Açık (Public)"}
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-background border border-card-border">
            <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-1">Kural Sayısı</p>
            <p className="text-2xl font-black text-foreground">{allowedIps.length}</p>
          </div>
          <div className="p-4 text-[10px] text-muted-text leading-relaxed">
            💡 <strong>İpucu:</strong> Kısıtlamalar uygulandığında, sadece bu IP'ler uygulamanıza erişebilir. Diğer tüm istekler 403 Forbidden hatası alır.
          </div>
        </div>
      </div>
    </div>
  );
}
