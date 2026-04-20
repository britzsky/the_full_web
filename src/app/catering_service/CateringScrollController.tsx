"use client";

import { useEffect } from "react";

// 급식서비스 화면: 전체 화면 섹션 스크롤 보조 컴포넌트 전달값
type CateringScrollControllerProps = {
  containerId: string;
  sectionSelector: string;
};

// 급식서비스 화면: 섹션 단위 부드러운 스크롤 + 각 섹션 진입 애니메이션 보조 로직
export default function CateringScrollController({
  containerId,
  sectionSelector,
}: CateringScrollControllerProps) {
  useEffect(() => {
    // 스크롤 대상 컨테이너 요소
    const containerElement = document.getElementById(containerId);

    if (!(containerElement instanceof HTMLElement)) {
      return;
    }

    // 접근성 모션 감소 설정 쿼리 (매칭 시 애니메이션 전체 스킵)
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotionQuery.matches) {
      return;
    }

    // 섹션 선택자에 해당하는 전체 섹션 요소 배열
    const sectionElements = Array.from(
      containerElement.querySelectorAll<HTMLElement>(sectionSelector)
    );

    if (sectionElements.length === 0) {
      return;
    }

    // 현재 진행 중인 requestAnimationFrame ID
    let animationFrameId = 0;
    // 섹션 이동 애니메이션 진행 중 여부 플래그
    let isAnimating = false;
    // 트랙패드 휠 입력 누적값 (임계값 초과 시 섹션 이동 트리거)
    let accumulatedWheelDelta = 0;
    // 휠 입력 없을 시 누적값 초기화용 타이머 ID
    let wheelResetTimeoutId = 0;
    // 이전 스크롤 위치 (스크롤 이벤트 기반 방향 감지용)
    let lastScrollTop = containerElement.scrollTop;
    // 스크롤 방향 객체 (원시값은 클로저 내 갱신 불가로 객체 참조 사용)
    const scrollDirection = { down: true };

    // 휠 외에도 스크롤 위치 변화로 방향을 보조 감지한다 (observer 발동 타이밍 보정)
    const handleScroll = () => {
      const currentScrollTop = containerElement.scrollTop;
      if (currentScrollTop !== lastScrollTop) {
        scrollDirection.down = currentScrollTop > lastScrollTop;
        lastScrollTop = currentScrollTop;
      }
    };
    containerElement.addEventListener("scroll", handleScroll, { passive: true });

    // 현재 스크롤 위치 기준 가장 가까운 섹션 인덱스 계산
    const getClosestSectionIndex = () => {
      const currentScrollTop = containerElement.scrollTop;

      return sectionElements.reduce((closestIndex, sectionElement, sectionIndex) => {
        const currentDistance = Math.abs(sectionElement.offsetTop - currentScrollTop);
        const closestDistance = Math.abs(sectionElements[closestIndex].offsetTop - currentScrollTop);

        return currentDistance < closestDistance ? sectionIndex : closestIndex;
      }, 0);
    };

    // 대상 섹션까지의 ease-in-out cubic 기반 커스텀 스크롤 애니메이션
    const animateToSection = (targetScrollTop: number) => {
      const startScrollTop = containerElement.scrollTop;
      const scrollDistance = targetScrollTop - startScrollTop;

      if (scrollDistance === 0) {
        return;
      }

      // 섹션 이동 총 소요 시간 (ms)
      const animationDuration = 560;
      const animationStartTime = performance.now();
      isAnimating = true;

      const step = (currentTime: number) => {
        const elapsedTime = currentTime - animationStartTime;
        const progress = Math.min(elapsedTime / animationDuration, 1);
        // ease-in-out cubic 곡선 (시작/끝 부드러운 감속)
        const easedProgress =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        containerElement.scrollTop = startScrollTop + scrollDistance * easedProgress;

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
          return;
        }

        // 애니메이션 완료 후 정확한 위치 고정 및 잠금 해제
        containerElement.scrollTop = targetScrollTop;
        isAnimating = false;
      };

      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(step);
    };

    // 휠 이벤트 핸들러 (트랙패드 소량 입력 누적 후 섹션 단위 이동 처리)
    const handleWheel = (event: WheelEvent) => {
      // 핀치 줌 (ctrlKey) 미차단
      if (event.ctrlKey) {
        return;
      }

      // 횡스크롤 등 노이즈성 소량 입력 무시
      if (Math.abs(event.deltaY) < 2) {
        return;
      }

      // 브라우저 기본 스크롤 차단 후 직접 제어
      event.preventDefault();

      // 섹션 이동 애니메이션 중 추가 입력 무시
      if (isAnimating) {
        return;
      }

      accumulatedWheelDelta += event.deltaY;
      // 110ms 내 추가 입력 없을 시 누적값 초기화 (트랙패드 관성 방지)
      window.clearTimeout(wheelResetTimeoutId);
      wheelResetTimeoutId = window.setTimeout(() => {
        accumulatedWheelDelta = 0;
      }, 110);

      // 누적값이 임계값(36) 미만이면 이동 보류
      if (Math.abs(accumulatedWheelDelta) < 36) {
        return;
      }

      const currentSectionIndex = getClosestSectionIndex();
      // 누적 방향 기준 다음/이전 섹션 인덱스 (범위 클램프 포함)
      const nextSectionIndex = Math.min(
        Math.max(currentSectionIndex + (accumulatedWheelDelta > 0 ? 1 : -1), 0),
        sectionElements.length - 1
      );

      // IntersectionObserver 콜백 참조용 스크롤 방향 저장
      scrollDirection.down = accumulatedWheelDelta > 0;
      accumulatedWheelDelta = 0;

      // 현재 섹션과 동일하면 이동 없음
      if (nextSectionIndex === currentSectionIndex) {
        return;
      }

      lastScrollTop = containerElement.scrollTop;
      animateToSection(sectionElements[nextSectionIndex].offsetTop);
    };

    containerElement.addEventListener("wheel", handleWheel, { passive: false });

    // 2번 섹션: 이미지/텍스트 개별 순차 진입 애니메이션
    const stagePanels = Array.from(
      containerElement.querySelectorAll<HTMLElement>("#catering_stage .catering_stage_panel")
    );

    // 초기 이미지/텍스트 숨김 상태 설정
    stagePanels.forEach((panel) => {
      panel.querySelector<HTMLElement>(".catering_stage_image_wrap")?.classList.add("catering_stage_wrap_hidden");
      panel.querySelector<HTMLElement>(".catering_stage_text")?.classList.add("catering_stage_text_hidden");
    });

    const stageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // 위로 스크롤 이탈 시 리셋 없음 (아래로 내려올 때만 리셋)
            if (!scrollDirection.down) return;
            // 아래로 스크롤 이탈 시 숨김 상태 복원
            stagePanels.forEach((panel) => {
              panel.classList.remove("catering_stage_panel_visible");
              const image = panel.querySelector<HTMLElement>(".catering_stage_image_wrap");
              const text = panel.querySelector<HTMLElement>(".catering_stage_text");
              if (image) { image.style.animationDelay = ""; image.classList.add("catering_stage_wrap_hidden"); }
              if (text) { text.style.animationDelay = ""; text.classList.add("catering_stage_text_hidden"); }
            });
            return;
          }
          if (!scrollDirection.down) {
            // 위로 스크롤 진입 시 애니메이션 없이 즉시 표시
            stagePanels.forEach((panel) => {
              panel.classList.add("catering_stage_panel_visible");
              const image = panel.querySelector<HTMLElement>(".catering_stage_image_wrap");
              const text = panel.querySelector<HTMLElement>(".catering_stage_text");
              if (image) { image.style.animationDelay = ""; image.classList.remove("catering_stage_wrap_hidden"); }
              if (text) { text.style.animationDelay = ""; text.classList.remove("catering_stage_text_hidden"); }
            });
            return;
          }
          // 아래로 스크롤 진입 시 패널당 0.45s 간격 순차 애니메이션
          stagePanels.forEach((panel, index) => {
            const delay = `${index * 0.45}s`;
            const image = panel.querySelector<HTMLElement>(".catering_stage_image_wrap");
            const text = panel.querySelector<HTMLElement>(".catering_stage_text");
            // visible 제거 후 reflow 강제 → 동일 클래스 재부여 시 animation 재실행
            panel.classList.remove("catering_stage_panel_visible");
            if (image) { image.style.animationDelay = delay; image.classList.remove("catering_stage_wrap_hidden"); }
            if (text) { text.style.animationDelay = delay; text.classList.remove("catering_stage_text_hidden"); }
            void panel.offsetWidth;
            panel.classList.add("catering_stage_panel_visible");
          });
        });
      },
      { root: containerElement, threshold: 0.3 }
    );

    const stageSection = containerElement.querySelector<HTMLElement>("#catering_stage");
    if (stageSection) stageObserver.observe(stageSection);

    // 3번 섹션: 상단 탭+테이블 밑에서 올라오기, 프로세스 카드+화살표 순차 진입
    const compareTable = containerElement.querySelector<HTMLElement>("#catering_compare .catering_compare_table");
    const compareTopTabs = containerElement.querySelector<HTMLElement>("#catering_compare .catering_compare_top_tabs");
    const processCards = Array.from(
      containerElement.querySelectorAll<HTMLElement>("#catering_compare .catering_process_card")
    );

    // 초기 탭/테이블/카드 숨김 상태 설정
    const compareHideItems = [compareTopTabs, compareTable].filter(Boolean) as HTMLElement[];
    compareHideItems.forEach((el) => el.classList.add("catering_compare_hidden"));
    processCards.forEach((card) => card.classList.add("catering_compare_hidden"));

    const compareObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // 위로 스크롤 이탈 시 리셋 없음
            if (!scrollDirection.down) return;
            // 아래로 스크롤 이탈 시 숨김 상태 복원
            compareHideItems.forEach((el) => {
              el.style.animationDelay = "";
              el.classList.add("catering_compare_hidden");
              el.classList.remove("catering_compare_visible");
            });
            processCards.forEach((card) => {
              card.style.animationDelay = "";
              card.classList.add("catering_compare_hidden");
              card.classList.remove("catering_compare_visible");
            });
            return;
          }
          // 탭+테이블 0.22s 간격 순차 진입
          compareHideItems.forEach((el, i) => {
            el.classList.remove("catering_compare_visible");
            void el.offsetWidth;
            el.style.animationDelay = scrollDirection.down ? `${i * 0.22}s` : "0s";
            el.classList.remove("catering_compare_hidden");
            el.classList.add("catering_compare_visible");
          });
          // 프로세스 카드+화살표 0.32s 간격 순차 진입 (탭+테이블 후 0.55s 지연 시작)
          processCards.forEach((card, i) => {
            card.classList.remove("catering_compare_visible");
            void card.offsetWidth;
            card.style.animationDelay = scrollDirection.down ? `${0.55 + i * 0.32}s` : "0s";
            card.classList.remove("catering_compare_hidden");
            card.classList.add("catering_compare_visible");
          });
        });
      },
      { root: containerElement, threshold: 0.3 }
    );

    const compareSection = containerElement.querySelector<HTMLElement>("#catering_compare");
    if (compareSection) compareObserver.observe(compareSection);

    // 4번 섹션: 라벨 흐림→선명 전환, 퍼센트 카운트업, 캐러셀 진입 애니메이션
    const statLabels = Array.from(
      containerElement.querySelectorAll<HTMLElement>("#catering_education .catering_education_stat_label")
    );
    const statValues = Array.from(
      containerElement.querySelectorAll<HTMLElement>("#catering_education .catering_education_stat_value")
    );
    const educationCarousel = containerElement.querySelector<HTMLElement>("#catering_education .catering_education_cards_wrap");

    // 초기 캐러셀 숨김 상태 설정 (라벨은 CSS 기본값이 흐린 상태)
    if (educationCarousel) educationCarousel.classList.add("catering_compare_hidden");
    // 라벨 선명 전환 타이머 ID (재진입 시 이전 타이머 취소용)
    let labelClearTimeoutId = 0;

    // 0%에서 target까지 duration(ms) 동안 ease-out cubic 카운트업
    const countUp = (el: HTMLElement, target: number, duration: number) => {
      const start = performance.now();
      el.classList.add("counting");
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic (끝부분 천천히 수렴)
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${Math.round(eased * target)}%`;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.classList.remove("counting");
        }
      };
      requestAnimationFrame(step);
    };

    const educationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // 이탈 방향 무관하게 라벨/퍼센트 초기 상태 복원 (재진입 시 항상 애니메이션 재실행)
            window.clearTimeout(labelClearTimeoutId);
            statLabels.forEach((el) => el.classList.remove("catering_education_label_clear"));
            statValues.forEach((el) => { el.textContent = `0%`; });
            // 캐러셀은 위로 이탈 시 리셋 없음
            if (!scrollDirection.down) return;
            if (educationCarousel) {
              educationCarousel.style.animationDelay = "";
              educationCarousel.classList.add("catering_compare_hidden");
              educationCarousel.classList.remove("catering_compare_visible");
            }
            return;
          }
          // 퍼센트 카운트업 (아래 진입 시 1800ms 카운트업, 위 진입 시 즉시 완료값 표시)
          statValues.forEach((el) => {
            const target = parseInt(el.dataset.target ?? "0");
            if (scrollDirection.down) {
              countUp(el, target, 1800);
            } else {
              el.textContent = `${target}%`;
            }
          });
          // 카운트업 900ms 시점 라벨 선명 전환 (퍼센트 차오르는 동안 함께 선명해짐)
          window.clearTimeout(labelClearTimeoutId);
          if (scrollDirection.down) {
            labelClearTimeoutId = window.setTimeout(() => {
              statLabels.forEach((el) => el.classList.add("catering_education_label_clear"));
            }, 900);
          } else {
            statLabels.forEach((el) => el.classList.add("catering_education_label_clear"));
          }
          // 캐러셀 0.9s 지연 후 아래에서 올라오는 진입 애니메이션
          if (educationCarousel) {
            educationCarousel.classList.remove("catering_compare_visible");
            void educationCarousel.offsetWidth;
            educationCarousel.style.animationDelay = scrollDirection.down ? "0.9s" : "0s";
            educationCarousel.classList.remove("catering_compare_hidden");
            educationCarousel.classList.add("catering_compare_visible");
          }
        });
      },
      { root: containerElement, threshold: 0.3 }
    );

    const educationSection = containerElement.querySelector<HTMLElement>("#catering_education");
    if (educationSection) educationObserver.observe(educationSection);

    // 5번 섹션: 상단(레시피 목록)/중단(위생 칩)/하단(채용 블록) 0.4s 간격 순차 진입
    const researchGroups = [
      containerElement.querySelector<HTMLElement>("#catering_research .catering_research_list"),
      containerElement.querySelector<HTMLElement>("#catering_research .catering_safety_chip_row"),
      containerElement.querySelector<HTMLElement>("#catering_research .catering_recruit_blocks"),
    ].filter(Boolean) as HTMLElement[];

    // 초기 세 그룹 숨김 상태 설정
    researchGroups.forEach((el) => el.classList.add("catering_compare_hidden"));

    const researchObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // 위로 스크롤 이탈 시 리셋 없음
            if (!scrollDirection.down) return;
            // 아래로 스크롤 이탈 시 숨김 상태 복원
            researchGroups.forEach((el) => {
              el.style.animationDelay = "";
              el.classList.add("catering_compare_hidden");
              el.classList.remove("catering_compare_visible");
            });
            return;
          }
          // 세 그룹 0.7s 간격 순차 진입
          researchGroups.forEach((el, i) => {
            el.classList.remove("catering_compare_visible");
            void el.offsetWidth;
            el.style.animationDelay = scrollDirection.down ? `${i * 0.7}s` : "0s";
            el.classList.remove("catering_compare_hidden");
            el.classList.add("catering_compare_visible");
          });
        });
      },
      { root: containerElement, threshold: 0.3 }
    );

    const researchSection = containerElement.querySelector<HTMLElement>("#catering_research");
    if (researchSection) researchObserver.observe(researchSection);

    // 언마운트 시 진행 중 애니메이션 프레임/타이머/이벤트/옵저버 전체 정리
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(wheelResetTimeoutId);
      containerElement.removeEventListener("wheel", handleWheel);
      containerElement.removeEventListener("scroll", handleScroll);
      stageObserver.disconnect();
      compareObserver.disconnect();
      educationObserver.disconnect();
      researchObserver.disconnect();
    };
  }, [containerId, sectionSelector]);

  return null;
}
