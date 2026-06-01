let halls = Array.isArray(window.WEDDING_HALLS) ? [...window.WEDDING_HALLS] : [];
const builtinHalls = Array.isArray(window.WEDDING_HALLS) ? [...window.WEDDING_HALLS] : [];
const DEFAULT_WORKBOOK_FILES = ["웨딩홀 정보.xlsx", "seoul_wedding_master_final_pro.xlsx"];
const TEMPLATE_SHEET_NAME = "웨딩홀_추가양식";

const hallNameInput = document.querySelector("#hallNameInput");
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
const updateBanner = document.querySelector("#updateBanner");
const updateBannerMessage = document.querySelector("#updateBannerMessage");
const updateRefreshButton = document.querySelector("#updateRefreshButton");
const updateDismissButton = document.querySelector("#updateDismissButton");
const favoriteSummary = document.querySelector("#favoriteSummary");
const favoriteCountBadge = document.querySelector("#favoriteCountBadge");
const copyShareLinkButton = document.querySelector("#copyShareLinkButton");
const restoreLocalDataButton = document.querySelector("#restoreLocalDataButton");
const clearFavoritesButton = document.querySelector("#clearFavoritesButton");
const favoriteList = document.querySelector("#favoriteList");
const checklistHallList = document.querySelector("#checklistHallList");
const checklistModal = document.querySelector("#consultationChecklistModal");
const checklistPanel = document.querySelector("#consultationChecklistPanel");
const checklistCategoryGrid = document.querySelector("#checklistCategoryGrid");
const checklistCompletedCount = document.querySelector("#checklistCompletedCount");
const checklistRemainingCount = document.querySelector("#checklistRemainingCount");
const checklistTotalCount = document.querySelector("#checklistTotalCount");
const checklistProgressPercent = document.querySelector("#checklistProgressPercent");
const checklistProgressText = document.querySelector("#checklistProgressText");
const checklistProgressBar = document.querySelector("#checklistProgressBar");
const checklistResetButton = document.querySelector("#checklistResetButton");
const consultationMemo = document.querySelector("#consultationMemo");
const checklistSelectedHallName = document.querySelector("#checklistSelectedHallName");
const checklistSelectedHallMeta = document.querySelector("#checklistSelectedHallMeta");
const checklistModalCloseButton = document.querySelector("#checklistModalCloseButton");

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

const FAVORITES_STORAGE_KEY = "weddingpick-favorites";
const MEMOS_STORAGE_KEY = "weddingpick-user-memos";
const CHECKLIST_STORAGE_KEY = "weddingpick-consultation-checklist";
const CHECKLIST_MEMO_STORAGE_KEY = "weddingpick-consultation-memo";
const SHARE_SESSION_STORAGE_KEY = "weddingpick-share-session";
const SHARE_FILE_VERSION = 4;
const SHARE_HASH_KEY = "share";
const ROOM_QUERY_KEY = "room";
const ROOM_STORAGE_PATH = "rooms";
const ROOM_SYNC_DEBOUNCE_MS = 600;
const LEGACY_CHECKLIST_HALL_KEY = "__legacy__";

let pendingUpdateRegistration = null;
let favoriteEntries = [];
let shouldPersistMigratedFavorites = false;
let memoByHallKey = {};
let preparedSharePayloadKey = "";
let preparedShareUrl = "";
let activeShareSessionLabel = "";
let activeRoomId = "";
let activeRoomRef = null;
let activeRoomValueListener = null;
let latestRoomSnapshotValue = null;
let pendingRoomSyncTimeoutId = 0;
let sharedRoomInitialLoadComplete = false;
let latestAppliedRoomSignature = "";
let checklistStateByHallKey = {};
let checklistMemoByHallKey = {};
let selectedChecklistHallKey = "";
let isChecklistModalOpen = false;

const numberFormatter = new Intl.NumberFormat("ko-KR");
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

const CONSULTATION_CHECKLIST = [
  {
    id: "pre-contract-check",
    eyebrow: "5-Minute Safety Check",
    title: "계약 전 5분 핵심 점검",
    description: "계약 직전에 꼭 확인해야 할 사업자, 계좌, 보증인원, 환불 기준을 먼저 묶었습니다.",
    items: [
      { id: "business-status-check", text: "홈택스에서 사업자등록상태가 계속사업자인지 확인하기" },
      { id: "contract-party-match", text: "계약서 상호, 견적서 상호, 입금계좌 예금주가 모두 일치하는지 확인하기" },
      { id: "total-quote-breakdown", text: "대관료, 식대, 음료, 주류, 꽃, 연출, 부가세, 봉사료까지 항목별 총견적 확인하기" },
      { id: "deposit-payment-proof", text: "계약금 금액, 결제수단, 영수증 발급, 환불 가능일을 함께 확인하기" },
      { id: "guarantee-deadline-check", text: "최초/최종 보증인원과 조정 마감일, 초과 시 추가금 기준 확인하기" },
      { id: "refund-penalty-check", text: "취소·환불·위약금 기준이 표준약관과 다르게 적혀 있지 않은지 확인하기" },
      { id: "external-vendor-basic-check", text: "외부 스냅, DVD, 사회자, 축가, 포토부스 반입 가능 여부와 반입료 확인하기" },
      { id: "parking-overflow-check", text: "무료 주차 시간, 가능 대수, 만차 시 대체 주차장과 처리 방식 확인하기" },
    ],
  },
  {
    id: "cost-benefits-contract",
    eyebrow: "Cost & Contract",
    title: "비용 · 계약 · 혜택",
    description: "상담 내용이 실제 계약서와 견적서에 남도록 만드는 핵심 질문들입니다.",
    items: [
      { id: "rental-timeline", text: "대여 시간과 식 진행 타임테이블이 정확히 어떻게 되는지 확인하기" },
      { id: "itemized-quote", text: "견적서를 항목별로 따로 받아서 금액 구조를 확인하기" },
      { id: "vat-service-included", text: "견적에 부가세와 봉사료가 포함되어 있는지 확인하기" },
      { id: "payment-schedule", text: "계약금과 잔금 납부 시점을 문서로 확인하기" },
      { id: "deposit-refund-window", text: "계약금 환불 가능 기간과 환불 기준을 확인하기" },
      { id: "cash-benefit-receipt", text: "현금 결제 혜택과 현금영수증 가능 여부를 확인하기" },
      { id: "same-day-benefit-written", text: "당일 계약 혜택이 무엇인지 확인하고 계약서 반영 가능 여부 묻기" },
      { id: "verbal-promise-written", text: "상담 내용과 무료 제공 혜택을 계약서 또는 별첨에 명시 요청하기" },
    ],
  },
  {
    id: "guests-meal-ticket",
    eyebrow: "Guests & Meal",
    title: "인원 · 식사 · 식권",
    description: "최종 총비용과 하객 만족도에 직접 연결되는 식사와 보증인원 조건입니다.",
    items: [
      { id: "chair-count", text: "기본으로 깔려 있는 의자 수를 확인하기" },
      { id: "guarantee-adjust-deadline", text: "보증인원 조정을 언제까지 할 수 있는지 확인하기" },
      { id: "meal-buffer", text: "식사 여유분이 얼마나 준비되는지 확인하기" },
      { id: "menu-count", text: "음식 종류와 가짓수를 확인하기" },
      { id: "drink-alcohol-policy", text: "주류와 음료가 포함인지, 별도 비용인지 확인하기" },
      { id: "tasting-schedule", text: "사전 시식 일정과 신청 시점을 확인하기" },
      { id: "child-age-standard", text: "소인 기준이 몇 살인지 확인하기" },
      { id: "child-price-policy", text: "소인 요금과 보증인원 포함 여부를 확인하기" },
      { id: "over-guarantee-extra-fee", text: "보증인원 초과 시 식비만 추가인지 음료·봉사료도 추가인지 확인하기" },
      { id: "meal-ticket-policy", text: "식권 제공 여부와 번호, 회수, 분실 처리 기준을 확인하기" },
    ],
  },
  {
    id: "parking-access",
    eyebrow: "Parking & Access",
    title: "주차 · 동선",
    description: "하객 불만이 생기기 쉬운 주차, 혼주 차량, 대체 동선 조건을 확인하는 묶음입니다.",
    items: [
      { id: "parking-hours-capacity", text: "주차 무료 시간과 가능 대수를 확인하기" },
      { id: "family-car-policy", text: "혼주 차량 가능 대수와 이용 가능 시간을 확인하기" },
      { id: "parking-rush-hour", text: "후기 기준으로 특히 주차가 몰리는 시간대가 있는지 확인하기" },
      { id: "overflow-parking-policy", text: "만차 시 대체 주차장, 셔틀, 주차요금 처리 기준을 확인하기" },
    ],
  },
  {
    id: "hall-items-storage",
    eyebrow: "Hall & Storage",
    title: "홀 · 연출 · 물품 · 보관",
    description: "현장 공간, 반입 물품, 대기실 동선처럼 당일 만족도를 좌우하는 항목입니다.",
    items: [
      { id: "flower-shower-fee", text: "플라워 샤워가 유료인지 확인하기" },
      { id: "storage-box-count", text: "가족 짐 보관함이 몇 개 제공되는지 확인하기" },
      { id: "wreath-policy", text: "화환 반입이 가능한지 확인하기" },
      { id: "photo-table-frame", text: "포토테이블 액자 사이즈와 추가 금액 여부를 확인하기" },
      { id: "easel-rental-count", text: "이젤 대여 가능 개수를 확인하기" },
      { id: "lobby-flower-season", text: "로비 테이블 꽃 색상이 계절마다 바뀌는지 확인하기" },
      { id: "waiting-room-flow", text: "신부대기실, 폐백실, 혼주대기실, 연회장 위치와 동선을 확인하기" },
    ],
  },
  {
    id: "vendors-fraud-prevention",
    eyebrow: "Vendors & Fraud",
    title: "사회자 · 외부업체 · 사기방지",
    description: "외부업체 제약과 계약 분쟁 방지 요소를 함께 체크하는 마지막 안전망입니다.",
    items: [
      { id: "professional-mc", text: "전문 사회자 진행이 가능한지 확인하기" },
      { id: "linked-snap-dvd", text: "본식 스냅과 DVD를 홀 연계 업체로만 진행해야 하는지 확인하기" },
      { id: "external-vendors-allowed", text: "외부 스냅, DVD, 영상, 사회자, 축가, 포토부스 반입 가능 여부를 확인하기" },
      { id: "vendor-loadin-fees", text: "외부업체 반입료, 작업 가능 시간, 전기 사용, 장비 반입 제한을 확인하기" },
      { id: "account-holder-match", text: "입금계좌 예금주가 계약 상대 사업자와 일치하는지 다시 확인하기" },
      { id: "refund-policy-written", text: "환불·위약금 기준과 무료 혜택이 계약서에 실제로 적혀 있는지 확인하기" },
      { id: "special-clause-written", text: "구두로 들은 약속은 모두 계약서, 별첨, 특약 문구로 남기기" },
    ],
  },
];

const CONSULTATION_CHECKLIST_ITEM_IDS = new Set(CONSULTATION_CHECKLIST.flatMap((category) => category.items.map((item) => item.id)));

const formatMoney = (value) => (typeof value === "number" && Number.isFinite(value) ? `${numberFormatter.format(value)}원` : "-");
const formatCount = (value) => (typeof value === "number" && Number.isFinite(value) ? `${numberFormatter.format(value)}명` : "-");
const formatHallCount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${numberFormatter.format(value)}개`;
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "-";
};

const formatHallCountChip = (value, fallback = "-") => {
  const formatted = formatHallCount(value);
  if (formatted === "-") {
    return fallback;
  }

  return formatted.endsWith("홀") ? formatted : `${formatted} 홀`;
};

const formatCeremonyInterval = (value, fallback = "-") => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${numberFormatter.format(value)}분`;
  }

  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return fallback;
  }

  return normalized.endsWith("분") ? normalized : `${normalized}분`;
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

const escapeAttributeSelector = (value) => {
  const normalized = String(value ?? "");
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(normalized);
  }

  return normalized.replace(/["\\]/g, "\\$&");
};

const getDisplayText = (value, fallback = "-") => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
};

const normalizeSearchText = (value) => String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const compactSearchText = (value) => normalizeSearchText(value).replace(/\s+/g, "");

const matchesHallTone = (hall, toneKeyword) => String(hall.hallTone || "").includes(toneKeyword);

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

const getFavoriteKey = (hall) => String(hall?.favoriteKey || buildHallKey(hall)).trim();

const getHallIdToken = (value) => {
  const parsedValue = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return "";
  }
  return parsedValue.toString(36);
};

const buildShareTokenLookup = () => {
  const lookup = new Map();
  [...halls, ...builtinHalls].forEach((hall) => {
    const token = getHallIdToken(hall.id);
    if (token) {
      lookup.set(token, hall);
    }
  });
  return lookup;
};

const getShareTokenFromFavoriteKey = (favoriteKey) => {
  const normalizedKey = String(favoriteKey || "").trim();
  if (!normalizedKey) {
    return "";
  }

  const builtinHall = builtinHalls.find((hall) => buildHallKey(hall) === normalizedKey);
  return getHallIdToken(builtinHall?.id) || normalizedKey;
};

const getCurrentUrl = () => new URL(window.location.href);
const getRoomIdFromUrl = () => getCurrentUrl().searchParams.get(ROOM_QUERY_KEY)?.trim() || "";
const isSharedRoomMode = () => Boolean(activeRoomId);
const getSharedRoomLabel = (roomId = activeRoomId) => (roomId ? `공유 room ${roomId.slice(0, 8)}` : "공유 room");
const getFirebaseDatabase = () => window.WEDDINGPICK_FIREBASE_DB || null;
const canUseSharedRooms = () => Boolean(getFirebaseDatabase());

const getSharedRoomRef = (roomId = activeRoomId) => {
  const database = getFirebaseDatabase();
  if (!database || !roomId) {
    return null;
  }

  return database.ref(`${ROOM_STORAGE_PATH}/${roomId}`);
};

const updateRoomUrl = (roomId) => {
  const nextUrl = getCurrentUrl();
  if (roomId) {
    nextUrl.searchParams.set(ROOM_QUERY_KEY, roomId);
  } else {
    nextUrl.searchParams.delete(ROOM_QUERY_KEY);
  }
  nextUrl.hash = "";
  window.history.replaceState({}, document.title, nextUrl.toString());
};

const getSharedRoomUrl = (roomId = activeRoomId) => {
  const shareUrl = getCurrentUrl();
  if (roomId) {
    shareUrl.searchParams.set(ROOM_QUERY_KEY, roomId);
  }
  shareUrl.hash = "";
  return shareUrl.toString();
};

const generateRoomId = () => {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";

  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(10);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

const getPreferredSnapshotValue = (snapshotValue, liveValue) => {
  if (typeof snapshotValue === "string") {
    return snapshotValue.trim() ? snapshotValue : liveValue;
  }

  if (typeof snapshotValue === "number") {
    return Number.isFinite(snapshotValue) ? snapshotValue : liveValue;
  }

  return hasMeaningfulValue(snapshotValue) ? snapshotValue : liveValue;
};

const loadUserMemos = () => {
  if (isSharedRoomMode()) {
    return memoByHallKey;
  }

  if (typeof window.localStorage === "undefined") {
    return {};
  }

  try {
    return normalizeMemoMap(JSON.parse(window.localStorage.getItem(MEMOS_STORAGE_KEY) || "{}"));
  } catch (error) {
    return {};
  }
};

const saveUserMemos = () => {
  if (isSharedRoomMode()) {
    scheduleSharedRoomSync();
    return;
  }

  if (activeShareSessionLabel) {
    saveShareSession();
    return;
  }

  if (typeof window.localStorage === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(MEMOS_STORAGE_KEY, JSON.stringify(memoByHallKey));
  } catch (error) {
    // Ignore storage failures so the main experience keeps working.
  }
};

const normalizeChecklistItemState = (value) => {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [itemId, checked]) => {
    if (CONSULTATION_CHECKLIST_ITEM_IDS.has(itemId) && checked === true) {
      accumulator[itemId] = true;
    }
    return accumulator;
  }, {});
};

const normalizeChecklistStateMap = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value);
  const looksLikeLegacyState = entries.some(([key]) => CONSULTATION_CHECKLIST_ITEM_IDS.has(String(key || "").trim()));

  if (looksLikeLegacyState) {
    const normalizedLegacyState = normalizeChecklistItemState(value);
    return Object.keys(normalizedLegacyState).length ? { [LEGACY_CHECKLIST_HALL_KEY]: normalizedLegacyState } : {};
  }

  return entries.reduce((accumulator, [hallKey, hallState]) => {
    const normalizedHallKey = String(hallKey || "").trim();
    const normalizedHallState = normalizeChecklistItemState(hallState);
    if (normalizedHallKey && Object.keys(normalizedHallState).length) {
      accumulator[normalizedHallKey] = normalizedHallState;
    }
    return accumulator;
  }, {});
};

const normalizeChecklistMemoMap = (value) => {
  if (typeof value === "string") {
    const normalizedLegacyMemo = value.replace(/\r\n/g, "\n");
    return normalizedLegacyMemo.trim() ? { [LEGACY_CHECKLIST_HALL_KEY]: normalizedLegacyMemo } : {};
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [hallKey, memo]) => {
    const normalizedHallKey = String(hallKey || "").trim();
    const normalizedMemo = typeof memo === "string" ? memo.replace(/\r\n/g, "\n") : "";
    if (normalizedHallKey && normalizedMemo.trim()) {
      accumulator[normalizedHallKey] = normalizedMemo;
    }
    return accumulator;
  }, {});
};

const loadChecklistState = () => {
  if (typeof window.localStorage === "undefined") {
    return {};
  }

  try {
    return normalizeChecklistStateMap(JSON.parse(window.localStorage.getItem(CHECKLIST_STORAGE_KEY) || "{}"));
  } catch (error) {
    return {};
  }
};

const saveChecklistState = () => {
  if (isSharedRoomMode()) {
    scheduleSharedRoomSync();
    return;
  }

  if (activeShareSessionLabel) {
    saveShareSession();
    return;
  }

  if (typeof window.localStorage === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistStateByHallKey));
  } catch (error) {
    // Ignore storage failures so the main experience keeps working.
  }
};

const loadChecklistMemo = () => {
  if (typeof window.localStorage === "undefined") {
    return "";
  }

  try {
    return normalizeChecklistMemoMap(JSON.parse(window.localStorage.getItem(CHECKLIST_MEMO_STORAGE_KEY) || "{}"));
  } catch (error) {
    try {
      const storedValue = window.localStorage.getItem(CHECKLIST_MEMO_STORAGE_KEY);
      return normalizeChecklistMemoMap(typeof storedValue === "string" ? storedValue : "");
    } catch (nestedError) {
      return {};
    }
  }
};

const saveChecklistMemo = () => {
  if (isSharedRoomMode()) {
    scheduleSharedRoomSync();
    return;
  }

  if (activeShareSessionLabel) {
    saveShareSession();
    return;
  }

  if (typeof window.localStorage === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CHECKLIST_MEMO_STORAGE_KEY, JSON.stringify(checklistMemoByHallKey));
  } catch (error) {
    // Ignore storage failures so the main experience keeps working.
  }
};

const buildFavoriteLookup = () => {
  const lookup = new Map();
  [...halls, ...builtinHalls].forEach((hall) => {
    lookup.set(buildHallKey(hall), hall);
  });
  return lookup;
};

const getUserMemo = (hall) => memoByHallKey[getFavoriteKey(hall)] || "";

const updateUserMemoByKey = (hallKey, memo) => {
  const normalizedKey = String(hallKey || "").trim();
  if (!normalizedKey) {
    return;
  }

  const nextMemo = String(memo ?? "").replace(/\r\n/g, "\n");
  const nextMemoMap = { ...memoByHallKey };

  if (nextMemo.trim()) {
    nextMemoMap[normalizedKey] = nextMemo;
  } else {
    delete nextMemoMap[normalizedKey];
  }

  memoByHallKey = nextMemoMap;
  saveUserMemos();
  prepareShareUrl();
};

const getHallSnapshot = (hall) => ({
  favoriteKey: getFavoriteKey(hall),
  id: hall.id ?? null,
  name: hall.name ?? "",
  district: hall.district ?? "",
  address: hall.address ?? "",
  hallType: hall.hallType ?? "",
  hallTone: hall.hallTone ?? "",
  ceremonyType: hall.ceremonyType ?? "",
  ceremonyTime: hall.ceremonyTime ?? "",
  hallCount: hall.hallCount ?? null,
  menu: hall.menu ?? "",
  mealPrice: hall.mealPrice ?? null,
  mealStartPrice: hall.mealStartPrice ?? null,
  mealAveragePrice: hall.mealAveragePrice ?? null,
  mealRange: hall.mealRange ?? "",
  minimumGuarantee: hall.minimumGuarantee ?? null,
  maxCapacity: hall.maxCapacity ?? null,
  rentPrice: hall.rentPrice ?? null,
  baseRentPrice: hall.baseRentPrice ?? null,
  minimumRentPrice: hall.minimumRentPrice ?? null,
  stylingPrice: hall.stylingPrice ?? null,
  flowerPrice: hall.flowerPrice ?? null,
  parking: hall.parking ?? "",
  subwayAccess: hall.subwayAccess ?? "",
  homepage: hall.homepage ?? "",
  naverMap: hall.naverMap ?? "",
  memo: hall.memo ?? "",
  zone: hall.zone ?? "",
  tags: hall.tags ?? "",
  budgetBand: hall.budgetBand ?? "",
});

const normalizeMemoMap = (rawMemoMap) => {
  if (!rawMemoMap || typeof rawMemoMap !== "object" || Array.isArray(rawMemoMap)) {
    return {};
  }

  return Object.entries(rawMemoMap).reduce((accumulator, [hallKey, memo]) => {
    const normalizedKey = String(hallKey || "").trim();
    const normalizedMemo = typeof memo === "string" ? memo : "";
    if (normalizedKey && normalizedMemo.trim()) {
      accumulator[normalizedKey] = normalizedMemo;
    }
    return accumulator;
  }, {});
};

const hydrateFavoriteSnapshot = (snapshot, hallLookup) => {
  const liveHall = hallLookup.get(snapshot.favoriteKey);
  if (!liveHall) {
    return { snapshot, changed: false };
  }

  const liveSnapshot = getHallSnapshot(liveHall);
  const mergedSnapshot = { ...snapshot };
  let changed = false;

  [
    "name",
    "district",
    "address",
    "hallType",
    "hallTone",
    "ceremonyType",
    "ceremonyTime",
    "hallCount",
    "menu",
    "mealPrice",
    "mealStartPrice",
    "mealAveragePrice",
    "mealRange",
    "minimumGuarantee",
    "maxCapacity",
    "rentPrice",
    "baseRentPrice",
    "minimumRentPrice",
    "stylingPrice",
    "flowerPrice",
    "parking",
    "subwayAccess",
    "homepage",
    "naverMap",
    "memo",
    "zone",
    "tags",
    "budgetBand",
  ].forEach((field) => {
    const nextValue = getPreferredSnapshotValue(snapshot[field], liveSnapshot[field]);
    if (nextValue !== snapshot[field]) {
      mergedSnapshot[field] = nextValue;
      changed = true;
    }
  });

  return { snapshot: mergedSnapshot, changed };
};

const normalizeFavoriteEntries = (items, hallLookup) => {
  if (!Array.isArray(items)) {
    return { entries: [], changed: false };
  }

  const uniqueEntries = [];
  let changed = false;

  items.forEach((item) => {
    let snapshot = null;

    if (typeof item === "string") {
      const matchedHall = hallLookup.get(item);
      if (matchedHall) {
        snapshot = getHallSnapshot(matchedHall);
        changed = true;
      }
    } else if (item && typeof item === "object") {
      const sourceHall = item.hall && typeof item.hall === "object" ? item.hall : item;
      const favoriteKey = String(item.key || sourceHall.favoriteKey || buildHallKey(sourceHall)).trim();
      if (favoriteKey) {
        snapshot = {
          ...getHallSnapshot(sourceHall),
          favoriteKey,
        };
      }
    }

    if (!snapshot || !snapshot.favoriteKey) {
      return;
    }

    const hydratedSnapshot = hydrateFavoriteSnapshot(snapshot, hallLookup);
    snapshot = hydratedSnapshot.snapshot;
    if (hydratedSnapshot.changed) {
      changed = true;
    }

    const existingIndex = uniqueEntries.findIndex((entry) => entry.favoriteKey === snapshot.favoriteKey);
    if (existingIndex === -1) {
      uniqueEntries.push(snapshot);
    } else {
      uniqueEntries[existingIndex] = snapshot;
    }
  });

  return { entries: uniqueEntries, changed };
};

const loadFavoriteEntries = () => {
  if (isSharedRoomMode()) {
    return favoriteEntries;
  }

  if (typeof window.localStorage === "undefined") {
    return [];
  }

  try {
    shouldPersistMigratedFavorites = false;
    const hallLookup = buildFavoriteLookup();
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    const normalizedResult = normalizeFavoriteEntries(parsed, hallLookup);
    shouldPersistMigratedFavorites = normalizedResult.changed;
    return normalizedResult.entries;
  } catch (error) {
    return [];
  }
};

const saveFavoriteEntries = () => {
  if (isSharedRoomMode()) {
    scheduleSharedRoomSync();
    return;
  }

  if (activeShareSessionLabel) {
    saveShareSession();
    return;
  }

  if (typeof window.localStorage === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteEntries));
  } catch (error) {
    // Ignore storage failures so the main experience keeps working.
  }
};

const isFavoriteHall = (hall) => favoriteEntries.some((entry) => entry.favoriteKey === getFavoriteKey(hall));

const toggleFavoriteHall = (hall) => {
  const favoriteKey = getFavoriteKey(hall);
  if (!favoriteKey) {
    return;
  }

  if (isFavoriteHall(hall)) {
    favoriteEntries = favoriteEntries.filter((entry) => entry.favoriteKey !== favoriteKey);
  } else {
    favoriteEntries = [getHallSnapshot(hall), ...favoriteEntries.filter((entry) => entry.favoriteKey !== favoriteKey)];
  }

  saveFavoriteEntries();
  prepareShareUrl();
  update();
};

const toggleFavoriteHallByKey = (hallKey) => {
  if (!hallKey) {
    return;
  }

  const existingFavorite = favoriteEntries.find((entry) => entry.favoriteKey === hallKey);
  if (existingFavorite) {
    favoriteEntries = favoriteEntries.filter((entry) => entry.favoriteKey !== hallKey);
    saveFavoriteEntries();
    prepareShareUrl();
    update();
    return;
  }

  const matchedHall = halls.find((hall) => buildHallKey(hall) === hallKey) || builtinHalls.find((hall) => buildHallKey(hall) === hallKey);
  if (!matchedHall) {
    return;
  }

  favoriteEntries = [getHallSnapshot(matchedHall), ...favoriteEntries];
  saveFavoriteEntries();
  prepareShareUrl();
  update();
};

const clearAllFavorites = () => {
  favoriteEntries = [];
  saveFavoriteEntries();
  prepareShareUrl();
  update();
};

const getFavoriteHalls = () => [...favoriteEntries];

const getChecklistStateForHallKey = (hallKey = selectedChecklistHallKey) => normalizeChecklistItemState(checklistStateByHallKey[hallKey]);

const getChecklistMemoForHallKey = (hallKey = selectedChecklistHallKey) =>
  typeof checklistMemoByHallKey[hallKey] === "string" ? checklistMemoByHallKey[hallKey] : "";

const migrateLegacyChecklistDataIfNeeded = (hallKey) => {
  if (!hallKey) {
    return;
  }

  let changed = false;
  const nextChecklistStateMap = { ...checklistStateByHallKey };
  const nextChecklistMemoMap = { ...checklistMemoByHallKey };
  const legacyChecklistState = normalizeChecklistItemState(nextChecklistStateMap[LEGACY_CHECKLIST_HALL_KEY]);
  const legacyChecklistMemo = typeof nextChecklistMemoMap[LEGACY_CHECKLIST_HALL_KEY] === "string" ? nextChecklistMemoMap[LEGACY_CHECKLIST_HALL_KEY] : "";

  if (Object.keys(legacyChecklistState).length && !Object.keys(getChecklistStateForHallKey(hallKey)).length) {
    nextChecklistStateMap[hallKey] = legacyChecklistState;
    changed = true;
  }

  if (legacyChecklistMemo.trim() && !getChecklistMemoForHallKey(hallKey).trim()) {
    nextChecklistMemoMap[hallKey] = legacyChecklistMemo;
    changed = true;
  }

  if (Object.keys(legacyChecklistState).length) {
    delete nextChecklistStateMap[LEGACY_CHECKLIST_HALL_KEY];
    changed = true;
  }

  if (legacyChecklistMemo.trim()) {
    delete nextChecklistMemoMap[LEGACY_CHECKLIST_HALL_KEY];
    changed = true;
  }

  if (!changed) {
    return;
  }

  checklistStateByHallKey = nextChecklistStateMap;
  checklistMemoByHallKey = nextChecklistMemoMap;
  saveChecklistState();
  saveChecklistMemo();
};

const ensureSelectedChecklistHallKey = (favoriteItems = getFavoriteHalls()) => {
  if (!favoriteItems.length) {
    selectedChecklistHallKey = "";
    return "";
  }

  if (!favoriteItems.some((hall) => hall.favoriteKey === selectedChecklistHallKey)) {
    selectedChecklistHallKey = favoriteItems[0].favoriteKey;
  }

  migrateLegacyChecklistDataIfNeeded(selectedChecklistHallKey);
  return selectedChecklistHallKey;
};

const getSelectedChecklistHall = (favoriteItems = getFavoriteHalls()) => {
  const activeHallKey = ensureSelectedChecklistHallKey(favoriteItems);
  return favoriteItems.find((hall) => hall.favoriteKey === activeHallKey) || null;
};

const openChecklistModal = (hallKey = selectedChecklistHallKey) => {
  const favoriteItems = getFavoriteHalls();
  if (!favoriteItems.length || !checklistModal) {
    return;
  }

  if (hallKey && favoriteItems.some((hall) => hall.favoriteKey === hallKey)) {
    selectedChecklistHallKey = hallKey;
  } else {
    ensureSelectedChecklistHallKey(favoriteItems);
  }

  isChecklistModalOpen = true;
  checklistModal.hidden = false;
  document.body.classList.add("is-modal-open");
  renderChecklist();

  window.requestAnimationFrame(() => {
    checklistModalCloseButton?.focus();
  });
};

const closeChecklistModal = () => {
  if (!checklistModal) {
    return;
  }

  isChecklistModalOpen = false;
  checklistModal.hidden = true;
  document.body.classList.remove("is-modal-open");
};

const updateChecklistStateForHallKey = (hallKey, nextChecklistState) => {
  const normalizedHallKey = String(hallKey || "").trim();
  if (!normalizedHallKey) {
    return;
  }

  const normalizedState = normalizeChecklistItemState(nextChecklistState);
  const nextChecklistStateMap = { ...checklistStateByHallKey };

  if (Object.keys(normalizedState).length) {
    nextChecklistStateMap[normalizedHallKey] = normalizedState;
  } else {
    delete nextChecklistStateMap[normalizedHallKey];
  }

  checklistStateByHallKey = nextChecklistStateMap;
  saveChecklistState();
  prepareShareUrl();
};

const updateChecklistMemoByHallKey = (hallKey, memo) => {
  const normalizedHallKey = String(hallKey || "").trim();
  if (!normalizedHallKey) {
    return;
  }

  const normalizedMemo = String(memo ?? "").replace(/\r\n/g, "\n");
  const nextChecklistMemoMap = { ...checklistMemoByHallKey };

  if (normalizedMemo.trim()) {
    nextChecklistMemoMap[normalizedHallKey] = normalizedMemo;
  } else {
    delete nextChecklistMemoMap[normalizedHallKey];
  }

  checklistMemoByHallKey = nextChecklistMemoMap;
  saveChecklistMemo();
  prepareShareUrl();
};

const getShareFavoriteTokens = () =>
  [...new Set(favoriteEntries.map((entry) => getShareTokenFromFavoriteKey(entry.favoriteKey)).filter(Boolean))];

const getShareMemoMap = () =>
  Object.entries(normalizeMemoMap(memoByHallKey)).reduce((accumulator, [hallKey, memo]) => {
    const token = getShareTokenFromFavoriteKey(hallKey);
    if (token && memo.trim()) {
      accumulator[token] = memo;
    }
    return accumulator;
  }, {});

const getShareChecklistStateMap = () =>
  Object.entries(checklistStateByHallKey).reduce((accumulator, [hallKey, hallChecklistState]) => {
    if (hallKey === LEGACY_CHECKLIST_HALL_KEY) {
      return accumulator;
    }

    const token = getShareTokenFromFavoriteKey(hallKey);
    const normalizedChecklistState = normalizeChecklistItemState(hallChecklistState);
    if (token && Object.keys(normalizedChecklistState).length) {
      accumulator[token] = normalizedChecklistState;
    }
    return accumulator;
  }, {});

const getShareChecklistMemoMap = () =>
  Object.entries(checklistMemoByHallKey).reduce((accumulator, [hallKey, memo]) => {
    if (hallKey === LEGACY_CHECKLIST_HALL_KEY) {
      return accumulator;
    }

    const token = getShareTokenFromFavoriteKey(hallKey);
    const normalizedMemo = typeof memo === "string" ? memo.replace(/\r\n/g, "\n") : "";
    if (token && normalizedMemo.trim()) {
      accumulator[token] = normalizedMemo;
    }
    return accumulator;
  }, {});

const buildSharePayload = () => ({
  v: SHARE_FILE_VERSION,
  f: getShareFavoriteTokens(),
  m: getShareMemoMap(),
  c: getShareChecklistStateMap(),
  cm: getShareChecklistMemoMap(),
});

const getSharedRoomFavoriteTokens = (roomPayload) => {
  if (Array.isArray(roomPayload?.favorites)) {
    return roomPayload.favorites.map((value) => String(value || "").trim()).filter(Boolean);
  }

  if (roomPayload?.favorites && typeof roomPayload.favorites === "object") {
    return Object.entries(roomPayload.favorites)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([token]) => String(token || "").trim())
      .filter(Boolean);
  }

  return [];
};

const buildSharedRoomPayload = () => ({
  version: 1,
  app: "weddingpick",
  favorites: getShareFavoriteTokens().reduce((accumulator, token) => {
    accumulator[token] = true;
    return accumulator;
  }, {}),
  memos: getShareMemoMap(),
  checklists: getShareChecklistStateMap(),
  checklistMemos: getShareChecklistMemoMap(),
  updatedAt: window.firebase?.database?.ServerValue?.TIMESTAMP ?? Date.now(),
});

const buildSharedRoomSignature = (roomPayload) => {
  const favoriteTokens = getSharedRoomFavoriteTokens(roomPayload).sort();
  const memoMap = roomPayload?.memos && typeof roomPayload.memos === "object" && !Array.isArray(roomPayload.memos) ? roomPayload.memos : {};
  const normalizedMemos = Object.entries(memoMap)
    .map(([reference, memo]) => [String(reference || "").trim(), typeof memo === "string" ? memo : ""])
    .filter(([reference, memo]) => reference && memo.trim())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey, "ko"));
  const checklistMap =
    roomPayload?.checklists && typeof roomPayload.checklists === "object" && !Array.isArray(roomPayload.checklists) ? roomPayload.checklists : {};
  const normalizedChecklists = Object.entries(checklistMap)
    .map(([reference, hallChecklistState]) => [String(reference || "").trim(), Object.keys(normalizeChecklistItemState(hallChecklistState)).sort()])
    .filter(([reference, itemIds]) => reference && itemIds.length)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey, "ko"));
  const checklistMemoMap =
    roomPayload?.checklistMemos && typeof roomPayload.checklistMemos === "object" && !Array.isArray(roomPayload.checklistMemos)
      ? roomPayload.checklistMemos
      : {};
  const normalizedChecklistMemos = Object.entries(checklistMemoMap)
    .map(([reference, memo]) => [String(reference || "").trim(), typeof memo === "string" ? memo : ""])
    .filter(([reference, memo]) => reference && memo.trim())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey, "ko"));

  return JSON.stringify({
    favorites: favoriteTokens,
    memos: normalizedMemos,
    checklists: normalizedChecklists,
    checklistMemos: normalizedChecklistMemos,
  });
};

const normalizeSharedRoomPayload = (roomPayload) => {
  const hallLookup = buildFavoriteLookup();
  const shareTokenLookup = buildShareTokenLookup();
  const favoriteReferences = getSharedRoomFavoriteTokens(roomPayload);

  return {
    favorites: normalizeImportedFavoriteReferences(favoriteReferences, hallLookup, shareTokenLookup),
    memos: normalizeImportedMemoMap(roomPayload?.memos, shareTokenLookup),
    checklists: normalizeImportedChecklistStateMap(roomPayload?.checklists, shareTokenLookup),
    checklistMemos: normalizeImportedMemoMap(roomPayload?.checklistMemos, shareTokenLookup),
  };
};

const createShareUrl = (encodedPayload) => {
  const shareUrl = new URL(window.location.href);
  shareUrl.hash = `${SHARE_HASH_KEY}=${encodedPayload}`;
  return shareUrl.toString();
};

const bytesToBase64Url = (bytes) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlToBytes = (value) => {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const prepareShareUrl = () => {
  if (isSharedRoomMode()) {
    preparedSharePayloadKey = activeRoomId;
    preparedShareUrl = getSharedRoomUrl();
    return;
  }

  if (!favoriteEntries.length && !Object.keys(memoByHallKey).length) {
    preparedSharePayloadKey = "";
    preparedShareUrl = "";
    return;
  }

  const payloadText = JSON.stringify(buildSharePayload());
  preparedSharePayloadKey = payloadText;

  encodeSharePayload(payloadText)
    .then((encodedPayload) => {
      if (preparedSharePayloadKey === payloadText) {
        preparedShareUrl = createShareUrl(encodedPayload);
      }
    })
    .catch(() => {
      if (preparedSharePayloadKey === payloadText) {
        preparedShareUrl = "";
      }
    });
};

const stopSharedRoomSubscription = () => {
  if (pendingRoomSyncTimeoutId) {
    window.clearTimeout(pendingRoomSyncTimeoutId);
    pendingRoomSyncTimeoutId = 0;
  }

  if (activeRoomRef && activeRoomValueListener) {
    activeRoomRef.off("value", activeRoomValueListener);
  }

  activeRoomRef = null;
  activeRoomValueListener = null;
  latestRoomSnapshotValue = null;
  sharedRoomInitialLoadComplete = false;
  latestAppliedRoomSignature = "";
};

const applySharedRoomState = (roomPayload) => {
  latestRoomSnapshotValue = roomPayload;
  const nextSignature = buildSharedRoomSignature(roomPayload || {});

  if (sharedRoomInitialLoadComplete && nextSignature === latestAppliedRoomSignature) {
    prepareShareUrl();
    return;
  }

  const normalizedPayload = normalizeSharedRoomPayload(roomPayload || {});
  const previousScrollY = window.scrollY;
  const previousActiveElement = document.activeElement;
  const previousActiveMemoKey =
    previousActiveElement instanceof HTMLElement ? previousActiveElement.getAttribute("data-memo-key") || "" : "";
  const previousActiveElementId = previousActiveElement instanceof HTMLElement ? previousActiveElement.id || "" : "";
  const previousSelectionStart =
    previousActiveElement instanceof HTMLTextAreaElement ? previousActiveElement.selectionStart : null;
  const previousSelectionEnd =
    previousActiveElement instanceof HTMLTextAreaElement ? previousActiveElement.selectionEnd : null;

  activeShareSessionLabel = "";
  favoriteEntries = normalizedPayload.favorites;
  memoByHallKey = normalizedPayload.memos;
  checklistStateByHallKey = normalizedPayload.checklists;
  checklistMemoByHallKey = normalizedPayload.checklistMemos;
  latestAppliedRoomSignature = nextSignature;
  prepareShareUrl();
  update();

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: previousScrollY });
    let nextFocusedField = null;

    if (previousActiveMemoKey) {
      const nextMemoField = document.querySelector(`[data-memo-key="${escapeAttributeSelector(previousActiveMemoKey)}"]`);
      if (nextMemoField instanceof HTMLTextAreaElement) {
        nextFocusedField = nextMemoField;
      }
    } else if (previousActiveElementId) {
      const nextElementById = document.getElementById(previousActiveElementId);
      if (nextElementById instanceof HTMLTextAreaElement) {
        nextFocusedField = nextElementById;
      }
    }

    if (nextFocusedField instanceof HTMLTextAreaElement) {
      nextFocusedField.focus();
      if (typeof previousSelectionStart === "number" && typeof previousSelectionEnd === "number") {
        nextFocusedField.setSelectionRange(previousSelectionStart, previousSelectionEnd);
      }
    }
  });
};

const refreshSharedRoomStateAfterHallRefresh = () => {
  if (!isSharedRoomMode()) {
    return;
  }

  applySharedRoomState(latestRoomSnapshotValue || {});
};

const syncSharedRoomNow = async () => {
  if (!isSharedRoomMode() || !activeRoomRef) {
    return;
  }

  if (pendingRoomSyncTimeoutId) {
    window.clearTimeout(pendingRoomSyncTimeoutId);
    pendingRoomSyncTimeoutId = 0;
  }

  try {
    const nextPayload = buildSharedRoomPayload();
    latestAppliedRoomSignature = buildSharedRoomSignature(nextPayload);
    await activeRoomRef.set(nextPayload);
  } catch (error) {
    setSourceStatus("공유 room 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", "is-error");
  }
};

const scheduleSharedRoomSync = () => {
  if (!isSharedRoomMode() || !activeRoomRef) {
    return;
  }

  if (pendingRoomSyncTimeoutId) {
    window.clearTimeout(pendingRoomSyncTimeoutId);
  }

  pendingRoomSyncTimeoutId = window.setTimeout(() => {
    syncSharedRoomNow();
  }, ROOM_SYNC_DEBOUNCE_MS);
};

const activateSharedRoom = (roomId, options = {}) => {
  const { updateHistory = true } = options;
  if (!roomId) {
    return;
  }

  const roomRef = getSharedRoomRef(roomId);
  if (!roomRef) {
    setSourceStatus("Firebase 연결이 아직 준비되지 않아 공유 room을 열 수 없습니다.", "is-error");
    return;
  }

  stopSharedRoomSubscription();
  clearShareSession();
  activeRoomId = roomId;

  if (updateHistory) {
    updateRoomUrl(roomId);
  }

  activeRoomRef = roomRef;
  activeRoomValueListener = (snapshot) => {
    applySharedRoomState(snapshot.val());

    if (!sharedRoomInitialLoadComplete) {
      sharedRoomInitialLoadComplete = true;
      const hasContent = Boolean(snapshot.val()) && (favoriteEntries.length > 0 || Object.keys(memoByHallKey).length > 0);
      setSourceStatus(
        hasContent
          ? `${getSharedRoomLabel()}에 연결했습니다. 이 링크를 연 사람과 같은 즐겨찾기, 체크리스트, 메모를 함께 보고 있습니다.`
          : `${getSharedRoomLabel()}이 비어 있습니다. 첫 즐겨찾기나 메모부터 함께 채워보세요.`,
        "is-success"
      );
    }
  };

  roomRef.on("value", activeRoomValueListener, () => {
    setSourceStatus("공유 room을 불러오는 중 문제가 발생했습니다. 새로고침 후 다시 시도해주세요.", "is-error");
  });
};

const createSharedRoomFromCurrentState = async () => {
  if (!canUseSharedRooms()) {
    throw new Error("공유 room을 만들 수 있도록 Firebase 연결이 필요합니다.");
  }

  const nextRoomId = generateRoomId();
  const nextRoomRef = getSharedRoomRef(nextRoomId);
  if (!nextRoomRef) {
    throw new Error("공유 room 저장소에 연결하지 못했습니다.");
  }

  await nextRoomRef.set(buildSharedRoomPayload());
  activateSharedRoom(nextRoomId);
  return nextRoomId;
};

const saveShareSession = () => {
  if (!activeShareSessionLabel || typeof window.sessionStorage === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      SHARE_SESSION_STORAGE_KEY,
      JSON.stringify({
        sourceLabel: activeShareSessionLabel,
        favorites: favoriteEntries,
        memos: normalizeMemoMap(memoByHallKey),
        checklistStates: checklistStateByHallKey,
        checklistMemos: checklistMemoByHallKey,
      })
    );
  } catch (error) {
    // Ignore session storage failures so the main experience keeps working.
  }
};

const clearShareSession = () => {
  activeShareSessionLabel = "";

  if (typeof window.sessionStorage === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(SHARE_SESSION_STORAGE_KEY);
  } catch (error) {
    // Ignore session storage failures so the main experience keeps working.
  }
};

const loadShareSession = () => {
  if (typeof window.sessionStorage === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(SHARE_SESSION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    const hallLookup = buildFavoriteLookup();

    return {
      sourceLabel: String(parsedValue?.sourceLabel || "공유 링크").trim() || "공유 링크",
      favorites: normalizeFavoriteEntries(parsedValue?.favorites, hallLookup).entries,
      memos: normalizeMemoMap(parsedValue?.memos),
      checklistStates: normalizeChecklistStateMap(parsedValue?.checklistStates),
      checklistMemos: normalizeChecklistMemoMap(parsedValue?.checklistMemos),
    };
  } catch (error) {
    return null;
  }
};

const mergeImportedFavoriteEntries = (importedEntries) => {
  const mergedEntries = [...importedEntries];
  favoriteEntries.forEach((entry) => {
    if (!mergedEntries.some((importedEntry) => importedEntry.favoriteKey === entry.favoriteKey)) {
      mergedEntries.push(entry);
    }
  });
  return mergedEntries;
};

const encodeSharePayload = async (payloadText) => {
  const payloadBytes = textEncoder.encode(payloadText);

  if (typeof CompressionStream !== "undefined") {
    const compressedStream = new Blob([payloadBytes]).stream().pipeThrough(new CompressionStream("gzip"));
    const compressedBytes = new Uint8Array(await new Response(compressedStream).arrayBuffer());
    return `gz.${bytesToBase64Url(compressedBytes)}`;
  }

  return `raw.${bytesToBase64Url(payloadBytes)}`;
};

const normalizeImportedMemoMap = (rawMemoMap, shareTokenLookup) => {
  if (!rawMemoMap || typeof rawMemoMap !== "object" || Array.isArray(rawMemoMap)) {
    return {};
  }

  return Object.entries(rawMemoMap).reduce((accumulator, [reference, memo]) => {
    const normalizedMemo = typeof memo === "string" ? memo : "";
    if (!normalizedMemo.trim()) {
      return accumulator;
    }

    const hallFromToken = shareTokenLookup.get(String(reference || "").trim());
    const memoKey = hallFromToken ? buildHallKey(hallFromToken) : String(reference || "").trim();

    if (memoKey) {
      accumulator[memoKey] = normalizedMemo;
    }
    return accumulator;
  }, {});
};

const normalizeImportedChecklistStateMap = (rawChecklistMap, shareTokenLookup) => {
  if (!rawChecklistMap || typeof rawChecklistMap !== "object" || Array.isArray(rawChecklistMap)) {
    return {};
  }

  return Object.entries(rawChecklistMap).reduce((accumulator, [reference, hallChecklistState]) => {
    const normalizedChecklistState = normalizeChecklistItemState(hallChecklistState);
    if (!Object.keys(normalizedChecklistState).length) {
      return accumulator;
    }

    const hallFromToken = shareTokenLookup.get(String(reference || "").trim());
    const checklistKey = hallFromToken ? buildHallKey(hallFromToken) : String(reference || "").trim();

    if (checklistKey) {
      accumulator[checklistKey] = normalizedChecklistState;
    }
    return accumulator;
  }, {});
};

const normalizeImportedFavoriteReferences = (references, hallLookup, shareTokenLookup) => {
  const normalizedReferences = Array.isArray(references) ? references : [];

  return normalizeFavoriteEntries(
    normalizedReferences.map((reference) => {
      if (typeof reference !== "string") {
        return reference;
      }

      const normalizedReference = reference.trim();
      const hallFromToken = shareTokenLookup.get(normalizedReference);
      if (hallFromToken) {
        return getHallSnapshot(hallFromToken);
      }

      if (hallLookup.get(normalizedReference)) {
        return normalizedReference;
      }

      return null;
    }),
    hallLookup
  ).entries;
};

const importSharedPayload = (payload, sourceLabel = "공유 링크") => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("공유 데이터 형식이 올바르지 않습니다.");
  }

  const hallLookup = buildFavoriteLookup();
  const shareTokenLookup = buildShareTokenLookup();
  const importedFavoritesRaw = Array.isArray(payload.favorites)
    ? payload.favorites
    : Array.isArray(payload.f)
      ? payload.f
      : Array.isArray(payload.favoriteEntries)
      ? payload.favoriteEntries
      : [];
  const importedMemosRaw = payload.memos ?? payload.memoByHallKey ?? payload.m ?? {};
  const importedChecklistStateRaw = payload.checklists ?? payload.checklistByHallKey ?? payload.c ?? {};
  const importedChecklistMemoRaw = payload.checklistMemos ?? payload.checklistMemoByHallKey ?? payload.cm ?? {};
  const normalizedFavorites = normalizeImportedFavoriteReferences(importedFavoritesRaw, hallLookup, shareTokenLookup);
  const normalizedMemos = normalizeImportedMemoMap(importedMemosRaw, shareTokenLookup);
  const normalizedChecklistStates = normalizeImportedChecklistStateMap(importedChecklistStateRaw, shareTokenLookup);
  const normalizedChecklistMemos = normalizeImportedMemoMap(importedChecklistMemoRaw, shareTokenLookup);

  if (!normalizedFavorites.length && !Object.keys(normalizedMemos).length && !Object.keys(normalizedChecklistStates).length && !Object.keys(normalizedChecklistMemos).length) {
    throw new Error("공유 데이터 안에 불러올 즐겨찾기, 체크리스트, 메모가 없습니다.");
  }

  activeShareSessionLabel = sourceLabel;
  favoriteEntries = normalizedFavorites;
  memoByHallKey = normalizedMemos;
  checklistStateByHallKey = normalizedChecklistStates;
  checklistMemoByHallKey = normalizedChecklistMemos;
  saveShareSession();
  prepareShareUrl();
  update();

  setSourceStatus(
    `${sourceLabel}를 이 창의 임시 공유본으로 열었습니다. 내 기본 목록은 바뀌지 않았습니다.`,
    "is-success"
  );
};

const decodeSharePayload = async (encodedPayload) => {
  const separatorIndex = String(encodedPayload || "").indexOf(".");
  if (separatorIndex === -1) {
    throw new Error("공유 링크 형식이 올바르지 않습니다.");
  }

  const mode = encodedPayload.slice(0, separatorIndex);
  const data = encodedPayload.slice(separatorIndex + 1);
  const payloadBytes = base64UrlToBytes(data);

  if (mode === "gz") {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("이 브라우저는 공유 링크 불러오기를 지원하지 않습니다.");
    }

    const decompressedStream = new Blob([payloadBytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(decompressedStream).text();
  }

  if (mode === "raw") {
    return textDecoder.decode(payloadBytes);
  }

  throw new Error("지원하지 않는 공유 링크 형식입니다.");
};

const buildShareUrl = async () => {
  const payloadText = JSON.stringify(buildSharePayload());
  const encodedPayload = await encodeSharePayload(payloadText);
  return createShareUrl(encodedPayload);
};

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fall back to manual copy below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = typeof document.execCommand === "function" ? document.execCommand("copy") : false;
  } catch (error) {
    copied = false;
  }

  textarea.remove();
  return copied;
};

const showManualCopyPrompt = (text) => {
  window.prompt("자동 복사가 제한되어 있어요. 아래 링크를 직접 복사해주세요.", text);
};

const copyShareLink = async () => {
  if (!canUseSharedRooms() && !favoriteEntries.length && !Object.keys(memoByHallKey).length) {
    setSourceStatus("공유할 즐겨찾기나 메모가 아직 없습니다.", "is-error");
    return;
  }

  try {
    if (canUseSharedRooms()) {
      const createdNewRoom = !isSharedRoomMode();

      if (createdNewRoom) {
        await createSharedRoomFromCurrentState();
      } else {
        await syncSharedRoomNow();
      }

      const shareUrl = getSharedRoomUrl();
      const copied = await copyText(shareUrl);

      if (!copied) {
        showManualCopyPrompt(shareUrl);
        setSourceStatus("자동 복사가 막혀 공유 room 링크를 직접 복사할 수 있게 열어드렸습니다.", "is-success");
        return;
      }

      setSourceStatus(
        createdNewRoom
          ? `${getSharedRoomLabel()}을 만들고 링크를 복사했습니다. 이 링크를 열면 같은 즐겨찾기, 체크리스트, 메모를 함께 수정할 수 있습니다.`
          : `${getSharedRoomLabel()} 링크를 복사했습니다. 이 링크를 연 사람과 같은 즐겨찾기, 체크리스트, 메모를 함께 수정할 수 있습니다.`,
        "is-success"
      );
      prepareShareUrl();
      return;
    }

    const payloadText = JSON.stringify(buildSharePayload());
    const shareUrl =
      preparedSharePayloadKey === payloadText && preparedShareUrl
        ? preparedShareUrl
        : await buildShareUrl();

    if (shareUrl.length > 7000) {
      throw new Error("공유 내용이 많아 링크가 너무 깁니다. 메모를 조금 줄인 뒤 다시 시도해주세요.");
    }

    const copied = await copyText(shareUrl);

    if (!copied) {
      showManualCopyPrompt(shareUrl);
      setSourceStatus("자동 복사가 막혀 링크를 직접 복사할 수 있게 열어드렸습니다.", "is-success");
      prepareShareUrl();
      return;
    }

    setSourceStatus(
      `공유 링크를 복사했습니다. 즐겨찾기 ${favoriteEntries.length}개와 체크리스트/메모가 함께 포함됐습니다.`,
      "is-success"
    );
    prepareShareUrl();
  } catch (error) {
    setSourceStatus(error instanceof Error ? error.message : "공유 링크를 만드는 중 오류가 발생했습니다.", "is-error");
  }
};

const clearSharedHashFromUrl = () => {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (!hash) {
    return;
  }

  const hashParams = new URLSearchParams(hash);
  hashParams.delete(SHARE_HASH_KEY);

  const nextHash = hashParams.toString();
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ""}`;
  window.history.replaceState({}, document.title, nextUrl);
};

const applySharedLinkFromUrl = async () => {
  if (isSharedRoomMode()) {
    return;
  }

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (!hash) {
    return;
  }

  const hashParams = new URLSearchParams(hash);
  const encodedPayload = hashParams.get(SHARE_HASH_KEY);
  if (!encodedPayload) {
    return;
  }

  try {
    const payloadText = await decodeSharePayload(encodedPayload);
    const payload = JSON.parse(payloadText);
    importSharedPayload(payload, "공유 링크");
    clearSharedHashFromUrl();
  } catch (error) {
    setSourceStatus(error instanceof Error ? error.message : "공유 링크를 불러오는 중 오류가 발생했습니다.", "is-error");
  }
};

const getHallSourceNote = (hall) => String(hall.tags || hall.memo || "").trim();

const renderSourceNote = (hall) => {
  const note = getHallSourceNote(hall);
  if (!note) {
    return "";
  }

  return `<p class="card-note">${sanitizeText(note)}</p>`;
};

const renderUserMemoField = (hall) => `
  <label class="memo-section">
    <span class="memo-label">내 메모</span>
    <textarea class="memo-textarea" data-memo-key="${sanitizeText(getFavoriteKey(hall))}" placeholder="이 웨딩홀에 대한 메모를 남겨보세요.">${sanitizeText(getUserMemo(hall))}</textarea>
    <small class="memo-help">메모는 이 기기에 자동 저장되며 업데이트 후에도 유지됩니다.</small>
  </label>
`;

const renderFavoriteButton = (hall, className = "") => {
  const active = isFavoriteHall(hall);
  const label = active ? "즐겨찾기 해제" : "즐겨찾기 추가";
  const classes = `favorite-button ${className} ${active ? "is-active" : ""}`.trim();

  return `
    <button
      type="button"
      class="${classes}"
      data-favorite-key="${sanitizeText(getFavoriteKey(hall))}"
      aria-pressed="${active}"
      aria-label="${label}"
      title="${label}"
    >
      <span aria-hidden="true">${active ? "★" : "☆"}</span>
    </button>
  `;
};

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
  hallName: normalizeSearchText(hallNameInput.value),
  mealMax: Number(mealPriceInput.value) || null,
  guests: Number(guestCountInput.value) || null,
  rentMax: Number(rentPriceInput.value) || null,
  district: districtSelect.value,
  sort: sortSelect.value,
});

const matchesFilters = (hall, filters) => {
  if (filters.hallName) {
    const normalizedName = normalizeSearchText(hall.name);
    const compactName = compactSearchText(hall.name);
    const compactQuery = compactSearchText(filters.hallName);

    if (!normalizedName.includes(filters.hallName) && !compactName.includes(compactQuery)) {
      return false;
    }
  }

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

  if (filters.sort === "toneBright" && !matchesHallTone(hall, "밝은")) {
    return false;
  }

  if (filters.sort === "toneDark" && !matchesHallTone(hall, "어두운")) {
    return false;
  }

  if (filters.sort === "toneMixed" && !matchesHallTone(hall, "혼합")) {
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
    case "toneBright":
    case "toneDark":
    case "toneMixed":
    default:
      sorted.sort(
        (a, b) => (getEstimatedTotalCost(a, filters.guests) ?? Infinity) - (getEstimatedTotalCost(b, filters.guests) ?? Infinity)
      );
      break;
  }

  return sorted;
};

const buildSummary = (filters, results) => {
  const parts = [];

  if (filters.hallName) {
    parts.push(`이름 '${filters.hallName}'`);
  }
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

  if (filters.sort === "toneBright") {
    parts.push("밝은홀만");
  }

  if (filters.sort === "toneDark") {
    parts.push("어두운홀만");
  }

  if (filters.sort === "toneMixed") {
    parts.push("혼합홀만");
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

activeRoomId = getRoomIdFromUrl();

favoriteEntries = loadFavoriteEntries();
if (!isSharedRoomMode() && shouldPersistMigratedFavorites && favoriteEntries.length) {
  saveFavoriteEntries();
}
memoByHallKey = loadUserMemos();
prepareShareUrl();

const restoreShareSessionIfNeeded = () => {
  if (isSharedRoomMode()) {
    return false;
  }

  const savedSession = loadShareSession();
  if (!savedSession) {
    return false;
  }

  activeShareSessionLabel = savedSession.sourceLabel;
  favoriteEntries = savedSession.favorites;
  memoByHallKey = savedSession.memos;
  checklistStateByHallKey = savedSession.checklistStates;
  checklistMemoByHallKey = savedSession.checklistMemos;
  prepareShareUrl();
  setSourceStatus(`${activeShareSessionLabel} 임시본을 이 창에서 이어서 보고 있습니다.`, "is-success");
  return true;
};

const renderFavorites = (items, guestCount) => {
  const storedFavoriteCount = favoriteEntries.length;

  favoriteCountBadge.textContent = `${numberFormatter.format(storedFavoriteCount)}개`;
  if (copyShareLinkButton) {
    copyShareLinkButton.textContent = canUseSharedRooms()
      ? isSharedRoomMode()
        ? "공유 room 링크 복사"
        : "공유 room 만들기"
      : "공유 링크 복사";
  }
  if (restoreLocalDataButton) {
    restoreLocalDataButton.hidden = !(activeShareSessionLabel || isSharedRoomMode());
  }
  clearFavoritesButton.hidden = storedFavoriteCount === 0;

  if (!storedFavoriteCount) {
    favoriteSummary.textContent = isSharedRoomMode()
      ? `${getSharedRoomLabel()}에 연결되어 있습니다. 이 링크를 연 사람끼리 같은 즐겨찾기, 체크리스트, 메모를 함께 수정합니다.`
      : activeShareSessionLabel
        ? `${activeShareSessionLabel} 임시본입니다. 이 창의 체크리스트와 메모 변경 내용은 내 기본 목록에 자동 저장되지 않습니다.`
        : "별 버튼을 눌러 마음에 드는 웨딩홀을 따로 모아보세요.";
    favoriteList.innerHTML = `
      <div class="empty-state favorite-empty-state">
        아직 찜한 웨딩홀이 없습니다.<br />
        검색 결과에서 별 버튼을 누르면 이곳에 자동으로 모입니다.
      </div>
    `;
    return;
  }

  favoriteSummary.textContent = isSharedRoomMode()
    ? `${getSharedRoomLabel()}에 총 ${numberFormatter.format(storedFavoriteCount)}개 웨딩홀이 담겨 있습니다. 이 링크를 받은 사람과 즐겨찾기, 체크리스트, 메모를 함께 이어서 수정할 수 있습니다.`
    : activeShareSessionLabel
      ? `${activeShareSessionLabel} 임시본입니다. 총 ${numberFormatter.format(storedFavoriteCount)}개 웨딩홀의 체크리스트와 메모를 이 창에서만 따로 보고 있습니다.`
      : `총 ${numberFormatter.format(storedFavoriteCount)}개 웨딩홀을 찜해두었습니다. 이후 데이터가 업데이트되어도 이 목록은 저장 당시 정보 기준으로 유지됩니다.`;

  favoriteList.innerHTML = items
    .map((hall) => `
      <article class="favorite-card">
        <div class="favorite-card-top">
          <div>
            <div class="favorite-card-heading">
              <h3>${sanitizeText(hall.name)}</h3>
              <span class="favorite-card-district">${sanitizeText(hall.district || "지역 정보 없음")}</span>
            </div>
            <p class="favorite-card-address">${sanitizeText(hall.address || "-")}</p>
          </div>
          ${renderFavoriteButton(hall, "favorite-card-button")}
        </div>

        <div class="favorite-card-price">
          <span>예상 총비용</span>
          <strong>${formatMoney(getEstimatedTotalCost(hall, guestCount))}</strong>
        </div>

        <div class="favorite-card-meta">
          <span>식대 ${formatMoney(hall.mealPrice)}</span>
          <span>최소보증 ${formatCount(hall.minimumGuarantee)}</span>
          <span>대관료 ${formatMoney(hall.rentPrice)}</span>
          <span>${sanitizeText(hall.hallType || "홀 정보 없음")}</span>
          <span>${sanitizeText(hall.menu || "메뉴 미상")}</span>
          <span>${sanitizeText(hall.hallTone || "톤 정보 없음")}</span>
          <span>${sanitizeText(getDisplayText(hall.ceremonyType, "예식형태 미입력"))}</span>
          <span>${sanitizeText(formatCeremonyInterval(hall.ceremonyTime, "간격 미입력"))}</span>
          <span>${sanitizeText(formatHallCountChip(hall.hallCount, "홀수 미입력"))}</span>
        </div>

        <p class="favorite-card-formula">${sanitizeText(getCostFormulaLabel(hall, guestCount))}</p>
        ${renderSourceNote(hall)}
        ${renderUserMemoField(hall)}

        <div class="card-links">
          ${hall.homepage ? `<a href="${sanitizeText(hall.homepage)}" target="_blank" rel="noreferrer">홈페이지</a>` : ""}
          ${hall.naverMap ? `<a href="${sanitizeText(hall.naverMap)}" target="_blank" rel="noreferrer">네이버지도</a>` : ""}
        </div>
      </article>
    `)
    .join("");
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
    .map((hall, index) => {
      const estimatedGuests = getEstimateGuestCount(hall, guestCount);
      const totalCost = getEstimatedTotalCost(hall, guestCount);

      return `
        <article class="hall-card" style="animation-delay:${index * 0.04}s">
          <div class="card-top">
            <div class="card-top-main">
              <span class="badge">${sanitizeText(hall.zone || "기타")} · ${sanitizeText(hall.hallType || "정보없음")}</span>
            </div>
            ${renderFavoriteButton(hall, "card-favorite-button")}
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
            <span>${sanitizeText(getDisplayText(hall.ceremonyType, "예식형태 미입력"))}</span>
            <span>${sanitizeText(formatCeremonyInterval(hall.ceremonyTime, "간격 미입력"))}</span>
            <span>${sanitizeText(formatHallCountChip(hall.hallCount, "홀수 미입력"))}</span>
          </div>

          ${renderSourceNote(hall)}
          ${renderUserMemoField(hall)}

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
        <td colspan="12">검색 결과가 없습니다.</td>
      </tr>
    `;
    return;
  }

  resultTableBody.innerHTML = items
    .map((hall) => `
      <tr>
        <td class="table-name-cell">
          ${renderFavoriteButton(hall, "table-favorite-button")}
          <span class="table-name">${sanitizeText(hall.name)}</span>
        </td>
        <td>${sanitizeText(hall.district || "-")}</td>
        <td>${sanitizeText(getDisplayText(hall.ceremonyType, "-"))}</td>
        <td>${sanitizeText(formatCeremonyInterval(hall.ceremonyTime, "-"))}</td>
        <td>${sanitizeText(formatHallCountChip(hall.hallCount, "-"))}</td>
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

const getChecklistProgress = (hallChecklistState = getChecklistStateForHallKey()) => {
  const total = CONSULTATION_CHECKLIST_ITEM_IDS.size;
  const completed = Array.from(CONSULTATION_CHECKLIST_ITEM_IDS).filter((itemId) => hallChecklistState[itemId]).length;
  const remaining = Math.max(total - completed, 0);
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  return { total, completed, remaining, percentage };
};

const renderChecklistHallList = (favoriteItems) => {
  if (!checklistHallList) {
    return;
  }

  if (!favoriteItems.length) {
    checklistHallList.innerHTML = `
      <div class="checklist-empty-state">
        찜한 웨딩홀이 아직 없습니다.<br />
        아래 웨딩홀 카드에서 별 버튼을 눌러 계약 체크리스트를 만들 홀을 먼저 담아주세요.
      </div>
    `;
    return;
  }

  checklistHallList.innerHTML = favoriteItems
    .map((hall) => {
      const progress = getChecklistProgress(getChecklistStateForHallKey(hall.favoriteKey));
      return `
        <button
          type="button"
          class="checklist-hall-chip ${hall.favoriteKey === selectedChecklistHallKey ? "is-active" : ""}"
          data-checklist-hall-key="${sanitizeText(hall.favoriteKey)}"
        >
          <span class="checklist-hall-chip-name">${sanitizeText(hall.name)}</span>
          <span class="checklist-hall-chip-meta">${sanitizeText(hall.district || "지역 미입력")} · ${sanitizeText(hall.hallType || "홀 타입 미입력")}</span>
          <span class="checklist-hall-chip-progress">${numberFormatter.format(progress.completed)}/${numberFormatter.format(progress.total)}개 체크 완료</span>
        </button>
      `;
    })
    .join("");
};

const updateChecklistSummary = (selectedHall, hallChecklistState) => {
  if (!checklistCompletedCount || !checklistRemainingCount || !checklistTotalCount || !checklistProgressPercent || !checklistProgressText || !checklistProgressBar) {
    return;
  }

  const progress = getChecklistProgress(hallChecklistState);
  checklistCompletedCount.textContent = numberFormatter.format(progress.completed);
  checklistRemainingCount.textContent = numberFormatter.format(progress.remaining);
  checklistTotalCount.textContent = numberFormatter.format(progress.total);
  checklistProgressPercent.textContent = `${progress.percentage}%`;
  checklistProgressText.textContent = selectedHall
    ? `${selectedHall.name}에서 총 ${numberFormatter.format(progress.total)}개 중 ${numberFormatter.format(progress.completed)}개 완료`
    : "찜한 웨딩홀을 선택하면 홀별 진행률이 표시됩니다.";
  checklistProgressBar.style.width = `${progress.percentage}%`;
  if (checklistResetButton) {
    checklistResetButton.disabled = !selectedHall || progress.completed === 0;
  }
};

const renderChecklist = () => {
  if (!checklistCategoryGrid) {
    return;
  }

  const favoriteItems = getFavoriteHalls();
  const selectedHall = getSelectedChecklistHall(favoriteItems);
  renderChecklistHallList(favoriteItems);

  if (!selectedHall) {
    if (checklistSelectedHallName) {
      checklistSelectedHallName.textContent = "찜한 웨딩홀을 먼저 추가해주세요";
    }
    if (checklistSelectedHallMeta) {
      checklistSelectedHallMeta.textContent = "찜 목록의 홀만 계약 체크리스트 하위 목록에 자동으로 추가됩니다.";
    }
    if (consultationMemo) {
      consultationMemo.value = "";
      consultationMemo.disabled = true;
      consultationMemo.placeholder = "찜한 웨딩홀을 먼저 추가하면 홀별 계약 메모를 저장할 수 있습니다.";
    }

    checklistCategoryGrid.innerHTML = `
      <div class="empty-state">
        아직 계약 체크리스트를 열 홀이 없습니다.<br />
        웨딩홀 카드나 찜한 웨딩홀 목록에서 별 버튼을 눌러 먼저 체크할 홀을 선택해주세요.
      </div>
    `;
    updateChecklistSummary(null, {});
    return;
  }

  const hallChecklistState = getChecklistStateForHallKey(selectedHall.favoriteKey);
  const hallProgress = getChecklistProgress(hallChecklistState);

  if (checklistSelectedHallName) {
    checklistSelectedHallName.textContent = selectedHall.name;
  }
  if (checklistSelectedHallMeta) {
    checklistSelectedHallMeta.textContent = `${selectedHall.district || "지역 미입력"} · ${selectedHall.address || "주소 미입력"} · ${numberFormatter.format(hallProgress.completed)}/${numberFormatter.format(hallProgress.total)}개 체크 완료`;
  }
  if (consultationMemo) {
    const nextChecklistMemo = getChecklistMemoForHallKey(selectedHall.favoriteKey);
    if (consultationMemo.value !== nextChecklistMemo) {
      consultationMemo.value = nextChecklistMemo;
    }
    consultationMemo.disabled = false;
    consultationMemo.placeholder = `${selectedHall.name} 계약 메모를 적어두세요. 예: 무료 혜택은 별첨 견적서에 꼭 명시 요청`;
  }

  checklistCategoryGrid.innerHTML = CONSULTATION_CHECKLIST.map((category) => {
    const completedCount = category.items.filter((item) => hallChecklistState[item.id]).length;
    const isComplete = completedCount === category.items.length;

    return `
      <section class="checklist-category-card ${isComplete ? "is-complete" : ""}">
        <div class="checklist-category-head">
          <div class="checklist-category-copy">
            <span class="checklist-category-eyebrow">${sanitizeText(category.eyebrow)}</span>
            <h3>${sanitizeText(category.title)}</h3>
            <p>${sanitizeText(category.description)}</p>
          </div>
          <strong class="checklist-category-count">${numberFormatter.format(completedCount)}/${numberFormatter.format(category.items.length)}</strong>
        </div>

        <div class="checklist-items">
          ${category.items
            .map((item) => {
              const checked = hallChecklistState[item.id] === true;
              return `
                <label class="checklist-item ${checked ? "is-checked" : ""}" for="checklist-${sanitizeText(item.id)}">
                  <input
                    id="checklist-${sanitizeText(item.id)}"
                    class="checklist-checkbox"
                    type="checkbox"
                    data-checklist-item="${sanitizeText(item.id)}"
                    ${checked ? "checked" : ""}
                  />
                  <span class="checklist-item-text">${sanitizeText(item.text)}</span>
                </label>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  }).join("");

  updateChecklistSummary(selectedHall, hallChecklistState);
};

const handleChecklistHallSelection = (event) => {
  const nextHallButton = event.target.closest("[data-checklist-hall-key]");
  if (!nextHallButton) {
    return;
  }

  const nextHallKey = String(nextHallButton.dataset.checklistHallKey || "").trim();
  if (!nextHallKey) {
    return;
  }

  selectedChecklistHallKey = nextHallKey;
  openChecklistModal(nextHallKey);
};

const handleChecklistModalClose = (event) => {
  if (event.target.closest("[data-checklist-modal-close]")) {
    closeChecklistModal();
  }
};

const handleChecklistModalKeydown = (event) => {
  if (event.key === "Escape" && isChecklistModalOpen) {
    closeChecklistModal();
  }
};

const handleChecklistChange = (event) => {
  const checkbox = event.target.closest("[data-checklist-item]");
  if (!checkbox) {
    return;
  }

  const itemId = String(checkbox.dataset.checklistItem || "").trim();
  if (!CONSULTATION_CHECKLIST_ITEM_IDS.has(itemId)) {
    return;
  }

  const activeChecklistHall = getSelectedChecklistHall();
  if (!activeChecklistHall) {
    return;
  }

  const nextChecklistState = {
    ...getChecklistStateForHallKey(activeChecklistHall.favoriteKey),
    [itemId]: checkbox.checked,
  };

  if (!checkbox.checked) {
    delete nextChecklistState[itemId];
  }

  updateChecklistStateForHallKey(activeChecklistHall.favoriteKey, nextChecklistState);
  renderChecklist();
};

const handleChecklistMemoInput = (event) => {
  const activeChecklistHall = getSelectedChecklistHall();
  if (!activeChecklistHall) {
    return;
  }

  updateChecklistMemoByHallKey(activeChecklistHall.favoriteKey, event.target.value);
};

const resetChecklist = () => {
  const activeChecklistHall = getSelectedChecklistHall();
  if (!activeChecklistHall) {
    return;
  }

  const activeChecklistState = getChecklistStateForHallKey(activeChecklistHall.favoriteKey);
  if (!Object.keys(activeChecklistState).length) {
    return;
  }

  if (!window.confirm(`${activeChecklistHall.name}에서 체크한 계약 항목을 모두 해제할까요? 메모는 유지됩니다.`)) {
    return;
  }

  updateChecklistStateForHallKey(activeChecklistHall.favoriteKey, {});
  renderChecklist();
};

const update = () => {
  const filters = getFilters();
  const filtered = halls.filter((hall) => matchesFilters(hall, filters));
  const sorted = sortHalls(filtered, filters);
  const favoriteItems = getFavoriteHalls();

  activeSummary.textContent = buildSummary(filters, sorted);
  renderStats(sorted, filters.guests);
  renderFavorites(favoriteItems, filters.guests);
  renderChecklist();
  renderCards(sorted, filters.guests);
  renderTable(sorted, filters.guests);
};

const resetFilters = () => {
  hallNameInput.value = "";
  mealPriceInput.value = "";
  guestCountInput.value = "";
  rentPriceInput.value = "";
  districtSelect.value = "";
  sortSelect.value = "totalAsc";
  update();
};

const restoreLocalDataView = () => {
  if (isSharedRoomMode()) {
    stopSharedRoomSubscription();
    activeRoomId = "";
    updateRoomUrl("");
  }

  clearShareSession();
  favoriteEntries = loadFavoriteEntries();
  memoByHallKey = loadUserMemos();
  checklistStateByHallKey = loadChecklistState();
  checklistMemoByHallKey = loadChecklistMemo();
  prepareShareUrl();
  update();
  setSourceStatus("내 기기에 저장된 기본 즐겨찾기, 체크리스트, 메모로 돌아왔습니다.", "is-success");
};

const setSourceStatus = (message, type = "") => {
  uploadStatus.textContent = message;
  uploadStatus.className = "upload-status";
  if (type) {
    uploadStatus.classList.add(type);
  }
};

const showUpdateBanner = (message, registration) => {
  pendingUpdateRegistration = registration ?? pendingUpdateRegistration;
  if (updateBannerMessage) {
    updateBannerMessage.textContent = message;
  }
  if (updateBanner) {
    updateBanner.hidden = false;
  }
};

const hideUpdateBanner = () => {
  if (updateBanner) {
    updateBanner.hidden = true;
  }
};

const applyPendingUpdate = () => {
  const waitingWorker = pendingUpdateRegistration?.waiting;
  if (waitingWorker) {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    return;
  }
  window.location.reload();
};

const normalizeRecords = (records) =>
  records.map((item) => {
    const mealAveragePrice = parseIntValue(item["식대 평균가(원)"]);
    const mealStartPrice = parseIntValue(item["식대 시작가(원)"]);
    const minimumRentPrice = parseIntValue(item["최소 대관료(원)"]);
    const baseRentPrice = parseIntValue(item["대관료(원)"]);
    const rawHallCount = item.홀수 || item["홀수"] || item["홀 수"] || item["홀수(개)"] || "";
    const parsedHallCount = parseIntValue(rawHallCount);
    const ceremonyInterval = item["예식간격(분)"] || item.예식시간 || item["예식 시간"] || "";

    return {
      id: parseIntValue(item.ID),
      name: item["웨딩홀 이름"] || "",
      district: item.구 || "",
      address: item.주소 || "",
      hallType: item.홀타입 || "",
      hallTone: item["홀톤(밝은/어두운/혼합)"] || "",
      ceremonyType: item.예식형태 || "",
      ceremonyTime: ceremonyInterval,
      hallCount: parsedHallCount ?? (String(rawHallCount).trim() || null),
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
  refreshSharedRoomStateAfterHallRefresh();
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
      refreshSharedRoomStateAfterHallRefresh();
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
      refreshSharedRoomStateAfterHallRefresh();
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
    refreshSharedRoomStateAfterHallRefresh();
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

const handleFavoriteButtonClick = (event) => {
  const favoriteButton = event.target.closest("[data-favorite-key]");
  if (!favoriteButton) {
    return;
  }

  event.preventDefault();
  toggleFavoriteHallByKey(favoriteButton.dataset.favoriteKey);
};

const handleMemoInput = (event) => {
  const memoField = event.target.closest("[data-memo-key]");
  if (!memoField) {
    return;
  }

  updateUserMemoByKey(memoField.dataset.memoKey, memoField.value);

  document.querySelectorAll("[data-memo-key]").forEach((field) => {
    if (field !== memoField && field.dataset.memoKey === memoField.dataset.memoKey) {
      field.value = memoField.value;
    }
  });
};

[hallNameInput, mealPriceInput, guestCountInput, rentPriceInput, districtSelect, sortSelect].forEach((element) => {
  element.addEventListener("input", update);
  element.addEventListener("change", update);
});

resetButton.addEventListener("click", resetFilters);
excelUpload.addEventListener("change", handleExcelUpload);
reloadBuiltinButton.addEventListener("click", handleBuiltinReload);
updateRefreshButton?.addEventListener("click", applyPendingUpdate);
updateDismissButton?.addEventListener("click", hideUpdateBanner);
copyShareLinkButton?.addEventListener("click", copyShareLink);
restoreLocalDataButton?.addEventListener("click", restoreLocalDataView);
checklistResetButton?.addEventListener("click", resetChecklist);
checklistHallList?.addEventListener("click", handleChecklistHallSelection);
checklistModal?.addEventListener("click", handleChecklistModalClose);
checklistModalCloseButton?.addEventListener("click", closeChecklistModal);
cardList?.addEventListener("click", handleFavoriteButtonClick);
resultTableBody?.addEventListener("click", handleFavoriteButtonClick);
favoriteList?.addEventListener("click", handleFavoriteButtonClick);
checklistCategoryGrid?.addEventListener("change", handleChecklistChange);
cardList?.addEventListener("input", handleMemoInput);
favoriteList?.addEventListener("input", handleMemoInput);
consultationMemo?.addEventListener("input", handleChecklistMemoInput);
clearFavoritesButton?.addEventListener("click", clearAllFavorites);
window.addEventListener("hashchange", () => {
  applySharedLinkFromUrl();
});
window.addEventListener("keydown", handleChecklistModalKeydown);

window.addEventListener("weddingpick:update-ready", (event) => {
  const registration = event.detail?.registration ?? null;
  showUpdateBanner("새 버전이 준비됐어요. 최신 화면과 데이터를 보려면 새로고침하세요.", registration);
});

checklistStateByHallKey = loadChecklistState();
checklistMemoByHallKey = loadChecklistMemo();

rebuildDistrictOptions();
restoreShareSessionIfNeeded();
prepareShareUrl();
update();

handleBuiltinReload();
if (isSharedRoomMode()) {
  activateSharedRoom(activeRoomId, { updateHistory: false });
} else {
  applySharedLinkFromUrl();
}
