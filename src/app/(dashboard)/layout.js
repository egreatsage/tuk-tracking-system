// src/app/(dashboard)/layout.js
"use client";

import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Users, Calendar, LayoutDashboard, Settings } from "lucide-react";

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Basic Loading State
  if (status === "loading") {
    return <div className="h-screen flex items-center justify-center">Loading session...</div>;
  }

  const role = session?.user?.role?.toLowerCase() || "student";

  // Dynamic Navigation based on Role (as per your plan)
  const navLinks = {
    superadmin: [
      { name: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
      { name: "Courses", href: "/superadmin/courses", icon: BookOpen },
      { name: "Units", href: "/superadmin/units", icon: BookOpen },
      { name: "Teachers", href: "/superadmin/teachers", icon: Users },
      { name: "Students", href: "/superadmin/students", icon: Users },
      { name: "Timetable", href: "/superadmin/timetable", icon: Calendar },
    ],
    teacher: [
      { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
      { name: "My Timetable", href: "/teacher/timetable", icon: Calendar },
      { name: "My Units", href: "/teacher/units", icon: BookOpen },
    ],
    // Add student & parent links later
  };

  const links = navLinks[role] || [];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
          <h1 className="text-2xl font-black text-blue-400 tracking-wider">TUK<span className="text-white">SYS</span></h1>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}