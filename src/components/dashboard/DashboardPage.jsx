// src/components/dashboard/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Trash2, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs"; // Ensure worker is bundled

// Set worker globally for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

export default function DashboardPage() {
  const [divisions, setDivisions] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedDiv, setSelectedDiv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ monthly: [] });
  const [unanswered, setUnanswered] = useState([]);
  const [newDivisionName, setNewDivisionName] = useState("");
  const [adminSecret, setAdminSecret] = useState("rahasia_admin");

  useEffect(() => {
    // Initial fetch
    fetchDivisions();
    fetchFaqs();
    fetchStats();
    fetchUnanswered();

    // Polling / Real-time update every 5 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchFaqs();
      fetchUnanswered();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ---------------- FETCH SECTION ----------------
  async function fetchDivisions() {
    try {
      const r = await fetch("/divisions");
      const list = await r.json();
      setDivisions(list);
      if (list.length) setSelectedDiv(list[0].id);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchFaqs() {
    try {
      const r = await fetch("/faqs");
      setFaqs(r.ok ? await r.json() : []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchStats() {
    try {
      const r = await fetch("/stats");
      if (r.ok) setStats(await r.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchUnanswered() {
    try {
      const r = await fetch("/unanswered");
      setUnanswered(r.ok ? await r.json() : []);
    } catch (e) {
      console.error(e);
    }
  }

  // ---------------- ACTIONS ----------------
  function onFileChange(e) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function uploadFile() {
    if (!file || !selectedDiv) return alert("Pilih file dan divisi!");
    setLoading(true);

    try {
      let fileToSend = file;

      // Handle PDF Parsing Client-Side
      if (file.type === "application/pdf") {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ");
            fullText += `\n--- Page ${i} ---\n${pageText}`;
          }

          // Create a new file object with the extracted text, but KEEP the .pdf extension
          // This "tricks" the backend which checks for .pdf extension but reads as text
          const blob = new Blob([fullText], { type: "text/plain" });
          fileToSend = new File([blob], file.name, { type: "text/plain" });
          

        } catch (parseErr) {
          console.error("PDF Parsing failed:", parseErr);
          alert("Gagal membaca file PDF. Pastikan file tidak rusak.");
          setLoading(false);
          return;
        }
      }

      const fd = new FormData();
      fd.append("file", fileToSend);

      const r = await fetch(`/upload/${selectedDiv}`, {
        method: "POST",
        body: fd,
      });

      if (r.ok) {
        alert("Upload sukses!");
        fetchFaqs();
        fetchStats();
      } else {
        const errorText = await r.text();
        alert(`Upload gagal: ${errorText}`);
      }
    } catch (e) {
      console.error(e);
      alert("Upload error (Network/Server)");
    } finally {
      setLoading(false);
      setFile(null);
    }
  }

  async function addDivision() {
    if (!newDivisionName.trim()) return alert("Nama divisi kosong");
    try {
      const r = await fetch("/division", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDivisionName }),
      });

      if (r.ok) {
        setNewDivisionName("");
        fetchDivisions();
        alert("Divisi ditambahkan");
      } else {
        const errorText = await r.text();
        console.error("Failed to add division:", errorText);
        alert(`Gagal menambahkan divisi: ${errorText}`);
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menambahkan divisi (Network Error)");
    }
  }

  async function updateDescription(id, newDesc) {
    const r = await fetch(`/division/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newDesc }),
    });
    if (r.ok) {
      fetchDivisions();
    } else {
      alert("Gagal update deskripsi");
    }
  }

  async function deleteDivision(id) {
    if (!confirm("Hapus divisi ini? Data FAQ terkait akan hilang.")) return;
    const r = await fetch(`/division/${id}`, {
      method: "DELETE",
    });

    if (r.ok) {
      alert("Divisi dihapus");
      fetchDivisions();
    } else {
      alert("Gagal menghapus divisi");
    }
  }

  // ---------------- ACTIONS ----------------
  async function downloadPdf(filename) {
    if (!filename) return alert("Filename tidak valid");
    
    // Fallback if backend doesn't provide full path or needs sanitization
    // The requirement says: GET /admin/download/pdf/{filename}
    const safeFilename = filename.split('/').pop(); 

    try {
      const response = await fetch(`/admin/download/pdf/${safeFilename}`, {
        method: "GET",
        headers: {
          "X-Admin-Secret": adminSecret,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const err = await response.text();
        alert(`Download gagal (${response.status}): ${err}`);
      }
    } catch (e) {
      console.error(e);
      alert("Download error (Network/Server)");
    }
  }

  // ---------------- UI ----------------
  return (
    <div className="p-4 space-y-4 bg-linear-to-br from-gray-50 to-blue-100 min-h-screen font-sans flex flex-col">
      <h1 className="text-2xl font-bold text-blue-900">
        Admin Dashboard — FAQ & Upload
      </h1>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ==== LEFT: DIVISION LIST ==== */}
        <div className="lg:col-span-4 h-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
          >
            <Card className="shadow-sm h-full flex flex-col">
              <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-lg">Divisions</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="flex gap-2 mb-3 shrink-0">
                  <input
                    value={newDivisionName}
                    onChange={(e) => setNewDivisionName(e.target.value)}
                    type="text"
                    placeholder="New division"
                    className="border p-2 rounded w-full text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={addDivision}
                  >
                    Add
                  </Button>
                </div>

                <ul className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[70vh]">
                  {divisions.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-col gap-1 p-2 border rounded-lg bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-base">{d.name}</div>
                          <div className="text-xs text-gray-500">ID: {d.id}</div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newDesc = prompt(
                                "Update Deskripsi Divisi:",
                                d.description || ""
                              );
                              if (newDesc !== null) {
                                updateDescription(d.id, newDesc);
                              }
                            }}
                          >
                            <span className="text-xs">Edit</span>
                          </Button>
     
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => deleteDivision(d.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-700 bg-gray-50 p-1.5 rounded border">
                        {d.description || "- No description -"}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ==== MIDDLE: ANALYTICS & TABLES ==== */}
        <div className="lg:col-span-5 space-y-4 flex flex-col h-full">
          {/* CHART */}
          <Card className="p-3 shadow-sm flex-1 min-h-[300px]">
            <CardTitle className="text-base mb-2">Analytics — Hits/Month</CardTitle>
            <div className="h-full min-h-[250px] max-h-[400px]">
              <Line
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }, 
                }}
                data={{
                  labels: stats.monthly.map((x) => x.month),
                  datasets: [
                    {
                      label: "Hits",
                      data: stats.monthly.map((x) => x.count),
                      borderColor: "rgb(37,99,235)",
                      borderWidth: 2,
                      pointRadius: 3,
                    },
                  ],
                }}
              />
            </div>
          </Card>

           {/* UNANSWERED */}
          <div className="bg-white rounded-xl shadow-sm border p-3 flex-1 flex flex-col min-h-[200px]">
             <h2 className="text-base font-semibold mb-2 shrink-0">
               Pertanyaan Tak Terjawab
             </h2>
             <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[30vh]">
                {unanswered.map((x) => (
                  <div
                    key={x.id}
                    className="p-2 bg-red-50 rounded border border-red-100 text-sm"
                  >
                    <div className="font-medium text-red-900">{x.question}</div>
                    <div className="flex justify-between text-xs text-red-500 mt-1">
                      <span>Div: {x.division_id ?? "Umum"}</span>
                      <span>{x.created_at}</span>
                    </div>
                  </div>
                ))}
                {unanswered.length === 0 && (
                  <p className="text-gray-400 text-xs text-center py-4">Aman, semua terjawab.</p>
                )}
             </div>
          </div>
        </div>

        {/* ==== RIGHT: ACTIONS & COUNTS ==== */}
        <div className="lg:col-span-3 space-y-4 h-full flex flex-col">
           {/* FAQ COUNT */}
           <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="shadow-sm bg-blue-600 text-white">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">{faqs.length}</div>
                <div className="text-sm opacity-90">Total Documents</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* UPLOAD AREA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Upload FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <label className="text-xs font-medium text-gray-500">Target Division</label>
                  <select
                    value={selectedDiv || ""}
                    onChange={(e) => setSelectedDiv(e.target.value)}
                    className="w-full p-2 border rounded text-sm bg-white"
                  >
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">File (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={onFileChange}
                    className="text-xs w-full"
                  />
                </div>

                <Button 
                   className="w-full" 
                   disabled={!file || loading} 
                   onClick={uploadFile}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {loading ? "Uploading..." : "Upload"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* PREVIEW MINI LIST */}
          <div className="bg-white rounded-xl shadow-sm border p-3 flex-1 flex flex-col min-h-[200px]">
              <h2 className="text-sm font-semibold text-gray-600 shrink-0">
                Recent FAQ
              </h2>
              <div className="flex items-center gap-2 mb-2">
                 <input 
                   type="password" 
                   value={adminSecret}
                   onChange={e => setAdminSecret(e.target.value)}
                   className="text-xs border rounded px-2 py-1 flex-1"
                   placeholder="Admin Secret"
                 />
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[30vh]">
                {faqs.slice(0, 50).map((f) => ( 
                   <div key={f.id} className="text-xs border-b pb-1 flex justify-between items-start">
                     <div className="overflow-hidden mr-2">
                       <div className="font-medium truncate" title={f.question}>{f.question}</div>
                       <div className="text-gray-400">{f.division_id}</div>
                     </div>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 shrink-0"
                        title="Download Source PDF"
                        onClick={() => {
                          const name = f.filename || (f.question.startsWith("File: ") ? f.question.substring(6) : `${f.question}.pdf`);
                          downloadPdf(name);
                        }}
                     >
                        <Download className="w-3 h-3" />
                     </Button>
                   </div>
                ))}
               {faqs.length === 0 && <p className="text-xs text-gray-400">Belum ada data.</p>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
