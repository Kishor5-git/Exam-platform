"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  AlertCircle
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import api from "@/services/api";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";
import { Download } from "lucide-react";

export default function DetailedResultPage() {
  const { attemptId } = useParams();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get(`results/my-results`);
        // Find this specific attempt result
        const specificResult = data.find((r: any) => r.id === attemptId);
        if (specificResult) {
          setResult(specificResult);
          if (specificResult.score >= 40) {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#8b5cf6', '#d946ef', '#0ea5e9']
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch detailed result manifest.");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  const downloadPDF = async () => {
    if (!result) return;
    const toastId = toast.loading("Synthesizing Report Manifest...");
    try {
      const { data } = await api.get(`results/my-review/${attemptId}`);
      const { attempt, review } = data;

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
      doc.text("EXAMPRO NEXT-GEN ASSESSMENT SUITE • RECORD ID: " + (attemptId as string).toUpperCase(), 15, 35);

      // Student and Exam Details
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Identity & Evaluation Metrics", 15, 60);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const metrics = [
        ["Candidate Name", user.name || "Anonymous Student"],
        ["Examination Title", result.exam_title || "Examination"],
        ["Final Precision Score", `${result.score}%`],
        ["Authority Status", Number(result.score) >= 40 ? "PASS (Certified)" : "FAIL (Insufficient)"],
        ["Temporal Signature", new Date(result.end_time || Date.now()).toLocaleString()]
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

      const tableRows = review.map((r: any, idx: number) => {
        return [
          idx + 1,
          r.question_text,
          r.student_response || "NOT ATTEMPTED",
          r.correct_answer,
          r.is_correct ? `${r.marks}/${r.marks}` : `0/${r.marks}`
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
            const marksStr = data.cell.raw;
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

      doc.save(`Result_${(result.exam_title || "Exam").replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
      toast.success("Performance Manifest Generated", { id: toastId });
    } catch (error) {
      console.error("PDF_GENERATION_FAILURE:", error);
      toast.error("Failed to synthesize report manifest.", { id: toastId });
    }
  };

  if (loading) return (
    <DashboardLayout role="student">
       <div className="flex flex-center items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
       </div>
    </DashboardLayout>
  );

  if (!result) return (
    <DashboardLayout role="student">
       <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Mission Manifest Not Found</h2>
          <button onClick={() => router.push('/student/results')} className="mt-6 btn-secondary px-8 py-3">Back to Registry</button>
       </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-10 border-white/5 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
          <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-6" />
          <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase italic">Success Manifested</h1>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px]">Assessment Sector: {result.exam_title}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
            <div className="space-y-2">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregate Score</p>
               <p className="text-6xl font-black gradient-text">{result.score}%</p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authoritative Grade</p>
               <p className={`text-6xl font-black ${result.score >= 40 ? 'text-emerald-400' : 'text-red-400'}`}>{result.grade}</p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks Obtained</p>
               <p className="text-6xl font-black text-white">{result.marks_obtained}</p>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
             <button 
               onClick={downloadPDF}
               className="btn-secondary px-8 py-4 flex items-center gap-3 group border-indigo-500/30 hover:border-indigo-500/60"
             >
                <Download className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">Download Detailed Performance Manifest</span>
             </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="glass-panel p-8 border-white/5 space-y-6">
              <h3 className="font-black uppercase tracking-tight flex items-center gap-3">
                 < Award className="w-5 h-5 text-indigo-400" /> Mastery Breakdown
              </h3>
              <div className="space-y-4">
                 {[
                   { label: "Temporal Efficiency", val: "High", color: "text-emerald-400" },
                   { label: "Probe Accuracy", val: `${result.score}%`, color: "text-indigo-400" },
                   { label: "Status", val: "Finalized", color: "text-gray-400" }
                 ].map((stat, i) => (
                   <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                      <span className={`text-sm font-black ${stat.color}`}>{stat.val}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="glass-panel p-8 border-white/5 flex flex-col justify-center text-center space-y-6">
              <div className="p-6 bg-indigo-500/10 rounded-3xl mx-auto">
                 <TrendingUp className="w-12 h-12 text-indigo-400" />
              </div>
              <div>
                 <h3 className="font-black uppercase tracking-tight mb-2">Next Mission Directive</h3>
                 <p className="text-gray-500 text-sm italic">"The frontier of excellence is infinite. Continue your pursuit of mastery in the next specialized sector."</p>
              </div>
              <button 
                onClick={() => router.push('/student/exams')}
                className="btn-primary py-4 px-8 uppercase font-black tracking-widest text-xs flex items-center justify-center gap-2 group"
              >
                Return to Frontiers <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
