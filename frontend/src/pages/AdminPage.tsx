import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient, { activityApi } from "../api/client";
import { SkeletonDashboard } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";

interface DashboardStats {
  totalUsers: number; totalTeachers: number; approvedTeachers: number; pendingTeachers: number;
  totalClaims: number; totalActivities: number; pendingActivities: number; totalPageViews: number;
  instrumentDistribution: { name: string; count: number }[];
  genderDistribution: { male: number; female: number };
  streetDistribution: { street: string; count: number }[];
  parentStats: { beginnerCount: number; experiencedCount: number; totalParents: number };
}

interface PendingItem {
  id: string; realName?: string; title?: string;
  user?: { id: string; nickname: string | null; phone?: string };
  teacher?: { id: string; nickname: string | null };
  status: string; createdAt: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingTeachers, setPendingTeachers] = useState<PendingItem[]>([]);
  const [pendingActivities, setPendingActivities] = useState<PendingItem[]>([]);
  const [detailView, setDetailView] = useState<{type: string; title: string; role?: string} | null>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!localStorage.getItem("access_token")) { navigate("/auth"); return; } loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const [sRes, tRes, aRes]: any[] = await Promise.all([
        apiClient.get("/admin/dashboard"),
        apiClient.get("/admin/teachers/pending").catch(() => ({ data: [] })),
        apiClient.get("/admin/activities/pending").catch(() => ({ data: [] })),
      ]);
      setStats(sRes?.data || sRes);
      setPendingTeachers(tRes?.data || tRes || []);
      setPendingActivities(aRes?.data || aRes || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function handleReviewTeacher(authId: string, approved: boolean) {
    try { await apiClient.post("/admin/teachers/review", { authId, approved }); setPendingTeachers((p) => p.filter((t) => t.id !== authId)); alert(approved ? "已通过" : "已驳回"); }
    catch (e: any) { alert(e?.message || "操作失败"); }
  }
  async function handleCardClick(type: string, title: string, role?: string) {
    setDetailView({ type, title, role }); setLoadingDetail(true);
    try { const res: any = await apiClient.get("/admin/users", { params: { role, pageSize: 200 } }); setDetailItems(res?.data?.items || res?.items || []); }
    catch(e) { console.error(e); } finally { setLoadingDetail(false); }
  }
  async function handleReviewActivity(activityId: string, approved: boolean) {
    try { await apiClient.post("/admin/activities/review", { activityId, approved }); setPendingActivities((p) => p.filter((a) => a.id !== activityId)); alert(approved ? "已通过" : "已驳回"); }
    catch (e: any) { alert(e?.message || "操作失败"); }
  }

  const tabs = [
    { key: "dashboard" as const, label: "数据看板", icon: "📊" },
    { key: "users" as const, label: "用户列表", icon: "👥" },
    { key: "teachers" as const, label: "导师审核", icon: "👤", badge: pendingTeachers.length },
    { key: "activities" as const, label: "活动审核", icon: "📅", badge: pendingActivities.length },
    { key: "claims" as const, label: "认领管理", icon: "📍" },
    { key: "modifications" as const, label: "修改/释放审核", icon: "✏️" },
    { key: "duplicates" as const, label: "可疑账号", icon: "⚠️" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">管理后台</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => { localStorage.removeItem("access_token"); localStorage.removeItem("user"); navigate("/auth"); }}
            className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50">🏠 登录页</button>
          <button onClick={() => navigate("/")} className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full hover:bg-gray-200">首页</button>
        </div>
      </div>
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors relative ${tab === t.key ? "bg-primary-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <span>{t.icon}</span><span>{t.label}</span>
            {t.badge != null && t.badge > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{t.badge > 99 ? "99+" : t.badge}</span>}
          </button>
        ))}
      </div>

      {loading ? <SkeletonDashboard /> : (<>
        {tab === "dashboard" && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { onClick: () => handleCardClick("all", "总用户列表"), label: "总用户", value: stats.totalUsers, color: "bg-blue-50 text-blue-700" },
                { onClick: () => handleCardClick("teachers", "已认证导师列表", "TEACHER"), label: "已认证导师", value: stats.approvedTeachers, color: "bg-green-50 text-green-700" },
                { onClick: () => setTab("teachers"), label: "待审核", value: stats.pendingTeachers, color: "bg-yellow-50 text-yellow-700" },
                { onClick: () => setTab("claims"), label: "认领数", value: stats.totalClaims, color: "bg-purple-50 text-purple-700" },
                { onClick: () => handleCardClick("parents", "街坊列表", "PARENT"), label: "街坊", value: stats.parentStats?.totalParents || 0, color: "bg-blue-50 text-blue-700" },
              ].map((item: any) => (
                <div key={item.label} onClick={item.onClick} className={`card p-4 cursor-pointer hover:shadow-md transition-shadow ${item.color}`}>
                  <p className="text-xs opacity-70">{item.label}</p><p className="text-2xl font-bold mt-1">{item.value}</p>
                </div>
              ))}
            </div>
            {stats.instrumentDistribution.length > 0 && (
              <div className="card p-4"><h3 className="font-medium text-sm mb-3">🎨 艺术门类分布</h3>
                <div className="space-y-2">{stats.instrumentDistribution.map((inst) => (
                  <div key={inst.name} className="flex items-center gap-3"><span className="text-sm w-20">{inst.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden"><div className="bg-primary-500 h-full rounded-full" style={{ width: `${Math.min(100, (inst.count / Math.max(...stats.instrumentDistribution.map((i) => i.count)) * 100))}%` }} /></div>
                    <span className="text-xs text-gray-400">{inst.count}</span></div>))}
                </div></div>)}
            {stats.streetDistribution?.length > 0 && (
              <div className="card p-4"><h3 className="font-medium text-sm mb-3">📍 街道分布</h3>
                <div className="flex flex-wrap gap-2">{stats.streetDistribution.slice(0, 20).map((s) => (
                  <span key={s.street} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{s.street} <span className="text-gray-400 ml-1">{s.count}</span></span>))}
                </div></div>)}
            {stats.genderDistribution && (
              <div className="card p-4"><h3 className="font-medium text-sm mb-3">👫 男女比例</h3>
                <div className="flex items-center gap-4"><div className="flex-1"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>男</span><span>{stats.genderDistribution.male}</span></div><div className="bg-gray-100 rounded-full h-3 overflow-hidden"><div className="bg-blue-400 h-full rounded-full" style={{ width: `${stats.genderDistribution.male + stats.genderDistribution.female > 0 ? (stats.genderDistribution.male / (stats.genderDistribution.male + stats.genderDistribution.female) * 100) : 0}%` }} /></div></div>
                  <div className="flex-1"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>女</span><span>{stats.genderDistribution.female}</span></div><div className="bg-gray-100 rounded-full h-3 overflow-hidden"><div className="bg-pink-400 h-full rounded-full" style={{ width: `${stats.genderDistribution.male + stats.genderDistribution.female > 0 ? (stats.genderDistribution.female / (stats.genderDistribution.male + stats.genderDistribution.female) * 100) : 0}%` }} /></div></div></div></div>)}
            {detailView && <DetailPanel detailView={detailView} items={detailItems} loading={loadingDetail} onClose={() => { setDetailView(null); setDetailItems([]); }} />}
          </div>)}
        {tab === "users" && <UsersTab />}
        {tab === "teachers" && (
          <div className="space-y-3">{pendingTeachers.length === 0 ? <EmptyState icon="👤" title="暂无待审核导师" size="sm" />
            : pendingTeachers.map((t: any) => <PendingTeacherCard key={t.id} teacher={t} onReview={handleReviewTeacher} />)}
          </div>)}
        {tab === "activities" && (
          <div className="space-y-4">
            {/* Admin can also create activities for teachers */}
            <AdminCreateActivityForm onCreated={loadDashboard} />
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">待审核活动</h3>
              {pendingActivities.length === 0 ? <EmptyState icon="📅" title="暂无待审核活动" size="sm" />
                : pendingActivities.map((a: any) => (
                  <div key={a.id} className="card p-4"><div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{a.title}</span><span className="text-xs text-gray-400">{a.teacher?.nickname || ""}</span></div>
                    <div className="flex gap-2 mt-3"><button onClick={() => handleReviewActivity(a.id, true)} className="flex-1 bg-green-500 text-white rounded-full py-2 text-xs font-medium hover:bg-green-600">通过</button>
                      <button onClick={() => handleReviewActivity(a.id, false)} className="flex-1 bg-red-100 text-red-600 rounded-full py-2 text-xs font-medium hover:bg-red-200">驳回</button></div></div>))}
            </div>
          </div>)}
        {tab === "claims" && <ClaimsList />}
        {tab === "modifications" && <ModificationsList />}
        {tab === "duplicates" && <DuplicateDetection />}
      </>)}
    </div>
  );
}

// ===== Detail Panel =====
function DetailPanel({ detailView, items, loading, onClose }: { detailView: { type: string; title: string; role?: string }; items: any[]; loading: boolean; onClose: () => void }) {
  return (
    <div className="card p-4 mt-4"><div className="flex items-center justify-between mb-4"><h3 className="font-medium text-sm">{detailView.title}（{items.length}人）</h3><button onClick={onClose} className="text-xs text-gray-400 hover:text-primary-600">← 收起</button></div>
      {loading ? <EmptyState icon="⏳" title="加载中..." size="sm" /> : items.length === 0 ? <EmptyState icon="📋" title="暂无数据" size="sm" /> : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto"><table className="w-full text-xs"><thead className="sticky top-0 bg-white"><tr className="border-b border-gray-100"><th className="text-left py-2 pr-3 text-gray-400 font-medium">手机号</th><th className="text-left py-2 pr-3 text-gray-400 font-medium">昵称</th><th className="text-left py-2 pr-3 text-gray-400 font-medium">角色</th><th className="text-left py-2 pr-3 text-gray-400 font-medium">所在区域</th><th className="text-left py-2 pr-3 text-gray-400 font-medium">状态</th><th className="text-left py-2 text-gray-400 font-medium">注册时间</th></tr></thead>
          <tbody>{items.map((u: any) => (<tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50"><td className="py-2 pr-3 text-gray-900">{u.phone || "—"}</td><td className="py-2 pr-3 text-gray-900">{u.nickname || "—"}</td><td className="py-2 pr-3 text-gray-500">{u.role === "ADMIN" ? "管理员" : u.role === "TEACHER" ? "体验导师" : "街坊"}</td><td className="py-2 pr-3 text-gray-500 text-[10px] max-w-[120px] truncate">{u.residentialArea || "—"}</td><td className="py-2 pr-3">{u.teacherAuth ? <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${u.teacherAuth.status === "APPROVED" ? "bg-green-100 text-green-600" : u.teacherAuth.status === "PENDING" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}>{u.teacherAuth.status === "APPROVED" ? "已认证" : u.teacherAuth.status === "PENDING" ? "待审核" : "被驳回"}</span> : <span className="text-gray-300">—</span>}</td><td className="py-2 text-gray-400 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td></tr>))}</tbody></table></div>)}
    </div>);
}

// ===== Admin Create Activity Form =====
function AdminCreateActivityForm({ onCreated }: { onCreated: () => void }) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) { alert("请输入活动标题"); return; }
    setSubmitting(true);
    try {
      await activityApi.create({
        title,
        description: description || undefined,
        autoApprove: true,
      } as any);
      alert("活动已创建，已自动通过审核");
      setTitle(""); setDescription(""); setTeacherEmail("");
      setShow(false);
      onCreated();
    } catch (e: any) { alert(e?.message || "创建失败"); }
    finally { setSubmitting(false); }
  }

  if (!show) {
    return (
      <button onClick={() => setShow(true)}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:text-primary-600 hover:border-primary-300 transition-colors">
        + 管理员代发活动（帮助各地老师组织活动）
      </button>
    );
  }

  return (
    <div className="card p-4 border-l-4 border-primary-400">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">📅 管理员发布活动</h4>
        <button onClick={() => setShow(false)} className="text-xs text-gray-400 hover:text-gray-600">收起</button>
      </div>
      <p className="text-xs text-gray-400 mb-3">帮助各地老师组织活动，管理员创建的活动直接通过审核</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field text-sm" placeholder="活动标题（如：周末艺术下午茶）" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field text-sm resize-none" rows={2} maxLength={200} placeholder="活动介绍（可选）" />
        <button type="submit" disabled={submitting} className="btn-primary w-full text-sm">
          {submitting ? "发布中..." : "发布活动（自动通过审核）"}
        </button>
      </form>
    </div>
  );
}

// ===== Users Tab =====
function UsersTab() {
  const [role, setRole] = useState(""); const [users, setUsers] = useState<any[]>([]); const [loading, setLoading] = useState(false); const [page, setPage] = useState(1);
  useEffect(() => { loadUsers(); }, [role, page]);
  async function loadUsers() { setLoading(true); try { const res: any = await apiClient.get("/admin/users", { params: { role: role || undefined, page, pageSize: 50 } }); setUsers(res?.data?.items || res?.items || []); } catch (e) { console.error(e); } finally { setLoading(false); } }
  return (
    <div className="space-y-4"><div className="flex gap-2 flex-wrap">{["", "TEACHER", "PARENT", "ADMIN"].map((r) => (<button key={r} onClick={() => { setRole(r); setPage(1); }} className={`text-xs px-4 py-2 rounded-full transition-colors ${role === r ? "bg-primary-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{r === "" ? "全部" : r === "TEACHER" ? "体验导师" : r === "PARENT" ? "街坊" : "管理员"}</button>))}</div>
      {loading ? <EmptyState icon="⏳" title="加载中..." size="sm" /> : (
        <div className="overflow-x-auto card p-4"><table className="w-full text-xs"><thead><tr className="border-b border-gray-100"><th className="text-left py-2 pr-3 text-gray-400 font-medium">手机号</th><th className="text-left py-2 pr-3 text-gray-400 font-medium">昵称</th><th className="text-left py-2 pr-3 text-gray-400 font-medium">角色</th><th className="text-left py-2 pr-3 text-gray-400 font-medium">区域</th><th className="text-left py-2 pr-3 text-gray-400 font-medium">积分</th><th className="text-left py-2 text-gray-400 font-medium">注册时间</th></tr></thead>
          <tbody>{users.map((u: any) => (<tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50"><td className="py-2 pr-3 text-gray-900">{u.phone || "—"}</td><td className="py-2 pr-3 text-gray-900">{u.nickname || "—"}</td><td className="py-2 pr-3 text-gray-500">{u.role === "ADMIN" ? "管理员" : u.role === "TEACHER" ? "体验导师" : "街坊"}</td><td className="py-2 pr-3 text-gray-500 text-[10px] max-w-[100px] truncate">{u.residentialArea || "—"}</td><td className="py-2 pr-3 text-amber-600">{u.points || 0}</td><td className="py-2 text-gray-400 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td></tr>))}</tbody></table></div>)}
    </div>);
}

// ===== Pending Teacher Card =====
function PendingTeacherCard({ teacher, onReview }: { teacher: any; onReview: (id: string, approved: boolean) => void }) {
  const [expanded, setExpanded] = useState(false); const t = teacher;
  return (
    <div className="card p-4"><div className="flex items-center justify-between mb-2"><div><span className="font-medium text-sm">{t.user?.nickname || "未知"}</span><span className="text-xs text-gray-400 ml-2">{t.realName}</span><span className="text-xs text-gray-300 ml-2">{t.gender || ""}</span></div><span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString("zh-CN")}</span></div>
      <p className="text-xs text-gray-500">手机：{t.user?.phone || "无"}</p>
      <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary-600 mt-2 hover:underline">{expanded ? "收起详情 ↑" : "查看详情 ↓"}</button>
      {expanded && (<div className="mt-3 space-y-2 text-xs border-t pt-3">
        {t.idCardNo && <p><span className="text-gray-400">身份证：</span>{t.idCardNo}</p>}
        {t.highestDegree && <p><span className="text-gray-400">最高学历：</span>{t.highestDegree}</p>}
        {t.graduationSchool && <p><span className="text-gray-400">毕业院校：</span>{t.graduationSchool}</p>}
        {t.major && <p><span className="text-gray-400">专业：</span>{t.major}</p>}
        {t.experienceYears && <p><span className="text-gray-400">指导年限：</span>{t.experienceYears}</p>}
        {t.experienceItems && <p><span className="text-gray-400">体验项目：</span>{t.experienceItems}</p>}
        <div className="grid grid-cols-2 gap-2 mt-2">{t.idCardFront && <div><span className="text-gray-400">身份证正面：</span><img src={t.idCardFront} alt="" className="mt-1 rounded max-h-32 object-cover" /></div>}{t.idCardBack && <div><span className="text-gray-400">身份证反面：</span><img src={t.idCardBack} alt="" className="mt-1 rounded max-h-32 object-cover" /></div>}{t.graduationCert && <div><span className="text-gray-400">毕业证：</span><img src={t.graduationCert} alt="" className="mt-1 rounded max-h-32 object-cover" /></div>}{t.teacherCert && <div><span className="text-gray-400">教师资格证：</span><img src={t.teacherCert} alt="" className="mt-1 rounded max-h-32 object-cover" /></div>}</div></div>)}
      <div className="flex gap-2 mt-3"><button onClick={() => onReview(t.id, true)} className="flex-1 bg-green-500 text-white rounded-full py-2 text-xs font-medium hover:bg-green-600">通过</button><button onClick={() => onReview(t.id, false)} className="flex-1 bg-red-100 text-red-600 rounded-full py-2 text-xs font-medium hover:bg-red-200">驳回</button></div></div>);
}

// ===== Duplicate Detection =====
function DuplicateDetection() {
  const [duplicates, setDuplicates] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { apiClient.get("/admin/duplicates").then((res: any) => { setDuplicates(Array.isArray(res?.data || res) ? (res?.data || res) : []); }).catch(console.error).finally(() => setLoading(false)); }, []);
  if (loading) return <EmptyState icon="⏳" title="加载中..." size="sm" />;
  if (duplicates.length === 0) return <EmptyState icon="✅" title="未发现可疑的多账号注册" size="sm" />;
  return (<div className="space-y-3">{duplicates.map((d: any, idx: number) => (<div key={idx} className="card p-4 border-l-4 border-amber-400"><div className="flex items-center gap-2 mb-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.confidence === "high" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>{d.confidence === "high" ? "高度疑似" : "可能重复"}</span><span className="font-medium text-sm">{d.reason}</span><span className="text-sm text-gray-500">: {d.realName}</span></div><p className="text-xs text-gray-400 mb-2">以下 {d.accounts.length} 个账号使用相同真实姓名</p>{d.accounts.map((a: any, i: number) => (<div key={i} className="text-xs text-gray-600 py-1.5 border-t border-gray-50 flex items-center gap-3"><span className="w-28 truncate">{a.phone || "无手机"}</span><span className="text-gray-400">{a.nickname || "未设置昵称"}</span><span className={`ml-auto ${a.status === "APPROVED" ? "text-green-500" : "text-yellow-500"}`}>{a.status === "APPROVED" ? "已通过" : "待审核"}</span></div>))}</div>))}</div>);
}

// ===== Claims List =====
function ClaimsList() {
  const [claims, setClaims] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { apiClient.get("/admin/claims").then((res: any) => { setClaims(Array.isArray(res?.data?.items || res?.items) ? (res?.data?.items || res?.items) : []); }).catch(console.error).finally(() => setLoading(false)); }, []);
  if (loading) return <EmptyState icon="⏳" title="加载中..." size="sm" />;
  if (claims.length === 0) return <EmptyState icon="📍" title="暂无认领记录" size="sm" />;
  return (<div className="space-y-2">{claims.map((c: any) => (<div key={c.id} className="card p-3 flex items-center justify-between"><div><p className="text-sm">{c.streetName} · {c.instrument?.name}</p><p className="text-xs text-gray-400">{c.teacher?.user?.nickname || "未知"}</p></div><span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "ACTIVE" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>{c.status === "ACTIVE" ? "活跃" : "已释放"}</span></div>))}</div>);
}

// ===== Modifications List =====
function ModificationsList() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  function loadMods() { apiClient.get("/admin/claims/modifications").then((res: any) => { setItems(res?.data || res || []); }).catch(console.error); }
  useEffect(() => { loadMods(); }, []);
  async function approveModify(id: string) { try { await apiClient.post(`/admin/claims/${id}/approve-modify`); alert("已通过"); loadMods(); } catch(e: any) { alert(e?.message || "失败"); } }
  async function rejectModify(id: string) { try { await apiClient.post(`/admin/claims/${id}/reject-modify`); alert("已驳回"); loadMods(); } catch(e: any) { alert(e?.message || "失败"); } }
  async function approveRelease(id: string) { try { await apiClient.post(`/admin/claims/${id}/approve-release`); alert("已释放"); loadMods(); } catch(e: any) { alert(e?.message || "失败"); } }
  async function rejectRelease(id: string) { try { await apiClient.post(`/admin/claims/${id}/reject-release`); alert("已驳回"); loadMods(); } catch(e: any) { alert(e?.message || "失败"); } }
  if (loading) return <div className="card p-8 text-center text-gray-400 text-sm">加载中...</div>;
  if (items.length === 0) return <EmptyState icon="✏️" title="暂无待审核的修改/释放申请" size="sm" />;
  return (<div className="space-y-3">{items.map((c: any) => (<div key={c.id} className="card p-4"><div className="flex items-center justify-between mb-2"><div><span className="font-medium text-sm">{c.teacher?.user?.nickname || "未知"}</span><span className="text-xs text-gray-400 ml-2">{c.streetName} · {c.instrument?.name}</span></div></div>
    {c.modifyStatus === "PENDING" && c.modifyData && <div className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2 mb-2">📝 修改申请：{c.modifyData}</div>}
    {c.releaseRequested && <div className="text-xs text-red-600 bg-red-50 rounded px-3 py-2 mb-2">🗑 释放申请</div>}
    <div className="flex gap-2">{c.modifyStatus === "PENDING" && <><button onClick={() => approveModify(c.id)} className="flex-1 bg-green-500 text-white rounded-full py-1.5 text-xs">通过修改</button><button onClick={() => rejectModify(c.id)} className="flex-1 bg-red-100 text-red-600 rounded-full py-1.5 text-xs">驳回修改</button></>}{c.releaseRequested && <><button onClick={() => approveRelease(c.id)} className="flex-1 bg-green-500 text-white rounded-full py-1.5 text-xs">通过释放</button><button onClick={() => rejectRelease(c.id)} className="flex-1 bg-red-100 text-red-600 rounded-full py-1.5 text-xs">驳回释放</button></>}</div></div>))}</div>);
}
