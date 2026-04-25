import json, urllib.request, urllib.error, time

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

# Fetch all tools without keywords (or empty keywords)
req = urllib.request.Request(
    f'{URL}/rest/v1/tools?select=id,name,name_en,slug,category,keywords&keywords=is.null&limit=500',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
)
with urllib.request.urlopen(req) as r:
    tools = json.load(r)

print(f'Tools without keywords: {len(tools)}', flush=True)

ok = err = 0
for t in tools:
    name = t.get('name', '')
    name_en = t.get('name_en', '') or ''
    cat = t.get('category', '')
    parts = [name]
    if name_en and name_en != name:
        parts.append(name_en)
    if cat in CAT_KW:
        parts.append(CAT_KW[cat])
    keywords = ','.join(parts)

    data = json.dumps({'keywords': keywords}, ensure_ascii=False).encode('utf-8')
    patch = urllib.request.Request(
        f'{URL}/rest/v1/tools?id=eq.{t["id"]}',
        data=data,
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}',
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        method='PATCH'
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(patch, timeout=20):
                ok += 1
                print(f'OK  {name}', flush=True)
            break
        except Exception as e:
            if attempt < 2:
                time.sleep(2)
            else:
                print(f'ERR {name}: {e}', flush=True)
                err += 1

print(f'\nDone: {ok} updated, {err} errors', flush=True)
