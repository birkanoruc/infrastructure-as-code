"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface FileEntry {
  name: string;
  isDir: boolean;
  size: number;
  time: string;
}

export default function FileManager() {
  const { id } = useParams();
  const router = useRouter();
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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 transition-colors">
            ← Geri
          </button>
          <h1 className="text-xl font-bold text-slate-800">Dosya Yöneticisi <span className="text-slate-400 font-normal">#{id}</span></h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRedeploy}
            disabled={redeploying}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-all flex items-center disabled:bg-slate-400"
          >
            {redeploying ? "Güncelleniyor..." : "GitHub'dan Güncelle (Redeploy)"}
          </button>
          <div className="text-sm text-slate-500 font-medium">Dizin: <span className="text-slate-800">{currentPath}</span></div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: File List */}
        <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto">
          <div className="p-4 space-y-1">
            {loading ? (
              <div className="text-center py-10 text-slate-400 text-sm italic">Dizin okunuyor...</div>
            ) : (
              <>
                {currentPath !== "." && (
                  <button 
                    onClick={() => fetchFiles(".")}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center"
                  >
                    📁 .. (Üst Dizin)
                  </button>
                )}
                {files.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => file.isDir ? fetchFiles(file.name) : openFile(file.name)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between group ${
                      selectedFile?.endsWith(file.name) ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate flex items-center">
                      {file.isDir ? "📁" : "📄"} <span className="ml-2">{file.name}</span>
                    </span>
                    {!file.isDir && <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100">{(file.size / 1024).toFixed(1)} KB</span>}
                  </button>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* Main: Editor */}
        <main className="flex-1 bg-slate-900 flex flex-col p-6">
          {selectedFile ? (
            <div className="h-full flex flex-col bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-slate-700/50 flex justify-between items-center border-b border-slate-600">
                <span className="text-xs font-mono text-slate-300">{selectedFile}</span>
                <button
                  onClick={saveFile}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-xs px-4 py-1.5 rounded-lg transition-all shadow-lg active:scale-95"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
              <textarea
                spellCheck={false}
                className="flex-1 w-full p-6 bg-slate-900 text-slate-100 font-mono text-sm focus:outline-none resize-none"
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl">⌨️</div>
              <p className="text-sm">Düzenlemek için soldan bir dosya seçin</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
