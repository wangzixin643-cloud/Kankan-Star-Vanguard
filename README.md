# 星际先锋 (Star Vanguard)

一款视觉效果出色的太空战机射击游戏，基于 React + Vite + Tailwind CSS 构建。

## 部署到 Vercel 指南

为了将此游戏部署到 Vercel 并使其正常运行，请遵循以下步骤：

### 1. 同步到 GitHub
1. 在 GitHub 上创建一个新的仓库。
2. 在本地项目目录中运行：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <你的仓库URL>
   git push -u origin main
   ```

### 2. 在 Vercel 上部署
1. 登录 [Vercel](https://vercel.com)。
2. 点击 **"Add New"** -> **"Project"**。
3. 导入你刚刚创建的 GitHub 仓库。
4. **关键步骤：配置环境变量**
   - 在部署设置的 **"Environment Variables"** 部分，添加以下变量：
     - `GEMINI_API_KEY`: 你的 Google Gemini API 密钥（如果游戏逻辑中使用了 AI 功能）。
5. 点击 **"Deploy"**。

### 3. 项目结构说明
- `public/`: 存放静态资源（如战机和敌机图片）。部署后，这些资源将可以通过根路径访问。
- `src/`: 源代码目录。
- `vercel.json`: 配置了单页应用（SPA）路由，确保刷新页面时不会出现 404。

## 开发
运行开发服务器：
```bash
npm run dev
```

构建生产版本：
```bash
npm run build
```
