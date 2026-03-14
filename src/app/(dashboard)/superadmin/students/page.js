"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Edit, Trash2 } from "lucide-react"; // Import the icons!

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form for ADDING
  const { register: regAdd, handleSubmit: handleAddSubmit, reset: resetAdd, formState: { errors: errorsAdd, isSubmitting: isAdding } } = useForm();
  
  // Form for EDITING
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

  // --- ADD HANDLER ---
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

  // --- EDIT HANDLERS ---
  const openEditModal = (student) => {
    setEditingStudent(student);
    // Populate the edit form with the student's current data
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

  // --- DELETE HANDLER ---
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Students</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          + Add Student
        </button>
      </div>

      {/* Students List Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No students found.</td></tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{student.studentProfile?.regNumber || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.studentProfile?.course?.name || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Year {student.studentProfile?.year || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                    <button onClick={() => openEditModal(student)} className="text-blue-600 hover:text-blue-900"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- ADD MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">Add New Student</h2>
            <form onSubmit={handleAddSubmit(onAdd)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input {...regAdd("name", { required: "Required" })} type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                {errorsAdd.name && <p className="text-red-500 text-xs mt-1">{errorsAdd.name.message}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input {...regAdd("email", { required: "Required" })} type="email" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                {errorsAdd.email && <p className="text-red-500 text-xs mt-1">{errorsAdd.email.message}</p>}
              </div>

              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reg Number</label>
                  <input {...regAdd("regNumber", { required: "Required" })} type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 uppercase" />
                  {errorsAdd.regNumber && <p className="text-red-500 text-xs mt-1">{errorsAdd.regNumber.message}</p>}
                </div>

                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                  <select {...regAdd("year", { required: "Required" })} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
                    <option value="">-- Select --</option>
                    {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select {...regAdd("courseId", { required: "Required" })} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
                  <option value="">-- Select Enrolled Course --</option>
                  {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                </select>
              </div>

              <div className="flex justify-end space-x-3 border-t pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={isAdding} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isAdding ? "Saving..." : "Save Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">Edit Student</h2>
            <form onSubmit={handleEditSubmit(onEdit)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input {...regEdit("name", { required: "Required" })} type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                {errorsEdit.name && <p className="text-red-500 text-xs mt-1">{errorsEdit.name.message}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input {...regEdit("email", { required: "Required" })} type="email" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                {errorsEdit.email && <p className="text-red-500 text-xs mt-1">{errorsEdit.email.message}</p>}
              </div>

              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reg Number</label>
                  <input {...regEdit("regNumber", { required: "Required" })} type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 uppercase" />
                  {errorsEdit.regNumber && <p className="text-red-500 text-xs mt-1">{errorsEdit.regNumber.message}</p>}
                </div>

                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                  <select {...regEdit("year", { required: "Required" })} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
                    <option value="">-- Select --</option>
                    {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select {...regEdit("courseId", { required: "Required" })} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
                  <option value="">-- Select Enrolled Course --</option>
                  {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                </select>
              </div>

              <div className="flex justify-end space-x-3 border-t pt-4">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingStudent(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={isEditing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isEditing ? "Updating..." : "Update Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}