# 신경망 영어 음성 생성

현재 음성은 Kokoro-82M v1.0의 미국식 남성 `am_michael`이다. 브라우저에서는 기존 `<audio>` 재생을 유지한다. 오디오 생성만 Flite에서 신경망으로 바꾸므로 재생·정지·앱 음소거·속도 설정·학습 기록은 유지한다. 아이폰의 실제 무음 스위치 동작은 최종 기기 확인이 필요하다.

모델은 개발 환경에서만 사용한다. Vercel에서는 커밋한 MP3를 제공하며 추가 API 키나 음성 생성 서버가 필요 없다. 전체 생성 명령이 성공하기 전에는 현재 배포된 음성과 `speech-config.ts`를 바꾸지 않는다. 현재 학습 표현 1,059개의 신경망 음성을 생성해 커밋한다.

## 설치

Python 3.12, FFmpeg의 MP3 인코더, GitHub CLI가 필요하다. 패키지는 검증한 버전을 `requirements.txt`에 고정했다. 클라우드에서는 `pypi.org`, `files.pythonhosted.org`, `github.com`, `api.github.com`, `release-assets.githubusercontent.com` 접근을 환경 설정으로 허용한다. 기존 프록시와 TLS 검증을 유지한다.

```sh
python3 -m venv /tmp/fun-to-run-neural-venv
PIP_NO_INDEX=0 /tmp/fun-to-run-neural-venv/bin/python -m pip install \
  --index-url https://pypi.org/simple \
  -r scripts/neural-speech/requirements.txt
mkdir -p /tmp/fun-to-run-neural-model
gh release download model-files-v1.1 --repo thewh1teagle/kokoro-onnx \
  --pattern kokoro-v1.0.onnx --pattern voices-v1.0.bin \
  --dir /tmp/fun-to-run-neural-model
export KOKORO_PYTHON=/tmp/fun-to-run-neural-venv/bin/python
export KOKORO_MODEL_DIR=/tmp/fun-to-run-neural-model
```

합성 전 생성기가 공식 릴리스의 SHA-256으로 두 모델 파일을 검증한다. 품질 저하를 줄이기 위해 정수 양자화 대신 전체 정밀도 가중치를 사용한다. 모델과 가상환경은 Git에 커밋하지 않는다. `/tmp`가 초기화되면 다시 설치한다.

## 샘플과 전체 생성

```sh
npm run audio:generate -- --sample
```

단어·문장 여섯 개를 임시 폴더에 생성한다. 앱 음성은 변경하지 않는다. 출력된 폴더의 MP3와 한 단계 위 폴더의 `manifest.json`을 이용해 발음과 문장 끝부분을 확인한다. 샘플을 확인한 후 전체를 생성한다.

```sh
npm run audio:generate
npm run test:content
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test -- tests/ios-media.spec.ts
```

전체 생성기는 기존 학습 목록을 사용해 모든 파일을 별도로 합성하고, 비어 있거나 손상된 음성을 검사한 후 파일·색인·활성 음성 설정·출처 정보를 함께 갱신한다. 합성·검증에 실패하면 생성 중인 임시 파일만 지우고 기존 음성을 유지한다. 음성 버전을 포함한 새 파일명으로 이전 목소리의 캐시와 구분한다.

`npm run audio:generate`와 `npm run audio:generate:neural`은 같은 신경망 생성기를 실행한다. 음성을 바꿀 때는 `scripts/neural-speech/voice.json`의 버전 ID도 갱신한다. 새 음성을 배포하기 전에 콘텐츠·전체 학습·오류 처리·재생 속도 테스트를 실행한다. 콘텐츠 검사는 활성 음성 설정과 생성용 설정, 배포 메타데이터의 일치 여부와 1,059개 파일의 대응을 검사한다. 모델 누락·체크섬 오류로 생성이 중단될 때 기존 파일이 보존되는지도 별도 테스트한다.

## 라이선스와 원본

- Kokoro 모델: Apache-2.0, https://github.com/hexgrad/kokoro
- kokoro-onnx: MIT, https://github.com/thewh1teagle/kokoro-onnx
- 모델·보이스: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1
- 생성 도구는 두 프로젝트의 라이선스를 `public/speech/NOTICE.txt`에 포함한다.
