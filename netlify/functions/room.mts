import {getStore,getDeployStore} from '@netlify/blobs';
import type {Context,Config} from '@netlify/functions';
import {roomAction} from './_shared/rooms.js';
export default async (req:Request,context:Context)=>{
 const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(req.method!=='POST')return reply({error:'POST 요청만 지원합니다.'},405);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return reply({error:'다른 사이트에서 보낸 요청입니다.'},403);
 if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'JSON 요청이 필요합니다.'},415);
 try{
  const raw=await req.text();if(raw.length>4096)return reply({error:'요청이 너무 큽니다.'},413);const data=JSON.parse(raw);
  if(data.action==='health')return reply({online:true,serverTime:Date.now(),transport:'polling'});
  const options={name:'teenie-kart-rooms-v1',consistency:'strong' as const};
  const store=context.deploy.context==='production'?getStore(options):getDeployStore(options);
  return reply(await roomAction(store,data));
 }catch(e:any){return reply({error:e.status?e.message:'온라인 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.'},e.status||503);}
};
export const config:Config={path:'/api/room'};
