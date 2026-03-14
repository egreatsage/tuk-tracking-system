"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react"; // Make sure lucide-react is installed

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      coursesData: [{ name: "" }] // Initialize with one empty input row
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "coursesData"
  });

  const fetchCourses = async () => { /* ... Keep your existing fetch logic ... */ 
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data);
    } catch (error) { toast.error("Failed to load courses"); } finally { setIsLoading(false); }
  };
  useEffect(() => { fetchCourses(); }, []);

  const onSubmit = async (data) => {
    try {
      // Send the array of courses
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.coursesData), 
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create courses");

      toast.success(result.message || "Courses created successfully!");
      reset({ coursesData: [{ name: "" }] }); 
      setIsModalOpen(false);
      fetchCourses();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ... Keep your existing Header and Table code ... */}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Courses</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">+ Add Course(s)</button>
      </div>

      {/* Dynamic Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Course(s)</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 mb-4 items-start">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Name {index + 1}</label>
                    <input
                      {...register(`coursesData.${index}.name`, { required: "Required" })}
                      placeholder="e.g. Diploma in IT"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {errors?.coursesData?.[index]?.name && <p className="text-red-500 text-xs mt-1">Name is required</p>}
                  </div>
                  
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="mt-7 text-red-500 hover:text-red-700 p-2">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => append({ name: "" })}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium mb-6"
              >
                <Plus size={16} className="mr-1" /> Add another course
              </button>
              
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); reset({ coursesData: [{ name: "" }] }); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Courses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}