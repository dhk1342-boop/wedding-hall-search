let halls = Array.isArray(window.WEDDING_HALLS) ? [...window.WEDDING_HALLS] : [];
const builtinHalls = Array.isArray(window.WEDDING_HALLS) ? [...window.WEDDING_HALLS] : [];
const DEFAULT_WORKBOOK_FILES = ["웨딩홀 정보.xlsx", "seoul_wedding_master_final_pro.xlsx"];
const TEMPLATE_SHEET_NAME = "웨딩홀_추가양식";

const mealPriceInput = document.querySelector("#mealPriceInput");
const guestCountInput = document.querySelector("#guestCountInput");
const rentPriceInput = document.querySelector("#rentPriceInput");
const districtSelect = document.querySelector("#districtSelect");
const sortSelect = document.querySelector("#sortSelect");
const resetButton = document.querySelector("#resetButton");
const excelUpload = document.querySelector("#excelUpload");
const reloadBuiltinButton = document.querySelector("#reloadBuiltinButton");
const dataSourceLabel = document.querySelector("#dataSourceLabel");
const uploadStatus = document.querySelector("#uploadStatus");

const totalCount = document.querySelector("#totalCount");
const resultCount = document.querySelector("#resultCount");
const avgMealPrice = document.querySelector("#avgMealPrice");
const avgRentPrice = document.querySelector("#avgRentPrice");
const avgTotalCost = document.querySelector("#avgTotalCost");
const minTotalCost = document.querySelector("#minTotalCost");
const pricingBasis = document.querySelector("#pricingBasis");
const costFormulaText = document.querySelector("#costFormulaText");
const costBasisBadge = document.querySelector("#costBasisBadge");
const activeSummary = document.querySelector("#activeSummary");
const cardList = document.querySelector("#cardList");
const resultTableBody = document.querySelector("#resultTableBody");

const numberFormatter = new Intl.NumberFormat("ko-KR");
const textDecoder = new TextDecoder("utf-8");

const formatMoney = (value) => (typeof value === "number" && Number.isFinite(value) ? `${numberFormatter.format(value)}원` : "-");
const formatCount = (value) => (typeof value === "number" && Number.isFinite(value) ? `${numberFormatter.format(value)}명` : "-");

const getRecommendationValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : -1;
};

const parseIntValue = (value) => {
  const normalized = String(value ?? "")
    .replaceAll(",", "")
    .trim();

  if (!normalized || normalized === "-" || normalized === "#VALUE!") {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const hasMeaningfulValue = (value) => value !== "" && value !== null && value !== undefined;

const getElementsByLocalName = (parent, name) => Array.from(parent.getElementsByTagNameNS("*", name));

const getFirstChildByLocalName = (parent, name) =>
  Array.from(parent.childNodes).find((node) => node.nodeType === Node.ELEMENT_NODE && node.localName === name) || null;

const colToIndex = (ref) => {
  const match = String(ref).match(/[A-Z]+/);
  const column = match ? match[0] : "";
  let index = 0;
  for (const char of column) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
};

const sanitizeText = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[char]));

const getEstimateGuestCount = (hall, guestCount) => {
  if (guestCount) {
    return guestCount;
  }
  return hall.minimumGuarantee ?? null;
};

const buildHallKey = (hall) =>
  [hall.name, hall.address || hall.district || ""]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .join("::");

const mergeHallRecord = (existing, incoming) => {
  const merged = { ...existing };

  Object.entries(incoming).forEach(([key, value]) => {
    if (hasMeaningfulValue(value)) {
      merged[key] = value;
    }
  });

  merged.id = existing.id ?? incoming.id ?? null;
  return merged;
};

const mergeHallDatasets = (baseHalls, additions) => {
  const merged = [...baseHalls];
  const indexByKey = new Map();
  let maxId = merged.reduce((max, hall) => Math.max(max, hall.id ?? 0), 0);
  let addedCount = 0;
  let updatedCount = 0;

  merged.forEach((hall, index) => {
    indexByKey.set(buildHallKey(hall), index);
  });

  additions.forEach((hall) => {
    if (!String(hall.name ?? "").trim()) {
      return;
    }

    const key = buildHallKey(hall);
    const existingIndex = indexByKey.get(key);

    if (existingIndex !== undefined) {
      merged[existingIndex] = mergeHallRecord(merged[existingIndex], hall);
      updatedCount += 1;
      return;
    }

    maxId += 1;
    const nextHall = { ...hall, id: hall.id ?? maxId };
    merged.push(nextHall);
    indexByKey.set(key, merged.length - 1);
    addedCount += 1;
  });

  return { halls: merged, addedCount, updatedCount };
};

const getEstimatedTotalCost = (hall, guestCount) => {
  const effectiveGuests = getEstimateGuestCount(hall, guestCount);
  if (!effectiveGuests || !hall.mealPrice) {
    return null;
  }

  return (
    effectiveGuests * hall.mealPrice +
    (hall.rentPrice ?? 0) +
    (hall.stylingPrice ?? 0) +
    (hall.flowerPrice ?? 0)
  );
};

const getCostFormulaLabel = (hall, guestCount) => {
  const effectiveGuests = getEstimateGuestCount(hall, guestCount);
  if (!effectiveGuests || !hall.mealPrice) {
    return "산출 정보 부족";
  }

  const parts = [`${numberFormatter.format(effectiveGuests)}명 x ${formatMoney(hall.mealPrice)}`];

  if (hall.rentPrice) {
    parts.push(`대관료 ${formatMoney(hall.rentPrice)}`);
  }
  if (hall.stylingPrice) {
    parts.push(`연출료 ${formatMoney(hall.stylingPrice)}`);
  }
  if (hall.flowerPrice) {
    parts.push(`꽃장식 ${formatMoney(hall.flowerPrice)}`);
  }

  return parts.join(" + ");
};

const getFilters = () => ({
  mealMax: Number(mealPriceInput.value) || null,
  guests: Number(guestCountInput.value) || null,
  rentMax: Number(rentPriceInput.value) || null,
  district: districtSelect.value,
  sort: sortSelect.value,
});

const matchesFilters = (hall, filters) => {
  if (filters.mealMax && (!hall.mealPrice || hall.mealPrice > filters.mealMax)) {
    return false;
  }

  if (filters.guests) {
    if (!hall.minimumGuarantee || hall.minimumGuarantee > filters.guests) {
      return false;
    }
    if (hall.maxCapacity && hall.maxCapacity < filters.guests) {
      return false;
    }
  }

  if (filters.rentMax && (!hall.rentPrice || hall.rentPrice > filters.rentMax)) {
    return false;
  }

  if (filters.district && hall.district !== filters.district) {
    return false;
  }

  return true;
};

const sortHalls = (items, filters) => {
  const sorted = [...items];

  switch (filters.sort) {
    case "mealAsc":
      sorted.sort((a, b) => (a.mealPrice ?? Infinity) - (b.mealPrice ?? Infinity));
      break;
    case "guaranteeAsc":
      sorted.sort((a, b) => (a.minimumGuarantee ?? Infinity) - (b.minimumGuarantee ?? Infinity));
      break;
    case "rentAsc":
      sorted.sort((a, b) => (a.rentPrice ?? Infinity) - (b.rentPrice ?? Infinity));
      break;
    case "totalAsc":
      sorted.sort(
        (a, b) => (getEstimatedTotalCost(a, filters.guests) ?? Infinity) - (getEstimatedTotalCost(b, filters.guests) ?? Infinity)
      );
      break;
    case "score":
    default:
      sorted.sort((a, b) => getRecommendationValue(b.recommendationScore) - getRecommendationValue(a.recommendationScore));
      break;
  }

  return sorted;
};

const buildSummary = (filters, results) => {
  const parts = [];

  if (filters.mealMax) {
    parts.push(`식대 ${formatMoney(filters.mealMax)} 이하`);
  }
  if (filters.guests) {
    parts.push(`하객 ${formatCount(filters.guests)} 기준 가능`);
  }
  if (filters.rentMax) {
    parts.push(`대관료 ${formatMoney(filters.rentMax)} 이하`);
  }
  if (filters.district) {
    parts.push(`${filters.district} 한정`);
  }

  if (!parts.length) {
    return `전체 ${halls.length}개 웨딩홀을 보고 있습니다. 조건을 넣으면 식대, 보증인원, 대관료, 총비용 기준으로 바로 추려집니다.`;
  }

  return `${parts.join(" / ")} 조건으로 ${results.length}개 웨딩홀이 검색되었습니다.`;
};

const rebuildDistrictOptions = () => {
  const selected = districtSelect.value;
  const districts = [...new Set(halls.map((hall) => hall.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));

  districtSelect.innerHTML = '<option value="">전체</option>';
  districts.forEach((district) => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    districtSelect.append(option);
  });

  if (districts.includes(selected)) {
    districtSelect.value = selected;
  }
};

const renderCards = (items, guestCount) => {
  if (!items.length) {
    cardList.innerHTML = `
      <div class="empty-state">
        조건에 맞는 웨딩홀이 없습니다.<br />
        식대나 대관료 상한을 조금 넓혀보거나 지역 제한을 해제해보세요.
      </div>
    `;
    return;
  }

  cardList.innerHTML = items
    .slice(0, 12)
    .map((hall, index) => {
      const estimatedGuests = getEstimateGuestCount(hall, guestCount);
      const totalCost = getEstimatedTotalCost(hall, guestCount);

      return `
        <article class="hall-card" style="animation-delay:${index * 0.04}s">
          <div class="card-top">
            <span class="badge">${sanitizeText(hall.zone || "기타")} · ${sanitizeText(hall.hallType || "정보없음")}</span>
            <span class="badge">추천 ${sanitizeText(hall.recommendationGrade || "-")}</span>
          </div>
          <h3>${sanitizeText(hall.name)}</h3>
          <p class="hall-address">${sanitizeText(hall.address || "-")}</p>

          <div class="featured-price">
            <span class="featured-label">예상 총비용</span>
            <strong class="featured-value">${formatMoney(totalCost)}</strong>
          </div>

          <p class="formula-text">${sanitizeText(getCostFormulaLabel(hall, guestCount))}</p>

          <div class="cost-breakdown">
            <span>기준 인원 ${formatCount(estimatedGuests)}</span>
            <span>식대 ${formatMoney(hall.mealPrice)}</span>
            <span>대관료 ${formatMoney(hall.rentPrice)}</span>
          </div>

          <div class="meta">
            <span>최소보증 ${formatCount(hall.minimumGuarantee)}</span>
            <span>최대수용 ${formatCount(hall.maxCapacity)}</span>
            <span>${sanitizeText(hall.menu || "메뉴 미상")}</span>
            <span>${sanitizeText(hall.hallTone || "톤 정보 없음")}</span>
          </div>

          <p class="card-note">${sanitizeText(hall.tags || hall.memo || "메모 정보가 없습니다.")}</p>

          <div class="card-links">
            ${hall.homepage ? `<a href="${sanitizeText(hall.homepage)}" target="_blank" rel="noreferrer">홈페이지</a>` : ""}
            ${hall.naverMap ? `<a href="${sanitizeText(hall.naverMap)}" target="_blank" rel="noreferrer">네이버지도</a>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
};

const renderTable = (items, guestCount) => {
  if (!items.length) {
    resultTableBody.innerHTML = `
      <tr>
        <td colspan="9">검색 결과가 없습니다.</td>
      </tr>
    `;
    return;
  }

  resultTableBody.innerHTML = items
    .map((hall) => `
      <tr>
        <td class="table-name">${sanitizeText(hall.name)}</td>
        <td>${sanitizeText(hall.district || "-")}</td>
        <td>${formatMoney(hall.mealPrice)}</td>
        <td>${formatCount(hall.minimumGuarantee)}</td>
        <td>${formatCount(hall.maxCapacity)}</td>
        <td>${formatMoney(hall.rentPrice)}</td>
        <td>${sanitizeText(getCostFormulaLabel(hall, guestCount))}</td>
        <td>${formatMoney(getEstimatedTotalCost(hall, guestCount))}</td>
        <td>${hall.homepage ? `<a href="${sanitizeText(hall.homepage)}" target="_blank" rel="noreferrer">바로가기</a>` : "-"}</td>
      </tr>
    `)
    .join("");
};

const renderStats = (items, guestCount) => {
  totalCount.textContent = numberFormatter.format(halls.length);
  resultCount.textContent = numberFormatter.format(items.length);

  const mealValues = items.map((hall) => hall.mealPrice).filter((value) => typeof value === "number");
  const rentValues = items.map((hall) => hall.rentPrice).filter((value) => typeof value === "number");
  const totalValues = items.map((hall) => getEstimatedTotalCost(hall, guestCount)).filter((value) => typeof value === "number");

  const mealAverage = mealValues.length ? Math.round(mealValues.reduce((sum, value) => sum + value, 0) / mealValues.length) : null;
  const rentAverage = rentValues.length ? Math.round(rentValues.reduce((sum, value) => sum + value, 0) / rentValues.length) : null;
  const totalAverage = totalValues.length ? Math.round(totalValues.reduce((sum, value) => sum + value, 0) / totalValues.length) : null;
  const totalMinimum = totalValues.length ? Math.min(...totalValues) : null;

  avgMealPrice.textContent = mealAverage ? formatMoney(mealAverage) : "-";
  avgRentPrice.textContent = rentAverage ? formatMoney(rentAverage) : "-";
  avgTotalCost.textContent = totalAverage ? formatMoney(totalAverage) : "-";
  minTotalCost.textContent = totalMinimum ? formatMoney(totalMinimum) : "-";
  pricingBasis.textContent = guestCount ? `${formatCount(guestCount)} 기준` : "최소보증인원 기준";
  costBasisBadge.textContent = guestCount ? `기준 인원: ${formatCount(guestCount)}` : "기준 인원: 최소보증인원";
  costFormulaText.textContent = guestCount
    ? `총비용 = ${formatCount(guestCount)} x 식대 + 대관료 + 연출료 + 꽃장식`
    : "총비용 = 최소보증인원 x 식대 + 대관료 + 연출료 + 꽃장식";
};

const update = () => {
  const filters = getFilters();
  const filtered = halls.filter((hall) => matchesFilters(hall, filters));
  const sorted = sortHalls(filtered, filters);

  activeSummary.textContent = buildSummary(filters, sorted);
  renderStats(sorted, filters.guests);
  renderCards(sorted, filters.guests);
  renderTable(sorted, filters.guests);
};

const resetFilters = () => {
  mealPriceInput.value = "";
  guestCountInput.value = "";
  rentPriceInput.value = "";
  districtSelect.value = "";
  sortSelect.value = "score";
  update();
};

const setSourceStatus = (message, type = "") => {
  uploadStatus.textContent = message;
  uploadStatus.className = "upload-status";
  if (type) {
    uploadStatus.classList.add(type);
  }
};

const normalizeRecords = (records) =>
  records.map((item) => {
    const mealAveragePrice = parseIntValue(item["식대 평균가(원)"]);
    const mealStartPrice = parseIntValue(item["식대 시작가(원)"]);
    const minimumRentPrice = parseIntValue(item["최소 대관료(원)"]);
    const baseRentPrice = parseIntValue(item["대관료(원)"]);

    return {
      id: parseIntValue(item.ID),
      name: item["웨딩홀 이름"] || "",
      district: item.구 || "",
      address: item.주소 || "",
      hallType: item.홀타입 || "",
      hallTone: item["홀톤(밝은/어두운/혼합)"] || "",
      ceremonyType: item.예식형태 || "",
      menu: item.메뉴 || "",
      mealPrice: mealAveragePrice ?? mealStartPrice,
      mealStartPrice,
      mealAveragePrice,
      mealRange: item["식대 범위"] || "",
      minimumGuarantee: parseIntValue(item.최소보증인원),
      maxCapacity: parseIntValue(item.최대수용인원),
      rentPrice: minimumRentPrice ?? baseRentPrice,
      baseRentPrice,
      minimumRentPrice,
      stylingPrice: parseIntValue(item["연출료(원)"]),
      flowerPrice: parseIntValue(item["꽃장식(원)"]),
      parking: item.주차 || "",
      subwayAccess: item["지하철/접근"] || "",
      homepage: item["공식 홈페이지"] || "",
      naverMap: item.네이버지도 || "",
      memo: item.메모 || "",
      zone: item.권역 || "",
      tags: item.분위기태그 || "",
      budgetBand: item.예산밴드 || "",
      recommendationGrade: item.추천등급 || "",
      recommendationScore: item.추천점수 || "",
    };
  });

const xmlToDocument = (text) => new DOMParser().parseFromString(text, "application/xml");

const findEndOfCentralDirectory = (view) => {
  for (let index = view.byteLength - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      return index;
    }
  }
  throw new Error("ZIP 형식을 읽을 수 없습니다.");
};

const inflateRaw = async (uint8Array) => {
  const stream = new Blob([uint8Array]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
};

const unzipXlsxBuffer = async (buffer) => {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("이 브라우저는 엑셀 직접 업로드를 지원하지 않습니다. 크롬이나 최신 엣지에서 열어주세요.");
  }

  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(view);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const files = new Map();
  let pointer = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(pointer, true) !== 0x02014b50) {
      throw new Error("ZIP 중앙 디렉터리를 읽는 중 오류가 발생했습니다.");
    }

    const compressionMethod = view.getUint16(pointer + 10, true);
    const compressedSize = view.getUint32(pointer + 20, true);
    const fileNameLength = view.getUint16(pointer + 28, true);
    const extraFieldLength = view.getUint16(pointer + 30, true);
    const fileCommentLength = view.getUint16(pointer + 32, true);
    const localHeaderOffset = view.getUint32(pointer + 42, true);
    const fileNameBytes = new Uint8Array(buffer, pointer + 46, fileNameLength);
    const fileName = textDecoder.decode(fileNameBytes);

    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressedData = new Uint8Array(buffer, dataStart, compressedSize);

    let contentBytes;
    if (compressionMethod === 0) {
      contentBytes = compressedData;
    } else if (compressionMethod === 8) {
      contentBytes = await inflateRaw(compressedData);
    } else {
      throw new Error(`지원하지 않는 압축 방식입니다: ${compressionMethod}`);
    }

    files.set(fileName, textDecoder.decode(contentBytes));
    pointer += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return files;
};

const getWorkbookSheetPaths = (files, workbookDoc) => {
  const relsDoc = xmlToDocument(files.get("xl/_rels/workbook.xml.rels") || "");
  const relationships = new Map();

  getElementsByLocalName(relsDoc, "Relationship").forEach((rel) => {
    relationships.set(rel.getAttribute("Id"), rel.getAttribute("Target"));
  });

  return new Map(
    getElementsByLocalName(workbookDoc, "sheet").map((sheet) => {
      const relationshipId = sheet.getAttribute("r:id") || sheet.getAttributeNS("*", "id");
      const relativePath = relationships.get(relationshipId);

      if (!relativePath) {
        throw new Error("시트 경로를 찾을 수 없습니다.");
      }

      return [sheet.getAttribute("name"), `xl/${relativePath.replace(/^\/?xl\//, "")}`];
    })
  );
};

const parseSharedStrings = (files) => {
  const xml = files.get("xl/sharedStrings.xml");
  if (!xml) {
    return [];
  }

  const doc = xmlToDocument(xml);
  return getElementsByLocalName(doc, "si").map((item) =>
    getElementsByLocalName(item, "t")
      .map((textNode) => textNode.textContent || "")
      .join("")
  );
};

const parseWorksheetRecords = (worksheetDoc, sharedStrings) => {
  const rows = getElementsByLocalName(worksheetDoc, "row");
  const matrix = rows.map((row) => {
    const cells = {};
    let maxIndex = -1;

    Array.from(row.children).forEach((cell) => {
      if (cell.localName !== "c") {
        return;
      }

      const ref = cell.getAttribute("r") || "";
      const index = colToIndex(ref);
      const type = cell.getAttribute("t");
      const valueNode = getFirstChildByLocalName(cell, "v");

      let value = "";
      if (type === "s" && valueNode) {
        value = sharedStrings[Number(valueNode.textContent)] || "";
      } else if (type === "inlineStr") {
        const inlineNode = getFirstChildByLocalName(cell, "is");
        value = inlineNode
          ? getElementsByLocalName(inlineNode, "t")
              .map((node) => node.textContent || "")
              .join("")
          : "";
      } else if (valueNode) {
        value = valueNode.textContent || "";
      }

      cells[index] = value;
      maxIndex = Math.max(maxIndex, index);
    });

    return Array.from({ length: maxIndex + 1 }, (_, idx) => cells[idx] || "");
  });

  const headers = matrix[0] || [];
  return matrix
    .slice(1)
    .filter((row) => row.some((cell) => String(cell).trim()))
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] ?? "";
      });
      return record;
    });
};

const loadWorkbookBuffer = async (buffer) => {
  const files = await unzipXlsxBuffer(buffer);
  const workbookXml = files.get("xl/workbook.xml");
  if (!workbookXml) {
    throw new Error("엑셀 워크북을 읽을 수 없습니다.");
  }

  const workbookDoc = xmlToDocument(workbookXml);
  const sheetPaths = getWorkbookSheetPaths(files, workbookDoc);
  const targetSheetName = sheetPaths.has("Master_60") ? "Master_60" : sheetPaths.has(TEMPLATE_SHEET_NAME) ? TEMPLATE_SHEET_NAME : null;

  if (!targetSheetName) {
    throw new Error("Master_60 시트 또는 웨딩홀_추가양식 시트를 찾을 수 없습니다.");
  }

  const sheetPath = sheetPaths.get(targetSheetName);
  const sheetXml = files.get(sheetPath);
  if (!sheetXml) {
    throw new Error(`${targetSheetName} 시트 데이터를 읽을 수 없습니다.`);
  }

  const sharedStrings = parseSharedStrings(files);
  const records = parseWorksheetRecords(xmlToDocument(sheetXml), sharedStrings);
  return {
    halls: normalizeRecords(records),
    mode: targetSheetName === "Master_60" ? "replace" : "merge",
    sheetName: targetSheetName,
  };
};

const loadWorkbookFile = async (file) => loadWorkbookBuffer(await file.arrayBuffer());

const useBuiltinData = (message = "기본 내장 데이터를 불러왔습니다.", type = "is-success") => {
  halls = [...builtinHalls];
  rebuildDistrictOptions();
  dataSourceLabel.textContent = "기본 내장 데이터 사용 중";
  setSourceStatus(message, type);
  update();
};

const tryLoadDefaultWorkbook = async () => {
  for (const fileName of DEFAULT_WORKBOOK_FILES) {
    try {
      const response = await fetch(encodeURI(fileName), { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const workbookData = await loadWorkbookBuffer(await response.arrayBuffer());
      if (!workbookData.halls.length) {
        continue;
      }

      halls = workbookData.halls;
      rebuildDistrictOptions();
      dataSourceLabel.textContent = `${fileName} 자동 반영 중`;
      setSourceStatus(`페이지를 열면서 '${fileName}'의 Master_60 시트를 읽어 ${workbookData.halls.length}개 홀을 자동 반영했습니다.`, "is-success");
      update();
      return true;
    } catch (error) {
      continue;
    }
  }

  return false;
};

const handleExcelUpload = async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  setSourceStatus("엑셀을 읽는 중입니다...", "");

  try {
    const workbookData = await loadWorkbookFile(file);
    if (!workbookData.halls.length) {
      throw new Error("업로드한 파일에서 웨딩홀 데이터를 찾지 못했습니다.");
    }

    if (workbookData.mode === "merge") {
      const mergedResult = mergeHallDatasets(halls, workbookData.halls);
      halls = mergedResult.halls;
      rebuildDistrictOptions();
      dataSourceLabel.textContent = `기존 데이터 + ${file.name} 양식 반영`;
      setSourceStatus(
        `'${file.name}' 양식을 반영했습니다. 신규 ${mergedResult.addedCount}개, 업데이트 ${mergedResult.updatedCount}개, 현재 총 ${mergedResult.halls.length}개 홀입니다.`,
        "is-success"
      );
      update();
      return;
    }

    halls = workbookData.halls;
    rebuildDistrictOptions();
    dataSourceLabel.textContent = `${file.name} 업로드 데이터 사용 중`;
    setSourceStatus(`'${file.name}'의 Master_60 시트를 불러왔습니다. 총 ${workbookData.halls.length}개 홀을 반영했습니다.`, "is-success");
    update();
  } catch (error) {
    setSourceStatus(error instanceof Error ? error.message : "엑셀 업로드 중 오류가 발생했습니다.", "is-error");
  } finally {
    event.target.value = "";
  }
};

const handleBuiltinReload = async () => {
  setSourceStatus("기본 데이터를 다시 불러오는 중입니다...", "");
  const loaded = await tryLoadDefaultWorkbook();
  if (!loaded) {
    useBuiltinData("엑셀 자동 반영이 어려워 기본 내장 데이터로 불러왔습니다.", "is-success");
  }
};

[mealPriceInput, guestCountInput, rentPriceInput, districtSelect, sortSelect].forEach((element) => {
  element.addEventListener("input", update);
  element.addEventListener("change", update);
});

resetButton.addEventListener("click", resetFilters);
excelUpload.addEventListener("change", handleExcelUpload);
reloadBuiltinButton.addEventListener("click", handleBuiltinReload);

rebuildDistrictOptions();
update();

handleBuiltinReload();
