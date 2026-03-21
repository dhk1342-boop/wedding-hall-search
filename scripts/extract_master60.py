#!/usr/bin/env python3

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_XLSX = ROOT / "웨딩홀 정보.xlsx"
OUTPUT_JS = ROOT / "data.js"

NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def load_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return [
        "".join(node.text or "" for node in shared.iterfind(".//a:t", NS))
        for shared in root.findall("a:si", NS)
    ]


def col_to_index(ref: str) -> int:
    match = re.match(r"([A-Z]+)", ref)
    col = match.group(1) if match else ""
    index = 0
    for char in col:
        index = index * 26 + ord(char) - 64
    return index - 1


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    value = cell.find("a:v", NS)
    cell_type = cell.attrib.get("t")

    if cell_type == "s" and value is not None:
        return shared_strings[int(value.text)]

    if cell_type == "inlineStr":
        inline = cell.find("a:is", NS)
        if inline is None:
            return ""
        return "".join(node.text or "" for node in inline.iterfind(".//a:t", NS))

    return value.text if value is not None else ""


def parse_sheet_rows(archive: zipfile.ZipFile, path: str, shared_strings: list[str]) -> list[list[str]]:
    sheet = ET.fromstring(archive.read(path))
    sheet_data = sheet.find("a:sheetData", NS)
    rows: list[list[str]] = []

    if sheet_data is None:
        return rows

    for row in sheet_data.findall("a:row", NS):
        cells = {}
        max_index = -1
        for cell in row.findall("a:c", NS):
            ref = cell.attrib.get("r", "")
            index = col_to_index(ref)
            cells[index] = cell_value(cell, shared_strings)
            max_index = max(max_index, index)

        rows.append([cells.get(index, "") for index in range(max_index + 1)])

    return rows


def parse_int(value: str) -> int | None:
    cleaned = (value or "").replace(",", "").strip()
    if not cleaned or cleaned in {"-", "#VALUE!"}:
        return None
    try:
        return int(float(cleaned))
    except ValueError:
        return None


def normalize(rows: list[list[str]]) -> list[dict]:
    headers = rows[0]
    records = []

    for row in rows[1:]:
        padded = row + [""] * (len(headers) - len(row))
        item = dict(zip(headers, padded))

        meal_price = parse_int(item.get("식대 평균가(원)", "")) or parse_int(item.get("식대 시작가(원)", ""))
        rent_price = parse_int(item.get("최소 대관료(원)", "")) or parse_int(item.get("대관료(원)", ""))
        minimum_guarantee = parse_int(item.get("최소보증인원", ""))
        max_capacity = parse_int(item.get("최대수용인원", ""))
        ceremony_interval = (
            item.get("예식간격(분)", "")
            or item.get("예식시간", "")
            or item.get("예식 시간", "")
        )
        raw_hall_count = (
            item.get("홀수", "")
            or item.get("홀 수", "")
            or item.get("홀수(개)", "")
        )
        parsed_hall_count = parse_int(raw_hall_count)

        records.append(
            {
                "id": parse_int(item.get("ID", "")),
                "name": item.get("웨딩홀 이름", ""),
                "district": item.get("구", ""),
                "address": item.get("주소", ""),
                "hallType": item.get("홀타입", ""),
                "hallTone": item.get("홀톤(밝은/어두운/혼합)", ""),
                "ceremonyType": item.get("예식형태", ""),
                "ceremonyTime": ceremony_interval,
                "hallCount": parsed_hall_count if parsed_hall_count is not None else (raw_hall_count.strip() or None),
                "menu": item.get("메뉴", ""),
                "mealPrice": meal_price,
                "mealStartPrice": parse_int(item.get("식대 시작가(원)", "")),
                "mealAveragePrice": parse_int(item.get("식대 평균가(원)", "")),
                "mealRange": item.get("식대 범위", ""),
                "minimumGuarantee": minimum_guarantee,
                "maxCapacity": max_capacity,
                "rentPrice": rent_price,
                "baseRentPrice": parse_int(item.get("대관료(원)", "")),
                "minimumRentPrice": parse_int(item.get("최소 대관료(원)", "")),
                "stylingPrice": parse_int(item.get("연출료(원)", "")),
                "flowerPrice": parse_int(item.get("꽃장식(원)", "")),
                "parking": item.get("주차", ""),
                "subwayAccess": item.get("지하철/접근", ""),
                "homepage": item.get("공식 홈페이지", ""),
                "naverMap": item.get("네이버지도", ""),
                "memo": item.get("메모", ""),
                "zone": item.get("권역", ""),
                "tags": item.get("분위기태그", ""),
                "budgetBand": item.get("예산밴드", ""),
                "recommendationGrade": item.get("추천등급", ""),
                "recommendationScore": item.get("추천점수", ""),
            }
        )

    return records


def main() -> None:
    with zipfile.ZipFile(SOURCE_XLSX) as archive:
        shared_strings = load_shared_strings(archive)
        rows = parse_sheet_rows(archive, "xl/worksheets/sheet3.xml", shared_strings)
        records = normalize(rows)

    payload = (
        "// Generated from 웨딩홀 정보.xlsx (Master_60)\n"
        f"window.WEDDING_HALLS = {json.dumps(records, ensure_ascii=False, indent=2)};\n"
    )
    OUTPUT_JS.write_text(payload, encoding="utf-8")
    print(f"Generated {OUTPUT_JS}")


if __name__ == "__main__":
    main()
