# Elon Musk Tweet Activity Tracker

일론 머스크의 Twitter/X 게시 패턴을 실시간 히트맵으로 시각화하고 활동량을 예측하는 웹 애플리케이션입니다.

> **⚠️ Migration Notice**: This project has been migrated from vanilla JavaScript to **React 19 + TypeScript**. The legacy vanilla JS version is archived in the root directory. Please use the `react-app/` directory for active development.

## 🚀 Technology Stack (React Version)

- **React 19.1** - Latest React with concurrent features
- **TypeScript 5.8** - Type-safe development
- **Vite 7.1** - Fast build tool and dev server
- **Zustand 5.0** - Lightweight state management
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - High-quality React components (Radix UI)
- **PapaParse** - CSV parsing
- **date-fns** - Date manipulation

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

### 설치 및 실행 (React Version)

1. **저장소 클론**
   ```bash
   git clone <repository-url>
   cd elon-musk-tweet-activity/react-app
   ```

2. **의존성 설치**
   ```bash
   yarn install
   # 또는
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   yarn dev
   # 또는
   npm run dev
   # 브라우저에서 http://localhost:5173 자동 열림
   ```

4. **프로덕션 빌드**
   ```bash
   yarn build
   # 또는
   npm run build
   # 빌드 결과물: dist/ 디렉토리
   ```

### 레거시 Vanilla JS 버전 (Archived)

레거시 버전을 실행하려면:
```bash
cd elon-musk-tweet-activity
# index.html을 브라우저에서 직접 열거나
python -m http.server 8000
```

> **참고**: 레거시 버전은 유지보수되지 않습니다. React 버전을 사용하세요.

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

3. **예측 지표 확인** (각 지표에 ℹ️ 뱃지 클릭/호버 시 설명 표시)
   - **Current Pace**: 현재까지 시간당 평균 트윗 수
   - **Next 24h**: 다음 24시간 예상 트윗 수 (90% 신뢰구간 포함)
   - **End of Range**: 기간 종료 시 예상 총 트윗 수 (90% 신뢰구간 포함)
   - **Trend**: 최근 4주 대비 추세 (↗️/→/↘️)
   - **Momentum**: 최근 6시간 활동 추세 (1.0x = 예상 수준)

4. **기타 기능**
   - 🌓 우측 상단 아이콘: 다크/라이트 모드 전환
   - 🔄 Auto Refresh 버튼: 자동 갱신 ON/OFF (기본 ON, 60초 주기)
   - 📥 Download CSV: 현재 히트맵 데이터 다운로드
   - 📤 Upload CSV: API 실패 시 로컬 CSV 파일 업로드

### UI/UX 특징
- **정보 뱃지 (ℹ️)**: 각 예측 지표에 설명 툴팁 제공
  - 데스크톱: 마우스 호버 시 표시
  - 모바일: 뱃지 탭 시 표시/숨김 (외부 클릭 시 자동 닫힘)
- **반응형 레이아웃**:
  - 모바일: 2열 3행 그리드 (5개 지표)
  - 태블릿: 2열 3행 그리드
  - 데스크톱: 5열 1행 그리드
- **신뢰 구간 표시**: Next 24h와 End of Range에 90% 신뢰구간 표시
  - 표시 형식: `55 (45-65)` = 예측값 (최소-최대)

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

### 예측 알고리즘 (개선됨 ✨)

#### Current Pace (현재 속도)
현재 속도를 유지할 경우 범위 종료 시점 예상 트윗 수:
```
현재 시간당 평균 = 현재까지 총 트윗 수 / 경과 시간
예상 총합 = 현재 시간당 평균 × 전체 범위 시간
```

#### Next 24h Prediction (다음 24시간 예측) - 패턴 기반 🎯
**시간대별 활동 패턴을 활용한 고급 예측**:

```
1. 최근 추세 (Momentum) 계산:
   - 최근 6시간 실제 활동량 vs 4주 평균 비교
   - Momentum = 최근 6시간 실제 / 최근 6시간 4주 평균

2. 전체 트렌드 계산:
   - Trend Factor = 현재 주 총 트윗 / 동일 기간 4주 평균

3. 다음 24시간 각 시간대별 예측:
   For each hour in next 24 hours:
     - 해당 시간대의 4주 평균값 가져오기
     - 조합 계수 = (Momentum × 0.3) + (Trend Factor × 0.7)
     - 시간당 예측 = 4주 평균값 × 조합 계수

4. 총 예측 = Σ(24개 시간대 예측값)

5. 신뢰 구간 (90%):
   - 표준편차 계산: 4주 평균 데이터의 변동성
   - 범위 = 예측값 ± (표준편차 × 1.5 × √24)
```

**표시 형식**: `55 (45-65)` - 예측값 55, 90% 신뢰 구간 45-65

**핵심 개선점**:
- ✅ 시간대별 활동 패턴 반영 (오전/오후/밤 차이)
- ✅ 요일별 활동 차이 자동 반영
- ✅ 최근 6시간 가속/감속 추세 고려
- ✅ 신뢰 구간 제공으로 불확실성 표시

#### End of Range (범위 종료 시 예상) - 패턴 기반 🎯
현재 데이터 + 남은 각 시간대의 패턴 기반 예측:

```
1. 남은 각 시간대별로 예측:
   For each remaining hour until range end:
     - 해당 시간대의 4주 평균값 사용
     - 조합 계수 = (Momentum × 0.3) + (Trend Factor × 0.7)
     - 시간당 예측 = 4주 평균값 × 조합 계수

2. 최종 예상 = 현재까지 총합 + Σ(남은 시간 예측)

3. 신뢰 구간:
   - 남은 시간에 비례하여 불확실성 증가
   - 범위 = 예측값 ± (표준편차 × 1.5 × √(남은시간/24))
```

**표시 형식**: `420 (380-460)` - 예측값 420, 90% 신뢰 구간 380-460

#### Trend (트렌드 지표)
전체 활동 추세 표시:

```
트렌드 비율 = 현재 주 총 트윗 / 동일 기간 4주 평균
- ↗️ 상승: > 1.15 (15% 이상 증가)
- → 안정: 0.85 ~ 1.15
- ↘️ 하락: < 0.85 (15% 이상 감소)
```

**표시 형식**: `⬆️ Up 23%` 또는 `➡️ Stable`

#### Momentum (모멘텀 지표)
최근 활동의 가속/감속 추세:

```
Momentum = 최근 6시간 실제 트윗 / 최근 6시간 4주 평균
- > 1.0x: 예상보다 활발 (가속)
- = 1.0x: 예상 수준 (정상)
- < 1.0x: 예상보다 저조 (감속)
```

**표시 형식**: `1.23x` (소수점 둘째자리까지)

**활용**: Momentum과 Trend는 예측에 결합되어 사용 (Momentum 30% + Trend 70%)

#### 알고리즘 비교표

| 항목 | 이전 방식 | 개선된 방식 |
|------|-----------|-------------|
| **예측 방법** | 단순 시간당 평균 | 시간대별 패턴 기반 |
| **시간대 패턴** | ❌ 미반영 | ✅ 24시간 패턴 활용 |
| **요일 패턴** | ❌ 미반영 | ✅ 자동 반영 |
| **최근 추세** | ❌ 미고려 | ✅ 6시간 Momentum |
| **신뢰 구간** | ❌ 없음 | ✅ 90% 구간 제공 |
| **정확도** | 중간 | **높음** ⭐ |

### 성능 최적화
- **날짜 파싱 캐싱**: LRU 캐시 (최대 1000개)
- **ET 컴포넌트 캐싱**: 타임스탬프 기반 캐싱
- **메모이제이션**: 반복 계산 결과 캐싱 (최대 50개)
  - 예측 계산 메모이제이션
  - 신뢰 구간 계산 메모이제이션 (15% 근사값 사용)
- **신뢰 구간 간소화**: 전체 분산 계산 대신 15% 근사값 사용 (성능 ↑)
- **데이터 로드**: 최근 5주치만 로드 (현재 주 + 4주 평균용)

### 기술 스택
- **프론트엔드**: React 19.1 + TypeScript 5.8
- **스타일링**: Tailwind CSS 3.4 + shadcn/ui components
- **상태 관리**: Zustand 5.0
- **빌드 도구**: Vite 7.1 (Fast HMR, ESBuild)
- **아키텍처**: Component-based (React components, hooks, utils, services, store)

## 🌐 브라우저 호환성

### 지원 브라우저
- ✅ Chrome/Edge 90+
- ✅ Firefox 90+
- ✅ Safari 15+
- ✅ 모바일 브라우저 (iOS Safari 15+, Chrome Mobile)

### 요구사항
- JavaScript 활성화 필수
- Modern browser with ES2020+ support
- React 19 requires modern browsers (no IE11)

### CORS 이슈 해결
API 접근 실패 시:
1. **CORS 프록시**: 여러 프록시를 자동으로 시도합니다
2. **CSV 백업**: UI에서 CSV 파일 수동 업로드 가능
3. **로컬 캐싱**: 성공한 데이터를 LocalStorage에 캐싱

## 📁 파일 구조

```
elon-musk-tweet-activity/
├── src/
│   ├── components/     # React 컴포넌트
│   │   ├── common/    # 공통 컴포넌트 (ErrorMessage, LoadingSpinner 등)
│   │   ├── heatmap/   # 히트맵 관련 컴포넌트
│   │   ├── layout/    # 레이아웃 컴포넌트 (Header)
│   │   ├── statistics/# 통계/예측 카드
│   │   └── ui/        # shadcn/ui 컴포넌트
│   ├── config/
│   │   └── constants.ts    # 설정 상수
│   ├── hooks/         # Custom React hooks
│   │   ├── useAutoRefresh.ts
│   │   ├── useInitialLoad.ts
│   │   └── useTheme.ts
│   ├── services/
│   │   ├── api.ts     # X Tracker API
│   │   └── cache.ts   # LocalStorage 캐싱
│   ├── store/
│   │   └── useAppStore.ts  # Zustand 전역 상태
│   ├── types/
│   │   └── index.ts   # TypeScript 타입 정의
│   ├── utils/
│   │   ├── analytics.ts    # 예측 알고리즘
│   │   ├── dateTime.ts     # ET 시간대 처리
│   │   ├── parser.ts       # CSV 파싱
│   │   ├── processor.ts    # 데이터 변환
│   │   └── performance.ts  # 성능 최적화
│   ├── App.tsx        # 메인 앱 컴포넌트
│   └── main.tsx       # 진입점
├── package.json
├── vite.config.ts
├── tsconfig.json
├── CLAUDE.md              # 개발 가이드라인 (React 버전으로 업데이트됨)
└── README.md              # 이 파일
```

### React 앱 모듈 설명

- **components/**: React 컴포넌트 (기능별로 분류)
  - `common/`: 재사용 가능한 공통 컴포넌트
  - `heatmap/`: 히트맵 테이블 및 관련 UI
  - `layout/`: 헤더, 컨트롤 패널
  - `statistics/`: 통계 및 예측 카드
  - `ui/`: shadcn/ui 기반 UI 컴포넌트
- **config/**: 전역 설정 (디버그 모드, 예측 가중치 등)
- **hooks/**: Custom React hooks (auto-refresh, theme, performance 등)
- **services/**: 외부 API 통신 및 캐싱
- **store/**: Zustand 전역 상태 관리 (vanilla state 대체)
- **types/**: TypeScript 인터페이스 및 타입 정의
- **utils/**: 순수 함수 유틸리티 (날짜, 분석, 파싱, 성능)

## 👨‍💻 개발 가이드 (React Version)

### 개발 환경 설정

1. **의존성 설치**
   ```bash
   cd react-app
   yarn install
   ```

2. **개발 서버 실행**
   ```bash
   yarn dev
   # HMR(Hot Module Replacement) 지원으로 자동 리로드
   ```

3. **디버그 모드 활성화**
   ```typescript
   // react-app/src/config/constants.ts
   export const DEBUG_MODE = true; // 콘솔에 상세 로그 출력
   ```

### 사용 가능한 스크립트

```bash
yarn dev          # 개발 서버 시작 (HMR)
yarn build        # 프로덕션 빌드
yarn preview      # 빌드 결과물 미리보기
yarn lint         # ESLint 검사
yarn lint:fix     # ESLint 자동 수정
yarn format       # Prettier 포매팅
yarn type-check   # TypeScript 타입 검사
```

### 기본 워크플로우

1. **코드 수정**: `react-app/src/` 디렉토리 내 파일 편집
2. **자동 리로드**: 변경사항이 자동으로 브라우저에 반영됨 (HMR)
3. **타입 검사**: TypeScript가 실시간으로 타입 오류 표시
4. **디버깅**: React DevTools + Zustand DevTools 사용

### 모듈별 수정 가이드 (React)

| 작업 내용 | 수정 파일 |
|-----------|-----------|
| 설정값 변경 | `config/constants.ts` |
| 날짜/시간 처리 로직 | `utils/dateTime.ts` |
| 성능 최적화 | `utils/performance.ts` |
| API 엔드포인트 변경 | `services/api.ts` |
| CSV 파싱 로직 | `utils/parser.ts` |
| 히트맵 데이터 처리 | `utils/processor.ts` |
| 예측/분석 알고리즘 | `utils/analytics.ts` |
| 전역 상태 관리 | `store/useAppStore.ts` (Zustand) |
| UI 컴포넌트 | `components/` 디렉토리 |
| 히트맵 렌더링 | `components/heatmap/Heatmap.tsx` |
| 헤더/컨트롤 패널 | `components/layout/Header.tsx` |
| 테마 (다크 모드) | `hooks/useTheme.ts` |
| TypeScript 타입 정의 | `types/index.ts` |

### 중요 개발 규칙

#### ⚠️ 필수 준수 사항

1. **TypeScript 타입 사용**
   ```typescript
   // ✅ CORRECT
   import type { HeatmapData } from '@/types';
   function processData(data: HeatmapData): void { ... }

   // ❌ WRONG - any 타입 사용
   function processData(data: any): void { ... }
   ```

2. **날짜/시간 처리**
   ```typescript
   // ✅ CORRECT
   import { getETComponents } from '@/utils/dateTime';
   const et = getETComponents(date);
   const hour = et.hour;

   // ❌ WRONG - 로컬 시간대 사용
   const hour = date.getHours();
   ```

3. **스타일링**
   ```tsx
   {/* ✅ CORRECT - Tailwind 클래스 */}
   <div className="text-sm md:text-base dark:text-gray-300">

   {/* ❌ WRONG - 인라인 스타일 */}
   <div style={{ fontSize: '14px', color: '#333' }}>
   ```

4. **Zustand 상태 사용**
   ```typescript
   // ✅ CORRECT - 컴포넌트에서 구독
   const { currentData } = useAppStore();

   // ❌ WRONG - 직접 getState() 호출 (재렌더링 안 됨)
   const store = useAppStore.getState();
   ```

### 테스트 체크리스트

코드 수정 후 반드시 확인:

- [ ] `yarn type-check` - TypeScript 오류 없음
- [ ] `yarn lint` - ESLint 오류 없음
- [ ] `yarn build` - 빌드 성공
- [ ] Chrome, Firefox, Safari 중 2개 이상 브라우저 테스트
- [ ] 모바일 뷰 확인 (< 640px)
- [ ] 태블릿 뷰 확인 (640-1024px)
- [ ] 데스크톱 뷰 확인 (> 1024px)
- [ ] 다크 모드 토글 테스트
- [ ] 날짜/시간 관련 수정 시 ET 시간대 확인
- [ ] React DevTools에서 불필요한 재렌더링 확인
- [ ] 자동 새로고침 동작 확인 (토글 ON/OFF)

### 상세 개발 가이드

더 자세한 내용은 [`CLAUDE.md`](./CLAUDE.md) 참조:
- React 아키텍처 상세 설명
- Zustand 상태 관리 가이드
- TypeScript 타입 정의 방법
- Custom Hooks 사용법
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