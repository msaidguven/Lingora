#!/usr/bin/env python3
"""Lingora uygulama simgesi ve Play öne çıkan görseli (Pillow).

Kullanım (proje kökünden):  python3 tool/icon/make_icon.py
Üretir:
  android/app/src/main/res/mipmap-*/ic_launcher*.png   (eski + yuvarlak + uyarlanabilir ön plan)
  store/icon-512.png        Play Store simgesi
  store/feature-1024x500.png  Play öne çıkan görsel
Tema: uygulamadaki defter görünümü (lacivert kapak, krem sayfa, kırmızı kenar çizgisi).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
RES = ROOT / "android/app/src/main/res"
STORE = ROOT / "store"

COVER = (27, 42, 74)        # --lg-cover
COVER_D = (19, 27, 51)
PAGE = (247, 242, 228)      # --lg-bg (açık)
INK = (36, 29, 18)
RED = (214, 48, 60)         # --lg-red
GOLD = (232, 185, 78)       # --lg-gold
RULE = (36, 29, 18, 30)
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

N = 1024


def background(n):
    img = Image.new("RGB", (n, n), COVER_D)
    d = ImageDraw.Draw(img)
    for r in range(int(n * 0.75), 0, -4):  # hafif ışık
        t = r / (n * 0.75)
        c = tuple(int(COVER[i] * (1 - t) + COVER_D[i] * t) for i in range(3))
        d.ellipse([n * 0.45 - r, n * 0.4 - r, n * 0.45 + r, n * 0.4 + r], fill=c)
    return img


def page_mark(n, safe):
    """Saydam ön plan: güvenli alana sığan, köşesi kıvrık defter sayfası + 'L'."""
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    w = n * safe
    x0, y0 = (n - w) / 2, (n - w) / 2
    x1, y1 = x0 + w, y0 + w
    fold = w * 0.2

    shadow = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([x0 + w * .03, y0 + w * .05, x1 + w * .03, y1 + w * .05],
                                             radius=w * .06, fill=(0, 0, 0, 110))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(n * .02)))

    d = ImageDraw.Draw(img)
    # Sayfa (sağ üst köşe kıvrık)
    d.rounded_rectangle([x0, y0, x1, y1], radius=w * .06, fill=PAGE)
    d.polygon([(x1 - fold, y0), (x1 + 1, y0), (x1 + 1, y0 + fold)], fill=(0, 0, 0, 0))
    img.paste((0, 0, 0, 0), [int(x1 - fold * .2), int(y0), int(x1 + 1), int(y0 + fold * .2)])
    d.polygon([(x1 - fold, y0), (x1 - fold, y0 + fold), (x1, y0 + fold)], fill=(222, 212, 186))

    # Satır çizgileri ve kırmızı kenar çizgisi
    rules = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rules)
    step = w / 7
    for i in range(1, 7):
        y = y0 + i * step
        rd.line([(x0 + w * .04, y), (x1 - w * .04, y)], fill=RULE, width=max(1, int(n * .004)))
    img.alpha_composite(rules)
    mx = x0 + w * .2
    d.line([(mx, y0 + w * .03), (mx, y1 - w * .03)], fill=RED, width=max(2, int(n * .008)))

    # 'L' harfi
    font = ImageFont.truetype(SERIF, int(w * .78))
    bbox = d.textbbox((0, 0), "L", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = x0 + w * .54 - tw / 2 - bbox[0]
    ty = y0 + w * .5 - th / 2 - bbox[1]
    d.text((tx, ty), "L", font=font, fill=COVER)
    # Altın vurgu: harfin altında el yazısı çizgi
    uy = ty + bbox[3] + w * .05
    d.arc([tx + w * .02, uy - w * .05, tx + tw + w * .12, uy + w * .05], 10, 170, fill=GOLD, width=max(2, int(n * .014)))
    return img


def full_icon(n):
    img = background(n).convert("RGBA")
    img.alpha_composite(page_mark(n, 0.66))
    return img


def round_mask(img):
    n = img.size[0]
    mask = Image.new("L", (n, n), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, n - 1, n - 1], fill=255)
    out = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def write_mipmaps():
    legacy = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    big = full_icon(N)
    # Uyarlanabilir ön plan: 108dp tuval, logo ortadaki ~66dp güvenli alanda
    fg = page_mark(N, 0.58)
    for dpi, px in legacy.items():
        folder = RES / f"mipmap-{dpi}"
        sq = big.resize((px, px), Image.LANCZOS)
        sq.save(folder / "ic_launcher.png")
        round_mask(sq).save(folder / "ic_launcher_round.png")
        fpx = int(px * 108 / 48)
        fg.resize((fpx, fpx), Image.LANCZOS).save(folder / "ic_launcher_foreground.png")
    (RES / "values/ic_launcher_background.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        f'    <color name="ic_launcher_background">#{COVER_D[0]:02X}{COVER_D[1]:02X}{COVER_D[2]:02X}</color>\n'
        '</resources>\n')
    STORE.mkdir(exist_ok=True)
    big.resize((512, 512), Image.LANCZOS).convert("RGB").save(STORE / "icon-512.png")


def write_feature():
    W, H = 1024, 500
    img = background(W).resize((W, W)).crop((0, (W - H) // 2, W, (W + H) // 2)).convert("RGBA")
    mark = page_mark(H, 0.66)
    img.alpha_composite(mark, (30, 0))
    d = ImageDraw.Draw(img)
    title = ImageFont.truetype(SERIF, 104)
    sub = ImageFont.truetype(SANS, 29)
    d.text((520, 140), "Lingora", font=title, fill=PAGE)
    d.line([(524, 262), (800, 262)], fill=RED, width=6)
    d.text((522, 292), "İngilizce kelime ve cümle", font=sub, fill=(240, 233, 216))
    d.text((522, 340), "her gün biraz, kalıcı olarak", font=sub, fill=GOLD)
    img.convert("RGB").save(STORE / "feature-1024x500.png")


if __name__ == "__main__":
    write_mipmaps()
    write_feature()
    print("Simge ve öne çıkan görsel yazıldı.")
