import json, urllib.request, urllib.error
from urllib.parse import urlparse

URL = 'https://pqladcebnqmovnskcklk.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA'

req = urllib.request.Request(
    f'{URL}/rest/v1/tools?select=id,name,official_url,icon_url&limit=400',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
)
with urllib.request.urlopen(req) as r:
    tools = json.load(r)

ok = skip = err = 0
for t in tools:
    # Skip tools already uploaded to Supabase storage (manually uploaded icons)
    icon = t.get('icon_url', '') or ''
    if 'supabase' in icon:
        skip += 1
        continue

    official_url = (t.get('official_url') or '').strip()
    if not official_url:
        skip += 1
        continue

    parsed = urlparse(official_url)
    domain = parsed.netloc or parsed.path
    # Remove www. prefix for cleaner favicon lookup
    domain = domain.replace('www.', '') if domain.startswith('www.') else domain

    icon_url = f'https://favicon.im/{domain}?larger=true'

    data = json.dumps({'icon_url': icon_url}).encode()
    patch = urllib.request.Request(
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
        with urllib.request.urlopen(patch):
            ok += 1
    except Exception as e:
        print(f'ERR {t["name"]}: {e}')
        err += 1

print(f'Done: {ok} updated, {skip} skipped (Supabase storage), {err} errors')
