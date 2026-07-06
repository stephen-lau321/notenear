/**
 * 统一骨架屏组件
 *
 * 使用示例:
 *   <SkeletonCard />           — 通用卡片骨架
 *   <SkeletonCard count={3} /> — 3张骨架卡片
 *   <SkeletonText lines={2} /> — 2行文字骨架
 *   <SkeletonAvatar size="lg" /> — 大头像骨架
 *   <SkeletonTeacherList />   — 导师列表骨架（预设）
 *   <SkeletonProductGrid />   — 商品网格骨架（预设）
 */

interface SkeletonBaseProps {
  className?: string;
}

/* ===== 基础原子骨架 ===== */

/** 矩形块骨架 */
export function SkeletonBlock({ className = "" }: SkeletonBaseProps) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

/** 圆形骨架 */
export function SkeletonCircle({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-20 h-20" };
  return <div className={`animate-pulse bg-gray-100 rounded-full ${sizes[size]} ${className}`} />;
}

/** 文字行骨架 */
export function SkeletonText({
  lines = 1,
  widths,
  className = "",
}: {
  lines?: number;
  widths?: string[];
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-gray-100 rounded h-3.5"
          style={{ width: widths?.[i] || (i === lines - 1 && lines > 1 ? "60%" : "100%") }}
        />
      ))}
    </div>
  );
}

/* ===== 组合骨架（卡片级） ===== */

/** 通用卡片骨架 */
export function SkeletonCard({ className = "" }: SkeletonBaseProps) {
  return (
    <div className={`card p-4 animate-pulse ${className}`}>
      <div className="flex gap-4">
        <SkeletonCircle size="md" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

/** 多张骨架卡片 */
export function SkeletonCardList({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/* ===== 预设业务骨架 ===== */

/** 导师列表骨架 */
export function SkeletonTeacherList({ count = 3 }: { count?: number }) {
  return <SkeletonCardList count={count} />;
}

/** 商品网格骨架（2列） */
export function SkeletonProductGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-3 animate-pulse">
          <div className="aspect-square bg-gray-100 rounded-lg mb-2" />
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-1" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** 活动列表骨架 */
export function SkeletonActivityList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-full mb-1" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** 留言列表骨架 */
export function SkeletonMessageList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
          <div className="flex items-start justify-between mb-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
          <SkeletonBlock className="h-10 w-full rounded-lg mb-2" />
          <div className="flex gap-2 mt-2">
            <SkeletonBlock className="h-9 flex-1 rounded-xl" />
            <SkeletonBlock className="h-9 w-16 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 导师详情页骨架 */
export function SkeletonTeacherDetail() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-100" />
      <div className="px-4 pb-4">
        <div className="-mt-10 flex items-end gap-4 mb-3">
          <SkeletonCircle size="lg" />
          <div className="pb-1 space-y-2">
            <SkeletonBlock className="h-5 w-28" />
            <SkeletonBlock className="h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-3">
          <SkeletonBlock className="h-10 flex-1 rounded-full" />
          <SkeletonBlock className="h-10 w-14 rounded-full" />
        </div>
      </div>
      <div className="border-b border-gray-100 px-4 mt-4">
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-4 w-14 mb-3" />
          ))}
        </div>
      </div>
      <div className="px-4 py-6 space-y-4">
        <SkeletonText lines={3} />
        <SkeletonBlock className="h-40 rounded-xl" />
      </div>
    </div>
  );
}

/** 管理后台数据看板骨架 */
export function SkeletonDashboard() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4">
            <SkeletonBlock className="h-3 w-16 mb-2" />
            <SkeletonBlock className="h-7 w-10" />
          </div>
        ))}
      </div>
      <div className="card p-4 space-y-3">
        <SkeletonBlock className="h-4 w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-2 flex-1 rounded-full" />
            <SkeletonBlock className="h-3 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 生源需求骨架 */
export function SkeletonDemandList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border rounded-xl p-4 animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <SkeletonBlock className="h-5 w-16 rounded-full" />
                <SkeletonBlock className="h-5 w-20 rounded-full" />
              </div>
              <SkeletonText lines={2} />
            </div>
            <SkeletonBlock className="h-12 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 认证状态骨架 */
export function SkeletonAuthStatus() {
  return (
    <div className="card p-6 animate-pulse space-y-2">
      <SkeletonBlock className="h-5 w-20 mb-2" />
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-4 w-1/2" />
    </div>
  );
}
