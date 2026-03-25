"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  Users, GraduationCap, Calendar, CheckCircle2, 
  AlertTriangle, BookOpen, Clock, FileText, Mail 
} from "lucide-react";

export default function ParentDashboardPage() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/parent/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const data = await res.json();
        
        setChildren(data);
        if (data.length > 0) {
          setSelectedChildId(data[0].id);
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
          <p className="text-sm text-slate-500">Your account is active, but you are not linked to any students yet.</p>
        </div>
      </div>
    );
  }

  const activeChild = children.find(c => c.id === selectedChildId);

  // --- DATA CALCULATIONS ---
  // 1. Attendance Stats
  const totalClasses = activeChild.attendances.length;
  const presentClasses = activeChild.attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
  const attendancePercentage = totalClasses === 0 ? 0 : Math.round((presentClasses / totalClasses) * 100);

  // 2. Assignments (Pending vs Completed)
  const submittedAssessmentIds = activeChild.submissions.map(sub => sub.assessmentId);
  const allAssessments = activeChild.enrollments.flatMap(e => 
    e.unit.assessments.map(a => ({ ...a, unit: e.unit }))
  );
  
  const pendingAssignments = allAssessments.filter(a => !submittedAssessmentIds.includes(a.id));
  const completedAssignments = activeChild.submissions;
  const gradedAssignments = completedAssignments.filter(sub => sub.marks !== null);

  // --- HELPERS ---
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

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "attendance", label: "Attendance History" },
    { id: "assignments", label: "Assignments" },
    { id: "teachers", label: "Teachers & Units" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Parent Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor academic progress and attendance</p>
        </div>

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

      {/* Profile Card */}
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
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-sm text-center flex-1 sm:flex-none">
            <p className="text-emerald-100 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Overall Attendance</p>
            <p className="font-bold text-lg">{attendancePercentage}%</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-sm text-center flex-1 sm:flex-none">
            <p className="text-emerald-100 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Course</p>
            <p className="font-medium truncate max-w-[150px]">{activeChild.course?.name || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Custom Tabs Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 border-b border-slate-200 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition whitespace-nowrap ${
              activeTab === tab.id 
              ? "bg-white border-t border-l border-r border-slate-200 text-emerald-600 translate-y-px" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT --- */}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 col-span-1 lg:col-span-2">
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><Clock size={20}/></div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{pendingAssignments.length}</p>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pending Assignments</p>
                </div>
             </div>
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center"><CheckCircle2 size={20}/></div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{gradedAssignments.length}</p>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Graded Assignments</p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" /> Recent Grades
              </h3>
            </div>
            {gradedAssignments.slice(0, 5).length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No graded assignments available yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {gradedAssignments.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{sub.assessment.title}</p>
                      <p className="text-xs text-slate-500">{sub.assessment.unit.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{sub.marks} <span className="text-xs text-slate-400">/ {sub.assessment.maxMarks}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-emerald-600" /> Recent Attendance
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {activeChild.attendances.slice(0, 5).map((record) => (
                <div key={record.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{record.lecture.unit.name}</p>
                    <p className="text-xs text-slate-500">{new Date(record.lecture.date).toLocaleDateString()} at {record.lecture.time}</p>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
             <h3 className="font-bold text-slate-800">Full Attendance History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-5">Unit</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeChild.attendances.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="py-3 px-5 text-sm text-slate-600">
                      {new Date(record.lecture.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} <br/>
                      <span className="text-xs text-slate-400">{record.lecture.time}</span>
                    </td>
                    <td className="py-3 px-5 text-sm font-medium text-slate-800">{record.lecture.unit.name} ({record.lecture.unit.code})</td>
                    <td className="py-3 px-5 text-right">{getStatusBadge(record.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-rose-500"/> Pending Tasks</h3>
            </div>
            {pendingAssignments.length === 0 ? (
               <p className="p-6 text-sm text-slate-500 text-center">No pending assignments.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingAssignments.map(a => (
                  <div key={a.id} className="p-5 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded mb-2 inline-block">DUE: {new Date(a.dueDate).toLocaleDateString()}</span>
                      <p className="font-semibold text-slate-800">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.unit.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Completed & Graded</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {completedAssignments.map(sub => (
                <div key={sub.id} className="p-5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800">{sub.assessment.title}</p>
                    <p className="text-xs text-slate-500">{sub.assessment.unit.name}</p>
                  </div>
                  <div className="text-right">
                    {sub.marks !== null ? (
                      <p className="text-lg font-bold text-emerald-600">{sub.marks} <span className="text-xs text-slate-400">/ {sub.assessment.maxMarks}</span></p>
                    ) : (
                      <span className="text-[10px] font-bold tracking-wider bg-amber-100 text-amber-700 px-2 py-1 rounded">AWAITING GRADE</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TEACHERS & UNITS TAB */}
      {activeTab === "teachers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeChild.enrollments.map(enrollment => (
            <div key={enrollment.unit.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="mb-4">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">{enrollment.unit.code}</span>
                <h4 className="font-bold text-slate-800 text-lg leading-tight">{enrollment.unit.name}</h4>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Assigned Teachers</p>
                {enrollment.unit.teachers.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No teacher assigned yet.</p>
                ) : (
                  enrollment.unit.teachers.map(t => (
                    <div key={t.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{t.user.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={12}/> {t.user.email}</p>
                      </div>
                      <a href={`mailto:${t.user.email}`} className="p-2 bg-white rounded-md border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition shadow-sm">
                        <Mail size={16} />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}