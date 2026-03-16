"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "react-hot-toast";
import { Clock, MapPin, X, User, BookOpen } from "lucide-react";

const DAY_MAP = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

export default function StudentTimetablePage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await fetch("/api/student/timetable");
        if (!res.ok) throw new Error("Failed to fetch timetable");
        const data = await res.json();

        // Transform data for FullCalendar
        const calendarEvents = data.map((slot) => ({
          id: slot.id,
          title: `${slot.unit.code} - ${slot.unit.name}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          daysOfWeek: [DAY_MAP[slot.day]],
          extendedProps: {
            venue: slot.venue,
            teacherName: slot.teacher.user.name,
            courseName: slot.unit.course?.name,
          },
          backgroundColor: "#0ea5e9", // Sky-500 (Different color for students)
          borderColor: "#0284c7",
        }));

        setEvents(calendarEvents);
      } catch (error) {
        toast.error("Could not load your schedule");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  const handleEventClick = (clickInfo) => {
    setSelectedSlot({
      title: clickInfo.event.title,
      startTime: clickInfo.event.extendedProps.startTime || clickInfo.event.startStr.substring(11, 16),
      endTime: clickInfo.event.extendedProps.endTime || clickInfo.event.endStr.substring(11, 16),
      venue: clickInfo.event.extendedProps.venue,
      teacherName: clickInfo.event.extendedProps.teacherName,
      courseName: clickInfo.event.extendedProps.courseName,
      day: clickInfo.event.start.toLocaleDateString(undefined, { weekday: 'long' })
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Class Schedule</h1>
        <p className="text-sm text-slate-500 mt-1">View your weekly timetable for enrolled units</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 relative">
        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center">
             <span className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-slate-500">
            <BookOpen size={48} className="text-slate-300 mb-4" />
            <p className="font-medium text-slate-700 text-lg">No classes scheduled</p>
            <p className="text-sm mt-1">You are not enrolled in any units with active classes.</p>
          </div>
        ) : (
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            weekends={false}
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridWeek,timeGridDay",
            }}
            eventClassNames="cursor-pointer hover:opacity-90 transition shadow-sm rounded-md border-0"
          />
        )}
      </div>

      {/* --- Read-Only Detail Modal --- */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Class Information</h3>
              <button
                onClick={() => setSelectedSlot(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-sky-100 text-sky-700 mb-2 uppercase">
                  {selectedSlot.title.split(' - ')[0]}
                </span>
                <h4 className="font-bold text-slate-800 text-lg leading-tight">
                  {selectedSlot.title.split(' - ')[1]}
                </h4>
              </div>

              <div className="space-y-3 text-sm mt-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <Clock size={15} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700 font-medium">
                    {selectedSlot.day}s, {selectedSlot.startTime} – {selectedSlot.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={15} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700">{selectedSlot.venue}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User size={15} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700">Lecturer: {selectedSlot.teacherName}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
               <button
                  onClick={() => setSelectedSlot(null)}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2 rounded-xl transition"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}