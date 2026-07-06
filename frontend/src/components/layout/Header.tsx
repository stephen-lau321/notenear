import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("access_token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isLoggedIn = !!token;

  // Determine if user is an admin based on role
  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";

  // Hide header on auth page
  if (location.pathname === "/auth") return null;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-50">
      <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
        {/* Left: Logo / Home */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <span className="text-lg">🎵</span>
          <span className="text-sm font-bold text-gray-900 hidden sm:inline">乐邻 · 让艺术体验就在咫尺之间</span>
        </button>

        {/* Right: Navigation */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => navigate("/admin")}
              className={`text-xs transition-colors ${location.pathname === "/admin" ? "text-primary-700 font-medium" : "text-gray-400 hover:text-gray-600"}`}>
              管理后台
            </button>
          )}
          {isLoggedIn ? (
            <>
              <span className="text-xs text-gray-400 hidden sm:inline">{user?.nickname || "用户"}</span>
              <button onClick={() => navigate("/dashboard")}
                className={`text-xs transition-colors ${location.pathname === "/dashboard" ? "text-primary-700 font-medium" : "text-gray-400 hover:text-gray-600"}`}>
                {isTeacher ? "我的据点" : "个人中心"}
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/auth")}
              className="text-xs text-gray-400 hover:text-primary-600 transition-colors">
              登录 / 注册
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
