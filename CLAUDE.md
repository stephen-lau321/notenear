# 乐邻 NoteNear — 项目完整上下文

## 项目概述

社区艺术/生活服务平台，连接附近居民与导师。核心价值：解决"最后一公里"问题——家长最终选择的是身边3公里范围的老师。

**技术栈**: NestJS + Prisma/SQLite + JWT (后端) / React/Vite + TypeScript (前端)
**平台**: Windows 10 + BaiduSyncdisk (文件同步锁问题)
**启动**: `node start.js` (根目录) | 前端 `:5173` | 后端 `:3000`

---

## 开发时序 (Phase 1 → Phase 6)

### Phase 1: 基础架构 (2026-06-22 ~ 06-28)

**后端脚手架**: NestJS + Prisma + SQLite
- `backend/prisma/schema.prisma` — 完整数据模型 (见下方)
- `backend/src/auth/` — JWT认证模块 (`auth.service.ts`, `auth.controller.ts`, `auth.module.ts`)
- `backend/src/user/` — 用户CRUD
- `backend/src/teacher/` — 导师认证 (`teacher.service.ts`, `teacher.controller.ts`)
- `backend/src/street-claim/` — 街道认领 (`street-claim.service.ts`, `street-claim.controller.ts`)
- `backend/src/admin/` — 管理后台 (`admin.service.ts`, `admin.controller.ts`)
- `backend/src/contact/` — 联系留言 (`contact.service.ts`, `contact.controller.ts`)
- `backend/src/activity/` — 活动管理
- `backend/src/product/` + `backend/src/order/` — 商城
- `backend/src/map/` — 地图地理编码
- `backend/src/media/` — 媒体上传
- `backend/src/instrument/` — 艺术门类管理
- `backend/src/common/guards/` — JWT策略 + 角色守卫 (`roles.guard.ts`, `jwt.strategy.ts`)
- `backend/src/common/decorators/` — `@Roles()`, `@CurrentUser()`

**前端脚手架**: React/Vite + TypeScript
- `frontend/src/api/client.ts` — Axios实例 + 拦截器 + 所有API方法
- `frontend/src/pages/HomePage.tsx` — 首页地图 (3km半径)
- `frontend/src/pages/SearchPage.tsx` — 搜索页
- `frontend/src/pages/DashboardPage.tsx` — **核心Dashboard路由** (含所有子组件)
- `frontend/src/pages/AuthPage.tsx` — 登录/注册 (角色选择)
- `frontend/src/pages/TeacherDetailPage.tsx` — 导师详情
- `frontend/src/pages/AdminPage.tsx` — 管理后台
- `frontend/src/pages/ShopPage.tsx` — 商城
- `frontend/src/pages/ProductDetailPage.tsx` — 商品详情
- `frontend/src/pages/DemandPage.tsx` — 需求广场
- `frontend/src/components/common/TeacherCard.tsx` — 导师卡片
- `frontend/src/components/common/MapView.tsx` — 地图组件
- `frontend/src/components/common/StreetCommunityPicker.tsx` — 省市区街道小区级联选择器
- `frontend/src/components/common/Skeleton.tsx` — 骨架屏加载
- `frontend/src/components/common/EmptyState.tsx` — 空状态组件
- `frontend/src/data/instruments.ts` — 艺术门类数据 (原本只有音乐)
- `frontend/src/data/majors.ts` — 专业分类
- `frontend/src/data/services.ts` — 社区服务列表
- `frontend/src/data/china-areas.ts` — 中国省市区数据
- `frontend/src/data/schools.ts` — 学校数据

**初始角色体系**: TEACHER (体验导师) + PARENT (街坊) + ADMIN

---

### Phase 2: 学科扩展 — 音乐→全艺术 (2026-06-29 ~ 07-01)

UI术语全局替换：
| 旧术语 | 新术语 |
|--------|--------|
| 音乐据点 | **艺术据点** |
| 音乐主理人 | **艺术主理人** |
| 乐器 | **艺术门类** |
| 擅长的乐器 | **擅长的艺术门类** |
| 音乐体验 | **艺术体验** |
| 音乐故事 | **艺术故事** |
| 乐器商城 | **艺术商城** |
| 音乐主理人自营乐器 | **艺术主理人自营好物** |

**instruments.ts**: 从纯音乐30+条目扩展到12大类100+条目：
🎵音乐(键盘/弦乐/弹拨/拉弦/吹管/打击/声乐/制作) | 🎨绘画 | 🎭美术综合 | 🗿雕塑手工 | 💃舞蹈 | ✍️书法篆刻 | ⚽球类 | 🥋武术搏击 | 🏊水上冰雪 | 💪体能与健身 | 🔬科学与技术 | 🎤语言艺术

**majors.ts**: 新增美术创作/教育/设计/理论类、书法类、体育教育类、科学教育类、语言艺术类、艺术管理类

**services.ts**: `backupTeacherServices` 从2项扩展到50+项；`communityServices` 扩展到6大类50+项

**波及文件**: HomePage, SearchPage, AdminPage, ShopPage, DemandPage, TeacherDetailPage, TeacherCard, MapView — 全部更新术语

---

### Phase 3: 生活链接者 HOST 角色 (2026-07-01 ~ 07-02)

**新增 HOST 角色** — 独立后端 Role，两个前端子类型：

| 子类型 | localStorage | 主题色 | 核心表单 | 候补按钮 | 独占性 |
|--------|-------------|--------|---------|---------|--------|
| 候补艺术导师 | `host_sub_type: "art"` | 紫色(purple) | 候补艺术门类+街道 | ✅ 有 | ❌ 无 |
| 生活导师 | `host_sub_type: "life"` | 琥珀色(amber) | 社区服务多选 | ❌ 无 | ❌ 无(58同城模式) |

**关键实现位置**: `DashboardPage.tsx`
- `isHost` 判断: `user.role === "HOST" || (user.role === "TEACHER" && localStorage.getItem("user_role_type") === "HOST")` (兼容过渡期)
- `HostDashboard` 组件: 接收 `hostSubType` prop，渲染不同UI
- `ConnectorProfileForm` 组件: `isArtBackup = hostSubType === "art"` 分支
  - **art**: 候补资料(必填艺术门类+街道) + 社区服务可选项
  - **life**: 仅社区服务多选(必选≥1项)

**AuthPage.tsx** 改动:
- `step` 新增 `"host"` 选项
- `backendRole` 映射: host → `"HOST"`, teacher → `"TEACHER"`, parent → `"PARENT"`, admin → `"ADMIN"`
- 注册时 `authApi.register(email, password, backendRole)` 传递角色
- 登录时 HOST 用户存储 `host_sub_type`
- 角色选择页: "生活链接者"可展开为两个子选项 (艺术导师/生活导师)
- 一键登录新增2个HOST按钮: 候补艺术导师(设art) + 生活导师(设life)

**api/client.ts** 改动:
- `authApi.register` 签名: `(email, password, role?)` → POST `/auth/register` 带 role 字段

**ClaimStreetForm 冲突跳转** (体验导师认领已占街道):
```
认领失败 → confirm对话框 → 设置 localStorage:
  - backup_claim_info: {streetName, instrumentName, district, city}
  - user_role_type: "HOST"
  - host_sub_type: "art"
→ window.location.reload() → DashboardPage
→ HostDashboard 渲染 → ConnectorProfileForm useEffect
→ 检测到 backup_claim_info → 预填候补艺术门类+街道 → 显示提示
```

---

### Phase 4: 数据库角色修正 (2026-07-02 ~ 07-03)

**问题链**:
1. `parent@yuelin.com` 登录后看到 TeacherDashboard → 根因: DB中role字段存为TEACHER
2. `host@yuelin.com` / `host2@yuelin.com` 无法登录 → 根因: 账号不存在于DB
3. 种子脚本重新运行时 upsert 未修正已有role → 根因: `update` 中缺少 `role` 字段

**修正**: 
- 种子脚本所有upsert的 `update` 字段加入 `role` 和 `nickname`
- 直接运行Prisma脚本修正DB记录

**最终5个开发账号**:

| 邮箱 | 密码 | 角色 | 子类型 | 手机 |
|------|------|------|--------|------|
| admin@yuelin.com | 888888 | ADMIN | - | 13800000000 |
| teacher@yuelin.com | 888888 | TEACHER | - | 13900001111 |
| parent@yuelin.com | 888888 | PARENT | - | 13900002222 |
| host@yuelin.com | 888888 | HOST | art (候补) | 13900003333 |
| host2@yuelin.com | 888888 | HOST | life (生活) | 13900004444 |

---

### Phase 5: 街坊学员端完善 (2026-07-02 ~ 07-03)

**ParentDashboard** (`DashboardPage.tsx` line 260):
- Tab: 找艺术搭子 | 找社区服务 | 找活动 | 看留言 | **我的资料**
- **NeighborProfileForm** (line 475): 学员信息填写，**不是**导师认证表单
  - 学习模式: 自己学(SELF) vs 给孩子找(CHILD)
  - 自己学: 姓名、性别、年龄、基础水平
  - 孩子学: 孩子姓名、性别、年龄、年级、家长手机、基础水平
  - 偏好上课方式、想学的艺术门类(最多2项)、所在位置
- **NearbyTeachersPanel** (line 308): 3km内认证导师列表，可留言+积分解锁手机
- **NearbyServicesPanel** (line 387): 社区生活服务者列表
- **NearbyActivitiesPanel** (line 440): 公开活动列表

---

### Phase 6: V2 生源采集+AI匹配 (2026-07-02)

**Prisma 新增模型**:
- `StudentDemand` — 小红书/手动/微信/网站采集的生源需求
- `ScoreHistory` — AI五维评分记录 (时效性/完整性/真实性/竞争度/预算)
- `MatchRecord` — 导师匹配记录 (评分+距离+状态)
- `Review` — 导师评价 (1-5星)
- `Favorite` — 收藏导师
- `Notification` — 系统通知
- `OverflowLog` — 溢出记录

**后端新增模块**:
- `backend/src/scoring/scoring.service.ts` — AI评分引擎
- `backend/src/matching/matching.service.ts` — 匹配引擎
- `backend/src/demand/demand.service.ts` — 需求管理
- `backend/src/review/review.service.ts` — 评价系统
- `backend/src/favorite/favorite.service.ts` — 收藏系统
- `backend/src/notification/notification.service.ts` — 通知系统

**采集器**: `collector/xhs_collector.py` — 小红书数据采集脚本 (Python, requirements.txt)

**PWA支持**: `docs/` — Service Worker + Workbox + manifest

---

### Phase 7: 设计升级 + 排他性简化 (2026-07-06)

**7a. 字体升级** — 全局使用思源黑体/苹方，禁止微软雅黑:
- `index.html`: 添加 Google Fonts (Noto Sans SC wght@300;400;500;700)
- `tailwind.config.js`: fontFamily: "Noto Sans SC" → "PingFang SC" → "Source Han Sans SC" → system
- `index.css`: body font-weight 400, h1/h2 font-weight 500, letter-spacing -0.01em

**7b. 教师人物头像** — 用公共照片替代 emoji 占位符:
- 新建 `frontend/src/utils/avatar.ts`: getTeacherAvatar(userId) → pravatar.cc 一致性头像; getTeacherPhoto(userId) → Unsplash 教育场景照片
- 更新组件: TeacherCard, TeacherDetailPage (hero+avatar), DashboardPage NearbyTeachersPanel
- 头像尺寸: 56px (TeacherCard), 96px (TeacherDetailPage hero), 44px (NearbyTeachers)

**7c. ApplyTeacherForm 简化** — 无需上传任何资料:
- 移除: 文件上传 (idCardFront/Back, graduationCert, teacherCert)
- 移除: 支付步骤 (QR code/金额选择)
- 改为: 单步表单 → 直接提交 → 管理员审核
- 新增蓝色提示框: "排他性机制：同一街道+同一艺术门类，仅限一名导师认证。无需上传任何资料，由管理员统一审核。"

**7d. 管理员代发活动**:
- AdminPage "活动审核" tab 新增 `AdminCreateActivityForm`
- 管理员可直接创建活动，使用 `autoApprove: true` 跳过审核
- 后端 `ActivityService.create` 新增第3个参数 `autoApprove`，直接设置 status="APPROVED"
- 管理员创建的活动不受每日3条限制

---

## Prisma 数据模型速查

```
User: id, nickname, avatar, email(unique), passwordHash, phone(unique),
      residentialArea, studentName, experienceLevel, childGender, childAge,
      childGrade, experienceType, experienceSubjects, idCardNo, selfGender,
      selfExperienceYears, age, school, experienceFormat, points, role(default:PARENT)

TeacherAuth: userId(unique, FK→User), realName, idCardFront/Back/No, gender,
             graduationSchool, highestDegree, major, experienceYears,
             experienceItems, graduationCert, teacherCert,
             teacherType(default:TEACHER), services(JSON), isBackupTeacher,
             isStudent, lastActiveAt, status(default:PENDING)
             
Instrument: id, name, category
StreetClaim: teacherId(FK), instrumentId(FK), streetName, communityName,
             district, city, province, lat, lng, status(default:ACTIVE),
             releaseRequested, modifyData/Status/Count/lastModifyYear
             @@unique([communityName, instrumentId])

BackupClaim: userId, streetName, instrumentId, instrumentName, status(default:WAITING)
Activity, Product, Order, MediaAsset, PageView, ContactLog, PhoneUnlock
StudentDemand, ScoreHistory, MatchRecord, Review, Favorite, Notification, OverflowLog
```

---

## localStorage 键值速查

| Key | 值 | 用途 |
|-----|---|------|
| `access_token` | JWT | 认证token |
| `user` | JSON | 当前用户信息 {id, email, role, nickname, phone, points} |
| `host_sub_type` | "art" / "life" | HOST子类型区分 |
| `user_role_type` | "HOST" | ⚠️旧版hack，仅兼容过渡期 |
| `backup_claim_info` | JSON | 认领冲突后预填的候补信息 {streetName, instrumentName, district, city} |

---

## Dashboard 路由逻辑 (DashboardPage.tsx)

```
user.role === "ADMIN"     → navigate("/admin") → AdminPage
isHost (HOST role 或旧版TEACHER+HOST标记) → HostDashboard
  ├── hostSubType==="art" → 紫色 "候补艺术导师"
  │   ├── Tab: 候补资料 (ConnectorProfileForm)
  │   ├── Tab: 组织活动
  │   └── Tab: 邻里留言
  └── hostSubType==="life" → 琥珀色 "生活导师"
      ├── Tab: 我的服务 (ConnectorProfileForm)
      ├── Tab: 组织活动
      └── Tab: 邻里留言
!isTeacher && !isHost  → ParentDashboard (街坊中心-蓝色)
  ├── Tab: 找艺术搭子 (NearbyTeachersPanel)
  ├── Tab: 找社区服务 (NearbyServicesPanel)
  ├── Tab: 找活动 (NearbyActivitiesPanel)
  ├── Tab: 看留言 (MessagesPanel)
  └── Tab: 我的资料 (NeighborProfileForm)
isTeacher  → TeacherDashboard (我的艺术据点)
  ├── Tab: 认证状态 (AuthStatusPanel)
  ├── Tab: 认领街道 (ClaimStreetForm)
  ├── Tab: 导师认证 (ApplyTeacherForm)
  ├── Tab: 发布活动 (CreateActivityForm)
  └── Tab: 邻里留言 (MessagesPanel)
```

---

## 关键后端逻辑

### AuthService (auth.service.ts)
```
register(email, password, role?)        — POST /auth/register, role默认PARENT
login(email, password)                  — POST /auth/login, 每日登录+1积分
phoneLogin(phone, code)                 — POST /auth/phone/login, 验证码888888
neighborRegister(data)                  — POST /auth/neighbor/register, 邻居注册
generateToken(userId, role)             — JWT签名 {sub, role}
```

### TeacherService (teacher.service.ts)
```
updateProfile(userId, data)  — 若 data.teacherType==="HOST" → user.role 保持 "PARENT"
                               否则 → user.role 设为 "TEACHER"
                               创建/更新 TeacherAuth 记录
```

### ContactService (contact.service.ts)
```
connectorRegister(userId, data)  — 创建 TeacherAuth: {teacherType: "HOST", services: JSON, isBackupTeacher}
sendMessage / unlockByPoints     — 留言和积分解锁手机号
```

---

## 已知问题

1. **BaiduSyncdisk**: 编辑文件可能遇 EPERM 错误(同步锁)，需重试
2. **SQLite锁**: 服务器运行中种子脚本可能失败(disk I/O error)，需先停服
3. **种子数据**: upsert的`update`必须包含`role`+`nickname`，否则已有记录不会修正
4. **`user_role_type` localStorage**: 旧版兼容hack，仅ClaimStreetForm冲突重定向时设置，正常流程已废弃

## 待验证

- ⚠️ parent@yuelin.com 登录 → ParentDashboard (NeighborProfileForm, 非ApplyTeacherForm)
- ⚠️ host@yuelin.com 登录 → HostDashboard 紫色 theme (候补艺术导师)
- ⚠️ host2@yuelin.com 登录 → HostDashboard 琥珀色 theme (生活导师)
- ⚠️ teacher@yuelin.com 登录 → TeacherDashboard (ClaimStreetForm + ApplyTeacherForm)
