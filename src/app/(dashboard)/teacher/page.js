// src/app/(dashboard)/teacher/page.js
import { auth } from "@/auth";
import Link from "next/link";
import { Calendar, ClipboardCheck, FileText, ArrowRight } from "lucide-react";

export default async function TeacherDashboard() {
  const session = await auth();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="bg-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {session?.user?.name?.split(' ')[0]}!</h1>
          <p className="text-indigo-100 max-w-lg text-sm">
            Manage your classes, mark attendance, and grade assignments all from your command center.
          </p>
        </div>
        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="absolute right-32 bottom-0 w-32 h-32 bg-white opacity-10 rounded-full translate-y-1/2" />
      </header>

      <h2 className="text-lg font-bold text-slate-800 px-1 pt-4">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/teacher/timetable" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition group">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
            <Calendar size={24} />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">My Timetable</h3>
          <p className="text-sm text-slate-500 mb-4">View your upcoming lectures and class venues.</p>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">View Schedule <ArrowRight size={14}/></span>
        </Link>

        <Link href="/teacher/attendance" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition group">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
            <ClipboardCheck size={24} />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Attendance</h3>
          <p className="text-sm text-slate-500 mb-4">Mark and track student attendance for your active units.</p>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">Mark Register <ArrowRight size={14}/></span>
        </Link>

        <Link href="/teacher/assessments" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition group">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition">
            <FileText size={24} />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Assessments</h3>
          <p className="text-sm text-slate-500 mb-4">Upload assignments, CATs, and grade student submissions.</p>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1">Manage Grades <ArrowRight size={14}/></span>
        </Link>
      </div>
    </div>
  );
}