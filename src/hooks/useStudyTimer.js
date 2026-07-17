// src/hooks/useStudyTimer.js
import { useEffect, useRef } from "react";
import { supabase } from "../config.js";

const FLUSH_INTERVAL_MS = 20000; // 20 saniyede bir sunucuya gönder

// Bir ekran açıkken geçen süreyi saniye saniye sayar ve periyodik olarak
// `increment_daily_study_time` RPC'sine gönderir. Sadece kelime/cümle quiz
// ekranlarına ekle — genel gezinmede (anasayfa, ders listesi vb.) ekleme,
// çünkü "günlük çalışma süresi" sadece gerçek çalışmayı yansıtmalı.
//
// Kullanım:
//   function WordQuizScreen() {
//     useStudyTimer(); // ekran mount olduğu sürece otomatik sayar
//     ...
//   }
//
// Ekranı koşullu aktif etmek istersen (örn. quiz duraklatıldığında saymasın):
//   useStudyTimer(isQuizActive);
export function useStudyTimer(active = true) {
    const accumulatedRef = useRef(0);
    const lastTickRef = useRef(null);

    const flush = async () => {
        const seconds = Math.floor(accumulatedRef.current);
        if (seconds <= 0) return;
        accumulatedRef.current -= seconds;

        try {
            const { error } = await supabase.rpc("increment_daily_study_time", {
                p_seconds: seconds,
            });
            if (error) throw error;
        } catch (err) {
            console.error("Çalışma süresi kaydedilemedi:", err);
            // Gönderim başarısız oldu, kaybolmasın — bir sonraki flush'ta tekrar dener
            accumulatedRef.current += seconds;
        }
    };

    useEffect(() => {
        if (!active) return;

        lastTickRef.current = Date.now();

        const tick = () => {
            if (document.hidden) return; // sekme arka plandaysa sayma
            const now = Date.now();
            const delta = (now - lastTickRef.current) / 1000;
            lastTickRef.current = now;
            accumulatedRef.current += delta;
        };

        const tickInterval = setInterval(tick, 1000);
        const flushInterval = setInterval(flush, FLUSH_INTERVAL_MS);

        const handleVisibilityChange = () => {
            // sekme geri geldiğinde sayaç sıfırdan devam etsin, arada geçen
            // süre (kullanıcı gerçekten uzaktayken) sayılmasın
            lastTickRef.current = Date.now();
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(tickInterval);
            clearInterval(flushInterval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            flush(); // ekrandan çıkarken kalan süreyi de gönder
        };
    }, [active]);
}