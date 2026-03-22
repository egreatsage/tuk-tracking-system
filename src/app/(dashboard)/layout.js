// src/app/(dashboard)/layout.js
"use client";

import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BookOpen, Users, Calendar, LayoutDashboard,
  ClipboardCheck, FileText, UserCircle, Activity, X, Menu
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  if (status === "loading") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-blue-900 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 tracking-widest uppercase font-medium">Loading</span>
      </div>
    );
  }

  const role = session?.user?.role?.toLowerCase() || "student";

  const navLinks = {
    superadmin: [
      { name: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
      { name: "Courses", href: "/superadmin/courses", icon: BookOpen },
      { name: "Units", href: "/superadmin/units", icon: Activity },
      { name: "Teachers", href: "/superadmin/teachers", icon: Users },
      { name: "Students", href: "/superadmin/students", icon: Users },
      { name: "Timetable", href: "/superadmin/timetable", icon: Calendar },
      { name: "Venues", href: "/superadmin/venues", icon: LayoutDashboard },
    ],
    teacher: [
      { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
      { name: "My Timetable", href: "/teacher/timetable", icon: Calendar },
      { name: "Attendance", href: "/teacher/attendance", icon: ClipboardCheck },
      { name: "Assessments", href: "/teacher/assessments", icon: FileText },
    ],
    student: [
      { name: "Dashboard", href: "/student", icon: LayoutDashboard },
      { name: "My Profile", href: "/student/profile", icon: UserCircle },
      { name: "Timetable", href: "/student/timetable", icon: Calendar },
      { name: "Attendance", href: "/student/attendance", icon: Activity },
      { name: "Assignments", href: "/student/assignments", icon: FileText },
    ],
    parent: [
      { name: "Dashboard", href: "/parent", icon: LayoutDashboard },
    ],
  };

  const links = navLinks[role] || [];

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-black tracking-wider">TUK</span>
          </div>
          <div>
            <p className="text-blue-900 font-bold text-sm leading-tight">TUK Tracking</p>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-medium">System</p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-5 pt-5 pb-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {role}
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== `/${role}` && pathname.startsWith(`${link.href}/`));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive
                  ? "bg-blue-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-blue-900"
              }`}
            >
              <Icon
                size={17}
                className={`flex-shrink-0 transition-colors ${
                  isActive ? "text-blue-200" : "text-gray-400 group-hover:text-blue-700"
                }`}
              />
              <span className="truncate">{link.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
        <p className="text-gray-300 text-[10px] text-center tracking-wide">
          © {new Date().getFullYear()} TUK System
        </p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-white font-sans">

      {/* Desktop Sidebar */}
      <aside className="w-60 xl:w-64 bg-white border-r border-gray-100 text-gray-800 flex-shrink-0 hidden md:flex flex-col z-20 fixed top-0 left-0 h-full shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white border-r border-gray-100 text-gray-800 flex flex-col z-40 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-60 xl:ml-64">

        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center h-14 px-4 bg-white border-b border-gray-100 sticky top-0 z-20">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-900 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-6 h-6 rounded-md bg-blue-900 flex items-center justify-center">
              <span className="text-white text-[8px] font-black">TUK</span>
            </div>
            <span className="text-blue-900 font-bold text-sm">TUK Tracking System</span>
          </div>
        </div>

        {/* Desktop Navbar */}
        <div className="hidden md:block">
          <Navbar />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}