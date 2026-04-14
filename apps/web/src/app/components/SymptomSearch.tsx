"use client";

import { memo, useCallback, useRef, useState } from "react";
import type { SymptomOption, NarrowedIcd } from "../hooks/useSymptomNarrowing";

type Props = {
  symptomSearch: string;
  setSymptomSearch: (value: string) => void;
  symptomOptions: SymptomOption[];
  selectedSymptoms: SymptomOption[];
  narrowedIcds: NarrowedIcd[];
  narrowingLoading: boolean;
  maxScore: number;
  addSymptom: (symptom: SymptomOption) => void;
  removeSymptom: (code: string) => void;
  clearAllSymptoms: () => void;
  onSelectIcd: (code: string) => void;
};

const BODY_SYSTEM_ICONS: Record<string, string> = {
  "Thần kinh": "🧠",
  "Tim mạch": "❤️",
  "Hô hấp": "🫁",
  "Tiêu hóa": "🔥",
  "Cơ xương khớp": "🦴",
  "Tiết niệu": "💧",
  "Mắt": "👁️",
  "Da liễu": "🩹",
  "Tai mũi họng": "👂",
  "Răng hàm mặt": "🦷",
  "Sản phụ khoa": "🩺",
  "Nội tiết": "⚡",
  "Nhi khoa": "👶",
  "Toàn thân": "🌡️",
  "Tâm thần": "💭",
};

export const SymptomSearch = memo(function SymptomSearch({
  symptomSearch,
  setSymptomSearch,
  symptomOptions,
  selectedSymptoms,
  narrowedIcds,
  narrowingLoading,
  maxScore,
  addSymptom,
  removeSymptom,
  clearAllSymptoms,
  onSelectIcd,
}: Props) {
  const [focusIndex, setFocusIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (symptomOptions.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusIndex((prev) => (prev < symptomOptions.length - 1 ? prev + 1 : 0));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusIndex((prev) => (prev > 0 ? prev - 1 : symptomOptions.length - 1));
      } else if (event.key === "Enter" && focusIndex >= 0) {
        event.preventDefault();
        addSymptom(symptomOptions[focusIndex]);
        setFocusIndex(-1);
      } else if (event.key === "Escape") {
        setSymptomSearch("");
        setFocusIndex(-1);
      }
    },
    [symptomOptions, focusIndex, addSymptom, setSymptomSearch]
  );

  return (
    <div className="symptomNarrowing">
      {/* Symptom Search Input */}
      <div className="searchField">
        <span>TÌM THEO TRIỆU CHỨNG LÂM SÀNG</span>
        <div className="searchWrapper">
          <input
            ref={inputRef}
            onChange={(e) => {
              setSymptomSearch(e.target.value);
              setFocusIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Nhập triệu chứng (vd: đau đầu, ho, sốt, đau bụng...)"
            value={symptomSearch}
            id="symptom-search-input"
            autoComplete="off"
          />
          {symptomSearch && (
            <button className="clearSearch" onClick={() => setSymptomSearch("")}>✕</button>
          )}
        </div>
      </div>

      {/* Symptom Autocomplete Results */}
      {symptomOptions.length > 0 && (
        <div className="searchResults symptomResults" role="listbox" id="symptom-search-results">
          {symptomOptions.map((option, index) => {
            const icon = BODY_SYSTEM_ICONS[option.bodySystem] ?? "🔹";
            const focused = index === focusIndex;
            return (
              <button
                className={`searchOption symptomOption${focused ? " searchOption-focused" : ""}`}
                key={option.code}
                onClick={() => addSymptom(option)}
                type="button"
                role="option"
                id={`symptom-option-${option.code}`}
              >
                <span className="symptomIcon">{icon}</span>
                <div className="symptomMeta">
                  <strong>{option.name}</strong>
                  <span className="symptomSystem">{option.bodySystem}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Symptom Chips */}
      {selectedSymptoms.length > 0 && (
        <div className="selectedSymptomRow">
          {selectedSymptoms.map((symptom) => {
            const icon = BODY_SYSTEM_ICONS[symptom.bodySystem] ?? "🔹";
            return (
              <button
                className="symptomChip"
                key={symptom.code}
                onClick={() => removeSymptom(symptom.code)}
                type="button"
                title="Nhấp để xóa triệu chứng"
              >
                <span>{icon}</span>
                <strong>{symptom.name}</strong>
                <span className="chipRemove">✕</span>
              </button>
            );
          })}
          {selectedSymptoms.length > 1 && (
            <button className="clearAllBtn" onClick={clearAllSymptoms} type="button">
              Xóa tất cả
            </button>
          )}
        </div>
      )}

      {/* Narrowed ICD Results */}
      {(narrowedIcds.length > 0 || narrowingLoading) && (
        <div className="narrowedIcdPanel">
          <div className="narrowedIcdHeader">
            <h3>
              🎯 ICD gợi ý theo triệu chứng
              {selectedSymptoms.length > 0 && (
                <span className="narrowedCount"> ({narrowedIcds.length} kết quả)</span>
              )}
            </h3>
            {narrowingLoading && <span className="narrowingSpinner">⟳</span>}
          </div>

          <div className="narrowedIcdList">
            {narrowedIcds.map((item, index) => {
              const barWidth = maxScore > 0 ? Math.round((item.finalScore / maxScore) * 100) : 0;
              const isFullMatch = item.matchRatio === 1;
              return (
                <button
                  className={`narrowedIcdItem${isFullMatch ? " narrowedIcdItem-full" : ""}`}
                  key={item.icdCode}
                  onClick={() => onSelectIcd(item.icdCode)}
                  type="button"
                  id={`narrowed-icd-${item.icdCode}`}
                >
                  <div className="narrowedIcdRank">#{index + 1}</div>
                  <div className="narrowedIcdInfo">
                    <div className="narrowedIcdName">
                      <strong>{item.icdCode}</strong>
                      <span>{item.icdName}</span>
                    </div>
                    <div className="narrowedIcdBar">
                      <div
                        className="narrowedIcdBarFill"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="narrowedIcdMeta">
                      <span className="narrowedIcdMatch">
                        {isFullMatch ? "✓ Khớp đầy đủ" : `${Math.round(item.matchRatio * 100)}% khớp`}
                      </span>
                      <span className="narrowedIcdScore">Score: {item.finalScore}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
