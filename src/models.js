import * as T from 'three';
import {CHARACTERS} from './sim.js';
const sphere=new T.SphereGeometry(1,24,16),box=new T.BoxGeometry(1,1,1),mats=new Map();
const mat=(c,rough=.42)=>{const key=c+rough;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:c,roughness:rough}));return mats.get(key);};
function ell(g,c,x,y,z,sx,sy=sx,sz=sx){const m=new T.Mesh(sphere,mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;g.add(m);return m;}
function cube(g,c,x,y,z,sx,sy,sz){const m=new T.Mesh(box,mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;g.add(m);return m;}
function tube(g,c,pts,r=.04){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,24,r,8,false),mat(c));g.add(m);return m;}
function heart(g,c,x,y,z,size=.2){const s=new T.Shape();s.moveTo(0,-.6);s.bezierCurveTo(-1,.1,-.9,1,-.4,.9);s.bezierCurveTo(-.15,.95,0,.7,0,.5);s.bezierCurveTo(.3,1.2,1,1,.9,.4);s.bezierCurveTo(.8,0,.3,-.3,0,-.6);const m=new T.Mesh(new T.ExtrudeGeometry(s,{depth:.24,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.1,bevelThickness:.1}),mat(c));m.position.set(x,y,z);m.scale.setScalar(size);g.add(m);return m;}
function star(g,c,x,y,z,size=.2){const s=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.45:1;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?s.lineTo(px,py):s.moveTo(px,py);}s.closePath();const m=new T.Mesh(new T.ExtrudeGeometry(s,{depth:.15,bevelEnabled:true,bevelSegments:2,bevelSize:.05,bevelThickness:.05}),mat(c));m.position.set(x,y,z);m.scale.setScalar(size);g.add(m);return m;}
function ring(g,c,x,y,z,r){const m=new T.Mesh(new T.TorusGeometry(r,.025,10,40),mat(c));m.position.set(x,y,z);g.add(m);return m;}
function clover(g,x,y,z){for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;heart(g,'#427e32',x+Math.cos(a)*.085,y+Math.sin(a)*.085,z,.095).rotation.z=a-Math.PI/2;}}
// Original handmade mesh interpretation of the supplied reference, no ripped assets.
export function character(index){const c=CHARACTERS[index],g=new T.Group();g.userData.char=index;
 // Tiny pear body, feet and rounded arms. Forward is +Z.
 ell(g,c.body,0,.55,0,.29,.43,.25);ell(g,'#fff9ed',0,.59,.20,.20,.29,.073);ell(g,c.body,-.17,.14,.03,.13,.12,.2);ell(g,c.body,.17,.14,.03,.13,.12,.2);
 for(const sign of [-1,1]){const arm=ell(g,c.body,sign*.32,.64,.07,.10,.22,.10);arm.rotation.z=sign*.55;ell(g,c.body,sign*.39,.54,.12,.09);}
 ell(g,c.color,0,1.31,-.03,.64,.66,.51); // Head silhouette
 ell(g,c.face,0,1.23,.21,.54,.51,.4); // Character-specific pastel face, matching the reference
 // Large reflective eyes: dark outline, white sclera, iris gradient, pupil and two catchlights.
 for(const sign of [-1,1]){const x=sign*.24;ell(g,'#694d66',x,1.27,.573,.167,.205,.065);ell(g,'#fffefa',x,1.277,.6,.153,.189,.059);
 ell(g,c.eye,x+sign*.005,1.247,.646,.121,.149,.032);ell(g,'#211728',x+sign*.005,1.273,.67,.076,.112,.023);
 ell(g,'#ffffff',x-.043,1.332,.694,.043,.051,.012);ell(g,'#ffffff',x+.044,1.215,.689,.022,.023,.012);
 tube(g,c.hair,[[x-.1,1.54,.5],[x,1.57,.54],[x+.09,1.53,.5]],.023);
 for(let k=0;k<2;k++)tube(g,'#533747',[[x+sign*.12,1.38,.6],[x+sign*(.18+k*.02),1.45+k*.018,.6]],.012);
 ell(g,'#f4a4b7',sign*.37,1.08,.54,.075,.037,.013);}
 ell(g,'#f4d0c5',0,1.1,.616,.032,.022,.022);
 tube(g,'#8e4964',[[-.065,.992,.58],[0,.968,.603],[.065,.992,.58]],.012);
 // Collar and small gold chest crest
 ell(g,c.color,0,.88,.18,.24,.07,.16);star(g,'#e5bb4d',0,.63,.253,.095);
 if(index===0){ // Pink long hair, sculpted curls and hearts
  for(const sign of [-1,1]){ell(g,c.hair,sign*.57,1.11,-.07,.24,.53,.26);tube(g,c.hair,[[sign*.53,.88,-.04],[sign*.7,.65,.02],[sign*.76,.57,.22],[sign*.61,.54,.3],[sign*.47,.68,.24]],.14);heart(g,'#f5b3d1',sign*.42,1.78,.19,.12);}
  tube(g,c.hair,[[.28,1.79,.05],[.04,1.97,.25],[-.15,1.86,.42],[-.13,1.67,.5],[.03,1.69,.5]],.16);
  ring(g,'#e7c854',.55,.8,.25,.18);ell(g,'#d8f6fa',.55,.8,.245,.155,.155,.028);cube(g,'#e7c854',.55,.58,.23,.04,.25,.035);heart(g,'#e77dad',0,.67,.284,.08);
 }else if(index===1){
  for(const sign of [-1,1]){ell(g,c.hair,sign*.54,1.69,-.07,.23,.25,.26);ell(g,'#f6d94d',sign*.5,1.66,.08,.17,.18,.19);star(g,'#fff3a2',sign*.4,1.74,.23,.10);}
  const fringe=ell(g,c.hair,0,1.77,.26,.39,.27,.27);fringe.rotation.z=-.22;const cone=new T.Mesh(new T.ConeGeometry(.19,.4,24),mat(c.hair));cone.position.set(.14,1.99,.16);cone.rotation.z=-.35;g.add(cone);star(g,'#e0a72b',.42,.5,.17,.16);
 }else if(index===2){
  for(const sign of [-1,1]){ell(g,c.hair,sign*.55,1.48,-.01,.26,.37,.28);ell(g,'#b9d94a',sign*.59,1.29,.04,.18,.18,.22);clover(g,sign*.42,1.85,.18);}
  ell(g,c.hair,0,1.79,.2,.43,.23,.28);tube(g,c.hair,[[.14,1.81,.4],[-.03,1.72,.47],[-.04,1.56,.44]],.12);tube(g,'#76a84e',[[.35,.5,.08],[.6,.73,.14]],.025);clover(g,.64,.77,.15);
 }else if(index===3){
  ell(g,c.hair,0,1.87,-.02,.36,.27,.36);
  for(const sign of [-1,1]){const ear=ell(g,c.hair,sign*.32,2.02,-.04,.18,.34,.14);ear.rotation.z=-sign*.55;ell(g,c.hair,sign*.54,1.2,-.11,.17,.45,.25);ring(g,'#47819b',sign*.24,1.275,.716,.19);}
  tube(g,'#47819b',[[-.05,1.31,.72],[0,1.33,.74],[.05,1.31,.72]],.018);
  for(const [x,y,s] of [[-.2,1.79,.15],[0,1.88,.18],[.19,1.8,.14]])ell(g,'#fffbf4',x,y,.43,s,s,.1);
  cube(g,'#70afd6',.44,.52,.1,.21,.23,.09);star(g,'#dbba57',0,.66,.286,.08);
 }else if(index===4){
  for(const sign of [-1,1]){ell(g,c.hair,sign*.47,1.88,-.04,.23,.25,.22);ell(g,c.hair,sign*.66,1.82,-.11,.18,.19,.2);ell(g,c.hair,sign*.61,2.04,-.17,.16,.17,.17);}
  ell(g,c.hair,0,1.83,.21,.34,.17,.26);star(g,'#e8c74c',0,1.86,.44,.18);tube(g,'#d2b147',[[.38,.55,.1],[.63,.85,.14]],.024);star(g,'#ffe084',.63,.89,.14,.13);
 }else{
  for(let i=0;i<5;i++){const a=i/4*Math.PI;const petal=ell(g,c.hair,Math.cos(a)*.48,1.65+Math.sin(a)*.32,-.04,.2,.28,.24);petal.rotation.z=a-Math.PI/2;}
  ell(g,c.hair,0,1.79,.26,.32,.22,.26);tube(g,c.hair,[[.2,1.81,.41],[0,1.65,.49],[-.08,1.76,.43]],.14);
  for(const sign of [-1,1])heart(g,'#ed778b',sign*.44,1.81,.23,.1);
  cube(g,'#ecc752',0,1.98,.07,.31,.07,.15);for(const x of [-.12,0,.12]){const m=new T.Mesh(new T.ConeGeometry(.05,.15,4),mat('#ecc752'));m.position.set(x,2.07,.07);g.add(m);}
  star(g,'#e2be4d',.48,.65,.15,.14);
 }
 return g;
}
export function kart(index){const c=CHARACTERS[index],g=new T.Group();cube(g,c.hair,0,.6,0,1.65,.42,2.25);ell(g,c.color,0,.65,.72,.85,.31,.7);cube(g,'#fff6eb',0,.42,1.08,1.8,.18,.18);cube(g,'#fff6eb',0,.42,-1.06,1.8,.18,.18);cube(g,'#504557',0,.86,-.38,.8,.65,.3);
 for(const x of [-.88,.88])for(const z of [-.7,.7]){const wheel=new T.Mesh(new T.CylinderGeometry(.33,.33,.3,20),mat('#343648'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.33,z);wheel.castShadow=true;g.add(wheel);ell(g,'#d9dce2',x*1.14,.33,z,.025,.17,.17);}
 const pilot=character(index);pilot.scale.setScalar(.68);pilot.position.set(0,.78,-.13);g.add(pilot);g.userData.pilot=pilot;
 const steering=ring(g,'#584257',0,1.17,.48,.19);steering.rotation.x=-.6;star(g,'#fff8d0',0,.76,1.32,.18);for(const sign of [-1,1])ell(g,'#ffffd0',sign*.53,.66,1.27,.11,.07,.03);return g;}
export function disposeModel(g){g.traverse(m=>{if(m.geometry&&m.geometry!==sphere&&m.geometry!==box)m.geometry.dispose();});}
export {ell,cube,tube,mat};

