# Text Field 옵션 스펙

## 문서 기준

| 항목 | 내용 |
| --- | --- |
| 원본 | `hams-docs/public/form.io/Basic/TextField.html` |
| 컴포넌트 | Form.io Basic / Text Field |
| 탭 | Display, Data, Validation, API, Conditional, Logic, Layout |
| Key 표기 | 컴포넌트 JSON에 저장되는 속성 경로 |
| 기본값 판정 | 원본 HTML의 `selected`, `checked`, `value` 기준 |
| 조건부 | 다른 설정을 선택해야 렌더링되는 옵션 |

> 원본 HTML에서 확인한 실제 설정 컴포넌트를 기준으로 작성했다. Panel, HTML Element, Container처럼 옵션을 묶거나 설명하는 구조용 컴포넌트는 별도 옵션으로 세지 않고, 그 내부의 저장 가능한 옵션은 모두 표에 포함했다.

## Display

| No. | 옵션 | Key | 입력 형식 | 기본값 | 선택값 / 형식 | 노출 | 설명 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Label | `label` | text / string | 빈 문자열 | 문자열 | 항상, 필수 | 필드에 표시할 라벨 |
| 2 | Label Position | `labelPosition` | select / enum | `top` | `top`, `left-left`, `left-right`, `right-left`, `right-right`, `bottom` | 항상 | 라벨 위치와 좌우 정렬 지정 |
| 3 | Label Width | `labelWidth` | number | 빈 값 | 숫자 | 조건부 | 좌·우 라벨 배치 시 라벨 영역 너비 |
| 4 | Label Margin | `labelMargin` | number | 빈 값 | 숫자 | 조건부 | 좌·우 라벨 배치 시 라벨과 입력 사이 여백 |
| 5 | Placeholder | `placeholder` | text / string | 빈 문자열 | 문자열 | 항상 | 값이 없을 때 표시할 안내 문구 |
| 6 | Description | `description` | textarea / string | 빈 문자열 | 문자열 또는 HTML | 항상 | 입력 필드 아래에 표시할 설명 |
| 7 | Tooltip | `tooltip` | textarea / string | 빈 문자열 | 문자열 또는 HTML | 항상 | 도움말 아이콘에 표시할 내용 |
| 8 | Prefix | `prefix` | text / string | 빈 문자열 | 문자열 | 항상 | 입력 영역 앞에 표시할 문자열 |
| 9 | Suffix | `suffix` | text / string | 빈 문자열 | 문자열 | 항상 | 입력 영역 뒤에 표시할 문자열 |
| 10 | Widget | `widget.type` | select / enum | `input` | `input`, `calendar` | 항상 | 입력 UI를 Input Field 또는 Calendar Picker로 지정 |
| 11 | Widget Configuration | `widget` | textarea / object | 빈 값 | 선택한 위젯 설정 객체 | 조건부 | Widget 선택에 따른 세부 설정 |
| 12 | Input Mask | `inputMask` | text / string | 빈 문자열 | `9` 숫자, `a` 문자, `*` 영숫자 | 항상 | 입력값과 저장값에 적용할 형식 마스크 |
| 13 | Display Mask | `displayMask` | text / string | 빈 문자열 | `9` 숫자, `a` 문자, `*` 영숫자 | 항상 | 저장값은 유지하고 화면 표시에만 적용할 마스크 |
| 14 | Apply Mask On | `applyMaskOn` | select / enum | `change` | `change`, `blur` | 항상 | 마스크를 적용할 이벤트 |
| 15 | Input Mask Placeholder Char | `inputMaskPlaceholderChar` | text / string | 빈 값 | 한 문자 | 조건부 | 마스크의 미입력 자리를 표시할 문자 |
| 16 | Allow Multiple Masks | `allowMultipleMasks` | checkbox / boolean | `false` | `true`, `false` | 항상 | 여러 입력 마스크 사용 허용 |
| 17 | Input Masks | `inputMasks` | datagrid / array | 빈 배열 | 마스크 Label 및 Mask 행 목록 | 조건부 | 복수 입력 마스크 정의 |
| 18 | Custom CSS Class | `customClass` | text / string | 빈 문자열 | CSS 클래스명 | 항상 | 컴포넌트에 추가할 CSS 클래스 |
| 19 | Tab Index | `tabindex` | text / string | 빈 문자열 | HTML `tabindex` 값 | 항상 | 키보드 탭 이동 순서 |
| 20 | Autocomplete | `autocomplete` | text / string | 빈 문자열 | HTML `autocomplete` 값 | 항상 | 브라우저 자동완성 동작 지정 |
| 21 | Hidden | `hidden` | checkbox / boolean | `false` | `true`, `false` | 항상 | 폼에는 포함하되 화면에서 숨김 |
| 22 | Hide Label | `hideLabel` | checkbox / boolean | `false` | `true`, `false` | 항상 | 빌더에는 라벨을 유지하고 렌더링 시 숨김 |
| 23 | Show Word Counter | `showWordCount` | checkbox / boolean | `false` | `true`, `false` | 항상 | 실시간 단어 수 표시 |
| 24 | Show Character Counter | `showCharCount` | checkbox / boolean | `false` | `true`, `false` | 항상 | 실시간 문자 수 표시 |
| 25 | Hide Input | `mask` | checkbox / boolean | `false` | `true`, `false` | 항상 | 브라우저에서 값을 가림. 서버 암호화는 아님 |
| 26 | Initial Focus | `autofocus` | checkbox / boolean | `false` | `true`, `false` | 항상 | 폼 렌더링 시 최초 포커스 지정 |
| 27 | Allow Spellcheck | `spellcheck` | checkbox / boolean | `true` | `true`, `false` | 항상 | 브라우저 맞춤법 검사 허용 |
| 28 | Data Grid Label | `dataGridLabel` | checkbox / boolean | 빈 값 | `true`, `false` | 조건부 | Data Grid 내부에서 행을 식별하는 라벨로 사용 |
| 29 | Disabled | `disabled` | checkbox / boolean | `false` | `true`, `false` | 항상 | 사용자 입력 비활성화 |
| 30 | Table View | `tableView` | checkbox / boolean | `true` | `true`, `false` | 항상 | 제출 데이터 Table View에 값 표시 |
| 31 | Modal Edit | `modalEdit` | checkbox / boolean | `false` | `true`, `false` | 항상 | 모달에서 값 편집 |

## Data

| No. | 옵션 | Key | 입력 형식 | 기본값 | 선택값 / 형식 | 노출 | 설명 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Multiple Values | `multiple` | checkbox / boolean | `false` | `true`, `false` | 항상 | 여러 값 입력 허용 |
| 2 | Default Value | `defaultValue` | text / string | 빈 문자열 | 문자열 | 항상 | 사용자 입력 전 초기값. Placeholder보다 우선 |
| 3 | Persistent | `persistent` | radio / enum | `true` | `false`(None), `true`(Server), `client-only`(Client) | 항상 | 값의 저장 범위 지정 |
| 4 | Input Format | `inputFormat` | select / enum | `plain` | `plain`, `html`, `raw` | 항상 | 입력값 정제 형식. `raw`는 보안상 주의 필요 |
| 5 | Protected | `protected` | checkbox / boolean | `false` | `true`, `false` | 항상 | API 조회 결과에서 필드 제외 |
| 6 | Database Index | `dbIndex` | checkbox / boolean | `false` | `true`, `false` | 항상 | 제출 데이터 검색을 위한 DB 인덱스 생성 |
| 7 | Text Case | `case` | radio / enum | 원본에 checked 없음 | `mixed`, `uppercase`, `lowercase` | 항상 | 입력값의 대·소문자 변환 방식 |
| 8 | Truncate Multiple Spaces | `truncateMultipleSpaces` | checkbox / boolean | `false` | `true`, `false` | 항상 | 연속 공백 축약 |
| 9 | Encrypted | `encrypted` | checkbox / boolean | 빈 값 | `true`, `false` | 숨김 | 저장값 암호화 여부 |
| 10 | Redraw On | `redrawOn` | select / enum | 빈 값 | 빈 값, `data`(Any Change), `submit` | 항상 | 지정 이벤트에 컴포넌트 다시 렌더링 |
| 11 | Omit Value From Submission Data When Conditionally Hidden | `clearOnHide` | checkbox / boolean | `true` | `true`, `false` | 항상 | 조건부로 숨겨질 때 제출 데이터에서 값 제거 |
| 12 | Custom Default Value - JavaScript | `customDefaultValue` | code / JavaScript | 빈 문자열 | `value = ...` 형식 | 고급 패널 | JavaScript로 기본값 계산 |
| 13 | Custom Default Value - JSONLogic | `customDefaultValue` | code / JSONLogic | `""` | JSONLogic 객체 | 고급 패널 | JSONLogic으로 기본값 계산 |
| 14 | Calculated Value - JavaScript | `calculateValue` | code / JavaScript | 빈 문자열 | `value = ...` 형식 | 고급 패널 | JavaScript로 필드 값 계산 |
| 15 | Calculated Value - JSONLogic | `calculateValue` | code / JSONLogic | `""` | JSONLogic 객체 | 고급 패널 | JSONLogic으로 필드 값 계산 |
| 16 | Calculate Value on Server | `calculateServer` | checkbox / boolean | `false` | `true`, `false` | 항상 | 계산식을 서버에서도 실행 |
| 17 | Allow Manual Override of Calculated Value | `allowCalculateOverride` | checkbox / boolean | `false` | `true`, `false` | 항상 | 계산값의 사용자 수동 변경 허용 |
| 18 | Server Override | `serverOverride` | textarea / JSON object | `{}` | 컴포넌트 설정 객체 | 항상 | 서버 제출 처리 시 덮어쓸 컴포넌트 설정 |

## Validation

| No. | 옵션 | Key | 입력 형식 | 기본값 | 선택값 / 형식 | 노출 | 설명 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Validate On | `validateOn` | select / enum | `change` | `change`, `blur` | 항상 | 프런트엔드 검증 실행 시점 |
| 2 | Required | `validate.required` | checkbox / boolean | `false` | `true`, `false` | 항상 | 제출 전 입력 필수 여부 |
| 3 | Unique | `unique` | checkbox / boolean | `false` | `true`, `false` | 항상 | 기존 제출값을 포함한 값의 고유성 검사 |
| 4 | Validate When Hidden | `validateWhenHidden` | checkbox / boolean | `false` | `true`, `false` | 항상 | 숨김 또는 조건부 숨김 상태에서도 검증 |
| 5 | Minimum Length | `validate.minLength` | number | 빈 값 | 0 이상의 정수 | 항상 | 최소 문자 수 |
| 6 | Maximum Length | `validate.maxLength` | number | 빈 값 | 0 이상의 정수 | 항상 | 최대 문자 수 |
| 7 | Minimum Word Length | `validate.minWords` | number | 빈 값 | 0 이상의 정수 | 항상 | 최소 단어 수 |
| 8 | Maximum Word Length | `validate.maxWords` | number | 빈 값 | 0 이상의 정수 | 항상 | 최대 단어 수 |
| 9 | Regular Expression Pattern | `validate.pattern` | text / regex string | 빈 문자열 | 정규식 패턴 | 항상 | 제출값이 만족해야 하는 정규식 |
| 10 | Error Label | `errorLabel` | text / string | 빈 문자열 | 문자열 | 항상 | 오류 발생 시 사용할 필드 라벨 |
| 11 | Custom Error Message | `validate.customMessage` | text / string | 빈 문자열 | 문자열 | 항상 | 모든 검증 오류에 사용할 공통 메시지 |
| 12 | Custom Validation | `validate.custom` | code / JavaScript | 빈 문자열 | `valid = true` 또는 오류 문자열 | 고급 패널 | JavaScript 기반 사용자 정의 검증 |
| 13 | Secret Validation | `validate.customPrivate` | checkbox / boolean | `false` | `true`, `false` | Custom Validation 내부 | 사용자 정의 검증을 서버에서만 실행 |
| 14 | JSONLogic Validation | `validate.json` | code / JSONLogic | `""` | JSONLogic 객체 | 고급 패널 | JSONLogic 기반 사용자 정의 검증 |
| 15 | Custom Errors | `errors` | code / JSON object | `""` | 오류 Key별 메시지 객체 | 고급 패널 | `required`, `min`, `max`, `minLength`, `maxLength` 등 오류별 메시지 재정의 |

## API

| No. | 옵션 | Key | 입력 형식 | 기본값 | 선택값 / 형식 | 노출 | 설명 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Property Name | `key` | text / string | 빈 문자열 | API 속성명 | 항상, 필수 | API 및 제출 데이터에서 사용할 필드 Key |
| 2 | Field Tags | `tags` | tags / string array | 빈 배열 | 태그 문자열 목록 | 항상 | 사용자 정의 로직 등에서 필드를 식별할 태그 |
| 3 | Custom Properties | `properties` | datamap / object | 원본 예시 `{ "key": "" }` | Key/Value 문자열 Map | 항상 | 컴포넌트 사용자 정의 속성 |

> `properties` 내부의 `__key`와 동적 Value 입력은 DataMap 한 행을 구성하는 편집용 필드이며 독립적인 컴포넌트 옵션은 아니다.

## Conditional

| No. | 옵션 | Key | 입력 형식 | 기본값 | 선택값 / 형식 | 노출 | 설명 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | This component should Display | `conditional.show` | select / boolean | 빈 값 | `true`, `false` | Simple | 조건 충족 여부에 따른 표시 방식 |
| 2 | When the form component | `conditional.when` | select / string | 빈 값 | 다른 컴포넌트 Key. 원본에는 `submit` 항목 렌더링 | Simple | 조건을 평가할 대상 컴포넌트 |
| 3 | Has the value | `conditional.eq` | text / any | 빈 문자열 | 비교값 | Simple | 대상 컴포넌트가 가져야 할 값 |
| 4 | Advanced Conditions - JavaScript | `customConditional` | code / JavaScript | 빈 문자열 | `show = boolean` 형식 | Advanced | JavaScript로 표시 여부 결정. Simple 결과보다 우선 |
| 5 | Advanced Conditions - JSONLogic | `conditional.json` | code / JSONLogic | `""` | JSONLogic 객체 | Advanced | JSONLogic으로 표시 여부 결정 |

## Logic

### Logic 공통

| No. | 옵션 | Key | 입력 형식 | 기본값 | 선택값 / 형식 | 노출 | 설명 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Advanced Logic | `logic` | editgrid / array | 빈 배열 | Logic 객체 목록 | 항상 | Trigger와 Actions로 구성된 고급 로직 목록 |
| 2 | Logic Name | `logic[].name` | text / string | 빈 문자열 | 문자열 | Logic 편집, 필수 | 로직 이름 |

### Trigger

| No. | 옵션 | Key | 입력 형식 | 기본값 | 선택값 / 형식 | 노출 | 설명 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Trigger Type | `logic[].trigger.type` | select / enum | 빈 값 | `simple`, `javascript`, `json`, `event` | 항상 | Trigger 평가 방식 |
| 2 | Simple Trigger | `logic[].trigger.simple` | container / object | 빈 값 | 단순 조건 객체 | Type=`simple` | 단순 조건 설정 묶음 |
| 3 | JavaScript Trigger | `logic[].trigger.javascript` | textarea / JavaScript | 빈 값 | JavaScript 표현식 | Type=`javascript` | JavaScript 조건 평가 |
| 4 | JSON Logic Trigger | `logic[].trigger.json` | textarea / JSONLogic | 빈 값 | JSONLogic 객체 | Type=`json` | JSONLogic 조건 평가 |
| 5 | Event Trigger | `logic[].trigger.event` | text / string | 빈 값 | 이벤트명 | Type=`event` | 지정 Form.io 이벤트 발생 시 실행 |

### Actions

| No. | 옵션 | Key | 입력 형식 | 기본값 | 선택값 / 형식 | 노출 | 설명 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Actions | `logic[].actions` | editgrid / array | 빈 배열 | Action 객체 목록 | 항상 | Trigger 충족 시 실행할 동작 목록 |
| 2 | Action Name | `logic[].actions[].name` | text / string | 빈 문자열 | 문자열 | Action 편집, 필수 | Action 이름 |
| 3 | Action Type | `logic[].actions[].type` | select / enum | 빈 값 | `property`, `value`, `mergeComponentSchema`, `customAction` | 항상 | 실행할 Action 유형 |
| 4 | Property | `logic[].actions[].property` | select / string | 빈 값 | 변경할 컴포넌트 속성 | Type=`property` | 상태를 변경할 속성 선택 |
| 5 | State | `logic[].actions[].state` | select / boolean | 빈 값 | 선택한 속성에 적용할 상태 | Type=`property` | 속성의 boolean 상태 지정 |
| 6 | Text | `logic[].actions[].text` | text / string | 빈 값 | 문자열 | Type=`property`, 조건부 | 속성에 적용할 텍스트 값 |
| 7 | Value | `logic[].actions[].value` | textarea / JavaScript 또는 값 | 빈 값 | 계산식 또는 값 | Type=`value` | 컴포넌트 값 설정 |
| 8 | Schema Definition | `logic[].actions[].schemaDefinition` | textarea / JSON object | 빈 값 | 병합할 컴포넌트 스키마 | Type=`mergeComponentSchema` | 현재 컴포넌트 스키마에 설정 병합 |
| 9 | Custom Action | `logic[].actions[].customAction` | textarea / JavaScript | 빈 값 | JavaScript 코드 | Type=`customAction` | 사용자 정의 동작 실행 |

## Layout

| No. | 옵션 | Key | 입력 형식 | 기본값 | 선택값 / 형식 | 노출 | 설명 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | HTML Attributes | `attributes` | datamap / object | 원본 예시 `{ "aaa": "1111", "key": "", "key1": "" }` | Attribute Name/Value Map | 항상 | 입력 엘리먼트에 HTML 속성 추가. Form.io 생성 속성이 우선 |
| 2 | PDF Overlay Style | `overlay.style` | text / string | 빈 문자열 | CSS 스타일 문자열 | PDF Overlay | PDF 폼 오버레이 스타일 |
| 3 | PDF Overlay Page | `overlay.page` | text / number-like string | 빈 문자열 | 페이지 번호 | PDF Overlay | 오버레이를 표시할 PDF 페이지 |
| 4 | PDF Overlay Left | `overlay.left` | text / number-like string | 빈 문자열 | 좌측 좌표 | PDF Overlay | 오버레이의 수평 위치 |
| 5 | PDF Overlay Top | `overlay.top` | text / number-like string | 빈 문자열 | 상단 좌표 | PDF Overlay | 오버레이의 수직 위치 |
| 6 | PDF Overlay Width | `overlay.width` | text / number-like string | 빈 문자열 | 너비 | PDF Overlay | 오버레이 너비 |
| 7 | PDF Overlay Height | `overlay.height` | text / number-like string | 빈 문자열 | 높이 | PDF Overlay | 오버레이 높이 |

> Layout HTML의 `data[type]` hidden 필드와 `data[textField]` 입력은 우측 미리보기 Form에 속한 렌더링 데이터다. Text Field 설정 옵션이 아니므로 표에서 제외했다. `attributes` 내부의 `__key`, `aaa`, `key`, `key1` 입력도 DataMap 행 편집 필드이며 각각을 독립 옵션으로 세지 않았다.

## 논리 옵션 개수 검증

| 탭 | 문서화한 옵션 수 | 원본 구조 대조 메모 |
| --- | ---: | --- |
| Display | 31 | 원본 설정 컴포넌트 31개와 일치 |
| Data | 18 | JS/JSONLogic 편집 방식을 각각 명시; 구조·설명 컴포넌트 제외 |
| Validation | 15 | Secret Validation 및 세 고급 검증 편집기 포함 |
| API | 3 | DataMap 내부 행 필드는 Custom Properties에 포함 |
| Conditional | 5 | Simple 3개, Advanced 2개 |
| Logic | 16 | 공통 2개, Trigger 5개, Actions 9개 |
| Layout | 7 | HTML Attributes 1개, PDF Overlay 하위 옵션 6개 |
| **합계** | **95** | 저장 가능한 논리 옵션 기준 |
