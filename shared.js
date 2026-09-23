function hsl2hex(h,s,l){
  s/=100; l/=100;
  const k=n=>(n+h/30)%12;
  const a=s*Math.min(l,1-l);
  const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  const toHex=x=>Math.round(255*x).toString(16).padStart(2,'0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
const PALETTE = Array.from({length:40},(_,i)=>hsl2hex(Math.round(i*9),65,50));

function physicalToPx(value, unit){
  const perInch = 96;
  const factor = unit==='cm' ? perInch/2.54 : unit==='mm' ? perInch/25.4 : unit==='in' ? perInch : 1;
  return (parseFloat(value)||0) * factor;
}
function linTicks(start,end,count){
  if(count<2) count=2;
  const arr=[];
  for(let i=0;i<count;i++) arr.push(start+i*(end-start)/(count-1));
  const range=Math.abs(end-start)||1;
  const decimals=Math.max(0, 2-Math.floor(Math.log10(range)));
  return arr.map(v=>parseFloat(v.toFixed(decimals)));
}

function defaultColIdx(i){ return ((i*7+5)%40)+1; }
function makeColConfig(headers, startIdx){
  startIdx = startIdx||0;
  const cfg=[];
  for(let i=startIdx;i<headers.length;i++){
    const idx=defaultColIdx(i);
    cfg.push({label:headers[i]||('Series '+i), colorIdx:idx, color:PALETTE[idx-1], visible:true, colIndex:i, width:2, dash:false});
  }
  return cfg;
}
function renderColConfigList(container, cfgArr, onChange, showLineExtras){
  container.innerHTML='';
  cfgArr.forEach((s)=>{
    const div=document.createElement('div'); div.className='seriesBox';
    div.innerHTML = `<div class="check"><input type="checkbox" ${s.visible?'checked':''} data-role="vis"><label style="margin:0">Show in plot</label></div>
      <input value="${s.label}" data-role="label" style="margin-top:4px">
      <div data-role="pal" style="margin-top:6px"></div>` +
      (showLineExtras? `<div class="row" style="margin-top:6px"><div><input type="number" value="${s.width}" min="1" data-role="width"></div>
        <div><select data-role="dash"><option value="solid">Solid</option><option value="dashed" ${s.dash?'selected':''}>Dashed</option></select></div></div>`:'');
    container.appendChild(div);
    div.querySelector('[data-role=vis]').onchange=e=>{ s.visible=e.target.checked; onChange(); };
    div.querySelector('[data-role=label]').onchange=e=>{ s.label=e.target.value; onChange(); };
    if(showLineExtras){
      div.querySelector('[data-role=width]').onchange=e=>{ s.width=parseFloat(e.target.value); onChange(); };
      div.querySelector('[data-role=dash]').onchange=e=>{ s.dash=e.target.value==='dashed'; onChange(); };
    }
    createPalette(div.querySelector('[data-role=pal]'), s.colorIdx, (color,idx)=>{ s.color=color; s.colorIdx=idx; onChange(); });
  });
}
function fontRoleHTML(role,title){
  return `<div class="subh">${title}</div>
    <div class="row"><div><label>Family</label><select id="${role}Family">
      <option value="Arial, Helvetica, sans-serif">Arial</option>
      <option value="Georgia, serif">Georgia</option>
      <option value="'Times New Roman', serif">Times New Roman</option>
      <option value="'Courier New', monospace">Courier New</option>
      <option value="Verdana, sans-serif">Verdana</option>
    </select></div>
    <div><label>Style</label><select id="${role}Style"><option value="normal">Normal</option><option value="italic">Italic</option><option value="bold">Bold</option><option value="bolditalic">Bold Italic</option></select></div></div>
    <div class="row" style="margin-top:6px"><div><label>Size</label><input id="${role}Size" type="number" value="13"></div>
    <div><label>Color</label><select id="${role}ColorMode">${role==='legend'?'<option value="match">Match series/group</option>':''}<option value="default">Default</option><option value="custom">Custom</option></select></div></div>
    <div id="${role}ColorBox" style="display:none"><div id="pal-${role}"></div></div>`;
}
function initFontRole(role, onChange){
  ['Family','Style','Size'].forEach(k=>{ const el=document.getElementById(role+k); el.addEventListener('input',onChange); el.addEventListener('change',onChange); });
  const modeEl=document.getElementById(role+'ColorMode');
  modeEl.addEventListener('change',()=>{ document.getElementById(role+'ColorBox').style.display = modeEl.value==='custom'?'block':'none'; onChange(); });
  return createPalette(document.getElementById('pal-'+role), 1, onChange);
}
function roleFontAttrs(role){
  return fontAttrs(document.getElementById(role+'Family').value, document.getElementById(role+'Style').value, document.getElementById(role+'Size').value);
}
function roleColor(role, pal, fallbackDefault, matchColor){
  const mode=document.getElementById(role+'ColorMode').value;
  if(mode==='match') return matchColor!==undefined?matchColor:fallbackDefault;
  if(mode==='custom') return pal.get().color;
  return fallbackDefault;
}

function drawLegend(items, cfg){
  const {position,layout,gap,ml,mr,mt,mb,W,H} = cfg;
  const horiz = layout==='horizontal';
  const rowH=18;
  const widths = items.map(it=> 24 + it.label.length*6.5);
  const totalW = horiz ? widths.reduce((a,b)=>a+b+gap,0)-gap : Math.max(...widths,60);
  const totalH = horiz ? rowH : items.length*rowH + (items.length-1)*gap;
  const x0 = position.includes('left') ? ml+12 : W-mr-12-totalW;
  const y0 = position.includes('top') ? mt+16 : H-mb-16-totalH;
  let s='', cx=x0;
  items.forEach((it,i)=>{
    const ix = horiz? cx : x0;
    const iy = horiz? y0 : y0+i*(rowH+gap);
    if(it.type==='line') s+=`<line x1="${ix}" y1="${iy+8}" x2="${ix+16}" y2="${iy+8}" stroke="${it.color}" stroke-width="${it.width||2}" ${it.dash?'stroke-dasharray="6,4"':''}/>`;
    else if(it.type==='box') s+=`<rect x="${ix}" y="${iy+3}" width="14" height="10" fill="${it.color}"/>`;
    else if(it.type==='dot') s+=`<rect x="${ix+5}" y="${iy+5}" width="6" height="6" fill="${it.color}"/>`;
    else s+=`<rect x="${ix}" y="${iy+2}" width="12" height="12" fill="${it.color}" fill-opacity="${it.opacity!==undefined?it.opacity:0.6}" stroke="${it.color}"/>`;
    s+=`<text x="${ix+20}" y="${iy+13}" ${it.font} fill="${it.textColor}">${escXml(it.label)}</text>`;
    if(horiz) cx += widths[i]+gap;
  });
  return s;
}

async function exportVectorPDF(svgEl, wIn, hIn, filename){
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF({unit:'in', format:[wIn,hIn]});
  await pdf.svg(svgEl,{x:0,y:0,width:wIn,height:hIn});
  pdf.save(filename);
}

function createPalette(container, initialIdx, onChange){
  let idx = initialIdx||1;
  function draw(){
    container.innerHTML = '<div class="palette">'+PALETTE.map((c,i)=>`<div class="sw${i+1===idx?' sel':''}" style="background:${c}" data-i="${i+1}">${i+1}</div>`).join('')+
      '</div><div class="palNum"><input type="number" min="1" max="40" value="'+idx+'"><span>type 1\u201340</span></div>';
    container.querySelectorAll('.sw').forEach(el=>el.onclick=()=>{idx=parseInt(el.dataset.i);draw();onChange(PALETTE[idx-1],idx);});
    container.querySelector('input').onchange=e=>{idx=Math.max(1,Math.min(40,parseInt(e.target.value)||1));draw();onChange(PALETTE[idx-1],idx);};
  }
  draw();
  return {get:()=>({color:PALETTE[idx-1],idx}), set:(i)=>{idx=i;draw();}};
}

function parseDelimited(text){
  const lines = text.trim().split(/\r?\n/).filter(l=>l.trim().length);
  if(!lines.length) return {headers:[],cols:[]};
  const delim = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delim).map(h=>h.trim());
  const cols = headers.map(()=>[]);
  for(let i=1;i<lines.length;i++){
    const cells = lines[i].split(delim);
    cells.forEach((c,j)=>{ if(j<cols.length){ const v=parseFloat(c); if(!isNaN(v)) cols[j].push(v); } });
  }
  return {headers,cols};
}

function loadFile(file, cb){
  const name=file.name.toLowerCase();
  if(name.endsWith('.xlsx')||name.endsWith('.xls')){
    const reader=new FileReader();
    reader.onload=e=>{
      const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      const sheet=wb.Sheets[wb.SheetNames[0]];
      cb(XLSX.utils.sheet_to_csv(sheet));
    };
    reader.readAsArrayBuffer(file);
  } else {
    const reader=new FileReader();
    reader.onload=e=>cb(e.target.result);
    reader.readAsText(file);
  }
}

function niceTicks(min,max,count){
  if(min===max){min-=1;max+=1;}
  const raw=(max-min)/count, mag=Math.pow(10,Math.floor(Math.log10(raw))), norm=raw/mag;
  const step=(norm<1.5?1:norm<3?2:norm<7?5:10)*mag;
  const start=Math.ceil(min/step)*step;
  const ticks=[];
  for(let v=start; v<=max+1e-9; v+=step) ticks.push(Math.round(v*1000)/1000);
  return ticks;
}

function quartileStats(arr){
  const a=[...arr].sort((x,y)=>x-y); const n=a.length;
  const q=(p)=>{ const idx=p*(n-1); const lo=Math.floor(idx), hi=Math.ceil(idx); return a[lo]+(a[hi]-a[lo])*(idx-lo); };
  const q1=q(0.25), median=q(0.5), q3=q(0.75), iqr=q3-q1;
  const loW=Math.max(a[0], q1-1.5*iqr), hiW=Math.min(a[n-1], q3+1.5*iqr);
  const mean=a.reduce((s,v)=>s+v,0)/n;
  return {q1,median,q3,iqr,loW,hiW,mean,min:a[0],max:a[n-1],n};
}

function gaussianKDE(data, points, bandwidth){
  const n=data.length;
  return points.map(x=>{
    let s=0;
    for(const d of data){ const u=(x-d)/bandwidth; s+=Math.exp(-0.5*u*u); }
    return s/(n*bandwidth*Math.sqrt(2*Math.PI));
  });
}
function silvermanBW(data){
  const n=data.length, mean=data.reduce((a,b)=>a+b,0)/n;
  const sd=Math.sqrt(data.reduce((a,b)=>a+(b-mean)**2,0)/(n-1))||1;
  return 1.06*sd*Math.pow(n,-0.2) || 1;
}

function fontAttrs(family,styleMode,size){
  let style='normal',weight='normal';
  if(styleMode==='italic') style='italic';
  else if(styleMode==='bold') weight='bold';
  else if(styleMode==='bolditalic'){style='italic';weight='bold';}
  return `font-family="${family}" font-style="${style}" font-weight="${weight}" font-size="${size}"`;
}
function escXml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function downloadSVG(svgEl, filename){
  const blob=new Blob([svgEl.outerHTML],{type:'image/svg+xml'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
