"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManageOverview() {
  const { id } = useParams();
  const [instance, setInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://127.0.0.1:3000/api/instances`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const inst = data.data?.find((i: any) => i.id.toString() === id);
      setInstance(inst);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="py-20 text-center text-muted-text">Bilgiler alınıyor...</div>;
  if (!instance) return <div className="py-20 text-center text-red-500">Uygulama bulunamadı.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
      <div className="section-card col-span-1 md:col-span-2">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
          <span className="w-8 h-8 bg-accent/10 text-accent rounded-lg flex items-center justify-center mr-3 text-sm">ℹ️</span>
          Uygulama Bilgileri
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Uygulama Adı</p>
              <p className="text-lg font-bold text-foreground">{instance.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Alt Alan Adı</p>
              <a href={`http://${instance.subdomain}.kovan.local`} target="_blank" rel="noreferrer" className="text-accent hover:underline font-medium">
                {instance.subdomain}.kovan.local
              </a>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Özel Alan Adı</p>
              <p className="text-foreground font-medium">{instance.custom_domain || "Tanımlanmamış"}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Docker Imajı</p>
              <p className="text-foreground font-mono text-sm bg-hover-bg px-2 py-1 rounded w-fit border border-card-border">{instance.image_tag}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Git Repo</p>
              <p className="text-foreground text-sm truncate">{instance.git_url || "Direkt yükleme"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Oluşturulma Tarihi</p>
              <p className="text-foreground text-sm">{new Date(instance.created_at).toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
          <span className="w-8 h-8 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center mr-3 text-sm">⚡</span>
          Kaynak Limitleri
        </h2>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-muted-text uppercase tracking-widest">CPU Limiti</span>
              <span className="text-sm font-bold text-foreground">{instance.cpu_limit > 0 ? `${instance.cpu_limit} Core` : "Sınırsız"}</span>
            </div>
            <div className="h-2 bg-hover-bg rounded-full overflow-hidden">
              <div className="h-full bg-accent w-1/2"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-muted-text uppercase tracking-widest">RAM Limiti</span>
              <span className="text-sm font-bold text-foreground">{instance.memory_limit > 0 ? `${instance.memory_limit} MB` : "Sınırsız"}</span>
            </div>
            <div className="h-2 bg-hover-bg rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-2/3"></div>
            </div>
          </div>

          <div className="pt-4 border-t border-card-border">
            <p className="text-[10px] text-muted-text leading-relaxed italic">
              * Limit değerleri uygulamanın istikrarı için Docker düzeyinde rezerve edilmiştir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
