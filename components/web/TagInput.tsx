"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn, slugify } from "@/lib/utils";

export interface TagInputValue {
  slug: string;
  label: string;
}

interface TagInputProps {
  value: TagInputValue[];
  onChange: (tags: TagInputValue[]) => void;
  maxTags?: number;
  placeholder?: string;
}

interface TagSuggestion {
  slug: string;
  label: string;
  brokerCount: number;
}

/**
 * Hashtag combobox s autocomplete (debounce 200ms) + create-new flow.
 * A11y: role="combobox" + listbox, ArrowUp/Down/Enter/Escape/Backspace.
 */
export function TagInput({
  value,
  onChange,
  maxTags = 10,
  placeholder = "Napište hashtag a stiskněte Enter...",
}: TagInputProps) {
  const [inputText, setInputText] = useState("");
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [limitWarning, setLimitWarning] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const atLimit = value.length >= maxTags;

  // Debounced autocomplete fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = inputText.trim();
    if (q.length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { tags?: TagSuggestion[] };
        const selected = new Set(value.map((t) => t.slug));
        setSuggestions((data.tags ?? []).filter((s) => !selected.has(s.slug)));
        setIsOpen(true);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputText, value]);

  // Limit-warning auto-dismiss
  useEffect(() => {
    if (!limitWarning) return;
    const t = setTimeout(() => setLimitWarning(false), 2500);
    return () => clearTimeout(t);
  }, [limitWarning]);

  function addTag(tag: TagInputValue) {
    if (value.length >= maxTags) {
      setLimitWarning(true);
      return;
    }
    if (value.some((t) => t.slug === tag.slug)) return;
    onChange([...value, tag]);
    setInputText("");
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function removeTag(slug: string) {
    onChange(value.filter((t) => t.slug !== slug));
  }

  const trimmed = inputText.trim();
  const hasCreateOption =
    trimmed.length >= 2 &&
    !suggestions.some(
      (s) => s.label.toLowerCase() === trimmed.toLowerCase()
    );
  const createSlug = trimmed ? slugify(trimmed) : "";

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const listLength = suggestions.length + (hasCreateOption ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, listLength - 1));
      setIsOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        addTag(suggestions[activeIndex]);
      } else if (
        (activeIndex === suggestions.length && hasCreateOption) ||
        (activeIndex === -1 && trimmed.length >= 2)
      ) {
        addTag({ slug: createSlug, label: trimmed });
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Backspace" && inputText === "" && value.length > 0) {
      removeTag(value[value.length - 1].slug);
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 min-h-[44px] w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
        {value.map((tag) => (
          <span
            key={tag.slug}
            className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-sm font-medium px-2.5 py-0.5 rounded-full"
          >
            <span className="text-orange-500">#</span>
            {tag.label}
            <button
              type="button"
              onClick={() => removeTag(tag.slug)}
              aria-label={`Odebrat ${tag.label}`}
              className="ml-1 text-orange-600 hover:text-orange-800 cursor-pointer bg-transparent border-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputText && setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={atLimit}
          className="flex-1 min-w-[150px] outline-none text-sm bg-transparent disabled:cursor-not-allowed"
        />
      </div>

      <div className="mt-1.5 text-xs text-gray-500 flex justify-between">
        <span>
          {value.length}/{maxTags} hashtagů
          {limitWarning && (
            <span className="ml-2 text-red-600 font-medium">
              Maximum {maxTags} hashtagů
            </span>
          )}
        </span>
        {isLoading && <span>Hledám…</span>}
      </div>

      {isOpen && (suggestions.length > 0 || hasCreateOption) && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          {suggestions.map((s, idx) => (
            <li
              key={s.slug}
              id={`${listboxId}-opt-${idx}`}
              role="option"
              aria-selected={activeIndex === idx}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
              className={cn(
                "px-3 py-2 cursor-pointer flex items-center justify-between text-sm",
                activeIndex === idx ? "bg-orange-50" : "hover:bg-gray-50"
              )}
            >
              <span>
                <span className="text-orange-500">#</span>
                {s.label}
              </span>
              <span className="text-xs text-gray-400">
                {s.brokerCount} makléřů
              </span>
            </li>
          ))}
          {hasCreateOption && (
            <li
              id={`${listboxId}-opt-${suggestions.length}`}
              role="option"
              aria-selected={activeIndex === suggestions.length}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag({ slug: createSlug, label: trimmed });
              }}
              className={cn(
                "px-3 py-2 cursor-pointer flex items-center gap-2 text-sm border-t border-gray-100",
                activeIndex === suggestions.length
                  ? "bg-orange-50"
                  : "hover:bg-gray-50"
              )}
            >
              <span className="text-orange-500">+</span>
              <span>
                Vytvořit:{" "}
                <strong className="text-orange-700">#{trimmed}</strong>
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
