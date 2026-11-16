#!/usr/bin/env python3
"""Oxford kelime listesi PDF'ini (Terms | Meanings | Meanings2 | Meanings3) en_words'e yükler.

    python3 tool/kelime_listesi_yukle.py ~/İndirilenler/Oxford_Lists_A1.pdf A1           # önizleme
    python3 tool/kelime_listesi_yukle.py ~/İndirilenler/Oxford_Lists_A2.pdf A2 --yukle   # kaydet

- Anlam: satırdaki anlamlardan [i.]/[f.] gibi etiketler atılıp tekilleştirilir. Bu kaba
  sözlük anlamı geçicidir; admin panelindeki "Cümlesi olmayan kelimeler" adımında AI düzeltir.
- Zaten olan kelimeye dokunulmaz (en_words.word benzersiz).
- Gereken: pdftotext (poppler-utils), lingora/.env.local içinde SUPABASE_ACCESS_TOKEN ve
  VITE_SUPABASE_URL.
"""
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

LEVELS = {"A1", "A2", "B1", "B2", "C1"}
ROOT = Path(__file__).resolve().parent.parent
TAG = re.compile(r"\s*\[[^\]]*\]\s*")


def env():
    out = {}
    for line in (ROOT / ".env.local").read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip().strip('"')
    return out


def parse(pdf):
    text = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True,
                          text=True, check=True).stdout
    words = {}
    for line in text.splitlines():
        s = line.strip()
        # Kelime satırı sütun 0'dan başlar; girintili satırlar uzun anlamların devamı
        if not s or line[0].isspace() or s.startswith(("Terms", "OXFORD")) or "Sayfa" in s:
            continue
        parts = re.split(r"\s{2,}", s)
        word = parts[0].strip()
        if not re.fullmatch(r"[A-Za-z][A-Za-z' .\-]*", word):
            print(f"  ! atlandı: {line!r}", file=sys.stderr)
            continue
        meanings = []
        for m in parts[1:]:
            m = TAG.sub(" ", m).strip(" ,")
            if m and m not in meanings:
                meanings.append(m)
        key = word.lower()
        if key not in words:
            words[key] = (word, ", ".join(meanings) or "?")
    return list(words.values())


def run_sql(cfg, sql):
    ref = re.sub(r"^https://|\..*$", "", cfg["VITE_SUPABASE_URL"])
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{ref}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": f"Bearer {cfg['SUPABASE_ACCESS_TOKEN']}",
                 "Content-Type": "application/json", "User-Agent": "lingora-tool"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 2 or args[1] not in LEVELS:
        sys.exit(__doc__)
    pdf, level = Path(args[0]).expanduser(), args[1]
    rows = parse(pdf)
    print(f"{len(rows)} kelime okundu ({level}). Örnekler:")
    for w, m in rows[:8]:
        print(f"  {w:14} {m}")
    if "--yukle" not in sys.argv:
        print("\nÖnizleme. Kaydetmek için sona --yukle ekle.")
        return

    payload = json.dumps([{"w": w, "m": m} for w, m in rows]).replace("'", "''")
    res = run_sql(env(), f"""
        with src as (select * from json_to_recordset('{payload}'::json) as x(w text, m text)),
        ins as (
          insert into en_words (word, meaning, level, type, difficulty)
          select w, m, '{level}', 'word', 1 from src
          on conflict (word) do nothing
          returning 1
        )
        select (select count(*) from ins) as eklenen, (select count(*) from src) as toplam
    """)
    r = res[0]
    print(f"\n✓ {r['eklenen']} yeni kelime eklendi; {r['toplam'] - r['eklenen']} tanesi zaten vardı.")
    print("Zorlukları güncelle: tool/.venv-kelime/bin/python tool/zorluk_hesapla.py --yaz")


if __name__ == "__main__":
    main()
