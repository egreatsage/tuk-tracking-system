// src/components/Navbar.js
"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User as UserIcon, Bell } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="h-16 bg-white border-b flex items-center px-6">Loading...</div>;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-blue-900 hidden md:block">TUK Tracking System</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Notification Bell (Placeholder for Phase 4) */}
        <button className="text-gray-500 hover:text-blue-600 relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">3</span>
        </button>

        <div className="flex items-center gap-3 border-l pl-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-800">{session?.user?.name || "User"}</span>
            <span className="text-xs text-gray-500 capitalize">{session?.user?.role?.toLowerCase() || "Role"}</span>
          </div>
          
          <Link href={`/${session?.user?.role?.toLowerCase()}/profile`} className="bg-blue-100 p-2 rounded-full text-blue-700 hover:bg-blue-200 transition">
            <UserIcon size={20} />
          </Link>

          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium ml-2"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}