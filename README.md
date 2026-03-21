# 서울 웨딩홀 비교 검색기

식대, 최소보증인원, 대관료 조건을 입력하면 서울 웨딩홀 후보를 바로 추려주는 정적 웹페이지입니다. 기본 내장데이터로도 동작하고, 브라우저에서 `.xlsx` 파일을 직접 업로드하거나 같은 폴더의 기본 엑셀 파일을 자동으로 읽어 반영할 수도 있습니다.

## 파일 구성

- `index.html`: 메인 화면
- `styles.css`: UI 스타일
- `app.js`: 필터링, 총비용 계산, 엑셀 업로드/자동 읽기 로직
- `data.js`: 기본 내장 데이터
- `scripts/extract_master60.py`: 엑셀에서 `data.js`를 다시 생성하는 스크립트
- `.github/workflows/deploy-pages.yml`: GitHub Pages 자동 배포 워크플로
- `.nojekyll`: GitHub Pages 정적 파일 처리 보조 파일

## 로컬 실행

1. 폴더에서 `index.html`을 바로 열 수 있습니다.
2. 자동 엑셀 반영까지 안정적으로 쓰려면 로컬 서버로 여는 편이 좋습니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속하세요.

## 공유용 배포

다른 사람이 링크만으로 사용하게 하려면 아래 파일들을 함께 배포하면 됩니다.

- `index.html`
- `styles.css`
- `app.js`
- `data.js`

이렇게만 올려도 기본 내장데이터 기준으로는 바로 사용 가능합니다.

기본 엑셀 자동 반영 기능까지 유지하려면 아래 파일도 같이 올리세요.

- `웨딩홀 정보.xlsx`
- 또는 `seoul_wedding_master_final_pro.xlsx`

정리하면:

- `data.js`만 있어도 링크 공유 가능
- `.xlsx` 파일까지 같이 올리면 페이지가 열릴 때 엑셀 자동 반영 시도
- 엑셀 자동 읽기가 실패하면 `data.js`로 자동 fallback

## GitHub Pages 배포

이 프로젝트는 GitHub Pages에 바로 배포할 수 있게 세팅되어 있습니다.

### 1. 새 GitHub 저장소 만들기

- GitHub에서 새 repository를 생성합니다.
- 기본 브랜치는 `main`으로 두는 것이 가장 편합니다.

### 2. 파일 업로드

아래 파일들을 저장소에 올립니다.

- `index.html`
- `styles.css`
- `app.js`
- `data.js`
- `.nojekyll`
- `.github/workflows/deploy-pages.yml`

엑셀 자동 반영까지 같이 쓰고 싶다면 아래 파일도 함께 올립니다.

- `웨딩홀 정보.xlsx`
- `seoul_wedding_master_final_pro.xlsx`

### 3. GitHub Pages 설정

- 저장소 `Settings`
- `Pages`
- `Source`를 `GitHub Actions`로 선택

그 다음 `main` 브랜치에 push 하면 자동으로 배포됩니다.

### 4. 배포 주소

배포 완료 후 주소는 보통 아래 형식입니다.

```text
https://<github-id>.github.io/<repository-name>/
```

## 데이터 갱신

엑셀 파일의 `Master_60` 시트가 바뀌면 아래 명령으로 `data.js`를 다시 생성할 수 있습니다.

```bash
python3 scripts/extract_master60.py
```

그 후 GitHub에 다시 push 하면 공유 링크에도 반영됩니다.

## 필터 및 계산 기준

- 식대: `식대 평균가(원)` 기준, 값이 없으면 `식대 시작가(원)` 사용
- 최소보증인원: 입력한 하객 수 이하인 웨딩홀만 표시
- 최대수용인원: 입력한 하객 수를 수용할 수 있는 곳만 표시
- 대관료: `최소 대관료(원)`이 있으면 우선 사용, 없으면 `대관료(원)` 사용
- 예상 총비용: `하객 수 x 식대 + 대관료 + 연출료 + 꽃장식`
- 하객 수를 입력하지 않으면 각 웨딩홀의 `최소보증인원`을 기준으로 총비용 계산

## 추가 기능

- 엑셀 업로드: 페이지 상단에서 `.xlsx` 파일을 직접 선택 가능
- 기본 엑셀 자동 읽기: 페이지 로드 시 같은 폴더의 `웨딩홀 정보.xlsx` 또는 `seoul_wedding_master_final_pro.xlsx`를 먼저 읽어봄
- 기본 데이터 다시 불러오기: 자동 읽기를 다시 시도하고, 실패하면 기본 내장데이터로 복구
