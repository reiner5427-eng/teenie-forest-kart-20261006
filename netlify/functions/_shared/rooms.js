import {randomBytes,createHash} from 'node:crypto';
import {racer,race,step,cleanName,clamp} from '../../../src/sim.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
const err=(message,status=400)=>Object.assign(Error(message),{status});
const key=code=>'room/'+code;
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code(){const bytes=randomBytes(6);return [...bytes].map(b=>alphabet[b%alphabet.length]).join('');}
function token(){return randomBytes(24).toString('hex');}
export function publicRoom(r){const copy=structuredClone(r);copy.players.forEach(p=>{delete p.secret;delete p.seen;delete p.inputAt;delete p.held;});if(copy.game)copy.game.players.forEach(p=>{delete p.secret;delete p.seen;delete p.inputAt;delete p.held;});delete copy.lastTick;delete copy.expires;return copy;}
export function advance(r,now){if(r.status!=='racing')return;if(r.players.some(p=>now-p.seen>15000)){const gone=r.players.findIndex(p=>now-p.seen>15000);forfeit(r,gone,'상대의 연결이 15초 이상 끊겨 기권 처리되었습니다.');return;}if(now<r.startAt)return;let remaining=Math.min(1.6,Math.max(0,(now-Math.max(r.lastTick,r.startAt))/1000));const inputs=r.players.map(p=>now-p.inputAt<=1200?{...p.held}:{});while(remaining>0){const dt=Math.min(1/60,remaining);step(r.game,dt,inputs);inputs.forEach(u=>{u.boost=false;u.item=false;u.reset=false;});remaining-=dt;}r.players.forEach(p=>{p.held.boost=false;p.held.item=false;p.held.reset=false;});r.lastTick=now;if(r.game.done)r.status='finished';}
function forfeit(r,index,reason){r.status='finished';r.reason=reason;r.game.done=true;r.game.players[index].dnf=true;r.game.forfeit=index;r.game.winner=1-index;}
export async function roomAction(store,b,now=Date.now()){
 const action=b.action;if(action==='health')return {online:true,serverTime:now,transport:'400ms polling'};
 if(action==='create'){
  const name=cleanName(b.name),char=clamp(Math.trunc(Number(b.char)||0),0,5),secret=token();
  for(let attempt=0;attempt<12;attempt++){const id=code(),p=racer(name,char);p.secret=hash(secret);p.seen=now;const r={code:id,mode:b.mode==='item'?'item':'speed',players:[p],status:'lobby',createdAt:now,expires:now+45*60*1000,startAt:null,lastTick:now,revision:0};const written=await store.setJSON(key(id),r,{onlyIfNew:true});if(written.modified)return {code:id,token:secret,index:0,room:publicRoom(r),serverTime:now};}
  throw err('입장코드를 만들지 못했습니다. 다시 시도해주세요.',503);
 }
 const id=String(b.code||'').toUpperCase();if(!/^[A-HJ-NP-Z2-9]{6}$/.test(id))throw err('올바른 6자리 입장코드를 입력해주세요.');
 // Optimistic compare-and-swap keeps joins, input ownership and attacks atomic.
 for(let retry=0;retry<8;retry++){
  const entry=await store.getWithMetadata(key(id),{type:'json'});if(!entry||entry.data.expires<now)throw err('존재하지 않거나 만료된 방입니다.',404);const r=entry.data;
  let index=-1,newToken;
  if(action==='join'){
   if(r.status!=='lobby')throw err('이미 시작한 방에는 입장할 수 없습니다.',409);if(r.players.length>=2)throw err('방이 가득 찼습니다. 정원은 2명입니다.',409);
   newToken=token();index=1;const p=racer(cleanName(b.name),b.char,1);p.secret=hash(newToken);p.seen=now;r.players.push(p);
  }else{
   if(typeof b.token!=='string'||b.token.length!==48)throw err('방 참가 인증이 필요합니다.',401);index=r.players.findIndex(p=>p.secret===hash(b.token));if(index<0)throw err('이 방의 참가자가 아닙니다.',403);
   advance(r,now);const p=r.players[index];if(action==='ready'){
    if(r.status!=='lobby')throw err('이미 시작한 경기입니다.',409);p.ready=!p.ready;p.seen=now;if(r.players.length===2&&r.players.every(q=>q.ready)){r.status='racing';r.startAt=now+3500;r.lastTick=r.startAt;r.players.forEach(q=>{q.inputAt=now;q.seen=now;q.held={};});r.game=race(r.mode,r.players.map(q=>{const out=structuredClone(q);delete out.secret;out.ai=false;return out;}),randomBytes(4).readUInt32LE());}
   }else if(action==='sync'){
    if(!Number.isSafeInteger(b.seq)||b.seq<=p.seq)throw err('오래된 입력입니다. 다시 동기화해주세요.',409);
    if(now-(p.lastSync||0)<100)throw err('요청이 너무 빠릅니다.',429);p.lastSync=now;p.seq=b.seq;p.seen=now;p.inputAt=now;const u=b.input||{};p.held={gas:u.gas===true,brake:u.brake===true,steer:clamp(Number(u.steer)||0,-1,1),drift:u.drift===true,boost:u.boost===true,item:u.item===true,reset:u.reset===true};
   }else if(action==='leave'){
    if(r.status==='racing')forfeit(r,index,'상대가 방을 나가 기권 처리되었습니다.');else if(r.status==='lobby'){r.players.splice(index,1);r.players.forEach((q,i)=>{q.index=i;q.ready=false;});if(!r.players.length)r.expires=now;}
   }else throw err('지원하지 않는 요청입니다.');
  }
  r.revision++;const written=await store.setJSON(key(id),r,{onlyIfMatch:entry.etag});if(written.modified)return {code:id,index,room:publicRoom(r),serverTime:now,...(newToken?{token:newToken}:{})};
 }
 throw err('방 상태가 바뀌었습니다. 잠시 후 다시 시도해주세요.',409);
}
