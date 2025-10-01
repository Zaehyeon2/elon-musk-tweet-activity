# Elon Musk Tweet Activity Tracker

일론 머스크의 Twitter/X 게시 패턴을 실시간 히트맵으로 시각화하고 활동량을 예측하는 웹 애플리케이션입니다.

## ✨ 주요 기능

### 📊 데이터 시각화
- **실시간 트윗 히트맵**: 요일 × 시간대별 트윗 빈도를 히트맵으로 표현 (24시간 × 8일)
- **4주 평균 비교**: 현재 주 활동을 최근 4주 이동 평균과 나란히 비교
- **현재 시간 강조**: 파란색 테두리로 현재 시간(ET) 셀 하이라이트
- **다크 모드 지원**: 라이트/다크 테마 토글 및 자동 저장
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 화면 크기 최적화

### 🔮 예측 및 분석
- **⏱️ Current Pace**: 현재 속도 유지 시 범위 종료까지 예상 총 트윗 수
- **🔮 Next 24h Prediction**: 4주 평균 패턴과 트렌드 기반 다음 24시간 예측
- **🎯 End of Range**: 현재 데이터 + 남은 시간 예측치 합산
- **📊 Trend Indicator**: 4주 평균 대비 현재 활동 추세 (↗️ 상승 / → 안정 / ↘️ 하락)

### ⚙️ 사용자 제어
- **날짜 범위 선택**: 금요일-금요일, 화요일-화요일 범위 (정오 기준)
- **자동 새로고침**: 60초마다 최신 데이터 자동 갱신 (ON/OFF 토글)
- **CSV 다운로드**: 현재 히트맵 데이터를 CSV 파일로 내보내기
- **CSV 업로드**: API 실패 시 로컬 CSV 파일 직접 업로드 가능

## 🚀 빠른 시작

### 설치 및 실행

1. **파일 다운로드**
   ```bash
   git clone <repository-url>
   cd elon-musk-tweet-activity
   ```

2. **실행**
   - `index.html`을 웹 브라우저에서 열기
   - 또는 로컬 서버 실행:
     ```bash
     python -m http.server 8000
     # 브라우저에서 http://localhost:8000 접속
     ```

### 사용 방법

1. **날짜 범위 선택**
   - 상단 드롭다운에서 원하는 기간 선택 (최신 범위 자동 선택됨)
   - 금요일 정오 ~ 다음 금요일 정오 또는 화요일 정오 ~ 다음 화요일 정오

2. **히트맵 읽기**
   - 🟢 **진한 녹색**: 10개 이상 트윗 (매우 활발)
   - 🟢 **중간 녹색**: 5-9개 트윗 (활발)
   - 🟢 **연한 녹색**: 1-4개 트윗 (보통)
   - ⬜ **흰색/회색**: 0개 트윗
   - 🔲 **회색 대시 테두리**: 비활성 시간 (선택 범위 밖)
   - 🔵 **파란색 테두리**: 현재 시간(ET)

3. **예측 지표 확인**
   - **Current Pace**: 현재까지 시간당 평균 트윗 수
   - **Next 24h**: 다음 24시간 예상 트윗 수
   - **End of Range**: 기간 종료 시 예상 총 트윗 수
   - **Trend**: 최근 4주 대비 추세 (↗️/→/↘️)

4. **기타 기능**
   - 🌓 우측 상단 아이콘: 다크/라이트 모드 전환
   - 🔄 Auto Refresh 버튼: 자동 갱신 ON/OFF (기본 ON, 60초 주기)
   - 📥 Download CSV: 현재 히트맵 데이터 다운로드
   - 📤 Upload CSV: API 실패 시 로컬 CSV 파일 업로드

## 📡 데이터 소스

- **API**: X Tracker (`xtracker.io`) - CORS 프록시를 통해 접근
- **업데이트**: 실시간 (자동 새로고침 ON 시 60초마다)
- **백업**: API 실패 시 CSV 파일 수동 업로드 가능

## 🔧 기술 세부사항

### 시간대 처리
- **표준 시간대**: ET (Eastern Time, America/New_York)
- **DST 자동 처리**: EDT/EST 자동 전환 (시스템 시간대 API 사용)
- **날짜 범위**: 정오(12:00 PM ET) 기준 8일 구간
  - 금요일 12:00 PM ~ 다음주 금요일 12:00 PM
  - 화요일 12:00 PM ~ 다음주 화요일 12:00 PM

### 색상 스케일
| 레벨 | 트윗 수 | 색상 (Light Mode) | 색상 (Dark Mode) |
|------|---------|-------------------|------------------|
| 0 | 0개 | 흰색 | 진한 회색 |
| 1 | 1-2개 | 연한 녹색 | 진한 녹색 |
| 2 | 3-4개 | 녹색 | 중간 녹색 |
| 3 | 5-7개 | 중간 녹색 | 녹색 |
| 4 | 8-9개 | 진한 녹색 | 연한 녹색 |
| 5 | 10개+ | 매우 진한 녹색 | 밝은 녹색 |

### 예측 알고리즘

#### Current Pace (현재 속도)
```
현재 속도 = (현재까지 총 트윗 수) / (경과 시간)
예상 총합 = 현재 속도 × 전체 범위 시간
```

#### Next 24h Prediction (다음 24시간 예측)
```
기본 예측 = Σ(다음 24시간 각 시간대의 4주 평균)
트렌드 계수 = 현재 주 평균 / 4주 평균
최종 예측 = 기본 예측 × 트렌드 계수
```

#### End of Range (범위 종료 시 예상)
```
남은 시간 예측 = 현재 속도 × 남은 시간
최종 예상 = 현재까지 총합 + 남은 시간 예측
```

#### Trend (트렌드)
```
트렌드 비율 = 현재 주 평균 / 4주 평균
- ↗️ 상승: > 1.15 (15% 이상 증가)
- → 안정: 0.85 ~ 1.15
- ↘️ 하락: < 0.85 (15% 이상 감소)
```

### 성능 최적화
- **날짜 파싱 캐싱**: LRU 캐시 (최대 1000개)
- **ET 컴포넌트 캐싱**: 타임스탬프 기반 캐싱
- **메모이제이션**: 반복 계산 결과 캐싱 (최대 50개)
- **데이터 로드**: 최근 5주치만 로드 (현재 주 + 4주 평균용)

### 기술 스택
- **프론트엔드**: Vanilla JavaScript (ES6 Modules)
- **스타일링**: Tailwind CSS
- **아키텍처**: 모듈 기반 (config, utils, services, data, ui, state)
- **빌드 도구**: 없음 (모던 브라우저 네이티브 ES6 모듈 사용)

## 🌐 브라우저 호환성

### 지원 브라우저
- ✅ Chrome/Edge 89+
- ✅ Firefox 89+
- ✅ Safari 15+
- ✅ 모바일 브라우저 (iOS Safari, Chrome Mobile)

### 요구사항
- JavaScript 활성화 필수
- ES6 모듈 지원 (`type="module"`)
- Intl.DateTimeFormat API 지원

### CORS 이슈 해결
API 접근 실패 시:
1. **브라우저 확장**: CORS Unblock 등 설치
2. **로컬 서버**: `python -m http.server` 사용
3. **CSV 백업**: 수동 CSV 파일 업로드

## 파일 구조

```
elon-musk-tweet-activity/
├── index.html              # 메인 HTML 파일
├── src/
│   ├── config/
│   │   └── constants.js    # 애플리케이션 설정 상수
│   ├── utils/
│   │   ├── dateTime.js     # ET 시간대 처리 및 날짜 유틸리티
│   │   └── performance.js  # 성능 최적화 (메모이제이션, 디바운스 등)
│   ├── services/
│   │   └── api.js          # API 통신 (X Tracker API)
│   ├── data/
│   │   ├── parser.js       # CSV 파싱
│   │   ├── processor.js    # 데이터 처리 및 히트맵 변환
│   │   └── analytics.js    # 예측 및 트렌드 분석
│   ├── state/
│   │   └── appState.js     # 전역 애플리케이션 상태 관리
│   ├── ui/
│   │   ├── components.js   # 기본 UI 컴포넌트 (툴팁, 버튼 등)
│   │   ├── uiHelpers.js    # UI 헬퍼 함수 및 DOM 참조
│   │   ├── heatmap.js      # 히트맵 렌더링
│   │   ├── controls.js     # 날짜 범위, 새로고침 등 컨트롤
│   │   └── theme.js        # 다크 모드 및 테마 관리
│   └── main/
│       └── app.js          # 메인 애플리케이션 진입점
└── CLAUDE.md               # 개발 가이드라인
```

### 모듈 설명

- **config/**: 애플리케이션 전역 설정 (디버그 모드, 예측 가중치, 자동 새로고침 주기 등)
- **utils/**: 재사용 가능한 유틸리티 함수
  - `dateTime.js`: ET 시간대 변환, 날짜 파싱, 캐싱
  - `performance.js`: 메모이제이션, 디바운스, 쓰로틀
- **services/**: 외부 서비스 통신
  - `api.js`: X Tracker API 호출 및 CORS 프록시
- **data/**: 데이터 처리 및 분석 로직
  - `parser.js`: CSV 파일 파싱
  - `processor.js`: 트윗을 히트맵 그리드로 변환
  - `analytics.js`: 예측, 트렌드, 4주 평균 계산
- **state/**: 앱 상태 관리
  - `appState.js`: 현재 데이터, 날짜 범위, 자동 새로고침 상태
- **ui/**: UI 렌더링 및 사용자 상호작용
  - `components.js`: 재사용 가능한 UI 컴포넌트
  - `heatmap.js`: 히트맵 테이블 렌더링
  - `controls.js`: 버튼, 드롭다운, 파일 업로드 핸들러
  - `theme.js`: 다크/라이트 모드 토글
- **main/**: 애플리케이션 초기화 및 오케스트레이션

## 👨‍💻 개발 가이드

### 개발 환경 설정

빌드 과정이 필요 없습니다. ES6 모듈을 네이티브로 사용하며 모던 브라우저에서 바로 실행됩니다.

**디버그 모드 활성화**:
```javascript
// src/config/constants.js
export const DEBUG_MODE = true; // 콘솔에 상세 로그 출력
```

### 기본 워크플로우

1. **코드 수정**: `src/` 디렉토리 내 관련 모듈 편집
2. **테스트**: 브라우저 새로고침 (F5 또는 Cmd+R)
3. **디버깅**: 개발자 도구 콘솔 확인 (F12)
4. **반복**: 수정 → 테스트 → 디버깅

### 모듈별 수정 가이드

| 작업 내용 | 수정 파일 |
|-----------|-----------|
| 설정값 변경 (예측 가중치, 자동 새로고침 주기 등) | `config/constants.js` |
| 날짜/시간 처리 로직 | `utils/dateTime.js` |
| 성능 최적화 (캐싱, 메모이제이션) | `utils/performance.js` |
| API 엔드포인트 변경 | `services/api.js` |
| CSV 파싱 로직 | `data/parser.js` |
| 히트맵 데이터 처리 | `data/processor.js` |
| 예측/분석 알고리즘 | `data/analytics.js` |
| 전역 상태 관리 | `state/appState.js` |
| UI 컴포넌트 (툴팁, 버튼 등) | `ui/components.js` |
| 히트맵 렌더링 | `ui/heatmap.js` |
| 컨트롤 패널 (드롭다운, 버튼) | `ui/controls.js` |
| 테마 (다크 모드) | `ui/theme.js` |
| 앱 초기화 및 오케스트레이션 | `main/app.js` |

### 중요 개발 규칙

#### ⚠️ 필수 준수 사항

1. **날짜/시간 처리**
   ```javascript
   // ✅ CORRECT
   import { getETComponents } from '../utils/dateTime.js';
   const et = getETComponents(date);
   const hour = et.hour;

   // ❌ WRONG - 로컬 시간대 사용
   const hour = date.getHours();
   ```

2. **스타일링**
   ```html
   <!-- ✅ CORRECT - Tailwind 클래스 -->
   <div class="text-sm md:text-base dark:text-gray-300">

   <!-- ❌ WRONG - 인라인 스타일 -->
   <div style="font-size: 14px; color: #333;">
   ```

3. **모듈 의존성**
   - 순환 의존성 금지
   - 계층 구조 준수: config ← utils ← services/data ← ui ← main

### 테스트 체크리스트

코드 수정 후 반드시 확인:

- [ ] Chrome, Firefox, Safari 중 2개 이상 브라우저 테스트
- [ ] 모바일 뷰 확인 (< 640px)
- [ ] 태블릿 뷰 확인 (640-1024px)
- [ ] 데스크톱 뷰 확인 (> 1024px)
- [ ] 다크 모드 테스트
- [ ] 날짜/시간 관련 수정 시 ET 시간대 확인
- [ ] 콘솔 에러 없는지 확인
- [ ] 자동 새로고침 동작 확인

### 상세 개발 가이드

더 자세한 내용은 [`CLAUDE.md`](./CLAUDE.md) 참조:
- 모듈 아키텍처 상세 설명
- 성능 최적화 가이드
- 문제 해결 (Troubleshooting)
- 새 기능 추가 예시

## 📄 라이선스

MIT License

## 🤝 기여

Pull Request 환영합니다! 기여하기 전에:
1. `CLAUDE.md`의 개발 가이드라인 확인
2. 테스트 체크리스트 통과
3. 코드 스타일 준수 (Tailwind, ET 시간대 처리 등)