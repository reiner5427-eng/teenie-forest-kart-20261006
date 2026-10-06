// Shared deterministic rules: browser races and the Netlify referee use this module.
export const CHARACTERS = [
 {name:'하츄핑',color:'#ee87b6',body:'#ffe6f1',face:'#ffe4f1',hair:'#d95399',eye:'#8d3f86',detail:'분홍 컬 · 하트 · 손거울'},
 {name:'아자핑',color:'#ffe67b',body:'#fff1a3',face:'#fff1aa',hair:'#edbd32',eye:'#76601b',detail:'노란 앞머리 · 둥근 양갈래'},
 {name:'차차핑',color:'#cfe87b',body:'#e1f09c',face:'#e7f3b2',hair:'#9bbf39',eye:'#417c45',detail:'초록 양갈래 · 클로버'},
 {name:'바로핑',color:'#a2d5ef',body:'#c2e7f8',face:'#d0edfb',hair:'#398cc3',eye:'#3c807b',detail:'파란 머리 · 안경 · 구름'},
 {name:'라라핑',color:'#dbc0ee',body:'#e5cff2',face:'#f0def9',hair:'#9b67b6',eye:'#925cb4',detail:'보라 양갈래 · 별 장식'},
 {name:'해핑',color:'#f9b6c8',body:'#ffd7e4',face:'#ffe4ec',hair:'#bf3659',eye:'#579461',detail:'자홍 꽃머리 · 금빛 왕관'}
];
export const ITEMS=[{name:'미사일',icon:'🚀'},{name:'물폭탄',icon:'💧'},{name:'바나나',icon:'🍌'},{name:'자석',icon:'🧲'},{name:'실드',icon:'🛡️'}];
const anchors=[[0,0,0],[0,1,100],[55,5,165],[135,9,150],[165,4,85],[100,1,50],[165,2,-25],[150,7,-105],[55,4,-140],[-30,1,-95],[-55,0,-35]];
const mod=(x,n)=>((x%n)+n)%n;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function curve(t){const q=mod(t,1)*anchors.length,i=Math.floor(q),f=q-i;return [0,1,2].map(k=>{const a=anchors[mod(i-1,anchors.length)][k],b=anchors[i][k],c=anchors[(i+1)%anchors.length][k],d=anchors[(i+2)%anchors.length][k];return .5*((2*b)+(-a+c)*f+(2*a-5*b+4*c-d)*f*f+(-a+3*b-3*c+d)*f*f*f);});}
export const TRACK=[];let length=0,last=curve(0);
for(let i=0;i<=800;i++){const p=curve(i/800);if(i)length+=Math.hypot(...p.map((v,k)=>v-last[k]));TRACK.push({x:p[0],y:p[1],z:p[2],s:length});last=p;}
export const LENGTH=length,WIDTH=15,GATES=12;
export function point(s,offset=0){s=mod(s,LENGTH);let lo=0,hi=800;while(hi-lo>1){const m=(hi+lo)>>1;if(TRACK[m].s<=s)lo=m;else hi=m;}const a=TRACK[lo],b=TRACK[hi],f=(s-a.s)/(b.s-a.s);const dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz);return {x:a.x+(b.x-a.x)*f+dz/n*offset,y:a.y+(b.y-a.y)*f,z:a.z+(b.z-a.z)*f-dx/n*offset,heading:Math.atan2(dx,dz)};}
export function cleanName(v){const s=String(v??'').trim();if(!s||s.length>12)throw Error('이름을 1~12자로 입력해주세요.');return s;}
export function racer(name,char,i=0){return {name:cleanName(name),char:clamp(Math.trunc(Number(char)||0),0,5),s:0,offset:(i%2?2.6:-2.6),speed:0,yaw:0,slip:0,drift:false,gauge:0,boosts:0,boost:0,shield:0,stun:0,spin:0,item:null,lap:0,nextGate:1,lapStart:0,laps:[],finish:null,ready:false,seq:0,held:{},inputAt:0,seen:0,itemCooldown:0,ai:false,index:i};}
export function race(mode,players,seed=42){return {mode,players,time:0,seed,boxes:Array.from({length:9},(_,i)=>({s:(i+.5)*LENGTH/9,ready:0})),traps:[],projectiles:[],events:[],finishOrder:[],done:false};}
function random(r){r.seed=(1664525*r.seed+1013904223)>>>0;return r.seed/4294967296;}
function event(r,text,type='info',who=null){r.events.push({id:Math.round(r.time*1000)+'-'+r.events.length,text,type,who,time:r.time});if(r.events.length>16)r.events.shift();}
export function attack(r,target,seconds,from){if(target.finish!==null)return false;if(target.shield>0){event(r,target.name+' 실드 방어!','shield',target.index);return false;}target.stun=Math.max(target.stun,seconds);target.speed*=.35;event(r,from.name+' → '+target.name+' 공격 성공','hit',target.index);return true;}
export function useItem(r,p){if(p.item===null||p.finish!==null)return false;const id=p.item;const ahead=r.players.filter(q=>q!==p&&q.finish===null&&q.s>p.s&&q.s-p.s<180).sort((a,b)=>a.s-b.s)[0];if((id===0||id===3)&&!ahead){event(r,'전방에 대상이 없어요.','info',p.index);return false;}p.item=null;
 if(id===0){r.projectiles.push({kind:'missile',owner:p.index,target:ahead.index,start:r.time,until:r.time+.55,s:p.s,offset:p.offset});event(r,p.name+' 미사일 발사!','missile',p.index);}
 if(id===1){const s=p.s+30;r.players.filter(q=>q!==p&&q.finish===null&&Math.abs(q.s-s)<22).forEach(q=>attack(r,q,2.4,p));event(r,p.name+' 물폭탄!','water',p.index);}
 if(id===2)r.traps.push({s:p.s-5,offset:p.offset,until:r.time+18,owner:p.index});
 if(id===3){p.boost=2.5;event(r,p.name+' 자석 가속!','magnet',p.index);}
 if(id===4){p.shield=4;event(r,p.name+' 실드 4초','shield',p.index);}
 return true;}
export function aiInput(r,p){const here=point(p.s),future=point(p.s+24);let bend=future.heading-here.heading;while(bend>Math.PI)bend-=Math.PI*2;while(bend< -Math.PI)bend+=Math.PI*2;const lane=Math.sin(p.s*.012+p.index*2)*3;const error=lane-p.offset;const desired=clamp(error*.09,-.28,.28);const steer=clamp(-(desired-p.yaw)*3,-1,1);const target=34+p.index*.6-Math.abs(bend)*15;const front=r.players.find(q=>q!==p&&q.s-p.s>0&&q.s-p.s<12&&Math.abs(q.offset-p.offset)<2.5);return {gas:p.speed<target,brake:p.speed>target+2,steer:front?clamp(steer+(p.index%2?-.7:.7),-1,1):steer,drift:Math.abs(bend)>.25&&p.speed>22,boost:p.boosts>0&&Math.abs(bend)<.12,item:p.item!==null&&r.time>p.itemCooldown+2,reset:Math.abs(p.yaw)>1.3};}
export function checkpoint(p,previous,r){const oldSector=Math.floor(previous/(LENGTH/GATES)),sector=Math.floor(p.s/(LENGTH/GATES));if(sector===oldSector+1&&p.speed>0){const gate=mod(sector,GATES);if(gate===p.nextGate){if(gate===0){const lapTime=r.time-p.lapStart;if(lapTime>5){p.laps.push(lapTime);p.lap++;p.lapStart=r.time;if(p.lap===3){p.finish=r.time;r.finishOrder.push(p.index);event(r,p.name+' 완주!','finish',p.index);}}p.nextGate=1;}else p.nextGate=(gate+1)%GATES;}}}
export function step(r,dt,inputs=[]){if(r.done)return;dt=clamp(dt,0,.05);r.time+=dt;for(const p of r.players){if(p.finish!==null)continue;const u=p.ai?aiInput(r,p):(inputs[p.index]||{});const prev=p.s;for(const key of ['boost','shield','stun','spin'])p[key]=Math.max(0,p[key]-dt);
 if(u.reset){p.offset=clamp(p.offset,-4,4);p.yaw=0;p.slip=0;p.speed=Math.max(0,p.speed*.8);}
 if(u.boost&&p.boosts&&p.boost<=0){p.boosts--;p.boost=2.8;event(r,p.name+' 부스터!','boost',p.index);}
 if(u.item&&r.mode==='item'){useItem(r,p);p.itemCooldown=r.time;}
 const steering=clamp(Number(u.steer)||0,-1,1);p.drift=!!u.drift&&Math.abs(steering)>.1&&p.speed>12&&p.stun===0;
 const top=p.boost>0?53:39;let acceleration=u.gas?(p.boost>0?24:14):0;if(u.brake)acceleration=p.speed>2?-26:-8;if(p.stun>0)acceleration=-18;
 p.speed=clamp(p.speed+(acceleration-(p.speed>0?2.4:-2.4)-p.speed*.035)*dt,-9,top);if(!u.gas&&!u.brake&&Math.abs(p.speed)<.08)p.speed=0;
 const curvature=(point(p.s+2).heading-point(p.s).heading);let bend=curvature;while(bend>Math.PI)bend-=Math.PI*2;while(bend< -Math.PI)bend+=Math.PI*2;
 // +Z is forward; from the rear chase camera, screen-right is world -X.
 p.yaw-=steering*dt*(p.drift?1.5:1.05)*clamp(Math.abs(p.speed)/16,.15,1)+bend*p.speed*dt/2;p.yaw*=Math.exp(-dt*(p.drift?.9:3.3));p.yaw=clamp(p.yaw,-1.4,1.4);
 p.slip+=(p.yaw-p.slip)*Math.min(1,dt*(p.drift?1.6:8));if(p.spin>0)p.slip+=Math.sin(r.time*15)*dt*3;
 p.offset+=Math.sin(p.slip)*p.speed*dt;p.s+=Math.cos(p.slip)*p.speed*dt;
 if(Math.abs(p.offset)>WIDTH/2-1){p.offset=Math.sign(p.offset)*(WIDTH/2-1);p.speed*=Math.exp(-dt*2);p.yaw-=Math.sign(p.offset)*dt*2;}
 if(p.drift&&r.mode==='speed'){p.gauge+=dt*(10+Math.abs(steering)*15);if(p.gauge>=100){p.gauge-=100;p.boosts=Math.min(3,p.boosts+1);}}
 if(r.mode==='item'&&p.item===null)for(const b of r.boxes){const distance=Math.abs(mod(p.s-b.s+LENGTH/2,LENGTH)-LENGTH/2);if(distance<3.5&&Math.abs(p.offset)<5&&b.ready<=r.time){p.item=Math.floor(random(r)*5);b.ready=r.time+5;event(r,p.name+' '+ITEMS[p.item].name+' 획득','pickup',p.index);break;}}
 checkpoint(p,prev,r);
 }
 for(let i=0;i<r.players.length;i++)for(let j=i+1;j<r.players.length;j++){const a=r.players[i],b=r.players[j];if(a.finish!==null||b.finish!==null)continue;const ds=Math.abs(mod(a.s-b.s+LENGTH/2,LENGTH)-LENGTH/2);if(ds<2.8&&Math.abs(a.offset-b.offset)<2.4){const sign=a.offset<=b.offset?-1:1;a.offset+=sign*dt*5;b.offset-=sign*dt*5;const speed=(a.speed+b.speed)*.48;a.speed=Math.min(a.speed,speed);b.speed=Math.min(b.speed,speed);}}
 for(const t of r.traps)for(const p of r.players){if(p.index!==t.owner&&p.finish===null&&t.until>r.time&&Math.abs(mod(p.s-t.s+LENGTH/2,LENGTH)-LENGTH/2)<2.5&&Math.abs(p.offset-t.offset)<2){if(attack(r,p,.6,r.players[t.owner]))p.spin=1.5;t.until=0;}}
 r.traps=r.traps.filter(t=>t.until>r.time);for(const missile of r.projectiles)if(missile.until<=r.time)attack(r,r.players[missile.target],1.8,r.players[missile.owner]);r.projectiles=r.projectiles.filter(m=>m.until>r.time);r.done=r.players.every(p=>p.finish!==null);
}
export function ranking(r){return [...r.players].sort((a,b)=>{if(r.forfeit!==undefined)return Number(a.index===r.forfeit)-Number(b.index===r.forfeit);if(a.finish!==null||b.finish!==null){if(a.finish===null)return 1;if(b.finish===null)return -1;return a.finish-b.finish;}const score=p=>p.lap*GATES+(p.nextGate===0?GATES-1:p.nextGate-1);return score(b)-score(a)||b.s-a.s;});}
export function formatTime(t){if(!Number.isFinite(t))return '—';return `${Math.floor(t/60)}:${(t%60).toFixed(2).padStart(5,'0')}`;}
