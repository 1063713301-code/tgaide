import json, urllib.request, urllib.error, time
from urllib.parse import urlparse

URL = 'https://pqladcebnqmovnskcklk.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA'

def fetch_favicon(domain):
    """Try multiple favicon sources, return (bytes, content_type) or None"""
    sources = [
        f'https://favicon.im/{domain}?larger=true',
        f'https://api.faviconkit.com/{domain}/128',
        f'https://{domain}/favicon.ico',
    ]
    for src in sources:
        try:
            req = urllib.request.Request(src, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=8) as r:
                data = r.read()
                ct = r.headers.get('Content-Type', 'image/png')
                # Skip tiny default favicons (< 500 bytes likely generic)
                if len(data) > 200 and ('image' in ct or data[:4] in (b'\x89PNG', b'GIF8', b'\xff\xd8')):
                    return data, ct, src
        except:
            continue
    return None, None, None

def upload_to_storage(tool_id, img_data, content_type):
    """Upload image to Supabase Storage and return public URL"""
    ext = 'ico' if 'ico' in content_type else 'png'
    path = f'icons/{tool_id}.{ext}'
    req = urllib.request.Request(
        f'{URL}/storage/v1/object/tool-icons/{path}',
        data=img_data,
        headers={
            'apikey': KEY,
            'Authorization': f'Bearer {KEY}',
            'Content-Type': content_type,
            'x-upsert': 'true',
        },
        method='POST'
    )
    with urllib.request.urlopen(req) as r:
        r.read()
    return f'{URL}/storage/v1/object/public/tool-icons/{path}'

def update_icon_url(tool_id, icon_url):
    data = json.dumps({'icon_url': icon_url}).encode()
    req = urllib.request.Request(
        f'{URL}/rest/v1/tools?id=eq.{tool_id}',
        data=data,
        headers={
            'apikey': KEY,
            'Authorization': f'Bearer {KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
        },
        method='PATCH'
    )
    with urllib.request.urlopen(req):
        pass

# Fetch tools without icon_url
req = urllib.request.Request(
    f'{URL}/rest/v1/tools?select=id,name,official_url,icon_url&order=created_at.desc&limit=100',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
)
with urllib.request.urlopen(req) as r:
    all_tools = json.load(r)

# Filter tools without icon_url
tools = [t for t in all_tools if not t.get('icon_url')]
print(f'Found {len(tools)} tools without icon_url')

ok = skip = err = 0
for i, t in enumerate(tools):
    official_url = (t.get('official_url') or '').strip()
    if not official_url:
        print(f'[{i+1}/{len(tools)}] SKIP {t["name"]} (no official_url)')
        skip += 1
        continue

    parsed = urlparse(official_url)
    domain = parsed.netloc or parsed.path
    domain = domain.lstrip('www.')

    img_data, ct, src = fetch_favicon(domain)
    if img_data:
        try:
            storage_url = upload_to_storage(t['id'], img_data, ct or 'image/png')
            update_icon_url(t['id'], storage_url)
            print(f'[{i+1}/{len(tools)}] OK  {t["name"]} <- {src}')
            ok += 1
        except Exception as e:
            print(f'[{i+1}/{len(tools)}] ERR {t["name"]}: {e}')
            err += 1
    else:
        print(f'[{i+1}/{len(tools)}] SKIP {t["name"]} (no favicon found)')
        skip += 1

    time.sleep(0.3)  # be polite to favicon services

print(f'\nDone: {ok} uploaded, {skip} skipped, {err} errors')
