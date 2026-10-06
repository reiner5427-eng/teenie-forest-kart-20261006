import {getStore} from '@netlify/blobs';
import type {Context,Config} from '@netlify/functions';
export default async (_req:Request,context:Context)=>{
 if(context.deploy.context!=='production')return;
 const store=getStore({name:'teenie-kart-rooms-v1',consistency:'strong'});
 const {blobs}=await store.list({prefix:'room/'});let deleted=0;
 for(const blob of blobs){if(deleted>=100)break;const room=await store.get(blob.key,{type:'json'});if(room?.expires<Date.now()-86400000){await store.delete(blob.key);deleted++;}}
};
export const config:Config={schedule:'@daily'};
