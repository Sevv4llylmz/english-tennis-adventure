"""Prepare game assets from the supplied artwork in assets-src/ (originals are never modified).

- Backgrounds: remove the screenshot UI strip some images carry (top ~38px), keep 16:9,
  resize to 1600x900 and save optimized WebP.
- Sprite sheets (Alya, Teacher, school objects, toys): split into individual sprites,
  remove the flat sheet background with a border flood-fill (colour distance + low saturation),
  turn grey ground shadows into real semi-transparent shadows, trim and save WebP with alpha.
- Writes tools/out/contact_*.png so every cut-out can be inspected on dark and light backdrops.

Usage:  python tools/prepare_assets.py
Requires: pillow, numpy, scipy
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
PUB = ROOT / "public" / "assets"
OUT = ROOT / "tools" / "out"


def save_webp(img: Image.Image, path: Path, q=86):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=q, method=6)


# ---------------------------------------------------------------- backgrounds
BACKGROUNDS = {
    # name: (source file, has screenshot UI strip at the top)
    "adventure-map": ("adventure-map.webp", False),
    "classroom": ("classroom.webp", True),
    "toy-shop": ("toy-shop.webp", True),
    "grammar-room": ("grammar-room.webp", False),
    "tennis-court": ("tennis-court.webp", True),
}


def backgrounds():
    info = {}
    for name, (fn, strip) in BACKGROUNDS.items():
        im = Image.open(SRC / fn).convert("RGB")
        w, h = im.size
        if strip:
            top = 40
            nh = h - top
            nw = round(nh * 16 / 9)
            left = (w - nw) // 2
            im = im.crop((left, top, left + nw, top + nh))
            info[name] = {"crop": [left, top, left + nw, top + nh], "source": [w, h]}
        else:
            info[name] = {"crop": [0, 0, w, h], "source": [w, h]}
        im = im.resize((1600, 900), Image.LANCZOS)
        save_webp(im, PUB / "backgrounds" / name / f"{name}.webp", 84)
    return info


# ---------------------------------------------------------------- cut-out helpers
def cutout(rgb: np.ndarray, bg_color, tol=26, sat_max=40, shadow=True, holes=0, close=0, holes_tol=4):
    """Return RGBA array. Background = pixels connected to the border whose colour is close to
    bg_color (or a low-saturation grey shadow). Shadows become dark translucent pixels."""
    a = rgb.astype(np.int32)
    diff = np.abs(a - np.array(bg_color)).max(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    lum = a.mean(axis=2)
    near_bg = diff < tol
    greyish = (sat < sat_max) & (lum > 150) & (diff < 95) if shadow else np.zeros_like(near_bg)
    cand = near_bg | greyish
    lab, _ = ndi.label(cand)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border > 0]
    bg = np.isin(lab, border)
    if holes:
        # enclosed gaps (between legs, arm and body) that are pure background colour
        pure = diff <= holes_tol
        hl, hn = ndi.label(pure & ~bg)
        hs = ndi.sum(pure & ~bg, hl, range(1, hn + 1))
        bg |= np.isin(hl, [i + 1 for i, v in enumerate(hs) if v > holes])
    fg = ~bg
    if close:
        # seal small leaks through soft outlines (white plane, white ball panels)
        sealed = ndi.binary_fill_holes(ndi.binary_closing(fg, iterations=close))
        if holes:
            sealed &= ~(np.isin(hl, [i + 1 for i, v in enumerate(hs) if v > holes]))
        fg = sealed
        bg = ~fg
    # Shadows: inside the bg region, grey pixels darker than the bg -> black with alpha.
    bg_lum = float(np.mean(bg_color))
    alpha = np.where(fg, 255.0, 0.0)
    out_rgb = a.astype(np.float64).copy()
    if shadow:
        dark = bg & (lum < bg_lum - 6)
        sh_alpha = np.clip((bg_lum - lum) / bg_lum * 1.6, 0, 0.55) * 255
        alpha = np.where(dark, sh_alpha, alpha)
        out_rgb[dark] = [40, 34, 50]
    # Soften the outline: 1px band of foreground next to background gets partial alpha
    # and is un-mixed from the background colour so no light halo remains.
    fg_er = ndi.binary_erosion(fg, iterations=2)
    edge = fg & ~fg_er
    t = np.clip(diff / 80.0, 0.3, 1.0)
    alpha = np.where(edge, 255 * t, alpha)
    tt = t[edge][:, None]
    out_rgb[edge] = np.clip((a[edge] - (1 - tt) * np.array(bg_color)) / tt, 0, 255)
    return np.dstack([out_rgb, alpha]).astype(np.uint8), fg


def keep_components(rgba, fg, min_frac=0.02, keep=None):
    """Drop small stray foreground islands (sparkles, label fragments)."""
    lab, n = ndi.label(fg)
    if n == 0:
        return rgba
    sizes = ndi.sum(fg, lab, range(1, n + 1))
    big = sizes.max()
    good = [i + 1 for i, s in enumerate(sizes) if s >= big * min_frac]
    if keep is not None:
        order = np.argsort(-sizes)[:keep] + 1
        good = [g for g in good if g in order]
    mask = np.isin(lab, good)
    # also keep translucent shadow pixels (alpha < 255 outside fg) near kept parts
    near = ndi.binary_dilation(mask, iterations=40)
    rgba = rgba.copy()
    rgba[..., 3] = np.where(mask | (near & ~fg), rgba[..., 3], 0)
    return rgba


def trim(rgba, pad=6):
    al = rgba[..., 3]
    ys, xs = np.nonzero(al > 8)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, al.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, al.shape[1])
    return rgba[y0:y1, x0:x1]


# ---------------------------------------------------------------- characters
POSES = ["idle", "happy", "thinking", "sad", "celebrate", "swing", "ready", "wave"]


def character_sheet(fn, who):
    rgb = np.asarray(Image.open(SRC / fn).convert("RGB"))
    H, W, _ = rgb.shape
    rgba, fg = cutout(rgb, (254, 254, 254), tol=14, sat_max=14, holes=150)
    lab, n = ndi.label(fg)
    centers = ndi.center_of_mass(fg, lab, range(1, n + 1))
    sizes = ndi.sum(fg, lab, range(1, n + 1))
    meta = {}
    for idx, pose in enumerate(POSES):
        r, c = divmod(idx, 4)
        x0, x1 = c * W // 4, (c + 1) * W // 4
        y0, y1 = r * H // 2, (r + 1) * H // 2
        mine = [i + 1 for i, (cy, cx) in enumerate(centers)
                if x0 <= cx < x1 and y0 <= cy < y1 and sizes[i] > 25]
        mask = np.isin(lab, mine)
        ys, xs = np.nonzero(mask)
        bx0, bx1 = xs.min() - 8, xs.max() + 9
        by0, by1 = ys.min() - 8, min(ys.max() + 30, H)
        bx0, by0 = max(bx0, 0), max(by0, 0)
        bx1 = min(bx1, W)
        sub = rgba[by0:by1, bx0:bx1].copy()
        submask = mask[by0:by1, bx0:bx1]
        subfg = fg[by0:by1, bx0:bx1]
        # remove foreground belonging to neighbouring poses
        sub[..., 3] = np.where(subfg & ~submask, 0, sub[..., 3])
        # shadows: keep only those below this pose's feet & within its x-range
        img = Image.fromarray(trim(sub, 4), "RGBA")
        save_webp(img, PUB / "characters" / who / f"{who}-{pose}.webp", 90)
        meta[pose] = {"w": img.width, "h": img.height}
    return meta


# ---------------------------------------------------------------- objects
SCHOOL = {  # boxes in the 1672x941 school objects sheet
    "pen": (55, 135, 195, 410),
    "rubber": (200, 220, 365, 380),
    "pencil": (390, 140, 535, 412),
    "ruler": (550, 160, 718, 408),
    "notebook": (708, 168, 948, 412),
    "book": (950, 190, 1150, 410),
    "bag": (1155, 140, 1400, 412),
    "pencil-case": (1405, 245, 1645, 405),
    "desk": (105, 540, 485, 815),
    "chair": (520, 510, 785, 818),
    "board": (885, 500, 1525, 810),
}
TOYS = {  # boxes in the 1672x941 toys sheet
    "kite": (115, 105, 400, 372),
    "doll": (392, 105, 668, 372),
    "monster": (680, 100, 980, 370),
    "plane": (980, 115, 1270, 370),
    "computer-game": (1270, 132, 1548, 352),
    "train": (85, 500, 437, 712),
    "car": (433, 500, 724, 708),
    "ball": (740, 505, 935, 712),
    "bike": (945, 480, 1260, 718),
    "go-kart": (1265, 480, 1595, 722),
}


def object_sheet(fn, boxes, folder, tol, sat_max, keep=None, close=0, holes=0, special=None):
    im = Image.open(SRC / fn).convert("RGBA")
    flat = Image.new("RGBA", im.size, (250, 247, 252, 255))
    flat.alpha_composite(im)
    rgb = np.asarray(flat.convert("RGB"))
    meta = {}
    for name, (x0, y0, x1, y1) in boxes.items():
        sub = rgb[y0:y1, x0:x1]
        border = np.concatenate([sub[0], sub[-1], sub[:, 0], sub[:, -1]])
        bg = tuple(int(v) for v in np.median(border, axis=0))
        kw = dict(tol=tol, sat_max=sat_max, close=close, holes=holes, holes_tol=10)
        kw.update((special or {}).get(name, {}))
        rgba, fg = cutout(sub, bg, **kw)
        rgba = keep_components(rgba, fg, 0.03, keep=(keep or {}).get(name, 1))
        img = Image.fromarray(trim(rgba, 4), "RGBA")
        save_webp(img, PUB / "objects" / folder / f"{name}.webp", 90)
        meta[name] = {"w": img.width, "h": img.height, "bg": bg}
    return meta


def contact(folder, names, out_name, prefix=""):
    tiles = [Image.open(PUB / folder / f"{prefix}{n}.webp") for n in names]
    hmax = 300
    tiles = [t.resize((max(1, int(t.width * hmax / t.height)), hmax)) if t.height > hmax else t for t in tiles]
    W = sum(t.width + 20 for t in tiles) + 20
    rows = []
    for color in [(36, 60, 70), (120, 180, 120), (240, 200, 210)]:
        row = Image.new("RGBA", (W, hmax + 40), color + (255,))
        x = 20
        for t in tiles:
            row.alpha_composite(t, (x, 20))
            x += t.width + 20
        rows.append(row)
    sheet = Image.new("RGBA", (W, (hmax + 40) * 3))
    for i, r in enumerate(rows):
        sheet.paste(r, (0, i * (hmax + 40)))
    OUT.mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(OUT / out_name)


if __name__ == "__main__":
    manifest = {"backgrounds": backgrounds()}
    manifest["alya"] = character_sheet("alya-sheet.webp", "alya")
    manifest["teacher"] = character_sheet("teacher-sheet.webp", "teacher")
    manifest["school"] = object_sheet("school-objects-sheet.webp", SCHOOL, "school", tol=22, sat_max=34, close=4, holes=200,
                                     special={"pen": {"tol": 14, "sat_max": 10}, "chair": {"tol": 14, "sat_max": 10}})
    manifest["toys"] = object_sheet("toys-sheet.webp", TOYS, "toys", tol=12, sat_max=8, close=7,
                                   special={"computer-game": {"close": 1}})
    # swing poses: erase the tennis ball painted into the artwork (the game animates its own ball)
    for who in ("alya", "teacher"):
        sp = PUB / "characters" / who / f"{who}-swing.webp"
        a = np.asarray(Image.open(sp)).copy()
        rgb = a[..., :3].astype(int)
        lime = (rgb[..., 1] > 170) & (rgb[..., 0] > 140) & (rgb[..., 2] < 130) & (rgb[..., 1] - rgb[..., 2] > 80) & (a[..., 3] > 0)
        lab, n = ndi.label(lime)
        if n:
            sizes = ndi.sum(lime, lab, range(1, n + 1))
            k = int(np.argmax(sizes)) + 1
            ys, xs = np.nonzero(lab == k)
            y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
            ball = ndi.binary_dilation(lab == k, iterations=3)
            box = np.zeros_like(lime)
            box[y0 - 2 : y1 + 40, x0 - 60 : x0 + 6] = True  # motion lines below/left of the ball
            lum = rgb.mean(axis=2)
            sat = rgb.max(axis=2) - rgb.min(axis=2)
            trail = box & (((lum > 150) & (sat < 90)) | lime)
            a[..., 3] = np.where(ball | trail, 0, a[..., 3])
            save_webp(Image.fromarray(a, "RGBA"), sp, 90)

    # remove the decorative yellow sparkle stroke that touches the console's corner
    cg_path = PUB / "objects" / "toys" / "computer-game.webp"
    cg = np.asarray(Image.open(cg_path)).copy()
    reg = cg[:75, 215:]
    yellow = (reg[..., 0] > 200) & (reg[..., 1] > 170) & (reg[..., 2] < 140)
    yellow = ndi.binary_dilation(yellow, iterations=3)
    reg[..., 3] = np.where(yellow, 0, reg[..., 3])
    save_webp(Image.fromarray(trim(cg, 2), "RGBA"), cg_path, 90)
    (ROOT / "tools" / "asset-report.json").write_text(json.dumps(manifest, indent=1))
    contact("characters/alya", POSES, "contact_alya.png", "alya-")
    contact("characters/teacher", POSES, "contact_teacher.png", "teacher-")
    contact("objects/school", list(SCHOOL), "contact_school.png")
    contact("objects/toys", list(TOYS), "contact_toys.png")
    print("done")
