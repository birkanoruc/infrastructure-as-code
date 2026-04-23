"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  description: string;
  image: string;
}

export default function CreateInstance() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState("web");

  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    custom_domain: "",
    git_url: "",
    template_id: "",
    cpu_limit: 0.5,
    memory_limit: 512,
  });

  useEffect(() => {
    fetch("http://127.0.0.1:3000/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setTemplates(data.data);
          if (data.data.length > 0) {
            setFormData((prev) => ({ ...prev, template_id: data.data[0].id }));
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subdomain || !formData.template_id) {
      alert("Lütfen tüm alanları doldurun!");
      return;
    }
    
    setSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://127.0.0.1:3000/api/instances", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.status === "success") {
        router.push("/");
      } else {
        alert("Hata: " + data.error);
      }
    } catch (error) {
      alert("Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Yeni Uygulama Başlat</h1>
        <p className="text-muted-text mt-1 text-sm font-medium">Altyapı dertleriyle uğraşmadan projenizi saniyeler içinde yayına alın.</p>
      </div>
        
      <div className="section-card max-w-5xl">

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sol Taraf: İsim ve Subdomain */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Proje Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: E-Ticaret API"
                    className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Alt Alan Adı (Subdomain)</label>
                  <div className="flex">
                    <input
                      type="text"
                      required
                      placeholder="eticaret"
                      className="w-full px-4 py-3 rounded-l-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    />
                    <span className="inline-flex items-center px-4 rounded-r-xl border border-l-0 border-card-border bg-slate-50 dark:bg-slate-800 text-muted-text text-sm">
                      .kovan.local
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Gerçek Alan Adı (Opsiyonel)</label>
                  <input
                    type="text"
                    placeholder="Örn: benimsitem.com"
                    className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    value={formData.custom_domain}
                    onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value.toLowerCase().trim() })}
                  />
                  <p className="text-xs text-muted-text mt-2">A DNS kaydını sunucu IP'nize yönlendirirseniz, sistem otomatik olarak ücretsiz SSL alacaktır.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">GitHub Repo URL (Opsiyonel)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-text">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </div>
                    <input
                      type="text"
                      placeholder="https://github.com/kullanici/repo"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                      value={formData.git_url}
                      onChange={(e) => setFormData({ ...formData, git_url: e.target.value.trim() })}
                    />
                  </div>
                  <p className="text-xs text-muted-text mt-2">Belirtilirse, uygulama kodu doğrudan bu repodan çekilecektir.</p>
                </div>

                <div className="pt-4 border-t border-card-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
                    <span className="mr-2">⚡</span> Kaynak Limitleri
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-text mb-2">CPU Limiti (Core)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="w-full px-4 py-2 rounded-lg border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                        value={formData.cpu_limit}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setFormData({ ...formData, cpu_limit: isNaN(val) ? 0 : val });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-text mb-2">RAM Limiti (MB)</label>
                      <input
                        type="number"
                        step="64"
                        min="0"
                        className="w-full px-4 py-2 rounded-lg border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                        value={formData.memory_limit}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setFormData({ ...formData, memory_limit: isNaN(val) ? 0 : val });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sağ Taraf: Teknoloji Seçimi */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-foreground">Şablon Seçimi</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setActiveCategory("web")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeCategory === "web" ? "bg-card shadow-sm text-accent" : "text-muted-text hover:text-foreground"}`}
                    >
                      Uygulamalar
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory("database")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeCategory === "database" ? "bg-card shadow-sm text-purple-600" : "text-muted-text hover:text-foreground"}`}
                    >
                      Veritabanları
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl h-48 w-full border border-card-border"></div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 pb-2">
                    {templates.filter(t => (t as any).category === activeCategory).map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => setFormData({ ...formData, template_id: tpl.id })}
                        className={`cursor-pointer border p-4 rounded-xl transition-all ${
                          formData.template_id === tpl.id
                            ? activeCategory === "database" 
                              ? "border-purple-500 bg-purple-50/10 shadow-sm ring-1 ring-purple-500"
                              : "border-accent bg-accent/10 shadow-sm ring-1 ring-accent"
                            : "border-card-border bg-background hover:border-accent hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-foreground">{tpl.name}</h3>
                            <p className="text-xs text-muted-text mt-0.5 line-clamp-1">{tpl.description}</p>
                          </div>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 border border-card-border px-2 py-0.5 rounded text-muted-text font-mono">
                            {tpl.image}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-card-border flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className={`bg-accent hover:opacity-90 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center ${
                  submitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? "Başlatılıyor..." : "Uygulamayı Başlat 🚀"}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
