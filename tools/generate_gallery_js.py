#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
이미지 비율을 보고 galleryImages JS 데이터를 자동으로 생성하는 스크립트.

사용 예시:
    python generate_gallery_js.py \
        --img-dir ./assets/gallery \
        --output ./src/gallery-images.js
"""

from __future__ import annotations
from pathlib import Path
from dataclasses import dataclass, asdict
import random
from typing import List
import argparse
import json

from PIL import Image  # pip install pillow


SUPPORTED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


@dataclass
class GalleryItem:
    src: str
    variant: str | None
    alt: str
    aspect: float


def choose_variant(width: int, height: int) -> str | None:
    """이미지 가로세로 비율에 따라 wide / tall / 기본 결정."""
    if height == 0:
        return None

    r = width / height  # >1 이면 가로로 긴 사진

    # 기준값은 취향 따라 조정하면 됨
    if r >= 1:
        # 아주 가로로 긴 사진 → wide
        return "wide"
    elif r <= 1:
        # 세로로 꽤 긴 사진 → tall
        return "tall"
    else:
        # 적당한 직사각형 / 정방형 → 기본
        return None


def default_alt_from_filename(path: Path) -> str:
    """파일 이름에서 간단한 alt 텍스트 생성 (원하면 여기 커스텀)."""
    stem = path.stem
    # 언더바/대시를 공백으로 바꾸기
    return stem.replace("_", " ").replace("-", " ")


def build_gallery_items(img_dir: Path, prefix: str = "") -> List[GalleryItem]:
    items: List[GalleryItem] = []
    f_list = img_dir.glob("*")
    #suffle
    
    f_list = list(f_list)
    random.shuffle(f_list)
    script_dir = Path(__file__).parent.resolve()
    root_dir = script_dir.parent.resolve()
    
    for p in f_list:
        if not p.is_file():
            continue
        if p.suffix.lower() not in SUPPORTED_EXT:
            continue

        with Image.open(p) as im:
            w, h = im.size

        variant = choose_variant(w, h)
        rel_path = p.resolve().relative_to(root_dir).as_posix()

        # 브라우저에서 불러올 때 /assets/... 이런 식이면 prefix에 "/assets" 넣기
        prefix = Path(prefix)
        src = f"{prefix}/{rel_path}"

        item = GalleryItem(
            src=src,
            variant=variant,
            alt=default_alt_from_filename(p),
            aspect=round(w / h, 4),
        )
        items.append(item)

    return items


def write_js(items: List[GalleryItem], output: Path, export_default: bool = True) -> None:
    """galleryImages JS 파일 작성."""
    data = [asdict(i) for i in items]

    # JS 코드 문자열 생성
    js = []
    js.append("// 자동 생성된 갤러리 데이터 (generate_gallery_js.py 에서 생성)\n")
    js.append("galleryImages = ")
    js.append(json.dumps(data, ensure_ascii=False, indent=2))
    js.append(";\n")

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("".join(js), encoding="utf-8")
    print(f"[info] wrote {output} ({len(items)} images)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--img-dir", type=str, required=True,
                        help="이미지들이 들어있는 루트 디렉토리")
    parser.add_argument("--output", type=str, required=True,
                        help="galleryImages 를 써 넣을 JS 파일 경로")
    parser.add_argument("--src-prefix", type=str, default="",
                        help="브라우저에서 불러올 때 앞에 붙일 prefix (예: /assets/)")
    args = parser.parse_args()

    img_dir = Path(args.img_dir).resolve()
    output = Path(args.output).resolve()

    items = build_gallery_items(img_dir, prefix=args.src_prefix)
    write_js(items, output)


if __name__ == "__main__":
    main()