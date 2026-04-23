"use client";

import Breadcrumb from "./Breadcrumb";
import ThemeToggle from "./ThemeToggle";

const Icons = {
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  Bell: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
};

export default function Navbar() {
  return (
    <header className="h-16 bg-card/80 backdrop-blur-md border-b border-card-border fixed top-0 right-0 left-0 lg:left-64 z-30 transition-all duration-300">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Breadcrumb />
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center bg-input-bg border border-card-border rounded-lg px-3 py-1.5 space-x-2 w-64 focus-within:ring-2 focus-within:ring-accent/20 transition-all">
            <Icons.Search />
            <input 
              type="text" 
              placeholder="Uygulama veya ayar ara..." 
              className="bg-transparent border-none text-xs text-foreground placeholder:text-muted-text focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center space-x-3 border-l border-card-border pl-6">
            <button className="p-2 text-muted-text hover:text-accent hover:bg-hover-bg rounded-lg transition-all relative">
              <Icons.Bell />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
