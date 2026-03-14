"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Trash2, Calendar } from "lucide-react";

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

export default function TimetablePage() {
  const [slots, setSlots] = useState([]);
  const [courses, setCourses] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm();

  // Watch selected values for cascading dropdowns
  const selectedCourseId = watch("courseId");
  const selectedUnitId = watch("unitId");

  // Filter Units based on Course selection
  const availableUnits = units.filter(u => u.courseId === selectedCourseId);
  
  // Filter Teachers based on Unit selection (Using the Many-to-Many array)
  const selectedUnitData = units.find(u => u.id === selectedUnitId);
  const availableTeachers = selectedUnitData?.teachers || [];

  const fetchData = async () => {
    try {
      const [slotsRes, coursesRes, unitsRes] = await Promise.all([
        fetch("/api/timetable"),
        fetch("/api/courses"),
        fetch("/api/units")
      ]);
      setSlots(await slotsRes.json());
      setCourses(await coursesRes.json());
      setUnits(await unitsRes.json());
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data) => {
    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      
      // If our strict backend checks fail, this catches it and shows the exact error rule broken
      if (!res.ok) throw new Error(result.error);

      toast.success("Class scheduled successfully!");
      reset({ courseId: "", unitId: "", teacherId: "", day: "", startTime: "", endTime: "", venue: "" });
      fetchData();
    } catch (error) {
      toast.error(error.message, { duration: 5000 }); // Show the error longer so they can read it
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this class from the timetable?")) return;
    try {
      // NOTE: You will need to create a DELETE route at /api/timetable/[id]/route.js just like the other CRUDs
      const res = await fetch(`/api/timetable/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Class removed!");
      fetchData();
    } catch (error) { toast.error(error.message); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      
      {/* LEFT PANEL: The Builder Form */}
      <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-md h-fit">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Calendar size={24} className="text-blue-600"/>
          Schedule a Class
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select {...register("courseId", { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
              <option value="">-- Select Course --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select {...register("unitId", { required: true })} disabled={!selectedCourseId} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white disabled:bg-gray-100">
              <option value="">-- Select Unit --</option>
              {availableUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select {...register("teacherId", { required: true })} disabled={!selectedUnitId} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white disabled:bg-gray-100">
              <option value="">-- Select Teacher --</option>
              {availableTeachers.map(t => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
            </select>
            {selectedUnitId && availableTeachers.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No teachers assigned to this unit.</p>
            )}
          </div>

          <div className="pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
            <select {...register("day", { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
              <option value="">-- Select Day --</option>
              {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" {...register("startTime", { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" {...register("endTime", { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue (Room)</label>
            <input type="text" {...register("venue", { required: true })} placeholder="e.g. Lab 2, Main Hall" className="w-full border border-gray-300 rounded-md px-3 py-2 uppercase" />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium mt-4">
            {isSubmitting ? "Checking Conflicts..." : "Add to Timetable"}
          </button>
        </form>
      </div>

      {/* RIGHT PANEL: Master Timetable View */}
      <div className="w-full lg:w-2/3 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Master Timetable Overview</h2>
        
        {isLoading ? (
          <p className="text-gray-500 text-center py-10">Loading timetable...</p>
        ) : (
          <div className="space-y-8">
            {DAYS_OF_WEEK.map(day => {
              const daySlots = slots.filter(s => s.day === day);
              if (daySlots.length === 0) return null; // Don't show empty days

              return (
                <div key={day}>
                  <h3 className="text-lg font-bold bg-gray-100 px-4 py-2 rounded-t-md border-b">{day}</h3>
                  <div className="border rounded-b-md divide-y">
                    {daySlots.map(slot => (
                      <div key={slot.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                        <div>
                          <p className="font-bold text-blue-900">{slot.unit.code} - {slot.unit.name}</p>
                          <div className="flex gap-4 text-sm text-gray-600 mt-1">
                            <span>🕒 {slot.startTime} - {slot.endTime}</span>
                            <span>📍 {slot.venue}</span>
                            <span>👨‍🏫 {slot.teacher.user.name}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDelete(slot.id)} className="text-red-500 hover:text-red-700 p-2">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {slots.length === 0 && (
              <p className="text-gray-500 text-center py-10 border rounded-md border-dashed">No classes scheduled yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}