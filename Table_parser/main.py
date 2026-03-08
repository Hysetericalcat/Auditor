"""
Table Structure Extractor v2
==============================
Phase 1 : Preprocessing
          grayscale → invert → h-mask → v-mask → grid → contours → rectangles

Phase 2 : Table Extraction
          find n biggest rectangles → crop each

Phase 3 : Row/Col Labelling (per cropped table)
          - row label : rank by y-band (top → bottom)
          - col label : rank by x-band (left → right)
          - JSON : { "x{x}_y{y}_w{w}_h{h}" : {"row": R, "col": C}, ... }

Phase 4 : Cropping
          crop every box → save as x{x}_y{y}_w{w}_h{h}.jpg

Two public functions
─────────────────────
  extract_to_json(image_path, json_path, ...)
  crop_from_json(json_path, output_dir, ...)
"""

import cv2
import numpy as np
import json
from pathlib import Path


# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1 — Preprocessing
# ─────────────────────────────────────────────────────────────────────────────

def _load(path: str):
    img = cv2.imread(path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {path}")
    return img


def _detect_rects(
    img,
    min_area : int = 500,
    min_w    : int = 20,
    min_h    : int = 10,
    h_scale  : int = 40,
    v_scale  : int = 40,
) -> list:
    """Full Phase 1 pipeline on any image. Returns deduplicated (x,y,w,h) list."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    inv  = cv2.bitwise_not(gray)

    # Horizontal mask
    hk   = max(img.shape[1] // h_scale, 10)
    hm   = cv2.morphologyEx(inv, cv2.MORPH_OPEN,
                             cv2.getStructuringElement(cv2.MORPH_RECT, (hk, 1)),
                             iterations=2)
    # Vertical mask
    vk   = max(img.shape[0] // v_scale, 10)
    vm   = cv2.morphologyEx(inv, cv2.MORPH_OPEN,
                             cv2.getStructuringElement(cv2.MORPH_RECT, (1, vk)),
                             iterations=2)
    # Grid
    grid = cv2.add(hm, vm)
    grid = cv2.dilate(grid,
                      cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)),
                      iterations=1)

    cnts, _ = cv2.findContours(grid, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    rects = []
    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        if w >= min_w and h >= min_h and w * h >= min_area:
            rects.append((x, y, w, h))

    # Deduplicate — tolerance is 0.5% of image diagonal (scale-relative)
    diag = (img.shape[0]**2 + img.shape[1]**2) ** 0.5
    tol  = max(2, int(diag * 0.005))
    unique = []
    for r in rects:
        if not any(abs(r[0]-u[0])<=tol and abs(r[1]-u[1])<=tol and
                   abs(r[2]-u[2])<=tol and abs(r[3]-u[3])<=tol for u in unique):
            unique.append(r)
    return unique


def _safe_crop(img, rect, pad=2):
    x, y, w, h = rect
    ih, iw = img.shape[:2]
    return img[max(y-pad,0):min(y+h+pad,ih),
               max(x-pad,0):min(x+w+pad,iw)].copy()


# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2 — Table Extraction
# ─────────────────────────────────────────────────────────────────────────────

def _n_biggest(rects, n, img_w, img_h, max_ratio=0.85):
    """
    Return n biggest rects by area, excluding page-border rects
    (those whose width OR height exceeds max_ratio of the image dimension).
    """
    filtered = [
        r for r in rects
        if r[2] < img_w * max_ratio
        and r[3] < img_h * max_ratio
    ]
    return sorted(filtered, key=lambda r: r[2]*r[3], reverse=True)[:n]


# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3 — Row / Col Labelling
# ─────────────────────────────────────────────────────────────────────────────

def _approx(a, b, tol):
    return abs(a - b) <= tol


def _assign_row_labels(cells: list, tol: int) -> dict:
    """
    Group cells by y-band (top → bottom) → row 1, 2, 3 ...
    Tolerance is the larger of coord_tol or 1% of the max y-span.
    Returns { rect: row_number }
    """
    if not cells:
        return {}

    y_span   = max(r[1] for r in cells) - min(r[1] for r in cells)
    y_tol    = max(tol, int(y_span * 0.01))

    sorted_cells = sorted(cells, key=lambda r: r[1])
    bands, labels = [], {}
    for r in sorted_cells:
        if bands and _approx(r[1], bands[-1][0][1], y_tol):
            bands[-1].append(r)
        else:
            bands.append([r])
    for row_num, band in enumerate(bands, start=1):
        for r in band:
            labels[r] = row_num
    return labels


def _assign_col_labels(cells: list, tol: int) -> dict:
    """
    Group cells by x-band (left → right) → col 1, 2, 3 ...
    Tolerance is the larger of coord_tol or 1% of the max x-span,
    so col grouping stays robust across different image scales.
    Returns { rect: col_number }
    """
    if not cells:
        return {}

    x_span   = max(r[0] for r in cells) - min(r[0] for r in cells)
    x_tol    = max(tol, int(x_span * 0.01))

    sorted_cells = sorted(cells, key=lambda r: r[0])
    bands, labels = [], {}
    for r in sorted_cells:
        if bands and _approx(r[0], bands[-1][0][0], x_tol):
            bands[-1].append(r)
        else:
            bands.append([r])
    for col_num, band in enumerate(bands, start=1):
        for r in band:
            labels[r] = col_num
    return labels


def _build_structure(cells: list, tol: int) -> dict:
    """
    Assign row + col to every cell.
    Returns { "x{x}_y{y}_w{w}_h{h}" : {"row": R, "col": C} }
    sorted by (row, col).
    """
    row_labels = _assign_row_labels(cells, tol)
    col_labels = _assign_col_labels(cells, tol)

    structure = {}
    for r in cells:
        key = f"x{r[0]}_y{r[1]}_w{r[2]}_h{r[3]}"
        structure[key] = {
            "row" : row_labels[r],
            "col" : col_labels[r],
        }

    # Sort by (row, col) for clean JSON output
    structure = dict(
        sorted(structure.items(),
               key=lambda kv: (kv[1]["row"], kv[1]["col"]))
    )
    return structure


def _process_crop(img, tol, min_area, min_w, min_h, h_scale, v_scale) -> dict:
    rects = _detect_rects(img, min_area, min_w, min_h, h_scale, v_scale)
    if not rects:
        return {}

    # Drop the biggest rect (= table border)
    biggest = max(rects, key=lambda r: r[2]*r[3])
    cells   = [r for r in rects if r != biggest]

    print(f"      Cells (ex border) : {len(cells)}")
    return _build_structure(cells, tol)


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC FUNCTION 1 — extract_to_json
# ─────────────────────────────────────────────────────────────────────────────

def extract_to_json(
    image_path : str,
    json_path  : str,
    n_tables   : int   = 1,
    min_area   : int   = 500,
    min_w      : int   = 20,
    min_h      : int   = 10,
    h_scale    : int   = 40,
    v_scale    : int   = 40,
    coord_tol  : int   = 6,
) -> list:
    """
    Phases 1–3. Writes structure.json and returns parsed list.

    JSON shape:
    [
      {
        "table_index" : 1,
        "image_path"  : "...",
        "table_rect"  : {"x":…,"y":…,"w":…,"h":…},
        "structure"   : {
          "x3_y3_w463_h28"   : {"row": 1, "col": 1},
          "x467_y3_w518_h27" : {"row": 1, "col": 2},
          "x3_y32_w463_h52"  : {"row": 2, "col": 1},
          ...
        }
      }
    ]
    """
    print(f"\n{'='*60}")
    print(f" [1/2] extract_to_json")
    print(f"       image  : {image_path}")
    print(f"       output : {json_path}")
    print(f"{'='*60}")

    img         = _load(image_path)
    all_rects   = _detect_rects(img, min_area, min_w, min_h, h_scale, v_scale)
    ih, iw      = img.shape[:2]
    table_rects = _n_biggest(all_rects, n_tables, iw, ih)

    print(f" Rects found     : {len(all_rects)}")
    print(f" Tables selected : {len(table_rects)}")

    output = []
    for t_idx, tr in enumerate(table_rects, start=1):
        print(f"\n  Table {t_idx}: {tr}")
        crop      = _safe_crop(img, tr, pad=0)
        structure = _process_crop(crop, coord_tol, min_area, min_w,
                                   min_h, h_scale, v_scale)
        output.append({
            "table_index" : t_idx,
            "image_path"  : str(Path(image_path).resolve()),
            "table_rect"  : {"x": tr[0], "y": tr[1], "w": tr[2], "h": tr[3]},
            "structure"   : structure,
        })

    Path(json_path).parent.mkdir(parents=True, exist_ok=True)
    Path(json_path).write_text(json.dumps(output, indent=2))
    print(f"\n JSON saved → {json_path}")
    return output


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC FUNCTION 2 — crop_from_json
# ─────────────────────────────────────────────────────────────────────────────

def crop_from_json(
    json_path  : str,
    output_dir : str,
    image_path : str = None,
    pad        : int = 2,
) -> None:
    """
    Phase 4. Reads structure.json → crops every box → saves as x_y_w_h.jpg.

    Folder layout:
      output_dir/
        table_01/
          x3_y3_w463_h28.jpg
          x467_y3_w518_h27.jpg
          x3_y32_w463_h52.jpg
          ...
    """
    print(f"\n{'='*60}")
    print(f" [2/2] crop_from_json")
    print(f"       json   : {json_path}")
    print(f"       output : {output_dir}")
    print(f"{'='*60}")

    structure = json.loads(Path(json_path).read_text())

    for table in structure:
        t_idx = table["table_index"]
        src   = image_path or table.get("image_path")
        if not src:
            raise ValueError(f"No image_path for table {t_idx}.")

        img = cv2.imread(src)
        if img is None:
            raise FileNotFoundError(f"Image not found: {src}")

        # Crop to table region so coordinates are local
        tr  = table["table_rect"]
        img = _safe_crop(img, (tr["x"], tr["y"], tr["w"], tr["h"]), pad=0)

        table_dir = Path(output_dir) / f"table_{t_idx:02d}"
        table_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n  Table {t_idx}  ({len(table['structure'])} boxes)")

        # Save the full table crop
        tr_crop = _safe_crop(img, (0, 0, tr["w"], tr["h"]), pad=0)
        cv2.imwrite(str(table_dir / f"x{tr['x']}_y{tr['y']}_w{tr['w']}_h{tr['h']}.jpg"), tr_crop)

        for key, meta in table["structure"].items():
            # Parse dimensions from key
            parts = {}
            for token in key.split("_"):
                parts[token[0]] = int(token[1:])
            x, y, w, h = parts["x"], parts["y"], parts["w"], parts["h"]

            crop     = _safe_crop(img, (x, y, w, h), pad)
            out_path = table_dir / f"{key}.jpg"
            cv2.imwrite(str(out_path), crop)

    # ── Portion extraction ───────────────────────────────────────────────────
    # Step 1: all tables already extracted above
    # Step 2: map out boundaries using ALL table rects
    # Step 3: crop only the strips between tables

    full_img = _load(image_path or structure[0]["image_path"])
    img_h    = full_img.shape[0]
    img_w    = full_img.shape[1]

    # Step 2 — collect ALL table rects sorted top→bottom
    all_table_rects = sorted(
        [t["table_rect"] for t in structure],
        key=lambda r: r["y"]
    )

    # Step 3 — build between-table strips only
    # strips = [(0, t1.y), (t1.y+h, t2.y), (t2.y+h, img_h)]
    strip_bounds = []
    prev_end = 0
    for tr in all_table_rects:
        strip_bounds.append((prev_end, tr["y"]))       # gap before this table
        prev_end = tr["y"] + tr["h"]
    strip_bounds.append((prev_end, img_h))             # gap after last table

    # Crop and save each strip
    for y1, y2 in strip_bounds:
        if y2 <= y1:
            continue
        strip = full_img[y1:y2, 0:img_w]
        if strip.size == 0:
            continue
        out_path = Path(output_dir) / f"x0_y{y1}_w{img_w}_h{y2-y1}.jpg"
        cv2.imwrite(str(out_path), strip)
        print(f"  portion  x0_y{y1}_w{img_w}_h{y2-y1}.jpg")
    print(f"\n{'='*60}")
    print(f" Directory Map  →  {output_dir}/")
    print(f"{'='*60}")
    for item in sorted(Path(output_dir).rglob("*")):
        depth  = len(item.relative_to(output_dir).parts) - 1
        prefix = "  " * depth + ("📁 " if item.is_dir() else "🖼  ")
        print(f"{prefix}{item.name}")
    print(f"{'='*60}")
    print(f"\n  Done → {output_dir}/")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import argparse

    if len(sys.argv) == 1:

        # ✏️  Edit these, then run:  python3 table_extractor_v2.py
        IMAGE_PATH = "test.png"
        N_TABLES   = 2
        OUTPUT_DIR = "output"
        JSON_PATH  = f"{OUTPUT_DIR}/structure.json"

        extract_to_json(
            image_path = IMAGE_PATH,
            json_path  = JSON_PATH,
            n_tables   = N_TABLES,
        )

        crop_from_json(
            json_path  = JSON_PATH,
            output_dir = OUTPUT_DIR,
        )

    else:
        parser = argparse.ArgumentParser(description="Table Extractor v2")
        parser.add_argument("image",         type=str)
        parser.add_argument("--n_tables",    type=int,   default=1)
        parser.add_argument("--min_area",    type=int,   default=500)
        parser.add_argument("--min_w",       type=int,   default=20)
        parser.add_argument("--min_h",       type=int,   default=10)
        parser.add_argument("--h_scale",     type=int,   default=40)
        parser.add_argument("--v_scale",     type=int,   default=40)
        parser.add_argument("--coord_tol",   type=int,   default=6)
        parser.add_argument("--output_dir",  type=str,   default="output")
        parser.add_argument("--json_path",   type=str,   default=None)
        parser.add_argument("--pad",         type=int,   default=2)
        parser.add_argument("--json_only",   action="store_true")
        parser.add_argument("--crop_only",   action="store_true")
        args = parser.parse_args()

        json_path = args.json_path or f"{args.output_dir}/structure.json"

        if not args.crop_only:
            extract_to_json(
                image_path = args.image,
                json_path  = json_path,
                n_tables   = args.n_tables,
                min_area   = args.min_area,
                min_w      = args.min_w,
                min_h      = args.min_h,
                h_scale    = args.h_scale,
                v_scale    = args.v_scale,
                coord_tol  = args.coord_tol,
            )

        if not args.json_only:
            crop_from_json(
                json_path  = json_path,
                output_dir = args.output_dir,
                pad        = args.pad,
            )