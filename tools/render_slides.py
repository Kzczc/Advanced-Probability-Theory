#!/usr/bin/env python3
"""把 slides/ 里的 PDF 课件逐页渲染成网站用的 WebP 页图。

输出：
  docs/assets/slides/<topic>/pNN.webp   网站展示用（宽 1600px，WebP）
  .work/pages/<topic>/pNN.png           写讲义时"看图"用（宽 1400px，PNG，不进仓库）

用法：
  python3 tools/render_slides.py                   # 渲染全部课件
  python3 tools/render_slides.py topic1            # 只渲染某一讲
  python3 tools/render_slides.py --manifest-only   # 只根据已有页图重写尺寸清单 manifest.json
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent

# 每一讲对应的 PDF 文件名
TOPIC_PDFS = {
    "topic1": "Topic1_measure_and_integration_full_noted.pdf",
    "topic2": "Topic2_random_variables_expectation_inequalities.pdf",
    "topic3": "Topic3_borel_cantelli_convergence_radon_nikodym_class_flow.pdf",
    "topic4": "Topic4_product_measure_and_independence.pdf",
}

SITE_IMAGE_WIDTH = 1600      # 网站页图宽度（兼顾高清屏与体积）
READING_IMAGE_WIDTH = 1400   # 写作时看图用的宽度
WEBP_QUALITY = 86


def find_pdf(topic_id: str) -> Path:
    """课件 PDF 放在仓库的 概率论/ 目录（兼容旧的 slides/ 目录）。"""
    for folder in ("概率论", "slides"):
        candidate = REPO_ROOT / folder / TOPIC_PDFS[topic_id]
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"找不到课件 PDF：{TOPIC_PDFS[topic_id]}（应放在 概率论/ 目录）")


def count_pdf_pages(pdf_path: Path) -> int:
    """用 pdfinfo 读取 PDF 页数。"""
    info = subprocess.run(["pdfinfo", str(pdf_path)], capture_output=True, text=True, check=True).stdout
    for line in info.splitlines():
        if line.startswith("Pages:"):
            return int(line.split()[1])
    raise RuntimeError(f"无法读取页数：{pdf_path}")


def render_page_png(pdf_path: Path, page_number: int, width: int, output_png: Path) -> None:
    """把 PDF 的某一页按指定宽度渲染成 PNG。"""
    output_stem = output_png.with_suffix("")
    subprocess.run(
        ["pdftoppm", "-png", "-singlefile", "-f", str(page_number), "-l", str(page_number),
         "-scale-to-x", str(width), "-scale-to-y", "-1", str(pdf_path), str(output_stem)],
        check=True,
    )


def render_topic(topic_id: str) -> None:
    pdf_path = find_pdf(topic_id)
    page_total = count_pdf_pages(pdf_path)
    site_dir = REPO_ROOT / "docs" / "assets" / "slides" / topic_id
    reading_dir = REPO_ROOT / ".work" / "pages" / topic_id
    site_dir.mkdir(parents=True, exist_ok=True)
    reading_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as temp_dir:
        for page_number in range(1, page_total + 1):
            page_tag = f"p{page_number:02d}"
            # 1) 网站用 WebP
            temp_png = Path(temp_dir) / f"{page_tag}.png"
            render_page_png(pdf_path, page_number, SITE_IMAGE_WIDTH, temp_png)
            with Image.open(temp_png) as image:
                image.convert("RGB").save(site_dir / f"{page_tag}.webp", "WEBP", quality=WEBP_QUALITY, method=6)
            # 2) 写作看图用 PNG
            render_page_png(pdf_path, page_number, READING_IMAGE_WIDTH, reading_dir / f"{page_tag}.png")
            print(f"{topic_id} {page_tag} ✓", flush=True)
    write_manifest(topic_id)


def write_manifest(topic_id: str) -> None:
    """记录每张页图的像素尺寸，网页据此预留图片位置，避免加载时页面跳动。"""
    site_dir = REPO_ROOT / "docs" / "assets" / "slides" / topic_id
    manifest = {}
    for image_path in sorted(site_dir.glob("p*.webp")):
        with Image.open(image_path) as image:
            manifest[image_path.stem] = {"width": image.width, "height": image.height}
    (site_dir / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    print(f"{topic_id}: manifest.json（{len(manifest)} 页）")


def main() -> None:
    arguments = sys.argv[1:]
    manifest_only = "--manifest-only" in arguments
    requested = [a for a in arguments if not a.startswith("--")] or list(TOPIC_PDFS)
    for topic_id in requested:
        if topic_id not in TOPIC_PDFS:
            sys.exit(f"未知的 topic：{topic_id}（可选：{', '.join(TOPIC_PDFS)}）")
        if manifest_only:
            write_manifest(topic_id)
        else:
            render_topic(topic_id)


if __name__ == "__main__":
    main()
