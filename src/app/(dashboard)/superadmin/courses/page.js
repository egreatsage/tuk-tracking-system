"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Edit } from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form for ADDING multiple courses
  const { register: regAdd, control: controlAdd, handleSubmit: handleAddSubmit, reset: resetAdd, formState: { isSubmitting: isAdding } } = useForm({
    defaultValues: { coursesData: [{ name: "" }] }
  });
  const { fields, append, remove } = useFieldArray({ control: controlAdd, name: "coursesData" });

  // Form for EDITING a single course
  const { register: regEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { isSubmitting: isEditing } } = useForm();

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data);
    } catch (error) { toast.error("Failed to load courses"); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  // ADD Handler
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

  // EDIT Handler
  const openEditModal = (course) => {
    setEditingCourse(course);
    resetEdit({ name: course.name }); // Populate form with existing data
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

  // DELETE Handler
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Courses</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          + Add Course(s)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students Enrolled</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No courses found.</td></tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course._count?.units || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course._count?.students || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                    <button onClick={() => openEditModal(course)} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(course.id)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- ADD MODAL (Remains unchanged) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Course(s)</h2>
            <form onSubmit={handleAddSubmit(onAdd)}>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 mb-4 items-start">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Name {index + 1}</label>
                    <input {...regAdd(`coursesData.${index}.name`, { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="mt-7 text-red-500 hover:text-red-700 p-2"><Trash2 size={20} /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => append({ name: "" })} className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium mb-6">
                <Plus size={16} className="mr-1" /> Add another course
              </button>
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); resetAdd({ coursesData: [{ name: "" }] }); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={isAdding} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isAdding ? "Saving..." : "Save Courses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Edit Course</h2>
            <form onSubmit={handleEditSubmit(onEdit)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <input {...regEdit("name", { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div className="flex justify-end space-x-3 border-t pt-4 mt-6">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingCourse(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={isEditing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isEditing ? "Updating..." : "Update Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}