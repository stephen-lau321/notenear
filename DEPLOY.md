# 乐邻 · 让艺术体验就在咫尺之间 - 部署指南

## 架构概览

```
用户 → GitHub Pages (前端) → Render Web Service (后端) → Render PostgreSQL
```

- **前端**: React + Vite + PWA → GitHub Pages
- **后端**: NestJS + Prisma → Render Web Service
- **数据库**: PostgreSQL 15 + PostGIS → Render PostgreSQL

---

## 本地开发

### 环境要求
- Node.js >= 18
- Docker Desktop (推荐，用于运行 PostgreSQL + Redis)

### 快速启动
```bash
# 1. 启动数据库
docker compose up -d

# 2. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 3. 生成 Prisma Client + 运行迁移
cd ../backend
npx prisma generate
npx prisma db push

# 4. 初始化测试数据
npx prisma db seed

# 5. 启动开发服务器（开两个终端）
# 终端1 - 后端
cd backend && npm run start:dev

# 终端2 - 前端
cd frontend && npm run dev
```

### 开发测试账号
| 角色 | 手机号 | 验证码 |
|------|--------|--------|
| 管理员 | 13800000000 | 888888 |
| 老师 | 13900001111 | 888888 |
| 家长 | 13900002222 | 888888 |

---

## 部署步骤

### 1. 推送代码到 GitHub
```bash
cd F:\软件\自定义 Office 模板\codex\street-music
git init
git add .
git commit -m "乐邻 · 让艺术体验就在咫尺之间 v1.1"
git remote add origin https://github.com/stephen-lau321/xtwhttra.git
git push -u origin main
```

### 2. 在 Render 部署后端

Render 自动通过 `render.yaml` 配置部署。也可以手动：

1. Render Dashboard → New → Web Service → 连接 `stephen-lau321/xtwhttra`
2. 配置：
   | 配置项 | 值 |
   |--------|-----|
   | Name | notenear |
   | Runtime | Node |
   | Build Command | `cd backend && npm install && npx prisma generate && npx nest build` |
   | Start Command | `cd backend && npx prisma db push --accept-data-loss && npx prisma db seed && node dist/main.js` |
3. 添加环境变量（见下文）
4. 创建 PostgreSQL 数据库（Render 会自动根据 render.yaml 创建）

### 3. 环境变量

在 Render 的 **Environment** 选项卡设置：

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | Render PostgreSQL 连接串（自动注入） |
| `JWT_SECRET` | 随机字符串作为 JWT 密钥 |
| `JWT_EXPIRES_IN` | `30d` |
| `CORS_ORIGINS` | `https://stephen-lau321.github.io` |
| `AMAP_API_KEY` | `f1392fa410619aad5a6b18ee6da3c168` |

### 4. 部署前端到 GitHub Pages

```bash
cd frontend
npm run build
```

然后 GitHub 仓库 → Settings → Pages：
- Source: Deploy from a branch
- Branch: `main`
- Directory: `/frontend/dist`
- 保存

前端将在 `https://stephen-lau321.github.io/xtwhttra/` 上线。

### 5. 高德地图配置

打开高德开放平台控制台 → 应用管理 → 我的应用：
- 安全域名添加 `stephen-lau321.github.io`
- 如使用自定义域名，也加上

---

## 后端 API 文档

部署后访问：`https://notenear.onrender.com/api/docs`

---

## 项目结构
```
street-music/
├── backend/                    # NestJS 后端
│   ├── src/
│   │   ├── auth/              # 认证模块
│   │   ├── user/              # 用户模块
│   │   ├── teacher/           # 老师认证模块
│   │   ├── street-claim/      # 街道认领模块
│   │   ├── activity/          # 活动发布模块
│   │   ├── media/             # 媒体文件模块
│   │   ├── map/               # 地图/位置模块
│   │   ├── product/           # 商品模块
│   │   ├── order/             # 订单模块
│   │   ├── admin/             # 管理后台模块
│   │   ├── prisma/            # 数据库服务
│   │   └── common/            # 公共工具
│   └── prisma/
│       └── schema.prisma      # 数据库模型 (PostgreSQL + PostGIS)
├── frontend/                   # React + Vite 前端
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   ├── components/        # 通用组件
│   │   ├── api/               # API 客户端
│   │   └── types/             # TypeScript 类型
│   └── public/                # 静态资源
├── docker-compose.yml          # PostgreSQL + Redis
├── render.yaml                 # Render 部署配置
└── setup-dev.bat              # 本地开发启动脚本
```

## 日常维护
```bash
# 查看后端日志
Render Dashboard → notenear → Logs

# 重新部署
Render Dashboard → notenear → Manual Deploy → Deploy latest commit

# 更新代码
git add . && git commit -m "更新说明" && git push
```
