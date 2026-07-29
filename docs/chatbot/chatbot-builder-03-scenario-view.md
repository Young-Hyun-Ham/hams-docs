# CBB-03 시나리오 버전 조회 기능명세

## 1. 목적

선택 시나리오의 버전별 플로우와 배포 이력을 조회하고, 선택 버전을 편집 상태로 복원하거나 배포한다.

## 2. 초기화 및 버전 목록

- 목록 화면에서 선택한 시나리오를 Store에서 읽는다.
- `groupId`가 현재 시나리오와 같은 항목만 버전 목록으로 구성한다.
- `versions` 문자열에서 숫자만 추출해 오름차순 정렬한다.
- 버전 선택 시 해당 시나리오 상세를 조회해 nodes와 edges를 캔버스에 반영한다.
- 상단에는 선택 버전 ID를 표시하고 미선택 시 `scenario.ltst_ver_id`를 표시한다.

## 3. 화면 구성

| 영역 | 기능 |
|---|---|
| 상단 | Back, Deploy History |
| 좌측 | Version Tree |
| 중앙 | 선택 버전 React Flow 미리보기 및 버전 표시 |
| 중앙 상단 | Restored, Deploy |
| 우측 | 선택 노드 Controller |
| 우측 확장 | Chatbot Simulator |
| 모달 | 배포이력, 실행 로그, DB JSON, 분기 선택 |

## 4. 주요 기능

### Back

- Builder Store의 nodes를 비우고 `/builder/react-flow/scenario-list`로 이동한다.

### Deploy History

- 배포이력 목록 모달을 연다.
- 이력 선택 시 이력의 시나리오/버전 식별자로 버전 데이터를 조회해 캔버스에 표시한다.

### Restored

1. `Do you want to move to the scenario detail page?` 확인창을 표시한다.
2. 현재 선택 버전 또는 최신 버전 ID로 버전 상세를 조회한다.
3. 응답의 nodes, edges, start node를 Store에 설정한다.
4. 선택 버전 상태를 해제하고 플로우 편집 화면으로 이동한다.

즉, Restored는 서버 데이터를 즉시 덮어쓰는 복원 완료 기능이 아니라 선택 버전을 편집 화면으로 불러오는 동작이다.

### Deploy

1. `Do you want to deploy the selected version?` 확인창을 표시한다.
2. `snro_id`, 선택 버전 또는 최신 버전 `ver_id`, 빈 memo를 배포 API에 전달한다.
3. 선택 버전 상태를 초기화하고 시나리오 목록으로 이동한다.

## 5. 캔버스 조회 기능

- 지원 노드: Message, Branch, Slot Filling, API, Form, Fixed Menu, Link, LLM, Toast, iFrame, Scenario, Set Slot, Delay, Selection Group.
- 직교형 엣지, Controls, MiniMap, fitView, 휠/핀치 확대축소를 제공한다.
- Pan/Select 모드, 부분 선택, Shift 복수 선택을 지원한다.
- Simulator 표시 중 노드 드래그를 비활성화한다.
- 그룹이 접혀 있으면 하위 노드를 숨긴다.
- 우클릭 메뉴는 현재 구현상 pane/node/edge/selection 모두 Memo Panel 토글만 제공한다.
- Canvas Memo, Memo Pad, Runtime State, Simulator, 실행 로그 관련 상태가 편집 화면과 유사하게 포함되어 있다.

## 6. 조회 화면의 편집성 유의사항

화면명은 버전 조회이나 React Flow의 `onNodesChange`, `onEdgesChange`, `onConnect`, Delete 키, Drop, Node Controller가 연결되어 있어 클라이언트 상태 변경이 가능하다. 다만 화면에는 Save/Push 버튼이 없다. 따라서 QA에서는 다음을 구분한다.

- 화면 내 임시 이동/편집이 선택 버전 원본을 서버에 저장하지 않는지 확인한다.
- Restored 수행 시 화면에서 임시 변경한 상태가 아니라 버전 API를 다시 조회한 원본 상태가 편집 화면에 전달되는지 확인한다.
- 조회 전용이 제품 요구라면 노드 이동, 연결, 삭제, Controller 편집 기능을 비활성화할 필요가 있다.

## 7. 예외 및 QA 확인사항

- 시나리오 ID가 없으면 Deploy는 아무 동작도 하지 않는다.
- 배포 성공 여부를 별도 검사하지 않고 목록으로 이동하므로 API 실패 처리 확인이 필요하다.
- 버전 목록이 비어 있거나 `groupId`가 없는 기존 데이터의 표시 정책을 확인한다.
- `Restored` 문구는 완료형이지만 실제 의미는 “선택 버전으로 편집 시작”이므로 UX 문구 검토가 필요하다.
- 버전 조회 화면에는 편집 화면의 Y/N Branch node type이 등록되어 있지 않아 해당 노드가 포함된 버전 렌더링을 확인해야 한다.
- 실행/로그/DB JSON 모달 코드가 포함되어 있으나 화면에서 모든 진입 버튼이 노출되는지 확인해야 한다.

