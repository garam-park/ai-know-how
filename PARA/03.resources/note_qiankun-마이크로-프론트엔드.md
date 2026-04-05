# qiankun 마이크로 프론트엔드 — Zero부터 만들어보기

> **목적**: qiankun의 핵심 개념을 직접 코드를 치면서 체득한다.
> 완료 후에는 고양 UAM 프로젝트(`gygo-svc3d-front-uamms`)의 구조가 왜 그렇게 되어 있는지 자연스럽게 이해된다.
>
> **소요 시간**: 약 2~3시간
>
> **사전 준비**: Node.js 18+, npm 또는 yarn

---

## 목차

1. [개념 잡기 — qiankun이 뭔가?](#1-개념-잡기--qiankun이-뭔가)
2. [Step 1 — 주 앱(Main App) 만들기](#step-1--주-앱main-app-만들기)
3. [Step 2 — 마이크로앱(Sub App) 만들기](#step-2--마이크로앱sub-app-만들기)
4. [Step 3 — 주 앱에서 마이크로앱 등록하기](#step-3--주-앱에서-마이크로앱-등록하기)
5. [Step 4 — 라이프사이클 이해하기](#step-4--라이프사이클-이해하기)
6. [Step 5 — CSS 격리와 JS 샌드박스](#step-5--css-격리와-js-샌드박스)
7. [Step 6 — 앱 간 통신 (Global State)](#step-6--앱-간-통신-global-state)
8. [Step 7 — Webpack 멀티엔트리로 확장하기](#step-7--webpack-멀티엔트리로-확장하기)
9. [실제 프로젝트와 연결해서 보기](#실제-프로젝트와-연결해서-보기)
10. [참고 자료](#참고-자료)

---

## 1. 개념 잡기 — qiankun이 뭔가?

qiankun(乾坤)은 Ant Financial에서 만든 마이크로 프론트엔드 프레임워크로, single-spa를 기반으로 동작한다.

핵심 아이디어는 간단하다:

- **주 앱(Main App)** 이 하나 있고, 여기서 여러 **마이크로앱(Sub App)** 을 URL 경로에 따라 로드/언로드한다.
- 각 마이크로앱은 독립적인 프로젝트로 개발·배포할 수 있다.
- qiankun이 마이크로앱의 JS/CSS를 격리해 주기 때문에 서로 충돌하지 않는다.

```
┌─────────────────────────────────────────┐
│  주 앱 (Main App)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ /control │ │/dashboard│ │  /mgmt   ││
│  │ 마이크로앱│ │ 마이크로앱│ │ 마이크로앱││
│  └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────┘
```

**qiankun이 해결하는 문제:**

- 거대한 SPA를 여러 팀이 독립적으로 개발
- 서로 다른 프레임워크(React, Vue 등)를 한 화면에 공존
- 배포 독립성 — 마이크로앱 하나만 빌드·배포 가능

---

## Step 1 — 주 앱(Main App) 만들기

### 1.1 프로젝트 초기화

```bash
mkdir qiankun-tutorial && cd qiankun-tutorial

# 주 앱 생성
npx create-react-app main-app --template typescript
cd main-app
npm install qiankun
```

### 1.2 마이크로앱을 넣을 컨테이너 만들기

`src/App.tsx`를 다음처럼 수정한다:

```tsx
// main-app/src/App.tsx
import React from "react";
import { Link, BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 20 }}>
        <h1>qiankun 주 앱</h1>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/" style={{ marginRight: 16 }}>
            홈
          </Link>
          <Link to="/sub-react" style={{ marginRight: 16 }}>
            React 마이크로앱
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<h2>메인 페이지입니다</h2>} />
        </Routes>

        {/* ★ 마이크로앱이 렌더링될 컨테이너 */}
        <div id="sub-app-container" />
      </div>
    </BrowserRouter>
  );
}

export default App;
```

> **핵심 포인트**: `<div id="sub-app-container" />`가 마이크로앱의 마운트 지점이다.
> qiankun은 이 DOM 요소 안에 마이크로앱의 HTML/CSS/JS를 주입한다.

react-router-dom이 없으면 설치:

```bash
npm install react-router-dom
```

### 1.3 확인

```bash
npm start   # http://localhost:3000
```

"qiankun 주 앱"이라는 제목과 네비게이션이 보이면 성공.

---

## Step 2 — 마이크로앱(Sub App) 만들기

### 2.1 프로젝트 생성

```bash
cd ../  # qiankun-tutorial 루트로 돌아감
npx create-react-app sub-react --template typescript
cd sub-react
```

### 2.2 public-path.js 추가

qiankun 환경에서 정적 리소스 경로를 동적으로 설정하기 위한 파일.

```javascript
// sub-react/src/public-path.js
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
```

### 2.3 라이프사이클 export

마이크로앱의 핵심 — `bootstrap`, `mount`, `unmount` 세 함수를 export 해야 한다.

`src/index.tsx`를 다음으로 교체한다:

```tsx
// sub-react/src/index.tsx
import "./public-path";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import App from "./App";

let root: Root | null = null;

function render(props: any = {}) {
  const { container } = props;

  // ★ qiankun 안에서 실행될 때는 container에서 DOM을 찾고,
  //   단독 실행일 때는 document에서 찾는다.
  const dom = container
    ? container.querySelector("#root")
    : document.querySelector("#root");

  root = createRoot(dom!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

// ★ 단독 실행 모드 — qiankun 없이도 동작한다
if (!(window as any).__POWERED_BY_QIANKUN__) {
  render();
}

// ★ qiankun 라이프사이클 — 이 3개를 export 해야 마이크로앱으로 동작
export async function bootstrap() {
  console.log("[sub-react] bootstrapped");
}

export async function mount(props: any) {
  console.log("[sub-react] mounted, props:", props);
  render(props);
}

export async function unmount() {
  console.log("[sub-react] unmounted");
  if (root) {
    root.unmount();
    root = null;
  }
}
```

> **왜 이렇게 하는가?**
>
> - `bootstrap`: 앱 로드 시 최초 1회만 실행. 전역 초기화.
> - `mount`: 주 앱이 이 마이크로앱을 보여줄 때마다 호출. React 렌더링 시작.
> - `unmount`: 마이크로앱을 숨길 때 호출. 메모리 누수 방지를 위해 반드시 cleanup.

### 2.4 App.tsx를 간단하게 만들기

```tsx
// sub-react/src/App.tsx
import React, { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        padding: 20,
        border: "2px solid #1890ff",
        borderRadius: 8,
        margin: 10,
        backgroundColor: "#e6f7ff",
      }}
    >
      <h2>React 마이크로앱</h2>
      <p>나는 독립된 React 앱이지만, 주 앱 안에서도 돌아간다!</p>
      <button onClick={() => setCount((c) => c + 1)}>클릭 횟수: {count}</button>
    </div>
  );
}

export default App;
```

### 2.5 Webpack 설정 오버라이드

qiankun이 마이크로앱을 로드하려면 UMD 라이브러리로 빌드해야 하고, CORS를 허용해야 한다.

create-react-app은 webpack 설정을 숨기고 있으므로, `react-app-rewired`를 사용한다:

```bash
npm install react-app-rewired --save-dev
```

프로젝트 루트에 `config-overrides.js` 생성:

```javascript
// sub-react/config-overrides.js
const { name } = require("./package.json");

module.exports = {
  webpack: (config) => {
    // ★ UMD 라이브러리로 export — qiankun이 라이프사이클 함수를 찾을 수 있다
    config.output.library = `${name}-[name]`;
    config.output.libraryTarget = "umd";
    config.output.chunkLoadingGlobal = `webpackJsonp_${name}`;
    config.output.globalObject = "window";

    return config;
  },
  devServer: (_) => {
    const config = _;
    // ★ CORS 허용 — 주 앱과 다른 포트에서 돌기 때문에 필수
    config.headers = {
      "Access-Control-Allow-Origin": "*",
    };
    return config;
  },
};
```

`package.json`의 scripts를 수정:

```json
{
  "scripts": {
    "start": "react-app-rewired start",
    "build": "react-app-rewired build",
    "test": "react-app-rewired test"
  }
}
```

### 2.6 포트 설정

`.env` 파일 생성:

```env
PORT=3001
```

### 2.7 마이크로앱 단독 실행 확인

```bash
npm start   # http://localhost:3001
```

파란 테두리의 "React 마이크로앱"이 보이면 성공. 이 앱은 혼자서도 돌아가고, qiankun 안에서도 돌아간다.

---

## Step 3 — 주 앱에서 마이크로앱 등록하기

### 3.1 qiankun 등록 코드 작성

주 앱으로 돌아가서:

```bash
cd ../main-app
```

`src/micro-apps.ts` 파일을 새로 만든다:

```typescript
// main-app/src/micro-apps.ts
import { registerMicroApps, start } from "qiankun";

registerMicroApps([
  {
    name: "sub-react", // 마이크로앱 고유 이름
    entry: "//localhost:3001", // 마이크로앱 주소 (개발 서버)
    container: "#sub-app-container", // 마운트할 DOM 요소
    activeRule: "/sub-react", // 이 경로일 때 활성화
  },
]);

// ★ start()를 호출해야 qiankun이 동작한다
start();
```

> **각 옵션 설명:**
>
> - `name`: 마이크로앱 식별자. Webpack의 `output.library`와 일치해야 한다.
> - `entry`: 마이크로앱의 HTML entry. qiankun이 이 HTML을 fetch하고 내부 JS/CSS를 파싱한다.
> - `container`: 주 앱에서 마이크로앱이 렌더링될 DOM selector.
> - `activeRule`: URL 경로 매칭 규칙. `/sub-react`로 시작하면 이 앱을 마운트.

### 3.2 주 앱 진입점에서 import

`src/index.tsx`에 한 줄 추가:

```tsx
// main-app/src/index.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./micro-apps"; // ★ 이 한 줄이 qiankun을 활성화한다

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 3.3 통합 테스트

두 앱을 동시에 실행한다 (터미널 2개):

```bash
# 터미널 1 — 마이크로앱
cd sub-react && npm start    # :3001

# 터미널 2 — 주 앱
cd main-app && npm start     # :3000
```

1. `http://localhost:3000` 접속 — "메인 페이지입니다" 보임
2. "React 마이크로앱" 링크 클릭 (또는 `/sub-react`로 이동)
3. 파란 테두리의 마이크로앱이 주 앱 안에 나타남

**브라우저 Console 확인:**

```
[sub-react] bootstrapped
[sub-react] mounted, props: { container: ... }
```

뒤로가기 하면:

```
[sub-react] unmounted
```

이것이 qiankun의 전부다. 나머지는 이 기본 위에 쌓는 것.

---

## Step 4 — 라이프사이클 이해하기

qiankun의 라이프사이클은 3가지이고, 호출 순서가 명확하다:

```
┌──────────┐    최초 1회    ┌──────────┐   URL 매칭될 때마다   ┌──────────┐
│ bootstrap │ ──────────▶  │  mount   │ ◀──────────────────▶ │ unmount  │
└──────────┘               └──────────┘                      └──────────┘
                               ▲                                  │
                               └──────── 다시 URL 매칭 ───────────┘
```

| 라이프사이클 | 호출 시점                        | 용도                         | 주의                              |
| ------------ | -------------------------------- | ---------------------------- | --------------------------------- |
| `bootstrap`  | 앱이 처음 로드될 때 딱 1회       | 전역 설정, 라이브러리 초기화 | 여기서 render 하지 않는다         |
| `mount`      | URL이 activeRule과 매칭될 때마다 | React 렌더링 시작            | `props.container`를 사용해야 한다 |
| `unmount`    | URL이 벗어나 앱을 내릴 때        | cleanup, 이벤트 리스너 해제  | `root.unmount()` 반드시 호출      |

### 실습: 라이프사이클 로그 강화

마이크로앱의 `index.tsx`에서 각 함수에 로그를 넣고, 브라우저에서 페이지를 왔다갔다 하면서 Console을 관찰한다.

```tsx
export async function bootstrap() {
  console.log("[sub-react] ① bootstrap — 최초 1회만 호출됨");
}

export async function mount(props: any) {
  console.log("[sub-react] ② mount — props:", Object.keys(props));
  // props에는 name, container, 주 앱이 전달한 커스텀 데이터 등이 들어있다
  render(props);
}

export async function unmount() {
  console.log("[sub-react] ③ unmount — cleanup");
  if (root) {
    root.unmount();
    root = null;
  }
}
```

**직접 확인할 것:**

- `/sub-react` → `/` → `/sub-react` 이동 시, bootstrap은 1번만, mount/unmount는 반복 호출된다
- mount의 `props` 안에 어떤 키가 있는지 확인한다

---

## Step 5 — CSS 격리와 JS 샌드박스

### 5.1 CSS 격리 문제 체험하기

주 앱에 전역 스타일 추가:

```css
/* main-app/src/App.css */
h2 {
  color: red;
}
```

마이크로앱에도:

```css
/* sub-react/src/App.css */
h2 {
  color: blue;
}
```

→ 둘 다 로드되면 스타일이 충돌한다!

### 5.2 qiankun의 CSS 격리 옵션

주 앱의 `micro-apps.ts`에서 `start()` 옵션을 수정한다:

```typescript
start({
  sandbox: {
    strictStyleIsolation: true, // Shadow DOM으로 완전 격리
    // 또는
    // experimentalStyleIsolation: true,  // scope prefix 방식
  },
});
```

| 옵션                         | 방식                       | 장점        | 단점                        |
| ---------------------------- | -------------------------- | ----------- | --------------------------- |
| `strictStyleIsolation`       | Shadow DOM                 | 완전 격리   | 일부 라이브러리 호환성 이슈 |
| `experimentalStyleIsolation` | CSS selector에 prefix 추가 | 호환성 좋음 | 완벽하지 않을 수 있음       |

> **우리 프로젝트에서는?**
> `gygo-svc3d-front-uamms`는 CSS Modules(`mf-template-[name]-[local]-[hash]`)와
> Ant Design의 `prefixCls`를 `pkg.name`으로 설정하는 방식으로 격리한다.
> 이것이 현실적으로 가장 안정적인 접근이다.

### 5.3 JS 샌드박스

qiankun은 기본적으로 JS 샌드박스를 활성화한다. 마이크로앱이 `window`에 무언가를 추가해도, 언마운트 시 자동으로 복원된다.

**확인 실습:**

마이크로앱에서:

```tsx
// mount 안에서
(window as any).MY_TEST_VAR = "hello from sub-react";
console.log("MY_TEST_VAR:", (window as any).MY_TEST_VAR);
```

마이크로앱을 언마운트한 뒤 Console에서 `window.MY_TEST_VAR`를 확인하면 `undefined`이다.

---

## Step 6 — 앱 간 통신 (Global State)

마이크로앱끼리, 또는 주 앱↔마이크로앱 간에 데이터를 주고받을 수 있다.

### 6.1 주 앱에서 Global State 초기화

```typescript
// main-app/src/micro-apps.ts
import { registerMicroApps, start, initGlobalState } from "qiankun";

// ★ 전역 상태 초기화
const actions = initGlobalState({
  user: "홍길동",
  lang: "ko_KR",
});

// 주 앱에서 상태 변경 감지
actions.onGlobalStateChange((state, prev) => {
  console.log("[주 앱] 상태 변경:", prev, "→", state);
});

// 필요할 때 상태 업데이트
// actions.setGlobalState({ lang: 'en_US' });

registerMicroApps([
  {
    name: "sub-react",
    entry: "//localhost:3001",
    container: "#sub-app-container",
    activeRule: "/sub-react",
    props: { actions }, // ★ actions를 마이크로앱에 전달
  },
]);

start();
```

### 6.2 마이크로앱에서 Global State 사용

```tsx
// sub-react/src/index.tsx 의 mount 함수
export async function mount(props: any) {
  const { actions } = props;

  // 상태 변경 구독
  actions.onGlobalStateChange((state: any, prev: any) => {
    console.log("[마이크로앱] 상태 변경:", prev, "→", state);
  });

  // 상태 업데이트 (주 앱에도 전파됨)
  actions.setGlobalState({ lang: "en_US" });

  render(props);
}
```

### 6.3 통신 방식 비교

| 방식              | 용도                               | 우리 프로젝트에서        |
| ----------------- | ---------------------------------- | ------------------------ |
| `initGlobalState` | 전역 공유 상태 (언어, 사용자 정보) | `lang` prop 전달에 활용  |
| `props` 직접 전달 | mount 시 1회 데이터 주입           | `container`, `lang` 전달 |
| Custom Event      | 느슨한 결합, 이벤트 기반           | 필요 시 확장 가능        |

---

## Step 7 — Webpack 멀티엔트리로 확장하기

우리 프로젝트(`gygo-svc3d-front-uamms`)는 여러 마이크로앱을 **하나의 레포**에서 빌드한다. 이것이 멀티엔트리 패턴이다.

### 7.1 개념

```
src/pages/
├── control/index.tsx     → dist/control.html    → 마이크로앱 1
├── dashboard/index.tsx   → dist/dashboard.html  → 마이크로앱 2
├── management/index.tsx  → dist/management.html → 마이크로앱 3
└── simulation/index.tsx  → dist/simulation.html → 마이크로앱 4
```

Webpack이 각 `index.tsx`를 개별 엔트리로 인식하고, 각각 UMD 라이브러리로 빌드한다.

### 7.2 핵심 Webpack 설정 (실제 프로젝트 기반)

```javascript
// 실제 프로젝트의 webpack.config.js 핵심 부분
const glob = require("glob");

// ★ pages/ 하위의 모든 index.tsx를 자동으로 엔트리로 등록
let entries = {};
glob.sync("./src/pages/*/index.tsx").map((f) => {
  let name = f.match(/\.\/src\/pages\/(\S*)\/index.tsx/)[1];
  entries[name] = f;
});
// → entries = { control: './src/pages/control/index.tsx', dashboard: '...', ... }

module.exports = {
  entry: entries,
  output: {
    filename: "static/[name].[chunkhash].js",
    library: "[name]", // ★ 각 엔트리 이름으로 UMD export
    libraryTarget: "umd", // ★ qiankun이 인식하는 형식
  },
  devServer: {
    headers: { "Access-Control-Allow-Origin": "*" }, // ★ CORS 필수
  },
};
```

### 7.3 공유 부트스트랩 함수 패턴 (실제 프로젝트)

실제 프로젝트에서는 모든 페이지가 동일한 라이프사이클 코드를 반복하지 않도록, `bootstrap.tsx`에 팩토리 함수를 만들어 놓았다:

```tsx
// 실제 프로젝트: src/bootstrap.tsx
export function createMicroApp({ containerId, App }: BootstrapOptions) {
  let root: Root;

  function render(props: any) {
    const { container, lang } = props;
    const el = container
      ? container.querySelector(`#${containerId}`)
      : document.querySelector(`#${containerId}`);
    root = createRoot(el);
    root.render(/* IntlProvider + ConfigProvider + App */);
  }

  if (!window.__POWERED_BY_QIANKUN__) {
    render({});
  }

  return {
    async bootstrap() {
      /* ... */
    },
    async mount(props) {
      render(props);
    },
    async unmount() {
      root.unmount();
    },
  };
}
```

각 페이지는 이렇게만 쓰면 된다:

```tsx
// src/pages/control/index.tsx
import { createMicroApp } from "@/bootstrap";
import App from "./App";

const { bootstrap, mount, unmount } = createMicroApp({
  containerId: "microapp-uam-control",
  App,
});

export { bootstrap, mount, unmount };
```

---

## 실제 프로젝트와 연결해서 보기

튜토리얼에서 만든 것과 실제 프로젝트를 대응시키면:

| 튜토리얼                  | 실제 프로젝트 (`gygo-svc3d-front-uamms`)       |
| ------------------------- | ---------------------------------------------- |
| `main-app/`               | 주 앱 (별도 레포 또는 컨테이너 앱)             |
| `sub-react/src/index.tsx` | `src/pages/*/index.tsx` (각 마이크로앱 엔트리) |
| `render()` 함수           | `createMicroApp()`의 `render()`                |
| `createRoot(dom)`         | `createRoot(el)` — React 18 방식 동일          |
| `config-overrides.js`     | `webpack.config.js` (직접 관리)                |
| `__POWERED_BY_QIANKUN__`  | 동일하게 사용                                  |
| 단일 엔트리               | **멀티엔트리** — `pages/*/index.tsx` 자동 탐색 |
| CSS 격리 옵션             | CSS Modules + Ant Design `prefixCls`           |
| `initGlobalState`         | `props`로 `lang` 전달                          |

### 실제 프로젝트에서 주목할 파일들

```
apps/gygo-svc3d-front-uamms/
├── src/
│   ├── bootstrap.tsx            ← 공유 라이프사이클 팩토리
│   ├── pages/
│   │   ├── control/index.tsx    ← 비행·환경 모니터링 마이크로앱
│   │   ├── dashboard/index.tsx  ← 통합 대시보드 마이크로앱
│   │   ├── management/index.tsx ← 일정·운영자·기체·노선 관리
│   │   ├── simulation/index.tsx ← 비행경로·분석·보고서
│   │   ├── system/index.tsx     ← 시스템 설정
│   │   └── test/index.tsx       ← 테스트용 템플릿 (학습에 적합!)
│   ├── locales/                 ← i18n (ko_KR, en_US, zh_CN)
│   ├── services/                ← API 호출 (umi-request)
│   └── types/                   ← TypeScript 타입 정의
├── webpack.config.js            ← 멀티엔트리 + UMD + CORS
└── typings.d.ts                 ← __POWERED_BY_QIANKUN__ 선언
```

---

## 참고 자료

- [qiankun 공식 문서](https://qiankun.umijs.org/)
- [qiankun API 레퍼런스](https://qiankun.umijs.org/api)
- [qiankun FAQ (Webpack 5 설정 등)](https://qiankun.umijs.org/faq)
- [qiankun GitHub](https://github.com/umijs/qiankun)
- [React 18 createRoot 마이그레이션](https://react.dev/reference/react-dom/client/createRoot)
- [Micro Frontends with React and qiankun (튜토리얼)](https://medium.com/@nima.2004hkh/how-to-implement-micro-frontend-with-reactjs-and-qiankun-606d01ab9599)
- [qiankun + Vite 실습 가이드](https://www.oreateai.com/blog/minimalist-practice-implementing-microfrontend-architecture-with-react-and-vue-qiankun-vite/3e822b505b9e9d5df1f3e6f2403f4719)

---

> **다음 단계 제안**: 이 튜토리얼을 완료한 뒤, 실제 프로젝트의 `pages/test/` 마이크로앱을
> 단독 실행해 보고, 주 앱에서 로드되는 과정을 디버깅해 보면 프로젝트 전체 구조가 손에 익을 것이다.

```

```
