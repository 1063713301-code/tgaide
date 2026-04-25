import json, urllib.request, re, sys

URL = 'https://pqladcebnqmovnskcklk.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA'
COLS = ['name','name_en','category','description','description_en','price','rating',
        'official_url','features','is_recommended','is_hot','is_new','slug','short_tag',
        'full_desc','highlights','drawbacks','tg_advice','tags','sort_order','status']

def parse_rows(sql):
    m = re.search(r'VALUES\s*\n(.*)', sql, re.DOTALL | re.IGNORECASE)
    if not m:
        return []
    body = m.group(1).strip()
    rows, depth, cur, i = [], 0, '', 0
    while i < len(body):
        c = body[i]
        if c == '(' and depth == 0:
            depth, cur = 1, '('
        elif c == '(' and depth > 0:
            depth += 1; cur += c
        elif c == ')' and depth > 1:
            depth -= 1; cur += c
        elif c == ')' and depth == 1:
            rows.append(cur + ')'); cur = ''; depth = 0
        elif depth > 0:
            cur += c
        i += 1
    return rows

def parse_row(row_str):
    inner = row_str[1:-1].strip()
    values, i = [], 0
    while i < len(inner):
        inner = inner[i:].lstrip()
        i = 0
        if not inner:
            break
        if inner.startswith("'"):
            j, s = 1, ''
            while j < len(inner):
                if inner[j] == "'" and (j+1 >= len(inner) or inner[j+1] != "'"):
                    break
                if inner[j] == "'" and inner[j+1] == "'":
                    s += "'"; j += 2; continue
                s += inner[j]; j += 1
            values.append(s)
            inner = inner[j+1:].lstrip().lstrip(',')
        elif inner.startswith('ARRAY['):
            j = inner.index(']') + 1
            arr = [x.strip().strip("'") for x in inner[6:j-1].split(',') if x.strip()]
            values.append(arr)
            inner = inner[j:].lstrip().lstrip(',')
        elif inner.lower().startswith('true'):
            values.append(True); inner = inner[4:].lstrip().lstrip(',')
        elif inner.lower().startswith('false'):
            values.append(False); inner = inner[5:].lstrip().lstrip(',')
        else:
            j = 0
            while j < len(inner) and inner[j] not in (',',):
                j += 1
            values.append(inner[:j].strip()); inner = inner[j:].lstrip().lstrip(',')
    if len(values) != len(COLS):
        return None
    obj = dict(zip(COLS, values))
    obj['rating'] = float(obj['rating'])
    obj['sort_order'] = int(obj['sort_order'])
    return obj

def insert(obj):
    import time
    data = json.dumps(obj, ensure_ascii=False).encode('utf-8')
    for attempt in range(3):
        req = urllib.request.Request(
            f'{URL}/rest/v1/tools', data=data,
            headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}',
                     'Content-Type': 'application/json',
                     'Prefer': 'resolution=ignore-duplicates,return=minimal'},
            method='POST')
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, None
        except urllib.error.HTTPError as e:
            try:
                msg = e.read().decode()[:80]
            except Exception:
                msg = str(e.code)
            return e.code, msg
        except Exception as e:
            if attempt < 2:
                time.sleep(3)
            else:
                return 0, str(e)[:80]

files = sys.argv[1:] if len(sys.argv) > 1 else []
if not files:
    import glob
    files = sorted(glob.glob('tools_import_1[6-9]*.sql') + glob.glob('tools_import_2[0-9]*.sql'))

print(f'Files: {files}', flush=True)
total_ok = total_skip = total_err = 0

for f in files:
    sql = open(f, encoding='utf-8').read()
    rows = parse_rows(sql)
    print(f'\n{f}: {len(rows)} rows', flush=True)
    ok = skip = err = 0
    for row_str in rows:
        obj = parse_row(row_str)
        if not obj:
            print(f'  PARSE ERR', flush=True); err += 1; continue
        status, msg = insert(obj)
        if status in (200, 201):
            ok += 1; print(f'  OK  {obj["slug"]}', flush=True)
        elif status == 409 or (msg and 'duplicate' in msg.lower()):
            skip += 1; print(f'  DUP {obj["slug"]}', flush=True)
        else:
            err += 1; print(f'  ERR {obj["slug"]}: {status} {msg}', flush=True)
    print(f'  => {ok} ok, {skip} dup, {err} err', flush=True)
    total_ok += ok; total_skip += skip; total_err += err

print(f'\nDone: {total_ok} inserted, {total_skip} skipped, {total_err} errors', flush=True)
