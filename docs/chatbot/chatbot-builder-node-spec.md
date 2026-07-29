# Chatbot Builder 노드 상세 명세

## 1. 문서 목적과 범위

이 문서는 `hams-BAP/app/(siderbar-header)/admin/builder`의 현재 구현을 기준으로 Chatbot Builder에서 저장하고 실행하는 노드의 데이터 계약을 정의한다. 주요 근거는 다음과 같다.

- 노드 기본값: `utils/nodeFactory.js`
- 노드 타입과 저장 상태: `store/index.ts`, `types/types.ts`
- 속성 편집 UI: `components/controllers/*NodeController.*`
- 캔버스 표현: `components/nodes/*Node.*`
- Builder 실행: `components/controllers/hooks/useBuilderExecution.ts`
- Simulator 실행: `components/controllers/hooks/useChatFlow.js`, `core/scenario-core`

명세의 `필수`는 정상적인 편집·실행을 위해 업무적으로 반드시 필요한 값이다. 현재 TypeScript 모델은 `data`를 느슨하게 선언하므로, 런타임에서 항상 강제되는 필수 필드라는 뜻은 아니다.

## 2. 공통 그래프 계약

### 2.1 Node

```ts
type BuilderNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  parentNode?: string;
  extent?: 'parent';
};
```

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `id` | `string` | React Flow 노드 식별자. 그래프 안에서 유일해야 한다. |
| `type` | `string` | 렌더러 및 실행기를 선택하는 노드 타입이다. |
| `position` | `{x,y}` | 최상위 노드는 캔버스 좌표, 그룹 자식은 부모 기준 상대 좌표다. |
| `data.id` | `string` | `createNodeData()`가 생성하는 업무 데이터 ID다. `node.id`와 별개일 수 있다. |
| `parentNode` | `string?` | `scenario`, `selectionGroup` 안에 포함된 자식 노드의 부모 ID다. |
| `extent` | `'parent'?` | 자식 노드 이동을 부모 영역으로 제한할 때 사용한다. |

신규 ID의 현재 형식은 `<type>-<timestamp>-<random>`이다. ID 생성 방식은 저장 포맷의 의미 계약이 아니므로 외부 시스템이 형식을 파싱해서는 안 된다.

### 2.2 Edge

```ts
type BuilderEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: 'orthogonal' | string;
};
```

실행기는 일반적으로 `source === 현재 node.id`인 edge를 찾는다. 분기 노드는 `sourceHandle`까지 일치해야 한다.

| 노드 | `sourceHandle` 계약 |
| --- | --- |
| 일반 단일 출력 | `null` 또는 기본 핸들 |
| `branch(BUTTON)` | 선택한 `replies[].value` |
| `branch(CONDITION)` | 처음 참인 조건과 같은 인덱스의 `replies[].value`; 모두 거짓이면 `default` |
| `ynBranch` | Y/N reply의 `value` |
| `api` 성공 | `onSuccess` |
| `api` 실패 | `onError` |

분기 reply의 `value`를 변경하면 연결된 edge의 `sourceHandle`도 함께 유지해야 한다. 그렇지 않으면 화면에는 연결이 있어도 실행기가 다음 노드를 찾지 못할 수 있다.

### 2.3 슬롯과 템플릿

실행 컨텍스트의 슬롯은 다음 형태의 키-값 객체다.

```ts
type Slots = Record<string, unknown>;
```

메시지, URL, API headers/body, Set Slot 값 등은 `interpolateMessage()`로 슬롯을 치환한다. 중첩 값 조회는 점 표기 경로를 지원하는 `getNestedValue()`를 사용한다. 예를 들어 `profile.name`은 `slots.profile.name`을 의미한다.

슬롯명 권장 규칙:

- 영문자 또는 `_`로 시작한다.
- 영문자, 숫자, `_`, 점 경로만 사용한다.
- 시스템 후보 키인 `lastUserInput`, `input`, `user_input`, `text`와의 충돌을 피한다.
- 대소문자를 구분하는 값으로 취급한다.

### 2.4 `chainNext`

`chainNext: true`는 Simulator의 대화 이력에서 다음 비대화형 결과를 하나의 bot 표시 흐름으로 이어 붙이기 위한 UI 계약이다. 그래프 연결을 대신하지 않으며, 다음 edge가 없으면 실행은 계속되지 않는다.

현재 기본값을 제공하는 타입은 `message`, `api`, `link`, `llm`, `toast`, `iframe`, `setSlot`, `delay`다.

## 3. 지원 타입 요약

| 타입 | 용도 | 상호작용 | 기본 노드 목록 | Orkes Activity |
| --- | --- | --- | --- | --- |
| `message` | 텍스트/빠른 응답 표시 | 선택적 | 표시 | 표시 |
| `form` | 구조화 입력 수집 | 대기 | 표시 | 표시 |
| `branch` | 버튼 또는 슬롯 조건 분기 | 모드별 | 표시 | 표시 |
| `slotfilling` | 질문 후 단일 슬롯 입력 | 대기 | 표시 | 미표시 |
| `api` | HTTP 요청 및 응답 매핑 | 비동기 | 표시 | 표시 |
| `llm` | LLM 호출 결과 저장 | 비동기 | 기본 숨김 | 미표시 |
| `setSlot` | 슬롯 값 할당 | 자동 | 표시 | 표시 |
| `delay` | 지정 시간 대기 | 비동기 | 표시 | 미표시 |
| `fixedmenu` | 고정 선택 메뉴 | 대기 | 표시 | 미표시 |
| `link` | 외부 링크 표시 | 표시 | 표시 | 표시 |
| `toast` | 알림 메시지 표시 | 표시 | 기본 숨김 | 미표시 |
| `iframe` | 외부 페이지 임베드 | 표시 | 표시 | 표시 |
| `scenario` | 가져온 시나리오 컨테이너 | 자동 진입 | 표시 | 표시 |
| `selectionGroup` | 시각적 그룹 컨테이너 | 자동 진입 | 별도 생성 | 표시 |
| `ynBranch` | 단순 Y/N 분기 | 입력 기반 | 내부 등록 | 별도 생성 |

`start`는 `createNodeData()`가 기본값을 제공하지만 현재 주요 `nodeTypes` 매핑에는 별도 렌더러가 없다. 시나리오의 시작점은 우선 `startNodeId`로 관리한다.

## 4. 노드별 명세

### 4.1 Message (`message`)

사용자에게 텍스트를 표시하고 필요하면 빠른 응답 버튼을 제공한다.

| `data` 필드 | 형식 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `content` | `string` | `New text message` | 표시할 본문. 슬롯 템플릿을 치환한다. |
| `replies` | `Reply[]` | `[]` | 빠른 응답 목록. |
| `chainNext` | `boolean` | `false` | 다음 표시 노드와 연결 표시할지 여부. |
| `msgId` | `string?` | 없음 | 외부/다국어 메시지 식별자. |
| `textKo/En/Jp/Vn` | `string?` | 없음 | 언어별 메시지 데이터. 편집기의 언어 선택과 연동한다. |

```ts
type Reply = { display: string; value: string };
```

실행 결과 payload는 치환된 `content`다. Builder 실행기에서는 reply 자체로 대기하지 않고 기본 다음 edge로 진행한다. Simulator UI에서 quick reply를 사용할 때에는 저장된 `replies` 계약을 따른다.

### 4.2 Slot Filling (`slotfilling`)

질문을 표시하고 사용자의 한 개 응답을 슬롯에 저장하기 위한 상호작용 노드다.

| 필드 | 형식 | 기본값 | 필수 |
| --- | --- | --- | --- |
| `content` | `string` | `Enter your question.` | 예 |
| `slot` | `string` | `newSlot` | 예 |
| `replies` | `Reply[]` | `[]` | 아니요 |

현재 `useBuilderExecution`은 이 타입에서 `waitForUser`를 반환하고 자동 입력 UI를 연결하지 않는다. 실제 대화 입력과 슬롯 저장은 Simulator 어댑터의 상호작용 계약에 의존한다.

### 4.3 Fixed Menu (`fixedmenu`)

항상 동일한 선택 메뉴를 표시한다.

| 필드 | 형식 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `content` | `string` | `Fixed Menu` | 메뉴 제목. |
| `replies` | `Reply[]` | Menu 1 한 건 | 메뉴 항목과 분기 핸들 값. |

Builder 실행기에서는 수동 입력이 필요한 노드로 중단된다. 각 reply의 `value`는 대응 edge의 `sourceHandle`과 같아야 한다.

### 4.4 Branch (`branch`)

버튼 선택 또는 슬롯 조건 평가로 실행 경로를 나눈다.

| 필드 | 형식 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `content` | `string?` | 없음 | 분기 안내 문구. |
| `evaluationType` | `'BUTTON' \| 'CONDITION'` | `BUTTON` | 평가 방식. |
| `conditions` | `Condition[]` | 조건 1개 | 조건 모드의 순차 평가 목록. |
| `replies` | `Reply[]` | Condition 1 한 건 | 버튼 또는 조건별 출력 핸들. |
| `outputPositions` | `Record<string,string>?` | 없음 | 핸들별 화면 배치. 실행 의미는 없다. |

```ts
type Condition = {
  id: string;
  slot: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | '!contains';
  value: unknown;
  valueType?: 'value' | 'slot';
};
```

조건은 배열 순서대로 평가하며 첫 번째 참 조건을 선택한다. `valueType: 'slot'`이면 비교 우변도 슬롯에서 읽는다. 모두 거짓일 때 `sourceHandle: 'default'` edge로 이동한다. 숫자 비교 연산은 양쪽 값이 숫자로 변환 가능해야 한다.

`BUTTON` 모드에서는 `replies`를 사용자에게 보여 주고 선택한 reply의 `value`와 같은 핸들로 이동한다. reply가 없거나 선택 취소 시 실행이 중단된다.

### 4.5 Y/N Branch (`ynBranch`)

Y/N에 특화된 단순 분기다. `branch`에 `isSimpleYN: true`를 설정한 데이터도 같은 로직을 사용한다.

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `replies` | `[Reply, Reply]` | 첫 항목 Y, 두 번째 항목 N으로 취급한다. |
| `slotKey` | `string?` | 판정 입력을 읽을 명시적 슬롯. |
| `isSimpleYN` | `boolean?` | 일반 branch를 Y/N 방식으로 실행한다. |

입력 슬롯 우선순위는 `lastUserInput`, `input`, `user_input`, `text`, `slotKey`다. 현재 실행기는 `N`, `NO`, 부정 한글 값, `FALSE`만 N으로 보고 나머지는 기본적으로 Y로 처리한다. 명시적 검증이 필요한 업무에서는 일반 `branch(CONDITION)` 사용을 권장한다.

### 4.6 Set Slot (`setSlot`)

한 번에 여러 슬롯 값을 할당한다.

| 필드 | 형식 | 기본값 |
| --- | --- | --- |
| `assignments` | `{key:string,value:unknown}[]` | `newSlot=someValue` |
| `chainNext` | `boolean` | `false` |

값은 먼저 슬롯 템플릿 치환을 수행한 뒤 다음 순서로 형 변환한다.

1. `{...}` 또는 `[...]` 형태의 유효 JSON → 객체/배열
2. `true`, `false` → boolean
3. 비어 있지 않은 숫자 문자열 → number
4. 나머지 → string

할당은 배열 순서대로 처리하므로 뒤의 assignment가 앞에서 만든 슬롯을 참조할 수 있다.

### 4.7 API (`api`)

단일 또는 복수 HTTP 요청을 실행하고 JSON 응답 일부를 슬롯에 저장한다.

| 필드 | 형식 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `isMulti` | `boolean` | `false` | 복수 API 모드 여부. |
| `method` | `GET/POST/PUT/DELETE` | `GET` | 단일 모드 메서드. 실행기는 `HEAD`도 처리 가능하다. |
| `url` | `string` | 빈 값 | 슬롯 치환 대상 URL. |
| `headers` | JSON `string` | `{}` | 슬롯 치환 후 JSON parse. 실패 시 빈 객체. |
| `body` | `string` | `{}` | GET/HEAD 이외 요청 본문. 슬롯 치환 대상. |
| `responseMapping` | `{path,slot}[]` | `[]` | 응답 JSON 경로를 슬롯에 매핑. |
| `apis` | `ApiCall[]` | `[]` | 복수 모드의 호출 목록. |
| `routerId` | `string?` | 없음 | 외부 Router 선택 메타데이터. |
| `apiId` | `string?` | 없음 | 외부 API 선택 메타데이터. |
| `chainNext` | `boolean` | `false` | 표시 연결 옵션. |

복수 모드는 `Promise.all`로 병렬 실행한다. 모든 응답은 JSON parse를 시도하며, 성공 결과의 mapping을 순서대로 슬롯에 반영한다. 성공 시 `onSuccess`, 어느 한 요청이라도 실패하면 `onError` 핸들로 이동한다. 실패 edge가 없으면 실행 오류가 된다.

보안상 비밀 API 키를 노드 JSON에 직접 저장해서는 안 된다. 브라우저에서 실행되는 요청은 CORS 정책의 영향을 받는다.

### 4.8 Form (`form`)

복수 입력 요소를 표시하고 제출 결과를 슬롯에 저장한다.

| 필드 | 형식 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `formId` | `string \| null` | 없음 | 저장된 Form Template 식별자. |
| `title` | `string` | `new form` | 폼 제목. |
| `elements` | `FormElement[]` | `[]` | 입력 요소 목록. |
| `dataSourceType` | `string` | `json` | 폼 데이터 소스 종류. |
| `dataSource` | `string` | 빈 값 | 폼 데이터 소스. |
| `enableExcelUpload` | `boolean` | `false` | Excel 업로드 허용 여부. |
| `slotKey` | `string?` | 없음 | 전체 제출 객체를 저장할 선택적 슬롯. |

지원 요소 기본 계약:

| 요소 | 주요 필드 |
| --- | --- |
| `input` | `name`, `label`, `placeholder`, `validation`, `defaultValue`, `optionalParameter` |
| `search` | `name`, `label`, `apiConfig`, `resultSlot`, `inputFillKey`, `optionalParameter` |
| `date` | `name`, `label`, `defaultValue`, `optionalParameter` |
| `grid` | `name`, `label`, `rows`, `columns`, `data`, `displayKeys`, `optionalParameter` |
| `checkbox` | `name`, `label`, `options`, `defaultValue[]`, `optionalParameter` |
| `radio` | `name`, `label`, `options`, `defaultValue`, `optionalParameter` |
| `dropbox` | `name`, `label`, `options`, `optionsSlot`, `defaultValue`, `optionalParameter` |

제출 키는 `element.name`, 없으면 `element.id`, 그것도 없으면 `<type>-<index>` 순으로 결정된다. 각 값을 같은 이름의 슬롯에 저장하며 `slotKey`가 있으면 전체 `formValues`도 그 슬롯에 저장한다.

### 4.9 Link (`link`)

| 필드 | 형식 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `content` | `string` | `https://` | 이동 URL. 슬롯 치환 대상. |
| `display` | `string` | `Link` | 링크 텍스트. 슬롯 치환 대상. |
| `chainNext` | `boolean` | `false` | 연결 표시 옵션. |

외부 URL만 허용한다는 검증은 현재 데이터 모델에 없다. 운영 환경에서는 허용 scheme과 domain 검증이 필요하다.

### 4.10 iFrame (`iframe`)

| 필드 | 형식 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `url` | `string` | `https://www.example.com` | 임베드 URL. 슬롯 치환 대상. |
| `width` | 숫자 문자열 | `250` | px 너비. |
| `height` | 숫자 문자열 | `200` | px 높이. |
| `chainNext` | `boolean` | `false` | 연결 표시 옵션. |

대상 서버의 `X-Frame-Options`와 CSP `frame-ancestors` 정책에 따라 표시가 차단될 수 있다. URL 허용 목록과 sandbox 정책은 별도로 적용하는 것이 안전하다.

### 4.11 Toast (`toast`)

| 필드 | 형식 | 기본값 |
| --- | --- | --- |
| `message` | `string` | `This is a toast message.` |
| `toastType` | `'info' \| 'success' \| 'error'` | `info` |
| `chainNext` | `boolean` | `false` |

실행기는 슬롯 치환된 메시지와 타입을 payload로 반환하고 다음 노드로 진행한다. 실제 알림 표시 여부는 실행 로그/Simulator UI 소비자가 결정한다.

### 4.12 Delay (`delay`)

| 필드 | 형식 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `duration` | `number` | `1000` | 밀리초 단위 대기 시간. |
| `chainNext` | `boolean` | `false` | 연결 표시 옵션. |

음수·과도하게 큰 값에 대한 공통 스키마 검증은 없다. 저장 전에 `0 이상`과 서비스 최대값을 검증하는 것이 좋다.

### 4.13 LLM (`llm`)

| 필드 | 형식 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `prompt` | `string` | `Ask me anything...` | 모델 입력. |
| `outputVar` | `string` | `llm_output` | 누적 응답을 저장할 슬롯. |
| `conditions` | `unknown[]` | `[]` | LLM 결과 분기용 설정. |
| `chainNext` | `boolean` | `false` | 연결 표시 옵션. |

현재 `useBuilderExecution.ts`의 LLM 실행 코드는 API URL과 prompt 구성 일부가 주석 처리되어 있고 본문에서 정의되지 않은 `prompt`를 참조한다. 따라서 이 노드는 현재 Builder 실행 경로에서 완전한 운영 명세로 볼 수 없으며, API 프록시·인증·모델·스트리밍 포맷을 확정한 뒤 구현을 보완해야 한다.

### 4.14 Scenario (`scenario`)

다른 시나리오를 가져와 자식 그래프로 포함하는 컨테이너다.

| 필드 | 형식 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `label` / `title` | `string` | `Imported Scenario` | 컨테이너 표시명. |
| `scenarioId` | `string \| null` | `null` | 원본 시나리오 ID. |
| `flowCollapsed` | `boolean?` | 없음 | 캔버스 접힘 상태. |

선택한 시나리오의 노드/edge는 새 ID prefix를 붙여 현재 그래프에 복사되며 자식 노드에 `parentNode`가 설정된다. 실행 시 부모를 만났을 때 내부 진입 노드를 찾는다. 진입 노드는 내부 edge의 target이 아닌 첫 자식 노드이며, 없으면 컨테이너 다음 edge로 진행한다.

원본 시나리오 변경이 이미 가져온 복사본에 자동 동기화된다는 보장은 없다.

### 4.15 Selection Group (`selectionGroup`)

시각적으로 여러 활동을 묶는 컨테이너다.

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `label` / `title` | `string?` | 그룹 헤더. |
| `entryNodeId` | `string?` | 명시적 내부 진입 노드. |
| `flowCollapsed` | `boolean?` | 접힘 상태. |
| `flowGroupHeight` | `number?` | 표시 높이 메타데이터. |

실행기는 `entryNodeId`가 유효하면 해당 자식으로 진입하고, 아니면 내부 incoming edge가 없는 첫 자식을 사용한다. `store/index.ts`의 `NodeType` union 및 기본 색상에는 아직 포함되지 않았지만 캔버스와 실행기에는 등록되어 있다.

## 5. 저장 예시

```json
{
  "version": "1.0",
  "startNodeId": "message-welcome",
  "nodes": [
    {
      "id": "message-welcome",
      "type": "message",
      "position": { "x": 100, "y": 100 },
      "data": {
        "id": "message-welcome-data",
        "content": "{{customer.name}}님, 무엇을 도와드릴까요?",
        "replies": [],
        "chainNext": false
      }
    },
    {
      "id": "branch-member",
      "type": "branch",
      "position": { "x": 420, "y": 100 },
      "data": {
        "id": "branch-member-data",
        "evaluationType": "CONDITION",
        "conditions": [
          {
            "id": "cond-member",
            "slot": "customer.grade",
            "operator": "==",
            "value": "VIP",
            "valueType": "value"
          }
        ],
        "replies": [
          { "display": "VIP", "value": "vip" }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "edge-welcome-member",
      "source": "message-welcome",
      "target": "branch-member",
      "sourceHandle": null
    },
    {
      "id": "edge-vip",
      "source": "branch-member",
      "target": "message-vip",
      "sourceHandle": "vip"
    },
    {
      "id": "edge-default",
      "source": "branch-member",
      "target": "message-general",
      "sourceHandle": "default"
    }
  ]
}
```

## 6. 검증 규칙

저장 또는 Push 전에 최소한 다음을 검사해야 한다.

1. `node.id`와 `edge.id`는 그래프 내에서 유일해야 한다.
2. 모든 edge의 `source`, `target`은 존재하는 node를 참조해야 한다.
3. `startNodeId`는 존재하는 실행 가능 노드를 참조해야 한다.
4. 일반 실행 노드는 필요한 다음 edge를 가져야 한다. 종료 노드는 예외로 명시한다.
5. branch reply/condition 인덱스와 `sourceHandle`이 일치해야 한다.
6. 조건 branch에는 필요 시 `default` edge를 연결한다.
7. API에는 성공/실패 edge와 유효한 URL/JSON headers를 설정한다.
8. Form element의 `name`은 폼 안에서 중복되지 않아야 한다.
9. 슬롯 쓰기 필드(`slot`, `outputVar`, mapping `slot`, assignment `key`)는 비어 있지 않아야 한다.
10. 그룹 자식의 `parentNode`는 실제 컨테이너를 참조해야 하며 순환 포함을 허용하지 않는다.

## 7. 현재 구현상 주의사항

- `NodeType` union은 13개 타입만 선언하지만 실제 캔버스에는 `selectionGroup`, `ynBranch`도 등록되어 있다.
- `start` 기본 데이터는 존재하지만 주요 캔버스 렌더러에는 `start` 타입이 등록되지 않았다.
- `slotfilling`, `fixedmenu`는 Builder 실행기에서 수동 입력 대기 상태로 끝나며 입력 완료 경로가 완결되지 않았다.
- `llm` Builder 실행 코드는 현재 미완성 상태다.
- `message` quick reply의 Builder 실행 의미와 Simulator 표시 의미가 완전히 같지 않다.
- API 요청은 브라우저 실행 기준이므로 CORS, 인증정보 노출, 네트워크 접근 정책을 고려해야 한다.
- 노드 스키마가 `Record<string, unknown>`에 가까워 잘못된 JSON도 저장될 수 있다. 장기적으로 노드별 discriminated union과 런타임 schema 검증 도입이 필요하다.

## 8. 권장 스키마 발전 방향

```ts
type NodeDataByType = {
  message: MessageData;
  form: FormData;
  branch: BranchData;
  api: ApiData;
  // ...
};

type TypedBuilderNode<T extends keyof NodeDataByType> = {
  id: string;
  type: T;
  data: NodeDataByType[T];
  position: { x: number; y: number };
};
```

저장 API 경계에서는 Zod와 같은 런타임 schema로 버전별 migration을 수행하는 것이 권장된다. 특히 `version`, 노드 타입, 분기 핸들, Form element, API mapping은 저장 전에 검증해야 한다.
