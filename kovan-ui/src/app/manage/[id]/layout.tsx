"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menuItems = [
  { name: "Genel Bakış", path: "" },
  { name: "Terminal", path: "/terminal" },
  { name: "Dosya Yöneticisi", path: "/files" },
  { name: "Güvenlik (FW)", path: "/firewall" },
  { name: "Loglar", path: "/logs" },
  { name: "Yedekleme", path: "/backups" },
];

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const pathname = usePathname();
  const [instanceName, setInstanceName] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!id || !token) return;

    fetch(`http://127.0.0.1:3000/api/instances`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const inst = data.data?.find((i: any) => i.id.toString() === id);
      if (inst) {
        setInstanceName(inst.name);
        // Save to sessionStorage for Breadcrumb to pick up
        sessionStorage.setItem(`inst_name_${id}`, inst.name);
        window.dispatchEvent(new Event("inst_name_updated"));
      }
    });
  }, [id]);

  return (
    <div className="page-container">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              {instanceName || "Yükleniyor..."}
            </h1>
            <p className="text-muted-text mt-1 text-sm font-medium">Uygulama Yönetim Paneli</p>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest bg-hover-bg px-2 py-1 rounded border border-card-border">ID: {id}</span>
          </div>
        </div>

        {/* Yatay Alt Menü */}
        <div className="flex items-center space-x-1 bg-card p-1 rounded-2xl border border-card-border shadow-sm w-fit overflow-x-auto no-scrollbar">
          {menuItems.map((item) => {
            const fullPath = `/manage/${id}${item.path}`;
            const isActive = pathname === fullPath;
            
            return (
              <Link
                key={item.path}
                href={fullPath}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? "bg-accent text-white shadow-lg shadow-accent/20" 
                    : "text-muted-text hover:bg-hover-bg hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {children}
      </div>
    </div>
  );
}
