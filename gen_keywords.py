import json, urllib.request, urllib.error

URL = 'https://pqladcebnqmovnskcklk.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA'

CAT_KW = {
    '律师': 'AI律师,法律AI,法律工具,律师助手',
    '设计师': 'AI设计,设计工具,创意AI,图像生成',
    '会计': 'AI会计,财税AI,财务工具,记账软件',
    '营销': 'AI营销,营销工具,内容创作,文案生成',
    '程序员': 'AI编程,代码工具,开发助手,代码补全',
    '学生': 'AI学习,学习工具,学生助手,论文写作',
}

SLUG_KW = {
    'harvey-ai': 'Harvey AI,合同审查,法律研究,文书起草,律所AI',
    'cocounsel': 'CoCounsel,汤森路透,Westlaw,法律研究,合同分析',
    'tongyi-fasui': '通义法睿,阿里法律AI,中文合同审查,法律文书',
    'luminance': 'Luminance,尽职调查,合同分析,多语言法律',
    'wusong-ai-pro': '无讼AI,中文案例检索,法律文书,DeepSeek法律',
    'westlaw-ai': 'Westlaw,汤森路透,案例检索,法规查询',
    'fagougou': '法狗狗,法律检索,裁判文书,法规搜索',
    'fadada': '法大大,电子合同,合同签署,区块链存证',
    'wusong': '无讼,裁判文书,法律检索,律师社区',
    'pkulaw': '北大法宝,法律数据库,法规检索,学术文献',
    'casetext': 'Casetext,AI判例,法律研究,GPT法律',
    'kira-systems': 'Kira,合同分析,条款提取,尽职调查',
    'westlaw-edge': 'Westlaw Edge,判例预测,引用分析,法律研究',
    'lexisnexis-ai': 'LexisNexis,全球法律库,法律研究,多国法律',
    'faxin': '法信,最高法,司法解释,指导案例',
    'zhichan-bao': '知产宝,知识产权,专利检索,商标比对',
    'ironclad': 'Ironclad,合同管理,合同工作流,电子签名',
    'lex-machina': 'Lex Machina,诉讼分析,法官分析,胜诉率',
    'spellbook': 'Spellbook,合同起草,Word插件,合同审查',
    'midjourney-v7': 'Midjourney V7,AI图像生成,文生图,设计素材',
    'kling-ai-2': '可灵AI 2.0,AI视频生成,文生视频,国产视频AI',
    'sora': 'Sora,OpenAI视频,AI视频生成,文生视频',
    'jimeng-ai-2': '即梦AI,字节AI,图像生成,视频生成',
    'ideogram-2': 'Ideogram 2.0,文字渲染,AI图像,矢量图生成',
    'recraft-v3': 'Recraft V3,矢量图,SVG生成,品牌设计',
    'runway-gen3': 'Runway Gen-3,AI视频,影视级视频,图生视频',
    'pika-2': 'Pika 2.0,AI视频,社媒视频,视频生成',
    'midjourney': 'Midjourney,AI绘画,文生图,图像生成',
    'adobe-firefly': 'Adobe Firefly,AI图像,商用授权,创意设计',
    'figma-ai': 'Figma AI,UI设计,原型设计,设计系统',
    'canva-ai': 'Canva AI,海报设计,模板设计,图片编辑',
    'photoroom': 'Photoroom,抠图,背景替换,电商图片',
    'runway-ml': 'Runway,AI视频,视频编辑,影视特效',
    'pika-labs': 'Pika,AI视频,动效生成,视频创作',
    'dall-e-3': 'DALL-E 3,OpenAI图像,文生图,AI绘画',
    'framer-ai': 'Framer AI,网页设计,UI设计,原型工具',
    'ideogram': 'Ideogram,AI图像,文字排版,图像生成',
    'recraft-ai': 'Recraft,矢量图,品牌设计,AI图像',
    'kling-ai': '可灵AI,视频生成,快手AI,文生视频',
    'luma-ai': 'Luma AI,3D生成,视频生成,NeRF',
    'spline-ai': 'Spline,3D设计,网页3D,交互设计',
    'uizard': 'Uizard,UI设计,原型生成,草图转设计',
    'visily': 'Visily,UI设计,原型工具,线框图',
    'galileo-ai': 'Galileo AI,UI生成,界面设计,AI原型',
    'magician-figma': 'Magician,Figma插件,AI设计,图标生成',
    'cleanup-pictures': '图片修复,去水印,AI修图,背景清除',
    'remove-bg': '抠图,背景去除,透明背景,图片处理',
    'upscayl': '图片放大,超分辨率,AI修图,图片增强',
    'clipdrop': 'Clipdrop,抠图,图片编辑,背景替换',
    'vectorizer-ai': '矢量化,SVG转换,图片矢量,设计工具',
    'colorize-cc': '图片上色,黑白照片,AI修复,老照片',
    'hotpot-ai': 'Hotpot AI,图片编辑,AI设计,图像处理',
    'pixlr-ai': 'Pixlr,图片编辑,在线PS,AI修图',
    'designify': 'Designify,产品图,背景替换,电商设计',
    'brandmark': 'Brandmark,Logo设计,品牌设计,AI标志',
    'looka': 'Looka,Logo生成,品牌设计,AI标志',
    'namelix': 'Namelix,品牌命名,公司取名,AI命名',
    'fontjoy': 'Fontjoy,字体搭配,字体设计,排版工具',
    'khroma': 'Khroma,配色方案,颜色搭配,AI配色',
    'patterned-ai': 'Patterned AI,图案生成,纹理设计,背景图案',
    'artbreeder': 'Artbreeder,图像混合,AI艺术,人像生成',
    'playground-ai': 'Playground AI,图像生成,AI绘画,免费AI图',
    'leonardo-ai': 'Leonardo AI,游戏素材,AI图像,角色设计',
    'stylar-ai': 'Stylar AI,风格迁移,AI图像,艺术风格',
    'wepik-ai': 'Wepik,模板设计,海报制作,AI设计',
    'autodraw': 'AutoDraw,手绘识别,快速绘图,谷歌AI',
    'beautiful-ai': 'Beautiful AI,PPT制作,演示文稿,AI幻灯片',
    'gamma-app': 'Gamma,AI演示,PPT生成,幻灯片制作',
    'tome-ai': 'Tome,AI演示,故事叙述,幻灯片生成',
    'visme-ai': 'Visme,信息图表,数据可视化,AI设计',
    'suno-ai': 'Suno,AI音乐,音乐生成,歌曲创作',
    'udio': 'Udio,AI音乐,音乐生成,歌曲制作',
    'kingdee-ai': '金蝶AI,财务机器人,智能记账,自动报税',
    'yonyou-ai': '用友AI,财务管理,智能财务,企业ERP',
    'baiwang-ai': '百望云,税务申报,发票识别,增值税',
    'turbotax-ai': 'TurboTax,美国报税,个人所得税,退税',
    'sap-joule': 'SAP Joule,企业财务,ERP AI,财务分析',
    'kingdee-star': '金蝶星辰,中小企业,财务软件,记账',
    'chanjet': '畅捷通,小微企业,财务管理,记账软件',
    'quickbooks-ai': 'QuickBooks,美国财务,小企业会计,财务软件',
    'xero-ai': 'Xero,云端会计,财务管理,小企业',
    'sage-ai': 'Sage,财务软件,会计工具,企业财务',
    'botkeeper': 'Botkeeper,AI记账,自动化会计,财务机器人',
    'dext': 'Dext,票据管理,发票识别,费用报销',
    'expensify': 'Expensify,费用报销,差旅管理,发票扫描',
    'ramp': 'Ramp,企业支出,费用管理,公司信用卡',
    'brex': 'Brex,企业财务,支出管理,初创公司',
    'vic-ai': 'Vic AI,应付账款,发票处理,财务自动化',
    'docyt': 'Docyt,AI记账,财务自动化,小企业会计',
    'planful': 'Planful,财务规划,预算管理,FP&A',
    'puzzle-io': 'Puzzle,初创公司,财务管理,自动记账',
    'zeni': 'Zeni,初创公司,AI财务,实时账本',
    'tax-ai-assistant': 'AI税务,税务筹划,税务咨询,报税助手',
    'fapiao-bao': '发票宝,发票管理,票据识别,报销工具',
    'jasper-ai': 'Jasper AI,营销文案,内容创作,广告文案',
    'copy-ai': 'Copy.ai,文案生成,营销内容,广告创意',
    'huoshan-writing': '火山写作,中文文案,小红书文案,抖音文案',
    'juliang-ai': '巨量引擎,抖音广告,信息流广告,广告投放',
    'hubspot-ai': 'HubSpot AI,营销自动化,CRM,邮件营销',
    'mem-ai': 'Mem AI,知识管理,笔记工具,AI助手',
    'notion-calendar': 'Notion日历,日程管理,任务规划,效率工具',
    'cursor': 'Cursor,AI代码编辑器,AI编程,代码补全,Agent编程',
    'windsurf': 'Windsurf,AI IDE,代码编辑器,Cascade编程',
    'tongyi-lingma': '通义灵码,阿里AI编程,代码补全,中文注释',
    'bolt-new': 'Bolt.new,全栈生成,Web应用,无代码开发',
    'devin-2': 'Devin 2.0,AI工程师,自主编程,代码代理人',
    'github-copilot': 'GitHub Copilot,代码补全,AI编程,微软AI',
    'codeium': 'Codeium,免费AI编程,代码补全,IDE插件',
    'lovable': 'Lovable,全栈生成,Web应用,AI开发',
    'v0-vercel': 'v0,React组件,UI生成,Vercel AI',
    'aider': 'Aider,命令行AI,代码助手,Git集成',
    'cline': 'Cline,VS Code AI,代码代理,自主编程',
    'blackbox-ai': 'Blackbox AI,代码搜索,代码补全,编程助手',
    'fitten-code': 'Fitten Code,国产AI编程,代码补全,免费编程',
    'mutable-ai': 'Mutable AI,代码重构,文档生成,AI编程',
    'stenography': 'Stenography,代码文档,自动注释,代码解释',
    'coderabbit': 'CodeRabbit,代码审查,PR review,AI代码评审',
    'sweep-ai': 'Sweep AI,GitHub Issues,自动修复,代码代理',
    'devin-ai': 'Devin,AI软件工程师,自主编程,代码代理',
    'cursor-rules': 'Cursor Rules,AI编程规则,代码规范,Cursor配置',
    'supabase-ai': 'Supabase AI,数据库助手,SQL生成,后端开发',
    'railway': 'Railway,云部署,后端托管,DevOps',
    'grafana-ai': 'Grafana AI,监控可视化,数据看板,运维工具',
    'zed-editor': 'Zed,高性能编辑器,AI代码,协作编程',
    'llamaindex': 'LlamaIndex,RAG框架,AI应用开发,向量数据库',
    'perplexity-pro': 'Perplexity Pro,AI搜索,学术搜索,文献检索',
    'elicit': 'Elicit,文献综述,学术研究,论文分析',
    'consensus': 'Consensus,学术共识,论文检索,研究综述',
    'metaso': '秘塔AI搜索,中文搜索,学术搜索,无广告搜索',
    'scite-ai': 'Scite AI,引用分析,论文可靠性,学术评估',
    'perplexity-ai': 'Perplexity,AI搜索,实时搜索,引用来源',
    'perplexity-student': 'Perplexity,学术搜索,文献检索,AI搜索',
    'chatgpt-student': 'ChatGPT,AI助手,论文写作,学习辅助',
    'claude-ai-student': 'Claude AI,AI写作,学术写作,论文辅助',
    'grammarly-student': 'Grammarly,英文写作,语法检查,论文润色',
    'notion-ai-student': 'Notion AI,笔记管理,知识整理,学习笔记',
    'quizlet-ai': 'Quizlet,单词记忆,闪卡学习,备考工具',
    'khanmigo': 'Khanmigo,可汗学院,AI辅导,个性化学习',
    'studysmarter': 'StudySmarter,智能学习,备考工具,知识卡片',
    'photomath': 'Photomath,拍照解题,数学辅助,作业帮手',
    'symbolab': 'Symbolab,数学计算,公式推导,数学工具',
    'mathway': 'Mathway,数学解题,计算器,作业辅助',
    'socratic-google': 'Socratic,谷歌学习,拍照答题,作业辅助',
    'chegg-ai': 'Chegg AI,作业辅助,学科答疑,学习平台',
    'duolingo-ai': 'Duolingo,语言学习,英语学习,AI外语',
    'natural-reader': 'Natural Reader,文字转语音,朗读工具,听书',
    'speechify': 'Speechify,文字转语音,听书,阅读辅助',
    'otter-ai-student': 'Otter AI,会议记录,语音转文字,课堂笔记',
    'readwise-reader': 'Readwise,阅读管理,知识积累,文章收藏',
    'canva-ai-student': 'Canva,学生设计,PPT制作,海报设计',
    'canva-text-to-image': 'Canva AI图像,文生图,设计素材,AI绘图',
    'mindmeister': 'MindMeister,思维导图,知识整理,头脑风暴',
    'miro-ai-student': 'Miro AI,白板协作,思维导图,团队协作',
    'quillbot': 'QuillBot,论文改写,英文润色,语法优化',
    'jimeng-ai': '即梦AI,字节AI,图像生成,AI绘画',
}

# Load tools
with open('C:/Users/zrp8db/tgaide/tools_list.json', encoding='utf-8') as f:
    tools = json.load(f)

# Update each tool
ok = 0
err = 0
for t in tools:
    slug = t.get('slug', '')
    cat = t.get('category', '')
    name = t.get('name', '')
    name_en = t.get('name_en', '') or ''

    parts = [name]
    if name_en and name_en != name:
        parts.append(name_en)
    if slug in SLUG_KW:
        parts.append(SLUG_KW[slug])
    if cat in CAT_KW:
        parts.append(CAT_KW[cat])

    keywords = ','.join(parts)

    data = json.dumps({'keywords': keywords}).encode('utf-8')
    req = urllib.request.Request(
        f'{URL}/rest/v1/tools?id=eq.{t["id"]}',
        data=data,
        headers={
            'apikey': KEY,
            'Authorization': f'Bearer {KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
        },
        method='PATCH'
    )
    try:
        with urllib.request.urlopen(req):
            ok += 1
    except urllib.error.HTTPError as e:
        print(f'ERR {name}: {e.read().decode()[:80]}')
        err += 1

print(f'Done: {ok} updated, {err} errors')
