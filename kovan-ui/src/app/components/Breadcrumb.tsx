"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Icons = {
  Home: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>,
};

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  "create": "Uygulama Oluştur",
  "networking": "Ağ Yönetimi",
  "firewall": "Güvenlik",
  "settings": "Ayarlar",
  "login": "Giriş",
  "register": "Kayıt",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-text">
      <Link href="/" className="hover:text-accent transition-colors flex items-center">
        <Icons.Home />
      </Link>
      
      {pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pathSegments.length - 1;
        const label = routeLabels[segment] || (segment.length > 10 ? "Detay" : segment);

        return (
          <div key={path} className="flex items-center space-x-2">
            <div className="opacity-50">
              <Icons.ChevronRight />
            </div>
            {isLast ? (
              <span className="font-bold text-foreground">{label}</span>
            ) : (
              <Link href={path} className="hover:text-accent transition-colors uppercase text-[10px] font-bold tracking-wider">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
