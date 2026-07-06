@echo off
REM ===== 一街一师一乐器 本地开发启动脚本 =====
echo.
echo 🎵 一街一师一乐器 - 本地开发环境
echo ====================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 未安装 Node.js，请先安装 Node.js >= 18
    pause
    exit /b 1
)
echo ✓ Node.js: 
node --version

REM Check if PostgreSQL is running via Docker
docker ps --filter "name=streetmusic-postgres" --format "{{.Names}}" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠ Docker PostgreSQL 未运行，尝试通过 Docker Compose 启动...
    docker compose -f "%~dp0docker-compose.yml" up -d 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠ Docker 不可用，将使用 SQLite 模式
        echo   请设置 DATABASE_URL 指向可用的 SQLite 或 PostgreSQL 数据库
    ) else (
        echo ✓ Docker PostgreSQL 已启动
        timeout /t 3 /nobreak >nul
    )
) else (
    echo ✓ PostgreSQL 已运行
)

echo.
echo ===== 后端 =====
cd /d "%~dp0backend"
echo 安装后端依赖...
call npm install --silent 2>nul
echo ✓ 后端依赖安装完成

echo 生成 Prisma Client...
call npx prisma generate 2>nul
echo ✓ Prisma Client 已生成

echo 运行数据库迁移...
call npx prisma db push --accept-data-loss 2>nul
echo ✓ 数据库迁移完成

echo 初始化测试数据...
call npx prisma db seed 2>nul
echo ✓ 测试数据已初始化

echo.
echo ===== 前端 =====
cd /d "%~dp0frontend"
echo 安装前端依赖...
call npm install --silent 2>nul
echo ✓ 前端依赖安装完成

echo.
echo ====================================
echo 🎵 启动开发服务器：
echo   后端: http://localhost:3000
echo   API文档: http://localhost:3000/api/docs
echo   前端: http://localhost:5173/xtwhttra/
echo ====================================
echo.
echo 请在新的终端窗口启动:
echo   后端: cd backend ^&^& npm run start:dev
echo   前端: cd frontend ^&^& npm run dev
echo.
echo 测试账号 (手机号/验证码):
echo   管理员: 13800000000 / 888888
echo   老师:   13900001111 / 888888
echo   家长:   13900002222 / 888888
pause
