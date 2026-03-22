// src/app/(dashboard)/student/page.js
import { auth } from "@/auth";
import Link from "next/link";
import { UserCircle, Calendar, Activity, FileText, ArrowRight, QrCode } from "lucide-react";

export default async function StudentDashboard() {
  const session = await auth();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="bg-sky-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Hello, {session?.user?.name?.split(' ')[0]}!</h1>
          <p className="text-sky-100 max-w-lg text-sm">
            Keep track of your academic journey. View your schedule, submit assignments, and monitor your attendance.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/4 translate-x-1/4" />
      </header>

      <h2 className="text-lg font-bold text-slate-800 px-1 pt-4">Student Hub</h2>

      {/* --- ADD THIS QUICK ACTION SECTION --- */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <QrCode size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">In a class right now?</h2>
            <p className="text-indigo-100 text-sm mt-1">
              Scan the teacher's QR code or enter the 4-digit PIN to mark your attendance.
            </p>
          </div>
        </div>
        
        <Link 
          href="/student/attendance/mark"
          className="shrink-0 bg-white text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 font-bold py-3 px-6 rounded-xl transition flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          Check In Now <ArrowRight size={18} />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/student/profile" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition group">
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-slate-800 group-hover:text-white transition">
            <UserCircle size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">My Profile</h3>
          <p className="text-xs text-slate-500 mb-3">View your registration and course details.</p>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">View <ArrowRight size={12}/></span>
        </Link>

        <Link href="/student/timetable" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition group">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition">
            <Calendar size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">Timetable</h3>
          <p className="text-xs text-slate-500 mb-3">Check your upcoming classes and venues.</p>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">Schedule <ArrowRight size={12}/></span>
        </Link>

        <Link href="/student/attendance" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition group">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-rose-500 group-hover:text-white transition">
            <Activity size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">Attendance</h3>
          <p className="text-xs text-slate-500 mb-3">Track your lecture attendance status.</p>
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">Records <ArrowRight size={12}/></span>
        </Link>

        <Link href="/student/assignments" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition group">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
            <FileText size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">Assignments</h3>
          <p className="text-xs text-slate-500 mb-3">Submit work and view your graded CATs.</p>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">Submit <ArrowRight size={12}/></span>
        </Link>
      </div>
    </div>
  );
}