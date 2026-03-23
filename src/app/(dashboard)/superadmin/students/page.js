"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Edit, Trash2, Search, UserPlus, X, GraduationCap, Users } from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { register: regAdd, handleSubmit: handleAddSubmit, reset: resetAdd, formState: { errors: errorsAdd, isSubmitting: isAdding } } = useForm();
  const { register: regEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: errorsEdit, isSubmitting: isEditing } } = useForm();

  const fetchData = async () => {
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        fetch("/api/users/students"),
        fetch("/api/courses")
      ]);
      const studentsData = await studentsRes.json();
      const coursesData = await coursesRes.json();
      if (!studentsRes.ok) throw new Error(studentsData.error || "Failed to fetch students");
      if (!coursesRes.ok) throw new Error(coursesData.error || "Failed to fetch courses");
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      toast.error(error.message || "Failed to load data");
      setStudents([]);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) =>
      s.studentProfile?.regNumber?.toLowerCase().includes(q) ||
      s.studentProfile?.course?.name?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const onAdd = async (data) => {
    try {
      const res = await fetch("/api/users/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Student created successfully!");
      resetAdd();
      setIsAddModalOpen(false);
      fetchData();
    } catch (error) { toast.error(error.message); }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    resetEdit({
      name: student.name,
      email: student.email,
      regNumber: student.studentProfile?.regNumber || "",
      year: student.studentProfile?.year?.toString() || "",
      courseId: student.studentProfile?.courseId || ""
    });
    setIsEditModalOpen(true);
  };

  const onEdit = async (data) => {
    try {
      const res = await fetch(`/api/users/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Student updated successfully!");
      setIsEditModalOpen(false);
      setEditingStudent(null);
      fetchData();
    } catch (error) { toast.error(error.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student? All their data will be lost!")) return;
    try {
      const res = await fetch(`/api/users/students/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Student deleted!");
      fetchData();
    } catch (error) { toast.error(error.message); }
  };

  const ModalForm = ({ isEdit }) => {
    const reg = isEdit ? regEdit : regAdd;
    const errors = isEdit ? errorsEdit : errorsAdd;
    const isSubmitting = isEdit ? isEditing : isAdding;
    const onSubmit = isEdit ? handleEditSubmit(onEdit) : handleAddSubmit(onAdd);
    const onClose = isEdit
      ? () => { setIsEditModalOpen(false); setEditingStudent(null); }
      : () => setIsAddModalOpen(false);

    return (
      <div className="sp-modal-overlay">
        <div className="sp-modal">
          <div className="sp-modal-header">
            <h2 className="sp-modal-title">
              {isEdit ? "Edit Student" : "Add New Student"}
            </h2>
            <button onClick={onClose} className="sp-modal-close"><X size={18} /></button>
          </div>
          <form onSubmit={onSubmit} className="sp-form">
            <div className="sp-field">
              <label className="sp-label">Full Name</label>
              <input {...reg("name", { required: "Required" })} type="text" className="sp-input" placeholder="e.g. Jane Muthoni" />
              {errors.name && <p className="sp-error">{errors.name.message}</p>}
            </div>
            <div className="sp-field">
              <label className="sp-label">Email Address</label>
              <input {...reg("email", { required: "Required" })} type="email" className="sp-input" placeholder="e.g. jane@university.ac.ke" />
              {errors.email && <p className="sp-error">{errors.email.message}</p>}
            </div>
            <div className="sp-row">
              <div className="sp-field sp-field-grow">
                <label className="sp-label">Reg Number</label>
                <input {...reg("regNumber", { required: "Required" })} type="text" className="sp-input sp-uppercase" placeholder="e.g. CS/001/2024" />
                {errors.regNumber && <p className="sp-error">{errors.regNumber.message}</p>}
              </div>
              <div className="sp-field sp-field-narrow">
                <label className="sp-label">Year</label>
                <select {...reg("year", { required: "Required" })} className="sp-select">
                  <option value="">--</option>
                  {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
                {errors.year && <p className="sp-error">{errors.year.message}</p>}
              </div>
            </div>
            <div className="sp-field">
              <label className="sp-label">Course</label>
              <select {...reg("courseId", { required: "Required" })} className="sp-select">
                <option value="">-- Select Enrolled Course --</option>
                {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
              </select>
              {errors.courseId && <p className="sp-error">{errors.courseId.message}</p>}
            </div>
            <div className="sp-modal-footer">
              <button type="button" onClick={onClose} className="sp-btn sp-btn-ghost">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="sp-btn sp-btn-primary">
                {isSubmitting ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Student" : "Save Student")}
              </button>
            </div>
          </form>
        </div>
        <style>{modalStyles}</style>
      </div>
    );
  };

  return (
    <>
      <style>{pageStyles}</style>
      <div className="sp-root">
        {/* Header */}
        <div className="sp-header">
          <div className="sp-header-left">
            <div className="sp-icon-badge">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="sp-title">Students</h1>
              <p className="sp-subtitle">{students.length} enrolled student{students.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="sp-btn sp-btn-primary sp-add-btn">
            <UserPlus size={16} />
            <span>Add Student</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="sp-search-wrapper">
          <Search size={16} className="sp-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reg number or course name..."
            className="sp-search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="sp-search-clear">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="sp-table-card">
          <div className="sp-table-wrapper">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Reg Number</th>
                  <th>Name</th>
                  <th className="sp-hide-sm">Email</th>
                  <th className="sp-hide-md">Course</th>
                  <th className="sp-hide-sm">Year</th>
                  <th className="sp-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="sp-empty-cell">
                      <div className="sp-loading">
                        <div className="sp-spinner" />
                        <span>Loading students...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="sp-empty-cell">
                      <div className="sp-empty">
                        <Users size={36} className="sp-empty-icon" />
                        <p className="sp-empty-title">
                          {searchQuery ? "No results found" : "No students yet"}
                        </p>
                        <p className="sp-empty-sub">
                          {searchQuery ? `Nothing matched "${searchQuery}"` : "Add your first student to get started"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="sp-row">
                      <td>
                        <span className="sp-reg-badge">{student.studentProfile?.regNumber || "N/A"}</span>
                      </td>
                      <td>
                        <div className="sp-name-cell">
                          <div className="sp-avatar">{student.name?.charAt(0)?.toUpperCase()}</div>
                          <span className="sp-name">{student.name}</span>
                        </div>
                      </td>
                      <td className="sp-hide-sm sp-muted">{student.email}</td>
                      <td className="sp-hide-md">
                        {student.studentProfile?.course?.name
                          ? <span className="sp-course-tag">{student.studentProfile.course.name}</span>
                          : <span className="sp-muted">—</span>}
                      </td>
                      <td className="sp-hide-sm sp-muted">
                        {student.studentProfile?.year ? `Year ${student.studentProfile.year}` : "—"}
                      </td>
                      <td className="sp-actions-cell">
                        <button onClick={() => openEditModal(student)} className="sp-action-btn sp-edit-btn" title="Edit">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="sp-action-btn sp-delete-btn" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredStudents.length > 0 && (
            <div className="sp-table-footer">
              Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
              {searchQuery && <> for "<em>{searchQuery}</em>"</>}
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && <ModalForm isEdit={false} />}
      {isEditModalOpen && <ModalForm isEdit={true} />}
    </>
  );
}

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .sp-root {
    font-family: 'DM Sans', sans-serif;
    padding: clamp(1rem, 4vw, 2rem);
    max-width: 1100px;
    margin: 0 auto;
    color: #0f172a;
  }

  /* Header */
  .sp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .sp-header-left {
    display: flex;
    align-items: center;
    gap: 0.875rem;
  }
  .sp-icon-badge {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(59,130,246,0.35);
  }
  .sp-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
    line-height: 1.2;
  }
  .sp-subtitle {
    font-size: 0.8rem;
    color: #64748b;
    margin: 0;
    font-weight: 400;
  }

  /* Search */
  .sp-search-wrapper {
    position: relative;
    margin-bottom: 1.25rem;
  }
  .sp-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
  }
  .sp-search-input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.65rem 2.5rem 0.65rem 2.5rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    background: #f8fafc;
    color: #0f172a;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    outline: none;
  }
  .sp-search-input:focus {
    border-color: #3b82f6;
    background: white;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }
  .sp-search-input::placeholder { color: #94a3b8; }
  .sp-search-clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: #e2e8f0;
    border: none;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: background 0.15s;
  }
  .sp-search-clear:hover { background: #cbd5e1; }

  /* Table Card */
  .sp-table-card {
    background: white;
    border-radius: 16px;
    border: 1.5px solid #e2e8f0;
    overflow: hidden;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06);
  }
  .sp-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .sp-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 520px;
  }
  .sp-table thead tr {
    background: #f1f5f9;
    border-bottom: 1.5px solid #e2e8f0;
  }
  .sp-table th {
    padding: 0.75rem 1.25rem;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #64748b;
    white-space: nowrap;
  }
  .sp-actions-col { text-align: right; }
  .sp-row {
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.12s;
  }
  .sp-row:last-child { border-bottom: none; }
  .sp-row:hover { background: #f8fafc; }
  .sp-table td {
    padding: 0.875rem 1.25rem;
    font-size: 0.875rem;
    vertical-align: middle;
  }

  /* Cell styles */
  .sp-reg-badge {
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    background: #eff6ff;
    color: #1d4ed8;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-weight: 500;
    white-space: nowrap;
    border: 1px solid #bfdbfe;
  }
  .sp-name-cell {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }
  .sp-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sp-name { font-weight: 500; color: #0f172a; }
  .sp-muted { color: #64748b; }
  .sp-course-tag {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 500;
    white-space: nowrap;
  }
  .sp-actions-cell {
    display: flex;
    justify-content: flex-end;
    gap: 0.375rem;
  }
  .sp-action-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1.5px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
  }
  .sp-edit-btn {
    background: #eff6ff;
    color: #3b82f6;
    border-color: #bfdbfe;
  }
  .sp-edit-btn:hover { background: #dbeafe; border-color: #93c5fd; }
  .sp-delete-btn {
    background: #fff1f2;
    color: #ef4444;
    border-color: #fecaca;
  }
  .sp-delete-btn:hover { background: #fee2e2; border-color: #fca5a5; }

  /* Empty / loading */
  .sp-empty-cell { padding: 3rem 1rem !important; }
  .sp-loading, .sp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
  }
  .sp-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: sp-spin 0.7s linear infinite;
  }
  @keyframes sp-spin { to { transform: rotate(360deg); } }
  .sp-empty-icon { color: #cbd5e1; margin-bottom: 0.25rem; }
  .sp-empty-title { font-weight: 600; color: #475569; font-size: 0.9rem; margin: 0; }
  .sp-empty-sub { font-size: 0.8rem; margin: 0; }

  /* Table footer */
  .sp-table-footer {
    padding: 0.75rem 1.25rem;
    font-size: 0.8rem;
    color: #64748b;
    border-top: 1px solid #f1f5f9;
    background: #fafafa;
  }
  .sp-table-footer strong { color: #334155; }
  .sp-table-footer em { color: #3b82f6; font-style: normal; font-weight: 500; }

  /* Buttons */
  .sp-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.1rem;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .sp-btn-primary {
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: white;
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(59,130,246,0.3);
  }
  .sp-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(59,130,246,0.4); }
  .sp-btn-primary:active { transform: translateY(0); }
  .sp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .sp-btn-ghost {
    background: white;
    color: #475569;
    border-color: #e2e8f0;
  }
  .sp-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }
  .sp-add-btn { flex-shrink: 0; }

  /* Responsive hide */
  @media (max-width: 640px) { .sp-hide-sm { display: none !important; } }
  @media (max-width: 768px) { .sp-hide-md { display: none !important; } }
`;

const modalStyles = `
  .sp-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15,23,42,0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 1rem;
    animation: sp-fade-in 0.15s ease;
  }
  @keyframes sp-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .sp-modal {
    background: white;
    border-radius: 18px;
    width: 100%;
    max-width: 480px;
    max-height: 92vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: sp-slide-up 0.2s ease;
  }
  @keyframes sp-slide-up { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .sp-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem 1rem;
    border-bottom: 1.5px solid #f1f5f9;
  }
  .sp-modal-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0;
    color: #0f172a;
  }
  .sp-modal-close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .sp-modal-close:hover { background: #f1f5f9; color: #0f172a; }
  .sp-form { padding: 1.25rem 1.5rem; }
  .sp-field { margin-bottom: 1.1rem; }
  .sp-row { display: flex; gap: 0.75rem; }
  .sp-field-grow { flex: 1; }
  .sp-field-narrow { width: 130px; flex-shrink: 0; }
  .sp-label {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    color: #374151;
    letter-spacing: 0.02em;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
  }
  .sp-input, .sp-select {
    width: 100%;
    box-sizing: border-box;
    padding: 0.6rem 0.875rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    color: #0f172a;
    background: #f8fafc;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    appearance: none;
    -webkit-appearance: none;
  }
  .sp-input:focus, .sp-select:focus {
    border-color: #3b82f6;
    background: white;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }
  .sp-input::placeholder { color: #94a3b8; }
  .sp-uppercase { text-transform: uppercase; }
  .sp-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 2.2rem; }
  .sp-error { font-size: 0.75rem; color: #ef4444; margin-top: 0.3rem; font-weight: 500; }
  .sp-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.625rem;
    border-top: 1.5px solid #f1f5f9;
    padding-top: 1rem;
    margin-top: 0.5rem;
  }
  @media (max-width: 480px) {
    .sp-row { flex-direction: column; }
    .sp-field-narrow { width: 100%; }
    .sp-modal-footer { flex-direction: column-reverse; }
    .sp-modal-footer .sp-btn { width: 100%; justify-content: center; }
  }
`;