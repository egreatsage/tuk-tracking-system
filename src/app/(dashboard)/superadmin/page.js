// src/app/(dashboard)/superadmin/page.js
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, GraduationCap, BookOpen, Activity, ArrowRight, PlusCircle, Calendar, Settings } from "lucide-react";

export default async function SuperadminDashboard() {
  const session = await auth();

  // Fetch all the system statistics concurrently for speed
  const [studentCount, teacherCount, courseCount, unitCount] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.course.count(),
    prisma.unit.count(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header */}
      <header className="bg-white rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl text-gray-800 font-bold tracking-tight mb-2 flex items-center gap-2">
            <Settings className="text-indigo-400" size={28} />
            System Administration
          </h1>
          <p className="text-slate-400 max-w-lg text-sm">
            Welcome back, {session?.user?.name}. Monitor university metrics, manage users, and oversee the entire TUK Tracking System from your central hub.
          </p>
        </div>
        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full -translate-y-1/4 translate-x-1/4 blur-2xl" />
        <div className="absolute right-32 bottom-0 w-32 h-32 bg-sky-500 opacity-10 rounded-full translate-y-1/2 blur-xl" />
      </header>

      {/* Statistics Grid */}
      <h2 className="text-lg font-bold text-slate-800 px-1 pt-4">System Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Student Stat */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center shrink-0">
            <GraduationCap size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Students</p>
            <p className="text-2xl font-black text-slate-900">{studentCount}</p>
          </div>
        </div>

        {/* Teacher Stat */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Teachers</p>
            <p className="text-2xl font-black text-slate-900">{teacherCount}</p>
          </div>
        </div>

        {/* Course Stat */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <BookOpen size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Active Courses</p>
            <p className="text-2xl font-black text-slate-900">{courseCount}</p>
          </div>
        </div>

        {/* Unit Stat */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shrink-0">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Units</p>
            <p className="text-2xl font-black text-slate-900">{unitCount}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-slate-800 px-1 pt-6">Quick Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/superadmin/students" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition">
              <PlusCircle size={20} />
            </div>
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Manage Students</h3>
          <p className="text-sm text-slate-500 mb-4">Add new students, update profiles, or reset passwords.</p>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1">Open Directory <ArrowRight size={14}/></span>
        </Link>

        <Link href="/superadmin/courses" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition">
              <BookOpen size={20} />
            </div>
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Manage Courses</h3>
          <p className="text-sm text-slate-500 mb-4">Create degree programs and assign core modules.</p>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">View Courses <ArrowRight size={14}/></span>
        </Link>

        <Link href="/superadmin/timetable" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition">
              <Calendar size={20} />
            </div>
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Global Timetable</h3>
          <p className="text-sm text-slate-500 mb-4">Schedule lectures, assign venues, and map lecturers.</p>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">Manage Schedule <ArrowRight size={14}/></span>
        </Link>
      </div>

    </div>
  );
}