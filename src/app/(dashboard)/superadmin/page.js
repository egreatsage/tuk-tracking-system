import Link from "next/link";


// src/app/(dashboard)/superadmin/page.js
export default function SuperAdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
      <p className="mt-4 text-gray-600">Welcome to the TUK Tracking System!</p>
      <Link href="/superadmin/courses" className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
        Manage Courses
      </Link>
      <Link href="/superadmin/units" className="mt-6 inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors ml-4">
        Manage Units
      </Link>
      <Link href="/superadmin/teachers" className="mt-6 inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors ml-4">
        Manage Teachers
      </Link>
    </div>
  );
} 
   