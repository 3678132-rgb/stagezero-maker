// 구형 iPad/iOS(12~13)용: 스크립트를 ES2017로 낮춰 stagezero-maker.compat.html 생성
const fs=require('fs'), ts=require('typescript');
const s=fs.readFileSync('stagezero-maker.html','utf8');
const i=s.indexOf('<script>')+8, j=s.indexOf('</script>',i);
const out=ts.transpileModule(s.slice(i,j),{compilerOptions:{target:ts.ScriptTarget.ES2017,allowJs:true,removeComments:false}}).outputText;
fs.writeFileSync('stagezero-maker.compat.html',s.slice(0,i)+out+s.slice(j));
console.log('compat ok', /\?\.|\?\?/.test(out.replace(/(['"`])(?:\\.|(?!\1).)*\1/g,''))?'WARN: modern syntax left':'clean');
