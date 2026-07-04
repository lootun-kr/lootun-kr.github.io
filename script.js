const ASSET_VERSION = "20260705-detail-refresh";
const DATA_URL = `data/products.json?v=${ASSET_VERSION}`;
const page = document.body;
const yearTarget = document.getElementById("year");

if (yearTarget) {
  yearTarget.textContent = String(new Date().getFullYear());
}

const header = document.querySelector("[data-header]");
if (header) {
  const syncHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
}

function cssVars(product) {
  const palette = product.palette || ["#60786b", "#176b71", "#cb664f"];
  return `--card-a:${palette[0]};--card-b:${palette[1]};--card-c:${palette[2]};`;
}

function versionedImageSrc(src) {
  if (!src || /^(data:|blob:|https?:\/\/)/i.test(src)) return src;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${ASSET_VERSION}`;
}

function productImages(product) {
  return sortByFileName(product.thumbnailImages || product.thumbnails || (product.image ? [product.image] : []));
}

function primaryProductImage(product) {
  return productImages(product)[0] || "";
}

function productArt(product, isDetail = false) {
  const imageSrc = primaryProductImage(product);
  const image = imageSrc ? `<img src="${versionedImageSrc(imageSrc)}" alt="${product.name}" />` : "";
  const shape = imageSrc ? "" : '<span class="product-shape" aria-hidden="true"></span>';
  const imageClass = imageSrc ? " has-image" : "";
  const detailClass = isDetail ? " detail-art" : " product-art";
  return `<div class="${detailClass.trim()}${imageClass}" style="${cssVars(product)}">${image}${shape}</div>`;
}

function sortByFileName(paths = []) {
  return [...paths].sort((a, b) => {
    const fileA = a.split("/").pop() || a;
    const fileB = b.split("/").pop() || b;
    return fileA.localeCompare(fileB, "en", { numeric: true, sensitivity: "base" });
  });
}

function productKey(product) {
  return product.model || product.name;
}

function productThumbnailStrip(product) {
  const thumbnails = productImages(product);
  if (thumbnails.length <= 1) return "";
  return `
    <div class="thumbnail-strip" aria-label="${product.name} 썸네일">
      ${thumbnails
        .map((src, index) => `<img src="${versionedImageSrc(src)}" alt="${product.name} 썸네일 ${index + 1}" />`)
        .join("")}
    </div>
  `;
}

function productCard(product, compact = false) {
  const tags = product.tags?.slice(0, 2).join(" · ") || product.category;
  const modelPill = product.model ? `<span>${product.model}</span>` : "";
  const model = productKey(product);
  return `
    <a class="product-card${compact ? " compact" : ""}" href="product.html?model=${encodeURIComponent(model)}" aria-label="${product.name} 상세페이지 보기" style="${cssVars(product)}">
      ${productArt(product)}
      <div class="card-scrim" aria-hidden="true"></div>
      <div class="product-body">
        <div class="card-pills">
          <span>${product.category}</span>
          ${modelPill}
          <span>LOOTUN</span>
        </div>
        <h4>${product.name}</h4>
        <p>${compact ? tags : product.summary}</p>
        <span class="detail-link">상품 보기</span>
      </div>
    </a>
  `;
}

function groupByCategory(products) {
  return products.reduce((groups, product) => {
    if (!groups.has(product.category)) groups.set(product.category, []);
    groups.get(product.category).push(product);
    return groups;
  }, new Map());
}

function makeRail(category, products, categoryInfo) {
  const slug = categoryInfo?.slug || category;
  const description = categoryInfo?.description || "LOOTUN 카탈로그 상품";
  return `
    <section class="category-rail" data-category="${category}" id="${slug}">
      <div class="rail-header">
        <div class="rail-title">
          <h3>${category}</h3>
          <p>${description}</p>
        </div>
        <div class="rail-controls" aria-label="${category} 스크롤">
          <button class="icon-button" type="button" data-scroll="prev" aria-label="이전 상품">←</button>
          <button class="icon-button" type="button" data-scroll="next" aria-label="다음 상품">→</button>
        </div>
      </div>
      <div class="product-rail" tabindex="0">
        ${products.map((product) => productCard(product)).join("")}
      </div>
    </section>
  `;
}

function initRailControls(root = document) {
  root.querySelectorAll(".category-rail").forEach((section) => {
    const rail = section.querySelector(".product-rail");
    section.querySelectorAll("[data-scroll]").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = button.dataset.scroll === "next" ? 1 : -1;
        rail.scrollBy({
          left: direction * Math.max(340, rail.clientWidth * 0.7),
          behavior: "smooth",
        });
      });
    });

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let moved = false;
    let suppressClick = false;

    rail.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      isDown = true;
      moved = false;
      suppressClick = false;
      startX = event.clientX;
      scrollLeft = rail.scrollLeft;
    });

    rail.addEventListener("pointermove", (event) => {
      if (!isDown) return;
      const walk = event.clientX - startX;
      if (Math.abs(walk) <= 10 && !moved) return;
      moved = true;
      suppressClick = true;
      rail.classList.add("is-dragging");
      rail.scrollLeft = scrollLeft - walk;
      event.preventDefault();
    });

    const stopDrag = () => {
      if (!isDown) return;
      isDown = false;
      rail.classList.remove("is-dragging");
    };

    rail.addEventListener("pointerup", stopDrag);
    rail.addEventListener("pointercancel", stopDrag);
    rail.addEventListener("pointerleave", stopDrag);
    rail.addEventListener("click", (event) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
        return;
      }

      const card = event.target.closest(".product-card");
      if (!card || !rail.contains(card)) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      window.location.assign(card.href);
    }, true);
  });
}

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function matchesSearch(product, query) {
  if (!query) return true;
  const haystack = [
    product.name,
    product.category,
    product.summary,
    ...(product.tags || []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function renderCatalog(data) {
  const stack = document.getElementById("category-stack");
  const tabs = document.getElementById("category-tabs");
  const search = document.getElementById("product-search");
  const status = document.getElementById("catalog-status");
  if (!stack || !tabs || !search || !status) return;

  let activeCategory = "all";
  const categories = data.categories;
  const categoryByName = new Map(categories.map((category) => [category.name, category]));

  tabs.innerHTML = [
    `<button class="tab-button is-active" type="button" data-category="all">전체</button>`,
    ...categories.map(
      (category) =>
        `<button class="tab-button" type="button" data-category="${category.name}">${category.name}</button>`,
    ),
  ].join("");

  const draw = () => {
    const query = normalize(search.value);
    const filtered = data.products.filter((product) => {
      const categoryMatch = activeCategory === "all" || product.category === activeCategory;
      return categoryMatch && matchesSearch(product, query);
    });
    const grouped = groupByCategory(filtered);

    stack.innerHTML = categories
      .filter((category) => grouped.has(category.name))
      .map((category) => makeRail(category.name, grouped.get(category.name), categoryByName.get(category.name)))
      .join("");

    if (!filtered.length) {
      stack.innerHTML = '<div class="empty-state">조건에 맞는 상품이 없습니다.</div>';
    }

    status.textContent = `${filtered.length}개 상품`;
    initRailControls(stack);
  };

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    tabs.querySelectorAll(".tab-button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    draw();
  });

  search.addEventListener("input", draw);
  draw();
}

function renderDetail(data) {
  const detail = document.getElementById("product-detail");
  const detailImages = document.getElementById("detail-image-section");
  const related = document.getElementById("related-grid");
  if (!detail || !related) return;

  const params = new URLSearchParams(window.location.search);
  const model = params.get("model");
  const product = data.products.find((item) => productKey(item) === model);
  if (!product) {
    detail.innerHTML = `
      <div class="empty-state">
        <h1>상품을 찾을 수 없습니다.</h1>
        <p>카탈로그에서 다시 상품을 선택해주세요.</p>
      </div>
    `;
    return;
  }

  document.title = `${product.name} | LOOTUN 루툰`;
  const links = product.links || {};
  const coupangButton = links.coupang
    ? `<a class="button primary" href="${links.coupang}" target="_blank" rel="noopener noreferrer">쿠팡 바로가기</a>`
    : '<span class="button unavailable" aria-disabled="true">쿠팡 링크 준비중</span>';
  const naverButton = links.naver
    ? `<a class="button ghost solid-ghost" href="${links.naver}" target="_blank" rel="noopener noreferrer">네이버 스마트스토어 바로가기</a>`
    : '<span class="button unavailable" aria-disabled="true">네이버 스마트스토어 준비중</span>';
  detail.innerHTML = `
    <div class="detail-media">
      ${productArt(product, true)}
      ${productThumbnailStrip(product)}
    </div>
    <div class="detail-copy">
      <span class="product-kicker">${product.category}</span>
      <h1>${product.name}</h1>
      ${product.model ? `<p class="model-line">Model ${product.model}</p>` : ""}
      <p class="summary">${product.description || product.summary}</p>
      <div class="store-actions" aria-label="구매 링크">
        ${coupangButton}
        ${naverButton}
      </div>
      <ul class="tag-list">
        ${(product.tags || []).map((tag) => `<li>${tag}</li>`).join("")}
      </ul>
      <div class="spec-panel">
        <h2>상품 정보</h2>
        <ul class="spec-list">
          ${product.model ? `<li>모델명 ${product.model}</li>` : ""}
          ${(product.specs || []).map((spec) => `<li>${spec}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;

  if (detailImages) {
    const images = sortByFileName(product.detailImages || []);
    detailImages.hidden = !images.length;
    detailImages.innerHTML = images.length
      ? `
        <div class="section-heading compact">
          <p class="eyebrow">DETAIL</p>
          <h2>상품 상세페이지</h2>
        </div>
        <div class="detail-image-stack">
          ${images
            .map(
              (src, index) =>
                `<img src="${versionedImageSrc(src)}" alt="${product.name} 상세 이미지 ${index + 1}" />`,
            )
            .join("")}
        </div>
      `
      : "";
  }

  const relatedProducts = data.products
    .filter((item) => item.category === product.category && productKey(item) !== productKey(product))
    .slice(0, 4);
  related.innerHTML = relatedProducts.length
    ? relatedProducts.map((item) => productCard(item, true)).join("")
    : '<div class="empty-state small">같은 카테고리 상품을 준비중입니다.</div>';
}

fetch(DATA_URL)
  .then((response) => {
    if (!response.ok) throw new Error("상품 데이터를 불러오지 못했습니다.");
    return response.json();
  })
  .then((data) => {
    renderCatalog(data);
    renderDetail(data);
  })
  .catch((error) => {
    const target = document.getElementById("category-stack") || document.getElementById("product-detail");
    if (target) {
      target.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
  });
