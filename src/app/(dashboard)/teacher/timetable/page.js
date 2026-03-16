"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "react-hot-toast";
import { CalendarDays } from "lucide-react";
import AttendanceModal from "@/components/AttendanceModal";

const DAY_MAP = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

const EVENT_COLORS = [
  { bg: "#e0f2fe", border: "#0284c7", text: "#0c4a6e" },
  { bg: "#f0fdf4", border: "#16a34a", text: "#14532d" },
  { bg: "#fef9c3", border: "#ca8a04", text: "#713f12" },
  { bg: "#fce7f3", border: "#db2777", text: "#831843" },
  { bg: "#ede9fe", border: "#7c3aed", text: "#3b0764" },
];

export default function TeacherTimetablePage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentView, setCurrentView] = useState("timeGridWeek");

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await fetch("/api/teacher/timetable");
        if (!res.ok) throw new Error("Failed to fetch timetable");
        const data = await res.json();

        const colorMap = {};
        let colorIndex = 0;

        const calendarEvents = data.map((slot) => {
          if (!colorMap[slot.unitId]) {
            colorMap[slot.unitId] = EVENT_COLORS[colorIndex % EVENT_COLORS.length];
            colorIndex++;
          }
          const color = colorMap[slot.unitId];

          return {
            id: slot.id,
            title: `${slot.unit.code} — ${slot.unit.name}`,
            startTime: slot.startTime,
            endTime: slot.endTime,
            daysOfWeek: [DAY_MAP[slot.day]],
            extendedProps: {
              venue: slot.venue,
              unitId: slot.unitId,
              courseName: slot.unit.course?.name,
              unitCode: slot.unit.code,
              unitName: slot.unit.name,
              color,
            },
            backgroundColor: color.bg,
            borderColor: color.border,
            textColor: color.text,
          };
        });

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
    const props = clickInfo.event.extendedProps;
    setSelectedSlot({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      startTime: props.startTime || clickInfo.event.startStr.substring(11, 16),
      endTime: props.endTime || clickInfo.event.endStr.substring(11, 16),
      venue: props.venue,
      unitId: props.unitId,
      courseName: props.courseName,
      unitCode: props.unitCode,
      unitName: props.unitName,
      color: props.color,
      dateClicked: clickInfo.event.start,
    });
  };

  return (
    <>
      {/* Inject custom CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .tt-root {
          font-family: 'DM Sans', sans-serif;
          background: #f8f7f4;
          min-height: 100vh;
          color: #1a1a1a;
        }

        .tt-header {
          padding: 2rem 2rem 0;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .tt-header-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 400;
          line-height: 1.1;
          color: #111;
          letter-spacing: -0.02em;
        }

        .tt-header-sub {
          font-size: 0.85rem;
          color: #888;
          margin-top: 0.25rem;
          font-weight: 400;
          letter-spacing: 0.01em;
        }

        .tt-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 100px;
          padding: 0.4rem 0.9rem;
          font-size: 0.78rem;
          font-weight: 500;
          color: #555;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .tt-calendar-wrapper {
          margin: 0 1rem 1rem;
          background: #fff;
          border-radius: 20px;
          border: 1px solid #ebebeb;
          box-shadow: 0 2px 24px rgba(0,0,0,0.06);
          overflow: hidden;
          padding: 1.25rem;
        }

        /* FullCalendar overrides */
        .tt-calendar-wrapper .fc {
          font-family: 'DM Sans', sans-serif;
        }

        .tt-calendar-wrapper .fc-toolbar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem !important;
        }

        .tt-calendar-wrapper .fc-toolbar-title {
          font-family: 'Instrument Serif', serif;
          font-size: 1.4rem !important;
          font-weight: 400;
          color: #111;
          letter-spacing: -0.01em;
        }

        .tt-calendar-wrapper .fc-button {
          background: #f3f3f1 !important;
          border: 1px solid #e5e5e5 !important;
          color: #444 !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.78rem !important;
          font-weight: 500 !important;
          border-radius: 10px !important;
          padding: 0.35rem 0.75rem !important;
          box-shadow: none !important;
          transition: background 0.15s, color 0.15s !important;
          text-shadow: none !important;
        }

        .tt-calendar-wrapper .fc-button:hover {
          background: #e8e8e6 !important;
          color: #111 !important;
        }

        .tt-calendar-wrapper .fc-button-active,
        .tt-calendar-wrapper .fc-button-primary:not(:disabled).fc-button-active {
          background: #111 !important;
          color: #fff !important;
          border-color: #111 !important;
        }

        .tt-calendar-wrapper .fc-today-button {
          background: #fdf4e7 !important;
          border-color: #f5c97a !important;
          color: #92650a !important;
        }

        .tt-calendar-wrapper .fc-col-header-cell {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #888;
          padding: 0.6rem 0 !important;
          border-bottom: 1px solid #f0f0ee;
          background: transparent;
        }

        .tt-calendar-wrapper .fc-col-header-cell-cushion {
          color: #888 !important;
          text-decoration: none !important;
        }

        .tt-calendar-wrapper .fc-timegrid-slot {
          height: 3rem !important;
          border-color: #f5f5f3 !important;
        }

        .tt-calendar-wrapper .fc-timegrid-slot-label {
          font-size: 0.7rem;
          color: #bbb;
          font-weight: 500;
          vertical-align: top;
          padding-top: 0.35rem;
        }

        .tt-calendar-wrapper .fc-timegrid-col {
          border-color: #f5f5f3 !important;
        }

        .tt-calendar-wrapper .fc-scrollgrid {
          border: none !important;
          border-top: 1px solid #ebebeb !important;
        }

        .tt-calendar-wrapper .fc-scrollgrid td,
        .tt-calendar-wrapper .fc-scrollgrid th {
          border-color: #f0f0ee !important;
        }

        .tt-calendar-wrapper .fc-event {
          border-radius: 10px !important;
          padding: 0.3rem 0.5rem !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08) !important;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
          border-left-width: 3px !important;
        }

        .tt-calendar-wrapper .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
        }

        .tt-calendar-wrapper .fc-event-title {
          font-size: 0.72rem !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tt-calendar-wrapper .fc-event-time {
          font-size: 0.65rem !important;
          opacity: 0.7;
          font-weight: 500 !important;
        }

        .tt-calendar-wrapper .fc-day-today {
          background: #fffbf0 !important;
        }

        .tt-calendar-wrapper .fc-now-indicator-line {
          border-color: #f59e0b !important;
          border-width: 2px !important;
        }

        .tt-calendar-wrapper .fc-now-indicator-arrow {
          border-top-color: #f59e0b !important;
        }

        /* Scrollbar */
        .tt-calendar-wrapper ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .tt-calendar-wrapper ::-webkit-scrollbar-track { background: transparent; }
        .tt-calendar-wrapper ::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 4px;
        }

        /* Modal */
        .tt-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: rgba(10,10,10,0.45);
          backdrop-filter: blur(4px);
          padding: 1rem;
          animation: fadeIn 0.15s ease;
        }

        @media (min-width: 640px) {
          .tt-overlay { align-items: center; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .tt-modal {
          background: #fff;
          border-radius: 24px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06);
          overflow: hidden;
          animation: slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .tt-modal-accent {
          height: 5px;
          width: 100%;
        }

        .tt-modal-top {
          padding: 1.25rem 1.25rem 1rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .tt-modal-code {
          display: inline-flex;
          align-items: center;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          margin-bottom: 0.35rem;
        }

        .tt-modal-name {
          font-family: 'Instrument Serif', serif;
          font-size: 1.45rem;
          font-weight: 400;
          color: #111;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .tt-modal-close {
          flex-shrink: 0;
          background: #f5f5f3;
          border: none;
          border-radius: 10px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #888;
          transition: background 0.15s, color 0.15s;
        }

        .tt-modal-close:hover {
          background: #ebebeb;
          color: #111;
        }

        .tt-modal-body {
          padding: 0 1.25rem 1.25rem;
        }

        .tt-modal-divider {
          height: 1px;
          background: #f0f0ee;
          margin: 1rem 0;
        }

        .tt-detail-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
        }

        .tt-detail-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f7f4;
          border-radius: 8px;
          flex-shrink: 0;
          color: #888;
        }

        .tt-detail-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #aaa;
          margin-bottom: 0.1rem;
        }

        .tt-detail-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: #222;
        }

        .tt-date-badge {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: #fffbf0;
          border: 1px solid #f5c97a;
          border-radius: 12px;
          padding: 0.65rem 0.9rem;
          margin-bottom: 1rem;
        }

        .tt-date-badge-icon {
          color: #d97706;
          flex-shrink: 0;
        }

        .tt-date-badge-text {
          font-size: 0.82rem;
          font-weight: 500;
          color: #78450d;
        }

        .tt-mark-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem 1.25rem;
          border: none;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          background: #111;
          color: #fff;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: 0.01em;
        }

        .tt-mark-btn:hover { background: #222; }
        .tt-mark-btn:active { transform: scale(0.98); }

        /* Loading skeleton */
        .tt-skeleton {
          animation: pulse 1.8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @media (max-width: 640px) {
          .tt-header { padding: 1.25rem 1rem 0; }
          .tt-calendar-wrapper { margin: 0 0.5rem 0.5rem; padding: 0.75rem; }
          .tt-calendar-wrapper .fc-toolbar { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="tt-root">
        <header className="tt-header">
          <div>
            <h1 className="tt-header-title">My Timetable</h1>
            <p className="tt-header-sub">Weekly class schedule &amp; attendance</p>
          </div>
          <div className="tt-pill">
            <CalendarDays size={13} />
            {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date())}
          </div>
        </header>

        <div className="tt-calendar-wrapper">
          {isLoading ? (
            <div style={{ height: 560, display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
              <div className="tt-skeleton" style={{ height: 36, width: "40%", background: "#f0f0ee", borderRadius: 10 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "0.5rem", flex: 1 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="tt-skeleton" style={{ background: "#f8f7f4", borderRadius: 12 }} />
                ))}
              </div>
            </div>
          ) : (
            <FullCalendar
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              weekends={false}
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              nowIndicator={true}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              slotDuration="00:30:00"
              slotLabelInterval="01:00:00"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "Today",
                week: "Week",
                day: "Day",
              }}
            />
          )}
        </div>

        {selectedSlot && (
          <AttendanceModal
            slot={selectedSlot}
            onClose={() => setSelectedSlot(null)}
          />
        )}


      </div>
    </>
  );
}