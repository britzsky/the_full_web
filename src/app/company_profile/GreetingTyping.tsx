"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// 한글 유니코드 초성 목록 (가나다 순)
const CHOSEONG = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
// 한글 유니코드 중성 목록
const JUNGSEONG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
// 한글 유니코드 종성 목록 (첫 번째는 종성 없음)
const JONGSEONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

// 문자열을 타이핑 프레임 배열로 변환 — 한글은 자모 단계별, 나머지는 글자 단위
function buildTypingFrames(text: string): string[] {
  const frames: string[] = [];
  let built = "";

  for (const char of text) {
    const code = char.charCodeAt(0);
    // 한글 음절 범위(0xAC00~0xD7A3) 여부 확인
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const cho = Math.floor(offset / (21 * 28));
      const jung = Math.floor((offset % (21 * 28)) / 28);
      const jong = offset % 28;

      // 1단계: 초성만
      frames.push(built + CHOSEONG[cho]);
      // 2단계: 초성 + 중성 (종성 없는 임시 글자)
      const partial = String.fromCharCode(0xac00 + cho * 21 * 28 + jung * 28);
      frames.push(built + partial);
      // 3단계: 초성 + 중성 + 종성 (종성 있을 때만)
      if (jong > 0) {
        frames.push(built + char);
      }
      built += char;
    } else {
      // 한글 외 문자는 글자 단위로 추가
      built += char;
      frames.push(built);
    }
  }

  return frames;
}

interface Props {
  greetingLine: string;   // 타이핑할 첫 번째 줄 ("안녕하십니까, ...")
  ceoLabel: string;       // CEO 텍스트
  signImageSrc: string;   // 서명 이미지 경로
  paragraphs: string[];   // 슬라이드업으로 나올 나머지 문단들
  charInterval?: number;  // 글자당 타이핑 간격 (ms)
  onComplete?: () => void; // 모든 애니메이션 완료 콜백
}

// 애니메이션 진행 단계
type Phase =
  | "initial-blink"    // 타이핑 전 커서 2번 깜빡임
  | "greeting-typing"  // 인사 문구 타이핑 중
  | "cursor-blink"     // 커서 2번 깜빡임
  | "paragraphs-in"    // 나머지 문단 슬라이드업
  | "sign-in"          // CEO 텍스트와 서명 이미지 등장
  | "done";            // 완료

export default function GreetingTyping({
  greetingLine,
  ceoLabel,
  signImageSrc,
  paragraphs,
  charInterval = 38,
  onComplete,
}: Props) {
  // 문단/서명 등장 간격
  const paragraphStaggerSeconds = 0.26;
  const paragraphStaggerMs = paragraphStaggerSeconds * 1000;
  const phaseWaitMs = 60;

  const [phase, setPhase] = useState<Phase>("initial-blink");
  const [displayedGreeting, setDisplayedGreeting] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 최초 마운트 시 프레임 배열 생성 (재계산 방지)
  const greetingFrames = useRef(buildTypingFrames(greetingLine));

  // 단계 0: 타이핑 전 커서 2번 깜빡임
  useEffect(() => {
    if (phase !== "initial-blink") return;
    let count = 0;
    let visible = false;
    const blink = () => {
      visible = !visible;
      setCursorVisible(visible);
      count++;
      // 2번 토글 = 1번 깜빡 (off→on→off)
      if (count < 2) {
        timerRef.current = setTimeout(blink, 380);
      } else {
        setCursorVisible(true);
        timerRef.current = setTimeout(() => setPhase("greeting-typing"), phaseWaitMs);
      }
    };
    blink();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  // 단계 1: 인사 문구 한 글자씩 타이핑
  useEffect(() => {
    if (phase !== "greeting-typing") return;
    const frames = greetingFrames.current;
    let idx = 0;
    const tick = () => {
      if (idx < frames.length) {
        setDisplayedGreeting(frames[idx]);
        idx++;
        timerRef.current = setTimeout(tick, charInterval);
      } else {
        setDisplayedGreeting(greetingLine);
        setPhase("cursor-blink");
      }
    };
    timerRef.current = setTimeout(tick, charInterval);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, greetingLine, charInterval]);

  // 단계 2: 커서 2번 깜빡임 후 다음 단계로
  useEffect(() => {
    if (phase !== "cursor-blink") return;
    let count = 0;
    let visible = true;
    const blink = () => {
      visible = !visible;
      setCursorVisible(visible);
      count++;
      // 2번 토글 = 1번 깜빡 (on→off 1세트)
      if (count < 2) {
        timerRef.current = setTimeout(blink, 200);
      } else {
        setCursorVisible(false);
        timerRef.current = setTimeout(() => setPhase("paragraphs-in"), phaseWaitMs);
      }
    };
    timerRef.current = setTimeout(blink, 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  // 단계 3: 전체 문단 전환 후 CEO 서명 등장
  useEffect(() => {
    if (phase !== "paragraphs-in") return;
    timerRef.current = setTimeout(() => setPhase("sign-in"), paragraphStaggerMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, paragraphStaggerMs]);

  // 단계 4: CEO 서명 전환 완료 후 onComplete 호출
  useEffect(() => {
    if (phase !== "sign-in") return;
    const lastDelay = 520;
    timerRef.current = setTimeout(() => {
      setPhase("done");
      onComplete?.();
    }, lastDelay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, onComplete]);

  const showCursor = phase === "initial-blink" || phase === "greeting-typing" || phase === "cursor-blink";
  const showParagraphs = phase === "paragraphs-in" || phase === "sign-in" || phase === "done";
  const showSign = phase === "sign-in" || phase === "done";

  return (
    <div className="company-greeting-copy">
      {/* 첫 번째 줄: 자모 단위 타이핑 애니메이션 */}
      <p className="company-greeting-paragraph company-greeting-paragraph--typing">
        {displayedGreeting}
        {showCursor && (
          <span
            className="greeting-typing-cursor"
            style={{ opacity: cursorVisible ? 1 : 0 }}
            aria-hidden="true"
          >|</span>
        )}
      </p>

      {/* 나머지 문단: 처음부터 공간 차지(레이아웃 고정), 투명 → 슬라이드업 */}
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          className={`company-greeting-paragraph greeting-slide-up${showParagraphs ? " greeting-slide-up--visible" : ""}`}
          style={{ transitionDelay: "0s" }}
        >
          {paragraph}
        </p>
      ))}

      {/* CEO 텍스트 + 서명 이미지: 문단 전체가 등장한 뒤 슬라이드업 */}
      <div
        className={`company-greeting-signature greeting-slide-up${showSign ? " greeting-slide-up--visible" : ""}`}
        style={{ transitionDelay: "0s" }}
      >
        {/* visibility로 공간 유지하면서 숨김 처리 */}
        <span className="company-greeting-signature-label" style={{ visibility: showSign ? "visible" : "hidden" }}>
          {ceoLabel}
        </span>
        <Image
          src={signImageSrc}
          alt="CEO 서명"
          width={180}
          height={64}
          quality={100}
          draggable={false}
          className={`company-greeting-signature-image greeting-sign-in${showSign ? " greeting-sign-in--visible" : ""}`}
        />
      </div>
    </div>
  );
}
