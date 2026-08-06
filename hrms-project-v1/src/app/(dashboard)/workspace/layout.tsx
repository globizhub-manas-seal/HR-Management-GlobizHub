// src/app/(dashboard)/workspace/layout.tsx
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
      
      {/* LEFT SIDEBAR COMPONENT */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* TOP HEADER COMPONENT */}
        <Header />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
        
      </div>
    </div>
  );
}