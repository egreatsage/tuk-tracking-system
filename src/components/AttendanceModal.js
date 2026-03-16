"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { X, Save, UserCheck, AlertCircle } from "lucide-react";

export default function AttendanceModal({ slot, onClose }) {
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [reasonsState, setReasonsState] = useState({}); // <-- New state to track reasons
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`/api/units/${slot.unitId}/students`);
        if (!res.ok) throw new Error("Failed to load students");
        const data = await res.json();
        setStudents(data);

        const initialStatus = {};
        const initialReasons = {};
        data.forEach((student) => {
          initialStatus[student.id] = "ABSENT";
          initialReasons[student.id] = ""; // Initialize empty reasons
        });
        setAttendanceState(initialStatus);
        setReasonsState(initialReasons);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [slot.unitId]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
    // If they change the status away from EXCUSED, clear the reason to keep data clean
    if (status !== "EXCUSED") {
      setReasonsState((prev) => ({ ...prev, [studentId]: "" }));
    }
  };

  const handleReasonChange = (studentId, text) => {
    setReasonsState((prev) => ({ ...prev, [studentId]: text }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Format data for the API, including the reason
    const attendanceData = Object.entries(attendanceState).map(([studentId, status]) => ({
      studentId,
      status,
      reason: status === "EXCUSED" ? reasonsState[studentId] : null, // Only send reason if excused
    }));

    const isoDate = slot.dateClicked.toISOString().split('T')[0] + "T00:00:00.000Z";

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: slot.unitId,
          date: isoDate,
          time: slot.startTime,
          venue: slot.venue,
          attendanceData,
        }),
      });

      if (!res.ok) throw new Error("Failed to save records");
      
      toast.success("Attendance marked successfully!");
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <UserCheck className="text-indigo-600" size={20} />
              Mark Attendance
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {slot.title.split(' - ')[0]} • {slot.dateClicked.toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Body / Student List */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-10 text-slate-500 flex flex-col items-center">
              <AlertCircle size={32} className="mb-2 text-amber-500" />
              <p>No students enrolled in this unit yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const isExcused = attendanceState[student.id] === "EXCUSED";
                
                return (
                  <div key={student.id} className="flex flex-col p-3 rounded-xl border border-slate-200 hover:border-indigo-200 transition gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{student.user.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{student.regNumber}</p>
                      </div>
                      
                      {/* Status Toggle Buttons */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
                        {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => {
                          const isSelected = attendanceState[student.id] === status;
                          const colors = {
                            PRESENT: "bg-emerald-500 text-white",
                            ABSENT: "bg-rose-500 text-white",
                            LATE: "bg-amber-500 text-white",
                            EXCUSED: "bg-slate-500 text-white",
                          };
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(student.id, status)}
                              className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-all ${
                                isSelected ? colors[status] + " shadow-sm" : "text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {status === "EXCUSED" ? "EXCUSED" : status.charAt(0)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Conditional Input for Reason */}
                    {isExcused && (
                      <div className="mt-1 animate-in slide-in-from-top-2 duration-200">
                        <input
                          type="text"
                          placeholder="Enter reason for absence (e.g., Medical, Sports...)"
                          value={reasonsState[student.id]}
                          onChange={(e) => handleReasonChange(student.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition bg-slate-50"
                          required={isExcused}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving || students.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Attendance
          </button>
        </div>

      </div>
    </div>
  );
}