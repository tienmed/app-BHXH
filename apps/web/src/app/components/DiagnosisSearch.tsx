"use client";

import { memo, useCallback, useRef, useState } from "react";
import type { DiagnosisOption, Diagnosis } from "../types";

type Props = {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    filteredOptions: DiagnosisOption[];
    selectedCodes: string[];
    diagnoses: Diagnosis[];
    toggleDiagnosis: (code: string) => void;
    removeDiagnosis: (code: string) => void;
    clearAllDiagnoses: () => void;
};

export const DiagnosisSearch = memo(function DiagnosisSearch({
    searchTerm,
    setSearchTerm,
    filteredOptions,
    selectedCodes,
    diagnoses,
    toggleDiagnosis,
    removeDiagnosis,
    clearAllDiagnoses
}: Props) {
    const [focusIndex, setFocusIndex] = useState(-1);
    const listRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (filteredOptions.length === 0) return;

            if (event.key === "ArrowDown") {
                event.preventDefault();
                setFocusIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setFocusIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
            } else if (event.key === "Enter" && focusIndex >= 0) {
                event.preventDefault();
                toggleDiagnosis(filteredOptions[focusIndex].code);
                setFocusIndex(-1);
            } else if (event.key === "Escape") {
                setSearchTerm("");
                setFocusIndex(-1);
            }
        },
        [filteredOptions, focusIndex, toggleDiagnosis, setSearchTerm]
    );

    return (
        <>
            <div className="searchField">
                <span>BẮT ĐẦU VỚI TỪ KHÓA LÂM SÀNG</span>
                <div className="searchWrapper">
                    <input
                        onChange={(event) => {
                            setSearchTerm(event.target.value);
                            setFocusIndex(-1);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập mã bệnh ICD-10 hoặc tên chẩn đoán (vd: L70, dạ dày...)"
                        value={searchTerm}
                        id="icd-search-input"
                        autoComplete="off"
                    />
                    {searchTerm && (
                        <button className="clearSearch" onClick={() => setSearchTerm("")}>✕</button>
                    )}
                </div>
            </div>

            <div className="searchResults" ref={listRef} role="listbox" id="icd-search-results">
                {filteredOptions.map((option, index) => {
                    const selected = selectedCodes.includes(option.code);
                    const focused = index === focusIndex;

                    return (
                        <button
                            className={`searchOption${selected ? " searchOption-selected" : ""}${focused ? " searchOption-focused" : ""}`}
                            key={option.code}
                            onClick={() => toggleDiagnosis(option.code)}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            id={`icd-option-${option.code}`}
                        >
                            <strong>{option.label}</strong>
                            <span>{option.code}</span>
                        </button>
                    );
                })}
            </div>

            <div className="selectedDiagnosisRow">
                {diagnoses.map((diagnosis) => (
                    <button
                        className="selectedDiagnosisChip"
                        key={`${diagnosis.code}-${diagnosis.label}`}
                        onClick={() => removeDiagnosis(diagnosis.code)}
                        type="button"
                        title="Nhấp để xóa"
                    >
                        <strong>{diagnosis.label}</strong>
                        <span>{diagnosis.code}</span>
                    </button>
                ))}
                {diagnoses.length > 1 ? (
                    <button className="clearAllBtn" onClick={clearAllDiagnoses} type="button">Xóa tất cả</button>
                ) : null}
            </div>
        </>
    );
});
