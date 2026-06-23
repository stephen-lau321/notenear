import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { teacherApi } from "../api/client";
import type { TeacherAuth } from "../types";

type Tab = "status" | "claim" | "profile" | "activity";

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [token] = useState(localStorage.getItem("access_token"));
  const [tab, setTab] = useState<Tab>("status");
  const [auth, setAuth] = useState<TeacherAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
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
    navigate("/");
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "status", label: "认证状态", icon: "📋" },
    { key: "claim", label: "认领街道", icon: "📍" },
    { key: "profile", label: "编辑主页", icon: "✏️" },
    { key: "activity", label: "发布活动", icon: "📅" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-12">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">我的音乐据点</h1>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          退出登录
        </button>
      </div>

      {/* Tab 导航 */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 -mx-4 px-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-primary-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="space-y-4">
        {tab === "status" && (
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
                  <span className="text-sm text-gray-500">
                    真实姓名：{auth.realName}
                  </span>
                </div>
                {auth.streetClaims?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">已认领的街道：</p>
                    {auth.streetClaims.map((c: any) => (
                      <div key={c.id} className="text-sm text-gray-600 py-1">
                        {c.streetName} · {c.instrument?.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  你还没有申请成为音乐主理人
                </p>
                <button
                  onClick={() => setTab("profile")}
                  className="btn-primary text-sm"
                >
                  立即申请
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "claim" && (
          <ClaimStreetForm onSuccess={() => setTab("status")} />
        )}

        {tab === "profile" && <ApplyTeacherForm />}

        {tab === "activity" && <CreateActivityForm />}
      </div>
    </div>
  );
}

// ===== 子组件：认领街道 =====
function ClaimStreetForm({ onSuccess }: { onSuccess: () => void }) {
  const [instrumentName, setInstrumentName] = useState("");
  const [streetName, setStreetName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!instrumentName || !streetName) {
      alert("请填写完整信息");
      return;
    }
    setSubmitting(true);
    // ⚠ 开发阶段：mock 提交
    setTimeout(() => {
      alert("认领申请已提交！");
      setSubmitting(false);
      onSuccess();
    }, 1000);
  }

  return (
    <div className="card p-6">
      <h3 className="font-medium mb-4">认领街道音乐据点</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">乐器名称</label>
          <input
            type="text"
            value={instrumentName}
            onChange={(e) => setInstrumentName(e.target.value)}
            placeholder="如：钢琴、吉他、古筝…"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">所在街道</label>
          <input
            type="text"
            value={streetName}
            onChange={(e) => setStreetName(e.target.value)}
            placeholder="如：体育西路、建设路…"
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">
            AI 将自动识别你的位置，认领后该街道该乐器将唯属于你
          </p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full text-sm"
        >
          {submitting ? "提交中…" : "提交认领"}
        </button>
      </form>
    </div>
  );
}

// ===== 子组件：申请认证 =====
function ApplyTeacherForm() {
  const [realName, setRealName] = useState("");
  const [instrumentStr, setInstrumentStr] = useState("");
  const [idCardFront, setIdCardFront] = useState("");
  const [idCardBack, setIdCardBack] = useState("");
  const [step, setStep] = useState(1);

  function handleFile(file: File | undefined, type: "front" | "back") {
    if (!file || !file.type.startsWith("image/")) { alert("请选择图片文件"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      if (type === "front") setIdCardFront(data);
      else setIdCardBack(data);
    };
    reader.readAsDataURL(file);
  }

  function handleUrl(url: string, type: "front" | "back") {
    if (!url.startsWith("http")) return;
    if (type === "front") setIdCardFront(url);
    else setIdCardBack(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!realName || !instrumentStr) { alert("请填写完整信息"); return; }
    try {
      await teacherApi.apply({
        realName,
        idCardFront: idCardFront || undefined,
        idCardBack: idCardBack || undefined,
        instrumentNames: instrumentStr.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
      });
      alert("认证申请已提交，等待审核");
      setStep(2);
    } catch (e: any) { alert(e?.message || "提交失败"); }
  }

  if (step === 2) {
    return (
      <div className="card p-6 text-center">
        <div className="text-3xl mb-3">✅</div>
        <h3 className="font-medium mb-2">申请已提交</h3>
        <p className="text-sm text-gray-500">管理员审核通过后，你就可以认领街道了</p>
      </div>
    );
  }

  function UploadBox({ label, type, image }: { label: string; type: "front" | "back"; image: string }) {
    return (
      <div>
        <div className="relative aspect-[1.6] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-sm overflow-hidden bg-gray-50 hover:border-primary-300 transition-colors">
          {image ? (
            <img src={image} alt={label} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center pointer-events-none">
              <div className="text-2xl mb-1">📷</div>
              <span>点击选择图片</span>
            </div>
          )}
          <input type="file" accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => handleFile(e.target.files?.[0], type)} />
        </div>
        <input type="text" value={image} placeholder="或粘贴图片链接"
          className="w-full mt-1.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-500 outline-none focus:border-primary-300"
          onChange={(e) => handleUrl(e.target.value, type)} />
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-medium mb-4">认证为音乐主理人</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">真实姓名</label>
          <input type="text" value={realName} onChange={(e) => setRealName(e.target.value)}
            className="input-field" placeholder="与身份证一致" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">擅长的乐器（多个用逗号分隔）</label>
          <input type="text" value={instrumentStr} onChange={(e) => setInstrumentStr(e.target.value)}
            className="input-field" placeholder="钢琴, 吉他, 古筝" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">身份证照片（正反面）</label>
          <div className="grid grid-cols-2 gap-3">
            <UploadBox label="身份证正面" type="front" image={idCardFront} />
            <UploadBox label="身份证反面" type="back" image={idCardBack} />
          </div>
          <p className="text-xs text-gray-400 mt-1">仅用于身份核验，信息加密存储</p>
        </div>
        <button type="submit" className="btn-primary w-full text-sm">提交认证</button>
      </form>
    </div>
  );
}

// ===== 子组件：发布活动 =====
function CreateActivityForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) {
      alert("请输入活动标题");
      return;
    }
    setSubmitting(true);
    try {
      const { activityApi } = await import("../api/client");
      await activityApi.create({
        title,
        description: description || undefined,
        price: price ? Math.round(parseFloat(price) * 100) : undefined,
      });
      alert("活动发布成功，等待审核");
      setTitle("");
      setDescription("");
      setPrice("");
    } catch (err: any) {
      alert(err?.message || "发布失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6">
      <h3 className="font-medium mb-4">发布音乐活动</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">活动标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="如：周末音乐下午茶 · 吉他分享"
          />
          <p className="text-xs text-gray-400 mt-1">
            请使用社交活动语言，不要出现"课程、培训"等词汇
          </p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">活动介绍</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="简单介绍一下这次活动的内容和亮点…"
            maxLength={200}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">活动费用（元）</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input-field"
            placeholder="留空表示免费"
            min={0}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full text-sm"
        >
          {submitting ? "发布中…" : "发布活动"}
        </button>
      </form>
    </div>
  );
}
