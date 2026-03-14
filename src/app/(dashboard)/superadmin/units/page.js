"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      unitsData: [{ code: "", name: "", courseId: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "unitsData" });

  const fetchData = async () => { /* Keep existing fetch logic */ };
  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data) => {
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.unitsData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create units");

      toast.success(result.message || "Units created successfully!");
      reset({ unitsData: [{ code: "", name: "", courseId: "" }] });
      setIsModalOpen(false);
      fetchData();
    } catch (error) { toast.error(error.message); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ... Header and Table ... */}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Unit(s)</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 mb-4 items-start bg-gray-50 p-4 rounded-md border">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Code</label>
                    <input
                      {...register(`unitsData.${index}.code`, { required: "Required" })}
                      placeholder="e.g. CSC 111"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 uppercase"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name</label>
                    <input
                      {...register(`unitsData.${index}.name`, { required: "Required" })}
                      placeholder="e.g. Intro to Programming"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <select
                      {...register(`unitsData.${index}.courseId`, { required: "Required" })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                    >
                      <option value="">-- Select --</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="mt-7 text-red-500 hover:text-red-700">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}

              <button type="button" onClick={() => append({ code: "", name: "", courseId: "" })} className="flex items-center text-sm text-blue-600 font-medium mb-6 hover:text-blue-800">
                <Plus size={16} className="mr-1" /> Add another unit
              </button>
              
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Units"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}