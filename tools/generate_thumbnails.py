#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
photos/ 아래 이미지를 thumbnails/ 폴더로 축소 저장합니다.

예시:
    python tools/generate_thumbnails.py
    python tools/generate_thumbnails.py --max-size 960 --quality 85
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

from PIL import Image


SUPPORTED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def iter_images(folder: Path) -> Iterable[Path]:
  for path in folder.glob("*"):
    if path.is_file() and path.suffix.lower() in SUPPORTED_EXT:
      yield path


def ensure_rgb(image: Image.Image) -> Image.Image:
  if image.mode in ("RGB", "L"):
    return image
  return image.convert("RGB")


def generate_thumbnail(source: Path, target: Path, max_size: int, quality: int) -> None:
  target.parent.mkdir(parents=True, exist_ok=True)
  with Image.open(source) as img:
    img = ensure_rgb(img)
    img.thumbnail((max_size, max_size))
    save_kwargs = {"quality": quality}
    if target.suffix.lower() == ".webp":
      save_kwargs["method"] = 6
    img.save(target, **save_kwargs)


def main() -> None:
  repo_root = Path(__file__).resolve().parent.parent

  parser = argparse.ArgumentParser(description="Create lightweight thumbnails from photos/")
  parser.add_argument("--source", type=Path, default=repo_root / "photos", help="원본 이미지 경로 (기본: ./photos)")
  parser.add_argument("--output", type=Path, default=repo_root / "thumbnails", help="썸네일 출력 경로 (기본: ./thumbnails)")
  parser.add_argument("--max-size", type=int, default=512, help="긴 변 기준 최대 픽셀 (기본: 900)")
  parser.add_argument("--quality", type=int, default=60, help="저장 품질 (기본: 82)")
  parser.add_argument("--force", action="store_true", help="기존 썸네일이 최신이어도 모두 다시 생성")
  args = parser.parse_args()

  source_dir = args.source.resolve()
  output_dir = args.output.resolve()
  

  if not source_dir.exists():
    raise SystemExit(f"[error] source directory not found: {source_dir}")

  generated = 0
  skipped = 0

  for src in iter_images(source_dir):
    rel = src.relative_to(source_dir)
    dst = output_dir / rel

    if not args.force and dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
      skipped += 1
      continue

    generate_thumbnail(src, dst, args.max_size, args.quality)
    generated += 1

  print(f"[done] generated: {generated}, skipped(up-to-date): {skipped}")
  print(f"[info] thumbnails saved to: {output_dir}")


if __name__ == "__main__":
  main()
