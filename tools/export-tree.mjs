import {readFileSync,readdirSync} from 'node:fs';
const roots=['src','tests','netlify/functions','public'];
const paths=['package.json','pnpm-lock.yaml','index.html','vite.config.js','netlify.toml','.gitignore','.env.example','README.md','ASSETS.md','VALIDATION.md','responsive.html','tools/export-tree.mjs'];
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+entry.name;if(entry.isDirectory())walk(p);else paths.push(p);}}
roots.forEach(walk);process.stdout.write(JSON.stringify(paths.map(path=>({path,mode:'100644',type:'blob',content:readFileSync(path,'utf8').replace(/^\uFEFF/,'')}))));
