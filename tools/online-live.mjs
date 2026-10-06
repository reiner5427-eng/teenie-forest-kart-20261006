// Two independent HTTP test clients, sending controls only to the actual Netlify referee.
// Test drivers follow the route; production online players are always human-controlled.
import assert from 'node:assert/strict';import {writeFileSync,mkdirSync} from 'node:fs';import {aiInput,ranking} from '../src/sim.js';
const base=process.argv[2];if(!base||!base.startsWith('https://'))throw Error('Pass the deployed HTTPS URL');
const report={date:new Date().toISOString(),url:base,transport:'two independent HTTP clients, not two physical devices',checks:[],races:[]};
async function api(action,data={},allowed=200){const res=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})});const text=await res.text();let j;try{j=JSON.parse(text);}catch{throw Error('Endpoint did not return JSON (site access or deployment not ready)');}assert.equal(res.status,allowed,j.error||action);return j;}
const auth=p=>({code:p.code,token:p.token});
try{
 await api('health');report.checks.push('deployed health endpoint');
 const unrelated=await api('create',{name:'격리검증',char:2,mode:'item'});
 for(const mode of ['speed','item']){
  const a=await api('create',{name:'HTTP검증A',char:0,mode}),b=await api('join',{code:a.code,name:'HTTP검증B',char:3});a.seq=0;b.seq=0;
  await api('join',{code:a.code,name:'세번째',char:1},409);await api('sync',{code:unrelated.code,token:a.token,seq:1,input:{}},403);await api('join',{code:'AAAAAA',name:'없음'},404);
  await api('ready',auth(a));let state=await api('ready',auth(b));assert.equal(state.room.players.length,2);assert.equal(state.room.status,'racing');assert.ok(state.room.game.players.every(p=>p.ai===false));assert.equal(state.room.game.time,0);
  state=await api('sync',{...auth(a),seq:++a.seq,input:{gas:true},lap:3,finish:.1});assert.equal(state.room.game.players[0].lap,0);assert.equal(state.room.game.players[0].finish,null);
  await api('join',{code:a.code,name:'늦게'},409);const begin=Date.now();let polls=0,lastLog=0,maxLatency=0;
  while(state.room.status!=='finished'&&Date.now()-begin<240000){const before=Date.now();const r=state.room.game;const updates=await Promise.all([a,b].map((client,i)=>api('sync',{...auth(client),seq:++client.seq,input:aiInput(r,r.players[i])})));state=updates.sort((x,y)=>y.room.revision-x.room.revision)[0];maxLatency=Math.max(maxLatency,Date.now()-before);polls+=2;
   if(state.room.game.time-lastLog>20){lastLog=state.room.game.time;console.log(mode,Math.round(lastLog)+'s',state.room.game.players.map(p=>'lap'+p.lap+'/gate'+p.nextGate).join(' '));}
   await new Promise(resolve=>setTimeout(resolve,Math.max(0,400-(Date.now()-before))));
  }
  assert.equal(state.room.status,'finished','race must finish before test timeout');assert.ok(state.room.game.players.every(p=>p.lap===3&&p.laps.length===3&&p.finish>0));const ordered=ranking(state.room.game);assert.ok(ordered[0].finish<=ordered[1].finish);
  report.races.push({mode,requests:polls,maxLatencyMs:maxLatency,wallTimeMs:Date.now()-begin,players:ordered.map(p=>({name:p.name,char:p.char,finish:p.finish,laps:p.laps}))});console.log(mode,'full three-lap server finish verified');
 }
 const c=await api('create',{name:'이탈검증A',mode:'speed'}),d=await api('join',{code:c.code,name:'이탈검증B'});await api('ready',auth(c));await api('ready',auth(d));const left=await api('leave',auth(d));assert.equal(left.room.game.forfeit,1);assert.equal(left.room.game.winner,0);report.checks.push('capacity, isolation, nonexistent code, started room rejection, forged result ignored, shared countdown, two server-authoritative full races, leave forfeit');
 await api('leave',auth(unrelated));report.success=true;
}catch(e){report.success=false;report.error=e.message;console.error(e.message);process.exitCode=1;}
finally{mkdirSync('test-artifacts',{recursive:true});writeFileSync('test-artifacts/online-live.json',JSON.stringify(report,null,2));console.log('Report: test-artifacts/online-live.json');}
