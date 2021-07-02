const dgram = require('dgram');
const udp = dgram.createSocket("udp4");

const osc = require('osc-min');
const outport = 41234;
let onlyOnce = true;
window.oscHack = function(d){
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
            address: "/another",
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
            address: "/heartbeat",
            args: [{
              type,
              value: d
            }
          ]
        });
        return udp.send(buf, 0, buf.length, outport, "localhost");
    }
    // return
   
}
