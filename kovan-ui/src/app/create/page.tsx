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

  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    custom_domain: "",
    git_url: "",
    template_id: "",
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
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <span className="mr-2">←</span> Geri Dön
        </Link>
        
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-800">Yeni Uygulama Başlat</h1>
            <p className="text-slate-500 mt-2">Altyapı dertleriyle uğraşmadan projenizi saniyeler içinde yayına alın.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sol Taraf: İsim ve Subdomain */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Proje Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: E-Ticaret API"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Alt Alan Adı (Subdomain)</label>
                  <div className="flex">
                    <input
                      type="text"
                      required
                      placeholder="eticaret"
                      className="w-full px-4 py-3 rounded-l-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    />
                    <span className="inline-flex items-center px-4 rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 text-slate-500 text-sm">
                      .kovan.local
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gerçek Alan Adı (Opsiyonel)</label>
                  <input
                    type="text"
                    placeholder="Örn: benimsitem.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    value={formData.custom_domain}
                    onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value.toLowerCase().trim() })}
                  />
                  <p className="text-xs text-slate-500 mt-2">A DNS kaydını sunucu IP'nize yönlendirirseniz, sistem otomatik olarak ücretsiz SSL alacaktır.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">GitHub Repo URL (Opsiyonel)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </div>
                    <input
                      type="text"
                      placeholder="https://github.com/kullanici/repo"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                      value={formData.git_url}
                      onChange={(e) => setFormData({ ...formData, git_url: e.target.value.trim() })}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Belirtilirse, uygulama kodu doğrudan bu repodan çekilecektir.</p>
                </div>
              </div>

              {/* Sağ Taraf: Teknoloji Seçimi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teknoloji Şablonu</label>
                {loading ? (
                  <div className="animate-pulse bg-slate-100 rounded-xl h-48 w-full border border-slate-200"></div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 pb-2">
                    {templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => setFormData({ ...formData, template_id: tpl.id })}
                        className={`cursor-pointer border p-4 rounded-xl transition-all ${
                          formData.template_id === tpl.id
                            ? "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-slate-800">{tpl.name}</h3>
                          <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">
                            {tpl.image}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{tpl.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center ${
                  submitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Başlatılıyor...
                  </>
                ) : (
                  "Uygulamayı Başlat 🚀"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
