"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Users,
  FileDown,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
} from "lucide-react";

// Static imports — required so autoTable patches jsPDF's prototype before use.
// Install: npm install jspdf jspdf-autotable
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import LiveAttendanceCounter from "@/components/LiveAttendanceCounter";

// ---------------------------------------------------------------------------
// PDF EXPORT
// ---------------------------------------------------------------------------
function exportLectureToPDF(lecture, unitLabel) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(30, 30, 35);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("Attendance Record", 14, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 190);
  doc.text(unitLabel, 14, 18);
  doc.text(
    `${new Date(lecture.date).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}  ·  ${lecture.time}  ·  ${lecture.venue}`,
    14,
    24
  );

  // ── Stats bar ────────────────────────────────────────────────────────────
  const counts = tally(lecture.attendances);
  const statsY = 36;
  const statItems = [
    { label: "PRESENT", value: counts.PRESENT, color: [16, 185, 129] },
    { label: "ABSENT",  value: counts.ABSENT,  color: [239, 68,  68]  },
    { label: "LATE",    value: counts.LATE,    color: [245, 158, 11]  },
    { label: "EXCUSED", value: counts.EXCUSED, color: [100, 116, 139] },
  ];
  statItems.forEach((s, i) => {
    const x = 14 + i * 46;
    doc.setFillColor(...s.color);
    doc.roundedRect(x, statsY, 40, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`${s.value}  ${s.label}`, x + 4, statsY + 6.5);
  });

  // ── Table ────────────────────────────────────────────────────────────────
  const rows = lecture.attendances.map((r, idx) => [
    idx + 1,
    r.student.user.name,
    r.student.regNumber ?? "—",
    r.status,
    r.status === "EXCUSED" && r.reason ? r.reason : "—",
  ]);

  // autoTable(doc, options) — the correct v3+ API that avoids "not a function"
  autoTable(doc, {
    startY: statsY + 18,
    head: [["#", "Student Name", "Reg. Number", "Status", "Reason / Note"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 30, 35],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 50] },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      3: { cellWidth: 22, halign: "center" },
    },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const status = data.cell.raw;
        const colorMap = {
          PRESENT: [16, 185, 129],
          ABSENT:  [239, 68,  68],
          LATE:    [245, 158, 11],
          EXCUSED: [100, 116, 139],
        };
        const col = colorMap[status] ?? [120, 120, 120];
        doc.setFontSize(7);
        doc.setTextColor(...col);
        doc.setFont("helvetica", "bold");
        const cx = data.cell.x + data.cell.width / 2;
        const cy = data.cell.y + data.cell.height / 2 + 2;
        doc.text(status, cx, cy, { align: "center" });
        data.cell.text = [];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Footer ───────────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Page ${i} of ${pageCount}  ·  Generated ${new Date().toLocaleString()}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  doc.save(`attendance_${lecture.date}_${lecture.venue}.pdf`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function tally(attendances = []) {
  return attendances.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }),
    { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 }
  );
}

const STATUS_META = {
  PRESENT: { pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  ABSENT:  { pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",          dot: "bg-rose-500"    },
  LATE:    { pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",        dot: "bg-amber-400"   },
  EXCUSED: { pill: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",       dot: "bg-slate-400"   },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.EXCUSED;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${meta.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {status}
    </span>
  );
}

function TallyBadge({ label, value, colorClass }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${colorClass}`}>
      {value} <span className="font-normal opacity-70">{label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Student Table (inside expanded row)
// ---------------------------------------------------------------------------
function StudentTable({ attendances }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = attendances.filter((r) => {
    const matchStatus = filter === "ALL" || r.status === filter;
    const matchSearch = r.student.user.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    
    <div className="mt-4">
      <LiveAttendanceCounter/>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          placeholder="Search student…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50 placeholder-stone-400"
        />
        <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
          {["ALL", "PRESENT", "ABSENT", "LATE", "EXCUSED"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-colors ${
                filter === s
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {s === "ALL" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-stone-50 z-10">
              <tr>
                <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 w-8">#</th>
                <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400">Student</th>
                <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 hidden sm:table-cell">Reg. No.</th>
                <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400">Status</th>
                <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 hidden md:table-cell">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-stone-400">
                    No students match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((record, idx) => (
                  <tr key={record.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 px-4 text-[11px] text-stone-400 tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-stone-200 text-stone-600 text-[10px] font-bold flex items-center justify-center uppercase">
                          {record.student.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </span>
                        <span className="text-xs font-medium text-stone-700 truncate max-w-[120px] sm:max-w-none">
                          {record.student.user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-stone-400 font-mono hidden sm:table-cell">
                      {record.student.regNumber ?? "—"}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusPill status={record.status} />
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-stone-400 italic hidden md:table-cell">
                      {record.status === "EXCUSED" && record.reason ? record.reason : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 text-[10px] text-stone-400">
            Showing {filtered.length} of {attendances.length} students
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lecture Row
// FIX: outer wrapper is a <div>. The toggle area and the export button are
// siblings inside a flex row — never a <button> nested inside a <button>.
// ---------------------------------------------------------------------------
function LectureRow({ lecture, unitLabel, isOpen, onToggle }) {
  const counts = tally(lecture.attendances);
  const total = lecture.attendances.length;
  const attendanceRate = total > 0 ? Math.round((counts.PRESENT / total) * 100) : 0;

  return (
    <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">

      {/* Header row — flex container holding toggle area + export button */}
      <div className="flex items-stretch">

        {/* Toggle button — occupies all remaining width */}
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 text-left"
        >
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Calendar badge */}
            <div className="shrink-0 w-12 h-12 rounded-xl bg-stone-900 flex flex-col items-center justify-center text-white">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                {new Date(lecture.date).toLocaleDateString("en", { month: "short" })}
              </span>
              <span className="text-lg font-black leading-none">
                {new Date(lecture.date).getDate()}
              </span>
            </div>

            <div className="min-w-0">
              <p className="font-bold text-stone-800 text-sm leading-tight">
                {new Date(lecture.date).toLocaleDateString("en", { weekday: "long" })}
                <span className="ml-2 font-mono text-stone-400 text-[11px] font-normal">{lecture.time}</span>
              </p>
              <p className="text-xs text-stone-500 mt-0.5 truncate">{lecture.venue}</p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <TallyBadge label="present" value={counts.PRESENT} colorClass="bg-emerald-50 text-emerald-700" />
                <TallyBadge label="absent"  value={counts.ABSENT}  colorClass="bg-rose-50 text-rose-700"       />
                {counts.LATE    > 0 && <TallyBadge label="late"    value={counts.LATE}    colorClass="bg-amber-50 text-amber-700"   />}
                {counts.EXCUSED > 0 && <TallyBadge label="excused" value={counts.EXCUSED} colorClass="bg-stone-100 text-stone-600" />}
              </div>
            </div>
          </div>

          {/* Attendance rate + chevron */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xl font-black text-stone-800 tabular-nums leading-none">{attendanceRate}%</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{total} students</p>
            </div>
            <div className="hidden sm:block w-1 h-10 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="w-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ height: `${attendanceRate}%`, marginTop: `${100 - attendanceRate}%` }}
              />
            </div>
            <ChevronDown
              size={18}
              className={`text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {/* Export button — sibling of the toggle button, NOT inside it */}
        <div className="flex items-start pt-4 pr-4 shrink-0">
          <button
            type="button"
            onClick={() => exportLectureToPDF(lecture, unitLabel)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-600 text-xs font-semibold transition-colors duration-150"
          >
            <FileDown size={13} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Expanded student list */}
      {isOpen && (
        <div className="border-t border-stone-100 px-5 pb-5">
          <StudentTable attendances={lecture.attendances} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AttendanceHistoryPage() {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [lectures, setLectures] = useState([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [openLectureId, setOpenLectureId] = useState(null);

  const selectedUnitLabel = (() => {
    const u = units.find((u) => u.id === selectedUnit);
    return u ? `${u.code} — ${u.name}` : "";
  })();

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch("/api/teacher/units");
        if (!res.ok) throw new Error("Failed to fetch your units");
        const data = await res.json();
        setUnits(data);
        if (data.length > 0) setSelectedUnit(data[0].id);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoadingUnits(false);
      }
    };
    fetchUnits();
  }, []);

  useEffect(() => {
    if (!selectedUnit) return;
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      setOpenLectureId(null);
      try {
        const res = await fetch(`/api/attendance/history?unitId=${selectedUnit}`);
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();
        setLectures(data);
        if (data.length > 0) setOpenLectureId(data[0].id);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [selectedUnit]);

  const toggleLecture = useCallback(
    (id) => setOpenLectureId((prev) => (prev === id ? null : id)),
    []
  );

  return (
    <div
      className="min-h-screen bg-[#F7F5F2]"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <header className="sticky top-0 z-20 bg-[#F7F5F2]/80 backdrop-blur-md border-b border-stone-200 px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">Attendance History</h1>
            {selectedUnitLabel && (
              <p className="text-xs text-stone-400 mt-0.5">{selectedUnitLabel}</p>
            )}
          </div>
          <div className="relative w-full sm:w-60">
            <BookOpen size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              disabled={isLoadingUnits}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold bg-white text-stone-700 focus:ring-2 focus:ring-stone-400 focus:outline-none appearance-none shadow-sm"
            >
              <option value="" disabled>Select a unit…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.code} — {u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-3">
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="w-9 h-9 border-[3px] border-stone-200 border-t-stone-800 rounded-full animate-spin" />
            <p className="text-xs text-stone-400">Loading records…</p>
          </div>
        ) : lectures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-200 flex items-center justify-center mb-4">
              <Calendar size={28} className="text-stone-400" />
            </div>
            <p className="font-bold text-stone-700">No lectures recorded yet</p>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              Once you take attendance for this unit, the records will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs text-stone-400">
                <span className="font-semibold text-stone-600">{lectures.length}</span>{" "}
                lecture{lectures.length !== 1 ? "s" : ""} recorded
              </p>
              <div className="flex items-center gap-1 text-[10px] text-stone-400">
                <Users size={11} />
                {lectures[0]?.attendances?.length ?? 0} students enrolled
              </div>
            </div>

            {lectures.map((lecture) => (
              <LectureRow
                key={lecture.id}
                lecture={lecture}
                unitLabel={selectedUnitLabel}
                isOpen={openLectureId === lecture.id}
                onToggle={() => toggleLecture(lecture.id)}
              />
            ))}
          </>
        )}
      </main>
    </div>
  );
}