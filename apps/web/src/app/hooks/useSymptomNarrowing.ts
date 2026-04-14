"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface SymptomOption {
  code: string;
  name: string;
  synonyms: string;
  bodySystem: string;
}

export interface NarrowedIcd {
  icdCode: string;
  icdName: string;
  totalScore: number;
  matchRatio: number;
  finalScore: number;
  matchedSymptoms: string[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function useSymptomNarrowing() {
  const [symptomSearch, setSymptomSearch] = useState("");
  const [symptomOptions, setSymptomOptions] = useState<SymptomOption[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomOption[]>([]);
  const [narrowedIcds, setNarrowedIcds] = useState<NarrowedIcd[]>([]);
  const [narrowingLoading, setNarrowingLoading] = useState(false);

  const debouncedSearch = useDebounce(symptomSearch, 250);

  // Search symptoms on input change
  useEffect(() => {
    const keyword = debouncedSearch.trim();
    if (!keyword) {
      setSymptomOptions([]);
      return;
    }

    let cancelled = false;
    async function search() {
      try {
        const response = await fetch(`/api/symptoms/search?q=${encodeURIComponent(keyword)}`);
        const data = await response.json();
        if (!cancelled && Array.isArray(data?.symptoms)) {
          // Filter out already selected
          const selected = new Set(selectedSymptoms.map((s) => s.code));
          setSymptomOptions(data.symptoms.filter((s: SymptomOption) => !selected.has(s.code)));
        }
      } catch {
        if (!cancelled) setSymptomOptions([]);
      }
    }

    void search();
    return () => { cancelled = true; };
  }, [debouncedSearch, selectedSymptoms]);

  // Narrow ICD when selected symptoms change
  useEffect(() => {
    if (selectedSymptoms.length === 0) {
      setNarrowedIcds([]);
      return;
    }

    let cancelled = false;
    async function narrow() {
      setNarrowingLoading(true);
      try {
        const response = await fetch("/api/icd/narrow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symptomCodes: selectedSymptoms.map((s) => s.code),
          }),
        });
        const data = await response.json();
        if (!cancelled && Array.isArray(data?.results)) {
          setNarrowedIcds(data.results);
        }
      } catch {
        if (!cancelled) setNarrowedIcds([]);
      } finally {
        if (!cancelled) setNarrowingLoading(false);
      }
    }

    void narrow();
    return () => { cancelled = true; };
  }, [selectedSymptoms]);

  const addSymptom = useCallback((symptom: SymptomOption) => {
    setSelectedSymptoms((prev) => {
      if (prev.some((s) => s.code === symptom.code)) return prev;
      if (prev.length >= 10) return prev;
      return [...prev, symptom];
    });
    setSymptomSearch("");
    setSymptomOptions([]);
  }, []);

  const removeSymptom = useCallback((code: string) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s.code !== code));
  }, []);

  const clearAllSymptoms = useCallback(() => {
    setSelectedSymptoms([]);
    setNarrowedIcds([]);
  }, []);

  const maxScore = useMemo(() => {
    if (narrowedIcds.length === 0) return 1;
    return Math.max(...narrowedIcds.map((r) => r.finalScore));
  }, [narrowedIcds]);

  return {
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
  };
}
