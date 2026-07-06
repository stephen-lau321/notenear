import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/client";

type RoleEntry = "select" | "teacher" | "parent" | "admin" | "host";

export default function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<RoleEntry>("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  if (step === "select") {
    return <RoleSelection onSelect={(r) => setStep(r)} />;
  }

  const roleLabel = step === "teacher" ? "体验导师" : step === "host" ? "生活链接者" : step === "admin" ? "管理员" : "街坊";
  // Map step to actual backend role
  const backendRole = step === "teacher" ? "TEACHER" : step === "host" ? "HOST" : step === "admin" ? "ADMIN" : "PARENT";

  async function handleSubmit() {
    if (!email || !password) { alert("请输入邮箱和密码"); return; }
    if (password.length < 6) { alert("密码至少6位"); return; }
    setLoading(true);
    try {
      const res: any = isRegister
        ? await authApi.register(email, password, backendRole)
        : await authApi.login(email, password);
      const data = res?.data || res;
      localStorage.setItem("access_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // 生活链接者保留 host_sub_type 用于区分 art/life
      if (step === "host") {
        if (!localStorage.getItem("host_sub_type")) {
          localStorage.setItem("host_sub_type", "life");
        }
      } else {
        localStorage.removeItem("host_sub_type");
      }
      navigate("/dashboard");
    } catch (e: any) { alert(e?.message || (isRegister ? "注册失败" : "登录失败")); }
    finally { setLoading(false); }
  }


  async function handleQuickLogin(email: string, pw: string) {
    setEmail(email);
    setPassword(pw);
    setLoading(true);
    try {
      const res: any = await authApi.login(email, pw);
      const data = res?.data || res;
      localStorage.setItem("access_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.removeItem("user_role_type");
      navigate("/dashboard");
    } catch (e: any) { alert(e?.message || "登录失败"); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-sm mx-auto px-4 pt-12">
      {/* Back button */}
      <button onClick={() => setStep("select")}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回选择身份
      </button>

      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{step === "teacher" ? "🎵" : step === "host" ? "🎶" : step === "admin" ? "⚙️" : "🏠"}</div>
        <h1 className="text-xl font-bold text-gray-900">
          {step === "teacher" ? "体验导师" : step === "host" ? "生活链接者" : step === "admin" ? "管理员" : "街坊"}{isRegister ? "注册" : "登录"}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isRegister ? "创建账号，开始社区艺术体验" : "欢迎回来，继续你的社区之旅"}
        </p>
      </div>

      <div className="space-y-4">
        <input type="email" placeholder="邮箱地址" value={email}
          onChange={(e) => setEmail(e.target.value)} className="input-field" autoComplete="email" />
        <input type="password" placeholder="密码（至少6位）" value={password}
          onChange={(e) => setPassword(e.target.value)} className="input-field" autoComplete={isRegister ? "new-password" : "current-password"} />
        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full text-sm">
          {loading ? "处理中..." : isRegister ? "注册" : "登录"}
        </button>
        <p className="text-xs text-center text-gray-400">
          {isRegister ? "已有账号？" : "没有账号？"}
          <button onClick={() => setIsRegister(!isRegister)} className="text-primary-600 hover:underline ml-1">
            {isRegister ? "去登录" : "去注册"}
          </button>
        </p>
      </div>

      {/* 开发环境一键登录 */}
      <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
        <p className="text-[10px] text-gray-300 text-center mb-2">开发环境 · 一键登录</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => handleQuickLogin("admin@yuelin.com", "888888")}
            className="text-[11px] px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
            ⚙️ 管理员
          </button>
          <button onClick={() => handleQuickLogin("teacher@yuelin.com", "888888")}
            className="text-[11px] px-3 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition">
            🎵 体验导师
          </button>
          <button onClick={() => handleQuickLogin("parent@yuelin.com", "888888")}
            className="text-[11px] px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
            🏠 街坊
          </button>
          <button onClick={() => {
            localStorage.setItem("host_sub_type", "art");
            handleQuickLogin("host@yuelin.com", "888888");
          }} className="text-[11px] px-3 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition">
            🎨 候补艺术导师
          </button>
          <button onClick={() => {
            localStorage.setItem("host_sub_type", "life");
            handleQuickLogin("host2@yuelin.com", "888888");
          }} className="text-[11px] px-3 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition">
            🔧 生活导师
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">登录即表示同意《用户协议》和《隐私政策》</p>
    </div>
  );
}

// ===== Role Selection Screen =====
function RoleSelection({ onSelect }: { onSelect: (role: "teacher" | "parent" | "admin" | "host") => void }) {
  const [showHostSub, setShowHostSub] = useState(false);

  return (
    <div className="max-w-sm mx-auto px-4 pt-12">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🎵</div>
        <h1 className="text-xl font-bold text-gray-900">乐邻</h1>
        <p className="text-sm text-gray-400 mt-1">社区艺术体验，连接你我</p>
      </div>

      <div className="space-y-3">
        {/* 体验导师 */}
        <button onClick={() => onSelect("teacher")}
          className="card p-5 w-full text-left hover:shadow-md transition-all active:scale-[0.98] group border-l-4 border-primary-400">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-xl group-hover:bg-primary-100 transition-colors">🎓</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base">体验导师</h3>
              <p className="text-xs text-gray-400 mt-0.5">认证导师 · 提供社区艺术体验</p>
              <p className="text-[10px] text-gray-300 mt-1">实名认证 → 认领街道 → 发布活动 → 指导体验</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        {/* 生活链接者 — expandable sub-menu */}
        {!showHostSub ? (
          <button onClick={() => setShowHostSub(true)}
            className="card p-5 w-full text-left hover:shadow-md transition-all active:scale-[0.98] group border-l-4 border-amber-400">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-xl group-hover:bg-amber-100 transition-colors">🔗</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base">生活链接者</h3>
                <p className="text-xs text-gray-400 mt-0.5">组织社区活动 · 提供各类生活服务</p>
                <p className="text-[10px] text-gray-300 mt-1">无需认证 → 提供社区服务与活动资源</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ) : (
          <div className="space-y-2 pl-4 border-l-2 border-amber-200 ml-2">
            <p className="text-xs text-gray-400 mb-1">请选择你的方向：</p>
            {/* 艺术导师 — backup teacher */}
            <button onClick={() => { localStorage.setItem("host_sub_type", "art"); onSelect("host"); }}
              className="card p-4 w-full text-left hover:shadow-md transition-all active:scale-[0.98] border border-amber-200">
              <div className="flex items-center gap-3">
                <span className="text-lg">🎨</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900">我是艺术导师</h4>
                  <p className="text-xs text-gray-400 mt-0.5">作为候补导师，当正式导师搬离后替补接替</p>
                </div>
              </div>
            </button>
            {/* 生活导师 — community services */}
            <button onClick={() => { localStorage.setItem("host_sub_type", "life"); onSelect("host"); }}
              className="card p-4 w-full text-left hover:shadow-md transition-all active:scale-[0.98] border border-amber-200">
              <div className="flex items-center gap-3">
                <span className="text-lg">🔧</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900">我是生活导师</h4>
                  <p className="text-xs text-gray-400 mt-0.5">提供社区生活服务（急开锁、保洁、维修…）</p>
                </div>
              </div>
            </button>
            <button onClick={() => setShowHostSub(false)} className="text-xs text-gray-400 hover:text-gray-600 py-1">← 返回</button>
          </div>
        )}

        {/* 街坊 */}
        <button onClick={() => onSelect("parent")}
          className="card p-5 w-full text-left hover:shadow-md transition-all active:scale-[0.98] group border-l-4 border-blue-400">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl group-hover:bg-blue-100 transition-colors">🏠</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base">街坊</h3>
              <p className="text-xs text-gray-400 mt-0.5">学员 / 家长 · 寻求社区艺术体验</p>
              <p className="text-[10px] text-gray-300 mt-1">填写资料 → 发现身边老师 → 查看活动 → 留言交流</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>
      </div>

      {/* Admin entry */}
      <div className="text-center mt-8 pt-4 border-t border-gray-50">
        <button onClick={() => onSelect("admin")}
          className="text-xs text-gray-300 hover:text-primary-500 transition-colors">
          管理后台 · 管理员登录 →
        </button>
      </div>
    </div>
  );
}
