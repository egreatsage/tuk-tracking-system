"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import {
  Trash2, AlertCircle, CheckCircle2, Clock, MapPin, User,
  BookOpen, ChevronRight, LayoutGrid, List, X, ChevronDown,
  GraduationCap, Calendar,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_SHORT = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri" };

const TIME_SLOTS = [
  "07:00","08:00","09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00","18:00","19:00",
];

// 8 distinct slot color palettes (bg, text, border, dot)
const UNIT_COLORS = [
  { bg: "bg-violet-100",  text: "text-violet-800",  border: "border-violet-300",  dot: "bg-violet-500",  pill: "bg-violet-100 text-violet-800 border-violet-200"  },
  { bg: "bg-sky-100",     text: "text-sky-800",     border: "border-sky-300",     dot: "bg-sky-500",     pill: "bg-sky-100 text-sky-800 border-sky-200"            },
  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800 border-emerald-200"},
  { bg: "bg-amber-100",   text: "text-amber-800",   border: "border-amber-300",   dot: "bg-amber-500",   pill: "bg-amber-100 text-amber-800 border-amber-200"      },
  { bg: "bg-rose-100",    text: "text-rose-800",    border: "border-rose-300",    dot: "bg-rose-500",    pill: "bg-rose-100 text-rose-800 border-rose-200"         },
  { bg: "bg-teal-100",    text: "text-teal-800",    border: "border-teal-300",    dot: "bg-teal-500",    pill: "bg-teal-100 text-teal-800 border-teal-200"         },
  { bg: "bg-orange-100",  text: "text-orange-800",  border: "border-orange-300",  dot: "bg-orange-500",  pill: "bg-orange-100 text-orange-800 border-orange-200"   },
  { bg: "bg-pink-100",    text: "text-pink-800",    border: "border-pink-300",    dot: "bg-pink-500",    pill: "bg-pink-100 text-pink-800 border-pink-200"         },
];

/* ─────────────────────────────────────────────────────────────
   Small reusable sub-components
───────────────────────────────────────────────────────────── */
function FieldLabel({ children }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
      {children}
    </label>
  );
}

function SelectField({ label, icon: Icon, disabled, children, ...props }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        {Icon && (
          <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
        <select
          {...props}
          disabled={disabled}
          className={`w-full ${Icon ? "pl-8" : "pl-3"} pr-8 py-2.5 rounded-lg border text-sm font-medium bg-white text-slate-700
            border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed appearance-none transition`}
        >
          {children}
        </select>
        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Slot detail drawer / modal (mobile: drawer, desktop: inline)
───────────────────────────────────────────────────────────── */
function SlotDetail({ slot, colorMap, onClose, onDelete, isDeleting }) {
  if (!slot) return null;
  const c = colorMap[slot.unitId] || UNIT_COLORS[0];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
      >
        <X size={15} />
      </button>

      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3 border ${c.pill}`}>
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        {slot.unit.code}
      </div>

      <h3 className="font-bold text-slate-900 text-base leading-tight mb-4">{slot.unit.name}</h3>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-3">
          <Calendar size={14} className="text-slate-400 shrink-0" />
          <span className="text-slate-600 font-medium">
            {DAY_SHORT[slot.day]} · {slot.startTime} – {slot.endTime}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin size={14} className="text-slate-400 shrink-0" />
          <span className="text-slate-600">{slot.venue}</span>
        </div>
        <div className="flex items-center gap-3">
          <User size={14} className="text-slate-400 shrink-0" />
          <span className="text-slate-600">{slot.teacher.user.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <GraduationCap size={14} className="text-slate-400 shrink-0" />
          <span className="text-slate-600">{slot.unit.course?.name}</span>
        </div>
      </div>

      <button
        onClick={() => onDelete(slot.id)}
        disabled={isDeleting}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-rose-200
          text-rose-500 text-sm font-medium hover:bg-rose-50 transition disabled:opacity-50"
      >
        {isDeleting ? (
          <span className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
        Remove slot
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GRID VIEW
───────────────────────────────────────────────────────────── */
function GridView({ slots, colorMap, onSlotClick, activeSlotId }) {
  // Build a lookup: day → startTime → slots[]
  const grid = useMemo(() => {
    const map = {};
    for (const day of DAYS) {
      map[day] = {};
      for (const t of TIME_SLOTS) map[day][t] = [];
    }
    for (const slot of slots) {
      if (map[slot.day]?.[slot.startTime]) {
        map[slot.day][slot.startTime].push(slot);
      } else if (map[slot.day]) {
        // Slot starts at a non-standard time — find nearest hour block
        const nearest = TIME_SLOTS.find((t) => t <= slot.startTime) || TIME_SLOTS[0];
        if (map[slot.day][nearest]) map[slot.day][nearest].push(slot);
      }
    }
    return map;
  }, [slots]);

  // Only render time rows that have at least one slot
  const activeTimeSlots = TIME_SLOTS.filter((t) =>
    DAYS.some((d) => (grid[d]?.[t] || []).length > 0)
  );

  if (activeTimeSlots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <BookOpen size={24} className="text-slate-400" />
        </div>
        <p className="text-slate-600 font-semibold">No classes match your filters</p>
        <p className="text-slate-400 text-sm mt-1">Try selecting a different course or unit</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Table scroll wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ minWidth: 520 }}>
          <thead>
            <tr className="border-b border-slate-100">
              <th className="w-14 py-3 px-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-300" />
              {DAYS.map((d) => (
                <th
                  key={d}
                  className="py-3 px-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500"
                >
                  <span className="hidden sm:inline">{d.charAt(0) + d.slice(1).toLowerCase()}</span>
                  <span className="sm:hidden">{DAY_SHORT[d]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeTimeSlots.map((time, ri) => (
              <tr key={time} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                <td className="py-2 px-3 text-right text-[10px] font-mono font-semibold text-slate-300 whitespace-nowrap align-top pt-3">
                  {time}
                </td>
                {DAYS.map((day) => {
                  const cellSlots = grid[day]?.[time] || [];
                  return (
                    <td key={day} className="py-1.5 px-1 align-top">
                      <div className="flex flex-col gap-1">
                        {cellSlots.map((slot) => {
                          const c = colorMap[slot.unitId] || UNIT_COLORS[0];
                          const isActive = activeSlotId === slot.id;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => onSlotClick(slot)}
                              className={`w-full text-left rounded-lg px-2 py-1.5 border transition group
                                ${c.bg} ${c.border} ${c.text}
                                ${isActive ? "ring-2 ring-indigo-400 ring-offset-1" : "hover:brightness-95"}`}
                            >
                              <p className="font-bold text-[11px] leading-tight truncate">{slot.unit.code}</p>
                              <p className="text-[10px] opacity-70 truncate hidden sm:block">{slot.venue}</p>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LIST VIEW (the original card layout, now filtered)
───────────────────────────────────────────────────────────── */
function ListView({ slots, colorMap, onSlotClick, onDelete, deletingId }) {
  const slotsByDay = DAYS.reduce((acc, d) => {
    acc[d] = slots.filter((s) => s.day === d);
    return acc;
  }, {});

  const hasSomething = slots.length > 0;

  if (!hasSomething) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <BookOpen size={24} className="text-slate-400" />
        </div>
        <p className="text-slate-600 font-semibold">No classes match your filters</p>
        <p className="text-slate-400 text-sm mt-1">Try selecting a different course or unit</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {DAYS.map((day) => {
        const daySlots = slotsByDay[day];
        if (!daySlots.length) return null;
        return (
          <section key={day}>
            <div className="flex items-center gap-3 mb-2.5">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">{daySlots.length} class{daySlots.length !== 1 ? "es" : ""}</span>
            </div>
            <div className="space-y-2">
              {daySlots.map((slot) => {
                const c = colorMap[slot.unitId] || UNIT_COLORS[0];
                return (
                  <div
                    key={slot.id}
                    className={`${c.bg} border ${c.border} rounded-xl p-4 flex items-center justify-between gap-4 group
                      hover:shadow-sm transition cursor-pointer`}
                    onClick={() => onSlotClick(slot)}
                  >
                    <div className="shrink-0 text-center w-14">
                      <p className={`text-xs font-bold ${c.text}`}>{slot.startTime}</p>
                      <div className={`w-0.5 h-3 ${c.dot} mx-auto my-0.5 rounded-full`} />
                      <p className="text-xs text-slate-500">{slot.endTime}</p>
                    </div>
                    <div className={`w-px self-stretch ${c.border} border-l`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        <span className={c.text}>{slot.unit.code}</span>
                        {" · "}
                        {slot.unit.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={10} /> {slot.venue}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <User size={10} /> {slot.teacher.user.name}
                        </span>
                        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                          <BookOpen size={10} /> {slot.unit.course?.name}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(slot.id); }}
                      disabled={deletingId === slot.id}
                      className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50
                        opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                      title="Remove slot"
                    >
                      {deletingId === slot.id ? (
                        <span className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin block" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function TimetablePage() {
  const [slots, setSlots]         = useState([]);
  const [courses, setCourses]     = useState([]);
  const [units, setUnits]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("ALL");
  const [activeUnitIds, setActiveUnitIds]               = useState(new Set());

  // View mode
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  // Selected slot for detail panel
  const [selectedSlot, setSelectedSlot]   = useState(null);
  const [deletingId, setDeletingId]       = useState(null);

  // Form
  const {
    register, handleSubmit, watch, reset,
    formState: { isSubmitting },
  } = useForm();
  const selectedCourseId  = watch("courseId");
  const selectedUnitId    = watch("unitId");
  const availableFormUnits   = units.filter((u) => u.courseId === selectedCourseId);
  const selectedUnitData     = units.find((u) => u.id === selectedUnitId);
  const availableTeachers    = selectedUnitData?.teachers || [];

  // ── Fetch ──────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [sR, cR, uR] = await Promise.all([
        fetch("/api/timetable"),
        fetch("/api/courses"),
        fetch("/api/units"),
      ]);
      setSlots(await sR.json());
      setCourses(await cR.json());
      setUnits(await uR.json());
    } catch {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  // ── Derive unit→color map (stable across re-renders for same unit set) ──
  const colorMap = useMemo(() => {
    const map = {};
    const seen = {};
    let idx = 0;
    [...slots].sort((a, b) => a.unit.code.localeCompare(b.unit.code)).forEach((s) => {
      if (!seen[s.unitId]) {
        seen[s.unitId] = true;
        map[s.unitId] = UNIT_COLORS[idx % UNIT_COLORS.length];
        idx++;
      }
    });
    return map;
  }, [slots]);

  // ── Filter logic ──────────────────────────────────────────
  const unitsForCourseFilter = useMemo(() => {
    if (selectedCourseFilter === "ALL") return [];
    const courseId = selectedCourseFilter;
    const unitIds  = new Set(slots.filter((s) => s.unit.courseId === courseId || s.unit.course?.id === courseId).map((s) => s.unitId));
    return units.filter((u) => unitIds.has(u.id));
  }, [selectedCourseFilter, slots, units]);

  const filteredSlots = useMemo(() => {
    let s = slots;
    if (selectedCourseFilter !== "ALL") {
      s = s.filter((sl) => sl.unit.courseId === selectedCourseFilter || sl.unit.course?.id === selectedCourseFilter);
    }
    if (activeUnitIds.size > 0) {
      s = s.filter((sl) => activeUnitIds.has(sl.unitId));
    }
    return s;
  }, [slots, selectedCourseFilter, activeUnitIds]);

  const handleCourseFilterChange = (courseId) => {
    setSelectedCourseFilter(courseId);
    setActiveUnitIds(new Set());
    setSelectedSlot(null);
  };

  const toggleUnit = (unitId) => {
    setActiveUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
    setSelectedSlot(null);
  };

  // ── Submit ────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      const res    = await fetch("/api/timetable", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.custom((t) => (
        <div className={`flex items-center gap-3 bg-white shadow-lg border border-emerald-100 rounded-xl px-4 py-3 ${t.visible ? "animate-enter" : "animate-leave"}`}>
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <span className="text-sm font-medium text-slate-700">Class scheduled successfully!</span>
        </div>
      ));
      reset({ courseId: "", unitId: "", teacherId: "", day: "", startTime: "", endTime: "", venue: "" });
      fetchData();
    } catch (error) {
      toast.custom((t) => (
        <div className={`flex items-start gap-3 bg-white shadow-lg border border-rose-100 rounded-xl px-4 py-3 max-w-sm ${t.visible ? "animate-enter" : "animate-leave"}`}>
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <span className="text-sm font-medium text-slate-700">{error.message}</span>
        </div>
      ), { duration: 6000 });
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Remove this class from the timetable?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Class removed!");
      if (selectedSlot?.id === id) setSelectedSlot(null);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Stats
  const totalSlots = slots.length;
  const totalUnits = [...new Set(slots.map((s) => s.unitId))].length;
  const totalCourses = [...new Set(slots.map((s) => s.unit?.course?.id).filter(Boolean))].length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Timetable</h1>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Schedule and manage class sessions</p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-indigo-600">{totalSlots}</p>
              <p className="text-[10px] sm:text-xs text-slate-400">Slots</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-indigo-600">{totalUnits}</p>
              <p className="text-[10px] sm:text-xs text-slate-400">Units</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-2xl font-bold text-indigo-600">{totalCourses}</p>
              <p className="text-xs text-slate-400">Courses</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto p-4 sm:p-6 flex flex-col xl:flex-row gap-6">

        {/* ── LEFT: Form ─────────────────────────────────── */}
        <aside className="w-full xl:w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden xl:sticky xl:top-24">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-5">
              <h2 className="text-white font-bold text-base">Schedule a Class</h2>
              <p className="text-indigo-200 text-xs mt-0.5">Fill in the details below</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <SelectField label="Course" icon={BookOpen} {...register("courseId", { required: true })}>
                <option value="">Select course…</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>

              <SelectField label="Unit" disabled={!selectedCourseId} {...register("unitId", { required: true })}>
                <option value="">Select unit…</option>
                {availableFormUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </SelectField>

              <div>
                <SelectField label="Teacher" icon={User} disabled={!selectedUnitId} {...register("teacherId", { required: true })}>
                  <option value="">Select teacher…</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.user?.name}</option>
                  ))}
                </SelectField>
                {selectedUnitId && availableTeachers.length === 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-600 mt-1.5 bg-amber-50 px-2 py-1 rounded-md">
                    <AlertCircle size={12} /> No teachers assigned to this unit
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <SelectField label="Day of Week" {...register("day", { required: true })}>
                  <option value="">Select day…</option>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </SelectField>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <FieldLabel>Start</FieldLabel>
                  <div className="relative">
                    <Clock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      {...register("startTime", { required: true })}
                      className="w-full pl-8 pr-2 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700
                        focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white transition"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <FieldLabel>End</FieldLabel>
                  <div className="relative">
                    <Clock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      {...register("endTime", { required: true })}
                      className="w-full pl-8 pr-2 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700
                        focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel>Venue / Room</FieldLabel>
                <div className="relative">
                  <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    {...register("venue", { required: true })}
                    placeholder="e.g. Lab 2, Main Hall"
                    className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700
                      placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300
                      focus:border-indigo-400 bg-white transition uppercase placeholder:normal-case"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300
                  text-white text-sm font-semibold py-2.5 rounded-xl mt-1 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking conflicts…
                  </>
                ) : "Add to Timetable"}
              </button>
            </form>
          </div>
        </aside>

        {/* ── RIGHT: Timetable view ───────────────────────── */}
        <main className="flex-1 min-w-0 space-y-4">

          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">

            {/* Row 1: Course selector + view toggle */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <GraduationCap size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => handleCourseFilterChange(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200 text-sm font-medium bg-white text-slate-700
                    focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 appearance-none"
                >
                  <option value="ALL">All courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* View toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-0.5 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition
                    ${viewMode === "grid" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <LayoutGrid size={13} /> <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition
                    ${viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <List size={13} /> <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>

            {/* Row 2: Unit pills — only when a course is selected */}
            {selectedCourseFilter !== "ALL" && unitsForCourseFilter.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">Units</span>

                {/* "All" pill */}
                <button
                  onClick={() => setActiveUnitIds(new Set())}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition
                    ${activeUnitIds.size === 0
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700"}`}
                >
                  All
                </button>

                {unitsForCourseFilter.map((u) => {
                  const c = colorMap[u.id] || UNIT_COLORS[0];
                  const isOn = activeUnitIds.has(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleUnit(u.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition
                        ${isOn ? `${c.bg} ${c.text} ${c.border}` : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700"}`}
                    >
                      {isOn && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}
                      {u.code}
                    </button>
                  );
                })}

                {activeUnitIds.size > 0 && (
                  <button
                    onClick={() => setActiveUnitIds(new Set())}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition ml-1"
                  >
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
            )}

            {/* Legend (color → unit code) */}
            {filteredSlots.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 border-t border-slate-100">
                {[...new Map(filteredSlots.map((s) => [s.unitId, s])).values()].map((s) => {
                  const c = colorMap[s.unitId] || UNIT_COLORS[0];
                  return (
                    <span key={s.unitId} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className={`w-2.5 h-2.5 rounded-sm ${c.bg} border ${c.border}`} />
                      <span className={`font-semibold ${c.text}`}>{s.unit.code}</span>
                      <span className="hidden sm:inline text-slate-400">– {s.unit.name}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timetable content */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 h-28 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col xl:flex-row gap-4">
              {/* Main view */}
              <div className="flex-1 min-w-0">
                {viewMode === "grid" ? (
                  <GridView
                    slots={filteredSlots}
                    colorMap={colorMap}
                    onSlotClick={setSelectedSlot}
                    activeSlotId={selectedSlot?.id}
                  />
                ) : (
                  <ListView
                    slots={filteredSlots}
                    colorMap={colorMap}
                    onSlotClick={setSelectedSlot}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                  />
                )}
              </div>

              {/* Detail panel */}
              {selectedSlot && (
                <div className="xl:w-64 shrink-0">
                  <SlotDetail
                    slot={selectedSlot}
                    colorMap={colorMap}
                    onClose={() => setSelectedSlot(null)}
                    onDelete={handleDelete}
                    isDeleting={deletingId === selectedSlot.id}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}