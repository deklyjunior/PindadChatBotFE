// src/pages/GreetingPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  ShoppingBag,
  ShieldCheck,
  PackageSearch,
  HeartHandshake,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

function GreetingPage() {
  const location = useLocation();
  const fromChat = location.state?.fromChat || false;
  const [showIntro, setShowIntro] = useState(!fromChat);
  const [departments, setDepartments] = useState([]);

  // Intro screen
  useEffect(() => {
    if (!fromChat) {
      const timer = setTimeout(() => setShowIntro(false), 5000); // Extended duration to 5s
      return () => clearTimeout(timer);
    }
    if (fromChat) {
      // bersihkan state history ketika kembali dari chat
      window.history.replaceState({}, document.title);
    }
  }, [fromChat]);

  // map icon per ID divisi
  const getIconForDivision = (id) => {
    switch (id) {
      case "HCM":
        return <UserCheck />;
      case "MRO":
        return <PackageSearch />;
      case "TJSL":
        return <HeartHandshake />;
      case "SCM":
        return <ShoppingBag />;
      case "K3LH":
        return <ShieldCheck />;
      default:
        return <UserCheck />;
    }
  };

  // Ambil divisi dari backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/divisions`)
      .then((r) => r.json())
      .then((list) => {

        // Kita tidak perlu NAME_MAP lagi karena backend sudah menyimpan nama lengkap
        // saat admin membuat divisi baru di Dashboard.

        const icons = [
          <UserCheck key="ic1" />,
          <ShoppingBag key="ic2" />,
          <ShieldCheck key="ic3" />,
          <PackageSearch key="ic4" />,
          <HeartHandshake key="ic5" />,
        ];

        setDepartments(
          list.map((d, idx) => ({
            id: d.id,
            // LOGIKA BARU: Gunakan nama dari Backend.
            // Jika nama dari backend sama dengan ID (kasus lama), coba format sedikit.
            name: d.name || d.id.replace(/_/g, " "),
            icon: icons[idx % icons.length],
            path: `/chat?dept=${encodeURIComponent(d.id)}`,
          })),
        );
      })
      .catch((err) => {
        console.error("Gagal load divisi, menggunakan fallback lokal", err);
        // ... kode fallback error tetap sama ...
      });
  }, []);

  // Determine animation delays based on whether we are coming from chat
  const baseDelay = fromChat ? 0 : 2.5;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-[#E0F2FE] via-white to-[#FEF9C3] p-6 text-center overflow-hidden relative">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-blue-300 via-blue-200 to-yellow-200 text-blue-900 z-50"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-2xl md:text-3xl font-semibold text-center max-w-xl leading-relaxed px-4"
            >
              Halo! Saya <b>CAKRA</b>, asisten virtual PT. PINDAD.
              <br />
              Anda dapat menanyakan apapun tentang perusahaan atau layanan kami.
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        src="/Chatbot/Image/logopinda.png"
        className="w-40 h-40 mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: baseDelay, duration: 0.6 }}
      />

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: baseDelay + 0.3, duration: 0.6 }}
        className="text-3xl md:text-4xl font-bold text-blue-900 mb-3"
      >
        PINDAD Virtual Assistant
      </motion.h1>

      <motion.div
        className="flex flex-wrap justify-center gap-4 max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: baseDelay + 0.7, duration: 0.8 }}
      >
        {departments.map((d) => (
          <Button
            asChild
            key={d.id}
            variant="outline"
            size="lg"
            className="w-full sm:w-80 h-auto min-h-[5rem] text-base font-semibold shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-200 p-4"
          >
            <Link to={d.path} state={{ deptName: d.name }}>
              <div className="flex items-center justify-center gap-3 whitespace-normal text-center leading-tight w-full">
                <span className="shrink-0">{d.icon}</span>
                <span>{d.name}</span>
              </div>
            </Link>
          </Button>
        ))}
      </motion.div>
    </div>
  );
}

export default GreetingPage;
