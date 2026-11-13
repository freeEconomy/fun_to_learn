# 아키텍처 페이지의 AI 구축 사례

`public/architecture.html` 하단의 세 사례는 실제 사이트에서 캡처한 정적 JPEG를 사용한다. 외부 사이트를 iframe이나 실시간 캡처 서비스로 호출하지 않는다. 화면이 바뀌면 이미지를 새로 캡처해 교체해야 한다.

2026-11-13에 공개 화면을 확인해 캡처했다. AI Agent는 로그인 전 화면이고, 로그인 후 기능은 사용자가 제공한 별도 시연 영상으로 보여 준다.

| 사례                      | 사이트                             | 이미지                               |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| AI Agent · Aura 일정 비서 | https://aiagent-xi-two.vercel.app/ | `public/case-studies/ai-agent.jpg`   |
| Fun To Run                | https://docuagent-xi.vercel.app/   | `public/case-studies/fun-to-run.jpg` |
| Stock AI · Stock Brief    | https://stock-ai-mocha.vercel.app/ | `public/case-studies/stock-ai.jpg`   |

## 시연 영상

사용자가 공개 재생용으로 제공한 `Codex로 구현한 주간보고 연동.mp4`를 `public/case-studies/ai-agent-demo.mp4`로 제공한다. H.264 영상은 재인코딩하지 않았고, 메타데이터·데이터 트랙을 제거하고 MP4의 인덱스를 앞으로 옮겨 스트리밍 시작을 빠르게 했다. 원본과 배포본의 영상 패킷 SHA-256은 `fcc015476537c5f9835ddcd1de2bab5f285abba24015db72e9587c0d715bcec0`로 동일하다.

- 길이: 약 191.23초, 1920×802, 원본에 오디오 트랙 없음
- 포스터: 같은 영상의 첫 화면에서 추출한 `ai-agent-demo-poster.jpg`
- 초기 페이지에서는 MP4의 `src`를 지정하지 않아 영상을 다운로드하지 않는다.
- ‘시연 영상 보기’를 눌렀을 때만 원본 파일을 지정하고, 기본 재생 컨트롤과 인라인 재생을 제공한다.
- 닫기·Escape·배경 클릭 시 정지하고 소스를 해제한다. 키보드 초점을 버튼으로 복귀시킨다.
- 로드 실패나 JavaScript 미사용 환경에서는 MP4 직접 링크로 재생할 수 있다.

사이트 이동 링크와 영상 링크는 별도 요소로 두어 중첩 링크를 만들지 않는다. 사이트 링크는 카드 영역 전체에서 작동하고, 영상 링크가 그 위에서 독립적으로 동작한다. 썸네일은 지연 로딩하며 세로 비율을 고정해 레이아웃 이동을 줄인다.

`tests/architecture.spec.ts`는 PC·모바일의 이미지 로딩·사이트 링크·영상 실제 재생/탐색·닫을 때 정지·오류 대안·MP4 범위 요청·JavaScript 미사용 환경을 검사한다.
