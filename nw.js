var chokidar = require('chokidar');
chokidar.watch([
'./index.html',
'./index.js',
'./nw.js',
],{}).on('change',()=>{
	location.reload();
})

const dgram = require('dgram');
const udp = dgram.createSocket("udp4");

const gui = new dat.GUI();

const osc = require('osc-min');
const outport = 41234;
let onlyOnce = true;
console.log('ProbabiltityOsc:---- ');
window.ProbabiltityOsc={
  grabbedType:'',
  grabbedTypes:{
    SIGNAL: 'signal',
    ARRAY_SIGNAL:'arraySignal'
  },
  grabbedIndex:0,
  grabValueForOSC(d){
    // if
    const tod = typeof d;
    let type= "float";
    let value =d;
    if(tod==='object'){
        let p=[];
        onlyOnce=false;
      //  console.log('d: ', d);
        const length = d.length;
        for (let index = 0; index <length; index+=2) {
            p[p.length] = d[index];
      }
      // console.log('p: ', p);
      d=p.toString();
      // console.log('d: ', d);
      type= "string";
      var buf;
      buf = osc.toBuffer({
          oscType: "message",
          address: "/signal",
          args: [{
            type,
            value: d
          }
        ]
      });
      return udp.send(buf, 0, buf.length, outport, "localhost");
    }else{

      var buf;
      buf = osc.toBuffer({
          oscType: "message",
          address: "/arraysignal",
          args: [{
            type,
            value: d
          }
        ]
      });
      return udp.send(buf, 0, buf.length, outport, "localhost");
    }
  },
  grabbingTypeSelector:null//to be definede in the ProbabilityDisplay.js file
}
window.ProbabiltityOsc.grabbedTypesOptions = []
for (const key in window.ProbabiltityOsc.grabbedTypes) {
  if (Object.hasOwnProperty.call(window.ProbabiltityOsc.grabbedTypes, key)) {
    const element = window.ProbabiltityOsc.grabbedTypes[key];
    window.ProbabiltityOsc.grabbedTypesOptions.push(element)
    
  }
}
window.ProbabiltityOsc.grabbedType = window.ProbabiltityOsc.grabbedTypesOptions[0];
const debug1 = window.ProbabiltityOsc.grabbedTypesOptions;
const probabilityFolder = gui.addFolder('Probabilities');
probabilityFolder.open()
probabilityFolder.add(window.ProbabiltityOsc,'grabbedType',window.ProbabiltityOsc.grabbedTypesOptions).onChange((v)=>{
  console.log('v: ', v);
  window.ProbabiltityOsc.grabbingTypeSelector(v);
})
