import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { claimApi, activityApi } from "../api/client";
import type { StreetClaim, Activity } from "../types";
import { SkeletonTeacherDetail } from "../components/common/Skeleton";
import EmptyState, { EmptyStates } from "../components/common/EmptyState";
import MapView from "../components/common/MapView";
import { getTeacherAvatar, getTeacherPhoto } from "../utils/avatar";

type Tab = "about" | "gallery" | "activities";

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<StreetClaim | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  async function loadData(claimId: string) {
    try {
      const res: any = await claimApi.getById(claimId);
      const claimData: StreetClaim = res?.data || res;
      setClaim(claimData);

      // Load teacher activities
      const teacherId = claimData.teacher?.user.id;
      if (teacherId) {
        const actRes: any = await activityApi.listByTeacher(teacherId);
        setActivities(actRes?.data || actRes || []);
      }
    } catch (e) {
      console.error("加载老师详情失败", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <SkeletonTeacherDetail />;
  }

  if (!claim) {
    return (
      <EmptyState
        icon="😕"
        title="未找到该导师的信息"
        action={{ label: "返回首页", onClick: () => navigate("/") }}
      />
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "about", label: "关于我" },
    { key: "gallery", label: "作品集" },
    { key: "activities", label: "近期活动" },
  ];

  const userId = claim.teacher?.user.id || "";
  const avatarUrl = getTeacherAvatar(userId, claim.teacher?.user.avatar);
  const heroPhoto = getTeacherPhoto(userId, claim.teacher?.user.avatar);

  return (
    <div className="max-w-2xl mx-auto">
      {/* 头部：封面 + 基本信息 */}
      <div className="relative">
        <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${heroPhoto})` }}>
          <div className="h-full w-full bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
        <div className="px-4 pb-4">
          <div className="-mt-12 flex items-end gap-4 mb-3">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden ring-2 ring-white">
                <img
                  src={avatarUrl}
                  alt={claim.teacher?.user.nickname || ""}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-gray-900">
                {claim.teacher?.user.nickname || "艺术主理人"}
              </h1>
              <p className="text-sm text-primary-600">
                {claim.instrument.name} · {claim.communityName || claim.streetName}
              </p>
              {claim.district && <p className="text-xs text-gray-400 mt-0.5">{claim.district} · {claim.city}</p>}
            </div>
          </div>
          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button onClick={() => navigate(`/dashboard?tab=messages&teacher=${claim.teacher?.user.id}`)}
              className="btn-primary flex-1 text-sm py-2.5">预约咨询</button>
            <button onClick={() => {
              const text = `我在乐邻上发现了${claim.instrument.name}老师「${claim.teacher?.user.nickname || ""}」，在${claim.streetName}附近！`;
              if (navigator.share) { navigator.share({ title: "乐邻 · 艺术体验", text, url: window.location.href }); }
              else { navigator.clipboard.writeText(text + " " + window.location.href); alert("已复制分享链接"); }
            }} className="btn-outline text-sm py-2.5 px-4" title="分享">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tab */}
      <div className="border-b border-gray-100 px-4">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "text-primary-700 border-primary-700"
                  : "text-gray-400 border-transparent hover:text-gray-600"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="px-4 py-6">
        {activeTab === "about" && (
          <div className="space-y-4">
            <section>
              <h3 className="font-medium text-gray-900 mb-2">📖 艺术故事</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {claim.teacher?.realName
                  ? `${claim.teacher.realName}老师，${claim.teacher.graduationSchool ? `毕业于${claim.teacher.graduationSchool}` : ""}${claim.teacher.major ? `，${claim.teacher.major}专业` : ""}${claim.teacher.experienceYears ? `，${claim.teacher.experienceYears}指导经验` : ""}。`
                  : `我是${claim.streetName}的艺术主理人，擅长${claim.instrument.name}。`
                }
                期待与街坊邻居一起分享艺术的美好。
              </p>
              {claim.teacher?.experienceItems && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {claim.teacher.experienceItems.split(/[,，、]/).filter(Boolean).map((item: string, i: number) => (
                    <span key={i} className="text-xs px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full">{item.trim()}</span>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h3 className="font-medium text-gray-900 mb-2">📍 位置信息</h3>
              <div className="h-40 rounded-xl overflow-hidden">
                <MapView className="w-full h-full"
                  center={claim.lng && claim.lat ? [claim.lng, claim.lat] : undefined}
                  markers={claim.lng && claim.lat ? [{
                    position: [claim.lng, claim.lat],
                    label: claim.teacher?.user.nickname || "",
                  }] : []}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {claim.province} {claim.city} {claim.district} · {claim.streetName}
              </p>
            </section>
          </div>
        )}

        {activeTab === "gallery" && EmptyStates.galleryComing}

        {activeTab === "activities" && (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <EmptyState icon="📅" title="暂无活动" description="敬请期待" size="sm" />
            ) : (
              activities.map((act) => (
                <div key={act.id} className="card p-4">
                  <div className="flex gap-4">
                    {act.coverImage && (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        <img src={act.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{act.title}</h4>
                      {act.eventTime && <p className="text-xs text-gray-400 mt-1">{new Date(act.eventTime).toLocaleString("zh-CN")}</p>}
                      {act.price != null && act.price > 0 ? (
                        <p className="text-sm text-primary-600 font-medium mt-1">¥{(act.price / 100).toFixed(2)}</p>
                      ) : (
                        <p className="text-xs text-green-500 mt-1">免费</p>
                      )}
                      {act.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{act.description}</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
