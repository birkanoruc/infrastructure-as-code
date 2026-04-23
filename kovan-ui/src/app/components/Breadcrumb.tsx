"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Icons = {
  Home: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>,
};

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  manage: "Yönetim",
  create: "Yeni Uygulama",
  settings: "Ayarlar",
  networking: "Ağ Yönetimi",
  logs: "Loglar",
  firewall: "Firewall",
  terminal: "Terminal",
  files: "Dosyalar",
  backups: "Yedekler",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((s) => s);
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateLabels = () => {
      const labels: Record<string, string> = {};
      segments.forEach(segment => {
        if (/^\d+$/.test(segment)) {
          const name = sessionStorage.getItem(`inst_name_${segment}`);
          if (name) labels[segment] = name;
        }
      });
      setDynamicLabels(labels);
    };

    updateLabels();
    window.addEventListener("inst_name_updated", updateLabels);
    return () => window.removeEventListener("inst_name_updated", updateLabels);
  }, [pathname]);

  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-muted-text mb-6">
      <Link href="/" className="hover:text-accent transition-colors flex items-center">
        <Icons.Home />
      </Link>

      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = dynamicLabels[segment] || routeLabels[segment] || segment;

        return (
          <div key={href} className="flex items-center space-x-2">
            <Icons.ChevronRight />
            {isLast ? (
              <span className="text-foreground font-bold">{label}</span>
            ) : (
              <Link href={href} className="hover:text-accent transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
