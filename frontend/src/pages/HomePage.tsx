import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/common/MapView";
import TeacherCard from "../components/common/TeacherCard";
import { SkeletonTeacherList } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { claimApi } from "../api/client";
import type { StreetClaim } from "../types";

export default function HomePage() {
  const navigate = useNavigate();
  const [nearby, setNearby] = useState<StreetClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);

  useEffect(() => {
    // 获取用户位置
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords);
        loadNearby(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // 定位失败，使用默认坐标
        loadNearby(23.12, 113.324);
      }
    );
  }, []);

  async function loadNearby(lat: number, lng: number) {
    try {
      const res: any = await claimApi.nearby(lat, lng, 3000);
      setNearby(res?.data || res || []);
    } catch (e) {
      console.error("加载附近体验导师失败", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="relative">
      {/* 地图区域 */}
      <div className="h-[55vh] md:h-[65vh]">
        <MapView
          className="w-full h-full rounded-none"
          center={location ? [location.longitude, location.latitude] : [113.324, 23.12]}
          markers={nearby.map((c) => ({
            position: [c.lng || 113.324, c.lat || 23.12],
            label: c.teacher?.user.nickname || "",
          }))}
        />
      </div>

      {/* 搜索入口 */}
      <button
        onClick={() => navigate("/search")}
        className="absolute top-4 left-4 right-4 mx-auto max-w-lg
                   bg-white/90 backdrop-blur-md rounded-full px-5 py-3
                   flex items-center gap-3 shadow-lg
                   text-gray-400 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        搜索街道、艺术门类或主理人…
      </button>

      {/* 附近体验导师列表 */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500">
            {loading
              ? "正在寻找附近 3km 内的艺术据点…"
              : `附近 3km 内的体验导师 (${nearby.length})`}
          </h2>
        </div>

        <div className="space-y-3 pb-8">
          {loading ? (
            <SkeletonTeacherList count={3} />
          ) : nearby.length > 0 ? (
            nearby.map((claim) => (
              <TeacherCard key={claim.id} claim={claim} />
            ))
          ) : (
            <EmptyState
              icon="📍"
              title="附近还没有体验导师"
              description="成为第一个认领街道的人吧"
            />
          )}
        </div>
      </div>
    </div>

    {/* Footer — outside the relative container so always visible */}
    <div className="text-center py-8 px-4 bg-white border-t border-gray-50">
      <p className="text-xs text-gray-400">严格审核资格，守护社区安全</p>
      <p className="text-xs text-gray-300 mt-1">杜绝线上教培广告 · 体验完美人生</p>
    </div>
    </>
  );
}
