// 새 스토리 이벤트 전수 점검: 랜덤 선택 + 선택 기록, 오류/도달 횟수 집계
const fs=require('fs'); const src=fs.readFileSync('stagezero-maker.html','utf8');
eval(src.split('// ==ENGINE==')[1].split('// ==/ENGINE==')[0]+`;global.E={newGame,doAction,settle,pickEvent,fixedEvents,computeEnding,ACTS,PROLOGUE,loveOf,LOVERS,ptRank};`);
const seen={}, errs={}, ends={}; let promos=0, secGone=0, tri1=0, tri2=0;
function play(S,ev){ S.seen[ev.id]=true; const t=ev.text(S); if(typeof t!=='string') throw new Error('text '+ev.id); (ev.beats||[]).forEach(b=>{ if(!b.text) throw new Error('beat '+ev.id); });
  const k=Math.floor(Math.random()*ev.choices.length); const out=ev.choices[k].run(S); if(!out||typeof out.text!=='string') throw new Error('out '+ev.id);
  const P=S.picks||(S.picks={}); const pid=ev.id.replace(/_\d+$/,''); if(!P[pid]) P[pid]={k,m:S.m};
  const key=ev.id.replace(/_\d+$/,'').replace(/^(tri[12])_.*/,'$1').replace(/^(conf|prop|crisis|dump|after|grant_ad|grant_pt)_.*/,'$1'); seen[key]=(seen[key]||0)+1; }
const origins=['derma','designer','adman','ceo','actor','civil'];
for(let g=0; g<1500; g++){
  const S=E.newGame('a','b',origins[g%6]);
  try{ play(S,E.PROLOGUE);
  while(S.m<120 && !S.ending){
    for(let i=0;i<3;i++){ let id;
      const r=Math.random();
      if(S.hp<30||S.stress>70) id='rest'; else if(S.prods.length<2 && r<0.5) id='rnd';
      else if(S.cash<600 || r<0.25) id=['pt_cafe','pt_cvs','pt_hb','pt_mua','pt_clinic','pt_model','pt_lecture','pt_host','pt_consult'].find(j=>!(E.ACTS[j].req&&E.ACTS[j].req(S)))||'rest';
      else id=['live','shoot','academy','growth','date','party','art','ir','rnd','spa'][Math.floor(Math.random()*10)];
      const a=E.ACTS[id]; if(!a || (a.req&&a.req(S)) || (a.cost||0)>S.cash || (a.slots||1)>3-i) id='rest';
      const res=E.doAction(S,id); if(S.promo){ promos++; S.promo=null; } i+=(E.ACTS[id].slots||1)-1; if(res.burnout) break; }
    E.settle(S); if(S.ending) break;
    const fx=E.fixedEvents(S); for(const f of fx) play(S,f); if(S.ending) break;
    const ev=fx.length>=2?null:E.pickEvent(S); if(ev) play(S,ev); if(S.ending) break;
    S.m++; }
  if(S.secGone!=null) secGone++;
  ends[E.computeEnding(S)]=(ends[E.computeEnding(S)]||0)+1;
  }catch(e){ const k=e.message.split('\n')[0]; errs[k]=(errs[k]||0)+1; if(errs[k]===1) console.log('ERR',e.stack.split('\n').slice(0,3).join(' | ')); }
}
const want=['prologue','key_ch2','key_ch3','key_ch4','rival_final','colon_secret1','colon_secret2','colon_secret3','cb_intern','cb_idea','cb_blackcon','cb_blackcon_ok','cb_letter','sec_empty','tri1','tri2'];
console.log(want.map(k=>k+':'+(seen[k]||0)).join('  '));
console.log('promos',promos,'secGone games',secGone,'errors',JSON.stringify(errs));
console.log('endings',JSON.stringify(ends));
