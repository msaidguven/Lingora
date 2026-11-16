import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import { supabase } from "./config.js";  // ../ yerine ./
import '@tabler/icons-webfont/dist/tabler-icons.min.css';
import './index.css' 

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      {/* E-postadaki şifre sıfırlama bağlantısı; App bu adresi görünce ResetPassword gösterir. */}
      <Route path="/sifre-yenile" element={<App />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  </BrowserRouter>
);