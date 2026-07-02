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

- `id`: 상세 페이지 URL에 쓰이는 고유 값
- `category`: 상단 `categories`의 `name`과 일치해야 함
- `name`, `summary`, `description`: 화면 표시 문구
- `links.coupang`: 상세 페이지의 쿠팡 바로가기 URL
- `links.naver`: 상세 페이지의 네이버 스마트스토어 바로가기 URL
- `image`: 실제 상품 이미지 경로. 비워두면 임시 그래픽 패널 표시
- `palette`: 임시 그래픽 패널 색상 3개

상세 페이지 주소 예시:

```text
product.html?id=soft-cotton-throw
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
