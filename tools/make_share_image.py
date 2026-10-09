#!/usr/bin/env python3
"""生成分享预览图 site-src/assets/img/og.png（1200×630，用于微信、QQ、社交平台的链接卡片）。

需要 Playwright（含 Chromium）：python3 tools/make_share_image.py
卡片上的数字（讲数、页数、题数）从 content/topics.yaml 读取。
"""

from pathlib import Path

import yaml
from playwright.sync_api import sync_playwright

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT = REPO_ROOT / "site-src" / "assets" / "img" / "og.png"


def card_html(catalog):
    topics = catalog["topics"]
    lectures = [topic for topic in topics if topic.get("group") != "exercise"]
    exercises = [topic for topic in topics if topic.get("group") == "exercise"]
    lecture_pages = sum(int(topic["pages"]) for topic in lectures)
    problems = sum(int(topic["pages"]) for topic in exercises)
    chips = "".join(f"<span>第 {topic['number']} 讲 · {topic['title']}</span>" for topic in lectures)
    return f"""<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><style>
  body {{ margin: 0; width: 1200px; height: 630px; background: #f5f3ee; font-family: 'Liberation Serif', 'Tinos', 'Noto Serif CJK SC', serif; color: #1d2126; }}
  .card {{ position: absolute; inset: 40px; background: #fffefb; border: 1px solid #e4dfd5; border-radius: 28px; padding: 54px 64px; box-sizing: border-box; }}
  .bar {{ position: absolute; left: 0; top: 54px; bottom: 54px; width: 10px; border-radius: 0 6px 6px 0; background: #2f3b9c; }}
  .eyebrow {{ font: 700 24px 'Liberation Sans', 'Noto Sans CJK SC', sans-serif; letter-spacing: 0.12em; color: #2f3b9c; text-transform: uppercase; }}
  h1 {{ font-size: 76px; margin: 14px 0 10px; letter-spacing: 0.02em; }}
  h1 b {{ color: #2f3b9c; }}
  p {{ font-size: 30px; line-height: 1.5; margin: 0; color: #3d434b; }}
  .stats {{ display: flex; gap: 18px; margin-top: 34px; }}
  .stats div {{ background: #eceefb; color: #232d7a; border-radius: 16px; padding: 12px 22px; font-size: 28px; font-weight: 700; }}
  .chips {{ display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; font: 22px 'Noto Sans CJK SC', sans-serif; color: #6a7078; }}
  .chips span {{ border: 1px solid #e4dfd5; border-radius: 999px; padding: 4px 14px; background: #fff; }}
  .omega {{ position: absolute; right: 60px; top: 46px; width: 120px; height: 120px; border-radius: 28px; background: #2f3b9c; color: #fff; font-size: 84px; font-weight: 700; display: flex; align-items: center; justify-content: center; }}
</style></head><body><div class="card"><div class="bar"></div><div class="omega">Ω</div>
  <div class="eyebrow">{catalog['site']['english']}</div>
  <h1>高等概率论 · <b>逐页精讲</b></h1>
  <p>课件原页对照 · 零基础补课 · 公式推导与例子<br>作业与小测逐题精讲，逐行订正原解答</p>
  <div class="stats"><div>{len(lectures)} 讲 · {lecture_pages} 页课件</div><div>{problems} 道作业与小测题</div><div>中文讲解</div></div>
  <div class="chips">{chips}</div>
</div></body></html>"""


def main():
    catalog = yaml.safe_load((REPO_ROOT / "content" / "topics.yaml").read_text(encoding="utf-8"))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 630})
        page.set_content(card_html(catalog), wait_until="networkidle")
        page.screenshot(path=str(OUTPUT))
        browser.close()
    print(f"已生成 {OUTPUT.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
