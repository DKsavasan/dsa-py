(function(){
const U=DSA.util;
const g=U.clone(U.graphs.weighted); g.nodes[0].s='current'; g.nodes[1].s='visited'; g.nodes[2].s='frontier'; g.nodes[0].badge='0'; g.edges[0].s='tree'; g.edges[1].s='active';
const d=U.clone(U.graphs.dag); d.nodes[2].s='done';
const t=U.bstFrom([8,3,10,1,6,14,4,7,13]);
DSA.addDS({id:'zz-test',title:'ZZ Test',category:'Advanced',summary:'test',ops:[{op:'x',time:'O(1)'}],code:'x = 1',
visuals:[
 Object.assign({type:'graph',title:'weighted graph'},g),
 Object.assign({type:'graph',title:'dag'},d),
 {type:'tree',title:'bst',root:t,states:{'6':'active','3':'visited'},badges:{'8':'h=3'},pointers:{'6':'curr'},edgeStates:{'6':'active'}},
 {type:'tree',title:'trie',root:{v:'•',children:[{v:'c',elabel:'c',children:[{v:'a',children:[{v:'t',s:'found'},{v:'r'}]}]},{v:'d',children:[{v:'o',children:[{v:'g'}]}]}]}},
 {type:'grid',title:'dp',cells:[[0,1,2,3],[1,0,1,2],[2,1,1,2]],rowLabels:['','a','b'],colLabels:['','x','y','z'],states:{'1,1':'active','0,0':'path','r1':'active'}},
 {type:'linked',title:'linked',nodes:[{id:'a',v:1},{id:'b',v:2,s:'active'},{id:'c',v:3},{id:'d',v:4}],pointers:{a:'head',b:['slow','curr'],null:'prev'}},
 {type:'linked',title:'reverse mid',nodes:[{id:'a',v:1},{id:'b',v:2},{id:'c',v:3},{id:'d',v:4}],links:[{from:'a',to:null},{from:'b',to:'a',s:'active'},{from:'c',to:'d'},{from:'d',to:null}],pointers:{b:'prev',c:'curr'}},
 {type:'linked',title:'cycle',nodes:[{id:'a',v:1},{id:'b',v:2},{id:'c',v:3},{id:'d',v:4}],links:[{from:'a',to:'b'},{from:'b',to:'c'},{from:'c',to:'d'},{from:'d',to:'b',curve:'below'}]},
 {type:'linked',title:'doubly',doubly:true,nodes:[{id:'a',v:'H'},{id:'b',v:2},{id:'c',v:3}]},
 {type:'stack',items:[3,{v:9,s:'new'},5]},
 {type:'buckets',title:'hash',buckets:[[{k:'cat',v:3}],[],[{k:'dog',v:1},{k:'emu',v:7,s:'active'}],[]],states:{2:'active'}},
 {type:'kv',title:'dist',entries:[['A',0],['B',4],['C',Infinity]],states:{B:'active'}},
 {type:'kv',title:'dict col',layout:'col',entries:[['apple',3],['kiwi',1]]},
 {type:'array',bars:true,items:U.withIds([5,2,9,1,7]),states:{1:'compare',2:'swap'},ranges:[{l:0,r:2,label:'window'}]},
 {type:'array',rows:[{label:'left',items:[1,4,6]},{label:'right',items:[2,3,9]},{label:'out',items:[1,2,null,null,null,null],pointers:[{i:2,label:'k'}]}]},
]});
})();
