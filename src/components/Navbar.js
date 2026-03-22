// src/components/Navbar.js
"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { data: session, status } = useSession();

  if (status === "loading")
    return (
      <div className="h-16 bg-white border-b flex items-center px-4 sm:px-6">
        Loading...
      </div>
    );

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      {/* Left: Brand */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo mark visible on all screens */}
        <div className="flex-shrink-0 w-8 h-8 bg-blue-900 rounded-md flex items-center justify-center">
          <span className="text-white text-xs font-bold">TUK</span>
        </div>
        {/* Full title hidden on small screens */}
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-blue-900 hidden sm:block truncate">
          TUK Tracking System
        </h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Notification Bell */}
        <div className="text-gray-500 hover:text-blue-600 relative">
          <NotificationBell size={20} />
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200" />

        {/* User info — hidden on very small screens */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-semibold text-gray-800 max-w-[120px] truncate">
            {session?.user?.name || "User"}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {session?.user?.role?.toLowerCase() || "Role"}
          </span>
        </div>

        {/* Profile icon */}
        <Link
          href={`/${session?.user?.role?.toLowerCase()}/profile`}
          className="bg-blue-100 p-2 rounded-full text-blue-700 hover:bg-blue-200 transition flex-shrink-0"
          title={session?.user?.name || "Profile"}
        >
          <UserIcon size={18} />
        </Link>

        {/* Logout button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium transition flex-shrink-0"
          title="Logout"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}