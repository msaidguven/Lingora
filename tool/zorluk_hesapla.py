#!/usr/bin/env python3
"""Kelimelerin seviye içi zorluğunu (1-10) kullanım sıklığından hesaplayıp en_words'e yazar.

    tool/.venv-kelime/bin/python tool/zorluk_hesapla.py            # önizleme
    tool/.venv-kelime/bin/python tool/zorluk_hesapla.py --yaz      # kaydet

Her seviye (A1..C1) kendi içinde wordfreq Zipf sıklığına göre sıralanır ve 10 eşit gruba
bölünür: en sık kullanılan %10 → 1, en seyrek %10 → 10. Yeni liste yüklendikten sonra
yeniden çalıştır (gruplar seviyedeki tüm kelimelere göre yeniden dağılır).

Kurulum (bir kez): python3 -m venv tool/.venv-kelime && tool/.venv-kelime/bin/pip install wordfreq
"""
import json
import sys
from collections import defaultdict

from wordfreq import zipf_frequency

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from kelime_listesi_yukle import env, run_sql  # noqa: E402


def score(word):
    """Zipf sıklığı; wordfreq'in yanılttığı biçimlere düzeltme."""
    z = zipf_frequency(word, "en")
    if "-" in word:
        z -= 1.5  # make-up, well-being: parçalar sık ama bileşik daha seyrek ve zor
    if word.isupper() and len(word) > 1:
        z -= 2.0  # IT, TV: küçük harfli sık kelimeyle (it) karışmasın
    return z


def main():
    cfg = env()
    rows = run_sql(cfg, "select id, word, level from en_words")
    by_level = defaultdict(list)
    for r in rows:
        by_level[r["level"]].append(r)

    updates = []
    for level in sorted(by_level):
        words = by_level[level]
        # Sık → seyrek; eşitlikte kısa kelime önce, sonra alfabetik (kararlı sıra)
        words.sort(key=lambda r: (-score(r["word"]), len(r["word"]), r["word"].lower()))
        n = len(words)
        groups = defaultdict(list)
        for i, r in enumerate(words):
            d = min(10, i * 10 // n + 1)
            updates.append({"id": r["id"], "d": d})
            groups[d].append(r["word"])
        print(f"{level} ({n} kelime)")
        for d in (1, 5, 10):
            print(f"  {d:>2}: {', '.join(groups[d][:8])}")

    if "--yaz" not in sys.argv:
        print("\nÖnizleme. Kaydetmek için --yaz ekle.")
        return
    payload = json.dumps(updates).replace("'", "''")
    res = run_sql(cfg, f"""
        with src as (select * from json_to_recordset('{payload}'::json) as x(id uuid, d int))
        update en_words w set difficulty = src.d from src where w.id = src.id
        returning 1
    """)
    print(f"\n✓ {len(res)} kelimenin zorluğu yazıldı.")


if __name__ == "__main__":
    main()
