import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient, { teacherApi, claimApi, activityApi, userApi, contactApi } from "../api/client";
import type { TeacherAuth, StreetClaim } from "../types";
import { instrumentCategories, getAllInstrumentNames } from "../data/instruments";
import { chinaAreas } from "../data/china-areas";
import { schoolByProvince } from "../data/schools";
import { majorByCategory } from "../data/majors";
import { communityServices, backupTeacherServices } from "../data/services";
import StreetCommunityPicker from "../components/common/StreetCommunityPicker";
import { SkeletonTeacherList, SkeletonActivityList, SkeletonMessageList, SkeletonAuthStatus } from "../components/common/Skeleton";
import EmptyState, { EmptyStates } from "../components/common/EmptyState";
import { getTeacherAvatar } from "../utils/avatar";

// ===== Main Dashboard Router =====
export default function DashboardPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!token) { navigate("/auth"); return; }
  }, []);

  const isTeacher = user?.role === "TEACHER";
  // HOST: 正式HOST角色，或TEACHER认领冲突后被临时重定向（兼容过渡期）
  const isHost = user?.role === "HOST" || (user?.role === "TEACHER" && localStorage.getItem("user_role_type") === "HOST");
  const hostSubType = localStorage.getItem("host_sub_type") || "life"; // "art"=候补艺术导师, "life"=生活导师
  const isAdmin = user?.role === "ADMIN";

  if (isAdmin) {
    navigate("/admin");
    return null;
  }

  if (isHost) {
    return <HostDashboard user={user} hostSubType={hostSubType} />;
  }
  if (!isTeacher) {
    return <ParentDashboard user={user} />;
  }

  return <TeacherDashboard />;
}

// ===== Host Dashboard (生活链接者) =====
// 两个子类型：候补艺术导师(art) vs 生活导师(life)
function HostDashboard({ user, hostSubType }: { user: any; hostSubType: string }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"activities" | "messages" | "profile">("profile");

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_role_type");
    localStorage.removeItem("host_sub_type");
    navigate("/");
  }

  const isArtBackup = hostSubType === "art";
  const typeLabel = isArtBackup ? "候补艺术导师" : "生活导师";
  const typeBadge = isArtBackup ? "🎨 候补艺术导师" : "🔧 生活服务者";
  const typeColor = isArtBackup ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-amber-50 border-amber-200 text-amber-700";

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">{typeLabel}</h1>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full border ${typeColor}`}>{typeBadge}</span>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors">退出</button>
        </div>
      </div>

      {isArtBackup ? (
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs text-purple-700">
            🎨 作为候补艺术导师，当正式导师搬离后，你将优先获得认领资格。候补期间只能通过留言板与街坊互动，不能直接查看家长联系方式。如需成为正式导师，请确认目标街道+艺术门类未被独占认领后，<button onClick={() => { localStorage.removeItem("user_role_type"); localStorage.removeItem("host_sub_type"); window.location.reload(); }} className="underline font-medium">切换为体验导师</button>。
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs text-amber-700">
            🔧 作为生活导师，你可以提供社区生活技能服务（急开锁、保洁、维修、配送…），通过留言板与街坊互动。在平台规范下组织线下活动，活跃社区气氛。不能直接端对端联系家长。如需成为艺术导师，请<button onClick={() => navigate("/auth")} className="underline font-medium">重新选择身份</button>。
          </p>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "profile" as const, label: isArtBackup ? "候补资料" : "我的服务", icon: isArtBackup ? "🎨" : "🔧" },
          { key: "activities" as const, label: "组织活动", icon: "📅" },
          { key: "messages" as const, label: "邻里留言", icon: "💬" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors ${
              tab === t.key ? (isArtBackup ? "bg-purple-600 text-white" : "bg-amber-600 text-white") : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "profile" && <ConnectorProfileForm user={user} hostSubType={hostSubType} />}
      {tab === "activities" && <CreateActivityForm />}
      {tab === "messages" && <MessagesPanel />}
    </div>
  );
}
// ===== Connector Profile Form =====
// hostSubType: "art"=候补艺术导师, "life"=生活导师
function ConnectorProfileForm({ user, hostSubType }: { user: any; hostSubType: string }) {
  const isArtBackup = hostSubType === "art";
  const [connectorName, setConnectorName] = useState(user?.nickname || "");
  const [connectorGender, setConnectorGender] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [resProvince, setResProvince] = useState(""); const [resCity, setResCity] = useState("");
  const [resDistrict, setResDistrict] = useState(""); const [resStreet, setResStreet] = useState("");
  const [resCommunity, setResCommunity] = useState(""); const [resExtra, setResExtra] = useState("");
  // 候补艺术导师专用字段
  const [isBackup, setIsBackup] = useState(isArtBackup); // art类型默认开启候补
  const [backupDiscipline, setBackupDiscipline] = useState(""); // 候补艺术门类
  const [backupDisciplineCat, setBackupDisciplineCat] = useState("");
  const [backupStreet, setBackupStreet] = useState("");
  const [saving, setSaving] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState("");

  // 检查是否从体验导师认领冲突跳转过来
  useEffect(() => {
    const raw = localStorage.getItem("backup_claim_info");
    if (raw) {
      try {
        const info = JSON.parse(raw);
        setIsBackup(true);
        setBackupDiscipline(info.instrumentName || "");
        setBackupStreet(info.streetName || "");
        if (info.city && !resProvince) setResProvince(info.city);
        setRedirectNotice(
          `"${info.streetName}"的"${info.instrumentName}"已被认领，已为你预填候补信息。当该据点释放时，你将优先获得认领资格。`
        );
        localStorage.removeItem("backup_claim_info");
      } catch {}
    }
  }, []);

  function toggleService(name: string) { setSelectedServices((p) => p.includes(name) ? p.filter((s) => s !== name) : [...p, name]); }

  async function handleSave() {
    if (!connectorName.trim()) { alert("请填写姓名"); return; }
    if (!connectorGender) { alert("请选择性别"); return; }
    if (!resStreet) { alert("请选择街道"); return; }
    if (!resCommunity) { alert("请选择小区"); return; }
    if (isArtBackup && !backupDiscipline) { alert("请选择候补艺术门类"); return; }
    if (!isArtBackup && selectedServices.length === 0) { alert("请至少选择一项生活服务"); return; }
    setSaving(true);
    try {
      await contactApi.connectorRegister({
        services: selectedServices,
        province: resProvince, city: resCity, district: resDistrict,
        street: resStreet, community: resCommunity,
        isBackupTeacher: isArtBackup ? true : isBackup,
        backupInstrument: (isArtBackup || isBackup) ? backupDiscipline : undefined,
        backupStreet: (isArtBackup || isBackup) ? backupStreet : undefined,
        hostSubType,
      });
      await userApi.updateProfile({ nickname: connectorName.trim(), residentialArea: [resProvince, resCity, resDistrict, resStreet, resCommunity].filter(Boolean).join(" ") });
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      stored.nickname = connectorName.trim();
      localStorage.setItem("user", JSON.stringify(stored));
      alert("信息已保存！");
    } catch (e: any) { alert(e?.message || "保存失败"); }
    finally { setSaving(false); }
  }

  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-medium">{isArtBackup ? "候补艺术导师资料" : "我的社区服务"}</h3>

      {/* 从体验导师跳转的提示 */}
      {redirectNotice && (
        <div className="flex items-start gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
          <span>🔄</span>
          <span>{redirectNotice}</span>
        </div>
      )}

      {/* Name + Gender */}
      <div className="grid grid-cols-2 gap-2">
        <div><label className="block text-xs text-gray-500 mb-1">姓名 *</label><input type="text" value={connectorName} onChange={(e) => setConnectorName(e.target.value)} className="input-field text-sm" placeholder="你的姓名" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">性别 *</label><select value={connectorGender} onChange={(e) => setConnectorGender(e.target.value)} className="input-field text-sm"><option value="">请选择</option><option value="男">男</option><option value="女">女</option></select></div>
      </div>

      {/* Location */}
      <div><label className="block text-xs text-gray-500 mb-1">服务区域</label>
        <select value={resProvince} onChange={(e) => { setResProvince(e.target.value); setResCity(""); setResDistrict(""); }} className="input-field mb-1 text-sm"><option value="">省/直辖市</option>{chinaAreas.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}</select>
        {resProvince && <select value={resCity} onChange={(e) => { setResCity(e.target.value); setResDistrict(""); }} className="input-field mb-1 text-sm"><option value="">市</option>{chinaAreas.find((p) => p.name === resProvince)?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select>}
        {resCity && <select value={resDistrict} onChange={(e) => setResDistrict(e.target.value)} className="input-field mb-1 text-sm"><option value="">区/县</option>{chinaAreas.find((p) => p.name === resProvince)?.cities.find((c) => c.name === resCity)?.districts.map((d) => <option key={d} value={d}>{d}</option>)}</select>}
        <StreetCommunityPicker province={resProvince} city={resCity} district={resDistrict} street={resStreet} community={resCommunity} onStreetChange={setResStreet} onCommunityChange={setResCommunity} extra={resExtra} onExtraChange={setResExtra} required /></div>

      {/* ===== 候补艺术导师专有区域 ===== */}
      {isArtBackup && (
        <div className="border-t pt-4 space-y-3">
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
            <p className="text-xs text-purple-700 font-medium mb-1">🎨 候补艺术导师说明</p>
            <p className="text-xs text-purple-600">候补期间不显示在家长端，只能在留言板互动。当对应街道+艺术门类的正式导师释放据点后，你将优先获得认领资格。候补导师不能直接查看家长联系方式。</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">候补艺术门类 *</label>
            <select value={backupDisciplineCat} onChange={(e) => { setBackupDisciplineCat(e.target.value); setBackupDiscipline(""); }} className="input-field mb-2 text-sm">
              <option value="">选择艺术大类</option>
              {instrumentCategories.map((cat) => <option key={cat.category} value={cat.category}>{cat.category}</option>)}
            </select>
            {backupDisciplineCat && (
              <select value={backupDiscipline} onChange={(e) => setBackupDiscipline(e.target.value)} className="input-field text-sm">
                <option value="">选择具体门类</option>
                {instrumentCategories.find((c) => c.category === backupDisciplineCat)?.instruments.map((inst) => <option key={inst.name} value={inst.name}>{inst.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">候补街道</label>
            <input type="text" value={backupStreet} onChange={(e) => setBackupStreet(e.target.value)} className="input-field text-sm" placeholder="你想候补的街道名称" />
            <p className="text-xs text-gray-400 mt-1">同一街道+同一艺术门类只能有一位正式导师，当该据点释放时你将被优先通知</p>
          </div>
        </div>
      )}

      {/* ===== 生活导师：仅显示社区服务 ===== */}
      {!isArtBackup && (
        <div>
          <label className="block text-xs text-gray-500 mb-2">提供的社区生活服务（多选，已选 {selectedServices.length} 项）</label>
          <div className="max-h-64 overflow-y-auto space-y-3 border rounded-xl p-3">
            {communityServices.map((cat) => (<div key={cat.category}><div className="text-xs font-medium text-gray-500 mb-1">{cat.category}</div><div className="flex flex-wrap gap-1.5">{cat.services.map((s) => { const active = selectedServices.includes(s); return (<button key={s} type="button" onClick={() => toggleService(s)} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${active ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-500 border-gray-200"}`}>{s}</button>); })}</div></div>))}
          </div>
        </div>
      )}

      {/* ===== 候补艺术导师：社区服务为可选项 ===== */}
      {isArtBackup && (
        <div>
          <label className="block text-xs text-gray-500 mb-2">附加社区服务（可选，已选 {selectedServices.length} 项）</label>
          <div className="max-h-48 overflow-y-auto space-y-3 border rounded-xl p-3">
            {communityServices.map((cat) => (<div key={cat.category}><div className="text-xs font-medium text-gray-500 mb-1">{cat.category}</div><div className="flex flex-wrap gap-1.5">{cat.services.map((s) => { const active = selectedServices.includes(s); return (<button key={s} type="button" onClick={() => toggleService(s)} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${active ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-500 border-gray-200"}`}>{s}</button>); })}</div></div>))}
          </div>
        </div>
      )}

      {/* ===== 生活导师不需要候补按钮 ===== */}
      {/* isArtBackup 的候补已在上方专有区域内置 */}

      <button onClick={handleSave} disabled={saving} className={`w-full text-sm text-white py-2.5 rounded-xl font-medium transition-colors ${isArtBackup ? "bg-purple-600 hover:bg-purple-700" : "bg-amber-600 hover:bg-amber-700"}`}>
        {saving ? "保存中..." : "保存信息"}
      </button>
    </div>
  );
}

// ===== Parent Dashboard (街坊) =====
function ParentDashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"teachers" | "services" | "activities" | "messages" | "profile">("teachers");

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">街坊中心</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">🏠 街坊</span>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors">退出</button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex overflow-x-auto gap-2 mb-6">
        {[
          { key: "teachers" as const, label: "找艺术搭子", icon: "🎨" },
          { key: "services" as const, label: "找社区服务", icon: "🔧" },
          { key: "activities" as const, label: "找活动", icon: "📅" },
          { key: "messages" as const, label: "看留言", icon: "💬" },
          { key: "profile" as const, label: "我的资料", icon: "✏️" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              tab === t.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "teachers" && <NearbyTeachersPanel />}
      {tab === "services" && <NearbyServicesPanel />}
      {tab === "activities" && <NearbyActivitiesPanel />}
      {tab === "profile" && <NeighborProfileForm user={user} />}
      {tab === "messages" && <MessagesPanel />}
    </div>
  );
}

// ===== Nearby Teachers Panel =====
function NearbyTeachersPanel() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [unlocking, setUnlocking] = useState<Record<string, boolean>>({});

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      try {
        const res: any = await apiClient.get("/claims/nearby", { params: { lat: pos.coords.latitude, lng: pos.coords.longitude, radius: 3000 } });
        setTeachers((res?.data || res || []).slice(0, 5));
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }, () => {
      apiClient.get("/claims/search", { params: { q: "", mode: "online" } }).then((res: any) => {
        setTeachers((res?.data || res || []).slice(0, 20));
      }).catch(console.error).finally(() => setLoading(false));
    }, { timeout: 5000 });
  }, []);

  async function handleUnlockPhone(targetUserId: string) {
    setUnlocking((p) => ({ ...p, [targetUserId]: true }));
    try {
      const res: any = await contactApi.unlockByPoints(targetUserId);
      const data = res?.data || res;
      setPhones((p) => ({ ...p, [targetUserId]: data.phone }));
      // Update local points
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      stored.points = Math.max(0, (stored.points || 0) - (data.pointsSpent || 5));
      localStorage.setItem("user", JSON.stringify(stored));
      alert(data.message || "已解锁");
    } catch (e: any) { alert(e?.message || "解锁失败"); }
    finally { setUnlocking((p) => ({ ...p, [targetUserId]: false })); }
  }

  if (loading) return <div className="px-4"><SkeletonTeacherList count={3} /></div>;
  if (teachers.length === 0) return <div className="px-4">{EmptyStates.noNearbyTeachers}</div>;

  return (
    <div className="space-y-3">
      {teachers.map((t: any) => {
        const tid = t.teacher?.userId || t.teacherId;
        return (
        <div key={t.id} className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-full bg-gray-100 ring-2 ring-primary-100 overflow-hidden shrink-0">
              <img src={getTeacherAvatar(t.teacher?.userId || t.teacherId || t.id, t.teacher?.user?.avatar)} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{t.teacher?.user?.nickname || "体验导师"}</p>
              <p className="text-xs text-gray-400">{t.streetName} · {t.instrument?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const msg = prompt("请输入留言内容：");
              if (msg?.trim()) {
                contactApi.sendMessage(tid, msg.trim()).then(() => alert("留言已发送！")).catch((e: any) => alert(e?.message || "发送失败"));
              }
            }} className="text-xs bg-primary-700 text-white px-3 py-1.5 rounded-full hover:bg-primary-800">
              💬 留言
            </button>
            {phones[tid] ? (
              <span className="text-xs text-green-600">📱 {phones[tid]}</span>
            ) : (
              <button onClick={() => handleUnlockPhone(tid)} disabled={unlocking[tid]}
                className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100">
                {unlocking[tid] ? "解锁中..." : "🪙 5积分解锁手机"}
              </button>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}

// ===== Nearby Services Panel (找社区服务) =====
function NearbyServicesPanel() {
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch users with teacherType HOST (life connectors)
    apiClient.get("/admin/users", { params: { role: "TEACHER", pageSize: 100 } })
      .then((res: any) => {
        const items = res?.data?.items || res?.items || [];
        // Filter to only show HOST type
        setConnectors(items.filter((u: any) => u.teacherAuth?.teacherType === "HOST"));
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="px-4"><SkeletonTeacherList count={3} /></div>;
  if (connectors.length === 0) return (
    EmptyStates.noServices
  );

  return (
    <div className="space-y-3">
      {connectors.map((u: any) => {
        const services = (() => { try { return JSON.parse(u.teacherAuth?.services || "[]"); } catch(e) { return []; } })();
        return (
          <div key={u.id} className="card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-lg">🔧</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{u.nickname || "生活链接者"}</p>
                <p className="text-xs text-gray-400">{u.residentialArea || "未知区域"}</p>
              </div>
            </div>
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {services.slice(0, 8).map((s: string) => (
                  <span key={s} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{s}</span>
                ))}
                {services.length > 8 && <span className="text-[10px] text-gray-400">+{services.length - 8}项</span>}
              </div>
            )}
            <button onClick={() => {
              const msg = prompt("请输入留言内容：");
              if (msg?.trim()) {
                contactApi.sendMessage(u.id, msg.trim()).then(() => alert("留言已发送！")).catch((e: any) => alert(e?.message || "发送失败"));
              }
            }} className="text-xs text-primary-600 mt-2 hover:underline">💬 留言联系</button>
          </div>
        );
      })}
    </div>
  );
}

// ===== Nearby Activities Panel =====
function NearbyActivitiesPanel() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/activities/my").then((res: any) => {
      setActivities((res?.data || res || []).filter((a: any) => a.status === "APPROVED"));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="px-4"><SkeletonActivityList count={2} /></div>;
  if (activities.length === 0) return (
    EmptyStates.noActivities
  );

  return (
    <div className="space-y-3">
      {activities.map((a: any) => (
        <div key={a.id} className="card p-4">
          <h4 className="font-medium text-sm">{a.title}</h4>
          {a.description && <p className="text-xs text-gray-500 mt-1">{a.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>👤 {a.teacher?.nickname || "体验导师"}</span>
            {a.price > 0 && <span>💰 ¥{(a.price / 100).toFixed(2)}</span>}
            {a.eventTime && <span>📅 {new Date(a.eventTime).toLocaleDateString("zh-CN")}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== Neighbor Profile Form (街坊/学员端) =====
// 与教师端的 ApplyTeacherForm 完全不同：学员端聚焦个人信息和学习需求
function NeighborProfileForm({ user }: { user: any }) {
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [phone, setPhone] = useState(user?.phone || "");
  // 学习模式：自己学 or 给孩子找
  const [learnMode, setLearnMode] = useState<"SELF" | "CHILD">(user?.experienceType === "CHILD" ? "CHILD" : "SELF");
  // 自己学字段
  const [selfName, setSelfName] = useState(user?.studentName || "");
  const [selfGender, setSelfGender] = useState(user?.selfGender || "");
  const [selfAge, setSelfAge] = useState(user?.age || "");
  const [selfLevel, setSelfLevel] = useState(user?.selfExperienceYears || "");
  // 孩子学字段
  const [childName, setChildName] = useState(user?.experienceType === "CHILD" ? (user?.studentName || "") : "");
  const [childGender, setChildGender] = useState(user?.childGender || "");
  const [childAge, setChildAge] = useState(user?.childAge || "");
  const [childGrade, setChildGrade] = useState(user?.childGrade || "");
  const [parentPhone, setParentPhone] = useState(user?.experienceType === "CHILD" ? (user?.phone || "") : "");
  const [childLevel, setChildLevel] = useState(user?.experienceLevel || "");
  // 偏好上课方式
  const [preferFormat, setPreferFormat] = useState(user?.experienceFormat || "");
  // 想学的艺术门类（最多2项）
  const [subjects, setSubjects] = useState(user?.experienceSubjects || "[]");
  // 位置
  const [resProvince, setResProvince] = useState("");
  const [resCity, setResCity] = useState("");
  const [resDistrict, setResDistrict] = useState("");
  const [resStreet, setResStreet] = useState("");
  const [resCommunity, setResCommunity] = useState("");
  const [resExtra, setResExtra] = useState("");
  const [saving, setSaving] = useState(false);

  const levels = ["零基础","1年以内","1-3年","3-5年","5年以上"];

  async function handleSave(e: any) {
    e.preventDefault();
    setSaving(true);
    const area = [resProvince, resCity, resDistrict, resStreet, resCommunity].filter(Boolean).join(" ");
    try {
      await userApi.updateProfile({
        nickname: nickname.trim() || undefined,
        phone: (learnMode === "CHILD" ? parentPhone : phone).trim() || undefined,
        residentialArea: area || undefined,
        experienceType: learnMode,
        experienceSubjects: subjects,
        studentName: (learnMode === "SELF" ? selfName : childName).trim() || undefined,
        selfGender: learnMode === "SELF" ? selfGender : undefined,
        age: learnMode === "SELF" ? (selfAge ? parseInt(String(selfAge)) : undefined) : undefined,
        selfExperienceYears: learnMode === "SELF" ? selfLevel : undefined,
        childGender: learnMode === "CHILD" ? childGender : undefined,
        childAge: learnMode === "CHILD" ? (childAge || undefined) : undefined,
        childGrade: learnMode === "CHILD" ? childGrade : undefined,
        experienceLevel: learnMode === "CHILD" ? childLevel : undefined,
        experienceFormat: preferFormat || undefined,
      });
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      stored.nickname = nickname.trim();
      stored.phone = (learnMode === "CHILD" ? parentPhone : phone).trim();
      localStorage.setItem("user", JSON.stringify(stored));
      alert("资料已保存");
    } catch(e: any) { alert(e?.message || "保存失败"); }
    finally { setSaving(false); }
  }

  // 切换学习模式时保留各自数据
  function switchMode(mode: "SELF" | "CHILD") {
    setLearnMode(mode);
  }

  return (
    <div className="card p-6">
      <h3 className="font-medium mb-1">学员资料</h3>
      <p className="text-xs text-gray-400 mb-4">完善资料，让导师更好地了解你的学习需求</p>

      <form onSubmit={handleSave} className="space-y-4">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">昵称</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="input-field text-sm" placeholder="你的昵称" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">手机号</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field text-sm" placeholder="手机号" maxLength={11} />
          </div>
        </div>

        {/* 所在位置 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">所在位置</label>
          <select value={resProvince} onChange={(e) => { setResProvince(e.target.value); setResCity(""); setResDistrict(""); }} className="input-field mb-1 text-sm">
            <option value="">省/直辖市</option>
            {chinaAreas.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          {resProvince && (
            <select value={resCity} onChange={(e) => { setResCity(e.target.value); setResDistrict(""); }} className="input-field mb-1 text-sm">
              <option value="">市</option>
              {chinaAreas.find((p) => p.name === resProvince)?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          )}
          {resCity && (
            <select value={resDistrict} onChange={(e) => setResDistrict(e.target.value)} className="input-field mb-1 text-sm">
              <option value="">区/县</option>
              {chinaAreas.find((p) => p.name === resProvince)?.cities.find((c) => c.name === resCity)?.districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <StreetCommunityPicker province={resProvince} city={resCity} district={resDistrict} street={resStreet} community={resCommunity} onStreetChange={setResStreet} onCommunityChange={setResCommunity} extra={resExtra} onExtraChange={setResExtra} required />
        </div>

        {/* ===== 学习模式切换 ===== */}
        <div className="border-t pt-4">
          <label className="block text-xs text-gray-500 mb-2">学习身份</label>
          <div className="flex bg-gray-100 rounded-full p-1 mb-4">
            <button type="button" onClick={() => switchMode("SELF")}
              className={`flex-1 py-2 text-sm rounded-full transition-all ${learnMode === "SELF" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}>
              🙋 我自己学
            </button>
            <button type="button" onClick={() => switchMode("CHILD")}
              className={`flex-1 py-2 text-sm rounded-full transition-all ${learnMode === "CHILD" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}>
              👶 给孩子找老师
            </button>
          </div>

          {/* ===== 我自己学 ===== */}
          {learnMode === "SELF" && (
            <div className="space-y-3 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-2">📝 填写你的学习信息</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={selfName} onChange={(e) => setSelfName(e.target.value)} className="input-field text-sm" placeholder="你的姓名" />
                <select value={selfGender} onChange={(e) => setSelfGender(e.target.value)} className="input-field text-sm">
                  <option value="">性别</option><option value="男">男</option><option value="女">女</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={selfAge} onChange={(e) => setSelfAge(e.target.value)} className="input-field text-sm" placeholder="年龄" min={0} max={99} />
                <select value={selfLevel} onChange={(e) => setSelfLevel(e.target.value)} className="input-field text-sm">
                  <option value="">学习基础</option>
                  {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ===== 给孩子找老师 ===== */}
          {learnMode === "CHILD" && (
            <div className="space-y-3 bg-pink-50/50 rounded-xl p-4 border border-pink-100">
              <p className="text-xs text-pink-600 font-medium mb-2">👶 填写孩子的学习信息</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} className="input-field text-sm" placeholder="孩子姓名" />
                <select value={childGender} onChange={(e) => setChildGender(e.target.value)} className="input-field text-sm">
                  <option value="">性别</option><option value="男">男</option><option value="女">女</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={childAge} onChange={(e) => setChildAge(e.target.value)} className="input-field text-sm" placeholder="孩子年龄" min={0} max={18} />
                <select value={childGrade} onChange={(e) => setChildGrade(e.target.value)} className="input-field text-sm">
                  <option value="">就读年级</option>
                  {["学前","幼儿园小班","幼儿园中班","幼儿园大班","小学一年级","小学二年级","小学三年级","小学四年级","小学五年级","小学六年级","初一","初二","初三","高一","高二","高三"].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="input-field text-sm" placeholder="家长联系电话" maxLength={11} />
                <select value={childLevel} onChange={(e) => setChildLevel(e.target.value)} className="input-field text-sm">
                  <option value="">学习基础</option>
                  {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* 偏好上课方式 — 两种模式共用 */}
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-2">偏好上课方式</label>
            <div className="flex bg-gray-100 rounded-full p-1">
              <button type="button" onClick={() => setPreferFormat("一对一")}
                className={`flex-1 py-2 text-sm rounded-full transition-all ${preferFormat === "一对一" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}>
                🧑‍🏫 一对一
              </button>
              <button type="button" onClick={() => setPreferFormat("一对多")}
                className={`flex-1 py-2 text-sm rounded-full transition-all ${preferFormat === "一对多" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}>
                👥 小班课
              </button>
            </div>
          </div>

          {/* 想学的艺术门类 — 两种模式共用 */}
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-2">想学的艺术门类（最多选2项）</label>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {instrumentCategories.map((cat) => (
                <div key={cat.category}>
                  <div className="text-[10px] text-gray-400 mb-1">{cat.category}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.instruments.map((inst) => {
                      const subs: string[] = (() => { try { return JSON.parse(subjects); } catch { return []; } })();
                      const active = subs.includes(inst.name);
                      return (
                        <button key={inst.name} type="button" onClick={() => {
                          let ns = [...subs];
                          if (active) ns = ns.filter((s) => s !== inst.name);
                          else if (ns.length < 2) ns.push(inst.name);
                          setSubjects(JSON.stringify(ns));
                        }} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${active ? "bg-primary-700 text-white border-primary-700" : "bg-white text-gray-500 border-gray-200 hover:border-primary-300"}`}>
                          {inst.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {(() => { try { const ss: string[] = JSON.parse(subjects); return ss.length > 0 ? <p className="text-xs text-primary-600 mt-2">✅ 已选：{ss.join("、")}</p> : null; } catch(e) { return null; }})()}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
          {saving ? "保存中..." : "保存学员资料"}
        </button>
      </form>
    </div>
  );
}

// ===== Teacher Dashboard (导师) =====
function TeacherDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  type Tab = 'status' | 'claim' | 'profile' | 'activity' | 'messages';
  const [tab, setTab] = useState<Tab>("status");
  const [auth, setAuth] = useState<TeacherAuth | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBuyPoints, setShowBuyPoints] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/auth"); return; }
    loadAuth();
  }, []);

  async function loadAuth() {
    try {
      const res: any = await teacherApi.getStatus();
      setAuth(res?.data || res || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "status", label: "认证状态", icon: "📋" },
    { key: "claim", label: "认领街道", icon: "📍" },
    { key: "profile", label: "导师认证", icon: "✏️" },
    { key: "activity", label: "发布活动", icon: "📅" },
    { key: "messages", label: "邻里留言", icon: "💬" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">我的艺术据点</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">🪙 {user?.points || 0} 积分</span>
          <button onClick={() => setShowBuyPoints(true)} className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full hover:bg-amber-600">+ 购买</button>
          <button onClick={() => navigate("/")} className="text-xs text-gray-400 hover:text-primary-600 transition-colors">返回首页</button>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors">退出登录</button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 -mx-4 px-4">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-primary-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {tab === "status" && <StatusTab auth={auth} loading={loading} onSwitchTab={() => setTab("profile")} onDataChange={loadAuth} />}
        {tab === "claim" && <ClaimStreetForm auth={auth} onSuccess={() => { loadAuth(); setTab("status"); }} />}
        {tab === "profile" && <ApplyTeacherForm onSuccess={() => { loadAuth(); setTab("status"); }} />}
        {tab === "activity" && <CreateActivityForm />}
        {tab === "messages" && <MessagesPanel />}
      </div>
      {showBuyPoints && <PointsPurchaseModal onClose={() => setShowBuyPoints(false)} />}
    </div>
  );
}

// ===== Points Purchase Modal =====
function PointsPurchaseModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const res: any = await contactApi.buyPoints(amount);
      const data = res?.data || res;
      alert(data.message || `已添加 ${amount} 积分`);
      // Update local user points
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      stored.points = data.points;
      localStorage.setItem("user", JSON.stringify(stored));
      onClose();
      window.location.reload();
    } catch (e: any) { alert(e?.message || "购买失败"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-center mb-2">🪙 购买积分</h3>
        <p className="text-xs text-gray-400 text-center mb-4">1元 = 1积分，扫码支付后点击确认</p>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <img src="/notenear/qr-payment.jpg" alt="收款码" className="w-48 h-48 object-contain border rounded-xl" />
        </div>

        {/* Amount selection */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[5, 10, 20, 50].map((a) => (
            <button key={a} onClick={() => setAmount(a)}
              className={`py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                amount === a ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-500"
              }`}>
              ¥{a}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-600 mb-4">
          支付 <span className="font-bold text-amber-600">¥{amount}.00</span> = <span className="font-bold text-amber-600">{amount}</span> 积分
        </p>

        <button onClick={handleBuy} disabled={loading}
          className="btn-primary w-full text-sm mb-2">
          {loading ? "处理中..." : `我已支付 ¥${amount}，确认购买`}
        </button>
        <button onClick={onClose} className="w-full text-xs text-gray-400 py-1">取消</button>
      </div>
    </div>
  );
}

// ===== Status Tab =====
function StatusTab({ auth, loading, onSwitchTab, onDataChange }: {
  auth: TeacherAuth | null;
  loading: boolean;
  onSwitchTab: () => void;
  onDataChange: () => void;
}) {
  return (
    <div className="card p-6">
      <h3 className="font-medium mb-4">认证状态</h3>
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      ) : auth ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              auth.status === "APPROVED" ? "bg-green-100 text-green-700"
              : auth.status === "REJECTED" ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
            }`}>
              {auth.status === "APPROVED" ? "已通过"
                : auth.status === "REJECTED" ? "已驳回"
                : "审核中"}
            </span>
            <span className="text-sm text-gray-500">{auth.realName}</span>
            <span className="text-xs text-gray-400">{auth.gender || ""}</span>
          </div>
          {(auth.graduationSchool || auth.major) && (
            <div className="text-sm text-gray-600">
              {auth.graduationSchool && <span>{auth.graduationSchool}</span>}
              {auth.graduationSchool && auth.major && <span> · </span>}
              {auth.major && <span>{auth.major}</span>}
            </div>
          )}
          {auth.experienceYears && (
            <div className="text-sm text-gray-500">
              🎵 指导年限：{auth.experienceYears}
            </div>
          )}
          {auth.streetClaims?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">已认领的街道：</p>
              {auth.streetClaims.map((c: any) => (
                <div key={c.id} className="text-sm text-gray-600 py-1 flex items-center gap-2">
                  <span className="text-primary-500">📍</span>
                  {c.streetName} · {c.instrument?.name}
                  <span className="flex gap-1 ml-auto">
                    {c.modifyStatus === "PENDING" && <span className="text-[10px] text-amber-500">修改审核中</span>}
                    {c.releaseRequested && <span className="text-[10px] text-red-400">释放审核中</span>}
                    {!c.modifyStatus && !c.releaseRequested && (
                      <>
                        <button onClick={async () => {
                          const newStreet = prompt("修改街道名称：", c.streetName);
                          if (!newStreet || newStreet === c.streetName) return;
                          try {
                            await apiClient.post(`/claims/${c.id}/modify`, { streetName: newStreet });
                            alert("修改申请已提交，等待审核");
                            onDataChange();
                          } catch(e: any) { alert(e?.message || "操作失败"); }
                        }} className="text-[10px] text-blue-400 hover:text-blue-600">修改</button>
                        <button onClick={async () => {
                          if (confirm(`确定申请释放"${c.streetName}"？需管理员审核。`)) {
                            try {
                              await apiClient.post(`/claims/${c.id}/release`);
                              alert("释放申请已提交，等待审核");
                              onDataChange();
                            } catch(e: any) { alert(e?.message || "操作失败"); }
                          }
                        }} className="text-[10px] text-red-400 hover:text-red-600">释放</button>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          {auth.status === "APPROVED" && (
            <button onClick={() => document.querySelector<HTMLElement>("[data-tab=claim]")?.click()}
              className="btn-primary text-sm mt-2">认领新街道</button>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-4">你还没有申请成为艺术主理人</p>
          <button onClick={onSwitchTab} className="btn-primary text-sm">立即申请</button>
        </div>
      )}
    </div>
  );
}

// ===== Claim Street Form =====
function ClaimStreetForm({ auth, onSuccess }: { auth: any; onSuccess: () => void }) {
  const [instrumentName, setInstrumentName] = useState("");
  const [streetName, setStreetName] = useState("");
  const [instCategory, setInstCategory] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [claimProvince, setClaimProvince] = useState("");
  const [claimCity, setClaimCity] = useState("");
  const [claimDistrict, setClaimDistrict] = useState("");
  const [streetSuggestions, setStreetSuggestions] = useState<any[]>([]);
  const [searchingStreet, setSearchingStreet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Location verification state
  const [locStatus, setLocStatus] = useState<"idle" | "detecting" | "detected" | "failed">("idle");
  const [detectedStreet, setDetectedStreet] = useState("");
  const [detectedDistrict, setDetectedDistrict] = useState("");
  const [detectedCity, setDetectedCity] = useState("");
  const [detectedLat, setDetectedLat] = useState<number | null>(null);
  const [detectedLng, setDetectedLng] = useState<number | null>(null);

  const isStudent = auth?.isStudent === true;
  const maxClaims = isStudent ? 2 : 3;
  const roleLabel = isStudent ? "陪练" : "艺术主理人";

  // On mount, try to detect location
  useEffect(() => {
    detectLocation();
  }, []);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setLocStatus("failed");
      return;
    }
    setLocStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res: any = await apiClient.post("/map/geocode", {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          const geo = res?.data || res;
          if (geo?.street) {
            setDetectedStreet(geo.street);
            setDetectedDistrict(geo.district || "");
            setDetectedCity(geo.city || "");
            setDetectedLat(pos.coords.latitude);
            setDetectedLng(pos.coords.longitude);
            setStreetName(geo.street);
            setLocStatus("detected");
          } else {
            setLocStatus("failed");
          }
        } catch {
          setLocStatus("failed");
        }
      },
      () => {
        setLocStatus("failed");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!instrumentName || !streetName) { setError("请填写完整信息"); return; }
    setSubmitting(true);
    try {
      // Submit with verified location data if available
      await claimApi.claim({
        instrumentName: instrumentName.trim(),
        streetName: streetName.trim(),
        lat: detectedLat ?? undefined,
        lng: detectedLng ?? undefined,
        district: detectedDistrict || undefined,
        city: detectedCity || undefined,
      });
      alert(`✅ 成功认领"${streetName}"的"${instrumentName}"！`);
      setInstrumentName(""); setStreetName("");
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || "认领失败";
      // 如果是因为已被认领而失败，引导注册为艺术链接者（替补）
      if (msg.includes("已被认领") || msg.includes("已存在")) {
        const shouldRedirect = window.confirm(
          `"${streetName}"的"${instrumentName}"已被其他导师认领。\n\n是否注册为「候补艺术导师」作为替补？\n当该据点释放时，你将优先获得认领资格。`
        );
        if (shouldRedirect) {
          // 保存预填信息到 localStorage
          localStorage.setItem("backup_claim_info", JSON.stringify({
            streetName: streetName.trim(),
            instrumentName: instrumentName.trim(),
            district: detectedDistrict || "",
            city: detectedCity || "",
          }));
          // 设置角色为 HOST + 候补艺术导师
          localStorage.setItem("user_role_type", "HOST");
          localStorage.setItem("host_sub_type", "art");
          // 刷新页面让 Dashboard 切换到链接者面板
          window.location.reload();
          return;
        }
      }
      setError(msg);
    }
    finally { setSubmitting(false); }
  }

  return (
    <div className="card p-6">
      <h3 className="font-medium mb-4">认领街道艺术据点</h3>

      {/* Location verification status */}
      {locStatus === "detecting" && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mb-4 animate-pulse">
          <span>📍</span> 正在检测你的位置…
        </div>
      )}
      {locStatus === "detected" && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4">
          <span>✅</span>
          已检测到你在 <strong>{detectedStreet}</strong>
          {detectedDistrict ? `（${detectedDistrict}` : ""}${detectedCity ? `${detectedCity}` : ""}）
          <button onClick={detectLocation} className="ml-2 underline hover:no-underline">重新检测</button>
        </div>
      )}
      {locStatus === "failed" && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
          <span>⚠️</span>
          位置检测失败，请手动输入街道名称
          <button onClick={detectLocation} className="ml-2 underline hover:no-underline">重试</button>
        </div>
      )}
      {locStatus === "idle" && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">
          <span>📍</span>
          <button onClick={detectLocation} className="underline hover:no-underline">验证我的位置</button>
          ，确保认领的是你所在的街道
        </div>
      )}

      {/* 认领规则提示 */}
      <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 rounded-lg px-3 py-2 mb-4">
        <span>{isStudent ? "🎓" : "🎵"}</span>
        {isStudent
          ? `陪练最多认领 ${maxClaims} 个据点，支持不同城市和街道`
          : `每位${roleLabel}最多认领 ${maxClaims} 个艺术据点，新增据点需在10公里范围内`}
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">艺术门类</label>
          <select value={instCategory} onChange={(e) => { setInstCategory(e.target.value); setInstrumentName(""); }}
            className="input-field mb-2">
            <option value="">请选择大类</option>
            {instrumentCategories.map((cat) => (
              <option key={cat.category} value={cat.category}>{cat.category}</option>
            ))}
          </select>
          {instCategory && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">选择门类</label>
              <select value={instrumentName} onChange={(e) => setInstrumentName(e.target.value)}
                className="input-field">
                <option value="">请选择门类</option>
                {instrumentCategories.find((c) => c.category === instCategory)?.instruments.map((inst) => (
                  <option key={inst.name} value={inst.name}>{inst.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div>
                  <div>
          <label className="block text-xs text-gray-500 mb-1">所在地</label>
          <select value={claimProvince} onChange={(e) => { setClaimProvince(e.target.value); setClaimCity(""); setClaimDistrict(""); }}
            className="input-field mb-2">
            <option value="">请选择省/自治区/直辖市</option>
            {chinaAreas.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          {claimProvince && (
            <select value={claimCity} onChange={(e) => { setClaimCity(e.target.value); setClaimDistrict(""); }}
              className="input-field mb-2">
              <option value="">请选择城市</option>
              {chinaAreas.find((p) => p.name === claimProvince)?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          )}
          {claimCity && (
            <select value={claimDistrict} onChange={(e) => setClaimDistrict(e.target.value)} className="input-field mb-2">
              <option value="">请选择区/县</option>
              {chinaAreas.find((p) => p.name === claimProvince)?.cities.find((c) => c.name === claimCity)?.districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>          <label className="block text-xs text-gray-500 mb-1">具体街道/路名</label>
          <input type="text" value={streetName} onChange={(e) => setStreetName(e.target.value)}
            placeholder="如：体育西路、建设路…" className={`input-field ${locStatus === "detected" ? "border-green-300 bg-green-50/50" : ""}`} />
          {locStatus === "detected" ? (
            <p className="text-xs text-green-500 mt-1">✅ 位置已验证，认领的街道将关联真实 GPS 坐标</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">每条街道每门艺术只能被认领一次</p>
          )}
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full text-sm">
          {submitting ? "提交中…" : "提交认领"}
        </button>
      </form>
    </div>
  );
}
// ===== Apply Teacher Form (简化版：无需上传资料，管理员审核) =====
function ApplyTeacherForm({ onSuccess }: { onSuccess: () => void }) {
  const [realName, setRealName] = useState("");
  const [idCardNo, setIdCardNo] = useState("");
  const [gender, setGender] = useState("");
  const [schoolProvince, setSchoolProvince] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [graduationSchool, setGraduationSchool] = useState("");
  const [highestDegree, setHighestDegree] = useState("");
  const [majorCategory, setMajorCategory] = useState("");
  const [major, setMajor] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [experienceItems, setExperienceItems] = useState("");
  const [customSchool, setCustomSchool] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const experienceOptions = ["在读学生","1-3年","3-5年","5-10年","10-15年","15-20年","20年以上"];
  const isStudent = experienceYears === "在读学生";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!realName || !selectedInstrument || !gender || !experienceYears || !idCardNo) {
      setError("请填写完整信息（姓名、身份证号、性别、年限、艺术门类为必填）");
      return;
    }
    const idCardRegex = /^\d{17}[\dXx]$/;
    if (!idCardRegex.test(idCardNo.trim())) {
      setError("请输入正确的18位身份证号码");
      return;
    }
    setSubmitting(true);
    try {
      await teacherApi.apply({
        realName,
        idCardNo: idCardNo.trim(),
        gender: gender || undefined,
        graduationSchool: customSchool.trim() || graduationSchool || undefined,
        highestDegree: highestDegree || undefined,
        major: major || undefined,
        experienceYears: isStudent ? "在读" : (experienceYears || undefined),
        experienceItems: experienceItems.trim() || undefined,
        instrumentNames: [selectedInstrument],
        isStudent: isStudent || undefined,
      });
      setSubmitted(true);
      onSuccess();
    } catch (err: any) { setError(err?.message || "提交失败"); }
    finally { setSubmitting(false); }
  }

  if (submitted) {
    return (
      <div className="card p-6 text-center">
        <div className="text-3xl mb-3">✅</div>
        <h3 className="font-medium mb-2">认证申请已提交</h3>
        <p className="text-sm text-gray-500 mb-4">管理员审核通过后，你就可以认领街道了</p>
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
          提示：管理员将在 1-2 个工作日内完成审核，请保持手机畅通。
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-medium mb-4">申请成为体验导师</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
        <p className="text-xs text-blue-700">
          📋 排他性机制：同一街道 + 同一艺术门类，仅限一名导师认证。无需上传任何资料，由管理员统一审核。
        </p>
      </div>
      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">真实姓名 *</label>
            <input type="text" value={realName} onChange={(e) => setRealName(e.target.value)} className="input-field" placeholder="与身份证一致" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">性别 *</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-field">
              <option value="">请选择</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">身份证号 *</label>
          <input type="text" value={idCardNo} onChange={(e) => setIdCardNo(e.target.value)} className="input-field" placeholder="18位身份证号码，用于防止重复认证" maxLength={18} />
          <p className="text-xs text-gray-400 mt-1">一个身份证号只能认证一个账号</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{isStudent ? "在读学历" : "最高学历"}</label>
              <select value={highestDegree} onChange={(e) => setHighestDegree(e.target.value)} className="input-field">
                <option value="">请选择</option>
                {["大专","本科","研究生","博士","博士后"].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{isStudent ? "在读院校" : "毕业院校"}</label>
              <select value={schoolProvince} onChange={(e) => { setSchoolProvince(e.target.value); setSchoolCity(""); setGraduationSchool(""); setCustomSchool(""); }} className="input-field mb-2">
                <option value="">请选择省/自治区/直辖市</option>
                {schoolByProvince.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              {(schoolProvince === "港澳台" || schoolProvince === "海外") ? (
                <input type="text" value={customSchool} onChange={(e) => setCustomSchool(e.target.value)} className="input-field" placeholder="请输入院校名称" />
              ) : (
                <>
                  {schoolProvince && (
                    <select value={schoolCity} onChange={(e) => { setSchoolCity(e.target.value); setGraduationSchool(""); }} className="input-field mb-2">
                      <option value="">请选择城市/地区</option>
                      {schoolByProvince.find((p) => p.name === schoolProvince)?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  )}
                  {schoolCity && (
                    <select value={graduationSchool} onChange={(e) => setGraduationSchool(e.target.value)} className="input-field">
                      <option value="">请选择院校</option>
                      {schoolByProvince.find((p) => p.name === schoolProvince)?.cities.find((c) => c.name === schoolCity)?.schools.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">专业</label>
            <select value={majorCategory} onChange={(e) => { setMajorCategory(e.target.value); setMajor(""); }} className="input-field mb-2">
              <option value="">请选择专业大类</option>
              {majorByCategory.map((g) => <option key={g.category} value={g.category}>{g.category}</option>)}
            </select>
            {majorCategory && (
              <select value={major} onChange={(e) => setMajor(e.target.value)} className="input-field">
                <option value="">请选择具体专业</option>
                {majorByCategory.find((g) => g.category === majorCategory)?.majors.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">艺术体验指导年限 *</label>
          <select value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="input-field">
            <option value="">请选择</option>
            {experienceOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {isStudent && (
            <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-2">
              🎓 在读学生将以<b>陪练</b>身份注册，可认证<b>2个</b>据点，支持跨城市和街道
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">体验项目</label>
          <input type="text" value={experienceItems} onChange={(e) => setExperienceItems(e.target.value)}
            className="input-field" placeholder="如：钢琴启蒙、素描基础、中国舞入门、编程启蒙…" maxLength={100} />
          <p className="text-xs text-gray-400 mt-1">描述你提供的体验方向，帮助街坊了解你的特色</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-2">擅长的艺术门类 *（仅选一项）</label>
          <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
            {instrumentCategories.map((cat) => (
              <div key={cat.category}>
                <div className="text-xs font-medium text-gray-500 mb-1.5 sticky top-0 bg-white py-1">{cat.category}</div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.instruments.map((inst) => {
                    const active = selectedInstrument === inst.name;
                    return (
                      <button key={inst.name} type="button"
                        onClick={() => setSelectedInstrument(inst.name)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          active
                            ? "bg-primary-700 text-white border-primary-700"
                            : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600"
                        }`}>
                        {inst.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {selectedInstrument && (
            <p className="text-xs text-gray-400 mt-2">已选：{selectedInstrument}</p>
          )}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full text-sm">
          {submitting ? "提交中..." : "提交认证申请"}
        </button>
        <p className="text-xs text-gray-400 text-center">提交后由管理员审核，无需上传任何资料</p>
      </form>
    </div>
  );
}
// ===== Create Activity Form =====
function CreateActivityForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title) { setError("请输入活动标题"); return; }
    setSubmitting(true);
    try {
      await activityApi.create({
        title,
        description: description || undefined,
        price: price ? Math.round(parseFloat(price) * 100) : undefined,
      });
      alert("活动发布成功，等待审核");
      setTitle(""); setDescription(""); setPrice("");
    } catch (err: any) { setError(err?.message || "发布失败"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="card p-6">
      <h3 className="font-medium mb-4">发布艺术活动</h3>
      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">活动标题</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="如：周末艺术下午茶 · 水彩分享" />
          <p className="text-xs text-gray-400 mt-1">请使用社交活动语言</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">活动介绍</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field resize-none" rows={3} maxLength={200} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">活动费用（元，可选）</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder="留空表示免费" min={0} />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full text-sm">
          {submitting ? "发布中…" : "发布活动"}
        </button>
      </form>
    </div>
  );
}

// ===== Messages Panel (Teacher side) =====
function MessagesPanel() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [unlocking, setUnlocking] = useState<Record<string, boolean>>({});
  const [phones, setPhones] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      const res: any = await contactApi.listMessages();
      setMessages(res?.data || res || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleReply(msgId: string) {
    const text = replyText[msgId]?.trim();
    if (!text) return;
    try {
      await contactApi.reply(msgId, text);
      setReplyText((p) => ({ ...p, [msgId]: "" }));
      loadMessages();
    } catch (e: any) { alert(e?.message || "回复失败"); }
  }

  async function handleUnlock(targetUserId: string) {
    setUnlocking((p) => ({ ...p, [targetUserId]: true }));
    try {
      const res: any = await contactApi.unlockByPoints(targetUserId);
      const data = res?.data || res;
      setPhones((p) => ({ ...p, [targetUserId]: data.phone }));
      alert(data.message || "已解锁");
      // Refresh user points from localStorage
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      stored.points = (stored.points || 0) - 5;
      localStorage.setItem("user", JSON.stringify(stored));
    } catch (e: any) { alert(e?.message || "解锁失败"); }
    finally { setUnlocking((p) => ({ ...p, [targetUserId]: false })); }
  }

  if (loading) return <SkeletonMessageList count={2} />;

  return (
    <div className="card p-6">
      <h3 className="font-medium mb-4">邻里留言</h3>
      {messages.length === 0 ? (
        EmptyStates.noMessages
      ) : (
        <div className="space-y-4">
          {messages.map((msg: any) => (
            <div key={msg.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {msg.parent?.nickname || msg.parent?.studentName || "邻居"}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {msg.parent?.residentialArea?.split(" ").slice(0, 2).join(" ") || ""}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 mb-2">{msg.message}</p>
              {msg.reply && (
                <p className="text-sm text-primary-700 bg-primary-50 rounded-lg px-3 py-2 mb-2">
                  <span className="text-xs font-medium">我的回复：</span>{msg.reply}
                </p>
              )}
              {!msg.reply && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={replyText[msg.id] || ""}
                    onChange={(e) => setReplyText((p) => ({ ...p, [msg.id]: e.target.value }))}
                    placeholder="输入回复..."
                    className="input-field flex-1 text-sm"
                  />
                  <button onClick={() => handleReply(msg.id)}
                    className="px-4 py-2 bg-primary-700 text-white rounded-xl text-sm hover:bg-primary-800">
                    回复
                  </button>
                </div>
              )}
              {/* Phone unlock section */}
              <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  📱 {phones[msg.parent?.id] || msg.parent?.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") || "未知号码"}
                </span>
                {!phones[msg.parent?.id] && msg.parent?.id && (
                  <button
                    onClick={() => handleUnlock(msg.parent.id)}
                    disabled={unlocking[msg.parent.id]}
                    className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100">
                    {unlocking[msg.parent.id] ? "解锁中..." : "🪙 5积分解锁查看"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Reusable File Upload Box (for teacher cert upload) =====
function FileUploadBox({ preview, onSelect }: { preview: string; onSelect: (file: File | null) => void }) {
  return (
    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all overflow-hidden">
      {preview ? (
        <div className="relative w-full h-full group">
          <img src={preview} alt="预览" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs">点击更换</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-gray-400">
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs">点击上传</span>
        </div>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] || null)}
      />
    </label>
  );
}
