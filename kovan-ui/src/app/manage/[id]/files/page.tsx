"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface FileEntry {
  name: string;
  isDir: boolean;
  size: number;
  time: string;
}

export default function ManageFiles() {
  const { id } = useParams();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState(".");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redeploying, setRedeploying] = useState(false);

  const fetchFiles = useCallback(async (path: string) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:3000/api/instances/${id}/files?path=${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        setFiles(data.data || []);
        setCurrentPath(path);
      }
    } catch (err) {
      console.error("Files fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFiles(".");
  }, [fetchFiles]);

  const openFile = async (fileName: string) => {
    const fullPath = currentPath === "." ? fileName : `${currentPath}/${fileName}`;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:3000/api/instances/${id}/files/content?path=${fullPath}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        setSelectedFile(fullPath);
        setFileContent(data.content);
      }
    } catch (err) {
      alert("Dosya okunamadı");
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:3000/api/instances/${id}/files/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ path: selectedFile, content: fileContent }),
      });
      if (res.ok) {
        alert("Dosya başarıyla kaydedildi");
      }
    } catch (err) {
      alert("Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  };

  const handleRedeploy = async () => {
    if (!confirm("Uygulama GitHub'dan güncellenip yeniden başlatılacak. Emin misiniz?")) return;
    setRedeploying(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:3000/api/instances/${id}/redeploy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Uygulama başarıyla güncellendi!");
        fetchFiles(currentPath);
      } else {
        alert(data.error || "Hata oluştu");
      }
    } catch (err) {
      alert("Bağlantı hatası");
    } finally {
      setRedeploying(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col space-y-6 h-[calc(100vh-320px)]">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 bg-hover-bg px-3 py-1.5 rounded-lg border border-card-border">
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Dizin:</span>
          <span className="text-xs font-mono text-foreground font-bold">{currentPath}</span>
        </div>
        <button
          onClick={handleRedeploy}
          disabled={redeploying}
          className="text-xs bg-slate-800 dark:bg-slate-700 hover:opacity-90 text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center disabled:opacity-50 shadow-sm"
        >
          <span className="mr-2">🔄</span>
          {redeploying ? "Güncelleniyor..." : "GitHub'dan Güncelle (Redeploy)"}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden border border-card-border rounded-2xl shadow-xl bg-card">
        {/* Sidebar: File List */}
        <aside className="w-80 border-r border-card-border overflow-y-auto bg-background/50">
          <div className="p-4 space-y-1">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full mb-2"></div>
                <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest">Yükleniyor...</p>
              </div>
            ) : (
              <>
                {currentPath !== "." && (
                  <button 
                    onClick={() => fetchFiles(".")}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-accent hover:bg-accent/10 rounded-lg transition-all flex items-center mb-2"
                  >
                    📁 .. (Üst Dizin)
                  </button>
                )}
                <div className="space-y-1">
                  {files.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => file.isDir ? fetchFiles(file.name) : openFile(file.name)}
                      className={`w-full text-left px-3 py-2.5 text-xs rounded-xl transition-all flex items-center justify-between group ${
                        selectedFile?.endsWith(file.name) 
                          ? "bg-accent text-white font-bold shadow-lg shadow-accent/20" 
                          : "text-foreground hover:bg-hover-bg"
                      }`}
                    >
                      <span className="truncate flex items-center">
                        <span className="mr-3 opacity-70">{file.isDir ? "📁" : "📄"}</span>
                        <span className="truncate">{file.name}</span>
                      </span>
                      {!file.isDir && (
                        <span className={`text-[9px] font-mono opacity-50 ${selectedFile?.endsWith(file.name) ? "text-white" : "text-muted-text"}`}>
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main: Editor */}
        <main className="flex-1 bg-slate-950 flex flex-col overflow-hidden relative">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="px-6 py-3 bg-slate-900/50 flex justify-between items-center border-b border-white/5 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Düzenlenen:</span>
                   <span className="text-xs font-mono text-blue-400 font-bold">{selectedFile}</span>
                </div>
                <button
                  onClick={saveFile}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg transition-all shadow-lg active:scale-95"
                >
                  {saving ? "Kaydediliyor..." : "KAYDET"}
                </button>
              </div>
              <textarea
                spellCheck={false}
                className="flex-1 w-full p-6 bg-transparent text-slate-300 font-mono text-sm focus:outline-none resize-none leading-relaxed"
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center text-3xl shadow-2xl">⌨️</div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-400">Dosya Seçilmedi</p>
                <p className="text-[10px] uppercase tracking-widest mt-1 opacity-50 font-bold">Düzenlemek için bir dosya seçin</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
