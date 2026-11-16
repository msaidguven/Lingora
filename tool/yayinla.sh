#!/usr/bin/env bash
# Lingora: tek komutla Play Store'a yeni sürüm (Harita Strateji'deki betiğin Capacitor uyarlaması).
#
#   tool/yayinla.sh                         # sürümü artır, derle, dahili teste gönder
#   tool/yayinla.sh -k production -n "• Yeni dersler…"   # üretime, bu sürüm notuyla
#   tool/yayinla.sh --deneme                # her şeyi yap ama Play'e commit etme
#   tool/yayinla.sh --metin                 # yalnız mağaza metni/görselleri güncelle
#
# Seçenekler:
#   -k, --kanal KANAL   internal (varsayılan) | alpha (kapalı test) | beta | production
#   -n, --not METİN     sürüm notu (yoksa tool/play_publish/store_config.json)
#   -s, --surum TÜR     patch (varsayılan) | minor | major | yok  (yalnız sürüm kodu yine artar)
#   --taslak            sürümü taslak bırak (uygulama henüz hiç yayınlanmadıysa gerekli)
#   --deneme            Play'e commit etme (dry-run); build.gradle değişikliği geri alınır
#   --metin             yalnız mağaza girişi + görseller (derleme yok)
#   --kontrol           yalnız Play erişimini ve kanalları göster
#
# İlk AAB Play Console'dan ELLE yüklenir (paket adı orada bağlanır); bu betik sonraki sürümler içindir.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PUB="$ROOT/tool/play_publish"
VENV="$PUB/venv"
GRADLE="android/app/build.gradle"

kanal=internal; notlar=""; surum=patch; taslak=0; deneme=0; metin=0; kontrol=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    -k|--kanal) kanal="$2"; shift 2 ;;
    -n|--not) notlar="$2"; shift 2 ;;
    -s|--surum) surum="$2"; shift 2 ;;
    --taslak) taslak=1; shift ;;
    --deneme) deneme=1; shift ;;
    --metin) metin=1; shift ;;
    --kontrol) kontrol=1; shift ;;
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
    *) echo "Bilinmeyen seçenek: $1 (yardım: -h)"; exit 2 ;;
  esac
done

if [[ ! -x "$VENV/bin/python" ]]; then
  echo "▶ Python ortamı kuruluyor…"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" -q install -r "$PUB/requirements.txt"
fi
publish() { "$VENV/bin/python" "$PUB/publish.py" "$@"; }

if [[ $kontrol == 1 ]]; then publish --check; exit; fi
if [[ $metin == 1 ]]; then
  args=(--metadata-only); [[ $deneme == 1 ]] && args+=(--dry-run)
  publish "${args[@]}"; exit
fi

# Sürümü artır: versionName 1.2.3 → 1.2.4, versionCode 7 → 8 (kod her yüklemede artmak zorunda).
eski_ad=$(grep -oP 'versionName "\K[^"]+' "$GRADLE")
eski_kod=$(grep -oP 'versionCode \K\d+' "$GRADLE")
IFS=. read -r ma mi pa <<<"$eski_ad"
case "$surum" in
  major) ma=$((ma+1)); mi=0; pa=0 ;;
  minor) mi=$((mi+1)); pa=0 ;;
  patch) pa=$((pa+1)) ;;
  yok) ;;
  *) echo "✗ --surum: patch | minor | major | yok"; exit 2 ;;
esac
yeni_ad="$ma.$mi.$pa"; yeni_kod=$((eski_kod+1))
sed -i -e "s/versionName \"$eski_ad\"/versionName \"$yeni_ad\"/" -e "s/versionCode $eski_kod/versionCode $yeni_kod/" "$GRADLE"
echo "▶ Sürüm: $eski_ad ($eski_kod) → $yeni_ad ($yeni_kod)"

geri_al() {
  sed -i -e "s/versionName \"$yeni_ad\"/versionName \"$eski_ad\"/" -e "s/versionCode $yeni_kod/versionCode $eski_kod/" "$GRADLE"
  echo "↺ Sürüm geri alındı ($eski_ad, $eski_kod)."
}
trap 'geri_al' ERR INT

echo "▶ Web derleniyor…"
npm run build --silent
npx cap sync android
echo "▶ Derleniyor (imzalı AAB)…"
(cd android && ./gradlew bundleRelease -q)

args=(--track "$kanal")
[[ -n "$notlar" ]] && args+=(--notes "$notlar")
[[ $taslak == 1 ]] && args+=(--status draft)
[[ $deneme == 1 ]] && args+=(--dry-run)
echo "▶ Play Console'a gönderiliyor ($kanal)…"
publish "${args[@]}"

trap - ERR INT
if [[ $deneme == 1 ]]; then
  geri_al
else
  echo "✓ Sürüm $yeni_ad ($yeni_kod) gönderildi. build.gradle'daki sürüm değişikliğini commit etmeyi unutma."
fi
