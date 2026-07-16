#!/usr/bin/env python3
"""Import LOOTUN catalog products from a CSV file into data/products.json."""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "data" / "products.json"
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif")


def split_list(value: str) -> list[str]:
    return [item.strip() for item in re.split(r"[|;\n]", value or "") if item.strip()]


def split_palette(value: str) -> list[str]:
    return [item.strip() for item in re.split(r"[|,;\n]", value or "") if item.strip()]


def clean_url(value: str) -> str:
    value = (value or "").strip()
    if value in {"준비중", "링크 준비중", "없음", "-"}:
        return ""
    return value


def slugify(value: str, fallback: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or fallback


def sort_key(path: Path) -> list[object]:
    parts = re.split(r"(\d+)", path.name.lower())
    return [int(part) if part.isdigit() else part for part in parts]


def site_path(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def model_asset_slug(model: str) -> str:
    return slugify(model, model.lower())


def find_images_in_dir(directory: Path) -> list[str]:
    if not directory.exists():
        return []
    images = [
        path
        for path in directory.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    ]
    return [site_path(path) for path in sorted(images, key=sort_key)]


def find_thumbnail_images(model: str, thumbnail_dir: str = "") -> list[str]:
    directory = (
        ROOT / thumbnail_dir
        if thumbnail_dir
        else ROOT / "assets" / "images" / "products" / model_asset_slug(model) / "thumbnail"
    )
    return find_images_in_dir(directory)


def find_detail_images(model: str, detail_dir: str = "") -> list[str]:
    directory = (
        ROOT / detail_dir
        if detail_dir
        else ROOT / "assets" / "images" / "products" / model_asset_slug(model) / "detail"
    )
    return find_images_in_dir(directory)


def compact(value):
    if isinstance(value, dict):
        return {key: compact(item) for key, item in value.items() if compact(item) not in ("", [], {})}
    if isinstance(value, list):
        return [compact(item) for item in value if compact(item) not in ("", [], {})]
    return value


def row_to_product(row: dict[str, str], index: int) -> dict:
    model = (row.get("model") or "").strip()
    if not model:
        raise SystemExit(f"Missing model in CSV row {index}. Model number is the product key.")

    thumbnail_images = split_list(row.get("thumbnail_images") or row.get("thumbnails") or "")
    if not thumbnail_images:
        legacy_image = (row.get("image") or "").strip()
        thumbnail_images = [legacy_image] if legacy_image else []
    if not thumbnail_images:
        thumbnail_images = find_thumbnail_images(model, (row.get("thumbnail_dir") or "").strip())

    detail_images = split_list(row.get("detail_images") or "")
    if not detail_images:
        detail_images = find_detail_images(model, (row.get("detail_dir") or "").strip())

    product = {
        "category": (row.get("category") or "").strip(),
        "model": model,
        "name": (row.get("name") or "").strip(),
        "summary": (row.get("summary") or "").strip(),
        "description": (row.get("description") or "").strip(),
        "thumbnailImages": thumbnail_images,
        "detailImages": detail_images,
        "links": {
            "coupang": clean_url(row.get("coupang_url") or ""),
            "naver": clean_url(row.get("naver_url") or ""),
        },
        "tags": split_list(row.get("tags") or ""),
        "specs": split_list(row.get("specs") or ""),
        "palette": split_palette(row.get("palette") or ""),
    }
    return compact(product)


def category_from_row(row: dict[str, str]) -> dict:
    name = (row.get("category") or "").strip()
    if not name:
        return {}
    slug = (row.get("category_slug") or "").strip() or slugify(name, name)
    return compact(
        {
            "name": name,
            "slug": slug,
            "description": (row.get("category_description") or "").strip(),
        }
    )


def load_data(path: Path) -> dict:
    if not path.exists():
        return {"categories": [], "products": []}
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    last_error: UnicodeDecodeError | None = None
    for encoding in ("utf-8-sig", "cp949", "utf-8"):
        try:
            text = path.read_text(encoding=encoding)
        except UnicodeDecodeError as error:
            last_error = error
            continue
        return list(csv.DictReader(io.StringIO(text)))
    raise SystemExit(f"Could not read CSV encoding: {last_error}")


def import_products(csv_path: Path, data_path: Path, replace: bool) -> tuple[int, int, int]:
    data = load_data(data_path)
    rows = read_csv_rows(csv_path)

    products = [row_to_product(row, index + 1) for index, row in enumerate(rows)]
    products = [
        product
        for product in products
        if product.get("model") and product.get("name") and product.get("category")
    ]

    seen: set[str] = set()
    duplicate_models = sorted(
        product["model"] for product in products if product["model"] in seen or seen.add(product["model"])
    )
    if duplicate_models:
        raise SystemExit(f"Duplicate model in CSV: {', '.join(duplicate_models)}")

    if replace:
        data["products"] = products
    else:
        by_model = {
            product["model"]: product
            for product in data.get("products", [])
            if product.get("model")
        }
        for product in products:
            by_model[product["model"]] = product
        data["products"] = list(by_model.values())

    category_by_name = {category["name"]: category for category in data.get("categories", [])}
    for row in rows:
        category = category_from_row(row)
        if category:
            existing = category_by_name.get(category["name"], {})
            category_by_name[category["name"]] = {**existing, **category}
    data["categories"] = list(category_by_name.values())

    data_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return len(products), len(data["products"]), len(data["categories"])


def main() -> None:
    parser = argparse.ArgumentParser(description="Bulk import LOOTUN catalog products from CSV.")
    parser.add_argument("csv", type=Path, help="CSV file path, for example imports/products-template.csv")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA, help="products.json path")
    parser.add_argument("--replace", action="store_true", help="replace all products instead of upserting by model")
    args = parser.parse_args()

    imported, total_products, total_categories = import_products(args.csv, args.data, args.replace)
    print(
        f"Imported {imported} products. "
        f"Catalog now has {total_products} products and {total_categories} categories."
    )


if __name__ == "__main__":
    main()
