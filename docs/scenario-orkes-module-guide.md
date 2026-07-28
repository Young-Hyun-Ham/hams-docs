# Scenario Orkes Module Guide

이 문서는 `src/app/builder/scenario-orkes` 패키지의 파일별 역할과 주요 데이터 흐름을 정리한다. 이 모듈은 React Flow 기반 시나리오 빌더이며, 노드 편집, 자동 레이아웃, 분기/그룹 표시, 실행 시뮬레이션, 슬롯 값 확인, 컨텍스트 메뉴, 액티비티 추가 모달을 포함한다.

## 1. 전체 구조

```text
src/app/builder/scenario-orkes/
  page.tsx
  types/index.ts
  constants/nodeSizes.ts
  components/
    BuildTopDownFlow.tsx
    FlowCanvas.tsx
    FlowTypes.tsx
    FlowCanvas.module.css
    SlotPanel.tsx
    SlotPanel.module.css
    context-menu/FlowContextMenu.tsx
    hooks/useExecutionFormInput.ts
    hooks/useFlowNodeSearch.ts
    icons/Icons.jsx
    modals/
      ActivityPickerModal.tsx
      BranchSelectionModal.tsx
      ExecutionFormInputModal.tsx
      simulator/
        ChatbotSimulator.jsx
        MessageHistory.jsx
        MessageRenderer.jsx
        SimulatorHeader.jsx
        UserInput.jsx
        ChatbotSimulator.module.css
    nodes/
      ApiNode.jsx
      BranchNode.tsx
      ChatNodes.module.css
      FormNode.jsx
      GroupNode.tsx
      IframeNode.jsx
      LinkNode.jsx
      MessageNode.jsx
      NodeWrapper.jsx
      ScenarioNode.jsx
      SetSlotNode.jsx
    toolbar/FlowCanvasToolbar.tsx
```

## 2. 핵심 데이터 흐름

### 2.1 화면 진입과 상태 소유

`page.tsx`가 `ReactFlowProvider`를 감싸고 실제 페이지 컨테이너인 `FlowUiPathPageContent`를 렌더링한다. 이 파일은 `useBuilderStore`에서 `scenario`, `nodes`, `edges`, `selectedNodeId`, `startNodeId` 등을 가져와 전체 빌더 상태를 조립한다.

주요 흐름은 다음과 같다.

1. 좌측 `Sidebar`에서 시나리오를 선택한다.
2. `fetchScenario()`로 시나리오 상세를 불러오고 store에 반영한다.
3. `FlowCanvas`에 `nodes`, `edges`, 선택 상태, 삽입 핸들러를 전달한다.
4. `FlowCanvas`는 `buildTopDownFlow()`로 저장용 노드/엣지를 화면 표시용 노드/엣지로 변환한다.
5. React Flow가 `flowNodeTypes`, `flowEdgeTypes`를 기준으로 노드와 엣지를 그린다.

### 2.2 노드 추가 흐름

노드 추가는 `page.tsx`의 `openActivityPicker()`와 `handleSelectActivity()`가 담당한다.

`openActivityPicker(target)`는 삽입 대상인 `InsertTarget`을 저장하고 `ActivityPickerModal`을 연다. `InsertTarget`은 다음 필드를 가진다.

```ts
type InsertTarget = {
  sourceId?: string | null;
  sourceHandle?: string | null;
  targetId?: string | null;
  parentId?: string | null;
};
```

`handleSelectActivity(type)`는 선택된 액티비티 타입으로 `createNodeData(type)`를 호출해 새 노드 데이터를 만들고, `BuilderNode`를 생성한다. 이후 `createWorkflowEdge()`로 저장용 edge를 만든다.

일반 삽입에서는 기존 `source -> target` edge를 제거하고 `source -> newNode`, `newNode -> target` edge를 추가한다. 그룹 내부 삽입에서는 `parentId`를 기준으로 그룹 자식 노드 사이에 새 노드를 끼워 넣는다.

### 2.3 저장용 edge와 표시용 edge

저장용 edge는 `createWorkflowEdge()`로 생성된다. 저장용 edge는 기본적으로 `type: 'default'`이며, API success/error나 branch 선택 경로는 `type`이 아니라 `sourceHandle`로 구분한다.

표시용 edge는 `BuildTopDownFlow.tsx` 내부에서 다시 만들어진다. React Flow에 전달되는 것은 저장용 `edges`가 아니라 `displayEdges`다. 이 단계에서 필요에 따라 `type: 'fanoutCurve'`, `type: 'endMerge'` 같은 화면 전용 edge 타입이 붙는다.

## 3. 파일별 역할

### 3.1 `page.tsx`

패키지의 페이지 엔트리다.

주요 책임:

- `ReactFlowProvider` 제공
- builder store와 sidebar store 연동
- 시나리오 목록 및 상세 조회
- 노드 추가 모달 상태 관리
- `handleSelectActivity()`에서 노드와 저장용 edge 생성
- start node 설정
- 선택 노드에 따른 우측 `NodeController` 표시
- play 모드일 때 `SlotPanel` 표시
- canvas memo 생성, 이동, 리사이즈 관리
- 시나리오 편집 모달과 노드 설정 모달 연결

중요한 함수:

- `openActivityPicker(target)`: `InsertTarget`을 저장하고 액티비티 선택 모달을 연다.
- `handleSelectActivity(type)`: 새 노드를 생성하고 edge를 재구성한다.
- `addCanvasMemo(flowWrapperRef)`: 현재 viewport 중심에 memo를 만든다.
- `handleClick(...)`: 좌측 sidebar 클릭 이벤트를 받아 시나리오를 로드하거나 초기화한다.
- `handleSave()`: 현재 노드/엣지/startNodeId를 payload 형태로 구성한다.
- `handleSaveScenario(nextScenario)`: 시나리오 메타 정보를 patch한다.

### 3.2 `types/index.ts`

`scenario-orkes` 내부에서 사용하는 타입을 모아 둔 파일이다.

주요 타입:

- `BuilderNodeData`: 노드의 공통 data 필드
- `BuilderNode`: React Flow `Node<BuilderNodeData>`
- `BuilderEdge`: React Flow `Edge<unknown>`
- `InsertTarget`: add node 클릭 시 어디에 삽입할지 나타내는 대상 정보
- `AddNodeData`: 화면용 add node가 들고 있는 `target`, `onAdd`
- `NodeSize`: 측정된 노드 width/height
- `ContextMenuState`: 캔버스 우클릭 메뉴 상태
- `ExecutionFormElement`: 실행 중 form 입력 모달에서 렌더링할 form element
- `SidebarMenuData`: sidebar 선택 context

### 3.3 `constants/nodeSizes.ts`

레이아웃 계산에 쓰는 기본 노드 크기 상수다.

```ts
export const FLOW_NODE_SIZES = {
  defaultWidth: 260,
  formWidth: 300,
  groupMinWidth: 620,
  branchMinWidth: 520,
  defaultHeight: 72,
  groupMinHeight: 210,
  branchMinHeight: 250,
} as const;
```

`BuildTopDownFlow.tsx`, `GroupNode.tsx` 등에서 fallback 크기와 최소 크기로 사용한다.

## 4. 캔버스와 레이아웃 모듈

### 4.1 `components/FlowCanvas.tsx`

React Flow 캔버스의 실제 wrapper다. 저장용 `nodes`, `edges`를 props로 받아 표시용 `displayNodes`, `displayEdges`로 변환하고 React Flow에 전달한다.

주요 책임:

- `buildTopDownFlow()` 호출
- 실제 DOM 노드 크기 측정 및 `nodeSizes` 상태 갱신
- React Flow `nodeTypes`, `edgeTypes` 연결
- 선택 상태 반영
- 노드/엣지 변경 이벤트 필터링
- 우클릭 context menu 관리
- copy/cut/paste를 clipboard store에 위임
- toolbar, branch selection modal, execution form modal, chatbot simulator 연결
- 실행 컨트롤을 `useBuilderExecution()`에 위임

중요한 흐름:

```tsx
const { displayNodes, displayEdges } = useMemo(
  () =>
    buildTopDownFlow({
      nodes,
      edges,
      startNode: layoutStartNode,
      nodeSizes,
      onOpenInsert,
    }),
  [edges, nodeSizes, nodes, onOpenInsert, layoutStartNode],
);
```

React Flow 렌더링:

```tsx
<ReactFlow
  nodes={selectedNodes}
  edges={displayEdges}
  nodeTypes={flowNodeTypes}
  edgeTypes={flowEdgeTypes}
  defaultEdgeOptions={defaultEdgeOptions}
/>
```

`handleNodesChange()`와 `handleEdgesChange()`는 화면 전용 add/start/end 노드가 store에 섞이지 않도록 실제 노드/엣지 ID만 필터링한다.

### 4.2 `components/BuildTopDownFlow.tsx`

레이아웃과 표시용 그래프 변환의 핵심 파일이다. 저장용 `nodes`, `edges`를 입력받아 React Flow에 전달할 `displayNodes`, `displayEdges`를 만든다.

주요 export:

- `START_NODE_ID`
- `START_ADD_NODE_ID`
- `END_NODE_ID`
- `panelBorder`
- `lineColor`
- `defaultEdgeOptions`
- `getTopLevelNodes(nodes)`
- `getStartNode(nodes, edges, startNodeId?)`
- `createWorkflowEdge({ source, target, sourceHandle })`
- `buildTopDownFlow(...)`

#### 저장용 edge 생성

`createWorkflowEdge()`는 `page.tsx`에서 노드를 추가할 때 사용한다.

역할:

- edge id 생성
- `source`, `target` 설정
- `sourceHandle` 정규화
- 기본 arrow marker와 stroke 스타일 부여
- 기본 `type: 'default'` 부여

#### 표시용 edge 생성

내부 helper:

- `createDisplayEdge()`: 일반 표시용 edge 생성
- `createEndDisplayEdge()`: 여러 terminal add node를 End로 합칠 때 `type: 'endMerge'`
- `createFanoutDisplayEdge()`: API fanout 곡선용 `type: 'fanoutCurve'`

#### 핸들 계산

`getBranchHandles(node)`는 노드별 출력 경로를 반환한다.

- `api`: `['onSuccess', 'onError']`
- `branch` + condition: condition/reply 기반 handle 목록 + `default`
- `branch` + button replies: reply value 기반 handle 목록
- 그 외: `['default']`

`getApiHandleRatio(handleId)`는 API node의 실제 source handle 위치와 add node 위치를 맞추기 위한 비율을 반환한다.

- `onSuccess`: `0.35`
- `onError`: `0.65`
- fallback: `0.5`

#### branch 레이아웃

`layoutBranch()`는 branch 노드를 독립적인 컨테이너처럼 다룬다.

역할:

- 조건/버튼 lane 수 계산
- lane별 width 계산
- branch node 전체 width/height 계산
- branch case panel 위치 계산
- branch 내부에 배치될 하위 노드를 `branchEmbeddedNodeIds`로 표시
- branch 내부 add node와 edge 생성
- branch 내부 selection group 크기 추정

branch 내부에 있는 일반 노드도 API처럼 여러 핸들을 가질 수 있으므로 `getBranchHandles(childNode)`를 기준으로 하위 add node를 생성한다.

#### group 레이아웃

`layoutGroup()`은 `selectionGroup` 내부의 자식 노드를 그룹 내부 좌표계로 배치한다.

역할:

- 그룹 자식 목록 수집
- 그룹 내부 edge만 필터링
- entry root 계산
- 하위 subtree width 측정
- 그룹 내부 add node 생성
- 접힘 상태일 때 collapsed height 적용
- branch 내부에 들어간 group은 별도 max width 제한 적용

#### top-level 레이아웃

top-level 노드는 depth 기반으로 배치된다. 각 노드는 `measure()`와 `place()` 흐름을 거쳐 subtree width와 depth가 계산된다.

API 노드는 success/error lane을 갖기 때문에 다음 depth와의 최소 간격을 별도로 확보한다.

#### synthetic nodes

`buildTopDownFlow()`는 저장 데이터에는 없는 화면 전용 노드를 추가한다.

- `start`: 시작 원형 노드
- `add`: 노드 사이 삽입 버튼
- `end`: 끝 원형 노드

이 노드들은 React Flow에 보이지만 store의 `nodes`에는 저장되지 않는다.

### 4.3 `components/FlowTypes.tsx`

React Flow의 `nodeTypes`, `edgeTypes` 매핑 파일이다.

내부 노드:

- `StartNode`: 시작 표시용 synthetic node
- `EndNode`: 종료 표시용 synthetic node
- `AddFlowNode`: `+` 버튼 synthetic node. 클릭 시 `data.onAdd(data.target)` 호출

edge renderer:

- `EndMergeEdge`: 여러 terminal add node가 하나의 End node로 모일 때 사용하는 custom SVG path
- `FanoutCurveEdge`: API fanout 연결용 custom SVG path
- `BranchFanoutCurveEdge`: branch fanout 곡선용 renderer. 현재 edge type 매핑에는 있으나 주요 생성 로직은 `fanoutCurve`와 `endMerge` 중심이다.

React Flow 매핑:

```ts
export const flowNodeTypes = {
  message: MessageNode,
  branch: BranchNode,
  api: ApiNode,
  form: FormNode,
  link: LinkNode,
  iframe: IframeNode,
  scenario: ScenarioNode,
  setSlot: SetSlotNode,
  selectionGroup: GroupNode,
  start: StartNode,
  end: EndNode,
  add: AddFlowNode,
};

export const flowEdgeTypes = {
  endMerge: EndMergeEdge,
  fanoutCurve: FanoutCurveEdge,
  branchFanoutCurve: BranchFanoutCurveEdge,
};
```

## 5. 노드 렌더링 모듈

### 5.1 `components/nodes/NodeWrapper.jsx`

대부분의 노드가 공유하는 wrapper다.

주요 기능:

- 공통 target/source handle 제공
- 공통 header 렌더링
- 시작 노드 지정 버튼
- anchor 지정 버튼
- 삭제 버튼
- 접힘/펼침 상태 관리
- 실행 중/실행 완료 badge 표시
- 노드 삭제 시 branch/group/scenario 하위 노드 삭제 범위 계산
- `flowCollapsed` store 값을 body 접힘 상태에 반영

노드별 차이는 `children`, `handles`, `headerButtons`, `customClassName`, `style`로 주입한다.

### 5.2 `components/nodes/ApiNode.jsx`

API node renderer다.

주요 기능:

- single API와 multi API 표시 분기
- single API일 때 method/url preview 표시
- multi API일 때 API call 이름 목록 표시
- header에 API test 버튼 표시
- `backendService.testApiCall(data)`로 테스트 호출
- success/error custom source handle 제공

핸들:

- `onSuccess`: bottom 35%, 녹색
- `onError`: bottom 65%, 빨간색

이 handle id가 저장용 edge의 `sourceHandle`에 들어가 success/error 경로를 구분한다.

### 5.3 `components/nodes/BranchNode.tsx`

condition branch renderer다.

주요 기능:

- `evaluationType === 'CONDITION'`이면 condition lane + default lane 생성
- button branch이면 replies 기반 lane 생성
- `BuildTopDownFlow.tsx`에서 계산한 `flowBranchWidth`, `flowBranchHeight`, case 위치 정보를 받아 branch 전체 박스와 case panel을 렌더링
- lane별 숨김 source handle 배치
- branch summary와 case list 표시

BranchNode는 `NodeWrapper`를 사용하지만 `collapseContentOnHeader={false}`로 body 자체는 wrapper 클릭에 의해 숨기지 않는다. 대신 `flowCollapsed`에 따라 summary만 숨기는 구조다.

### 5.4 `components/nodes/GroupNode.tsx`

`selectionGroup` renderer다.

주요 기능:

- 그룹 제목 표시
- 그룹 전체 크기를 `flowGroupWidth`, `flowGroupHeight`로 반영
- descendant 노드 전체 펼침/접힘 버튼 제공
- `NodeWrapper`를 이용해 공통 header, 삭제, 시작/anchor 지정 기능 사용

### 5.5 `components/nodes/FormNode.jsx`

form node renderer다.

주요 기능:

- form title 표시
- form element preview 렌더링
- 지원 element preview: `input`, `search`, `date`, `grid`, `checkbox`, `dropbox`
- `optionsSlot`, `displayKeys`, `hideNullColumns` 같은 grid/dropbox 보조 정보 표시
- `enableExcelUpload` 표시

실제 입력 실행은 이 파일이 아니라 실행 모달/시뮬레이터에서 처리한다.

### 5.6 `components/nodes/MessageNode.jsx`

message node renderer다.

주요 기능:

- message content를 read-only textarea로 표시
- `NodeWrapper` 공통 기능 사용

### 5.7 `components/nodes/LinkNode.jsx`

link node renderer다.

주요 기능:

- display text 표시
- URL/content 표시
- `NodeWrapper` 공통 기능 사용

### 5.8 `components/nodes/IframeNode.jsx`

iframe node renderer다.

주요 기능:

- URL 표시
- iframe preview 렌더링
- width/height data 기반 preview 크기 조정
- URL query value가 `{{...}}` template이면 preview에서 빈 값으로 치환해 URL 구조를 유지

### 5.9 `components/nodes/SetSlotNode.jsx`

slot assignment node renderer다.

주요 기능:

- `data.assignments` 목록을 `key = value` 형태로 표시
- assignment가 없으면 placeholder 표시
- `NodeWrapper` 공통 기능 사용

### 5.10 `components/nodes/ScenarioNode.jsx`

scenario group node renderer다. 이 파일은 다른 노드와 달리 `NodeWrapper`를 사용하지 않고 독립 렌더링한다.

주요 기능:

- scenario label 표시
- start node 지정
- scenario node 접힘/펼침
- 삭제
- target/source handle 직접 제공

### 5.11 `components/nodes/ChatNodes.module.css`

노드 UI 전용 CSS module이다.

담당 영역:

- 공통 node wrapper/header/body 스타일
- start/anchor 강조 스타일
- execution badge/spinner
- branch group/case panel 스타일
- group node 스타일
- form preview/input/grid 스타일
- API test button 스타일
- node 선택/hover 관련 전역 React Flow 스타일

## 6. 모달 모듈

### 6.1 `components/modals/ActivityPickerModal.tsx`

노드 추가 액티비티 선택 모달이다.

주요 기능:

- 추가 가능한 activity 목록 정의
- `hiddenTypes`로 권한/상황상 숨길 node type 제외
- 검색어 기반 필터링
- 최근 사용 타입 기반 목록 계산
- category browser 렌더링
- activity 선택 시 `onSelect(type)` 호출

지원 타입:

- `message`
- `setSlot`
- `branch`
- `form`
- `link`
- `api`
- `iframe`
- `scenario`
- `selectionGroup`

### 6.2 `components/modals/BranchSelectionModal.tsx`

실행 중 branch 선택이 필요할 때 뜨는 모달이다.

주요 기능:

- `builderExecutionStore.pendingBranchSelection` 기반 open/close
- replies를 버튼 목록으로 표시
- 선택 시 `onSelectReply(value)` 호출
- 취소 시 `onCancel()`

### 6.3 `components/modals/ExecutionFormInputModal.tsx`

캔버스 실행 모드에서 form node 입력이 필요할 때 뜨는 MUI Dialog다.

주요 기능:

- 실행 form element 렌더링
- input/date 기본 TextField
- checkbox/radio/dropbox/grid 지원
- `optionsSlot`이 있으면 slot value를 option source로 사용
- grid object array에서 `displayKeys`, `hideNullColumns` 처리
- 값 변경 시 `onUpdateValue`, `onUpdateCheckbox` 호출
- 제출 시 `onSubmit(values)` 호출

export:

- `getExecutionElementKey(element, index)`: 실행 form 값 key를 `name`, `id`, fallback 순서로 결정

## 7. Hook 모듈

### 7.1 `components/hooks/useFlowNodeSearch.ts`

캔버스 상단 검색 패널의 상태와 동작을 관리한다.

주요 기능:

- `searchType`, `searchKeyword` 상태 관리
- 노드 타입별 검색 텍스트 추출
- 검색 결과 필터링
- 검색 결과 클릭 시 해당 노드 선택
- parentNode가 있는 노드의 절대 좌표 계산
- React Flow `setCenter()`로 해당 노드 중심으로 viewport 이동

검색 대상 예:

- message: `data.content`
- form: `data.title`
- api: `data.url`, `data.apis[].name`
- branch: `data.replies[].display`
- link: `data.display`, `data.content`
- iframe: `data.url`
- setSlot: assignment key/value

### 7.2 `components/hooks/useExecutionFormInput.ts`

실행 중 form 입력 모달의 상태와 onChange API 연동을 관리한다.

주요 기능:

- `builderExecutionStore.pendingFormInput` 감시
- form elements와 values 초기화
- checkbox/value 업데이트
- `eventType === 'onChange'` element 변경 시 API 호출
- `optionalParameter`를 현재 form value와 slot으로 파싱
- API response를 target element options/data로 매핑
- target value가 새 options에 없으면 초기화

외부 의존:

- `apiClient`
- `parseOptionalParameter`
- `mapResponseToTargetElement`
- `getExecutionElementKey`

## 8. Toolbar와 Context Menu

### 8.1 `components/toolbar/FlowCanvasToolbar.tsx`

React Flow `Panel`에 붙는 상단 툴바다.

주요 기능:

- undo/redo 버튼
- save/push 버튼
- chatbot simulator toggle
- execution run/stop/current values 버튼
- search type select
- search input
- search result list
- 패널 접힘/펼침

버튼의 실제 동작은 대부분 `FlowCanvas.tsx`에서 props로 주입한다.

### 8.2 `components/context-menu/FlowContextMenu.tsx`

캔버스 우클릭 메뉴다.

pane 메뉴:

- paste
- add memo
- close

node 메뉴:

- copy node
- cut node
- paste
- delete node

실제 copy/cut/paste/delete는 `FlowCanvas.tsx`에서 store와 clipboard store에 위임한다.

### 8.3 `components/FlowCanvas.module.css`

캔버스 주변 UI 스타일을 담당한다.

담당 영역:

- toolbar/search panel
- search result card
- tool button active/disabled
- context menu
- legacy sidebar/controller 관련 스타일
- React Flow pane cursor 스타일

## 9. Slot Panel

### 9.1 `components/SlotPanel.tsx`

실행 중 current values 패널이다.

주요 기능:

- `useBuilderStore`의 `slots` 표시
- `selectedRow` 표시
- object/array/stringified JSON 값을 pretty JSON으로 렌더링
- 값이 없으면 placeholder 표시

### 9.2 `components/SlotPanel.module.css`

slot panel layout, key/value, pretty JSON, placeholder 스타일을 담당한다.

## 10. Chatbot Simulator 모듈

### 10.1 `components/modals/simulator/ChatbotSimulator.jsx`

시나리오를 대화형 UI로 실행해 보는 simulator container다.

주요 기능:

- `useChatFlow(nodes, edges)`로 실행 흐름 상태를 가져온다.
- start/restart 처리
- text input 처리
- branch/quick reply 선택 처리
- form 입력 상태 관리
- form submit 시 slots 갱신
- form element onChange API 호출
- search element API 호출
- grid row 선택 시 `selectedRow`를 slots에 저장
- fixed menu 표시
- expanded/collapsed modal panel 제어

주요 상태:

- `formData`: 현재 form 입력 값
- `formElementOverrides`: API 응답으로 동적으로 바뀐 form element 목록

주요 함수:

- `handleStartSimulation()`
- `handleTextInputSend(text)`
- `handleOptionClick(answer, sourceNodeId?)`
- `handleFormInputChange(elementOrName, value)`
- `handleFormMultiInputChange(elementOrName, value, checked)`
- `handleFormSubmit()`
- `handleGridRowClick(rowData)`
- `runFormElementApi(element, nextFormData)`
- `handleFormElementApiCall(clickedElement)`

### 10.2 `components/modals/simulator/MessageHistory.jsx`

시뮬레이터 history list renderer다.

주요 기능:

- `history` 배열을 순회하면서 `MessageRenderer`에 위임
- history 변경 시 scroll bottom 처리

### 10.3 `components/modals/simulator/MessageRenderer.jsx`

history item 하나를 실제 메시지 bubble/form/branch button/grid 등으로 렌더링한다.

주요 기능:

- bot streaming 메시지
- loading 메시지
- bot 단일 메시지
- bot combinedData 메시지
- user 메시지
- iframe 메시지
- link 메시지
- form 메시지
- branch button 메시지
- slotfilling quick reply 메시지
- grid row 클릭 처리
- `interpolateMessage()`로 slot template 치환

내부 `BotMessagePart`는 combinedData의 각 part를 렌더링하며, 마지막 part만 interactive 상태로 둔다.

### 10.4 `components/modals/simulator/SimulatorHeader.jsx`

시뮬레이터 header다.

주요 기능:

- 앱 아이콘과 제목 표시
- expand/collapse 버튼
- start 버튼
- close 버튼

### 10.5 `components/modals/simulator/UserInput.jsx`

텍스트 입력/quick reply 입력 컴포넌트다. 현재 `ChatbotSimulator.jsx`에서 렌더링이 주석 처리되어 있어 주요 simulator 입력 경로는 message/form renderer 중심이다.

주요 기능:

- text input
- Enter 전송
- attach button
- draggable quick reply list

### 10.6 `components/modals/simulator/ChatbotSimulator.module.css`

시뮬레이터 전용 CSS module이다.

담당 영역:

- modal overlay/panel
- expanded 상태
- simulator header
- fixed menu
- history 영역
- bot/user bubble
- form inputs/buttons/grid
- branch buttons
- iframe container

## 11. 아이콘 모듈

### `components/icons/Icons.jsx`

local SVG icon collection이다.

주요 아이콘:

- `AnchorIcon`
- `PlayIcon`
- `StartNodeIcon`
- `DelayNodeIcon`
- `ToastIcon`
- `IframeIcon`
- `ExpandIcon`
- `CollapseIcon`
- `AttachIcon`
- `SettingsIcon`
- `EditIcon`
- `CloneIcon`
- `DeleteIcon`
- `ExpandNodeIcon`
- `CollapseNodeIcon`
- `SetSlotIcon`

노드 header 버튼, simulator input, iframe/setSlot node 등에 사용된다.

## 12. 스타일 파일 요약

### `components/FlowCanvas.module.css`

캔버스 레벨 UI 스타일이다. toolbar/search panel/context menu/legacy layout 스타일을 포함한다.

### `components/nodes/ChatNodes.module.css`

노드 렌더링 전용 스타일이다. 공통 node wrapper, branch/group/form/API/실행 badge 스타일을 포함한다.

### `components/modals/simulator/ChatbotSimulator.module.css`

시뮬레이터 전용 스타일이다. modal, message bubble, form renderer, grid, button layout을 포함한다.

### `components/SlotPanel.module.css`

current values panel 전용 스타일이다.

## 13. 주요 extension point

### 새 노드 타입 추가

1. `ActivityPickerModal.tsx`의 `ActivityType`과 `activityList`에 타입을 추가한다.
2. `createNodeData()` 쪽에 초기 data 생성을 추가한다. 이 함수는 `scenario-orkes` 밖의 `src/app/builder/utils/nodeFactory`에 있다.
3. `components/nodes/` 아래에 node renderer를 만든다.
4. `FlowTypes.tsx`의 `flowNodeTypes`에 타입과 컴포넌트를 등록한다.
5. 필요하면 `useFlowNodeSearch.ts`에 검색 텍스트 추출 로직을 추가한다.
6. 실행/시뮬레이터가 필요하면 `useBuilderExecution`, `useChatFlow`, simulator renderer 쪽도 확장한다.

### 새 edge 모양 추가

1. `FlowTypes.tsx`에 custom edge renderer를 만든다.
2. `flowEdgeTypes`에 edge type을 등록한다.
3. `BuildTopDownFlow.tsx`에서 표시용 edge 생성 helper를 추가하거나 기존 helper에서 `type`을 새 값으로 지정한다.
4. 저장용 edge에 필요한 분기 정보가 있다면 `sourceHandle` 또는 edge data를 확장한다.

### branch/API 분기 수정

branch/API 분기 구조는 `BuildTopDownFlow.tsx`의 `getBranchHandles()`와 실제 노드 renderer의 React Flow `Handle id`가 서로 맞아야 한다.

예를 들어 API는 다음 두 값이 일치해야 한다.

- `ApiNode.jsx`: `Handle id="onSuccess"`, `Handle id="onError"`
- `BuildTopDownFlow.tsx`: `getBranchHandles(apiNode) => ['onSuccess', 'onError']`

값이 어긋나면 edge는 생성되어도 화면 연결이나 삽입 위치가 맞지 않는다.

## 14. 현재 구조에서 주의할 점

- store에 저장되는 `nodes`, `edges`와 React Flow에 표시되는 `displayNodes`, `displayEdges`는 다르다.
- `add`, `start`, `end` 노드는 synthetic display node이므로 저장 데이터로 취급하면 안 된다.
- API success/error 경로는 edge `type`이 아니라 `sourceHandle`로 구분한다.
- edge의 화면 모양은 주로 표시용 edge 생성 단계에서 결정된다.
- branch와 selectionGroup은 내부 좌표계와 parent/extent 처리가 있으므로 일반 top-level 노드와 다르게 레이아웃된다.
- `FlowCanvas.tsx`의 change handler는 실제 node/edge ID만 store에 전달하도록 필터링한다.
- 일부 파일에는 레거시 타입이나 주석, 깨진 한글 주석이 남아 있다. 동작 판단은 현재 실행 코드 기준으로 해야 한다.
