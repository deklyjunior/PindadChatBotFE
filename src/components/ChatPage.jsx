// src/pages/ChatPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

// pertanyaan populer per divisi (mengikuti nama yang kamu tentukan)
const POPULAR_QUESTIONS = {
  HCM: [
    "Bagaimana cara melamar kerja di PT Pindad?",
    "Apa saja fasilitas bagi karyawan Pindad?",
    "Bagaimana kebijakan jam kerja di Pindad?",
  ],
  MRO: [
    "Apa layanan Maintenance Repair & Overhaul yang disediakan Pindad?",
    "Bagaimana prosedur permintaan layanan perawatan MRO?",
    "Bagaimana cara klaim garansi layanan MRO?",
  ],
  TJSL: [
    "Apa saja program Tanggung Jawab Sosial & Lingkungan Pindad?",
    "Bagaimana cara mengajukan kerja sama program TJSL?",
  ],
  SCM: [
    "Bagaimana alur rantai pasok / supply chain Pindad?",
    "Siapa yang dapat dihubungi terkait pengadaan dan rantai pasok?",
  ],
  K3LH: [
    "Apa komitmen perusahaan terhadap K3LH dan mutu?",
    "Bagaimana prosedur pelaporan kecelakaan kerja?",
    "Bagaimana sistem penjaminan mutu di PT Pindad?",
  ],
};

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  // id divisi = juga nama collection di backend
  const divisionId = params.get("dept") || "HCM";
  
  const [divisionInfo, setDivisionInfo] = useState(null);
  const sessionIdRef = useRef(uuidv4());

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [popular, setPopular] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch division info (description) from backend
  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch(`${API_BASE_URL}/divisions`);
        if (res.ok) {
          const list = await res.json();
          const found = list.find(d => d.id === divisionId);
          if (found) setDivisionInfo(found);
        }
      } catch (e) {
        console.error("Failed to fetch division info", e);
      }
    }
    fetchInfo();
  }, [divisionId]);

  const displayDiv = divisionInfo?.name || divisionId;
  const displayDesc = divisionInfo?.description || "Layanan Umum PT Pindad";

  // set popular question lokal sesuai ID divisi
  useEffect(() => {
    setPopular(
      POPULAR_QUESTIONS[divisionId] ?? [
        "Apa itu PT Pindad?",
        "Apa saja produk unggulan Pindad?",
      ]
    );
  }, [divisionId]);

  // auto scroll ke bawah
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendAsk(text) {
    const content = (text ?? input).trim();
    if (!content) return;

    // tampilkan pertanyaan user
    setMessages((m) => [...m, { id: Date.now(), role: "user", content }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          division: divisionId, // dikirim ke backend (MRO, TJSL, HCM, SCM, K3LH)
          message: content,
        }),
      });

      const j = await res.json();

      const botReply =
        j.answer && String(j.answer).trim() !== ""
          ? j.answer
          : "Maaf, saya tidak menemukan jawaban yang relevan dari dokumen terkait.";

      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: "bot", content: botReply },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 2,
          role: "bot",
          content: "⚠️ Gagal menghubungi server. Coba lagi sebentar lagi.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-linear-to-br from-blue-50 to-blue-200">
      {/* HEADER */}
      <div className="shrink-0 p-4 bg-white/70 backdrop-blur border-b flex items-center gap-4 shadow-sm z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/", { state: { fromChat: true } })}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <img src="/Image/logo.svg" alt="logo" className="w-12 h-12" />
        <div>
          <div className="text-2xl font-bold text-blue-900">
            Layanan Divisi {displayDiv}
          </div>
          <div className="text-lg text-gray-700 font-medium">
            Anda berada di layanan {displayDiv}. Silakan ajukan pertanyaan Anda terkait {displayDesc}
          </div>
        </div>
      </div>

      {/* POPULAR QUESTION (KALAU CHAT MASIH KOSONG) */}
      {messages.length === 0 && popular.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 text-center bg-white/70 backdrop-blur shadow"
        >
          <div className="text-sm text-gray-600">Pertanyaan Populer:</div>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {popular.map((q, i) => (
              <Button
                key={i}
                variant="secondary"
                size="sm"
                onClick={() => sendAsk(q)}
              >
                {q}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* AREA CHAT */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-xl max-w-lg shadow text-lg ${
                m.role === "user" ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              {m.content}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start p-4"  // <-- Moved logic mostly here
          >
             <div className="bg-white p-3 rounded-xl shadow-sm rounded-tl-none">
              <img 
                src="/Image/Logo putar.svg" 
                alt="Loading..." 
                className="w-8 h-8 animate-spin" 
              />
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-4 bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            placeholder="Ketik pertanyaan..."
            value={input}
            className="text-lg"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendAsk()}
          />
          <Button onClick={() => sendAsk()}>
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
}
