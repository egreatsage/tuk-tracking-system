"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowLeft, CheckCircle2, FileText, MessageSquare, Edit3, Link as LinkIcon } from "lucide-react";

export default function GradingPage() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchAssessmentData = async () => {
    try {
      const res = await fetch(`/api/assessments/${params.id}/submissions`);
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      setAssessment(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentData();
  }, [params.id]);

  const openGradingModal = (submission) => {
    setGradingSubmission(submission);
    setMarks(submission.marks !== null ? submission.marks : "");
    setFeedback(submission.feedback || "");
  };

  const handleSaveGrade = async () => {
    if (marks === "" || isNaN(marks) || Number(marks) < 0 || Number(marks) > assessment.maxMarks) {
      toast.error(`Marks must be between 0 and ${assessment.maxMarks}`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/submissions/${gradingSubmission.id}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks, feedback }),
      });

      if (!res.ok) throw new Error("Failed to save grade");
      
      toast.success("Grade saved successfully!");
      setGradingSubmission(null);
      fetchAssessmentData(); // Refresh list to show new grade
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6">
      <button 
        onClick={() => router.push('/teacher/assessments')}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft size={16} /> Back to Assessments
      </button>

      <header className="mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-indigo-100 text-indigo-700">{assessment.type}</span>
          <span className="text-xs font-bold text-slate-400">{assessment.unit.code}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{assessment.title}</h1>
        <div className="flex gap-4 mt-2 text-sm text-slate-600">
          <span>Max Marks: <span className="font-bold text-slate-800">{assessment.maxMarks}</span></span>
          <span>Submissions: <span className="font-bold text-indigo-600">{assessment.submissions.length}</span></span>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {assessment.submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-700">No submissions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">Student</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">Submitted On</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">File</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">Score</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessment.submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-800 text-sm">{sub.student.user.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{sub.student.regNumber}</p>
                    </td>
                    <td className="py-4 px-5 text-sm text-slate-600">
                      {new Date(sub.submittedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="py-4 px-5">
                      {sub.fileUrl ? (
                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition">
                          <LinkIcon size={14}/> View Work
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No file attached</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {sub.marks !== null ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-600">{sub.marks} <span className="text-slate-400 text-xs font-normal">/ {assessment.maxMarks}</span></span>
                          {sub.feedback && <span className="text-[10px] text-slate-500 truncate w-32" title={sub.feedback}>"{sub.feedback}"</span>}
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold tracking-wider">NEEDS GRADING</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button 
                        onClick={() => openGradingModal(sub)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 text-xs font-semibold rounded-lg transition"
                      >
                        <Edit3 size={14} /> {sub.marks !== null ? "Edit Grade" : "Grade"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Grading Modal --- */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">Grade Submission</h3>
              <p className="text-sm text-slate-500 mt-1">{gradingSubmission.student.user.name} ({gradingSubmission.student.regNumber})</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Marks (out of {assessment.maxMarks})
                </label>
                <input
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none text-lg font-semibold"
                  placeholder="0"
                  max={assessment.maxMarks}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MessageSquare size={14} /> Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none"
                  placeholder="Great job on..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                onClick={() => setGradingSubmission(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrade}
                disabled={isSaving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition flex justify-center items-center gap-2"
              >
                {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 size={16} /> Save Grade</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}