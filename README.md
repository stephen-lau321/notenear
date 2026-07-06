# 乐邻 · 让艺术体验就在咫尺之间 (Street Music)

## 项目简介
连接乐器老师与周边居民的社交活动平台。老师认领街道、发布音乐社交活动，居民通过地图寻找身边的音乐体验。

## 快速启动

### 环境要求
- Node.js >= 18
- Docker & Docker Compose（用于 PostgreSQL + Redis）

### 安装依赖
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 启动数据库
```bash
docker compose up -d
```

### 运行数据库迁移
```bash
cd backend && npx prisma migrate dev
```

### 启动开发服务器
```bash
# 后端 (http://localhost:3000)
cd backend && npm run start:dev

# 前端 (http://localhost:5173)
cd frontend && npm run dev
```

## 项目结构
```
street-music/
├── backend/          # NestJS 后端
│   ├── src/
│   │   ├── auth/         # 认证模块
│   │   ├── user/         # 用户模块
│   │   ├── teacher/      # 老师认证模块
│   │   ├── street-claim/ # 街道认领模块
│   │   ├── activity/     # 活动发布模块
│   │   ├── media/        # 媒体文件模块
│   │   ├── map/          # 地图/位置模块
│   │   ├── prisma/       # 数据库服务
│   │   └── common/       # 公共工具
│   ├── prisma/
│   │   └── schema.prisma # 数据库模型
│   └── package.json
├── frontend/         # React + Vite 前端
│   └── src/
│       ├── pages/        # 页面组件
│       ├── components/   # 通用组件
│       ├── api/          # API 客户端
│       ├── hooks/        # 自定义 Hooks
│       └── types/        # TypeScript 类型
└── docker-compose.yml
```
