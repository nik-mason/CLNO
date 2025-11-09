# ClassNote 프로젝트 구현 계획서

이 문서는 `docs/FUNCTION.md`를 기반으로 ClassNote 프로젝트의 기술적 사양과 단계별 구현 계획을 상세히 정의합니다.

## 1. 프로젝트 개요

- **목표**: 초등학생과 선생님을 위한 학급 공지 및 숙제 관리 웹 애플리케이션 개발.
- **주요 기능**:
    - 다중 학교 지원
    - 사용자 역할 분리 (학생, 선생님)
    - 공지사항 및 숙제 게시 (선생님)
    - 공지사항 및 숙제 확인, 진행도 관리 (학생)
- **기본 색상**: 보라색 계열

## 2. 기술 스택

- **백엔드**: Python (Flask)
- **프론트엔드**: HTML, CSS, JavaScript (별도 라이브러리 없이 순수하게 구현)
- **데이터 저장소**: 기능별로 분리된 로컬 JSON 파일 (`data/*.json`)

## 3. 파일 구조

```
C:\Users\kkand\dev\classnote\
├── app.py              # Flask 백엔드 서버
├── data/
│   ├── announcements.json
│   ├── config.json
│   ├── daily_homework.json
│   ├── personal_homework.json
│   ├── progress.json
│   └── schools.json
├── assets/
│   ├── css/
│   │   └── style.css   # 전체 스타일 시트
│   └── js/
│       └── script.js   # 프론트엔드 로직 (페이지 전환, API 통신 등)
└── templates/
    └── index.html      # 모든 페이지의 템플릿 역할을 할 단일 HTML 파일
```

## 4. 데이터 구조 (`data/*.json`)

데이터베이스 역할을 할 JSON 파일들을 기능별로 분리하여 상세하게 설계합니다.

### `data/schools.json`
- 학교 정보를 ID와 함께 관리합니다.
```json
[
  { "id": 1, "name": "가나 초등학교" },
  { "id": 2, "name": "다라 초등학교" }
]
```

### `data/config.json`
- 전역 설정을 저장합니다.
```json
{
  "teacherPassword": "0505"
}
```

### `data/announcements.json`
- `schoolId`를 통해 어느 학교의 공지사항인지 식별합니다.
```json
[
  {
    "id": 1,
    "schoolId": 1,
    "grade": 3,
    "class": 5,
    "uploadDate": "2025-11-09",
    "title": "현장체험학습 안내",
    "content": "내일은 현장체험학습 가는 날입니다. 준비물을 잘 챙겨오세요."
  }
]
```

### `data/daily_homework.json`
- `schoolId`를 통해 어느 학교의 숙제인지 식별합니다.
```json
[
  {
    "id": 1,
    "schoolId": 1,
    "grade": 3,
    "class": 5,
    "uploadDate": "2025-11-09",
    "dueDate": "2025-11-10",
    "title": "11월 9일 숙제",
    "tasks": [
      { "id": 1, "content": "수학 익힘책 2쪽 풀기" },
      { "id": 2, "content": "일기 쓰기" }
    ]
  }
]
```

### `data/personal_homework.json`
- `schoolId`를 통해 어느 학교의 개인 숙제인지 식별합니다.
```json
[
  {
    "id": 1,
    "schoolId": 1,
    "grade": 3,
    "class": 5,
    "attendanceNumber": 10,
    "uploadDate": "2025-11-09",
    "dueDate": "2025-11-11",
    "title": "받아쓰기 연습 (김철수)",
    "tasks": [
      { "id": 1, "content": "1단원 받아쓰기 10번 연습하기" }
    ]
  }
]
```

### `data/progress.json`
- `schoolId-grade-class` 조합으로 학생들의 숙제 진행 상황을 저장합니다.
```json
{
  "1-3-5": {
    "daily": {
      "1": [10, 12]
    },
    "personal": {
      "1": [10]
    }
  }
}
```

## 5. API 엔드포인트 (`app.py`)

모든 API 요청에 `schoolId`를 포함하여 데이터를 명확히 구분합니다.

- `GET /api/schools`: 전체 학교 목록 조회
  - 응답: `schools.json` 파일 내용

- `POST /api/login/class`: 학급 로그인
  - 요청: `{ "schoolId": 1, "grade": 3, "class": 5, "password": "0503" }`
  - 응답: 성공 또는 실패 메시지

- `POST /api/login/teacher`: 선생님 로그인
  - 요청: `{ "password": "0505" }`
  - 응답: 성공 또는 실패 메시지

- `GET /api/announcements`: 공지사항 조회
  - 쿼리: `?schoolId=1&grade=3&class=5`
  - 응답: 해당 학급의 공지사항 목록

- `POST /api/announcements`: 공지사항 등록 (선생님 전용)
  - 요청: `{ "schoolId": 1, "grade": 3, "class": 5, "title": "...", "content": "..." }`
  - 응답: 성공 메시지

- `GET /api/homework/daily`: 오늘의 숙제 조회
  - 쿼리: `?schoolId=1&grade=3&class=5`
  - 응답: 해당 학급의 오늘의 숙제 목록

- `POST /api/homework/daily`: 오늘의 숙제 등록 (선생님 전용)
  - 요청: `{ "schoolId": 1, "grade": 3, "class": 5, "title": "...", "tasks": [...] }`
  - 응답: 성공 메시지

- `GET /api/homework/personal`: 개인 숙제 조회
  - 쿼리: `?schoolId=1&grade=3&class=5&attendanceNumber=10`
  - 응답: 해당 학생의 개인 숙제 목록

- `POST /api/homework/personal`: 개인 숙제 등록 (선생님 전용)
  - 요청: `{ "schoolId": 1, "grade": 3, "class": 5, "attendanceNumber": 10, "title": "...", "tasks": [...] }`
  - 응답: 성공 메시지

- `POST /api/homework/progress`: 숙제 진행상황 업데이트 (학생)
  - 요청: `{ "schoolId": 1, "grade": 3, "class": 5, "attendanceNumber": 10, "homeworkType": "daily", "taskId": 1 }`
  - 응답: 성공 메시지

## 6. 프론트엔드 구현 (`templates/`, `assets/`)

- **페이지 관리**: 각 기능에 맞춰 `login.html`, `main.html`, `teacher.html` 등 여러 HTML 파일로 분리하여 관리합니다. 이를 통해 페이지별 독립성을 높이고 유지보수를 용이하게 합니다.

- **반응형 디자인**: CSS 미디어 쿼리를 사용하여 데스크톱과 모바일 환경을 모두 지원하는 반응형 웹으로 구현합니다.

- **페이지 목록 (예시)**:
  - `intro.html`: 로고 애니메이션 및 초기 화면
  - `school_select.html`: 초등학교 선택
  - `login.html`: 학급 및 선생님 로그인
  - `student_main.html`: 학생용 메인 페이지 (공지, 숙제 목록)
  - `teacher_main.html`: 선생님용 메인 페이지 (공지/숙제 관리)
  - ... (기능에 따라 추가)

## 7. 구현 단계 (Roadmap)

1.  **1단계: 기본 환경 설정**
    - `app.py`에 기본 Flask 서버 코드 작성.
    - `data/` 폴더에 `schools.json`을 포함한 모든 JSON 파일들을 생성하고 초기 데이터 구조를 정의합니다.
    - `index.html`에 모든 페이지 `div` 뼈대 구성.
    - `script.js`에 페이지 전환 함수 `showPage()` 구현.

2.  **2단계: 핵심 로그인 기능 구현**
    - **백엔드**: `GET /api/schools` 및 학급/선생님 로그인 API 엔드포인트 구현.
    - **프론트엔드**: 학교 선택 페이지, 역할 선택, 로그인 페이지 UI 및 API 연동 로직 구현.

3.  **3단계: 학생 기능 구현**
    - **백엔드**: `schoolId`를 기준으로 데이터를 필터링하는 조회/업데이트 API 구현.
    - **프론트엔드**: 학생 메뉴 및 각 보기 페이지 UI 구현. API 연동하여 데이터 렌더링 및 숙제 체크 기능 구현.

4.  **4단계: 선생님 기능 구현**
    - **백엔드**: `schoolId`를 포함하여 데이터를 저장하는 등록 API 구현.
    - **프론트엔드**: 선생님 메뉴 및 각 등록 페이지 UI 구현. 폼 데이터 취합 및 API 연동 로직 구현.

5.  **5단계: 스타일링 및 고도화**
    - `style.css`를 사용하여 전체 디자인(보라색 테마, 폰트, 레이아웃) 적용.
    - 인트로 페이지 로고 애니메이션 구현.
    - 사용자 경험(UX) 개선 (로딩 인디케이터, 에러 메시지 처리 등).
