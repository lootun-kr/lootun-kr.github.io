# LOOTUN 루툰 Brand Catalog

GitHub Pages용 정적 상품 카탈로그 사이트입니다.

## Structure

- `index.html`: 브랜드 첫 화면과 카테고리별 상품 카드 레일
- `product.html`: 상품 상세 페이지
- `data/products.json`: 카테고리와 상품 데이터
- `styles.css`: 화면 스타일
- `script.js`: 상품 렌더링, 검색, 가로 스크롤 제어
- `assets/images/`: 이미지 자산

## Edit Products

상품을 수정하려면 `data/products.json`의 `products` 배열을 편집합니다.

- `model`: 상세 페이지 URL과 상품 관리에 쓰이는 고유 모델번호
- `category`: 상단 `categories`의 `name`과 일치해야 함
- `name`, `summary`, `description`: 화면 표시 문구
- `links.coupang`: 상세 페이지의 쿠팡 바로가기 URL
- `links.naver`: 상세 페이지의 네이버 스마트스토어 바로가기 URL
- `thumbnailImages`: 상품 카드와 상세 상단에 쓰는 썸네일 이미지 경로 목록
- `detailImages`: 상세페이지 본문 이미지 경로 목록
- `palette`: 임시 그래픽 패널 색상 3개

상세 페이지 주소 예시:

```text
product.html?model=LT-001
```

## Bulk Import Products

상품이 여러 개이면 CSV로 한 번에 등록할 수 있습니다.

1. `imports/products-template.csv`를 복사해서 상품 정보를 채웁니다.
2. 썸네일 이미지는 `assets/images/products/{모델번호소문자}/thumbnail/` 폴더에 넣습니다.
3. 상세 이미지는 `assets/images/products/{모델번호소문자}/detail/` 폴더에 넣습니다.
4. 아래 명령을 실행합니다.

```sh
python3 scripts/import_products.py imports/products-template.csv
```

기본 동작은 `model`이 같은 상품을 업데이트하고, 새 `model`은 추가합니다. 전체 상품을 CSV 기준으로 교체하려면 `--replace`를 붙입니다.

```sh
python3 scripts/import_products.py imports/products-template.csv --replace
```

CSV에서 여러 값을 넣는 칸은 `|`로 구분합니다.

- `tags`: `character|mood light|duck`
- `specs`: `상세페이지 제공|충전식 사용|30분 타이머`
- `palette`: `#f4d77b|#5f493d|#f1b51c`

`thumbnail_images`나 `detail_images`를 비워두면 모델번호 기준으로 이미지 파일을 자동 탐색합니다.

권장 이미지 폴더 구조:

```text
assets/images/products/lt-001/thumbnail/
assets/images/products/lt-001/detail/
```

## Preview

정적 파일이므로 로컬 브라우저에서 바로 열 수 있습니다.

```text
index.html
```

브라우저 보안 정책 때문에 JSON 로드가 막히는 환경에서는 간단한 정적 서버로 확인합니다.

```sh
python3 -m http.server 8787
```
