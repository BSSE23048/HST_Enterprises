import re
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = root / 'frontend/public/company'
out.mkdir(parents=True, exist_ok=True)
assets = {
    'industry.webp': 'https://images.unsplash.com/photo-1496247749665-49cf5b1022e9?auto=format&fit=crop&w=1500&q=85&fm=webp',
    'industry-small.webp': 'https://images.unsplash.com/photo-1496247749665-49cf5b1022e9?auto=format&fit=crop&w=800&q=80&fm=webp',
    'power.webp': 'https://images.unsplash.com/photo-1681495628907-592089c3a546?auto=format&fit=crop&w=1100&q=82&fm=webp',
}
for name, url in assets.items():
    if (out / name).exists():
        continue
    with urllib.request.urlopen(url, timeout=60) as response:
        (out / name).write_bytes(response.read())
    print(name, (out / name).stat().st_size)
font_css = urllib.request.urlopen(urllib.request.Request(
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&display=swap',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'}), timeout=30).read().decode()
font_css = font_css[font_css.rfind('/* latin */'):] if '/* latin */' in font_css else font_css
font_urls = re.findall(r'url\((https://[^)]+)\)', font_css)
# Last face is Latin; CSS returned for this user agent may have individual weights.
for index, url in enumerate(dict.fromkeys(font_urls)):
    name = f'manrope-{index}.woff2'
    (out / name).write_bytes(urllib.request.urlopen(url, timeout=30).read())
    font_css = font_css.replace(url, '/company/' + name)
(out / 'fonts.css').write_text(font_css)
print('Optimized images and self-hosted fonts ready. Source PDFs remain private.')
