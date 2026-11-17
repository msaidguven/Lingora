#!/usr/bin/env python3
"""Lingora: Play Console mağaza girişini, görselleri ve AAB'yi tek komutla günceller.

Genelde doğrudan değil `tool/yayinla.sh` üzerinden çalışır (o sürümü artırıp derler).
Harita Strateji'deki aracın uyarlaması; sürüm android/app/build.gradle'dan okunur.

Kullanım (proje kökünden):
  tool/play_publish/venv/bin/python tool/play_publish/publish.py --track internal
  ... --metadata-only        # yalnız açıklama/görseller, AAB yok
  ... --dry-run              # her şeyi hazırla ama commit etme (deneme)
  ... --status draft         # sürümü taslak bırak (uygulama hiç yayınlanmadıysa ZORUNLU)
  ... --notes "Yenilikler…"  # sürüm notunu store_config.json yerine bundan al
  ... --check                # yalnız erişimi ve mevcut track'leri göster
"""

import argparse
import glob
import json
import mimetypes
import re
import sys
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

REPO_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = Path(__file__).resolve().parent / "store_config.json"
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]

# Play Console sınırları.
LIMITS = {"title": 30, "short_description": 80, "full_description": 4000}
NOTES_LIMIT = 500


def load_config() -> dict:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def validate(config: dict, notes: dict) -> list[str]:
    errors = []
    for locale, data in config["listings"].items():
        for field, limit in LIMITS.items():
            n = len(data[field])
            if n > limit:
                errors.append(f"{locale} {field}: {n} karakter (en fazla {limit})")
    for locale, text in notes.items():
        if len(text) > NOTES_LIMIT:
            errors.append(f"{locale} sürüm notu: {len(text)} karakter (en fazla {NOTES_LIMIT})")
    return errors


def build_service(key_file: str):
    if not Path(key_file).exists():
        sys.exit(f"✗ Servis hesabı anahtarı yok: {key_file}\n"
                 "  Harita Strateji'deki servis hesabı anahtarı kullanılıyor.")
    creds = service_account.Credentials.from_service_account_file(key_file, scopes=SCOPES)
    return build("androidpublisher", "v3", credentials=creds, cache_discovery=False)


def image_paths(spec) -> list[Path]:
    specs = spec if isinstance(spec, list) else [spec]
    out = []
    for s in specs:
        matches = sorted(glob.glob(str(REPO_ROOT / s)))
        out += [Path(m) for m in matches] if matches else [REPO_ROOT / s]
    return out


def push_listings(service, edit_id, package_name, listings):
    for locale, data in listings.items():
        service.edits().listings().update(
            editId=edit_id, packageName=package_name, language=locale,
            body={
                "language": locale,
                "title": data["title"],
                "shortDescription": data["short_description"],
                "fullDescription": data["full_description"],
            },
        ).execute()
        print(f"  ✓ Mağaza girişi ({locale})")


def push_images(service, edit_id, package_name, locale, images):
    for image_type, spec in images.items():
        paths = [p for p in image_paths(spec) if p.exists()]
        missing = [p for p in image_paths(spec) if not p.exists()]
        for p in missing:
            print(f"  ⚠ Görsel yok, atlandı: {p.relative_to(REPO_ROOT)}")
        if not paths:
            continue  # elde görsel yoksa Play'dekileri silme
        service.edits().images().deleteall(
            editId=edit_id, packageName=package_name, language=locale, imageType=image_type,
        ).execute()
        for p in paths:
            mime, _ = mimetypes.guess_type(str(p))
            service.edits().images().upload(
                editId=edit_id, packageName=package_name, language=locale,
                imageType=image_type,
                media_body=MediaFileUpload(str(p), mimetype=mime or "image/png"),
            ).execute()
            print(f"  ✓ {image_type}: {p.name}")


def push_bundle(service, edit_id, package_name, aab: Path) -> int:
    result = service.edits().bundles().upload(
        editId=edit_id, packageName=package_name,
        media_body=MediaFileUpload(str(aab), mimetype="application/octet-stream", resumable=True),
    ).execute()
    print(f"  ✓ AAB yüklendi (versionCode {result['versionCode']})")
    return result["versionCode"]


def push_track(service, edit_id, package_name, track, version_code, notes, status, version_name):
    release = {
        "name": version_name,
        "versionCodes": [str(version_code)],
        "status": status,
        "releaseNotes": [{"language": l, "text": t} for l, t in notes.items()],
    }
    service.edits().tracks().update(
        editId=edit_id, packageName=package_name, track=track,
        body={"track": track, "releases": [release]},
    ).execute()
    print(f"  ✓ '{track}' kanalına atandı ({status})")


def show_tracks(service, edit_id, package_name):
    tracks = service.edits().tracks().list(editId=edit_id, packageName=package_name).execute()
    for t in tracks.get("tracks", []):
        rel = [f"{r.get('name', '?')} [{r.get('status')}]" for r in t.get("releases", [])]
        print(f"  - {t['track']}: {', '.join(rel) or '(sürüm yok)'}")


def app_version() -> str:
    """android/app/build.gradle → "1.0.0+1" (versionName+versionCode)."""
    text = (REPO_ROOT / "android/app/build.gradle").read_text(encoding="utf-8")
    name = re.search(r'versionName\s+"([^"]+)"', text)
    code = re.search(r"versionCode\s+(\d+)", text)
    return f"{name.group(1) if name else '?'}+{code.group(1) if code else '?'}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--track", default="internal",
                    help="internal=dahili test, alpha=kapalı test, beta=açık test, production; "
                         "virgülle birden çok kanal: alpha,internal (aynı AAB hepsine atanır)")
    ap.add_argument("--metadata-only", action="store_true")
    ap.add_argument("--aab", default="android/app/build/outputs/bundle/release/app-release.aab")
    ap.add_argument("--status", default="completed", choices=["completed", "draft"])
    ap.add_argument("--notes", help="Sürüm notu (tr-TR); verilmezse store_config.json")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    tracks = [t.strip() for t in args.track.split(",") if t.strip()]
    bad = [t for t in tracks if t not in ("internal", "alpha", "beta", "production")]
    if not tracks or bad:
        print(f"✗ Geçersiz kanal: {', '.join(bad) or args.track}")
        return 2

    config = load_config()
    package = config["package_name"]
    notes = dict(config["release_notes"])
    if args.notes:
        notes[config["default_locale"]] = args.notes

    errors = validate(config, notes)
    if errors:
        print("✗ Metin sınırları aşıldı:\n  " + "\n  ".join(errors))
        return 1

    service = build_service(config["key_file"])
    try:
        edit_id = service.edits().insert(body={}, packageName=package).execute()["id"]
    except HttpError as e:
        print(f"✗ Play Console'a erişilemedi: {e}")
        print("  Uygulama Play Console'da oluşturuldu mu, ilk AAB elle yüklendi mi,\n"
              "  servis hesabına bu uygulama için yetki verildi mi? ")
        return 1
    print(f"Düzenleme oturumu: {edit_id}")

    committed = False
    try:
        if args.check:
            print("Erişim tamam. Kanallar:")
            show_tracks(service, edit_id, package)
            return 0

        print("\nMağaza girişi:")
        push_listings(service, edit_id, package, config["listings"])
        print("\nGörseller:")
        push_images(service, edit_id, package, config["default_locale"], config["images"])
        # Dile özel görseller (ör. İngilizce ekran görüntüleri); olmayanlar
        # varsayılan dilinkileri kullanır.
        for locale, images in config.get("images_by_locale", {}).items():
            print(f"  ({locale})")
            push_images(service, edit_id, package, locale, {**config["images"], **images})

        if not args.metadata_only:
            aab = REPO_ROOT / args.aab
            if not aab.exists():
                print(f"\n✗ AAB yok: {aab}\n  Önce: tool/yayinla.sh (veya npm run build && npx cap sync android && cd android && ./gradlew bundleRelease)")
                return 1
            print(f"\nAAB ({aab.stat().st_size / 1e6:.1f} MB, sürüm {app_version()}):")
            code = push_bundle(service, edit_id, package, aab)
            for track in tracks:
                print(f"\nKanal ({track}):")
                push_track(service, edit_id, package, track, code, notes,
                           args.status, app_version().split("+")[0])

        if args.dry_run:
            print("\n--dry-run: commit edilmedi, oturum iptal ediliyor.")
            return 0
        try:
            service.edits().commit(editId=edit_id, packageName=package).execute()
        except HttpError as e:
            if "draft" in str(e).lower():
                print("✗ Uygulama henüz yayınlanmadığı için sürüm taslak olmalı: --status draft ile tekrar dene.")
            raise
        committed = True
        print("\n✓ Gönderildi. Play Console'da görünecek (incelemeden sonra yayına çıkar).")
        return 0
    finally:
        if not committed:
            try:
                service.edits().delete(editId=edit_id, packageName=package).execute()
            except Exception:
                pass


if __name__ == "__main__":
    raise SystemExit(main())
