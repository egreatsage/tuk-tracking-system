"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Edit, Search, Download, BookOpen, Users, Layers, Filter, X, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourseId, setFilterCourseId] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { register: regAdd, control: controlAdd, handleSubmit: handleAddSubmit, reset: resetAdd, formState: { isSubmitting: isAdding } } = useForm({
    defaultValues: { unitsData: [{ code: "", name: "", courseId: "", teacherId: "" }] }
  });
  const { fields, append, remove } = useFieldArray({ control: controlAdd, name: "unitsData" });
  const { register: regEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { isSubmitting: isEditing } } = useForm();

  const fetchData = async () => {
    try {
      const [unitsRes, coursesRes, teachersRes] = await Promise.all([
        fetch("/api/units"),
        fetch("/api/courses"),
        fetch("/api/users/teachers")
      ]);
      const unitsData = await unitsRes.json();
      const coursesData = await coursesRes.json();
      const teachersData = await teachersRes.json();
      if (!unitsRes.ok) throw new Error(unitsData.error || "Failed to fetch units");
      if (!coursesRes.ok) throw new Error(coursesData.error || "Failed to fetch courses");
      if (!teachersRes.ok) throw new Error(teachersData.error || "Failed to fetch teachers");
      setUnits(Array.isArray(unitsData) ? unitsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to load data");
      setUnits([]); setCourses([]); setTeachers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Derived Stats ---
  const stats = useMemo(() => ({
    totalUnits: units.length,
    assignedUnits: units.filter(u => u.teachers && u.teachers.length > 0).length,
    unassignedUnits: units.filter(u => !u.teachers || u.teachers.length === 0).length,
    totalCourses: courses.length,
  }), [units, courses]);

  // --- Filtered & Searched Units ---
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        unit.code?.toLowerCase().includes(q) ||
        unit.name?.toLowerCase().includes(q) ||
        unit.course?.name?.toLowerCase().includes(q) ||
        unit.teachers?.some(t => t.user?.name?.toLowerCase().includes(q));
      const matchesCourse = filterCourseId ? unit.courseId === filterCourseId : true;
      return matchesSearch && matchesCourse;
    });
  }, [units, searchQuery, filterCourseId]);

  // --- PDF Export ---
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Units Report", 14, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

    // Summary row
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(`Total: ${stats.totalUnits}  |  Assigned: ${stats.assignedUnits}  |  Unassigned: ${stats.unassignedUnits}  |  Courses: ${stats.totalCourses}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [["Unit Code", "Unit Name", "Course", "Assigned Teachers"]],
      body: filteredUnits.map(unit => [
        unit.code,
        unit.name,
        unit.course?.name || "N/A",
        unit.teachers && unit.teachers.length > 0
          ? unit.teachers.map(t => t.user?.name).join(", ")
          : "Unassigned"
      ]),
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 30 },
        1: { cellWidth: 55 },
        2: { cellWidth: 50 },
        3: { cellWidth: 55 },
      },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 8);
    }

    doc.save("units-report.pdf");
    toast.success("PDF exported successfully!");
  };

  // --- CRUD Handlers ---
  const onAdd = async (data) => {
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.unitsData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(result.message || "Units created!");
      resetAdd({ unitsData: [{ code: "", name: "", courseId: "", teacherId: "" }] });
      setIsAddModalOpen(false);
      fetchData();
    } catch (error) { toast.error(error.message); }
  };

  const openEditModal = (unit) => {
    setEditingUnit(unit);
    resetEdit({
      code: unit.code,
      name: unit.name,
      courseId: unit.courseId,
      teacherIds: unit.teachers.map(t => t.id)
    });
    setIsEditModalOpen(true);
  };

  const onEdit = async (data) => {
    try {
      const res = await fetch(`/api/units/${editingUnit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Unit updated successfully!");
      setIsEditModalOpen(false);
      setEditingUnit(null);
      fetchData();
    } catch (error) { toast.error(error.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;
    try {
      const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Unit deleted!");
      fetchData();
    } catch (error) { toast.error(error.message); }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCourseId("");
  };

  const hasActiveFilters = searchQuery || filterCourseId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Units Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage and assign academic units across courses</p>
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
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 active:scale-95 transition-all duration-150"
            >
              <Plus size={16} />
              Add Unit(s)
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Units", value: stats.totalUnits, icon: <Layers size={20} />, color: "from-blue-500 to-blue-600", light: "bg-blue-50 text-blue-600" },
            { label: "Assigned", value: stats.assignedUnits, icon: <Users size={20} />, color: "from-emerald-500 to-emerald-600", light: "bg-emerald-50 text-emerald-600" },
            { label: "Unassigned", value: stats.unassignedUnits, icon: <BookOpen size={20} />, color: "from-rose-500 to-rose-600", light: "bg-rose-50 text-rose-600" },
            { label: "Courses", value: stats.totalCourses, icon: <Filter size={20} />, color: "from-violet-500 to-violet-600", light: "bg-violet-50 text-violet-600" },
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
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by code, name, course or teacher…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Course Filter */}
          <div className="relative sm:w-56">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={filterCourseId}
              onChange={e => setFilterCourseId(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 appearance-none transition-all"
            >
              <option value="">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              <X size={14} /> Clear
            </button>
          )}

          {/* Results count */}
          <span className="text-sm text-slate-400 whitespace-nowrap self-center hidden sm:block">
            {filteredUnits.length} result{filteredUnits.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Code</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Teachers</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
                      <span className="text-sm text-slate-400">Loading units…</span>
                    </div>
                  </td></tr>
                ) : filteredUnits.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Search size={20} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">No units found</p>
                      <p className="text-xs text-slate-400">{hasActiveFilters ? "Try adjusting your search or filter" : "Add a unit to get started"}</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredUnits.map((unit) => (
                    <tr key={unit.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 tracking-wider uppercase">
                          {unit.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{unit.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                          {unit.course?.name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {unit.teachers && unit.teachers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {unit.teachers.map(t => (
                              <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                {t.user?.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(unit)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(unit.id)}
                            className="p-2 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
                <div className="w-8 h-8 border-blue-200 border-t-blue-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
                <span className="text-sm text-slate-400">Loading…</span>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Search size={20} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No units found</p>
                <p className="text-xs text-slate-400">{hasActiveFilters ? "Adjust your search or filter" : "Add a unit to get started"}</p>
              </div>
            ) : (
              filteredUnits.map(unit => (
                <div key={unit.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                          {unit.code}
                        </span>
                        {(!unit.teachers || unit.teachers.length === 0) && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium text-rose-500 bg-rose-50">Unassigned</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate">{unit.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{unit.course?.name || "No course"}</p>
                      {unit.teachers && unit.teachers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {unit.teachers.map(t => (
                            <span key={t.id} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                              {t.user?.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEditModal(unit)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(unit.id)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Table footer */}
          {!isLoading && filteredUnits.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{filteredUnits.length}</span> of <span className="font-semibold text-slate-600">{units.length}</span> units
              </span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Clear filters</button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── ADD MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Add New Unit(s)</h2>
                <p className="text-xs text-slate-400 mt-0.5">You can add multiple units at once</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleAddSubmit(onAdd)} id="add-form">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col sm:flex-row gap-3 mb-3 bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Code</label>
                      <input {...regAdd(`unitsData.${index}.code`, { required: true })} placeholder="e.g. CS101" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm uppercase bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Name</label>
                      <input {...regAdd(`unitsData.${index}.name`, { required: true })} placeholder="e.g. Introduction to CS" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Course</label>
                      <select {...regAdd(`unitsData.${index}.courseId`, { required: true })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all">
                        <option value="">— Select Course —</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Teacher <span className="text-slate-400 font-normal">(Optional)</span></label>
                      <select {...regAdd(`unitsData.${index}.teacherId`)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all">
                        <option value="">— Unassigned —</option>
                        {teachers.map(t => <option key={t.id} value={t.teacherProfile?.id}>{t.name}</option>)}
                      </select>
                    </div>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="absolute top-3 right-3 p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => append({ code: "", name: "", courseId: "", teacherId: "" })} className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-800 mt-1 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors">
                  <Plus size={15} /> Add another unit
                </button>
              </form>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium">Cancel</button>
              <button type="submit" form="add-form" disabled={isAdding} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors shadow-sm">
                {isAdding ? "Saving…" : "Save Units"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Edit Unit</h2>
                <p className="text-xs text-slate-400 mt-0.5">Update the unit details below</p>
              </div>
              <button onClick={() => { setIsEditModalOpen(false); setEditingUnit(null); }} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit(onEdit)}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unit Code</label>
                  <input {...regEdit("code", { required: true })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm uppercase bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unit Name</label>
                  <input {...regEdit("name", { required: true })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Course</label>
                  <select {...regEdit("courseId", { required: true })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all">
                    <option value="">— Select Course —</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Assign Teachers
                    <span className="ml-1 text-slate-400 font-normal">(Hold Ctrl/Cmd for multiple)</span>
                  </label>
                  <select multiple {...regEdit("teacherIds")} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all h-28">
                    {teachers.map(t => <option key={t.id} value={t.teacherProfile?.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingUnit(null); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={isEditing} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors shadow-sm">
                  {isEditing ? "Updating…" : "Update Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}