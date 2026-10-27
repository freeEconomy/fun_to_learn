'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Home,
  BookOpen,
  MessageCircle,
  Check,
  Volume2,
  VolumeX,
  Search,
  ArrowRight,
  ArrowLeft,
  Lock,
  X,
  Palette,
  Star,
  RotateCcw,
  ClipboardList,
  Gamepad2,
  LibraryBig,
} from 'lucide-react';
import {
  words,
  categories,
  sentenceCount,
  findWord,
  makeQuiz,
  type Word,
} from '@/lib/forest/content';
import photoCredits from '@/lib/forest/photo-credits.json';
import { Photo } from './photo';
import {
  tales,
  gameModes,
  emptyAdventure,
  readAdventure,
  retiredTaleTitles,
  recordActivity,
  type AdventureProgress,
  type ActivityId,
} from '@/lib/forest/adventures';
import { speechAudioSource, canPlaySpeechAudio } from '@/lib/forest/speech-audio';
import { speechPlaybackRate, speechVoice } from '@/lib/forest/speech-config';
import { beginPlaybackSession } from '@/lib/forest/playback-session';
import { DiscoveryTrail } from './discovery-trail';
import {
  discoveryPlan,
  discoveryReviewIds,
  emptyDiscovery,
  finishDiscovery,
  learningDay,
  readDiscovery,
  type DiscoveryProgress,
} from '@/lib/forest/discovery';
import { AdventureHome } from './adventure-home';
import { StoryLibrary } from './adventures/stories';
import { GameArcade } from './adventures/games';
import './forest.css';
import './adventures/adventures.css';
import './adventure-home.css';
import './discovery.css';
type View =
  | 'discovery'
  | 'home'
  | 'word'
  | 'practice'
  | 'quiz'
  | 'result'
  | 'card'
  | 'parent'
  | 'stories'
  | 'games';
type LearningRecord = {
  word: string;
  date: string;
  firstTry: number;
  total: number;
  review: boolean;
};
type Profile = AdventureProgress & {
  audioVoice: string;
  discovery: DiscoveryProgress;
  name: string;
  color: string;
  symbol: string;
  level: number;
  rate: number;
  goal: number;
  leaves: number;
  selected: string;
  page: number;
  records: LearningRecord[];
};
const storageKey = 'wordforest-english-v1';
const colors = ['#dcebdc', '#e7e2f3', '#fae9cd'];
const symbols = ['📘', '🧭', '✏️', '🐶', '🐱', '🐰'];
const symbolLabels = [
  '책 표식',
  '나침반 표식',
  '연필 표식',
  '강아지 캐릭터',
  '고양이 캐릭터',
  '토끼 캐릭터',
];
const initial: Profile = {
  ...emptyAdventure,
  discovery: emptyDiscovery,
  name: '새싹',
  color: colors[0],
  symbol: '🐰',
  level: 1,
  rate: 0.85,
  audioVoice: speechVoice.id,
  goal: 10,
  leaves: 0,
  selected: 'bus',
  page: 0,
  records: [],
};
function readProfile(raw: unknown): Profile {
  if (!raw || typeof raw !== 'object') throw Error();
  const p = raw as Profile;
  if (
    typeof p.name !== 'string' ||
    p.name.length > 8 ||
    !colors.includes(p.color) ||
    !symbols.includes(p.symbol) ||
    ![0, 1, 2].includes(p.level) ||
    ![0.65, 0.85, 1].includes(p.rate) ||
    ![5, 10, 15, 20].includes(p.goal) ||
    !Number.isInteger(p.leaves) ||
    p.leaves < 0 ||
    !Array.isArray(p.records)
  )
    throw Error();
  const word = words.find((w) => w.id === p.selected) || words[0];
  return {
    ...p,
    ...readAdventure(p),
    audioVoice: speechVoice.id,
    rate: p.audioVoice === speechVoice.id ? p.rate : p.rate === 0.65 ? 0.65 : 0.85,
    discovery: readDiscovery(p.discovery),
    selected: word.id,
    page: Number.isInteger(p.page) && p.page >= 0 && p.page < word.story.pages.length ? p.page : 0,
    records: p.records
      .filter(
        (r) =>
          r &&
          words.some((w) => w.id === r.word) &&
          Number.isFinite(Date.parse(r.date)) &&
          r.total === 5 &&
          Number.isInteger(r.firstTry) &&
          r.firstTry >= 0 &&
          r.firstTry <= 5 &&
          typeof r.review === 'boolean',
      )
      .slice(-300),
  };
}
export function ForestApp() {
  const [profile, setProfile] = useState(initial),
    [ready, setReady] = useState(false),
    [view, setView] = useState<View>('home'),
    [notice, setNotice] = useState('');
  const [search, setSearch] = useState(''),
    [missing, setMissing] = useState(''),
    [category, setCategory] = useState('전체'),
    [translated, setTranslated] = useState(true),
    [alternate, setAlternate] = useState(false),
    [focus, setFocus] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [speaking, setSpeaking] = useState(false),
    [loadingAudio, setLoadingAudio] = useState(false),
    [sound, setSound] = useState(true);
  const [index, setIndex] = useState(0),
    [choice, setChoice] = useState(''),
    [wrong, setWrong] = useState(false),
    [hint, setHint] = useState(false),
    [exam, setExam] = useState(false),
    [answers, setAnswers] = useState<{ answer: string; first: boolean }[]>([]);
  const [gate, setGate] = useState(false),
    [gateNumbers, setGateNumbers] = useState([14, 8]),
    [gateAnswer, setGateAnswer] = useState(''),
    [gateError, setGateError] = useState(false),
    [confirm, setConfirm] = useState(false),
    [draft, setDraft] = useState(initial),
    [saved, setSaved] = useState(false);
  const finished = useRef(false),
    utteranceRef = useRef<SpeechSynthesisUtterance | null>(null),
    releasePlaybackRef = useRef<(() => void) | null>(null),
    mediaRef = useRef<HTMLAudioElement>(null),
    mediaRequestRef = useRef(0);
  const word = words.find((w) => w.id === profile.selected) || words[0],
    quiz = makeQuiz(word),
    question = quiz[index];
  const sentence = (alternate ? word.alternate : word.sentences)[profile.level],
    sentenceKorean = (alternate ? word.alternateTranslations : word.translations)[profile.level];
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setProfile(readProfile(JSON.parse(raw)));
      else {
        const old = JSON.parse(localStorage.getItem('wordforest-v1') || 'null');
        if (old)
          setProfile((p) => ({
            ...p,
            name: typeof old.name === 'string' ? old.name.slice(0, 8) : p.name,
            leaves: Number.isInteger(old.leaves) && old.leaves >= 0 ? old.leaves : 0,
          }));
      }
    } catch {
      setNotice('저장한 설정을 읽지 못했어요. 새 영어 학습을 시작할 수 있어요.');
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(storageKey, JSON.stringify(profile));
      } catch {
        setNotice('기기에 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.');
      }
  }, [profile, ready]);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const sync = () => setVoices(window.speechSynthesis.getVoices());
    sync();
    window.speechSynthesis.addEventListener('voiceschanged', sync);
    return () => {
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
      releasePlaybackRef.current?.();
      releasePlaybackRef.current = null;
      window.speechSynthesis.removeEventListener('voiceschanged', sync);
    };
  }, []);
  useEffect(() => {
    const media = mediaRef.current;
    return () => {
      mediaRequestRef.current++;
      media?.pause();
      releasePlaybackRef.current?.();
      releasePlaybackRef.current = null;
    };
  }, []);
  function stop() {
    mediaRequestRef.current++;
    const media = mediaRef.current;
    if (media) {
      media.pause();
      media.removeAttribute('src');
      media.load();
    }
    setLoadingAudio(false);
    utteranceRef.current = null;
    window.speechSynthesis?.cancel();
    releasePlaybackRef.current?.();
    releasePlaybackRef.current = null;
    setSpeaking(false);
  }
  useEffect(() => {
    stop();
    window.scrollTo({ top: 0 });
  }, [view, profile.selected, profile.page]);
  function speak(text: string) {
    if (!sound) {
      setNotice('소리가 꺼져 있어요. 위쪽 소리 버튼을 눌러 주세요.');
      return;
    }
    if (canPlaySpeechAudio(mediaRef.current)) {
      stop();
      const media = mediaRef.current;
      const source = speechAudioSource(text);
      if (!media || !source) {
        setNotice('이 음성 파일을 찾지 못했어요. 사이트를 새로고침해 주세요.');
        return;
      }
      const request = ++mediaRequestRef.current;
      const current = () => request === mediaRequestRef.current;
      const failed = () => {
        if (!current()) return;
        stop();
        setNotice(
          '음성 파일을 재생하지 못했어요. 연결과 미디어 음량을 확인하고 듣기를 다시 눌러 주세요.',
        );
      };
      releasePlaybackRef.current = beginPlaybackSession(navigator);
      media.onplaying = () => {
        if (current()) {
          setLoadingAudio(false);
          setSpeaking(true);
          setNotice((message) =>
            message.startsWith('음성 파일을 재생하지 못했어요.') ? '' : message,
          );
        }
      };
      media.onwaiting = () => {
        if (current()) {
          setLoadingAudio(true);
          setSpeaking(false);
        }
      };
      media.onpause = () => {
        if (current()) {
          setSpeaking(false);
          setLoadingAudio(false);
        }
      };
      media.onended = () => {
        if (current()) stop();
      };
      media.onerror = failed;
      media.src = source;
      media.muted = false;
      media.volume = 1;
      media.playbackRate = speechPlaybackRate(profile.rate);
      media.preservesPitch = true;
      setLoadingAudio(true);
      try {
        const pending = media.play();
        pending?.catch(failed);
      } catch {
        failed();
      }
      return;
    }
    const voice =
      voices.find((v) => v.lang === 'en-US') || voices.find((v) => /^en(?:-|_)/i.test(v.lang));
    if (!('speechSynthesis' in window) || !voice) {
      setNotice(
        '이 기기에 영어 읽기 목소리가 없어요. 기기 설정에서 영어 음성을 추가하거나 글로 학습해 주세요.',
      );
      return;
    }
    stop();
    releasePlaybackRef.current = beginPlaybackSession(navigator);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice.lang;
    u.voice = voice;
    u.rate = speechPlaybackRate(profile.rate);
    utteranceRef.current = u;
    u.onstart = () => {
      if (utteranceRef.current === u) setSpeaking(true);
    };
    u.onend = () => {
      if (utteranceRef.current === u) {
        utteranceRef.current = null;
        releasePlaybackRef.current?.();
        releasePlaybackRef.current = null;
        setSpeaking(false);
      }
    };
    u.onerror = () => {
      if (utteranceRef.current === u) {
        utteranceRef.current = null;
        releasePlaybackRef.current?.();
        releasePlaybackRef.current = null;
        setSpeaking(false);
        setNotice('영어 음성을 재생하지 못했어요. 다시 눌러 주세요.');
      }
    };
    try {
      window.speechSynthesis.speak(u);
    } catch {
      stop();
      setNotice('영어 음성을 재생하지 못했어요. 다시 눌러 주세요.');
    }
  }
  function startQuiz() {
    setIndex(0);
    setChoice('');
    setWrong(false);
    setHint(false);
    setAnswers([]);
    finished.current = false;
  }
  function go(next: View) {
    stop();
    setView(next);
    setMissing('');
    setSaved(false);
    if (next === 'quiz') startQuiz();
    if (next === 'card') setDraft(profile);
  }
  function select(w: Word) {
    stop();
    setProfile((p) => ({ ...p, selected: w.id, page: 0 }));
    setAlternate(false);
    setFocus('');
    setView('word');
    setMissing('');
    setSearch('');
  }
  function startDiscovery() {
    stop();
    setProfile((p) => ({
      ...p,
      discovery: {
        ...p.discovery,
        session: p.discovery.session || { ids: discoveryPlan(p.discovery, p.records), results: [] },
      },
    }));
    setView('discovery');
    window.scrollTo({ top: 0 });
  }
  function advanceDiscovery(id: string, first: boolean) {
    setProfile((p) => {
      const session = p.discovery.session;
      if (!session || session.ids[session.results.length] !== id) return p;
      const results = [...session.results, { id: session.ids[session.results.length], first }];
      return {
        ...p,
        discovery:
          results.length === 3
            ? finishDiscovery(p.discovery, results)
            : { ...p.discovery, session: { ...session, results } },
      };
    });
  }
  function searchWord(e: React.FormEvent) {
    e.preventDefault();
    const found = findWord(search);
    if (found) {
      select(found);
      setFocus(found.glossary.find((g) => g.term === search.trim().toLowerCase())?.term || '');
    } else
      setMissing(
        search.trim()
          ? '아직 준비하지 않은 낱말이에요. 아래 생활 영어를 골라 보세요.'
          : '영어 또는 우리말로 낱말을 입력해 주세요.',
      );
  }
  function nextQuestion() {
    if (!choice || (!exam && choice !== question.answer)) return;
    const next = [...answers, { answer: choice, first: !wrong && choice === question.answer }];
    setAnswers(next);
    if (index < quiz.length - 1) {
      setIndex((i) => i + 1);
      setChoice('');
      setWrong(false);
      setHint(false);
      return;
    }
    if (!finished.current) {
      finished.current = true;
      const firstTry = next.filter((a) => a.first).length;
      const date = new Date().toISOString();
      const day = (d: string) =>
        new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
      setProfile((p) => ({
        ...p,
        leaves:
          p.leaves +
          (p.records.some((r) => r.word === word.id && day(r.date) === day(date)) ? 0 : 10),
        records: [
          ...p.records,
          { word: word.id, date, firstTry, total: quiz.length, review: firstTry < quiz.length },
        ].slice(-300),
      }));
    }
    setView('result');
  }
  function openParent() {
    setGateNumbers([Math.floor(Math.random() * 9) + 11, Math.floor(Math.random() * 8) + 3]);
    setGateAnswer('');
    setGateError(false);
    setGate(true);
  }
  function completeAdventure(activityId: ActivityId, score: number) {
    const date = new Date().toISOString();
    const earned = recordActivity(profile, activityId, score, date).pointsEarned;
    setProfile((p) => {
      const result = recordActivity(p, activityId, score, date);
      return { ...p, ...result.progress, leaves: p.leaves + result.pointsEarned };
    });
    return earned;
  }
  const lastRecords = [...new Map(profile.records.map((r) => [r.word, r])).values()],
    reviews = discoveryReviewIds(profile.discovery, profile.records).map((word) => ({ word }));
  const discoveryWords = new Set([
    ...lastRecords.map((r) => r.word),
    ...Object.keys(profile.discovery.entries),
  ]);
  const recommended = discoveryPlan(profile.discovery, profile.records);
  const firstTryCount = answers.filter((answer) => answer.first).length;
  const quizScore = Math.round((firstTryCount / quiz.length) * 100);
  const nav = [
    { id: 'home', name: '홈', Icon: Home },
    { id: 'word', name: '사진 단어', Icon: BookOpen },
    { id: 'stories', name: '동화', Icon: LibraryBig },
    { id: 'games', name: '게임', Icon: Gamepad2 },
    { id: 'card', name: '학습카드', Icon: Palette },
  ] as const;
  const listen = (text: string, label = '영어 듣기') => (
    <button className="forest-button secondary" onClick={() => speak(text)}>
      <Volume2 size={18} />
      {label}
    </button>
  );
  return (
    <div className="forest-app english-app">
      <audio ref={mediaRef} data-learning-audio preload="none" aria-hidden="true" />
      <header className="forest-header">
        <button className="forest-brand" aria-label="Fun To Run 홈" onClick={() => go('home')}>
          <BookOpen />
          <span>
            Fun To Run <small>생활 영어</small>
          </span>
        </button>
        <div className="forest-header-tools">
          <button
            className="forest-icon"
            aria-label={sound ? '소리 끄기' : '소리 켜기'}
            onClick={() => {
              setSound(!sound);
              stop();
            }}
          >
            {sound ? <Volume2 /> : <VolumeX />}
          </button>
          <span className="forest-leaves" aria-label={`누적 포인트 ${profile.leaves}점`}>
            <Star size={17} />
            {profile.leaves} P
          </span>
          <button className="forest-parent-link" aria-label="부모님" onClick={openParent}>
            <Lock size={17} />
            <span>부모님</span>
          </button>
        </div>
      </header>
      {notice && (
        <div className="forest-notice" role="status">
          {notice}
          <button aria-label="안내 닫기" onClick={() => setNotice('')}>
            <X size={18} />
          </button>
        </div>
      )}
      <main className={`forest-main${view === 'home' ? ' explorer-home' : ''}`} aria-busy={!ready}>
        {['home', 'word', 'practice', 'quiz', 'result'].includes(view) && (
          <nav className="lesson-shortcuts" aria-label="생활 영어 빠른 연습">
            <span>내 말로 연습해요</span>
            <button onClick={() => go('practice')}>
              <MessageCircle size={16} />
              상황 영어
            </button>
            <button onClick={() => go('quiz')}>
              <ClipboardList size={16} />
              퀴즈
            </button>
          </nav>
        )}
        {view === 'home' && (
          <>
            <AdventureHome
              name={profile.name}
              symbol={profile.symbol}
              points={profile.leaves}
              learned={discoveryWords.size}
              wordCount={words.length}
              storyCount={tales.length}
              gameCount={gameModes.length}
              records={profile.records}
              activities={profile.activityRecords}
              discovery={profile.discovery}
              plan={recommended}
              onStart={startDiscovery}
              onWord={() => select(words.find((w) => w.id === 'soccer')!)}
              onStories={() => go('stories')}
              onGames={() => go('games')}
              onCard={() => go('card')}
            />
            <form className="forest-search" onSubmit={searchWord}>
              <Search />
              <input
                aria-label="단어 찾기"
                placeholder="dog, slide 또는 강아지, 미끄럼틀"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={40}
                list="english-words"
              />
              <button className="forest-button" type="submit">
                찾기 <ArrowRight size={18} />
              </button>
            </form>
            <datalist id="english-words">
              {words.map((w) => (
                <option key={w.id} value={w.name}>
                  {w.korean}
                </option>
              ))}
            </datalist>
            {missing && (
              <p className="forest-empty" role="status">
                {missing}
              </p>
            )}
            <div className="forest-quick">
              <span>바로 만나기</span>
              {['soccer', 'slide', 'apple', 'dog'].map((id) => {
                const w = words.find((w) => w.id === id)!;
                return (
                  <button key={id} onClick={() => select(w)} lang="en">
                    {w.name}
                  </button>
                );
              })}
            </div>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">TODAY'S MAGIC WORDS</span>
                <h2>오늘의 마법 같은 한마디</h2>
              </div>
            </div>
            <section className="english-today">
              <span lang="en">May I sit here?</span>
              <p>여기 앉아도 될까요?</p>
              <div className="forest-actions">
                {listen('May I sit here?')}
                <button
                  className="forest-button"
                  onClick={() => select(words.find((w) => w.id === 'chair')!)}
                >
                  chair 배우기 <ArrowRight size={18} />
                </button>
              </div>
            </section>
            <div className="forest-heading">
              <div>
                <h2>내 생활 속 영어</h2>
                <p>운동과 놀이, 맛있는 음식과 동물까지 함께 배워요.</p>
              </div>
              <span className="forest-muted">실제 사진 · 짧은 생활 문장</span>
            </div>
            <div className="forest-category-tabs">
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? 'selected' : ''}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c === '전체' ? '모두 보기' : c}
                </button>
              ))}
            </div>
            <div className="english-word-grid">
              {words
                .filter((w) => category === '전체' || w.category === category)
                .map((w) => (
                  <button className="english-word-card" key={w.id} onClick={() => select(w)}>
                    <Photo photoId={w.photoId} alt={`${w.korean} 실사 사진`} />
                    <div>
                      <strong lang="en">{w.name}</strong>
                      <span>{w.korean}</span>
                      <small>
                        {w.category}
                        {lastRecords.some((r) => r.word === w.id) && ' · 연습 완료 ✓'}
                      </small>
                    </div>
                  </button>
                ))}
            </div>
            <section className="forest-continue">
              <BookOpen />
              <div>
                <small>이어서 연습하기</small>
                <h3>{word.story.title}</h3>
                <p>
                  현재 {profile.page + 1} / {word.story.pages.length}장면
                </p>
              </div>
              <button className="forest-button secondary" onClick={() => go('practice')}>
                상황 영어 <ArrowRight size={18} />
              </button>
            </section>
          </>
        )}
        {view === 'word' && (
          <>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">LOOK · SAY · USE</span>
                <h1>사진으로 배우는 단어</h1>
              </div>
              <button className="forest-button secondary" onClick={() => go('home')}>
                <Search size={17} />
                다른 단어
              </button>
            </div>
            <section className="english-word-detail">
              <Photo
                key={word.photoId}
                photoId={word.photoId}
                alt={`${word.korean} 실사 사진`}
                credit
                priority
              />
              <div>
                <span className="forest-pill">{word.category}</span>
                <h2 lang="en">{word.name}</h2>
                <h3>{word.korean}</h3>
                <p>{word.meaning}</p>
                {listen(word.name, '단어 듣기')}
              </div>
            </section>
            <section className="english-glossary" aria-label="함께 쓰는 낱말">
              <div className="forest-heading">
                <h2>함께 쓰면 좋은 말</h2>
                <span className="forest-pill">뜻과 쓰임 넓히기</span>
              </div>
              {word.glossary.map((g) => (
                <button
                  key={g.term}
                  className={focus === g.term ? 'selected' : ''}
                  onClick={() => {
                    setFocus(g.term);
                    speak(g.term);
                  }}
                >
                  <strong lang="en">{g.term}</strong>
                  <span>{g.meaning}</span>
                  <Volume2 size={18} />
                </button>
              ))}
            </section>
            <div className="forest-heading">
              <h2>내 말로 써 보기</h2>
              <div className="forest-category-tabs">
                {['낱말 문장', '생활 문장', '부탁·질문'].map((l, i) => (
                  <button
                    key={l}
                    className={profile.level === i ? 'selected' : ''}
                    aria-pressed={profile.level === i}
                    onClick={() => setProfile((p) => ({ ...p, level: i }))}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <section className="forest-sentence">
              <span className="forest-pill">
                {
                  ['이름과 모습 말하기', '행동과 위치 말하기', '상대에게 정중하게 말하기'][
                    profile.level
                  ]
                }
              </span>
              <p lang="en">{sentence}</p>
              {translated && <p className="english-translation">{sentenceKorean}</p>}
              <div className="forest-actions">
                {listen(sentence, '문장 듣기')}
                <button
                  className="forest-button secondary"
                  onClick={() => {
                    stop();
                    setAlternate(!alternate);
                  }}
                >
                  다른 문장 <RotateCcw size={16} />
                </button>
                <button
                  className="forest-button secondary"
                  aria-pressed={translated}
                  onClick={() => setTranslated(!translated)}
                >
                  {translated ? '뜻 숨기기' : '뜻 보기'}
                </button>
                <button className="forest-icon" aria-label="읽기 정지" onClick={stop}>
                  <VolumeX />
                </button>
              </div>
            </section>
            <div className="forest-bottom-actions">
              <button className="forest-button secondary" onClick={() => go('quiz')}>
                단어 퀴즈
              </button>
              <button className="forest-button" onClick={() => go('practice')}>
                상황에서 써 보기 <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
        {view === 'discovery' && (
          <DiscoveryTrail
            session={profile.discovery.session}
            speak={speak}
            stop={stop}
            onAdvance={advanceDiscovery}
            days={profile.discovery.days.length}
            onHome={() => go('home')}
            onAgain={startDiscovery}
            onWord={(id) => select(words.find((w) => w.id === id)!)}
          />
        )}
        {view === 'stories' && (
          <StoryLibrary
            progress={profile}
            speak={speak}
            stop={stop}
            onBookmark={(id, page) =>
              setProfile((p) => ({ ...p, storyPages: { ...p.storyPages, [id]: page } }))
            }
            onComplete={completeAdventure}
            onWord={(id) => select(words.find((word) => word.id === id)!)}
          />
        )}
        {view === 'games' && (
          <GameArcade progress={profile} speak={speak} stop={stop} onComplete={completeAdventure} />
        )}
        {view === 'practice' && (
          <>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">ENGLISH IN REAL LIFE</span>
                <h1>{word.story.title}</h1>
              </div>
              <span className="forest-pill">
                {profile.page + 1} / {word.story.pages.length}장면
              </span>
            </div>
            <div
              className="forest-progress"
              role="progressbar"
              aria-label="상황 영어 진행"
              aria-valuenow={profile.page + 1}
              aria-valuemin={0}
              aria-valuemax={word.story.pages.length}
            >
              <span style={{ width: `${((profile.page + 1) / word.story.pages.length) * 100}%` }} />
            </div>
            <section className="english-practice">
              <Photo
                key={word.photoId}
                photoId={word.photoId}
                alt={`${word.korean} 실사 사진`}
                credit
                priority
              />
              <div className="english-practice-copy">
                <span className="forest-eyebrow">
                  {
                    [
                      '상황 만나기',
                      '준비하고 살펴보기',
                      '말 걸어 보기',
                      '상대의 말 듣기',
                      '내 말로 답하기',
                      '마무리하기',
                    ][profile.page]
                  }
                </span>
                <p lang="en">{word.story.pages[profile.page]}</p>
                {translated && (
                  <p className="english-translation">{word.story.translations[profile.page]}</p>
                )}
                <div className="forest-actions">
                  {listen(word.story.pages[profile.page], '이 장면 듣기')}
                  <button
                    className="forest-button secondary"
                    aria-pressed={translated}
                    onClick={() => setTranslated(!translated)}
                  >
                    {translated ? '뜻 숨기기' : '뜻 보기'}
                  </button>
                  <button className="forest-icon" aria-label="상황 읽기 정지" onClick={stop}>
                    <VolumeX />
                  </button>
                </div>
                <small>
                  사진은 낱말을 보여 주는 참고 사진이며, 장면마다 같은 참고 사진을 사용해요.
                </small>
              </div>
            </section>
            <div className="forest-story-navigation">
              <button
                className="forest-button secondary"
                disabled={profile.page === 0}
                onClick={() => setProfile((p) => ({ ...p, page: p.page - 1 }))}
              >
                <ArrowLeft size={17} />
                이전 장면
              </button>
              {profile.page < word.story.pages.length - 1 ? (
                <button
                  className="forest-button"
                  onClick={() => setProfile((p) => ({ ...p, page: p.page + 1 }))}
                >
                  다음 장면 <ArrowRight size={17} />
                </button>
              ) : (
                <button className="forest-button" onClick={() => go('quiz')}>
                  상황 퀴즈 풀기 <ArrowRight size={17} />
                </button>
              )}
            </div>
            <p className="forest-tip">
              한 문장을 듣고 직접 말해 보세요. 녹음하거나 외부로 음성을 보내지 않아요.
            </p>
          </>
        )}
        {view === 'quiz' && (
          <>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">LOOK · THINK · CHOOSE</span>
                <h1>{exam ? '생활 영어 복습' : '생활 영어 퀴즈'}</h1>
              </div>
              <span className="forest-pill">
                {index + 1} / {quiz.length}문제
              </span>
            </div>
            {index === 0 && (
              <div className="forest-category-tabs">
                <button
                  className={!exam ? 'selected' : ''}
                  onClick={() => {
                    setExam(false);
                    startQuiz();
                  }}
                >
                  연습 · 바로 확인
                </button>
                <button
                  className={exam ? 'selected' : ''}
                  onClick={() => {
                    setExam(true);
                    startQuiz();
                  }}
                >
                  복습 · 마지막에 확인
                </button>
              </div>
            )}
            <section className="forest-quiz-question">
              {question.photo && (
                <Photo
                  key={word.photoId}
                  photoId={word.photoId}
                  alt="문제의 단어를 보여 주는 사진"
                  priority
                />
              )}
              <span className="forest-pill">
                {['사진과 낱말', '문장 완성', '표현의 뜻', '대화 이해', '상황 순서'][index]}
              </span>
              <h2>{question.question}</h2>
              {question.sentence && (
                <p className="forest-blank" lang="en">
                  {question.sentence}
                </p>
              )}
            </section>
            <div className="forest-choices">
              {question.options.map((option) => (
                <button
                  key={option}
                  className={`forest-choice ${choice === option ? (exam ? 'chosen' : option === question.answer ? 'correct' : 'try-again') : ''}`}
                  aria-pressed={choice === option}
                  onClick={() => {
                    if (!exam && choice === question.answer) return;
                    setChoice(option);
                    if (!exam && option !== question.answer) setWrong(true);
                  }}
                >
                  <strong lang={/[가-힣]/.test(option) ? 'ko' : 'en'}>{option}</strong>
                  {choice === option && <Check />}
                </button>
              ))}
            </div>
            {!exam && (
              <>
                <button className="forest-hint" onClick={() => setHint(!hint)}>
                  {hint ? '힌트 접기' : '힌트 보기'}
                </button>
                {hint && <p className="forest-tip">{question.hint}</p>}
                {choice && (
                  <div
                    className={`forest-feedback ${choice === question.answer ? 'success' : ''}`}
                    role="status"
                  >
                    {choice === question.answer
                      ? `잘했어요! ${question.explanation}`
                      : '괜찮아요. 힌트를 보고 다시 생각해 봐요.'}
                  </div>
                )}
              </>
            )}
            <div className="forest-bottom-actions">
              <span className="forest-muted">시간 제한 없이 천천히 읽어요.</span>
              <button
                className="forest-button"
                disabled={!choice || (!exam && choice !== question.answer)}
                onClick={nextQuestion}
              >
                {index === quiz.length - 1 ? '학습 결과 보기' : '다음 문제'}
                <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
        {view === 'result' && (
          <section className="forest-result">
            <span className="forest-pill">EVERYDAY ENGLISH</span>
            <h1>{word.name}, 내 말로 한 걸음!</h1>
            <p>단어와 생활 속 표현을 함께 연습했어요.</p>
            <div className="forest-result-stats">
              <div>
                <strong>{quizScore}점</strong>
                <span>
                  퀴즈 점수 · 처음에 {firstTryCount} / {quiz.length}문제 정답
                </span>
              </div>
              <div>
                <strong>{profile.leaves} P</strong>
                <span>누적 포인트</span>
              </div>
            </div>
            <div
              className="run-score-stars"
              role="img"
              aria-label={`별 ${firstTryCount}개, 전체 ${quiz.length}개`}
            >
              {quiz.map((_, i) => (
                <Star key={i} className={i < firstTryCount ? 'earned' : ''} aria-hidden="true" />
              ))}
            </div>
            <p className="forest-muted">
              단어별 하루 첫 퀴즈를 마치면 10포인트를 받아요. 같은 날 같은 단어를 다시 풀어도 추가
              포인트는 쌓이지 않아요.
            </p>
            <div className="forest-review-list">
              {quiz.map((q, i) => (
                <div key={q.question}>
                  <Check size={18} />
                  <div>
                    <strong>{q.question}</strong>
                    <p>정답: {q.answer}</p>
                    <small>{q.explanation}</small>
                    {!answers[i]?.first && <p className="forest-muted">다시 읽고 익혀 보세요.</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="forest-actions">
              <button className="forest-button" onClick={startDiscovery}>
                사진으로 3단어 탐험하기 <ArrowRight size={17} />
              </button>
              <button className="forest-button secondary" onClick={() => go('home')}>
                모험 지도로 돌아가기
              </button>
              <button className="forest-button secondary" onClick={() => go('word')}>
                다시 연습하기
              </button>
              <button className="forest-button" onClick={() => go('card')}>
                학습카드 꾸미기 <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}
        {view === 'card' && (
          <>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">MY ENGLISH CARD</span>
                <h1>내 학습카드</h1>
                <p>
                  학습 친구와 색깔을 골라 나만의 카드를 만들어요. 포인트 없이 자유롭게 고를 수
                  있어요.
                </p>
              </div>
            </div>
            <div className="forest-customize">
              <section className="english-card-preview" style={{ background: draft.color }}>
                <span role="img" aria-label={symbolLabels[symbols.indexOf(draft.symbol)]}>
                  {draft.symbol}
                </span>
                <small>FUN TO RUN</small>
                <h2>{draft.name || '새싹'}</h2>
                <p>{discoveryWords.size} words practiced</p>
              </section>
              <section className="forest-customize-options">
                <label className="forest-field">
                  이름 또는 별명
                  <input
                    maxLength={8}
                    value={draft.name}
                    onChange={(e) => {
                      setDraft((d) => ({ ...d, name: e.target.value }));
                      setSaved(false);
                    }}
                  />
                </label>
                <h3>카드 색깔</h3>
                <div className="forest-option-row">
                  {colors.map((color, i) => (
                    <button
                      key={color}
                      className={`forest-swatch ${draft.color === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      aria-label={['세이지', '라벤더', '샌드'][i]}
                      aria-pressed={draft.color === color}
                      onClick={() => {
                        setDraft((d) => ({ ...d, color }));
                        setSaved(false);
                      }}
                    >
                      {draft.color === color && <Check />}
                    </button>
                  ))}
                </div>
                <h3>학습 친구와 카드 표식</h3>
                <div className="forest-option-row">
                  {symbols.map((symbol, i) => (
                    <button
                      key={symbol}
                      className={draft.symbol === symbol ? 'selected' : ''}
                      aria-label={symbolLabels[i]}
                      aria-pressed={draft.symbol === symbol}
                      onClick={() => {
                        setDraft((d) => ({ ...d, symbol }));
                        setSaved(false);
                      }}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
                <button
                  className="forest-button"
                  onClick={() => {
                    setProfile((p) => ({
                      ...p,
                      name: draft.name.trim() || '새싹',
                      color: draft.color,
                      symbol: draft.symbol,
                    }));
                    setSaved(true);
                  }}
                >
                  학습카드 저장 <Check size={17} />
                </button>
                {saved && (
                  <p className="forest-feedback success" role="status">
                    학습카드를 저장했어요.
                  </p>
                )}
              </section>
            </div>
          </>
        )}
        {view === 'parent' && (
          <>
            <div className="forest-heading">
              <h1>부모님 학습실</h1>
              <button className="forest-button secondary" onClick={() => go('home')}>
                아이 화면으로
              </button>
            </div>
            <p className="forest-tip">
              영어 학습 기록은 현재 브라우저에만 저장됩니다. 이전 한글 학습 기록은 별도 보관하며
              덮어쓰지 않습니다. 기기 간 동기화는 지원하지 않습니다. 부모 확인 문제는 보안 인증이
              아닙니다.
            </p>
            <div className="forest-parent-stats">
              <section>
                <strong>{discoveryWords.size}</strong>
                <span>발견한 사진 단어</span>
              </section>
              <section>
                <strong>{reviews.length}</strong>
                <span>복습 추천</span>
              </section>
              <section>
                <strong>{profile.leaves}</strong>
                <span>누적 포인트</span>
              </section>
            </div>
            <section className="forest-panel">
              <h2>읽기와 듣기 설정</h2>
              <div className="forest-settings-grid">
                <label className="forest-field">
                  문장 단계
                  <select
                    value={profile.level}
                    onChange={(e) => setProfile((p) => ({ ...p, level: Number(e.target.value) }))}
                  >
                    {['낱말 문장', '생활 문장', '부탁·질문'].map((l, i) => (
                      <option value={i} key={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="forest-field">
                  영어 읽기 속도
                  <select
                    value={profile.rate}
                    onChange={(e) => setProfile((p) => ({ ...p, rate: Number(e.target.value) }))}
                  >
                    <option value={0.65}>천천히</option>
                    <option value={0.85}>기본 · 원래 속도</option>
                    <option value={1}>조금 빠르게</option>
                  </select>
                </label>
                <label className="forest-field">
                  하루 학습 목표
                  <select
                    value={profile.goal}
                    onChange={(e) => setProfile((p) => ({ ...p, goal: Number(e.target.value) }))}
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n}분
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="forest-muted">
                목표는 참고용입니다. 자동 시간 측정이나 강제 제한 기능은 없습니다. 설정은 자동
                저장됩니다.
              </p>
              {listen('Hello. May I sit here, please?', '영어 음성 확인')}
              <p className="forest-muted">
                미국식 남성 영어 음성 파일을 재생합니다. 기본 설정은 원래 속도예요. 무음 모드에서도
                미디어 음량을 올리고 듣기를 눌러 주세요.
              </p>
            </section>
            <section className="forest-panel">
              <h2>다시 연습할 단어</h2>
              <div className="forest-option-row">
                {reviews.length ? (
                  reviews.map((r) => {
                    const w = words.find((w) => w.id === r.word)!;
                    return (
                      <button key={w.id} onClick={() => select(w)}>
                        {w.name} · {w.korean}
                      </button>
                    );
                  })
                ) : (
                  <p className="forest-muted">
                    3단어 탐험이나 퀴즈를 풀면 다시 만날 단어를 추천해요.
                  </p>
                )}
              </div>
            </section>
            <section className="forest-panel">
              <h2>최근 영어 학습</h2>
              {profile.records.length ? (
                <ul className="forest-records">
                  {profile.records
                    .slice(-10)
                    .reverse()
                    .map((r, i) => (
                      <li key={r.date + i}>
                        <strong>{words.find((w) => w.id === r.word)?.name}</strong>
                        <span>
                          {r.firstTry}/{r.total} · {r.review ? '복습 추천' : '잘 익혔어요'}
                        </span>
                        <time>
                          {new Date(r.date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                        </time>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="forest-muted">아직 학습 기록이 없어요.</p>
              )}
            </section>
            <section className="forest-panel">
              <h2>3단어 탐험 기록</h2>
              <p>
                발견한 단어 {Object.keys(profile.discovery.entries).length}개 · 완료한 날{' '}
                {profile.discovery.days.length}일
              </p>
              <p>
                다시 만날 단어:{' '}
                {Object.entries(profile.discovery.entries)
                  .filter(
                    ([, entry]) =>
                      entry.needsReview ||
                      learningDay(entry.due) <= learningDay(new Date().toISOString()),
                  )
                  .map(([id]) => words.find((w) => w.id === id)!.name)
                  .join(', ') || '아직 없어요'}
              </p>
              <small>
                탐험의 정답과 오답 기록으로 복습을 추천합니다. 말하기 버튼은 아이의 자기 확인이며
                발음 평가 결과가 아닙니다.
              </small>
            </section>
            <section className="forest-panel">
              <h2>동화와 게임 기록</h2>
              {profile.activityRecords.length ? (
                <ul className="adventure-history">
                  {profile.activityRecords
                    .slice(-6)
                    .reverse()
                    .map((record) => {
                      const story = tales.find((tale) => `story:${tale.id}` === record.activityId);
                      const retiredTitle = record.activityId.startsWith('story:')
                        ? retiredTaleTitles[record.activityId.slice(6)]
                        : undefined;
                      const game = gameModes.find(
                        (mode) => `game:${mode.id}` === record.activityId,
                      );
                      return (
                        <li key={`${record.activityId}-${record.date}`}>
                          <strong>{story?.title || retiredTitle || game?.title}</strong>
                          <span>{story || retiredTitle ? '읽기 완료' : `${record.score}점`}</span>
                          <time>
                            {new Date(record.date).toLocaleDateString('ko-KR', {
                              timeZone: 'Asia/Seoul',
                            })}
                          </time>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="forest-muted">아직 동화·게임 기록이 없어요.</p>
              )}
            </section>
            <section className="forest-panel">
              <h2>사진 출처와 이용 조건</h2>
              <p>
                촬영자가 CC0로 공개한 사진만 사용합니다. 사진별 원문과 이용 조건을 확인할 수 있어요.
                사진 속 상표와 물건은 학습을 위한 예시이며 광고가 아닙니다.
              </p>
              <ul className="english-credits">
                {photoCredits.map((c) => (
                  <li key={c.id}>
                    <a href={c.source} target="_blank" rel="noreferrer">
                      {c.id} · {c.author}
                    </a>
                    <a href={c.licenseUrl} target="_blank" rel="noreferrer">
                      CC0 1.0
                    </a>
                  </li>
                ))}
              </ul>
              <p className="forest-muted">
                크기 조절·압축 외 합성이나 AI 이미지 생성을 하지 않았습니다.
              </p>
            </section>
            <section className="forest-panel">
              <h2>영어 기록 관리</h2>
              <p>영어 프로필과 기록만 삭제하며 이전 한글 기록은 유지합니다.</p>
              <button className="forest-button danger" onClick={() => setConfirm(true)}>
                영어 프로필과 기록 삭제
              </button>
            </section>
          </>
        )}
        {(speaking || loadingAudio) && (
          <p className="english-speaking" role="status">
            {loadingAudio ? '음성을 준비하고 있어요.' : '영어를 읽고 있어요.'}
            <button aria-label="영어 읽기 멈춤" onClick={stop}>
              <VolumeX size={17} />
            </button>
          </p>
        )}
        <footer className="forest-footer">
          Fun To Run · 실제 사진으로 시작하는 나의 생활 영어
          <br />
          <small>
            사진 단어 {words.length}개 · 영어 예문 {sentenceCount}개 · CC0 실사 사진
          </small>
          <br />
          <small>
            명작 동화 {tales.length}편 · 미니게임 {gameModes.length}종
          </small>
        </footer>
      </main>
      <nav className="forest-nav" aria-label="학습 메뉴">
        {nav.map(({ id, name, Icon }) => (
          <button
            key={id}
            aria-current={
              view === id || (id === 'word' && ['practice', 'quiz', 'result'].includes(view))
                ? 'page'
                : undefined
            }
            className={
              view === id || (id === 'word' && ['practice', 'quiz', 'result'].includes(view))
                ? 'active'
                : ''
            }
            onClick={() => go(id)}
          >
            <Icon size={22} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      {gate && (
        <div className="forest-overlay">
          <section
            className="forest-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="english-gate-title"
          >
            <button
              className="forest-close"
              aria-label="부모 확인 닫기"
              onClick={() => setGate(false)}
            >
              <X />
            </button>
            <h2 id="english-gate-title">부모님과 함께 열어 주세요</h2>
            <p>보호자께서 아래 문제를 풀어 주세요.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (gateAnswer.trim() && Number(gateAnswer) === gateNumbers[0] + gateNumbers[1]) {
                  setGate(false);
                  go('parent');
                } else setGateError(true);
              }}
            >
              <label className="forest-field">
                {gateNumbers[0]} + {gateNumbers[1]} = ?
                <input
                  autoFocus
                  aria-label="부모 확인 답"
                  inputMode="numeric"
                  value={gateAnswer}
                  onChange={(e) => setGateAnswer(e.target.value)}
                />
              </label>
              {gateError && <p role="alert">답을 다시 확인해 주세요.</p>}
              <button className="forest-button" type="submit">
                부모님 학습실 열기
              </button>
            </form>
          </section>
        </div>
      )}
      {confirm && (
        <div className="forest-overlay">
          <section
            className="forest-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="english-delete-title"
          >
            <h2 id="english-delete-title">영어 기록을 삭제할까요?</h2>
            <p>
              영어 프로필, 학습 기록과 포인트는 되돌릴 수 없습니다. 이전 한글 기록은 그대로
              남습니다.
            </p>
            <div className="forest-actions">
              <button className="forest-button secondary" onClick={() => setConfirm(false)}>
                취소
              </button>
              <button
                className="forest-button danger"
                onClick={() => {
                  try {
                    localStorage.setItem(storageKey, JSON.stringify(initial));
                  } catch {}
                  setProfile(initial);
                  setConfirm(false);
                  go('home');
                  setNotice('영어 프로필과 학습 기록을 초기화했어요.');
                }}
              >
                영어 기록 삭제
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
