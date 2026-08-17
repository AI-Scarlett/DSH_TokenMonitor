#!/usr/bin/env python3
"""Create a deterministic production bundle without third-party tooling."""
from pathlib import Path
import hashlib, re, shutil
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
ASSETS=['styles.css','app.js']
if DIST.exists(): shutil.rmtree(DIST)
(DIST/'assets').mkdir(parents=True)
html=(ROOT/'index.html').read_text(encoding='utf-8')
for name in ASSETS:
    raw=(ROOT/name).read_text(encoding='utf-8')
    digest=hashlib.sha256(raw.encode()).hexdigest()[:8]
    stem,suffix=name.rsplit('.',1)
    built=f'{stem}.{digest}.{suffix}'
    # Conservative minification keeps JavaScript semantics intact.
    if suffix=='css':
        output=re.sub(r'/\*.*?\*/','',raw,flags=re.S)
        output=re.sub(r'\s+',' ',output).replace(' {','{').replace('{ ','{').replace('; ',';').replace(': ',':').strip()
    else:
        output=raw.strip()+'\n'
    (DIST/built).write_text(output,encoding='utf-8')
    html=html.replace(name,built)
(DIST/'index.html').write_text(html,encoding='utf-8')
shutil.copy2(ROOT/'assets'/'favicon.svg',DIST/'assets'/'favicon.svg')
manifest='\n'.join(f'{p.relative_to(DIST)}  {hashlib.sha256(p.read_bytes()).hexdigest()}' for p in sorted(DIST.rglob('*')) if p.is_file())+'\n'
(DIST/'SHA256SUMS').write_text(manifest,encoding='utf-8')
print(f'Built {len(list(DIST.rglob("*")))} artifacts in {DIST}')
