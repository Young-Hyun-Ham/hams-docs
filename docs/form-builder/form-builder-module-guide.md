# Form Builder 모듈 기능 및 Element Options 명세

> 대상 경로: `src/app/builder/form-builder`<br>
> 기준: 현재 소스 코드 구현<br>
> 목적: Form Builder의 화면 기능, 데이터 구조, element별 설정 항목(options), 저장·복원 및 API 연동 규칙을 설명한다.

## 1. 모듈 개요

Form Builder는 사용자가 UI element를 추가하고 순서를 바꾸며 속성을 편집한 뒤, 하나의 `FormDataJson`으로 저장하는 클라이언트 모듈이다. 화면은 element 목록, 미리보기 canvas, 속성 편집기의 3개 영역으로 구성되며 JSON 직접 편집 화면도 제공한다.

지원 element는 다음 7종이다.

| type | 화면 명칭 | 용도 | 초기 label |
|---|---|---|---|
| `input` | Text Field | 일반 문자열·숫자·이메일 입력 표현 | `New Input` |
| `date` | Date Field | 날짜 입력 표현 | `New Date` |
| `checkbox` | Checkbox | 여러 항목 선택 | `New Checkbox` |
| `radio` | Radio | 한 항목 선택 | `New Radio` |
| `dropbox` | Dropbox | 단일 또는 복수 선택 dropdown | `New Dropbox` |
| `grid` | Grid | 고정 cell 또는 slot 기반 표 표현 | `New Grid` |
| `search` | Search | 검색어 입력과 검색 결과 slot 정의 | `New Search` |

## 2. 주요 파일과 역할

| 파일 | 역할 |
|---|---|
| `page.tsx` | 전체 화면 조합, Preview/JSON tab, drag & drop, JSON 정규화, 저장·불러오기, element API event 실행 |
| `type/index.ts` | Form, element, option 관련 TypeScript 타입 정의 |
| `stores/elementRegistry.tsx` | element별 표시 정보와 신규 element 기본값 생성 |
| `stores/useFormEditorStore.ts` | Zustand 상태, element CRUD·정렬·grid resize, 저장, 사용 가능한 element type 로드 |
| `components/LeftPanel.tsx` | 추가 가능한 element 목록, click 및 drag 시작 |
| `components/Canvas.tsx` | element 배치·선택·정렬·drop 영역 |
| `components/CanvasElement.tsx` | 각 element의 canvas 미리보기와 값 변경 event 전달 |
| `components/RightPanel.tsx` | Form 속성 또는 선택 element의 공통·고유·API 속성 편집 |
| `components/ElementPropertyEditor.tsx` | type별 고유 options 편집 |
| `components/CustomElementPropertyEditor.tsx` | 공통 API 연결, 요청 실행, 응답을 대상 element로 변환 |
| `components/GridDataEditor.tsx` | 고정 grid cell 편집 |
| `components/JsonPanel.tsx` | JSON 직접 편집과 한 줄/원본 복사 |
| `components/modals/SavedFormContentModal.tsx` | 저장된 form 조회·제목 검색·pagination·선택 |

## 3. 화면 기능

### 3.1 Preview 화면

| 영역 | 기능 |
|---|---|
| 상단 toolbar | Preview/JSON 전환, 저장된 content 열기, form 저장 |
| 왼쪽 panel | 허용된 element를 click 또는 canvas로 drag하여 추가 |
| 가운데 canvas | element 미리보기, 선택, 세로 순서 변경, 빈 추가 영역 click |
| 오른쪽 panel | 선택이 없으면 form 제목 편집, 선택 시 element 속성 편집·초기화·삭제 |
| Element Display Settings | 관리자용 element 노출 여부 설정. 현재 값은 client store에 반영된다. |

사용자 정보의 `unuse_form_elements`, element type의 `visible`, `del_yn`, `sort_order`를 이용해 왼쪽 목록을 필터링하고 정렬한다. `visible=false`이거나 사용자에게 비활성화된 type은 기존 element가 있더라도 오른쪽 편집기가 읽기 전용이 된다.

### 3.2 JSON 화면

Preview 진입 상태를 `FormDataJson`으로 직렬화해 편집한다. 유효한 JSON이면 즉시 form 상태에 반영하고, 잘못된 JSON이면 오류를 표시한다. 불완전하거나 잘못된 element 속성은 type별 정규화 규칙에 따라 기본값으로 보정된다. 알 수 없는 `type`의 element는 제외된다.

복사는 다음 두 모드를 지원한다.

| 모드 | 동작 |
|---|---|
| 한 줄 복사 | JSON을 parse한 후 공백 없는 한 줄 JSON으로 복사 |
| 원본 복사 | 편집기의 줄바꿈과 들여쓰기를 유지해 복사 |

### 3.3 Form 저장 및 불러오기

| 작업 | API | 동작 |
|---|---|---|
| 신규 저장 | `POST /chat/forms` | `{ form_tl, form_elem }` 전송 |
| 기존 수정 | `PUT /chat/forms/{formId}` | 현재 `formId`의 form 갱신 |
| 목록 조회 | `GET /chat/forms` | 저장된 form 목록 조회, 제목 검색 및 10개 단위 pagination |
| form 선택 | 목록 행 double click | 저장 JSON을 정규화하여 editor에 로드 |

`checkbox`, `radio`, `dropbox`의 option이 `{ "value": "A", "label": "A" }`처럼 value와 label이 같으면 저장 직전에 문자열 `"A"`로 축약한다. 서로 다르면 객체 형태를 유지한다.

## 4. Form JSON 최상위 구조

```json
{
  "id": "form-...",
  "data": {
    "id": "form-...",
    "title": "new form",
    "elements": [],
    "dataSource": "",
    "dataSourceType": "json",
    "enableExcelUpload": false
  },
  "type": "form",
  "width": 320,
  "height": 597,
  "dragging": false,
  "selected": false
}
```

| 경로 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `id` | `string \| null` | 생성 ID | Builder node의 ID |
| `data.id` | `string` | 생성 ID | form 내부 ID |
| `data.title` | `string` | `new form` | form 제목 |
| `data.elements` | `FormElement[]` | `[]` | 배치 순서대로 저장되는 element 목록 |
| `data.dataSource` | `string?` | `""` | form data source. 현재 전용 UI 없이 JSON·저장·복원 상태로 유지 |
| `data.dataSourceType` | `json \| api` | `json` | data source 종류. 그 외 값은 JSON 적용 시 `json`으로 보정 |
| `data.enableExcelUpload` | `boolean?` | `false` | Excel upload 활성화 flag. 현재 전용 UI 없이 JSON·저장·복원 상태로 유지 |
| `type` | `form` | `form` | node 종류 |
| `width` / `height` | `number` | `320` / `597` | node 크기 metadata |
| `dragging` / `selected` | `boolean` | `false` | builder 상태 metadata |

## 5. 모든 element의 공통 options

오른쪽 panel의 **Default Properties (Common)** 및 **Custom Properties**에서 다루는 속성이다.

| 속성 | 타입 | 신규 기본값 | 편집/동작 규칙 |
|---|---|---|---|
| `id` | `string` | `{type}-{timestamp}-{random}` | element 식별자. UI에서 읽기 전용이며 drag 정렬, 선택, API target 지정에 사용 |
| `type` | 7개 `ElementType` 중 하나 | 생성 type | element 분기 기준. UI에서 직접 변경하지 않음 |
| `label` | `string` | type별 초기 label | canvas에 표시되는 제목. 필수 표시(`*`)는 있으나 코드상 별도 validation은 없음 |
| `name` | `string` | 대부분 `""`; search는 `search_term` | slot key. API payload template에서 element ID와 함께 참조 key로 사용 |
| `apiId` | `string?` | `""` | API modal에서 선택한 API ID. 읽기 전용 표시 |
| `apiData` | `Record<string, unknown> \| null` | `null` | 선택 API 정보. 실제 실행에는 주로 `endPoint`, `method`, `headers` 사용 |
| `eventType` | `onChange \| onClick \| ""` | `""` | 자동 API 실행 event. 속성 UI는 현재 `None`, `onChange`만 제공 |
| `parameterId` | `string?` | `""` | 현재 element 값을 query parameter로 보낼 때의 key |
| `optionalParameter` | `string?` | `""` | 추가 request body/parameter JSON 문자열. 반드시 JSON object여야 함 |
| `targetElementId` | `string?` | `""` | API 응답을 적용할 다른 element ID. 자기 자신은 선택 목록에서 제외 |
| `responsePath` | `string?` | `""` | 응답에서 꺼낼 dot/bracket 경로. 예: `data.items`, `data.items[0]` |

### 5.1 공통 API event 처리

1. Canvas에서 값 변경 시 `onChange`, element 카드 자체 click 시 값 인자 없이 `onClick`으로 판정한다.
2. 판정 event와 `eventType`이 같아야 실행한다.
3. `apiData.endPoint`와 `targetElementId`가 모두 있어야 한다.
4. `parameterId`가 있으면 `{ [parameterId]: 현재값 }`을 query parameter로 만든다.
5. 모든 element의 현재 `defaultValue`를 element `id` 및 값이 있는 `name` 양쪽 key로 수집한다.
6. `optionalParameter` 안의 `{{slotName}}`을 위 값으로 치환한 후 JSON object로 parse한다.
7. 자동 event 경로는 endpoint에 `POST`하고, 응답을 `responsePath` 규칙으로 target element에 적용한다.

Custom Properties의 **Run API**는 선택된 API의 method에 따라 GET/DELETE는 payload를 query에 합치고, POST/PUT/PATCH는 payload를 body로 전송한다. **Run and Apply**는 실행 후 target에도 적용한다. API modal에서 반환된 method/headers가 없으면 현재 코드의 임시 기본값을 사용하므로 운영 환경에서는 API metadata 제공 여부를 확인해야 한다.

## 6. Element별 options 상세

### 6.1 Input (`input`)

일반 `TextField`를 표시한다. Canvas에서 사용자가 입력해도 editor의 `defaultValue` 자체를 갱신하는 것이 아니라 설정된 `onChange` API event의 현재값으로 전달한다.

| option | 타입 | 기본값 | 상세 설명 |
|---|---|---|---|
| `defaultValue` | `string` | `""` | 미리보기 입력값. `{slotName}` 문법을 쓸 수 있다는 안내가 있으나 이 모듈 내에서 직접 치환하는 로직은 없음 |
| `placeholder` | `string` | `""` | 값이 없을 때 안내 문구 |
| `validation.type` | `text \| email \| number \| custom` | `text` | validation 종류 metadata. 현재 canvas는 항상 일반 TextField이고 이 값으로 실제 검증하거나 input type을 바꾸지는 않음 |

### 6.2 Date (`date`)

HTML date 입력 형태의 MUI `TextField`로 표시한다.

| option | 타입 | 기본값 | 상세 설명 |
|---|---|---|---|
| `defaultValue` | `string` | `""` | 날짜 값. UI는 `YYYY-MM-DD` 형식을 사용. API 응답 적용 시 parse 가능한 날짜를 UTC 기준 `YYYY-MM-DD`로 변환 |

### 6.3 Checkbox (`checkbox`)

여러 option을 동시에 선택한다.

| option | 타입 | 기본값 | 상세 설명 |
|---|---|---|---|
| `options` | `(string \| DisplayValue)[]` | Option 1, Option 2 | 표시할 항목 목록. 편집 UI에서는 최대 20개까지 count를 선택 |
| `defaultValue` | `string[]` | `[]` | 기본 체크할 option의 **value** 목록. 쉼표 또는 줄바꿈으로 입력하고, 존재하지 않는 value는 제거 |

option 편집으로 항목이 삭제되거나 value가 바뀌면 더 이상 존재하지 않는 `defaultValue`도 즉시 제거된다.

### 6.4 Radio (`radio`)

option 중 하나만 선택한다.

| option | 타입 | 기본값 | 상세 설명 |
|---|---|---|---|
| `options` | `(string \| DisplayValue)[]` | Option 1, Option 2 | 표시할 항목 목록. 편집 UI에서는 최대 20개까지 count를 선택 |
| `defaultValue` | `string` | `""` | 기본 선택 option의 **value**. `None` 또는 등록 option 중 하나를 선택 |

option 변경 후 현재 기본값이 option 목록에 없으면 빈 문자열로 초기화된다. JSON에서 배열형 기본값을 읽으면 첫 항목만 사용한다.

### 6.5 Dropbox (`dropbox`)

단일 또는 복수 선택을 지원하는 dropdown이다.

| option | 타입 | 기본값 | 상세 설명 |
|---|---|---|---|
| `options` | `(string \| DisplayValue)[]` | Option 1, Option 2 | 정적 선택 항목 |
| `optionsSlot` | `string` | `""` | 동적 options가 연결될 slot 이름 metadata. Canvas의 dropdown option은 현재도 정적 `options`를 사용 |
| `selectKind` | `single \| multi` | `single` | 단일/복수 선택 방식 |
| `defaultValue` | `string \| string[]` | `""` | single이면 문자열, multi이면 문자열 배열. 모두 option의 **value**를 저장 |

`selectKind` 전환 시 single → multi는 현재 값을 배열로 감싸고, multi → single은 첫 값만 유지한다. Multi preview는 선택 항목을 chip으로 최대 3개 표시하고 초과 개수는 `+N`으로 표시한다.

### 6.6 Grid (`grid`)

고정 cell grid와 slot 기반 grid의 두 모드가 있다.

| option | 타입 | 기본값 | 상세 설명 |
|---|---|---|---|
| `data` | `string[]` | 빈 문자열 4개 | row-major 순서의 cell 값. index는 `row * columns + column` |
| `rows` | `number` | `2` | 고정 grid 행 수. UI 입력 범위 표시는 1~20이며 실제 변경 시 최소 1로 보정 |
| `columns` | `number` | `2` | 고정 grid 열 수. UI 입력 범위 표시는 1~20이며 실제 변경 시 최소 1로 보정 |
| `displayKeys` | `DisplayKey[]` | `[]` | slot의 객체에서 표시할 `key`와 column 제목 `label` 목록 |
| `optionsSlot` | `string?` | `""` | Grid UI에서는 **Data Slot**으로 표시. 배열 data가 저장된 slot 이름 |

| 모드 | 조건 | 편집 및 preview |
|---|---|---|
| 고정 grid | `optionsSlot`이 비어 있음 | rows, columns와 각 cell을 직접 편집하고 실제 cell 값을 preview |
| slot grid | `optionsSlot`이 있음 | `key:label`을 한 줄씩 입력. preview에는 label과 `{optionsSlot}[0].{key}` 형태의 binding 예시 표시 |

행·열 변경 시 기존 `data`를 앞에서부터 유지하고 새 크기의 `rows * columns` 길이에 맞춰 부족한 cell을 빈 문자열로 채운다. JSON 로드 시 rows/columns가 양수가 아니면 각각 2로 보정한다.

### 6.7 Search (`search`)

검색어 입력 UI와 검색 결과를 저장할 slot metadata를 정의한다. Search의 `apiConfig`는 type별 고유 설정이며, 공통 `apiData` 기반 API event 설정과 별개이다.

| option | 타입 | 기본값 | 상세 설명 |
|---|---|---|---|
| `defaultValue` | `string` | `""` | 검색 입력값 |
| `placeholder` | `string` | `Enter search term...` | 검색 입력 안내 문구 |
| `apiConfig.url` | `string` | `https://` | 검색 API URL metadata |
| `apiConfig.method` | `string` | `POST` | 편집 UI 선택값은 GET 또는 POST |
| `apiConfig.headers` | `string` | `{}` | JSON header template. `{{slotName}}` 동적 값 안내 제공 |
| `apiConfig.bodyTemplate` | `string` | `{"query": "{{value}}"}` | 검색어는 `{{value}}`, 다른 slot은 `{{slotName}}`으로 표현하는 body template |
| `resultSlot` | `string` | `search_results` | API 응답 저장용 slot 이름. Grid의 Data Slot에서 참조하도록 설계 |
| `inputFillKey` | `string \| null` | `null` | 선택한 grid row 중 검색 input에 채울 key. 비어 있으면 첫 column 사용하도록 정의 |

현재 `form-builder` 내부 canvas에서 Search 입력 변경은 공통 `eventType/apiData` 경로로 전달된다. `apiConfig` template 실행, `resultSlot` 실제 저장, grid row 선택으로 `inputFillKey`를 채우는 실행 로직은 이 모듈 안에는 구현되어 있지 않고 downstream renderer가 소비할 설정으로 저장된다.

## 7. 선택형 element의 `options` 구조

`checkbox`, `radio`, `dropbox`가 사용하는 핵심 구조다.

```ts
interface DisplayValue {
  value: string; // 실제 저장·전송·defaultValue 비교에 사용하는 값
  label: string; // 사용자 화면에 표시하는 문구
}
```

다음 두 입력 표현을 모두 허용한다.

```json
["A", "B"]
```

```json
[
  { "value": "A", "label": "활성" },
  { "value": "B", "label": "비활성" }
]
```

| 처리 시점 | 정규화 규칙 |
|---|---|
| 신규 생성 | `{ value: "Option N", label: "Option N" }` 형태로 2개 생성 |
| 속성 편집 | 문자열 option을 동일한 value/label 객체로 변환. Count는 0~20 |
| JSON 불러오기 | 문자열은 동일 value/label 객체로 변환. 객체에 value가 없으면 제외하고 label이 없으면 value를 사용 |
| option count 증가 | 기존 index의 option을 보존하고 추가 항목을 `Option N`으로 생성 |
| option count 감소/값 변경 | 현재 option에 없는 defaultValue를 제거 또는 초기화 |
| 저장 | value와 label이 같은 객체만 문자열로 축약. 서로 다르면 객체 유지 |

주의할 점은 `value`가 선택 상태와 API 값의 기준이고, `label`은 화면 표시 전용이라는 것이다. 따라서 value는 가능한 한 비어 있지 않고 element 내부에서 고유해야 한다. 코드상 중복 value를 막는 validation은 없다.

## 8. API 응답의 target element 변환 규칙

`responsePath`가 있으면 해당 경로를 먼저 찾는다. 없으면 응답 객체의 `data` → `result` → `items` → `list` → `rows` 순서로 처음 존재하는 key를 자동 선택하고, 어느 것도 없으면 응답 전체를 사용한다.

| target type | 적용 규칙 |
|---|---|
| `input`, `search` | 배열이면 첫 값, 아니면 해당 값을 문자열로 변환하여 `defaultValue`에 저장 |
| `date` | 배열이면 첫 값. parse 가능한 날짜는 `YYYY-MM-DD`로 변환 |
| `checkbox` | 응답을 options로 정규화하고 모든 응답 값을 `defaultValue[]`로 설정 |
| `radio` | 응답을 options로 정규화하고 첫 값을 `defaultValue`로 설정 |
| `dropbox` | 응답을 options로 정규화. multi는 전체 값 배열, single은 첫 값 적용 |
| `grid` | 객체 배열은 object key를 columns로, 2차원 배열은 index를 columns로 생성. 첫 행에 header를 넣고 `rows = 응답 행 수 + 1`로 설정 |

선택형 응답 option의 value 후보 우선순위는 `value` → `id` → `code` → `key` → 1부터 시작하는 index이며, label 후보는 `label` → `name` → `title` → `text` → 결정된 value 순서다.

## 9. 초기화, 정렬 및 상태 변경 규칙

| 기능 | 동작 |
|---|---|
| element 추가 | registry 기본값으로 생성해 배열 끝에 추가하고 즉시 선택 |
| element 선택 | ID를 `selectedElementId`로 저장 |
| element 이동 | drag한 ID와 drop 대상 ID의 배열 index를 바꿈 |
| element 삭제 | 목록에서 제거하고 삭제 대상이 선택 상태면 선택 해제 |
| element Reset | 같은 type의 registry 기본값을 새로 만든 뒤 기존 ID만 유지 |
| form Reset | `formId=null`, 제목 `new form`, 빈 elements 및 form 부가 상태 초기화 |
| JSON 적용 | 각 element를 type별로 정규화하고 선택 상태 해제 |

## 10. 구현상 유의사항

| 항목 | 현재 구현 기준 유의점 |
|---|---|
| Preview 값 | Canvas control은 `defaultValue`로 제어되지만 일반 입력 조작 자체는 store 값을 변경하지 않는다. API event 전달용 동작에 가깝다. |
| `onClick` 설정 | 타입에는 존재하고 카드 click 처리도 지원하지만 Custom Properties의 event 선택 UI에는 현재 `onClick` 항목이 없다. JSON으로는 설정 가능하다. |
| Search API | `apiConfig`는 저장·편집되지만 이 모듈에서 직접 실행되지 않는다. 공통 `apiData/eventType` 경로와 구분해야 한다. |
| Dynamic slot | Search `resultSlot`, Dropbox `optionsSlot`, Grid `optionsSlot`, `inputFillKey`는 설정 metadata이며 실제 slot runtime은 별도 renderer 구현에 의존한다. |
| Validation | `input.validation.type`은 metadata만 저장하며 canvas에서 실제 validation을 수행하지 않는다. |
| Element type 관리 | type 목록 API 호출은 TODO 상태이고 현재 정적 `formElementTypesJson`을 사용한다. 관리자 visible 변경도 server에 저장하지 않는다. |
| Grid 최대값 | input UI에는 max 20이 있으나 change handler는 상한을 강제하지 않고 최소값만 강제한다. JSON 정규화도 양수 여부만 확인한다. |
| API 실행 기본값 | Custom API 실행에서 method/headers가 없으면 source에 하드코딩된 임시 값을 사용한다. 배포 전 제거 또는 설정화가 필요하다. |

## 11. 전체 예시

```json
{
  "id": "form-example",
  "data": {
    "id": "form-example",
    "title": "사용자 검색",
    "elements": [
      {
        "id": "input-name",
        "type": "input",
        "name": "user_name",
        "label": "사용자명",
        "placeholder": "이름 입력",
        "defaultValue": "",
        "validation": { "type": "text" }
      },
      {
        "id": "radio-status",
        "type": "radio",
        "name": "status",
        "label": "상태",
        "options": [
          { "value": "ACTIVE", "label": "활성" },
          { "value": "INACTIVE", "label": "비활성" }
        ],
        "defaultValue": "ACTIVE"
      },
      {
        "id": "grid-result",
        "type": "grid",
        "name": "results",
        "label": "검색 결과",
        "data": ["", "", "", ""],
        "rows": 2,
        "columns": 2,
        "displayKeys": [
          { "key": "userName", "label": "사용자명" },
          { "key": "status", "label": "상태" }
        ],
        "optionsSlot": "search_results"
      }
    ],
    "dataSource": "",
    "dataSourceType": "json",
    "enableExcelUpload": false
  },
  "type": "form",
  "width": 320,
  "height": 597,
  "dragging": false,
  "selected": false
}
```

JSON에서 공통 optional field를 생략해도 불러오기 과정에서 빈 문자열 또는 `null`로 보정된다. 다만 외부 renderer와 동일한 schema를 공유하려면 실제 저장 JSON에는 registry가 생성하는 공통 field를 유지하는 것이 안전하다.
