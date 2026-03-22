"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Edit, Printer, Search, X, BookOpen, Users, Layers } from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { register: regAdd, control: controlAdd, handleSubmit: handleAddSubmit, reset: resetAdd, formState: { isSubmitting: isAdding } } = useForm({
    defaultValues: { coursesData: [{ name: "" }] }
  });
  const { fields, append, remove } = useFieldArray({ control: controlAdd, name: "coursesData" });

  const { register: regEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { isSubmitting: isEditing } } = useForm();

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data);
    } catch (error) { toast.error("Failed to load courses"); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    return courses.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  const onAdd = async (data) => {
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.coursesData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(result.message || "Courses created!");
      resetAdd({ coursesData: [{ name: "" }] });
      setIsAddModalOpen(false);
      fetchCourses();
    } catch (error) { toast.error(error.message); }
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    resetEdit({ name: course.name });
    setIsEditModalOpen(true);
  };

  const onEdit = async (data) => {
    try {
      const res = await fetch(`/api/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Course updated successfully!");
      setIsEditModalOpen(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) { toast.error(error.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course? This will also delete all units attached to it!")) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Course deleted!");
      fetchCourses();
    } catch (error) { toast.error(error.message); }
  };

  const handlePrint = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 70, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Courses Report", 40, 38);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 200, 220);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, 40, 56);

      const data = (searchQuery ? filteredCourses : courses).map((c, i) => [
        i + 1,
        c.name,
        c._count?.units ?? 0,
        c._count?.students ?? 0,
      ]);

      autoTable(doc, {
        startY: 90,
        head: [["#", "Course Name", "Units", "Students Enrolled"]],
        body: data,
        styles: {
          fontSize: 10,
          cellPadding: { top: 8, bottom: 8, left: 12, right: 12 },
          font: "helvetica",
          textColor: [30, 30, 30],
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 10,
          lineWidth: 0.5,
          lineColor: [203, 213, 225],
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: "center", cellWidth: 36 },
          1: { cellWidth: "auto" },
          2: { halign: "center", cellWidth: 60 },
          3: { halign: "center", cellWidth: 100 },
        },
        margin: { left: 40, right: 40 },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.5,
        didDrawPage: (hookData) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(9);
          doc.setTextColor(160, 160, 160);
          doc.text(
            `Page ${hookData.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 20,
            { align: "center" }
          );
        },
      });

      // Summary footer box
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(40, finalY, doc.internal.pageSize.getWidth() - 80, 44, 4, 4, "F");
      doc.setTextColor(60, 80, 110);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Courses: ${data.length}`, 56, finalY + 17);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Total Students: ${(searchQuery ? filteredCourses : courses).reduce((s, c) => s + (c._count?.students ?? 0), 0)}`,
        56, finalY + 32
      );

      doc.save(`courses-report-${Date.now()}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  // Stats
  const totalUnits = courses.reduce((s, c) => s + (c._count?.units ?? 0), 0);
  const totalStudents = courses.reduce((s, c) => s + (c._count?.students ?? 0), 0);

  return (
    <>
      <style>{`
        .cp-root {
          background: #f8fafc;
          min-height: 100vh;
          padding: 28px 20px 60px;
        }

        /* ---- HEADER ---- */
        .cp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .cp-title-block h1 {
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin: 0 0 4px;
        }
        .cp-title-block p {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }
        .cp-header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        /* ---- STAT CARDS ---- */
        .cp-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (max-width: 600px) { .cp-stats { grid-template-columns: 1fr; } }
        @media (min-width: 601px) and (max-width: 900px) { .cp-stats { grid-template-columns: repeat(3, 1fr); } }

        .cp-stat {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .cp-stat-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cp-stat-icon.blue  { background: #eff6ff; color: #2563eb; }
        .cp-stat-icon.indigo { background: #eef2ff; color: #4f46e5; }
        .cp-stat-icon.teal  { background: #f0fdfa; color: #0d9488; }
        .cp-stat-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 2px;
        }
        .cp-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1;
        }

        /* ---- TOOLBAR ---- */
        .cp-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          align-items: center;
        }
        .cp-search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
          max-width: 420px;
        }
        .cp-search-wrap svg.search-icon {
          position: absolute;
          left: 12px; top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .cp-search-input {
          width: 100%;
          padding: 10px 38px 10px 38px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #0f172a;
          background: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .cp-search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .cp-search-clear {
          position: absolute;
          right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; padding: 2px;
          display: flex; align-items: center;
        }
        .cp-search-clear:hover { color: #475569; }

        /* ---- BUTTONS ---- */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          border: none;
          white-space: nowrap;
        }
        .btn-primary {
          background: #0f172a;
          color: #fff;
        }
        .btn-primary:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15,23,42,0.18); }
        .btn-outline {
          background: #fff;
          color: #0f172a;
          border: 1.5px solid #e2e8f0;
        }
        .btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* ---- TABLE CARD ---- */
        .cp-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(15,23,42,0.04);
        }
        .cp-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 480px;
        }
        thead {
          background: #f8fafc;
          border-bottom: 1.5px solid #e2e8f0;
        }
        th {
          padding: 13px 18px;
          text-align: left;
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          white-space: nowrap;
        }
        th:last-child { text-align: right; }
        td {
          padding: 14px 18px;
          font-size: 0.875rem;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        tr:last-child td { border-bottom: none; }
        tbody tr { transition: background 0.14s; }
        tbody tr:hover { background: #f8fafc; }

        .cp-course-name {
          font-weight: 600;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cp-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 6px;
          padding: 3px 9px;
          font-size: 0.78rem;
          font-weight: 500;
        }
        .cp-actions {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }
        .icon-btn {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          border: none; cursor: pointer;
          transition: all 0.15s;
          background: transparent;
        }
        .icon-btn.edit { color: #3b82f6; }
        .icon-btn.edit:hover { background: #eff6ff; color: #1d4ed8; }
        .icon-btn.del  { color: #ef4444; }
        .icon-btn.del:hover  { background: #fef2f2; color: #b91c1c; }

        .cp-empty {
          padding: 60px 20px;
          text-align: center;
          color: #94a3b8;
        }
        .cp-empty-icon {
          width: 56px; height: 56px;
          background: #f1f5f9;
          border-radius: 50%;
          margin: 0 auto 14px;
          display: flex; align-items: center; justify-content: center;
          color: #cbd5e1;
        }
        .cp-empty p { font-size: 0.9rem; margin: 0; }

        .cp-results-info {
          font-size: 0.8rem;
          color: #94a3b8;
          padding: 10px 18px;
          border-top: 1px solid #f1f5f9;
        }

        /* ---- MODAL ---- */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 16px;
        }
        .modal {
          background: #fff;
          border-radius: 18px;
          padding: 28px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(15,23,42,0.18);
          animation: modalIn 0.2s ease;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-add { max-width: 560px; max-height: 90vh; overflow-y: auto; }
        .modal-edit { max-width: 420px; }
        .modal h2 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 20px;
        }
        .form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.9rem;
          color: #0f172a;
          background: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .modal-row {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
          align-items: flex-end;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          border-top: 1px solid #f1f5f9;
          padding-top: 20px;
          margin-top: 24px;
        }
        .btn-ghost {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 10px;
          transition: background 0.15s;
        }
        .btn-ghost:hover { background: #f1f5f9; }

        .btn-add-more {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #3b82f6;
          font-size: 0.85rem;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 0;
        }
        .btn-add-more:hover { color: #1d4ed8; }

        @media (max-width: 480px) {
          .cp-header { flex-direction: column; }
          .cp-header-actions { width: 100%; }
          .cp-header-actions .btn { flex: 1; justify-content: center; }
          .cp-toolbar { flex-direction: column; }
          .cp-search-wrap { max-width: 100%; }
        }
      `}</style>

      <div className="cp-root">
        {/* Header */}
        <div className="cp-header">
          <div className="cp-title-block">
            <h1>Manage Courses</h1>
            <p>{courses.length} course{courses.length !== 1 ? "s" : ""} in total</p>
          </div>
          <div className="cp-header-actions">
            <button className="btn btn-outline" onClick={handlePrint}>
              <Printer size={16} /> Export PDF
            </button>
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} /> Add Course(s)
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="cp-stats">
          <div className="cp-stat">
            <div className="cp-stat-icon blue"><BookOpen size={20} /></div>
            <div>
              <div className="cp-stat-label">Courses</div>
              <div className="cp-stat-value">{courses.length}</div>
            </div>
          </div>
          <div className="cp-stat">
            <div className="cp-stat-icon indigo"><Layers size={20} /></div>
            <div>
              <div className="cp-stat-label">Total Units</div>
              <div className="cp-stat-value">{totalUnits}</div>
            </div>
          </div>
          <div className="cp-stat">
            <div className="cp-stat-icon teal"><Users size={20} /></div>
            <div>
              <div className="cp-stat-label">Students</div>
              <div className="cp-stat-value">{totalStudents}</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="cp-toolbar">
          <div className="cp-search-wrap">
            <Search size={16} className="search-icon" />
            <input
              className="cp-search-input"
              placeholder="Search courses…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="cp-search-clear" onClick={() => setSearchQuery("")}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table card */}
        <div className="cp-card">
          <div className="cp-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Course Name</th>
                  <th>Units</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>Loading…</td></tr>
                ) : filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="cp-empty">
                        <div className="cp-empty-icon"><BookOpen size={24} /></div>
                        <p>{searchQuery ? `No courses match "${searchQuery}"` : "No courses found."}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course, i) => (
                    <tr key={course.id}>
                      <td style={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.8rem" }}>{i + 1}</td>
                      <td><span className="cp-course-name">{course.name}</span></td>
                      <td><span className="cp-badge"><Layers size={12} />{course._count?.units ?? 0}</span></td>
                      <td><span className="cp-badge"><Users size={12} />{course._count?.students ?? 0}</span></td>
                      <td>
                        <div className="cp-actions">
                          <button className="icon-btn edit" onClick={() => openEditModal(course)} title="Edit"><Edit size={16} /></button>
                          <button className="icon-btn del" onClick={() => handleDelete(course.id)} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && filteredCourses.length > 0 && (
            <div className="cp-results-info">
              Showing {filteredCourses.length} of {courses.length} course{courses.length !== 1 ? "s" : ""}
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </div>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-add">
            <h2>Add New Course(s)</h2>
            <form onSubmit={handleAddSubmit(onAdd)}>
              {fields.map((field, index) => (
                <div key={field.id} className="modal-row">
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Course Name {index + 1}</label>
                    <input {...regAdd(`coursesData.${index}.name`, { required: true })} className="form-input" placeholder="e.g. Mathematics" />
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="icon-btn del" style={{ marginBottom: 2 }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-add-more" onClick={() => append({ name: "" })}>
                <Plus size={15} /> Add another course
              </button>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => { setIsAddModalOpen(false); resetAdd({ coursesData: [{ name: "" }] }); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isAdding}>
                  {isAdding ? "Saving…" : "Save Courses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-edit">
            <h2>Edit Course</h2>
            <form onSubmit={handleEditSubmit(onEdit)}>
              <div style={{ marginBottom: 6 }}>
                <label className="form-label">Course Name</label>
                <input {...regEdit("name", { required: true })} className="form-input" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => { setIsEditModalOpen(false); setEditingCourse(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isEditing}>
                  {isEditing ? "Updating…" : "Update Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}