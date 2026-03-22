"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { X, Save, UserCheck, AlertCircle, Play, KeyRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react"; // <-- Import QR Code library

export default function AttendanceModal({ slot, onClose }) {
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [reasonsState, setReasonsState] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State variables for OTP & QR flow
  const [isStartingLecture, setIsStartingLecture] = useState(false);
  const [otpCode, setOtpCode] = useState(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [lectureId, setLectureId] = useState(null); // <-- Keep track of the actual lecture ID

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
          initialReasons[student.id] = "";
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

  const handleStartLecture = async () => {
    setIsStartingLecture(true);
    try {
      const res = await fetch("/api/teacher/lectures/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timetableSlotId: slot.id }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to start lecture");

      // Save the generated code, expiry, AND the lecture ID from the database
      setOtpCode(data.otpCode);
      setOtpExpiresAt(new Date(data.otpExpiresAt));
      setLectureId(data.id); 
      
      toast.success("Lecture started! Project this code to students.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsStartingLecture(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
    if (status !== "EXCUSED") {
      setReasonsState((prev) => ({ ...prev, [studentId]: "" }));
    }
  };

  const handleReasonChange = (studentId, text) => {
    setReasonsState((prev) => ({ ...prev, [studentId]: text }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const attendanceData = Object.entries(attendanceState).map(([studentId, status]) => ({
      studentId,
      status,
      reason: status === "EXCUSED" ? reasonsState[studentId] : null,
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
              Manage Lecture
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {slot.title.split(' - ')[0]} • {slot.dateClicked.toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* --- OTP & QR CODE SECTION --- */}
        <div className="p-5 border-b border-slate-100 bg-white shrink-0">
          {!otpCode ? (
             <button
             onClick={handleStartLecture}
             disabled={isStartingLecture}
             className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition"
           >
             {isStartingLecture ? (
               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <>
                 <Play size={18} /> Start Lecture & Generate Code
               </>
             )}
           </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 bg-indigo-50 border border-indigo-100 rounded-xl p-6">
               
               {/* 1. The QR Code */}
               <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                 <QRCodeSVG 
                   // Generates a link using your current domain
                   value={`${typeof window !== 'undefined' ? window.location.origin : ''}/student/attendance/mark?lectureId=${lectureId}&code=${otpCode}`} 
                   size={140} 
                   level="H"
                   includeMargin={true}
                 />
                 <p className="text-[11px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Scan to check-in</p>
               </div>

               {/* 2. The Text Code */}
               <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                     <KeyRound size={16} />
                   </div>
                   <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Or Enter Code</p>
                 </div>
                 
                 <h1 className="text-5xl font-mono font-bold text-slate-900 tracking-[0.2em] mb-2">{otpCode}</h1>
                 
                 <div className="inline-flex items-center gap-1.5 bg-indigo-100/50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Code expires at {otpExpiresAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
               </div>
               
            </div>
          )}
        </div>

        {/* Body / Student List (Manual Override) */}
        <div className="flex-1 overflow-y-auto p-5">
            <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Manual Override</h4>
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
            Save Manual Overrides
          </button>
        </div>

      </div>
    </div>
  );
}