// src/Placement/PlacementTest.jsx
// Giriş testi — "bildiklerini atla". Kullanıcının seviyesinden henüz havuzuna
// eklenmemiş kelimeler sorulur; doğru bilinenler "zaten biliyor" olarak
// eklenir (mark_words_known RPC'si; günlük hak harcanmaz) ve bir daha yeni
// kelime diye gelmez. Turu iyi geçen (ROUND_PASS) bir tur daha isteyebilir.
// Yeni kullanıcıya bir kez açılışta, sonra istenirse Ayarlar'dan açılır.
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../config.js";
import { useAuth } from "../contexts/AuthContext";
import { shuffle, buildWordOptions } from "../utils/quizHelpers.js";
import { DOGEAR, SpiralStrip, NotebookTheme } from "../theme/notebook";

const ROUND_SIZE = 20;
const ROUND_PASS = 15; // bu kadar doğruysa "bir tur daha" önerilir
const CHOICES = 4;
const IDK = "__idk__"; // "Bilmiyorum" — hiçbir şıkla eşleşmez

export default function PlacementTest({ userLevel = "A1", onboarding = true, onDone }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState("intro"); // intro | loading | question | saving | result | empty
  const [words, setWords] = useState([]);
  const [pool, setPool] = useState([]);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [picked, setPicked] = useState(null);
  const [knownIds, setKnownIds] = useState([]);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [totalKnown, setTotalKnown] = useState(0);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Yanlış şıklar için aynı seviyeden geniş havuz (useWordQuiz ile aynı yaklaşım)
  useEffect(() => {
    supabase
      .from("en_words")
      .select("id, meaning")
      .eq("level", userLevel)
      .eq("type", "word")
      .limit(500)
      .then(({ data }) => setPool(data || []));
  }, [userLevel]);

  const markDone = useCallback(async () => {
    if (user && onboarding) {
      const { error: e } = await supabase
        .from("en_users")
        .update({ placement_done_at: new Date().toISOString() })
        .eq("id", user.id);
      if (e) console.error("Giriş testi kaydedilemedi:", e);
    }
    onDone?.();
  }, [user, onboarding, onDone]);

  const startRound = useCallback(async () => {
    if (!user) return;
    setPhase("loading");
    setError(null);
    const { data, error: e } = await supabase.rpc("get_new_words", {
      p_user_id: user.id,
      p_level: userLevel,
      p_limit: ROUND_SIZE,
    });
    if (e) {
      console.error("Test kelimeleri yüklenemedi:", e);
      setError("Kelimeler yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.");
      setPhase("intro");
      return;
    }
    const list = shuffle(data || []);
    if (list.length === 0) {
      setPhase("empty");
      return;
    }
    setWords(list);
    setIndex(0);
    setKnownIds([]);
    setRoundCorrect(0);
    setPicked(null);
    setPhase("question");
  }, [user, userLevel]);

  const current = words[index];

  useEffect(() => {
    if (phase !== "question" || !current) return;
    const source = pool.length > CHOICES ? pool : words;
    setOptions(buildWordOptions(current, source, CHOICES));
    setPicked(null);
  }, [phase, current, pool, words]);

  const finishRound = useCallback(async (ids, correctCount) => {
    setPhase("saving");
    let added = 0;
    if (ids.length > 0) {
      const { data, error: e } = await supabase.rpc("mark_words_known", { p_ids: ids });
      if (e) {
        console.error("Bilinen kelimeler kaydedilemedi:", e);
        setError("Sonuçlar kaydedilemedi. Tekrar dener misin?");
      } else {
        added = data || 0;
      }
    }
    setTotalKnown((t) => t + added);
    setRoundCorrect(correctCount);
    setPhase("result");
  }, []);

  const answer = (opt) => {
    if (picked !== null || !current) return;
    const isCorrect = opt === current.meaning;
    setPicked(opt);
    const nextIds = isCorrect ? [...knownIds, current.id] : knownIds;
    const nextCorrect = roundCorrect + (isCorrect ? 1 : 0);
    setKnownIds(nextIds);
    setRoundCorrect(nextCorrect);

    timerRef.current = setTimeout(() => {
      if (index + 1 >= words.length) {
        finishRound(nextIds, nextCorrect);
      } else {
        setIndex(index + 1);
      }
    }, isCorrect ? 450 : 900);
  };

  const card = `${DOGEAR} rounded-md border border-[var(--lg-border)] bg-[var(--lg-card)] p-5 shadow-sm`;
  const btn =
    "inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-[14px] font-bold transition-opacity disabled:opacity-50";
  const primaryBtn = `${btn} bg-[var(--lg-red)] text-white`;
  const ghostBtn = `${btn} border border-dashed border-[var(--lg-border-strong)] text-[var(--lg-ink)]`;

  let body;
  if (phase === "intro") {
    body = (
      <div className={card}>
        <div className="mb-2 text-4xl">🧭</div>
        <h1 className="mb-2 font-serif text-2xl font-bold">
          {onboarding ? "Hoş geldin!" : "Bildiğin kelimeleri atla"}
        </h1>
        <p className="mb-4 text-[14px] leading-relaxed text-[var(--lg-ink-muted)]">
          Sana {ROUND_SIZE} kelime soracağız. Doğru bildiklerin "zaten biliyor" olarak işaretlenir
          ve sana yeni kelime diye bir daha gelmez — böylece bildiklerinle vakit kaybetmezsin.
          Emin değilsen <b>Bilmiyorum</b>'a bas; tahmin etme.
        </p>
        {error && <p className="mb-3 text-[13px] text-[var(--lg-red)]">{error}</p>}
        <div className="space-y-2">
          <button className={primaryBtn} onClick={startRound}>
            Teste Başla
          </button>
          <button className={ghostBtn} onClick={markDone}>
            {onboarding ? "Atla, sıfırdan başla" : "Vazgeç"}
          </button>
        </div>
      </div>
    );
  } else if (phase === "loading" || phase === "saving") {
    body = (
      <div className="flex flex-col items-center gap-3 py-16 text-[var(--lg-ink-muted)]">
        <span className="loading loading-spinner loading-lg" />
        <span className="text-sm">{phase === "loading" ? "Kelimeler hazırlanıyor…" : "Kaydediliyor…"}</span>
      </div>
    );
  } else if (phase === "question" && current) {
    body = (
      <div>
        <div className="mb-2 flex items-center justify-between font-mono text-[11px] font-bold text-[var(--lg-ink-muted)]">
          <span>
            {index + 1} / {words.length}
          </span>
          <span>✓ {roundCorrect}</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--lg-border)]">
          <div
            className="h-full bg-[var(--lg-red)] transition-all"
            style={{ width: `${(index / words.length) * 100}%` }}
          />
        </div>
        <div className={`${card} mb-4 text-center`}>
          <div className="font-mono text-[10px] font-bold tracking-[3px] text-[var(--lg-ink-muted)]">
            BU KELİMENİN ANLAMI NE?
          </div>
          <div className="mt-2 font-serif text-3xl font-bold">{current.word}</div>
        </div>
        <div className="space-y-2">
          {options.map((opt) => {
            const isAnswer = opt === current.meaning;
            let tone = "border-[var(--lg-border)] bg-[var(--lg-card)]";
            if (picked !== null && isAnswer) tone = "border-[#3a7d44] bg-[#3a7d44]/15";
            else if (picked === opt) tone = "border-[var(--lg-red)] bg-[var(--lg-red)]/15";
            return (
              <button
                key={opt}
                onClick={() => answer(opt)}
                disabled={picked !== null}
                className={`w-full rounded-md border-2 px-4 py-3 text-left text-[15px] font-semibold text-[var(--lg-ink)] transition-colors ${tone}`}
              >
                {opt}
              </button>
            );
          })}
          <button
            onClick={() => answer(IDK)}
            disabled={picked !== null}
            className="w-full rounded-md border-2 border-dashed border-[var(--lg-border-strong)] px-4 py-3 text-[14px] font-semibold text-[var(--lg-ink-muted)]"
          >
            🤷 Bilmiyorum
          </button>
        </div>
      </div>
    );
  } else if (phase === "result") {
    const canContinue = roundCorrect >= ROUND_PASS && words.length === ROUND_SIZE;
    body = (
      <div className={card}>
        <div className="mb-2 text-4xl">{roundCorrect >= ROUND_PASS ? "🌟" : "👍"}</div>
        <h2 className="mb-2 font-serif text-xl font-bold">
          {words.length} kelimeden {roundCorrect} tanesini bildin
        </h2>
        <p className="mb-4 text-[14px] leading-relaxed text-[var(--lg-ink-muted)]">
          {totalKnown > 0
            ? `Toplam ${totalKnown} kelime "biliyor" olarak işaretlendi; bunlar sana yeni kelime olarak gelmeyecek, yalnızca arada bir tekrar sorulacak.`
            : "Sorun değil — kelimeleri baştan, adım adım öğreneceğiz."}
          {canContinue && " Çok iyi gidiyorsun; istersen bir tur daha yapıp daha fazla kelimeyi atlayabilirsin."}
        </p>
        {error && <p className="mb-3 text-[13px] text-[var(--lg-red)]">{error}</p>}
        <div className="space-y-2">
          {canContinue && (
            <button className={primaryBtn} onClick={startRound}>
              {ROUND_SIZE} Kelime Daha
            </button>
          )}
          <button className={canContinue ? ghostBtn : primaryBtn} onClick={markDone}>
            Öğrenmeye Başla
          </button>
        </div>
      </div>
    );
  } else {
    body = (
      <div className={card}>
        <div className="mb-2 text-4xl">🎉</div>
        <h2 className="mb-2 font-serif text-xl font-bold">Sorulacak yeni kelime kalmadı</h2>
        <p className="mb-4 text-[14px] text-[var(--lg-ink-muted)]">
          Bu seviyedeki tüm kelimeler zaten havuzunda.
        </p>
        <button className={primaryBtn} onClick={markDone}>
          Devam Et
        </button>
      </div>
    );
  }

  return (
    <div className="lg-notebook relative min-h-screen overflow-hidden bg-[var(--lg-bg)] text-[var(--lg-ink)]">
      <NotebookTheme />
      <SpiralStrip />
      <div className="relative z-10 mx-auto max-w-md px-5 pb-8 pt-8">{body}</div>
    </div>
  );
}
