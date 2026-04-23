"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function FirewallPage() {
  const { id } = useParams();
  const router = useRouter();
  const [allowedIps, setAllowedIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Mevcut ayarları çek (Instance detaylarından alabiliriz veya ayrı bir uç nokta)
    // Şimdilik instance detayından çekmek yerine basit tutmak için boş başlıyoruz 
    // veya API'ye GetFirewall ekleyebiliriz. Şimdilik listeyi çekmek için instance listesinden filtreleyelim.
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
        alert("Güvenlik duvarı kuralları güncellendi!");
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

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  return (
    <div className="page-container">
      <div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Firewall Ayarları</h1>
        <p className="text-muted-text mt-1 text-sm font-medium">Bu uygulama için IP tabanlı erişim kısıtlamalarını yönetin.</p>
      </div>

      <div className="max-w-4xl section-card">
        {/* IP Beyaz Listesi Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-2">IP Beyaz Listesi (Whitelist)</h2>
            <p className="text-sm text-muted-text leading-relaxed">
              Bu uygulama sadece aşağıda listelenen IP adreslerinden gelen isteklere cevap verecektir. 
              Eğer liste boşsa, uygulama <strong>herkese açık</strong> olacaktır.
            </p>
          </div>

          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              placeholder="Örn: 192.168.1.1 veya 0.0.0.0/0"
              className="flex-1 px-4 py-2 bg-background border border-card-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
            />
            <button
              onClick={addIp}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Ekle
            </button>
          </div>

          <div className="space-y-2">
            {allowedIps.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-card-border rounded-xl text-muted-text text-sm">
                Şu an herhangi bir kısıtlama yok.
              </div>
            ) : (
              allowedIps.map((ip) => (
                <div key={ip} className="flex justify-between items-center p-3 bg-background rounded-xl border border-card-border">
                  <span className="font-mono text-sm text-foreground">{ip}</span>
                  <button
                    onClick={() => removeIp(ip)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    Kaldır
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-card-border flex items-center justify-between">
            <span className="text-[10px] text-muted-text uppercase font-bold tracking-wider">Durum</span>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${allowedIps.length > 0 ? "bg-amber-500" : "bg-green-500"}`}></span>
              <span className="text-xs font-bold text-foreground">
                {allowedIps.length > 0 ? "Kısıtlamalı Erişim" : "Halka Açık"}
              </span>
            </div>
        </div>
      </div>
    </div>
  );
}
