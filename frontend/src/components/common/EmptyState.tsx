import type { ReactNode } from "react";

interface EmptyStateProps {
  /** 图标 emoji，默认 📭 */
  icon?: string;
  /** 主标题 */
  title?: string;
  /** 副标题/描述 */
  description?: string;
  /** 可选的操作按钮 */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** 尺寸变体 */
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
}

const sizeMap = {
  sm: { icon: "text-2xl", title: "text-xs", desc: "text-[10px]", padding: "py-6" },
  md: { icon: "text-4xl", title: "text-sm", desc: "text-xs", padding: "py-10" },
  lg: { icon: "text-5xl", title: "text-base", desc: "text-sm", padding: "py-16" },
};

/**
 * 统一空状态组件
 *
 * 使用示例:
 *   <EmptyState icon="🎵" title="暂无导师" description="附近还没有认证的体验导师" />
 *   <EmptyState icon="📅" title="暂无活动" action={{ label: "发布活动", onClick: () => {} }} />
 */
export default function EmptyState({
  icon = "📭",
  title,
  description,
  action,
  size = "md",
  className = "",
  children,
}: EmptyStateProps) {
  const s = sizeMap[size];

  return (
    <div className={`text-center text-gray-400 ${s.padding} ${className}`}>
      <div className={`${s.icon} mb-2`}>{icon}</div>
      {title && <p className={`${s.title} text-gray-500 mb-1`}>{title}</p>}
      {description && <p className={`${s.desc} text-gray-400`}>{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-5 py-2 bg-primary-700 text-white rounded-full text-xs font-medium
                     hover:bg-primary-800 active:bg-primary-900 transition-colors"
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  );
}

/* ===== 预设空状态（全项目统一文案） ===== */

export const EmptyStates = {
  /** 无搜索结果 */
  noResults: (
    <EmptyState icon="🔍" title="没有找到匹配的结果" description="试试其他关键词或调整筛选条件" />
  ),
  /** 附近无导师 */
  noNearbyTeachers: (
    <EmptyState
      icon="📍"
      title="附近还没有体验导师"
      description="成为第一个认领街道的人吧"
    />
  ),
  /** 暂无社区服务者 */
  noServices: (
    <EmptyState
      icon="🔧"
      title="附近暂无社区生活服务者"
      description="成为生活链接者，提供社区服务"
    />
  ),
  /** 暂无活动 */
  noActivities: (
    <EmptyState
      icon="📅"
      title="暂无社区活动"
      description="附近体验导师发布的活动会显示在这里"
    />
  ),
  /** 暂无留言 */
  noMessages: <EmptyState icon="💬" title="暂无留言" description="有新的留言时会显示在这里" />,
  /** 暂无商品 */
  noProducts: (
    <EmptyState icon="🎸" title="商城暂无商品" description="导师会在后台发布乐器及相关商品" />
  ),
  /** 暂无数据（通用） */
  noData: <EmptyState icon="📋" title="暂无数据" />,
  /** 作品集筹备中 */
  galleryComing: (
    <EmptyState
      icon="🎨"
      title="作品集正在筹备中"
      description="导师将在这里展示教学成果与演奏片段"
    />
  ),
  /** 未认证 */
  notAuthenticated: (
    <EmptyState icon="🎓" title="你还没有申请成为体验导师" description="立即申请，开始你的社区艺术体验之旅" />
  ),
  /** 页面不存在 */
  notFound: <EmptyState icon="😕" title="页面不存在" description="未找到你要访问的内容" />,
  /** 暂无需求 */
  noDemands: <EmptyState icon="📭" title="暂无需求" description="新的生源需求会出现在这里" />,
};
