import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onSearch?: (val: string) => void;
  searchValue?: string;
}

export default function AppLayout({
  children,
  title = "Dashboard",
  subtitle,
  onSearch,
  searchValue = "",
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={title}
          subtitle={subtitle}
          onSearch={onSearch}
          searchValue={searchValue}
        />
        {/* Added pb-20 for mobile so the BottomNav doesn't overlap content */}
        <main className="flex-1 px-4 lg:px-6 py-6 max-w-6xl w-full mx-auto animate-in pb-36 lg:pb-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
