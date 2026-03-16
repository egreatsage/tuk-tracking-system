"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { BookOpen, Calendar, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function StudentAttendancePage() {
  const [units, setUnits] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/student/attendance");
        if (!res.ok) throw new Error("Failed to fetch attendance data");
        const data = await res.json();
        
        setUnits(data.units);
        setAttendances(data.attendances);
        if (data.units.length > 0) setSelectedUnit(data.units[0].id);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter attendance records by the selected unit
  const filteredRecords = attendances.filter(a => a.lecture.unitId === selectedUnit);

  // Calculate Statistics
  const totalClasses = filteredRecords.length;
  // We'll count PRESENT and LATE as "attended" for the percentage calculation
  const attendedClasses = filteredRecords.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
  const attendancePercentage = totalClasses === 0 ? 100 : Math.round((attendedClasses / totalClasses) * 100);
  const isAtRisk = attendancePercentage < 75;

  // Helper for status styling
  const getStatusBadge = (status) => {
    const styles = {
      PRESENT: "bg-emerald-100 text-emerald-700 border-emerald-200",
      ABSENT: "bg-rose-100 text-rose-700 border-rose-200",
      LATE: "bg-amber-100 text-amber-700 border-amber-200",
      EXCUSED: "bg-slate-100 text-slate-700 border-slate-300",
    };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-md border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Track your lecture attendance and requirements</p>
        </div>

        {/* Unit Selector */}
        <div className="w-full sm:w-64">
          <div className="relative">
            <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              disabled={isLoading || units.length === 0}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white text-slate-700 focus:ring-2 focus:ring-sky-300 focus:outline-none appearance-none"
            >
              {units.length === 0 ? (
                <option value="">No units enrolled</option>
              ) : (
                units.map((u) => (
                  <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                ))
              )}
            </select>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <span className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
        </div>
      ) : units.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <BookOpen size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-700">You are not enrolled in any units</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border ${isAtRisk ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="flex items-center gap-2 mb-2">
                {isAtRisk ? <AlertTriangle size={18} className="text-rose-500" /> : <CheckCircle2 size={18} className="text-emerald-500" />}
                <h3 className={`text-sm font-semibold ${isAtRisk ? 'text-rose-700' : 'text-slate-600'}`}>Attendance %</h3>
              </div>
              <p className={`text-3xl font-bold ${isAtRisk ? 'text-rose-600' : 'text-slate-900'}`}>{attendancePercentage}%</p>
              {isAtRisk && <p className="text-xs text-rose-500 mt-1 font-medium">Below 75% requirement</p>}
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Total Classes</h3>
              <p className="text-3xl font-bold text-slate-900">{totalClasses}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Classes Attended</h3>
              <p className="text-3xl font-bold text-emerald-600">{attendedClasses}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Missed Classes</h3>
              <p className="text-3xl font-bold text-rose-600">{totalClasses - attendedClasses}</p>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Attendance History</h3>
            </div>
            
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-700">No classes recorded yet</p>
                <p className="text-sm mt-1">Your attendance records will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">Date & Time</th>
                      <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">Venue</th>
                      <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-5">
                          <p className="font-semibold text-slate-800 text-sm">
                            {new Date(record.lecture.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{record.lecture.time}</p>
                        </td>
                        <td className="py-3 px-5 text-sm text-slate-600">{record.lecture.venue}</td>
                        <td className="py-3 px-5">{getStatusBadge(record.status)}</td>
                        <td className="py-3 px-5">
                          {record.status === 'EXCUSED' && record.reason ? (
                            <span className="text-xs text-slate-600 italic">"{record.reason}"</span>
                          ) : record.status === 'ABSENT' ? (
                            <span className="text-xs text-rose-400 font-medium flex items-center gap-1"><XCircle size={12}/> Unexcused</span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}