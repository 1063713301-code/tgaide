import json, urllib.request, re, glob, os

URL = 'https://pqladcebnqmovnskcklk.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA'

def parse_values_block(sql):
    """Extract individual VALUE rows from INSERT statement"""
    # Find everything after VALUES
    m = re.search(r'VALUES\s*\n(.*)', sql, re.DOTALL | re.IGNORECASE)
    if not m:
        return []
    body = m.group(1).strip()
    rows = []
    depth = 0
    current = ''
    i = 0
    while i < len(body):
        c = body[i]
        if c == '(' and depth == 0:
            depth = 1
            current = '('
        elif c == '(' and depth > 0:
            depth += 1
            current += c
        elif c == ')' and depth > 1:
            depth -= 1
            current += c
        elif c == ')' and depth == 1:
            current += ')'
            rows.append(current.strip())
            current = ''
            depth = 0
        elif depth > 0:
            current += c
        i += 1
    return rows

def parse_row(row_str):
    """Parse a single VALUES row into a dict matching the columns"""
    cols = ['name','name_en','category','description','description_en','price','rating',
            'official_url','features','is_recommended','is_hot','is_new','slug','short_tag',
            'full_desc','highlights','drawbacks','tg_advice','tags','sort_order','status']
    # Remove outer parens
    inner = row_str[1:-1].strip()
    values = []
    i = 0
    while i < len(inner):
        inner = inner[i:].lstrip()
        i = 0
        if inner.startswith("'"):
            # string
            j = 1
            s = ''
            while j < len(inner):
                if inner[j] == "'" and inner[j-1] != '\\':
                    if j+1 < len(inner) and inner[j+1] == "'":
                        s += "'"
                        j += 2
                        continue
                    break
                s += inner[j]
                j += 1
            values.append(s)
            inner = inner[j+1:].lstrip().lstrip(',').lstrip()
            i = 0
        elif inner.startswith('ARRAY['):
            j = inner.index(']') + 1
            arr_str = inner[6:j-1]
            arr = [x.strip().strip("'") for x in arr_str.split(',') if x.strip()]
            values.append(arr)
            inner = inner[j:].lstrip().lstrip(',').lstrip()
            i = 0
        elif inner.lower().startswith('true'):
            values.append(True)
            inner = inner[4:].lstrip().lstrip(',').lstrip()
            i = 0
        elif inner.lower().startswith('false'):
            values.append(False)
            inner = inner[5:].lstrip().lstrip(',').lstrip()
            i = 0
        elif inner == '':
            break
        else:
            # number
            j = 0
            while j < len(inner) and inner[j] not in (',', ')'):
                j += 1
            values.append(inner[:j].strip())
            inner = inner[j:].lstrip().lstrip(',').lstrip()
            i = 0
        if not inner:
            break
    if len(values) != len(cols):
        return None
    obj = dict(zip(cols, values))
    obj['rating'] = float(obj['rating'])
    obj['sort_order'] = int(obj['sort_order'])
    return obj

def insert_tool(obj):
    data = json.dumps(obj).encode()
    req = urllib.request.Request(
        f'{URL}/rest/v1/tools',
        data=data,
        headers={
            'apikey': KEY,
            'Authorization': f'Bearer {KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=ignore-duplicates,return=minimal',
        },
        method='POST'
    )
    with urllib.request.urlopen(req) as r:
        return r.status

files = sorted(glob.glob('tools_import_1[6-9]*.sql') + glob.glob('tools_import_2[0-9]*.sql'))
print(f'Found {len(files)} SQL files: {files}')

total_ok = total_skip = total_err = 0
for f in files:
    print(f'\n=== {f} ===')
    sql = open(f, encoding='utf-8').read()
    rows = parse_values_block(sql)
    print(f'  Parsed {len(rows)} rows')
    ok = skip = err = 0
    for row_str in rows:
        obj = parse_row(row_str)
        if not obj:
            print(f'  PARSE ERROR: {row_str[:80]}')
            err += 1
            continue
        try:
            status = insert_tool(obj)
            if status in (200, 201):
                ok += 1
            else:
                skip += 1
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if 'duplicate' in body.lower() or '23505' in body:
                skip += 1
            else:
                print(f'  ERR {obj["slug"]}: {e.code} {body[:100]}')
                err += 1
        except Exception as e:
            print(f'  ERR {obj["slug"]}: {e}')
            err += 1
    print(f'  {ok} inserted, {skip} skipped, {err} errors')
    total_ok += ok; total_skip += skip; total_err += err

print(f'\nTotal: {total_ok} inserted, {total_skip} skipped, {total_err} errors')
