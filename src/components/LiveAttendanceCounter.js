"use client";
import { useState, useEffect } from "react";
import { Users } from "lucide-react";

export default function LiveAttendanceCounter({ lectureId }) {
  const [counts, setCounts] = useState({ presentCount: 0, totalEnrolled: 0 });
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!isPolling) return;

    const fetchLiveCount = async () => {
      try {
        const res = await fetch(`/api/teacher/lectures/${lectureId}/live-count`);
        if (res.ok) {
          const data = await res.json();
          setCounts(data);
        }
      } catch (error) {
        console.error("Failed to fetch live count");
      }
    };

    // Fetch immediately on mount
    fetchLiveCount();

    // Then fetch every 3 seconds
    const intervalId = setInterval(fetchLiveCount, 3000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [lectureId, isPolling]);

  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
      <div className="p-3 bg-blue-500 rounded-full text-white animate-pulse">
        <Users size={24} />
      </div>
      <div>
        <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">Live Attendance</p>
        <p className="text-3xl font-bold text-gray-900">
          {counts.presentCount} <span className="text-lg text-gray-500 font-medium">/ {counts.totalEnrolled}</span>
        </p>
      </div>
      {/* Optional: Add a button to stop polling when class is over */}
      <button 
        onClick={() => setIsPolling(false)}
        className="ml-auto text-sm text-red-500 hover:underline"
      >
        Stop Tracking
      </button>
    </div>
  );
}