import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import MapView from "../components/common/MapView";
import TeacherCard from "../components/common/TeacherCard";
import { SkeletonTeacherList } from "../components/common/Skeleton";
import EmptyState, { EmptyStates } from "../components/common/EmptyState";
import { claimApi } from "../api/client";
import type { StreetClaim } from "../types";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [mode, setMode] = useState("offline");
  const [results, setResults] = useState<StreetClaim[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, [searchParams]);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res: any = await claimApi.search(q, undefined, undefined, mode);
      setResults(res?.data || res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    if (mode !== "offline") doSearch(query.trim());
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
      {/* 搜索框 */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索街道、艺术门类或主理人…"
            className="input-field pl-12"
            autoFocus
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </form>

      {/* 地图 */}
      <div className="flex gap-1 bg-gray-100 rounded-full p-1 mb-4">
        <button onClick={() => setMode("offline")}
          className={`flex-1 py-2 text-xs rounded-full transition-all ${mode === "offline" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}>
          线下
        </button>
        <button onClick={() => setMode("online")}
          className={`flex-1 py-2 text-xs rounded-full transition-all ${mode === "online" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}>
          线上
        </button>
        <button onClick={() => setMode("all")}
          className={`flex-1 py-2 text-xs rounded-full transition-all ${mode === "all" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}>
          不限
        </button>
      </div>
      <div className="h-48 mb-4 rounded-xl overflow-hidden">
        <MapView className="w-full h-full" />
      </div>

      {/* 搜索结果 */}
      {loading ? (
        <SkeletonTeacherList count={3} />
      ) : results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            找到 {results.length} 个结果
          </p>
          {results.map((claim) => (
            <TeacherCard key={claim.id} claim={claim} />
          ))}
        </div>
      ) : query ? (
        EmptyStates.noResults
      ) : (
        <EmptyState icon="🔍" title="搜索身边的体验导师" description="输入街道名或艺术门类开始搜索" />
      )}
    </div>
  );
}
