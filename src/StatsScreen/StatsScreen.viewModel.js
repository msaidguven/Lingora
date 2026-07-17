// src/StatsScreen.viewModel.js
import { useState, useEffect } from "react";
import { supabase } from "../config.js";
import { useAuth } from "../contexts/AuthContext";
import { getLastNTurkeyDates } from "./utils/turkeyDate";

const RANGE_DAYS = 30;

export function useStatsViewModel() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    // Son 30 günün TAMAMI, eskiden yeniye — veri olmayan günler 0 ile dolduruluyor
    // ki grafik her zaman düzgün 30 sütun göstersin.
    const [days, setDays] = useState([]);
    const [totals, setTotals] = useState({
        wordCorrect: 0,
        wordWrong: 0,
        sentenceCorrect: 0,
        sentenceWrong: 0,
        studySeconds: 0,
        activeDays: 0,
    });

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);
            try {
                const dateRange = getLastNTurkeyDates(RANGE_DAYS);
                const startDate = dateRange[0];

                const { data, error } = await supabase
                    .from("en_user_daily_stats")
                    .select(
                        "stat_date, word_correct, word_wrong, sentence_correct, sentence_wrong, study_seconds"
                    )
                    .eq("user_id", user.id)
                    .gte("stat_date", startDate)
                    .order("stat_date", { ascending: true });

                if (error) throw error;

                const byDate = new Map((data || []).map((row) => [row.stat_date, row]));

                let wordCorrect = 0;
                let wordWrong = 0;
                let sentenceCorrect = 0;
                let sentenceWrong = 0;
                let studySeconds = 0;
                let activeDays = 0;

                const filled = dateRange.map((date) => {
                    const row = byDate.get(date);
                    const wc = row?.word_correct || 0;
                    const ww = row?.word_wrong || 0;
                    const sc = row?.sentence_correct || 0;
                    const sw = row?.sentence_wrong || 0;
                    const ss = row?.study_seconds || 0;

                    wordCorrect += wc;
                    wordWrong += ww;
                    sentenceCorrect += sc;
                    sentenceWrong += sw;
                    studySeconds += ss;
                    if (wc + ww + sc + sw > 0) activeDays += 1;

                    return {
                        date,
                        wordCorrect: wc,
                        wordWrong: ww,
                        sentenceCorrect: sc,
                        sentenceWrong: sw,
                        studySeconds: ss,
                    };
                });

                setDays(filled);
                setTotals({ wordCorrect, wordWrong, sentenceCorrect, sentenceWrong, studySeconds, activeDays });
            } catch (err) {
                console.error("İstatistikler çekilirken hata:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    return { loading, days, totals, rangeDays: RANGE_DAYS };
}