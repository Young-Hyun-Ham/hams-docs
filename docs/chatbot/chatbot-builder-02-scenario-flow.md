# CBB-02 플로우 편집 기능명세

## 1. 목적

시나리오를 노드와 엣지로 설계하고, 노드 속성 편집·실행 시뮬레이션·저장·Push를 수행한다. React Flow 기반 편집 뷰와 Orkes 뷰를 전환할 수 있다.

## 2. 초기화

- 선택 시나리오가 있으면 상세 데이터의 nodes, edges, start node를 로드한다.
- 화면 직접 진입에 대비해 전체 시나리오 목록을 별도로 로드한다.
- 주 시나리오를 첫 탭으로 생성한다.
- 데이터 로드 중에는 Backdrop와 `Loading scenario data...`를 표시한다.

## 3. 레이아웃

| 영역 | 기능 |
|---|---|
| 좌측 Node Library | 노드 유형 탐색, Drag & Drop/클릭 추가 모드, 시나리오 그룹, 노드 설정 |
| 시나리오 탭 | 주 시나리오와 그룹/하위 시나리오를 복수 탭으로 열고 전환/닫기 |
| 캔버스 상단 도구 | Undo/Redo, Save, Push, Back, Pan/Select, Memo, Simulator, Log, Run/Stop, Group, 뷰 전환, 검색 |
| 중앙 캔버스 | 노드·엣지 생성/이동/선택/연결/삭제, 자동정렬, 미니맵, 확대/축소 |
| 우측 Controller | 선택 노드 유형별 속성 편집과 Save Changes |
| 우측 Simulator | 챗봇 대화 시뮬레이션, 확장/축소, 폭 조절 |
| 보조 패널 | Runtime State, Memo Pad, 캔버스 메모 |

## 4. Node Library 및 노드 추가

- 라이브러리 섹션/항목은 Store에서 로드하며 index 오름차순으로 표시한다.
- Drag & Drop ON: 항목을 캔버스 위치에 드롭해 노드를 생성한다. 항목 클릭 추가는 하지 않는다.
- Drag & Drop OFF: 항목 클릭 시 기본 위치에 노드를 생성한다.
- 라이브러리는 264px/46px로 접고 펼친다. 시뮬레이터 표시 상태에 따라 자동 축소될 수 있다.
- 시나리오 그룹 항목은 선택 모달을 열거나 캔버스 드롭 위치에 그룹을 추가한다.
- 우클릭 `Add Node` 또는 노드 사이 삽입 동작은 Activity Picker를 열어 최근/검색 결과에서 유형을 선택한다.
- 기존 source-target 사이에 삽입하면 기존 엣지를 제거하고 source→신규→target으로 재연결한다.

### 지원 노드

| 유형 | 용도 | 주요 편집값 |
|---|---|---|
| Message | 메시지 응답 | 언어/메시지 ID, 내용, 응답 데이터, 저장 데이터, Quick Replies |
| Form | 입력 폼 | 폼 요소, 템플릿, API 연동 및 응답 매핑 |
| Condition Branch | 조건/선택 분기 | 평가 방식, 조건 또는 replies, 분기 핸들 |
| Y/N Branch | Yes/No 분기 | Y/N 출력 경로; 컨텍스트 메뉴로 생성 |
| Slot Filling | 사용자 값 수집 | 질문, 슬롯명, Quick Replies |
| API | 외부 API 호출 | Endpoint/Method/Header/Parameter/Body/응답 경로 등 |
| LLM | LLM 호출 | Prompt, Output Variable, 조건 분기 |
| Set Slot | 런타임 값 설정 | Slot Key/Value 할당 목록 |
| Delay | 실행 지연 | 지연 시간 관련 값 |
| Fixed Menu | 고정 메뉴 | 메뉴 응답 항목 |
| Link | 링크 응답 | URL, Display Text |
| Toast | 토스트 표시 | 메시지, 타입 |
| iFrame | 외부 화면 임베드 | URL, Width, Height |
| Scenario Group | 다른 시나리오 포함 | 그룹명, 시나리오 선택, 탭으로 열기 |
| Selection Group | 선택 노드 묶음 | 그룹 헤더 및 접기/펼치기 |

## 5. 캔버스 조작

### 기본 조작

- Pan 모드: 드래그로 캔버스를 이동한다.
- Select 모드: 드래그 영역과 Shift로 복수 노드를 선택한다. 부분 교차 선택을 허용한다.
- 휠/핀치 확대·축소, Controls와 zoom/pan 가능한 MiniMap을 제공한다.
- 노드 핸들을 연결하면 엣지를 생성한다. 기본 엣지는 직교형, 닫힌 화살표를 사용한다.
- 분기 엣지는 조건/reply 순번, Y/N 분기는 Y 또는 N 라벨을 계산해 표시한다.
- 시뮬레이터가 열려 있으면 노드 드래그를 비활성화한다.
- 자동정렬 버튼은 현재 그래프를 레이아웃한다.

### 단축키

| 입력 | 기능 |
|---|---|
| Delete | 선택 노드/엣지 삭제 |
| Ctrl/Cmd+Z | Undo |
| Ctrl+Y 또는 Cmd+Shift+Z | Redo |
| Ctrl/Cmd+C | 선택 노드 복사 |
| Ctrl/Cmd+X | 선택 노드 잘라내기 |
| Ctrl/Cmd+V | 붙여넣기 |
| Shift | 복수 선택 보조 키 |

입력 필드 편집 중에는 삭제/클립보드 단축키가 콘텐츠 입력을 방해하지 않아야 한다.

### 컨텍스트 메뉴

| 대상 | 기능 |
|---|---|
| 빈 캔버스 | Add Node, Paste, Memo Panel, Runtime State, Pan/Select Mode, Add Memo, Exit |
| 노드 | Copy, Cut, Paste, 입력 핸들 위치 변경, 출력 위치 개별 설정, Delete Node, Memo Panel |
| 엣지 | Y/N Branch 삽입, Delete Edge, Memo Panel |
| 복수 선택 | Copy/Cut/Paste, 선택 노드 그룹화, Memo Panel |

메뉴는 화면 경계를 벗어나지 않도록 좌표를 보정하고 캔버스 클릭 시 닫힌다.

## 6. 탭과 그룹

- Scenario Group Controller에서 대상 시나리오를 선택하고 `Open Scenario in Tab`으로 연다.
- 탭 전환 시 현재 탭의 nodes, edges, start/selected node 상태를 보존하고 대상 탭 상태로 교체한다.
- 탭이 2개 이상이면 닫기 아이콘을 제공한다.
- 최소 2개의 최상위 노드를 선택해야 Selection Group을 생성할 수 있다.
- 접힌 그룹의 자식 노드는 캔버스에서 숨긴다.

## 7. 노드 속성 Controller

- 노드 선택 시 우측 패널을 표시하고 유형별 Controller를 렌더링한다.
- 속성은 로컬 복사본에서 편집하며 원본과 다를 때 `Save Changes *`가 활성화된다.
- 저장 시 Store의 해당 노드 data를 갱신한다.
- Branch 평가 방식 변경으로 기존 출력 핸들이 무효가 되면 확인창을 표시한다.
- 확인 시 무효 엣지와 다른 유입 경로가 없는 하위 orphan 노드를 재귀 삭제한다. 시작 노드는 삭제하지 않는다.
- 선택 노드가 없으면 `Please select a node to edit` 안내를 표시한다.

## 8. 검색과 보조 패널

- 노드 유형(All 또는 개별 유형)과 텍스트 키워드로 캔버스 노드를 검색한다.
- 검색 대상은 노드 data의 메시지/라벨 등 표시 텍스트를 조합한다.
- 결과 클릭 시 해당 노드로 이동하고 선택한다.
- Runtime State는 실행 중 슬롯/현재 값을 표시한다.
- Memo Pad는 독립 메모 목록을 표시한다.
- Canvas Memo는 플로우 좌표에 생성되며 이동, 크기 조절, 접기, 수정, 삭제가 가능하고 viewport 변환을 따른다.

## 9. 실행과 시뮬레이터

- Simulator 버튼은 우측 챗봇 시뮬레이터를 열고 닫으며, 패널 폭을 드래그로 조절하고 확장할 수 있다.
- Run은 시작 노드부터 실행 앵커까지 실행한다. 실행 중 Stop으로 중단한다.
- Branch 노드에서 사용자 선택이 필요하면 Select Branch 모달에 reply 버튼을 표시한다.
- Form 노드 입력이 필요하면 Form input 모달을 표시한다. checkbox, select, grid, 일반 입력 등을 렌더링한다.
- Form 요소의 onchange API가 설정되면 현재 폼 값으로 요청하고 응답을 대상 요소/옵션에 매핑한다.
- Submit은 입력값을 실행 엔진에 전달하고 Cancel은 입력 대기를 취소한다.
- Execution Log는 오류 메시지와 실행 로그 JSON을 표시한다.

## 10. 저장, Push, DB JSON 편집

### Save/Commit

1. `Do you want to save the Scenario?` 확인창을 표시한다.
2. 확인 시 실행 상태를 초기화한다.
3. 현재 시나리오와 nodes, 정제된 edges, start node를 저장한다.

### Push

1. `Do you want to push the Scenario?` 확인창을 표시한다.
2. 확인 시 Push 처리 후 실행 상태를 초기화한다.
3. Save와 별도 버튼이며 배포 전송 성격의 작업으로 취급한다.

### Log / DB JSON Edit

- 현재 nodes/edges JSON을 대형 Dialog에서 조회·편집한다.
- LogPreview가 `setNodes`, `setEdges`로 캔버스 상태를 갱신할 수 있다.
- Dialog 자체에는 Cancel만 있고 별도 확정 버튼은 없다.

## 11. 뷰 모드

- Flow: React Flow 기반 자유 배치 편집 화면.
- Orkes: 동일 데이터를 워크플로 형태로 표현하는 대체 뷰.
- 상단 전환 컨트롤로 변경하며 공통 도구 모음은 두 모드에서 유지된다.

## 12. 예외 및 QA 확인사항

- 직접 URL 진입 시 선택 시나리오가 없을 수 있으므로 빈/로딩 상태를 확인한다.
- 저장 전에 Controller의 미저장 로컬 변경이 자동 반영되는지 여부를 확인한다. 코드상 `Save Changes`가 선행되어야 한다.
- Push의 구체 API/버전 생성 결과와 성공 알림은 연동 환경에서 검증한다.
- 그룹 탭 전환 후 저장 범위가 활성 탭인지 주 시나리오 전체인지 회귀 테스트가 필요하다.
- Form onchange API Header 상수에 API Key가 하드코딩되어 있으므로 보안 설정 분리가 필요하다.
- Undo/Redo history에 메모, Controller 변경, 자동정렬, 그룹 작업이 모두 포함되는지 기능별 확인이 필요하다.

