// src/components/dashboard/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Trash2, Download, Shield, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";

// CATATAN: pdfjs dihapus agar pengiriman file dilakukan secara binary (raw)
// untuk mencegah file corrupt saat didownload kembali.

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
  
  // Authentication states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot password flow states
  const [authStep, setAuthStep] = useState("login"); // "login", "forgot_email", "forgot_reset"
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchDivisions();
      fetchFaqs();
      fetchStats();
      fetchUnanswered();
    }
    document.title = "Dashboard - Pindad Virtual Assistant";
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchStats();
      fetchFaqs();
      fetchUnanswered();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Helper function to handle auth errors
  function handleAuthError(r) {
    if (r.status === 401) {
      setIsAuthenticated(false);
      setAdminToken("");
      alert("Sesi admin berakhir. Silakan login ulang.");
      return true;
    }
    return false;
  }

  // ---------------- AUTHENTICATION HANDLERS ----------------
  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (r.status === 401) {
        setLoginError("Email atau password salah.");
      } else if (r.ok) {
        const data = await r.json();
        setAdminToken(data.token);
        setIsAuthenticated(true);
        setPassword("");
      } else {
        setLoginError("Terjadi kesalahan pada server.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Gagal menghubungi server.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleForgotPasswordEmail(e) {
    if (e) e.preventDefault();
    if (!email.trim()) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const r = await fetch("/api/auth/forgot-password/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (r.status === 404) {
        setLoginError("Email tidak terdaftar.");
      } else if (r.ok) {
        const data = await r.json();
        setSecurityQuestion(data.security_question);
        setAuthStep("forgot_reset");
      } else {
        setLoginError("Gagal memuat pertanyaan keamanan.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Gagal menghubungi server.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleForgotPasswordReset(e) {
    if (e) e.preventDefault();
    if (!securityAnswer.trim() || !newPassword.trim()) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const r = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, security_answer: securityAnswer, new_password: newPassword })
      });
      if (r.status === 400) {
        setLoginError("Jawaban pertanyaan keamanan salah.");
      } else if (r.ok) {
        alert("Password berhasil direset! Silakan login.");
        setSecurityAnswer("");
        setNewPassword("");
        setAuthStep("login");
      } else {
        setLoginError("Gagal mereset password.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Gagal menghubungi server.");
    } finally {
      setLoginLoading(false);
    }
  }

  // ---------------- FETCH SECTION ----------------
  async function fetchDivisions() {
    try {
      const r = await fetch("/divisions", {
        headers: { "X-Admin-Token": adminToken }
      });
      if (handleAuthError(r)) return;
      const list = await r.json();
      setDivisions(list);
      if (list.length && !selectedDiv) setSelectedDiv(list[0].id);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchFaqs() {
    try {
      const r = await fetch("/faqs", {
        headers: { "X-Admin-Token": adminToken }
      });
      if (handleAuthError(r)) return;
      setFaqs(r.ok ? await r.json() : []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchStats() {
    try {
      const r = await fetch("/stats", {
        headers: { "X-Admin-Token": adminToken }
      });
      if (handleAuthError(r)) return;
      if (r.ok) setStats(await r.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchUnanswered() {
    try {
      const r = await fetch("/unanswered", {
        headers: { "X-Admin-Token": adminToken }
      });
      if (handleAuthError(r)) return;
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
      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch(`/upload/${selectedDiv}`, {
        method: "POST",
        headers: { "X-Admin-Token": adminToken },
        body: fd,
      });

      if (handleAuthError(r)) return;

      if (r.ok) {
        alert("Upload sukses! Dokumen baru aktif.");
        fetchFaqs();
        fetchStats();
      } else {
        const errorText = await r.text();
        if (r.status === 413) {
          alert("Upload gagal: Ukuran file terlalu besar.");
        } else if (errorText.toLowerCase().includes("<html")) {
          const match = errorText.match(/<title>(.*?)<\/title>/i);
          const errorMsg = match ? match[1] : `Server Error ${r.status}`;
          alert(`Upload gagal: ${errorMsg}`);
        } else {
          try {
            const errorJson = JSON.parse(errorText);
            alert(`Upload gagal: ${errorJson.detail || errorJson.error || "Terjadi kesalahan"}`);
          } catch (e) {
            alert(`Upload gagal: ${errorText}`);
          }
        }
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
    if (newDivisionName.length > 100) return alert("Nama divisi maksimal 100 karakter");

    try {
      const r = await fetch("/division", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken 
        },
        body: JSON.stringify({ name: newDivisionName }),
      });

      if (handleAuthError(r)) return;

      if (r.ok) {
        setNewDivisionName("");
        fetchDivisions();
        alert("Divisi ditambahkan");
      } else {
        const errorText = await r.text();
        try {
          const errorJson = JSON.parse(errorText);
          alert(`Gagal menambahkan divisi: ${errorJson.detail || "Terjadi kesalahan"}`);
        } catch (err) {
          if (errorText.toLowerCase().includes("<html")) {
            const match = errorText.match(/<title>(.*?)<\/title>/i);
            const errorMsg = match ? match[1] : `Server Error ${r.status}`;
            alert(`Gagal menambahkan divisi: ${errorMsg}`);
          } else {
            alert(`Gagal menambahkan divisi: ${errorText}`);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghubungi server");
    }
  }

  async function updateDescription(id, newDesc) {
    if (newDesc.length > 500) return alert("Deskripsi divisi maksimal 500 karakter");
    try {
      const r = await fetch(`/division/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken 
        },
        body: JSON.stringify({ description: newDesc }),
      });
      if (handleAuthError(r)) return;
      if (r.ok) fetchDivisions();
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteDivision(id) {
    if (!confirm("Hapus divisi ini? Data FAQ terkait akan hilang.")) return;
    try {
      const r = await fetch(`/division/${id}`, { 
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken }
      });
      if (handleAuthError(r)) return;
      if (r.ok) {
        alert("Divisi dihapus");
        fetchDivisions();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // ---------------- DOWNLOAD FUNCTION ----------------
  async function downloadPdf(filename) {
    if (!filename) return;

    const safeFilename = filename.split("/").pop();

    try {
      const response = await fetch(`/admin/download/pdf/${safeFilename}`, {
        method: "GET",
        headers: {
          "X-Admin-Token": adminToken,
        },
      });

      if (handleAuthError(response)) return false;

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
        return true;
      } else {
        console.error("Download failed");
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // ========================================================
  // MODIFIKASI: HANDLE UPLOAD (DENGAN ALERT + AUTO BACKUP)
  // ========================================================
  const handleUploadClick = async () => {
    if (!file || !selectedDiv) {
      alert("Mohon pilih file dan divisi terlebih dahulu.");
      return;
    }

    // 1. TAMPILKAN ALERT KONFIRMASI (Sesuai Permintaan)
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin mengupload dokumen baru? Dokumen lama pada divisi ini akan terhapus (Sebaiknya medownload dulu Dokumen FAQ sebelumya).",
    );

    // Jika user klik Cancel, batalkan proses
    if (!isConfirmed) return;

    // 2. Jika OK, Lakukan Pengecekan Dokumen Lama
    const existingDoc = faqs.find(
      (f) => f.division_id === selectedDiv && f.question.startsWith("File: "),
    );

    if (existingDoc) {
      // 3. Jika ada dokumen lama -> Download dulu
      const filename =
        existingDoc.filename || existingDoc.question.replace("File: ", "");
      console.log(`Mengunduh backup dokumen lama: ${filename}`);

      await downloadPdf(filename);

      // Beri jeda 1 detik agar download sempat berjalan
      setTimeout(() => {
        uploadFile();
      }, 1000);
    } else {
      // 4. Jika tidak ada dokumen lama -> Langsung Upload
      uploadFile();
    }
  };

  // ---------------- UI ----------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E0F2FE] via-white to-[#FEF9C3] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8 w-full max-w-md border border-blue-100"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {authStep === "login" && "Login dengan akun admin Anda"}
              {authStep === "forgot_email" && "Masukkan email untuk mereset password"}
              {authStep === "forgot_reset" && "Jawab pertanyaan keamanan Anda"}
            </p>
          </div>

          {authStep === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pindad.com"
                  autoFocus
                  required
                  className="w-full p-3 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full p-3 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 bg-white text-sm"
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-xs text-center font-medium">{loginError}</p>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-md bg-blue-900 hover:bg-blue-800 text-white transition-colors"
                disabled={loginLoading || !email.trim() || !password.trim()}
              >
                {loginLoading ? "Memverifikasi..." : "Masuk"}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthStep("forgot_email"); setLoginError(""); }}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Lupa Password?
                </button>
              </div>
            </form>
          )}

          {authStep === "forgot_email" && (
            <form onSubmit={handleForgotPasswordEmail} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Email Anda</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pindad.com"
                  autoFocus
                  required
                  className="w-full p-3 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 bg-white text-sm"
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-xs text-center font-medium">{loginError}</p>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-md bg-blue-900 hover:bg-blue-800 text-white transition-colors"
                disabled={loginLoading || !email.trim()}
              >
                {loginLoading ? "Memuat..." : "Minta Pertanyaan Keamanan"}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthStep("login"); setLoginError(""); }}
                  className="text-xs text-gray-600 hover:underline font-medium"
                >
                  Kembali ke Login
                </button>
              </div>
            </form>
          )}

          {authStep === "forgot_reset" && (
            <form onSubmit={handleForgotPasswordReset} className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-900 mb-2">
                <span className="font-semibold block mb-0.5 text-xs text-blue-700 uppercase tracking-wide">Pertanyaan Keamanan:</span>
                {securityQuestion}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Jawaban Anda</label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Ketik jawaban..."
                  autoFocus
                  required
                  className="w-full p-3 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 bg-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ketik password baru..."
                  required
                  className="w-full p-3 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 bg-white text-sm"
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-xs text-center font-medium">{loginError}</p>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-md bg-blue-900 hover:bg-blue-800 text-white transition-colors"
                disabled={loginLoading || !securityAnswer.trim() || !newPassword.trim()}
              >
                {loginLoading ? "Mereset..." : "Reset Password"}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthStep("login"); setLoginError(""); }}
                  className="text-xs text-gray-600 hover:underline font-medium"
                >
                  Batal dan Kembali
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 min-h-screen font-sans flex flex-col bg-linear-to-br from-[#E0F2FE] via-white to-[#FEF9C3]">
      <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-4 rounded-xl border border-blue-100/50">
        <h1 className="text-2xl font-bold text-blue-900">
          Admin Dashboard — FAQ & Upload
        </h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => { setIsAuthenticated(false); setAdminToken(""); }}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ==== LEFT: DIVISION LIST ==== */}
        <div className="lg:col-span-4 h-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
          >
            <Card className="shadow-sm h-full flex flex-col">
              <CardHeader className="pb-0 shrink-0">
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
                  <Button size="sm" onClick={addDivision}>
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
                          <div className="font-semibold text-base">
                            {d.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {d.id}
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const newDesc = prompt(
                                "Update Deskripsi Divisi:",
                                d.description || "",
                              );
                              if (newDesc !== null && newDesc.trim() !== "") {
                                updateDescription(d.id, newDesc.trim());
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
                        {d.description?.trim() || "- No description -"}
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
          <Card className="p-3 shadow-sm flex-1 min-h-[300pxp-3 shadow-lg flex-1 min-h-[300px] bg-white/90 backdrop-blur-sm border-blue-100]">
            <CardTitle className="text-base mb-2">
              Analytics — Hits/Month
            </CardTitle>
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
                      // Warna Chart disesuaikan dengan tema
                      borderColor: "#1e3a8a", // Blue-900
                      backgroundColor: "#c89721", // Gold accent point
                      borderWidth: 2,
                      pointRadius: 4,
                      pointBackgroundColor: "#c89721",
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
                  className="p-3 bg-red-50 rounded border border-red-100 text-sm hover:bg-red-100 transition-colors"
                >
                  <div className="font-medium text-red-900">{x.question}</div>
                  <div className="flex justify-between text-xs text-red-500 mt-2 border-t border-red-200 pt-1">
                    <span>Div: {x.division_id ?? "Umum"}</span>
                    <span>{x.created_at}</span>
                  </div>
                </div>
              ))}
              {unanswered.length === 0 && (
                <p className="h-full flex flex-col items-center justify-center text-gray-400 text-xs py-4">
                  Aman, semua terjawab.
                </p>
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
            <Card className="shadow-lg bg-blue-900 text-white border-none">
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
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">
                    Target Division
                  </label>
                  <select
                    value={selectedDiv || ""}
                    onChange={(e) => setSelectedDiv(e.target.value)}
                    className="w-full p-2 mt-1 border rounded text-sm bg-white focus:ring-2 focus:ring-[#000080] outline-none"
                  >
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">
                    File (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={onFileChange}
                    className="text-xs w-full p-2 bg-gray-50 border rounded cursor-pointer"
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!file || loading}
                  onClick={handleUploadClick}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {loading ? "Uploading..." : "Upload"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* PREVIEW MINI LIST */}
          <div className="bg-white rounded-xl shadow-sm border p-3 flex-1 flex flex-col min-h-[200px]">
            <h2 className="text-sm font-semibold text-gray-600 shrink-0 mb-2">
              Recent FAQ
            </h2>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[30vh]">
              {faqs.slice(0, 50).map((f) => (
                <div
                  key={f.id}
                  className="text-xs border-b pb-1 flex justify-between items-start"
                >
                  <div className="overflow-hidden mr-2">
                    <div
                      className="text-xs font-bold text-gray-600 uppercase tracking-wide"
                      title={f.question}
                    >
                      {f.question}
                    </div>
                    <div className="text-gray-400">{f.division_id}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-gray-600 hover:text-blue-600 hover:bg-blue-100"
                    title="Download Source PDF"
                    onClick={() => {
                      const name =
                        f.filename ||
                        (f.question.startsWith("File: ")
                          ? f.question.substring(6)
                          : `${f.question}.pdf`);
                      downloadPdf(name);
                    }}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {faqs.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  Belum ada data.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
