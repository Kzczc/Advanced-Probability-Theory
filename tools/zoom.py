#!/usr/bin/env python3
"""把课件某一页的局部放大渲染成 PNG，用来辨认手写笔记和小字公式。

用法：
  python3 tools/zoom.py topic1 36                 # 整页，高分辨率
  python3 tools/zoom.py topic1 36 top             # 上半页
  python3 tools/zoom.py topic1 36 bottom          # 下半页
  python3 tools/zoom.py topic1 36 q1              # 四分之一：q1 左上 / q2 右上 / q3 左下 / q4 右下
  python3 tools/zoom.py topic1 36 0.1,0.2,0.6,0.5 # 自定义区域：x0,y0,x1,y1（占整页宽高的比例）

输出文件路径会打印出来（位于 .work/zoom/，不进仓库），再用看图工具打开即可。
"""

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

TOPIC_PDFS = {
    "topic1": "Topic1_measure_and_integration_full_noted.pdf",
    "topic2": "Topic2_random_variables_expectation_inequalities.pdf",
    "topic3": "Topic3_borel_cantelli_convergence_radon_nikodym_class_flow.pdf",
    "topic4": "Topic4_product_measure_and_independence.pdf",
}

NAMED_REGIONS = {
    "full": (0.0, 0.0, 1.0, 1.0),
    "top": (0.0, 0.0, 1.0, 0.55),
    "bottom": (0.0, 0.45, 1.0, 1.0),
    "left": (0.0, 0.0, 0.55, 1.0),
    "right": (0.45, 0.0, 1.0, 1.0),
    "q1": (0.0, 0.0, 0.55, 0.55),
    "q2": (0.45, 0.0, 1.0, 0.55),
    "q3": (0.0, 0.45, 0.55, 1.0),
    "q4": (0.45, 0.45, 1.0, 1.0),
}

# 放大后区域的目标宽度（像素）：区域越小，放大倍数越高
TARGET_REGION_WIDTH = 1500


def find_pdf(topic_id: str) -> Path:
    """课件 PDF 放在仓库的 概率论/ 目录（兼容旧的 slides/ 目录）。"""
    for folder in ("概率论", "slides"):
        candidate = REPO_ROOT / folder / TOPIC_PDFS[topic_id]
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"找不到课件 PDF：{TOPIC_PDFS[topic_id]}（应放在 概率论/ 目录）")


def page_size_points(pdf_path: Path, page_number: int) -> tuple[float, float]:
    info = subprocess.run(["pdfinfo", "-f", str(page_number), "-l", str(page_number), str(pdf_path)],
                          capture_output=True, text=True, check=True).stdout
    for line in info.splitlines():
        if line.startswith("Page") and "size:" in line:
            parts = line.split("size:")[1].split()
            return float(parts[0]), float(parts[2])
    raise RuntimeError("无法读取页面尺寸")


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    topic_id, page_number = sys.argv[1], int(sys.argv[2])
    region_spec = sys.argv[3] if len(sys.argv) > 3 else "full"
    if region_spec in NAMED_REGIONS:
        x0, y0, x1, y1 = NAMED_REGIONS[region_spec]
    else:
        x0, y0, x1, y1 = (float(v) for v in region_spec.split(","))

    pdf_path = find_pdf(topic_id)
    width_pt, height_pt = page_size_points(pdf_path, page_number)
    # 计算 DPI，使裁剪区域的宽度约为 TARGET_REGION_WIDTH 像素
    dpi = TARGET_REGION_WIDTH / ((x1 - x0) * width_pt / 72.0)
    dpi = max(72, min(dpi, 600))
    full_width_px = width_pt / 72.0 * dpi
    full_height_px = height_pt / 72.0 * dpi

    output_dir = REPO_ROOT / ".work" / "zoom"
    output_dir.mkdir(parents=True, exist_ok=True)
    safe_region = region_spec.replace(",", "_").replace(".", "")
    output_stem = output_dir / f"{topic_id}_p{page_number:02d}_{safe_region}"
    subprocess.run(
        ["pdftoppm", "-png", "-singlefile", "-f", str(page_number), "-l", str(page_number),
         "-r", f"{dpi:.1f}",
         "-x", str(int(x0 * full_width_px)), "-y", str(int(y0 * full_height_px)),
         "-W", str(int((x1 - x0) * full_width_px)), "-H", str(int((y1 - y0) * full_height_px)),
         str(pdf_path), str(output_stem)],
        check=True,
    )
    print(f"{output_stem}.png")


if __name__ == "__main__":
    main()
