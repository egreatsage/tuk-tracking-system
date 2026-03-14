"use client";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow mt-10">
      <h1 className="text-2xl font-bold border-b pb-4 mb-4">My Profile</h1>
      <div className="space-y-4 text-lg">
        <p><strong>Name:</strong> {session?.user?.name}</p>
        <p><strong>Email:</strong> {session?.user?.email}</p>
        <p><strong>Role:</strong> {session?.user?.role}</p>
      </div>
    </div>
  );
}