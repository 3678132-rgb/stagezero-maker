import base64,os,json,re
src=open('stagezero-maker.compat.html',encoding='utf8').read()
art={}
for f in sorted(os.listdir('art')):
    if f.endswith(('.jpg','.png')):
        mt='image/png' if f.endswith('.png') else 'image/jpeg'
        art['art/'+f]='data:%s;base64,%s'%(mt,base64.b64encode(open('art/'+f,'rb').read()).decode())
# 1) 정적 HTML의 그림은 빌드 때 바로 데이터로 박아 넣는다 (스크립트 없이도 보이게)
body=re.sub(r'src="(art/[^"$]+)"',lambda m:'src="%s"'%art.get(m.group(1),m.group(1)),src)
# 2) 스크립트에서 만드는 경로는 전역 함수 __A()로 감싼다: 템플릿/따옴표 문자열 모두
def wrap_js(js):
    # 백틱 템플릿 안의  art/....(jpg|png)  →  ${__A(`art/...`)}
    js=re.sub(r'(?<![\'(])art/((?:[^`\'"\s<>()]|\$\{[^}]*\})+?\.(?:jpg|png))', lambda m:'${__A(`art/%s`)}'%m.group(1), js)
    return js
head,rest=body.split('<script>',1); code,tail=rest.split('</script>',1)
# 따옴표 리터럴 'art/x.jpg' → __A('art/x.jpg') 먼저
code=re.sub(r"'(art/[^'$]+?\.(?:jpg|png))'", r"__A('\1')", code)
# 템플릿 안 (따옴표/괄호 뒤가 아닌) 경로
code=wrap_js(code)
# `${__A(`art/..`)}` 단독 템플릿은 그대로 둬도 유효
shim="""<script>
window.__ART=%s;
function __A(p){ return (window.__ART && window.__ART[p]) || p; }
(function(){
  const A=window.__ART, fixCss=s=>typeof s==='string'?s.replace(/url\\((['"]?)(art\\/[^'")]+)\\1\\)/g,(m,q,p)=>A[p]?'url("'+A[p]+'")':m):s;
  const walk=n=>{ try{ if(n.nodeType!==1) return; const all=[n,...n.querySelectorAll('img[src^="art/"],[style*="art/"]')];
    for(const e of all){ if(e.tagName==='IMG'){ const s=e.getAttribute('src'); if(A[s]) e.setAttribute('src',A[s]); }
      const st=e.getAttribute('style'); if(st&&st.indexOf('art/')>=0) e.setAttribute('style',fixCss(st)); } }catch(e){} };
  try{ new MutationObserver(ms=>{ for(const m of ms){ if(m.type==='childList') m.addedNodes.forEach(walk); else walk(m.target); } })
    .observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','style']}); }catch(e){}
  // 그림이 막히는 미리보기 화면(앱 내 파일 뷰어 등)인지 확인해서 안내한다
  const t=new Image(); t.onerror=function(){ const b=document.createElement('div'); b.setAttribute('role','alert');
    b.style.cssText='position:fixed;left:8px;right:8px;top:8px;z-index:99999;background:#fff3cd;border:2px solid #e0a800;border-radius:12px;padding:12px 14px;font:600 14px/1.5 system-ui,sans-serif;color:#5a4300;box-shadow:0 6px 20px rgba(0,0,0,.2)';
    b.innerHTML='이 화면(앱 안의 파일 미리보기)에서는 그림이 차단돼요.<br>파일을 <b>Chrome</b>이나 <b>Safari</b> 같은 브라우저로 열어 주세요.';
    (document.body||document.documentElement).appendChild(b); };
  t.src=A['art/age20_ok.jpg'];
})();
</script>
"""%json.dumps(art)
out='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style>'+shim+'</head><body>'+head+'<script>'+code+'</script>'+tail+'</body></html>'
open('stagezero-maker-offline.html','w',encoding='utf8').write(out)
open('offline_code_check.js','w',encoding='utf8').write(code)
print(len(out)/1e6,'MB', len(art),'images')
