"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Edit } from "lucide-react";

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]); // New state for teachers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

      // Check if the responses are actually OK before setting them
      if (!unitsRes.ok) throw new Error(unitsData.error || "Failed to fetch units");
      if (!coursesRes.ok) throw new Error(coursesData.error || "Failed to fetch courses");
      if (!teachersRes.ok) throw new Error(teachersData.error || "Failed to fetch teachers");

      // Ensure they are arrays before setting state
      setUnits(Array.isArray(unitsData) ? unitsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      
    } catch (error) { 
      console.error(error);
      toast.error(error.message || "Failed to load data"); 
      // Set fallbacks so .map() never crashes the page
      setUnits([]); 
      setCourses([]);
      setTeachers([]);
    } finally { 
      setIsLoading(false); 
    }
  };
  useEffect(() => { fetchData(); }, []);

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Units</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          + Add Unit(s)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Teacher</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : units.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No units found.</td></tr>
            ) : (
              units.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{unit.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.course?.name || "N/A"}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
  {unit.teachers && unit.teachers.length > 0 ? (
    <div className="flex flex-wrap gap-1">
      {unit.teachers.map(t => (
        <span key={t.id} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          {t.user.name}
        </span>
      ))}
    </div>
  ) : (
    <span className="text-red-500 italic text-xs">Unassigned</span>
  )}
</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                    <button onClick={() => openEditModal(unit)} className="text-blue-600 hover:text-blue-900"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(unit.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Unit(s)</h2>
            <form onSubmit={handleAddSubmit(onAdd)}>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 mb-4 items-start bg-gray-50 p-4 rounded-md border">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Code</label>
                    <input {...regAdd(`unitsData.${index}.code`, { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 uppercase" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name</label>
                    <input {...regAdd(`unitsData.${index}.name`, { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <select {...regAdd(`unitsData.${index}.courseId`, { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
                      <option value="">-- Select --</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teacher (Optional)</label>
                    <select {...regAdd(`unitsData.${index}.teacherId`)} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
                      <option value="">-- Unassigned --</option>
                      {/* Notice we use teacher.teacherProfile.id here! */}
                      {teachers.map(t => <option key={t.id} value={t.teacherProfile?.id}>{t.name}</option>)}
                    </select>
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="mt-7 text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => append({ code: "", name: "", courseId: "", teacherId: "" })} className="flex items-center text-sm text-blue-600 font-medium mb-6 hover:text-blue-800">
                <Plus size={16} className="mr-1" /> Add another unit
              </button>
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={isAdding} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isAdding ? "Saving..." : "Save Units"}
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
            <h2 className="text-xl font-bold mb-4">Edit Unit</h2>
            <form onSubmit={handleEditSubmit(onEdit)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Code</label>
                <input {...regEdit("code", { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 uppercase" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name</label>
                <input {...regEdit("name", { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select {...regEdit("courseId", { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
                  <option value="">-- Select --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
             <div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teachers (Hold Ctrl/Cmd to select multiple)</label>
  <select 
    multiple 
    {...regEdit("teacherIds")} 
    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white h-24"
  >
    {teachers.map(t => <option key={t.id} value={t.teacherProfile?.id}>{t.name}</option>)}
  </select>
</div>
              <div className="flex justify-end space-x-3 border-t pt-4 mt-6">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingUnit(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={isEditing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isEditing ? "Updating..." : "Update Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}