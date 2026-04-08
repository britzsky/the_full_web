"use client";

import { useEffect, useId, useRef, useState } from "react";

type CommonSearchSelectOption = {
  value: string;
  label: string;
};

type CommonSearchSelectProps = {
  id: string;
  name: string;
  defaultValue: string;
  options: CommonSearchSelectOption[];
  wrapperClassName?: string;
};

// 전달받은 값이 옵션에 없으면 첫 번째 옵션으로 맞춘다.
const resolveSelectedValue = (options: CommonSearchSelectOption[], value: string) => {
  if (options.some((option) => option.value === value)) {
    return value;
  }

  return options[0]?.value ?? "";
};

// 현재 선택값에 맞는 표시 라벨을 찾는다.
const resolveSelectedLabel = (options: CommonSearchSelectOption[], value: string) =>
  options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "";

// 검색 폼에서 공통으로 사용하는 커스텀 드롭박스
export default function CommonSearchSelect({
  id,
  name,
  defaultValue,
  options,
  wrapperClassName = "",
}: CommonSearchSelectProps) {
  const optionListId = useId();
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [selectedValue, setSelectedValue] = useState(() => resolveSelectedValue(options, defaultValue));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelectedValue(resolveSelectedValue(options, defaultValue));
  }, [defaultValue, options]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    // 드롭박스 바깥을 누르면 목록을 닫는다.
    const handlePointerDownOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // ESC 키로 목록을 닫는다.
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const selectedLabel = resolveSelectedLabel(options, selectedValue);
  const wrapperClassNames = ["common-search-select-wrap", wrapperClassName, isOpen ? "common-search-select-wrap-open" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span ref={containerRef} className={wrapperClassNames}>
      <input type="hidden" name={name} value={selectedValue} />

      <button
        id={id}
        type="button"
        className="common-search-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={optionListId}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="common-search-select-trigger-label">{selectedLabel}</span>
        <span className="common-search-select-arrow" aria-hidden="true" />
      </button>

      {isOpen && (
        <span className="common-search-select-panel-wrap">
          <ul id={optionListId} className="common-search-select-panel" role="listbox" aria-label={selectedLabel}>
            {options.map((option) => {
              const isSelected = option.value === selectedValue;

              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    className={`common-search-select-option ${isSelected ? "common-search-select-option-active" : ""}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedValue(option.value);
                      setIsOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </span>
      )}
    </span>
  );
}
