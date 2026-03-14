"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/users/teachers");
      const data = await res.json();
      setTeachers(data);
    } catch (error) {
      toast.error("Failed to load teachers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const onSubmit = async (data) => {
    try {
      const res = await fetch("/api/users/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to create teacher");

      toast.success("Teacher created successfully! Default password is 'password123'");
      reset();
      setIsModalOpen(false);
      fetchTeachers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Teachers</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          + Add Teacher
        </button>
      </div>

      {/* Teachers List Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : teachers.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No teachers found.</td></tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{teacher.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.teacherProfile?.staffNumber || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.teacherProfile?.department || "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add New Teacher</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  {...register("name", { required: "Name is required" })}
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  {...register("email", { 
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" }
                  })}
                  type="email"
                  placeholder="e.g. jdoe@tukenya.ac.ke"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Number</label>
                  <input
                    {...register("staffNumber", { required: "Required" })}
                    type="text"
                    placeholder="e.g. TUK/123"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 uppercase"
                  />
                  {errors.staffNumber && <p className="text-red-500 text-xs mt-1">{errors.staffNumber.message}</p>}
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    {...register("department", { required: "Required" })}
                    type="text"
                    placeholder="e.g. Computer Science"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
                </div>
              </div>

              <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md mb-6 border border-blue-100">
                <strong>Note:</strong> The teacher's default password will be set to <code>password123</code>.
              </div>
              
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}