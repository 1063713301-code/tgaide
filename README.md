# TG AI工具库 (tgaide.com)

> 每日更新最新AI工具上线、重大更新、行业趋势与避坑指南

## 技术栈

- **前端**：React 18 + Vite + Tailwind CSS v3
- **富文本**：Tiptap（支持Word粘贴，自动清理MSO格式）
- **数据库**：Supabase（PostgreSQL + Storage）
- **部署**：Vercel

---

## 快速启动

### 第一步：克隆并安装依赖

```bash
cd tgaide
npm install
```

### 第二步：创建 Supabase 项目

1. 访问 [https://app.supabase.com](https://app.supabase.com)，创建新项目
2. 进入 **SQL Editor**，粘贴 `supabase/schema.sql` 全部内容并执行
3. 复制项目的 **Project URL** 和 **anon public key**

### 第三步：配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```env
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_ADMIN_PASSWORD=your_secure_password
VITE_SITE_URL=https://tgaide.com
```

### 第四步：本地启动

```bash
npm run dev
# 访问 http://localhost:3000
```

---

## Vercel 一键部署

### 方法一：Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

按提示添加环境变量：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_ADMIN_PASSWORD`

### 方法二：GitHub 自动部署

1. 将项目推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入仓库
3. 在 **Settings → Environment Variables** 中添加以下变量：

| 变量名 | 说明 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_ADMIN_PASSWORD` | 后台管理密码 |
| `VITE_SITE_URL` | 网站域名（如 https://tgaide.com） |

4. 点击 **Deploy** 即可

---

## 阿里云域名解析配置（tgaide.com → Vercel）

在阿里云域名控制台添加以下 DNS 记录：

| 主机记录 | 记录类型 | 记录值 |
|----------|----------|--------|
| `@` | CNAME | `cname.vercel-dns.com` |
| `www` | CNAME | `cname.vercel-dns.com` |

> 注意：阿里云国内备案不影响 Vercel 部署，无需重新备案。

在 Vercel 项目设置 → **Domains** 中添加 `tgaide.com` 和 `www.tgaide.com`。

---

## 后台管理

访问 `/admin`，默认密码：`admin123`（建议在 `.env` 中修改 `VITE_ADMIN_PASSWORD`）。

### 功能
- 创建/编辑/删除行业报告和每日简报
- 支持发布状态（已发布/草稿）管理
- 实时预览功能
- Word内容直接粘贴

---

## Word 粘贴测试指南

1. 打开任意 Word 文档，选中含有**标题、加粗、表格、彩色文字**的内容
2. 按 `Ctrl+C` 复制
3. 在后台编辑器中点击编辑区域
4. 按 `Ctrl+V` 粘贴
5. 观察效果：
   - ✅ 标题层级保留（H1/H2/H3）
   - ✅ 加粗/斜体/下划线保留
   - ✅ 文字颜色保留
   - ✅ 表格结构保留
   - ✅ 有序/无序列表保留
   - ✅ Word的MSO冗余代码已自动清理

---

## 图片存储（阿里云 OSS）

PDF 文件继续使用阿里云 OSS，在编辑器中填写 OSS 公开访问链接即可。

编辑器内粘贴的图片会自动上传至 **Supabase Storage**（article-images 存储桶）。

---

## SEO 配置

- 所有页面自动设置 `<title>` 和 `<meta description>`
- 详情页自动注入 JSON-LD 结构化数据（Article 类型）
- `public/robots.txt` 已配置，屏蔽 `/admin` 路径
- Sitemap 通过 Supabase 数据动态生成（见 `src/lib/supabase.js` 的 `fetchSitemapUrls`）

---

## 项目结构

```
tgaide/
├── public/
│   ├── robots.txt
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # 导航栏
│   │   ├── Footer.jsx          # 页脚
│   │   ├── CategoryTags.jsx    # 职业分类标签
│   │   ├── ArticleCard.jsx     # 文章卡片（整块可点击）
│   │   ├── PdfButton.jsx       # 绿色PDF下载按钮
│   │   ├── RichTextContent.jsx # 详情页富文本渲染
│   │   └── RichTextEditor.jsx  # Tiptap编辑器（Word粘贴优化）
│   ├── pages/
│   │   ├── Home.jsx            # 首页
│   │   ├── IndustryReports.jsx # 行业报告列表
│   │   ├── DailyBriefs.jsx     # 每日简报列表
│   │   ├── ArticleDetail.jsx   # 详情页（共用）
│   │   └── admin/
│   │       ├── Login.jsx       # 后台登录
│   │       ├── Dashboard.jsx   # 后台首页
│   │       ├── ArticleList.jsx # 内容列表管理
│   │       └── ArticleEditor.jsx # 内容编辑器
│   ├── hooks/
│   │   └── useAuth.js          # 后台认证
│   ├── lib/
│   │   └── supabase.js         # Supabase CRUD工具
│   ├── App.jsx                 # 路由配置
│   ├── main.jsx                # 入口
│   └── index.css               # 全局样式（含富文本样式）
├── supabase/
│   └── schema.sql              # 数据库初始化脚本
├── .env.example
├── vercel.json                 # Vercel SPA路由配置
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

© 2026 TG AI工具库 | www.tgaide.com
