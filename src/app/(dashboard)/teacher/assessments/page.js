"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FileUp, Plus, Calendar, BookOpen, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TeacherAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [formData, setFormData] = useState({
    unitId: "",
    type: "ASSIGNMENT",
    title: "",
    instructions: "",
    dueDate: "",
    maxMarks: "100",
  });
 const router = useRouter();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessmentsRes, unitsRes] = await Promise.all([
          fetch("/api/assessments"),
          fetch("/api/teacher/units")
        ]);
        
        if (assessmentsRes.ok) setAssessments(await assessmentsRes.json());
        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          setUnits(unitsData);
          if (unitsData.length > 0) setFormData(prev => ({ ...prev, unitId: unitsData[0].id }));
        }
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Open Cloudinary Widget
  const openUploadWidget = () => {
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: 'ml_default', // You can change this if you set a specific preset in Cloudinary
        apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        sources: ['local', 'url', 'google_drive'],
        multiple: false,
        folder: 'tuk_assessments',
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
      (error, result) => {
        if (!error && result && result.event === "success") {
          setFileUrl(result.info.secure_url);
          setFileName(result.info.original_filename + "." + result.info.format);
          toast.success("File uploaded successfully!");
        }
      }
    );
    widget.open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, fileUrl }),
      });

      if (!res.ok) throw new Error("Failed to create assessment");
      
      const newAssessment = await res.json();
      setAssessments(prev => [...prev, newAssessment].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
      
      toast.success("Assessment published to students!");
      
      // Reset form
      setFormData({ ...formData, title: "", instructions: "", dueDate: "" });
      setFileUrl("");
      setFileName("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Assessments</h1>
        <p className="text-sm text-slate-500 mt-1">Upload CATs, Assignments, and Exams for your units</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-indigo-600" /> Create New
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unit</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                  required
                >
                  {units.map(u => <option key={u.id} value={u.id}>{u.code}</option>)}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                  >
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="CAT">CAT</option>
                    <option value="EXAM">Exam</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Marks</label>
                  <input
                    type="number"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Database Design CAT 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">File Attachment (Optional)</label>
                {fileUrl ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span className="text-xs text-emerald-800 font-medium truncate">{fileName}</span>
                    </div>
                    <button type="button" onClick={() => { setFileUrl(""); setFileName(""); }} className="text-xs text-rose-500 hover:underline font-medium shrink-0 ml-2">Remove</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openUploadWidget}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 py-4 rounded-lg transition text-sm font-medium"
                  >
                    <FileUp size={18} /> Upload PDF or Document
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition mt-4 flex justify-center"
              >
                {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Publish Assessment"}
              </button>
            </form>
          </div>
        </div>

        {/* Right: List of Assessments */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="h-48 flex justify-center items-center"><span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
          ) : assessments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <BookOpen size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-700">No assessments created yet.</p>
            </div>
          ) : (
            assessments.map(assessment => (
              <div key={assessment.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-indigo-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-indigo-100 text-indigo-700">{assessment.type}</span>
                    <span className="text-xs font-bold text-slate-400">{assessment.unit.code}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{assessment.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5"><Calendar size={14}/> Due: {new Date(assessment.dueDate).toLocaleDateString()}</span>
                    <span>Max Marks: {assessment.maxMarks}</span>
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                  {assessment.fileUrl && (
                    <a href={assessment.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition">
                      <LinkIcon size={14}/> View File
                    </a>
                  )}
                  <button 
  onClick={() => router.push(`/teacher/assessments/${assessment.id}/submissions`)}
  className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 text-xs font-semibold rounded-lg transition"
>
  View Submissions
</button>
                </div>
              </div>
            ))
          )}
        </div>
        
      </div>
    </div>
  );
}