"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Users, GraduationCap, Calendar, CheckCircle2, AlertTriangle, BookOpen } from "lucide-react";

export default function ParentDashboardPage() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/parent/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const data = await res.json();
        
        setChildren(data);
        if (data.length > 0) {
          setSelectedChildId(data[0].id); // Auto-select the first child
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <span className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md w-full shadow-sm">
          <Users size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Students Linked</h2>
          <p className="text-sm text-slate-500">Your account is active, but you are not linked to any students yet. Ask your child or the school administrator to send you an invite link.</p>
        </div>
      </div>
    );
  }

  // Find the currently selected child's full object
  const activeChild = children.find(c => c.id === selectedChildId);

  // Helper for attendance status badge
  const getStatusBadge = (status) => {
    const styles = {
      PRESENT: "bg-emerald-100 text-emerald-700 border-emerald-200",
      ABSENT: "bg-rose-100 text-rose-700 border-rose-200",
      LATE: "bg-amber-100 text-amber-700 border-amber-200",
      EXCUSED: "bg-slate-100 text-slate-700 border-slate-300",
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Parent Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor academic progress and attendance</p>
        </div>

        {/* The Child Switcher */}
        {children.length > 1 && (
          <div className="w-full sm:w-64">
            <div className="relative">
              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-emerald-300 focus:outline-none appearance-none shadow-sm"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.user.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {/* Child Overview Profile Card */}
      <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-md mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{activeChild.user.name}</h2>
            <p className="text-emerald-100 text-sm font-medium">{activeChild.regNumber}</p>
          </div>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-sm text-right w-full sm:w-auto">
          <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-0.5">Course</p>
          <p className="font-medium truncate max-w-[200px]">{activeChild.course?.name || "Not Assigned"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Recent Grades */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" /> Recent Grades
            </h3>
          </div>
          
          {activeChild.submissions.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No graded assignments available yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeChild.submissions.map((sub) => (
                <div key={sub.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold tracking-wider text-slate-400">{sub.assessment.unit.code}</span>
                      <span className="text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{sub.assessment.type}</span>
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">{sub.assessment.title}</p>
                    {sub.feedback && <p className="text-xs text-slate-500 mt-1 italic truncate w-48">"{sub.feedback}"</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-emerald-600">{sub.marks} <span className="text-xs text-slate-400 font-medium">/ {sub.assessment.maxMarks}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Attendance */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600" /> Recent Attendance
            </h3>
          </div>
          
          {activeChild.attendances.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <AlertTriangle size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No attendance records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <tbody className="divide-y divide-slate-100">
                  {activeChild.attendances.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-800 text-sm">{record.lecture.unit.name}</p>
                        <p className="text-xs text-slate-500">{new Date(record.lecture.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {record.lecture.time}</p>
                      </td>
                      <td className="py-3 px-5 text-right">
                        {getStatusBadge(record.status)}
                        {record.reason && <p className="text-[10px] text-slate-400 mt-1 italic">{record.reason}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}