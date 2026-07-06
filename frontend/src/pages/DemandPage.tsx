import { useState, useEffect } from "react";
import { demandApi, matchingApi } from "../api/client";
import { Link } from "react-router-dom";
import { SkeletonDemandList } from "../components/common/Skeleton";
import EmptyState, { EmptyStates } from "../components/common/EmptyState";

const STATUS_TABS = [
  { key: "NEW", label: "新需求", color: "bg-blue-100 text-blue-700" },
  { key: "SCORED", label: "已评分", color: "bg-yellow-100 text-yellow-700" },
  { key: "MATCHED", label: "已匹配", color: "bg-green-100 text-green-700" },
  { key: "", label: "全部", color: "bg-gray-100 text-gray-700" },
];

const GRADE_COLORS: Record<string, string> = {
  HIGH: "text-green-600 bg-green-50",
  MEDIUM: "text-yellow-600 bg-yellow-50",
  LOW: "text-red-600 bg-red-50",
};

const ACTION_LABELS: Record<string, string> = {
  IMMEDIATE_PUSH: "立即推送",
  MANUAL_REVIEW: "待人工确认",
  AUTO_FILTER: "自动过滤",
};

export default function DemandPage() {
  const [demands, setDemands] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [activeStatus, setActiveStatus] = useState("NEW");
  const [instrumentFilter, setInstrumentFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDemands = async () => {
    setLoading(true);
    try {
      const res: any = await demandApi.list({
        status: activeStatus || undefined,
        instrument: instrumentFilter || undefined,
        take: 50,
      });
      setDemands(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error("Failed to load demands:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemands();
  }, [activeStatus]);

  const handleMatch = async (demandId: string) => {
    try {
      await matchingApi.matchDemand(demandId);
      fetchDemands();
    } catch (e: any) {
      alert(e.message || "匹配失败");
    }
  };

  const handleRescore = async (demandId: string) => {
    try {
      await demandApi.rescore(demandId);
      fetchDemands();
    } catch (e: any) {
      alert(e.message || "重新评分失败");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">生源看板</h1>
      <p className="text-gray-500 text-sm mb-4">
        来自小红书等平台的潜在学生需求 · 共 {total} 条
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              activeStatus === tab.key
                ? tab.color + " ring-2 ring-offset-1 ring-current"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <input
          type="text"
          placeholder="筛选艺术门类..."
          value={instrumentFilter}
          onChange={(e) => setInstrumentFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchDemands()}
          className="ml-auto px-3 py-1.5 border rounded-lg text-sm w-36"
        />
        <button
          onClick={fetchDemands}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          刷新
        </button>
      </div>

      {/* Demand Cards */}
      {loading ? (
        <SkeletonDemandList count={3} />
      ) : demands.length === 0 ? (
        EmptyStates.noDemands
      ) : (
        <div className="space-y-3">
          {demands.map((d: any) => {
            const score = d.scores?.[0];
            const isExpanded = expandedId === d.id;
            return (
              <div
                key={d.id}
                className="bg-white border rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {d.instrument && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {d.instrument}
                        </span>
                      )}
                      {d.city && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {d.city}{d.district || ""}
                        </span>
                      )}
                      {d.street && (
                        <span className="text-xs text-gray-500">{d.street}</span>
                      )}
                      {d.hoursAgo != null && (
                        <span className="text-xs text-gray-400">
                          {d.hoursAgo <= 1 ? "刚刚" : `${Math.round(d.hoursAgo)}小时前`}
                        </span>
                      )}
                      {d.budget && (
                        <span className="text-xs text-green-600 font-medium">
                          ¥{d.budget}/节
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{d.content}</p>
                  </div>

                  {/* Score badge */}
                  {score && (
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          GRADE_COLORS[score.grade] || "text-gray-500"
                        }`}
                      >
                        {score.totalScore}分
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {ACTION_LABELS[score.action] || score.action}
                      </p>
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                    {/* Score breakdown */}
                    {score && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">AI评分详情</p>
                        <div className="grid grid-cols-5 gap-2 text-center text-xs">
                          {[
                            { k: "timeliness", label: "时效性", w: 25 },
                            { k: "completeness", label: "完整度", w: 25 },
                            { k: "authenticity", label: "真实性", w: 30 },
                            { k: "competition", label: "竞争度", w: 15 },
                            { k: "budget", label: "预算", w: 5 },
                          ].map((dim) => (
                            <div key={dim.k}>
                              <div className="text-gray-400">{dim.label}</div>
                              <div className="font-bold text-gray-800">
                                {Math.round(score[dim.k])}
                              </div>
                              <div className="text-gray-400">{dim.w}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMatch(d.id)}
                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                      >
                        匹配老师
                      </button>
                      <button
                        onClick={() => handleRescore(d.id)}
                        className="px-4 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                      >
                        重新评分
                      </button>
                      {d.sourceUrl && (
                        <a
                          href={d.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                        >
                          查看原文 ↗
                        </a>
                      )}
                    </div>

                    {/* Matches section */}
                    {d.matches?.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-700 mb-2">
                          已匹配老师 ({d.matches.length})
                        </p>
                        {d.matches.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between text-sm py-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{m.teacher?.user?.nickname || "未知"}</span>
                              <span className="text-gray-400">
                                {m.claim?.instrument?.name} · {m.claim?.streetName}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              m.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                              m.status === "DECLINED" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {m.status === "ACCEPTED" ? "已接受" :
                               m.status === "DECLINED" ? "已拒绝" :
                               m.status === "NOTIFIED" ? "已通知" : "待处理"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
