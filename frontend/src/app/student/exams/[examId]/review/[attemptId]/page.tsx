"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Clock, 
  Trophy,
  AlertCircle,
  HelpCircle,
  BarChart3
} from "lucide-react";
import api from "@/services/api";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";
import { Download } from "lucide-react";

export default function ExamReview() {
  const { examId, attemptId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const { data } = await api.get(`results/my-review/${attemptId}`);
        setData(data);
      } catch (error) {
        console.error("Failed to fetch review manifest.");
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [attemptId]);

  const downloadPDF = async () => {
    if (!data) return;
    try {
      const toastId = toast.loading("Synthesizing Report Manifest...");
      const { attempt, review } = data || { attempt: {}, review: [] };

      const doc = new jsPDF() as any;
      
      // Header with Dark Core Aesthetic
      doc.setFillColor(5, 5, 5);
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("PERFORMANCE MANIFEST", 15, 25);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("EXAMPRO NEXT-GEN ASSESSMENT SUITE • RECORD ID: " + String(attemptId || "UNKNOWN").toUpperCase(), 15, 35);

      // Student and Exam Details
      let user = { name: "Anonymous Student" };
      try {
        const stored = localStorage.getItem("user");
        if (stored && stored !== "[object Object]") user = JSON.parse(stored);
      } catch (e) {
        console.warn("PDF generation using fallback identity.");
      }
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Identity & Evaluation Metrics", 15, 60);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const metrics = [
        ["Candidate Name", user.name || "Anonymous Student"],
        ["Examination Title", attempt?.title || "Examination"],
        ["Final Precision Score", `${attempt?.score || 0}%`],
        ["Authority Status", Number(attempt?.score || 0) >= 40 ? "PASS (Certified)" : "FAIL (Insufficient)"],
        ["Temporal Signature", attempt?.end_time ? new Date(attempt.end_time).toLocaleString() : "Unknown"]
      ];

      autoTable(doc, {
        startY: 65,
        body: metrics,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
      });

      // Questions Detail Table
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Detailed Question Log", 15, (doc as any).lastAutoTable.finalY + 15);

      const tableRows = (review || []).map((r: any, idx: number) => {
        return [
          idx + 1,
          r.question_text || "Missing Question Data",
          r.student_response || "NOT ATTEMPTED",
          r.correct_answer || "N/A",
          r.is_correct ? `${r.marks || 0}/${r.marks || 0}` : `0/${r.marks || 0}`
        ];
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['#', 'Question Protocol', 'Student Response', 'Correct Answer', 'Marks']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 70 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 },
          4: { cellWidth: 20, halign: 'center' }
        },
        didParseCell: function(data: any) {
          if (data.section === 'body' && data.column.index === 4) {
            const marksStr = String(data.cell.raw);
            if (marksStr.startsWith('0/')) {
              data.cell.styles.textColor = [220, 38, 38]; // Red for 0 marks
            } else {
              data.cell.styles.textColor = [5, 150, 105]; // Green for full marks
            }
          }
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount} • ExamPro Official Performance Manifest`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      doc.save(`Result_${(attempt.title || "Exam").replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
      toast.success("Performance Manifest Generated", { id: toastId });
    } catch (error) {
      console.error("PDF_GENERATION_FAILURE:", error);
      toast.error("Failed to synthesize report manifest.");
    }
  };

  if (loading) return (
    <DashboardLayout role="student">
      <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    </DashboardLayout>
  );

  if (!data) return (
    <DashboardLayout role="student">
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold">Review Manifold Unavailable</h1>
        <button onClick={() => router.back()} className="mt-6 btn-secondary">Go Back</button>
      </div>
    </DashboardLayout>
  );

  const { attempt, review } = data || { attempt: {}, review: [] };
  const correctCount = (review || []).filter((r: any) => r.is_correct).length;

  return (
    <DashboardLayout role="student">
      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <button 
              onClick={() => router.push('/student/results')}
              className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[10px] tracking-widest hover:text-indigo-300 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to History
            </button>
            <h1 className="text-4xl font-black uppercase tracking-tight">Performance <span className="gradient-text">Manifest</span></h1>
            <p className="text-gray-400 font-medium">Detailed evaluation of your assessment manifestation.</p>
          </div>
          
          <div className="flex gap-4">
             <div className="glass-panel px-6 py-4 border-white/5 flex flex-col items-center min-w-[120px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Final Score</span>
                <span className={`text-2xl font-black ${(attempt?.score || 0) >= 40 ? 'text-emerald-400' : 'text-red-400'}`}>{attempt?.score || 0}%</span>
             </div>
              <div className="glass-panel px-6 py-4 border-white/5 flex flex-col items-center min-w-[120px]">
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Accuracy</span>
                 <span className="text-2xl font-black text-indigo-400">{correctCount}/{(review || []).length}</span>
              </div>
              <button 
                onClick={downloadPDF}
                className="btn-secondary px-6 py-4 flex flex-col items-center justify-center min-w-[120px] group border-indigo-500/20 hover:border-indigo-500/50"
              >
                 <Download className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-1" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Download PDF</span>
              </button>
           </div>
        </div>

        {/* Detailed Review Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
            <BarChart3 className="w-6 h-6 text-indigo-500" /> Response Evaluation
          </h2>
          
          <div className="space-y-6">
            {(review || []).map((item: any, idx: number) => {
              let options = [];
              try {
                options = typeof item.options === 'string' ? JSON.parse(item.options || "[]") : (item.options || []);
              } catch (e) {
                options = [];
              }
              return (
                <motion.div 
                  key={item.question_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`glass-panel p-8 border-l-4 transition-all ${
                    item.is_correct 
                      ? 'border-l-emerald-500 bg-emerald-500/[0.02] border-white/5' 
                      : item.student_response 
                        ? 'border-l-red-500 bg-red-500/[0.02] border-white/5'
                        : 'border-l-gray-700 bg-white/[0.01] border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-black text-gray-400 border border-white/10">
                        {idx + 1}
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{item.question_text}</h3>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                       <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                         item.is_correct ? 'text-emerald-400' : 'text-red-400'
                       }`}>
                         {item.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                         {item.is_correct ? 'Correct' : 'Incorrect'}
                       </span>
                       <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">Value: {item.marks} Point</span>
                    </div>
                  </div>

                  {/* Options Comparison */}
                  {item.type === 'MCQ' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {options.map((opt: string, oIdx: number) => {
                        const isStudent = item.student_response === opt;
                        const isCorrect = item.correct_answer === opt;
                        
                        let borderColor = "border-white/5";
                        let bgColor = "bg-white/5";
                        let textColor = "text-gray-400";

                        if (isCorrect) {
                          borderColor = "border-emerald-500/50";
                          bgColor = "bg-emerald-500/10";
                          textColor = "text-emerald-400";
                        } else if (isStudent) {
                          borderColor = "border-red-500/50";
                          bgColor = "bg-red-500/10";
                          textColor = "text-red-400";
                        }

                        return (
                          <div 
                            key={opt}
                            className={`p-4 rounded-xl border-2 ${borderColor} ${bgColor} ${textColor} text-sm font-bold flex items-center justify-between group`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-black border ${
                                isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/5'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              {opt}
                            </div>
                            {isCorrect && <CheckCircle2 className="w-4 h-4" />}
                            {isStudent && !isCorrect && <XCircle className="w-4 h-4" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Open Response Comparison */}
                  {item.type !== 'MCQ' && (
                    <div className="space-y-4 mb-6">
                       <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Your Outcome</span>
                          <p className={`font-bold ${item.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.student_response || <span className="italic opacity-50">No Response Manifested.</span>}
                          </p>
                       </div>
                       {!item.is_correct && (
                          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                             <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest block mb-2">Authoritative Key</span>
                             <p className="font-bold text-emerald-400">{item.correct_answer}</p>
                          </div>
                       )}
                    </div>
                  )}

                  {/* Authoritative Explanation */}
                  {item.explanation && (
                    <div className="mt-6 flex gap-4 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                       <div className="p-2 bg-indigo-500/10 rounded-lg h-fit">
                          <HelpCircle className="w-4 h-4 text-indigo-400" />
                       </div>
                       <div>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block mb-1">Knowledge Manifest</span>
                          <p className="text-gray-400 text-sm font-medium leading-relaxed">{item.explanation}</p>
                       </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Closing Action */}
        <div className="pt-10 border-t border-white/5 flex justify-center">
           <button 
             onClick={() => router.push('/student/dashboard')}
             className="btn-primary px-12 py-4 flex items-center gap-3"
           >
              Return to Command Center <ArrowLeft className="w-4 rotate-180" />
           </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
