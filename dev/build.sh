#!/usr/bin/env bash
# 스테이지 제로 메이커 빌드: dev/stagezero-maker.html(원본) → 저장소 루트 index.html(PWA) + sw.js 캐시 갱신
# 사용: cd dev && ./build.sh     (필요: node + `npm i typescript`, python3)
set -e
cd "$(dirname "$0")"
node compat.js                                   # ES2017로 낮춘 stagezero-maker.compat.html 생성 (구형 iPad용)
python3 - <<'PY'
import json,re,os,hashlib
c=open('stagezero-maker.compat.html',encoding='utf8').read()
s=open('../index.html',encoding='utf8').read()
a=s.index('</head><body>')+len('</head><body>'); b=s.index('<div id="sw-bar"')
s=s[:a]+c+'\n\n'+s[b:]                           # PWA 껍데기(head·서비스워커 배너)는 그대로, 게임 본문만 교체
open('../index.html','w',encoding='utf8').write(s)
w=open('../sw.js',encoding='utf8').read()
m=re.search(r'ASSETS\s*=\s*(\[.*?\])',w,re.S); A=json.loads(m.group(1))
base=[x for x in A if 'art/' not in x]
new=base+['art/'+f for f in sorted(os.listdir('../art'))]
w=w[:m.start(1)]+json.dumps(new)+w[m.end(1):]
h=hashlib.md5(s.encode()+''.join(sorted(os.listdir('../art'))).encode()).hexdigest()[:10]
w=re.sub(r"CACHE='stagezero-[^']*'","CACHE='stagezero-%s'"%h,w)
open('../sw.js','w',encoding='utf8').write(w)
print('index.html + sw.js updated, assets',len(new),'cache',h)
PY
echo "다음: node sim14.js && node sim19.js (오류 0 확인) → git commit/push"
