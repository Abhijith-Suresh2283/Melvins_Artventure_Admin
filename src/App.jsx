// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminHomePage from "./pages/AdminHomePage";
import AdminClassesPage from "./pages/AdminClassesPage";
import AdminContactPage from "./pages/AdminContactPage";
import AdminTestimonialsPage from "./pages/AdminTestimonialPage";
import AdminArtworksPage from "./pages/AdminArtworksPage";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* default route goes to /admin */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* admin home */}
        <Route path="/admin" element={<AdminHomePage />} />

        {/* admin pages */}
        <Route path="/admin/classes" element={<AdminClassesPage />} />
        <Route path="/admin/contact" element={<AdminContactPage />} />
        <Route path="/admin/testimonials" element={<AdminTestimonialsPage />} />
        <Route path="/admin/artworks" element={<AdminArtworksPage />} />

        {/* 404 */}
        <Route path="*" element={<div className="p-6">404 - Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
