# Fun To Run — 생활 영어 놀이터

현재 홈 화면은 아이를 위한 영어 학습 앱입니다. 사진 단어·30편의 동화·9개 게임을 제공하며 학습 기록은 기기 브라우저의 localStorage에 저장합니다. 새 **영어 체스 클럽·영어 오목 탐험**의 규칙, 영어 미션과 검증 방법은 [영어 보드 게임 안내](docs/english-board-games.md)에 정리했습니다.

아래는 같은 저장소에 유지된 DocuMind 문서 에이전트 기능의 설정 안내입니다.

# DocuMind — 문서 에이전트

Next.js App Router + React + TypeScript + Tailwind 앱입니다. **Neon PostgreSQL에 계정·문서 정보·검색 청크·대화를, Vercel Private Blob에 원본 파일을 저장**합니다. 소스 배포와 데이터 보관이 분리되어 Vercel 재배포 후에도 같은 저장소의 데이터를 이용합니다. 새 DB에는 사용자·샘플 문서를 넣지 않습니다.

서비스 생성, 환경 변수 등록, 테이블 생성, 배포 순서는 [Neon + Blob 설정 안내](docs/neon-blob-setup.md)를 참고하세요. 코드만 배포하면 저장소가 자동 생성되지는 않습니다. 연결 전 로그인 화면에는 설정 안내가 표시됩니다.

## 실행

Node.js 22.13 이상을 사용합니다.

```bash
npm ci
cp .env.example .env.local
# .env.local에 DATABASE_URL, BLOB_READ_WRITE_TOKEN 등록
npm run db:migrate
npm run check:services
npm run build
npm start
```

개발은 `npm run dev`입니다. Vercel은 GitHub main 변경으로 자동 배포하며 프레임워크는 Next.js, 출력은 `.next`입니다. 빌드에는 DB 비밀값이 필요하지 않지만 실제 앱 사용에는 연결과 스키마 생성이 필요합니다. Docker 실행도 같은 외부 저장소를 이용합니다.

| 변수                    | 용도                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`          | Neon PostgreSQL 연결 문자열, 서버 전용                                  |
| `BLOB_READ_WRITE_TOKEN` | Private Blob 토큰, 서버 전용                                            |
| `APP_ORIGIN`            | 선택: 고정 사이트 origin. 프리뷰에서는 고정 운영 주소를 지정하지 마세요 |
| `NEON_HTTP_ENDPOINT`    | 선택: Codex 네트워크 시크릿 프록시 연결용 공개 Neon HTTPS `/sql` 주소   |
| `GEMINI_API_KEY`        | Google AI Studio Free tier 프로젝트의 API 키. OAuth 시크릿과 다릅니다.  |

회원가입 → 문서 업로드 → 텍스트 추출 → 질문 → 근거·원본 확인 순서로 사용합니다. 비밀번호는 scrypt 해시, 세션은 HttpOnly 쿠키와 토큰 해시로 관리하며 사용자별로 접근을 확인합니다. Gemini 임베딩의 코사인 유사도와 키워드 검색을 결합하고 선별한 근거로 짧은 AI 답변·원문 인용을 생성합니다. API 미연결 상태에서는 설정 안내를 반환합니다. 임베딩과 반복 답변을 재사용하고 사용자별·전체 일일 한도를 적용합니다. [Gemini 무료 계층 설정·데이터 이용 조건](docs/gemini-rag.md)을 먼저 확인하세요. OCR은 지원하지 않습니다.

PDF·DOCX·HWPX·TXT·MD를 최대 20MB까지 받습니다. 브라우저가 범위가 제한된 토큰으로 비공개 Blob에 직접 업로드하므로 원본을 Vercel 함수의 요청 본문으로 보내지 않습니다. 문서 분석은 최대 60초 함수에서 실행합니다. 스캔 문서나 복잡한 대용량 파일에는 향후 작업 큐가 필요할 수 있습니다.

## 검증

```bash
npm run typecheck
npm run test:backend
npm run build
npx playwright install --with-deps chromium
npm test
npm run format:check
python3 -m unittest discover -s tests -p 'test_stitch_*.py'
```

시스템 Chromium은 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`로 사용합니다. 백엔드·브라우저 테스트는 임시 PGlite PostgreSQL 엔진과 로컬 Blob 서비스 에뮬레이터에서 SQL·실제 SDK·인증·접근 분리·업로드·검색·대화·삭제를 검사합니다. 운영 DB와 파일은 사용하지 않으며 실제 Neon/Vercel 연결 검증은 별도 `check:services`와 배포 후 업로드로 수행해야 합니다.

## 구조

기존 Stitch 디자인과 반응형 레이아웃을 유지합니다. `/login`, `/signup`, `/chat`, `/documents`, `/documents/[id]`, `/admin`, `/settings`, `/reset-password`를 제공합니다. `/admin`은 본인 계정의 사용 통계이고 비밀번호 변경에는 현재 비밀번호가 필요합니다. 이메일 재설정은 제공하지 않습니다. Google Workspace SSO는 [설정 가이드](docs/google-workspace-sso.md)에 따라 OAuth 앱과 허용 도메인을 등록하면 활성화됩니다. 기존 이메일 계정은 로그인 후 설정에서 Google 계정을 연결합니다.

```text
migrations/001_neon.sql       빈 PostgreSQL 스키마
app/api/[...path]/route.ts    인증·문서·원본·검색·대화 API
lib/server/db.ts             Neon HTTP SQL 연결
lib/server/auth.ts           비밀번호·세션
lib/server/blob-store.ts     비공개 원본 접근
lib/server/documents.ts      업로드 확인·분석·삭제
lib/server/repository.ts     사용자별 PostgreSQL 쿼리
scripts/db-migrate.ts        스키마 적용
scripts/import-sqlite.ts     선택적 기존 SQLite 이관
```

기존 `data/`와 백업은 자동 변경·삭제하지 않습니다. 이관 방법은 설정 안내를 참고하세요. SQLite 운영 문서는 이전 버전의 참고 자료입니다.

Stitch 디자인 가져오기는 [Stitch 연결 안내](docs/stitch-connection.md)와 기존 `scripts/stitch-sync.py`를 사용합니다. Stitch 키는 앱 실행에 필요하지 않습니다.
