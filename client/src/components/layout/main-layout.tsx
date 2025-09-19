import { useState } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-full bg-background font-sans">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />
      
      <main 
        className={`pt-16 min-h-screen bg-background transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
        data-testid="main-content"
      >
        {children}
      </main>
    </div>
  );
}
