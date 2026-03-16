"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { BookOpen, Calendar, FileText, CheckCircle2, Clock, UploadCloud, Link as LinkIcon, AlertCircle } from "lucide-react";

export default function StudentAssignmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null); // Tracks which assessment is currently uploading

  const fetchAssessments = async () => {
    try {
      const res = await fetch("/api/student/assessments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const data = await res.json();
      setAssessments(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Open Cloudinary Widget for Student Submission
  const openUploadWidget = (assessmentId) => {
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: 'ml_default', 
        sources: ['local', 'url', 'google_drive'],
        multiple: false,
        folder: 'tuk_submissions',
        uploadSignature: async (callback, paramsToSign) => {
          try {
            const res = await fetch('/api/upload/sign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paramsToSign }),
            });
            const data = await res.json();
            callback(data.signature);
          } catch (err) {
            toast.error("Signature generation failed");
          }
        },
      },
      async (error, result) => {
        if (!error && result && result.event === "success") {
          setSubmittingId(assessmentId);
          try {
            // Save the uploaded file URL to the database
            const res = await fetch("/api/submissions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assessmentId,
                fileUrl: result.info.secure_url,
              }),
            });

            if (!res.ok) throw new Error("Failed to save submission record");
            
            toast.success("Assignment submitted successfully!");
            fetchAssessments(); // Refresh the list to show the new status
          } catch (err) {
            toast.error(err.message);
          } finally {
            setSubmittingId(null);
          }
        }
      }
    );
    widget.open();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <span className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Assignments</h1>
        <p className="text-sm text-slate-500 mt-1">View pending assessments and submit your work</p>
      </header>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <BookOpen size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-700 text-lg">No assignments pending</p>
          <p className="text-sm mt-1">Your lecturers have not posted any assessments for your units yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {assessments.map((assessment) => {
            const submission = assessment.submissions[0]; // Exists if they already submitted
            const isOverdue = new Date(assessment.dueDate) < new Date() && !submission;
            const isGraded = submission?.marks !== null && submission?.marks !== undefined;

            return (
              <div key={assessment.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
                
                {/* Header: Status Chip & Unit */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-sky-100 text-sky-700 uppercase">
                      {assessment.type}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{assessment.unit.code}</span>
                  </div>
                  
                  {/* Status Badges */}
                  {isGraded ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={12} /> Graded
                    </span>
                  ) : submission ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                      <CheckCircle2 size={12} /> Submitted
                    </span>
                  ) : isOverdue ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      <AlertCircle size={12} /> Overdue
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      <Clock size={12} /> Pending
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-1">{assessment.title}</h3>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-4 pb-4 border-b border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14}/> Due: {new Date(assessment.dueDate).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>Max Marks: {assessment.maxMarks}</span>
                </div>

                {assessment.instructions && (
                  <p className="text-sm text-slate-600 mb-4 flex-1">{assessment.instructions}</p>
                )}

                {/* Footer Actions */}
                <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-2">
                  {/* Download Teacher's Attachment */}
                  {assessment.fileUrl && (
                    <a href={assessment.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition">
                      <FileText size={16}/> View Attachment
                    </a>
                  )}

                  {/* Submission Action */}
                  {!submission ? (
                    <button 
                      onClick={() => openUploadWidget(assessment.id)}
                      disabled={submittingId === assessment.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white text-sm font-semibold rounded-xl transition shadow-sm"
                    >
                      {submittingId === assessment.id ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><UploadCloud size={16}/> Submit Work</>
                      )}
                    </button>
                  ) : (
                    <div className="flex-1 flex flex-col gap-2">
                      {submission.fileUrl && (
                        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 hover:border-sky-300 hover:text-sky-600 text-slate-600 text-sm font-semibold rounded-xl transition">
                          <LinkIcon size={16}/> View My Submission
                        </a>
                      )}
                      
                      {isGraded && (
                        <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Score</p>
                          <p className="text-2xl font-bold text-emerald-600">{submission.marks} <span className="text-sm text-emerald-500 font-medium">/ {assessment.maxMarks}</span></p>
                          {submission.feedback && (
                            <p className="text-sm text-slate-600 mt-2 border-t border-emerald-200/50 pt-2">
                              <span className="font-semibold">Feedback:</span> {submission.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}