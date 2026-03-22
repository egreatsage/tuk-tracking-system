"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Plus, Search, Download, Users, UserCheck, Building2, BadgeCheck, X, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/users/teachers");
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load teachers");
      setTeachers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTeachers(); }, []);

  // --- Derived Stats ---
  const stats = useMemo(() => {
    const departments = [...new Set(teachers.map(t => t.teacherProfile?.department).filter(Boolean))];
    return {
      total: teachers.length,
      departments: departments.length,
      withUnits: teachers.filter(t => t.teacherProfile?.units?.length > 0).length,
    };
  }, [teachers]);

  // --- Unique departments for filter ---
  const departments = useMemo(() => (
    [...new Set(teachers.map(t => t.teacherProfile?.department).filter(Boolean))].sort()
  ), [teachers]);

  // --- Filtered Teachers ---
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.teacherProfile?.staffNumber?.toLowerCase().includes(q) ||
        t.teacherProfile?.department?.toLowerCase().includes(q);
      const matchesDept = filterDepartment ? t.teacherProfile?.department === filterDepartment : true;
      return matchesSearch && matchesDept;
    });
  }, [teachers, searchQuery, filterDepartment]);

  const hasActiveFilters = searchQuery || filterDepartment;

  const clearFilters = () => { setSearchQuery(""); setFilterDepartment(""); };

  // --- PDF Export ---
  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Teachers Report", 14, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(`Total: ${stats.total}  |  Departments: ${stats.departments}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [["Name", "Email", "Staff Number", "Department"]],
      body: filteredTeachers.map(t => [
        t.name,
        t.email,
        t.teacherProfile?.staffNumber || "N/A",
        t.teacherProfile?.department || "N/A",
      ]),
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold", fontSize: 10 },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45 },
        1: { cellWidth: 60 },
        2: { cellWidth: 35 },
        3: { cellWidth: 50 },
      },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 8);
    }

    doc.save("teachers-report.pdf");
    toast.success("PDF exported successfully!");
  };

  // --- Submit ---
  const onSubmit = async (data) => {
    try {
      const res = await fetch("/api/users/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create teacher");
      toast.success("Teacher created! Default password is 'password123'");
      reset();
      setIsModalOpen(false);
      fetchTeachers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Avatar initials helper
  const getInitials = (name = "") =>
    name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  const avatarColors = [
    "from-blue-500 to-blue-600",
    "from-violet-500 to-violet-600",
    "from-emerald-500 to-emerald-600",
    "from-rose-500 to-rose-600",
    "from-amber-500 to-amber-600",
    "from-cyan-500 to-cyan-600",
  ];
  const getColor = (name = "") => avatarColors[name.charCodeAt(0) % avatarColors.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Teachers Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">View and manage all teaching staff</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
            >
              <Download size={15} />
              Export PDF
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 active:scale-95 transition-all duration-150"
            >
              <Plus size={16} />
              Add Teacher
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Total Teachers", value: stats.total, icon: <Users size={20} />, light: "bg-blue-50 text-blue-600" },
            { label: "Departments", value: stats.departments, icon: <Building2 size={20} />, light: "bg-violet-50 text-violet-600" },
            { label: "With Assigned Units", value: stats.withUnits, icon: <BadgeCheck size={20} />, light: "bg-emerald-50 text-emerald-600" },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.light} flex-shrink-0`}>
                {card.icon}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium leading-none">{card.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{isLoading ? "—" : card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, staff number or department…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="relative sm:w-52">
            <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={filterDepartment}
              onChange={e => setFilterDepartment(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 appearance-none transition-all"
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors whitespace-nowrap">
              <X size={14} /> Clear
            </button>
          )}
          <span className="text-sm text-slate-400 whitespace-nowrap self-center hidden sm:block">
            {filteredTeachers.length} result{filteredTeachers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Number</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan="4" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-blue-200 border-t-blue-600 animate-spin" style={{ borderWidth: 3, borderStyle: "solid" }} />
                      <span className="text-sm text-slate-400">Loading teachers…</span>
                    </div>
                  </td></tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Search size={20} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">No teachers found</p>
                      <p className="text-xs text-slate-400">{hasActiveFilters ? "Try adjusting your search or filter" : "Add a teacher to get started"}</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getColor(teacher.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {getInitials(teacher.name)}
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{teacher.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 tracking-wider uppercase">
                          {teacher.teacherProfile?.staffNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {teacher.teacherProfile?.department ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-50 text-violet-700">
                            <Building2 size={11} />
                            {teacher.teacherProfile.department}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not set</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-blue-200 border-t-blue-600 animate-spin" style={{ borderWidth: 3, borderStyle: "solid" }} />
                <span className="text-sm text-slate-400">Loading…</span>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Search size={20} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No teachers found</p>
                <p className="text-xs text-slate-400">{hasActiveFilters ? "Adjust your search or filter" : "Add a teacher to get started"}</p>
              </div>
            ) : (
              filteredTeachers.map(teacher => (
                <div key={teacher.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColor(teacher.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {getInitials(teacher.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{teacher.name}</p>
                      <p className="text-xs text-slate-500 truncate">{teacher.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-wider flex-shrink-0">
                      {teacher.teacherProfile?.staffNumber || "N/A"}
                    </span>
                  </div>
                  {teacher.teacherProfile?.department && (
                    <div className="mt-2 ml-13 pl-0.5">
                      <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-2.5 py-0.5 rounded-full font-medium">
                        <Building2 size={10} />
                        {teacher.teacherProfile.department}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {!isLoading && filteredTeachers.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{filteredTeachers.length}</span> of <span className="font-semibold text-slate-600">{teachers.length}</span> teachers
              </span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Clear filters</button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── ADD MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Add New Teacher</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details below to register a teacher</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    type="text"
                    placeholder="e.g. John Doe"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                  />
                  {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                  <input
                    {...register("email", {
                      required: "Email is required",
                      pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" }
                    })}
                    type="email"
                    placeholder="e.g. jdoe@institution.ac.ke"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                  />
                  {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Staff Number</label>
                    <input
                      {...register("staffNumber", { required: "Required" })}
                      type="text"
                      placeholder="e.g. TUK/123"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm uppercase bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                    />
                    {errors.staffNumber && <p className="text-rose-500 text-xs mt-1">{errors.staffNumber.message}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department</label>
                    <input
                      {...register("department", { required: "Required" })}
                      type="text"
                      placeholder="e.g. Computer Science"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                    />
                    {errors.department && <p className="text-rose-500 text-xs mt-1">{errors.department.message}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                  <UserCheck size={15} className="flex-shrink-0 mt-0.5" />
                  <span>Default password will be set to <code className="font-mono font-bold bg-blue-100 px-1 rounded">password123</code>. The teacher should change it on first login.</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors shadow-sm">
                  {isSubmitting ? "Saving…" : "Save Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}