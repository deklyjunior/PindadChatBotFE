// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import GreetingPage from "./components/GreetingPage.jsx";
import ChatPage from "./components/ChatPage.jsx";
import PageTransition from "./components/PageTransition.jsx";
import DashboardPage from "./components/dashboard/DashboardPage.jsx";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname + location.search}>
        <Route
          path="/"
          element={
            <PageTransition>
              <GreetingPage />
            </PageTransition>
          }
        />
        <Route
          path="/chat"
          element={
            <PageTransition>
              <ChatPage />
            </PageTransition>
          }
        />
        <Route
          path={import.meta.env.VITE_DASHBOARD_URL || "/fallback-admin"}
          element={
            <PageTransition>
              <DashboardPage />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router basename="/">
      <AnimatedRoutes />
    </Router>
  );
}
