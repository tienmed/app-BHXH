import { memo, useState, useEffect, useRef } from "react";
import type { SuggestedItem, ItemStatus, FeedbackPayload } from "../types";
import { RecommendationCard } from "./RecommendationCard";

type Props = {
    title: string;
    items: SuggestedItem[];
    groupNote?: string;
    prefix: string;
    loading: boolean;
    itemStatuses: Record<string, ItemStatus>;
    onSetStatus: (name: string, status: ItemStatus) => void;
    onOpenFeedback: (targetType: FeedbackPayload["targetType"], targetName: string) => void;
    feedbackTargetType: FeedbackPayload["targetType"];
    emptyText: string;
    icdCode: string;
    onSearch?: (query: string, type: "CLS" | "MEDICATION") => Promise<SuggestedItem[]>;
};

export const RecommendationPanel = memo(function RecommendationPanel({
    title,
    items,
    groupNote,
    prefix,
    loading,
    itemStatuses,
    onSetStatus,
    onOpenFeedback,
    feedbackTargetType,
    emptyText,
    icdCode,
    onSearch
}: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<SuggestedItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2 || !onSearch) {
            setResults([]);
            return;
        }

        const type = prefix === "cls" ? "CLS" : "MEDICATION";
        const timer = setTimeout(async () => {
            setIsSearching(true);
            const data = await onSearch(searchTerm, type);
            setResults(data);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, onSearch, prefix]);

    // Close results when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setResults([]);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleAddItem = (item: SuggestedItem) => {
        onSetStatus(`${prefix}-${item.code}`, "accepted");
        setSearchTerm("");
        setResults([]);
    };

    return (
        <section className="doctorPanel fade-3">
            <div className="doctorPanelHeader">
                <h2>{title}</h2>
                <span>{items.length} mục</span>
            </div>

            {/* Search Box */}
            <div className="itemSearchContainer" ref={searchRef}>
                <div className="itemSearchInputWrapper">
                    <span className="searchIcon">🔍</span>
                    <input
                        type="text"
                        className="itemSearchInput"
                        placeholder={`Thêm ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {isSearching && <div className="searchSpinner" />}
                </div>
                {results.length > 0 && (
                    <div className="itemSearchResults">
                        {results.map((res) => (
                            <div
                                key={res.code}
                                className="searchResultRow"
                                onClick={() => handleAddItem(res)}
                            >
                                <div className="resInfo">
                                    <span className="resName">{res.name}</span>
                                    <span className="resCode">{res.code}</span>
                                </div>
                                <button className="addBtn">+</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="doctorList">
                {groupNote ? <div className="groupNote">{groupNote}</div> : null}

                {loading ? (
                    <div className="skeletonGroup">
                        <div className="skeleton skeleton-card" />
                        <div className="skeleton skeleton-card" />
                        <div className="skeleton skeleton-card skeleton-short" />
                    </div>
                ) : items.length > 0 ? (
                    items.map((item, index) => {
                        const itemKey = `${prefix}-${item.code}`;
                        return (
                            <RecommendationCard
                                key={`${item.code}-${index}`}
                                item={item}
                                icdCode={icdCode}
                                prefix={prefix}
                                groupNote={groupNote}
                                itemStatus={itemStatuses[itemKey] ?? "pending"}
                                onSetStatus={onSetStatus}
                                onOpenFeedback={onOpenFeedback}
                                feedbackTargetType={feedbackTargetType}
                            />
                        );
                    })
                ) : (
                    <p className="emptyText">{emptyText}</p>
                )}
            </div>
        </section>
    );
});
