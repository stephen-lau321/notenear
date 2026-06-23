import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/client";

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"wechat" | "phone">("wechat");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    if (!/^1\d{10}$/.test(phone)) { alert("请输入正确的手机号"); return; }
    setLoading(true);
    try {
      await authApi.sendSmsCode(phone);
      setCodeSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
      alert("验证码已发送（开发模式通用码: 888888）");
    } catch {
      alert("发送失败，请稍后重试");
    } finally { setLoading(false); }
  }

  async function handleLogin() {
    if (tab === "phone") {
      if (!code) { alert("请输入验证码"); return; }
      setLoading(true);
      try {
        const res: any = await authApi.phoneLogin(phone, code);
        const data = res?.data || res;
        localStorage.setItem("access_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } catch {
        alert("登录失败，请检查验证码");
      } finally { setLoading(false); }
    } else {
      setLoading(true);
      try {
        const res: any = await authApi.wechatLogin("mock_code");
        const data = res?.data || res;
        if (data.token) {
          localStorage.setItem("access_token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/");
        }
      } catch {
        alert("微信登录暂不可用，请使用手机号登录");
        setTab("phone");
      } finally { setLoading(false); }
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 pt-16">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🎵</div>
        <h1 className="text-xl font-bold text-gray-900">一街一师一乐器</h1>
        <p className="text-sm text-gray-400 mt-1">登录后认领你的音乐据点</p>
      </div>

      <div className="flex bg-gray-100 rounded-full p-1 mb-6">
        <button onClick={() => setTab("wechat")}
          className={`flex-1 py-2 text-sm rounded-full transition-all ${tab === "wechat" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}>微信登录</button>
        <button onClick={() => setTab("phone")}
          className={`flex-1 py-2 text-sm rounded-full transition-all ${tab === "phone" ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}>手机号登录</button>
      </div>

      {tab === "wechat" ? (
        <button onClick={handleLogin} disabled={loading}
          className="w-full bg-green-500 text-white rounded-full py-3 font-medium text-sm hover:bg-green-600 transition-colors">
          <span className="flex items-center justify-center gap-2">
            <span className="text-lg">💬</span>
            <span>{loading ? "登录中..." : "微信一键登录"}</span>
          </span>
        </button>
      ) : (
        <div className="space-y-4">
          <input type="tel" placeholder="手机号" value={phone}
            onChange={(e) => setPhone(e.target.value)} className="input-field" maxLength={11} />
          <div className="flex gap-3">
            <input type="text" placeholder="验证码" value={code}
              onChange={(e) => setCode(e.target.value)} className="input-field flex-1" maxLength={6} />
            <button onClick={handleSendCode} disabled={countdown > 0 || loading}
              className={`px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${countdown > 0 ? "bg-gray-100 text-gray-400" : "bg-primary-50 text-primary-700 hover:bg-primary-100"}`}>
              {loading ? "发送中..." : countdown > 0 ? `${countdown}s` : "获取验证码"}
            </button>
          </div>
          <button onClick={handleLogin} disabled={loading} className="btn-primary w-full text-sm">
            {loading ? "登录中..." : "登录"}
          </button>
          <p className="text-xs text-center text-gray-400">开发阶段通用验证码: 888888</p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-6">登录即表示同意《用户协议》和《隐私政策》</p>
    </div>
  );
}