import spec from '../exhibition-spec.json';
export {spec};
export const peopleForLoad=n=>Math.round(24+1176*Math.pow(n/100,2.39));
export const graph={nodes:[],edges:[]};
const ids=new Map();
export function node(x,z){const key=`${x},${z}`;if(ids.has(key))return ids.get(key);const id=graph.nodes.length;ids.set(key,id);graph.nodes.push({x,z});graph.edges.push([]);return id;}
function edge(a,b){const p=graph.nodes[a],q=graph.nodes[b],d=Math.hypot(p.x-q.x,p.z-q.z);graph.edges[a].push({to:b,d});graph.edges[b].push({to:a,d});}
function chain(points){const ns=points.map(([x,z])=>node(x,z));for(let i=1;i<ns.length;i++)edge(ns[i-1],ns[i]);return ns;}
for(const x of spec.walkways.verticalX)chain(spec.walkways.horizontalZ.map(z=>[x,z]));
for(const z of [-14,0,14])chain([[-42,z],[0,z],[42,z]]);
for(const z of [-27,27]){const outer=Math.sign(z)*31;chain([[-42,z],[-42,outer],[-24,outer],[-24,z],[0,z],[24,z],[24,outer],[42,outer],[42,z]]);}
export const entrance=node(0,-32);edge(entrance,node(0,-27));export const exit=node(0,32);edge(exit,node(0,27));
export const crowdNodes=graph.nodes.map((_,i)=>i);
const themes=[['FORM / Living','Furniture and circular design','orange'],['VOLT / Mobility','Electric bikes and urban transport','blue'],['GROW / Habitat','Plants, growing systems and biophilic design','green'],['PIXEL / Future','Displays, digital craft and interactive media','blue'],['MADE / Objects','Independent ceramics and collectible objects','orange'],['TERRA / Studio','Architecture, materials and miniature cities','green']];
export const destinations=[];
for(let r=0;r<4;r++)for(let c=0;c<6;c++){const x=spec.booths.centerX[c],z=spec.booths.centerZ[r],aisle=[-14,0,0,14][r],sign=Math.sign(aisle-z),endZ=z+sign*5;let root=node(0,aisle);const end=node(x,endZ);const a=node(x,aisle);edge(root,a);edge(a,end);const t=themes[(c+r)%6];destinations.push({id:`B${String(r*6+c+1).padStart(2,'0')}`,name:t[0],description:t[1],type:'booth',theme:t[2],x,z,side:sign,node:end,category:(c+r)%6});}
for(const [type,list] of [['cafe',spec.cafes],['toilet',spec.toilets]])for(const f of list){const innerX=f.x-Math.sign(f.x)*(f.width/2+.6);const n=node(innerX,f.z);edge(node(0,f.z),n);destinations.push({...f,id:type==='cafe'?(f.z>0?'CAFE-N':'CAFE-S'):(f.z>0?'WC-N':'WC-S'),name:f.label,description:type==='cafe'?'Coffee, fresh food and seating. Open throughout the exhibition.':'Public toilets · accessible facilities · step-free access.',type,node:n});}
const infoNode=node(-14,-27);edge(node(0,-27),infoNode);destinations.push({...spec.information,id:'INFO',name:'INFORMATION',description:'Visitor information, exhibitor directory and assistance.',type:'info',node:infoNode});destinations.push({...spec.entry,id:'ENTRY',name:spec.entry.label,description:'Main visitor entrance · street level · step-free.',type:'entry',node:entrance},{...spec.exit,id:'EXIT',name:spec.exit.label,description:'North exit to the city promenade.',type:'exit',node:exit});
export function shortestPath(start,end){const dist=graph.nodes.map(()=>Infinity),prev=[],open=new Set(graph.nodes.map((_,i)=>i));dist[start]=0;while(open.size){let u=-1;for(const i of open)if(u<0||dist[i]<dist[u])u=i;if(u===end||dist[u]===Infinity)break;open.delete(u);for(const {to,d}of graph.edges[u])if(dist[u]+d<dist[to]){dist[to]=dist[u]+d;prev[to]=u;}}const path=[end];let c=end;while(c!==start){c=prev[c];if(c===undefined)throw Error('Disconnected aisle graph');path.unshift(c);}return {ids:path,points:path.map(i=>graph.nodes[i]),distance:dist[end]};}
