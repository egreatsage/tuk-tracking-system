"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { User, Mail, Hash, BookOpen, GraduationCap, Calendar, ShieldCheck } from "lucide-react";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [parentEmail, setParentEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/student/profile");
        if (!res.ok) throw new Error("Failed to load profile data");
        const data = await res.json();
        setProfile(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <span className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const sp = profile.studentProfile;
  const enrollments = sp.enrollments || [];

  const handleInviteParent = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    setGeneratedLink("");

    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parentEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");

      toast.success("Invite generated!");
      setGeneratedLink(data.inviteLink); // Show link for testing
      setParentEmail("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">View your academic and personal details</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-sky-600 h-24"></div>
            <div className="px-6 pb-6 relative">
              {/* Avatar placeholder */}
              <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center -mt-10 mb-4 bg-gradient-to-br from-slate-100 to-slate-200">
                <User size={32} className="text-slate-400" />
              </div>
              
              <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
              <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-sky-100 text-sky-700 uppercase">
                <ShieldCheck size={12} /> Student
              </span>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <Mail size={15} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="font-medium text-slate-700">{profile.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <Hash size={15} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registration Number</p>
                    <p className="font-mono font-medium text-slate-700">{sp.regNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Academic Details & Units */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Academic Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <GraduationCap size={18} className="text-sky-500" /> Academic Overview
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enrolled Course</p>
                <p className="font-semibold text-slate-800">{sp.course?.name || "Not Assigned"}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year of Study</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" /> Year {sp.year}
                </p>
              </div>
            </div>
          </div>

          {/* Enrolled Units List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <BookOpen size={18} className="text-sky-500" /> Enrolled Units ({enrollments.length})
            </h3>
            
            {enrollments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p>You are not currently enrolled in any units.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enrollments.map((e) => (
                  <div key={e.unit.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-sky-200 transition bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-sky-600">{e.unit.code.substring(0, 3)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-sky-600 mb-0.5">{e.unit.code}</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{e.unit.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* --- New Parent Invite Card --- */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Link a Parent/Guardian</h3>
            <p className="text-xs text-slate-500 mb-4">Invite your parent to view your academic progress and attendance.</p>
            
            <form onSubmit={handleInviteParent} className="space-y-3">
              <input
                type="email"
                placeholder="parent@email.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-sky-300 outline-none"
              />
              <button
                type="submit"
                disabled={isInviting}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold py-2 rounded-lg transition"
              >
                {isInviting ? "Generating..." : "Generate Invite Link"}
              </button>
            </form>

            {/* Display the link purely for MVP testing purposes */}
            {generatedLink && (
              <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg break-all">
                <p className="text-[10px] font-bold text-sky-800 uppercase mb-1">Testing Link (MVP Only)</p>
                <a href={generatedLink} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline">
                  {generatedLink}
                </a>
              </div>
            )}
          </div>
    </div>
  );
}