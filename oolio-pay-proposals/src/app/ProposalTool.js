'use client';
import { useState, useRef, useCallback } from 'react';

// ─── Brand Configs (images served from /public/images/) ──────────────────────
const BRANDS = {
  oolio: {
    name: 'Oolio', primary: '#673AB6', primaryDark: '#5E35B1',
    gradient: 'linear-gradient(135deg, #673AB6, #5E35B1)',
    logo: '/images/oolio-white.png',
  },
  ordermate: {
    name: 'OrderMate', primary: '#E53935', primaryDark: '#C62828',
    gradient: 'linear-gradient(-135deg, #E53935, #C62828)',
    logo: '/images/ordermate-white.png',
  },
};

const TERMINAL_IMG = '/images/terminal.png';

// Oolio Pay inline SVG
const OOLIO_PAY_SVG = 'M592.8,302c2.1,0,4.1,1.1,5.1,2.9l35.7,59.3l35.9-59.3c1.1-1.8,3-2.9,5.1-2.9h45.7c3.3,0,6,2.7,6,6c0,1.1-.3,2.2-.9,3.1l-63.6,105.6V472c0,5.5-4.5,10-10,10h-41.8c-5.5,0-10-4.5-10-10v-56.1l-63.6-104.8c-1.7-2.8-.8-6.5,2-8.2c.9-.6,2-.9,3.1-.9H592.8zM479.4,302c2.5,0,4.6,1.5,5.6,3.8l67.7,168c1.2,3.1-.2,6.6-3.3,7.8c-.7.3-1.5.4-2.2.4h-44.7c-2.5,0-4.8-1.6-5.6-4l-9.7-27.4h-63l-9.7,27.4c-.9,2.4-3.1,4-5.6,4h-43.8c-3.3,0-6-2.7-6-6c0-.8.1-1.5.4-2.2l67.7-168c.9-2.3,3.1-3.8,5.6-3.8H479.4zM283.3,302c16.8,0,31.4,2.7,43.8,8.2s22,13.4,28.8,23.7s10.1,22.3,10.1,36s-3.4,25.7-10.1,36s-16.3,18.2-28.8,23.7s-27,8.2-43.8,8.2h-26.2V472c0,5.5-4.5,10-10,10H206c-5.5,0-10-4.5-10-10V312c0-5.5,4.5-10,10-10L283.3,302zM454.9,365.7c-.6.2-1,.6-1.2,1.2l-14.2,40h32.2l-14.2-40C457,365.9,455.9,365.4,454.9,365.7zM279.7,348.7h-22.3v41.8h22.3c8.3,0,14.5-1.8,18.7-5.5s6.2-8.8,6.2-15.4s-2.1-11.8-6.2-15.4S288,348.7,279.7,348.7zM805,0c66.8,0,121,54.2,121,121s-54.2,121-121,121s-121-54.2-121-121S738.2,0,805,0zM805,81c-22.1,0-40,17.9-40,40s17.9,40,40,40s40-17.9,40-40S827.1,81,805,81zM604,0h60c5.5,0,10,4.5,10,10v222c0,5.5-4.5,10-10,10h-60c-5.5,0-10-4.5-10-10V10C594,4.5,598.5,0,604,0zM424,242c-5.5,0-10-4.5-10-10V10c0-5.5,4.5-10,10-10h60c5.5,0,10,4.5,10,10v152h80c5.5,0,10,4.5,10,10v60c0,5.5-4.5,10-10,10H424zM283,0c66.8,0,121,54.2,121,121s-54.2,121-121,121c-31.1,0-59.6-11.8-81-31.1c-21.4,19.3-49.9,31.1-81,31.1C54.2,242,0,187.8,0,121S54.2,0,121,0c31.1,0,59.6,11.8,81,31.1C223.4,11.8,251.9,0,283,0zM283,81c-22.1,0-40,17.9-40,40s17.9,40,40,40s40-17.9,40-40S305.1,81,283,81zM121,81c-22.1,0-40,17.9-40,40s17.9,40,40,40s40-17.9,40-40S143.1,81,121,81z';
const OolioPayLogo = ({ size = 28, fill = '#fff' }) => (
  <svg viewBox="0 0 926 482" style={{ height: size }} fill={fill} xmlns="http://www.w3.org/2000/svg"><path d={OOLIO_PAY_SVG}/></svg>
);

// ─── Rate types ──────────────────────────────────────────────────────────────
const RATE_TYPES = [
  { id: 'blended', label: 'Blended', fields: ['blended'] },
  { id: 'blended_fixed', label: 'Blended Rate + Fixed Fee', fields: ['blended','fixedFee'] },
  { id: 'blended_amex', label: 'Blended & AMEX', fields: ['blended','amex'] },
  { id: 'blended_amex_intl', label: 'Blended & AMEX & International', fields: ['blended','amex','international'] },
  { id: 'blended_amex_intl_fixed', label: 'Blended & AMEX & Intl + Fixed Fee', fields: ['blended','amex','international','fixedFee'] },
  { id: 'debit_credit', label: 'Debit & Credit', fields: ['debit','credit'] },
  { id: 'debit_credit_fixed', label: 'Debit & Credit + Fixed Fee', fields: ['debit','credit','fixedFee'] },
  { id: 'debit_credit_amex_intl', label: 'Debit & Credit & AMEX & Intl', fields: ['debit','credit','amex','international'] },
  { id: 'debit_credit_amex_intl_fixed', label: 'Debit & Credit & AMEX & Intl + Fixed', fields: ['debit','credit','amex','international','fixedFee'] },
];
const RATE_LABELS = { blended:'Blended MSF Rate', debit:'Debit Rate', credit:'Credit Rate', amex:'AMEX Rate', international:'International Rate', fixedFee:'Fixed Fee per Txn' };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = v => { const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(2)+'%'; };
const fmtDollar = v => { const n = parseFloat(v); return isNaN(n) ? '—' : '$'+n.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}); };
const fmtPct = v => { const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(0)+'%'; };
const emptyRates = () => ({ blended:'',debit:'',credit:'',amex:'',international:'',fixedFee:'' });
const emptyOption = () => ({ rateType:'blended_amex_intl', rates:emptyRates(), saasDiscount:'',saasAmount:'',advantageDiscount:'',advantageAmount:'',terminalCount:'',terminalDiscount:'' });
const emptyExisting = () => ({ ...emptyOption() });

// ─── Small components ────────────────────────────────────────────────────────
const inputSt = { width:'100%',padding:'8px 10px',border:'1px solid #d0d0d0',borderRadius:6,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit' };
const labelSt = { fontSize:11,fontWeight:600,color:'#555',marginBottom:3,display:'block' };

function Field({label,value,onChange,placeholder,suffix}){
  return(<div style={{marginBottom:8}}><label style={labelSt}>{label}</label><div style={{position:'relative'}}>
    <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={inputSt}/>
    {suffix&&<span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#999'}}>{suffix}</span>}
  </div></div>);
}
function Select({label,value,onChange,options}){
  return(<div style={{marginBottom:8}}><label style={labelSt}>{label}</label>
    <select value={value} onChange={e=>onChange(e.target.value)} style={{...inputSt,appearance:'auto'}}>
      {options.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
    </select></div>);
}
function RateFields({rateType,rates,onChange}){
  const type = RATE_TYPES.find(t=>t.id===rateType); if(!type) return null;
  return(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
    {type.fields.map(f=><Field key={f} label={RATE_LABELS[f]+' (ex GST %)'} value={rates[f]||''} onChange={v=>onChange({...rates,[f]:v})} placeholder="0.00" suffix="%"/>)}
  </div>);
}
function SubsidyFields({data,onChange}){
  const set=(k,v)=>onChange({...data,[k]:v});
  return(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
    <Field label="SaaS Discount %" value={data.saasDiscount} onChange={v=>set('saasDiscount',v)} placeholder="0" suffix="%"/>
    <Field label="SaaS Amount ($)" value={data.saasAmount} onChange={v=>set('saasAmount',v)} placeholder="0.00" suffix="$"/>
    <Field label="Advantage+ Discount %" value={data.advantageDiscount} onChange={v=>set('advantageDiscount',v)} placeholder="0" suffix="%"/>
    <Field label="Advantage+ Amount ($)" value={data.advantageAmount} onChange={v=>set('advantageAmount',v)} placeholder="0.00" suffix="$"/>
    <Field label="No. of Terminals" value={data.terminalCount} onChange={v=>set('terminalCount',v)} placeholder="0"/>
    <Field label="Terminal Subsidy %" value={data.terminalDiscount} onChange={v=>set('terminalDiscount',v)} placeholder="0" suffix="%"/>
  </div>);
}

// ─── Preview Card ────────────────────────────────────────────────────────────
function PreviewCard({brand,merchant,existing,options,customerLogo,repName}){
  const b = BRANDS[brand];
  const optCount = options.length;
  const rateTypeObj = id => RATE_TYPES.find(t=>t.id===id);
  const today = new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});

  const RowItem = ({label,value,muted})=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'3px 0',borderBottom:`1px solid ${muted?'#eee':b.primary+'15'}`,gap:8}}>
      <span style={{fontSize:9,color:muted?'#aaa':'#555',whiteSpace:'nowrap',flexShrink:0}}>{label}</span>
      <span style={{fontSize:10,fontWeight:700,color:muted?'#999':b.primary,textAlign:'right',whiteSpace:'nowrap'}}>{value}</span>
    </div>
  );
  const renderRates = (opt,muted)=>{const type=rateTypeObj(opt.rateType);if(!type)return null;return type.fields.map(f=><RowItem key={f} label={RATE_LABELS[f]} value={f==='fixedFee'?fmtDollar(opt.rates[f]):fmt(opt.rates[f])} muted={muted}/>);};
  const renderSubsidy = (opt,muted)=>{
    const items=[];
    if(opt.saasDiscount||opt.saasAmount){const p=[];if(opt.saasDiscount)p.push(fmtPct(opt.saasDiscount)+' off');if(opt.saasAmount)p.push(fmtDollar(opt.saasAmount));items.push(<RowItem key="saas" label="SaaS" value={p.join(' · ')} muted={muted}/>);}
    if(opt.advantageDiscount||opt.advantageAmount){const p=[];if(opt.advantageDiscount)p.push(fmtPct(opt.advantageDiscount)+' off');if(opt.advantageAmount)p.push(fmtDollar(opt.advantageAmount));items.push(<RowItem key="adv" label="Advantage+" value={p.join(' · ')} muted={muted}/>);}
    if(opt.terminalCount){const p=[];if(opt.terminalDiscount)p.push(fmtPct(opt.terminalDiscount)+' off');items.push(<RowItem key="term" label={`EFTPOS Terminal ×${opt.terminalCount}`} value={p.length?p.join(' · '):'—'} muted={muted}/>);}
    return items;
  };
  const SectionLabel = ({children,muted})=>(<div style={{fontSize:8,fontWeight:700,color:muted?'#bbb':b.primary,textTransform:'uppercase',letterSpacing:1.2,marginTop:8,marginBottom:2,opacity:muted?0.7:0.5}}>{children}</div>);

  return(
    <div id="proposal-output" style={{width:680,background:'#fff',borderRadius:14,overflow:'hidden',fontFamily:'Inter, sans-serif',boxShadow:'0 4px 32px rgba(0,0,0,0.08)'}}>
      {/* Header */}
      <div style={{background:b.gradient,padding:'20px 28px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {customerLogo?(<img src={customerLogo} alt="" style={{maxHeight:36,maxWidth:120,objectFit:'contain'}}/>):(<div style={{color:'#fff',fontSize:16,fontWeight:800}}>{merchant.name||'Merchant Name'}</div>)}
            <div style={{width:1,height:28,background:'rgba(255,255,255,0.25)'}}/>
            <img src={b.logo} alt={b.name} style={{height:18,objectFit:'contain'}}/>
          </div>
          <div style={{textAlign:'right',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:7,textTransform:'uppercase',letterSpacing:1.5,fontWeight:600}}>Powered by</div>
            <OolioPayLogo size={22} fill="#fff"/>
            {repName?<div style={{color:'rgba(255,255,255,0.6)',fontSize:7,marginTop:2}}>Prepared by {repName} · {today}</div>:<div style={{color:'rgba(255,255,255,0.5)',fontSize:7,marginTop:1}}>{today}</div>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{padding:'12px 28px 10px',display:'grid',gridTemplateColumns:`130px repeat(${optCount}, 1fr)`,gap:14}}>
        <div style={{opacity:0.5,minWidth:0}}>
          <div style={{fontSize:9,fontWeight:800,color:'#999',textTransform:'uppercase',letterSpacing:1,paddingBottom:4,borderBottom:'1.5px solid #ddd',marginBottom:2}}>Current</div>
          <SectionLabel muted>Rates</SectionLabel>{renderRates(existing,true)}
          <SectionLabel muted>Pricing</SectionLabel>{renderSubsidy(existing,true)}
        </div>
        {options.map((opt,i)=>(
          <div key={i} style={{borderLeft:`2.5px solid ${b.primary}`,paddingLeft:12,minWidth:0}}>
            <div style={{fontSize:10,fontWeight:800,color:b.primary,textTransform:'uppercase',letterSpacing:1,paddingBottom:4,borderBottom:`1.5px solid ${b.primary}25`,marginBottom:2}}>{optCount===1?'New Offer':`Option ${i+1}`}</div>
            <SectionLabel>Rates</SectionLabel>{renderRates(opt,false)}
            <SectionLabel>Pricing</SectionLabel>{renderSubsidy(opt,false)}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{background:'#f7f7f8',padding:'10px 28px 16px',borderTop:'1px solid #eee'}}>
        <img src={TERMINAL_IMG} alt="" style={{float:'right',width:100,objectFit:'contain',marginLeft:14,marginTop:-4}}/>
        <div style={{fontSize:8,color:b.primary,fontWeight:600,letterSpacing:0.3,opacity:0.6,marginBottom:4}}>All rates and fees shown are exclusive of GST.</div>
        <div style={{fontSize:8,color:'#aaa',lineHeight:1.5}}>
          *Terms &amp; Conditions apply. Discounts and rates are applicable based on a minimum monthly card transaction volume of 80% of {fmtDollar(merchant.ttv)}. This proposal is indicative only and subject to formal agreement.
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function ProposalTool(){
  const [brand,setBrand]=useState('oolio');
  const [merchant,setMerchant]=useState({name:'',ttv:''});
  const [customerLogo,setCustomerLogo]=useState(null);
  const [existing,setExisting]=useState(emptyExisting());
  const [options,setOptions]=useState([emptyOption()]);
  const [repName,setRepName]=useState('');
  const [exporting,setExporting]=useState(false);
  const [renderedPng,setRenderedPng]=useState(null);
  const outputRef=useRef(null);
  const b=BRANDS[brand];

  const handleLogoUpload=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>setCustomerLogo(ev.target.result);reader.readAsDataURL(file);};
  const addOption=()=>{if(options.length<3)setOptions([...options,emptyOption()]);};
  const removeOption=i=>{if(options.length>1)setOptions(options.filter((_,j)=>j!==i));};
  const updateOption=(i,data)=>setOptions(options.map((o,j)=>j===i?data:o));

  const doExport=useCallback(async(format)=>{
    setExporting(true);
    try{
      const el=document.getElementById('proposal-output');if(!el)return;
      const{toPng}=await import('html-to-image');
      const dataUrl=await toPng(el,{pixelRatio:3,cacheBust:true,style:{transform:'scale(1)',transformOrigin:'top left'}});
      if(format==='png'){
        const link=document.createElement('a');link.download=`${merchant.name||'proposal'}_${b.name}_pay_proposal.png`;link.href=dataUrl;link.click();
        setRenderedPng(dataUrl);
      }else if(format==='render'){
        setRenderedPng(dataUrl);
      }else{
        const{jsPDF}=await import('jspdf');
        const img=new Image();img.src=dataUrl;await new Promise(r=>{img.onload=r;});
        const pxW=img.naturalWidth,pxH=img.naturalHeight,sc=3;
        const pdfW=pxW*0.264583/sc,pdfH=pxH*0.264583/sc;
        const doc=new jsPDF({orientation:pdfW>pdfH?'l':'p',unit:'mm',format:[pdfW,pdfH]});
        doc.addImage(dataUrl,'PNG',0,0,pdfW,pdfH);
        doc.save(`${merchant.name||'proposal'}_${b.name}_pay_proposal.pdf`);
      }
    }catch(err){console.error('Export failed:',err);alert('Export failed. Check console.');}
    finally{setExporting(false);}
  },[merchant.name,b.name]);

  const sectionTitle=br=>({fontSize:13,fontWeight:700,color:br.primary,textTransform:'uppercase',letterSpacing:1,marginBottom:10,paddingBottom:6,borderBottom:`2px solid ${br.primary}20`});

  return(
    <div style={{minHeight:'100vh',background:'#f4f4f6',fontFamily:'Inter, sans-serif'}}>
      {/* Top Bar */}
      <div style={{background:b.gradient,padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 2px 12px rgba(0,0,0,0.15)'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <OolioPayLogo size={24} fill="#fff"/>
          <span style={{color:'#fff',fontSize:15,fontWeight:700,letterSpacing:0.5}}>Rate Proposal Generator</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          {['oolio','ordermate'].map(bk=>(
            <button key={bk} onClick={()=>setBrand(bk)} style={{padding:'6px 16px',borderRadius:20,border:brand===bk?'2px solid #fff':'2px solid rgba(255,255,255,0.3)',background:brand===bk?'rgba(255,255,255,0.2)':'transparent',color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
              {BRANDS[bk].name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{display:'flex',gap:24,padding:24,maxWidth:1400,margin:'0 auto'}}>
        {/* Left Panel */}
        <div style={{width:360,flexShrink:0}}>
          <div style={{background:'#fff',borderRadius:12,padding:18,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
            <div style={sectionTitle(b)}>Merchant Info</div>
            <Field label="Merchant / Venue Name" value={merchant.name} onChange={v=>setMerchant({...merchant,name:v})} placeholder="e.g. The Local Pub"/>
            <Field label="Monthly TTV ($)" value={merchant.ttv} onChange={v=>setMerchant({...merchant,ttv:v})} placeholder="300000" suffix="$"/>
            <Field label="Prepared By" value={repName} onChange={setRepName} placeholder="e.g. Olivia Mayes"/>
            <div style={{marginBottom:8}}><label style={labelSt}>Customer Logo (optional)</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{fontSize:12}}/>
              {customerLogo&&<button onClick={()=>setCustomerLogo(null)} style={{fontSize:11,color:b.primary,background:'none',border:'none',cursor:'pointer',marginTop:4}}>Remove logo</button>}
            </div>
          </div>

          <div style={{background:'#fff',borderRadius:12,padding:18,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
            <div style={sectionTitle(b)}>Existing Contract</div>
            <Select label="Rate Type" value={existing.rateType} onChange={v=>setExisting({...existing,rateType:v})} options={RATE_TYPES}/>
            <RateFields rateType={existing.rateType} rates={existing.rates} onChange={r=>setExisting({...existing,rates:r})}/>
            <div style={{marginTop:8}}><SubsidyFields data={existing} onChange={setExisting}/></div>
          </div>

          {options.map((opt,i)=>(
            <div key={i} style={{background:'#fff',borderRadius:12,padding:18,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,0.06)',borderLeft:`4px solid ${b.primary}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',...sectionTitle(b)}}>
                <span>{options.length===1?'New Offer':`New Option ${i+1}`}</span>
                {options.length>1&&<button onClick={()=>removeOption(i)} style={{fontSize:11,color:'#c00',background:'none',border:'none',cursor:'pointer'}}>Remove</button>}
              </div>
              <Select label="Rate Type" value={opt.rateType} onChange={v=>updateOption(i,{...opt,rateType:v})} options={RATE_TYPES}/>
              <RateFields rateType={opt.rateType} rates={opt.rates} onChange={r=>updateOption(i,{...opt,rates:r})}/>
              <div style={{marginTop:8}}><SubsidyFields data={opt} onChange={d=>updateOption(i,d)}/></div>
            </div>
          ))}
          {options.length<3&&(
            <button onClick={addOption} style={{width:'100%',padding:10,borderRadius:10,border:`2px dashed ${b.primary}40`,background:'transparent',color:b.primary,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',marginBottom:16}}>
              + Add Option {options.length+1}
            </button>
          )}
        </div>

        {/* Right Panel */}
        <div style={{flex:1,overflow:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:'#999',textTransform:'uppercase',letterSpacing:1.5}}>Live Preview</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>doExport('render')} disabled={exporting} style={{padding:'7px 14px',borderRadius:8,border:`1.5px solid ${b.primary}40`,background:'#fff',color:b.primary,fontWeight:600,fontSize:11,cursor:exporting?'wait':'pointer',fontFamily:'inherit',opacity:exporting?0.6:1}}>
                {exporting?'...':'📋 Copy Image'}
              </button>
              <button onClick={()=>doExport('png')} disabled={exporting} style={{padding:'7px 18px',borderRadius:8,border:'none',background:b.gradient,color:'#fff',fontWeight:700,fontSize:11,cursor:exporting?'wait':'pointer',fontFamily:'inherit',opacity:exporting?0.6:1}}>
                {exporting?'...':'⬇ Download PNG'}
              </button>
              <button onClick={()=>doExport('pdf')} disabled={exporting} style={{padding:'7px 14px',borderRadius:8,border:`1.5px solid ${b.primary}`,background:'#fff',color:b.primary,fontWeight:600,fontSize:11,cursor:exporting?'wait':'pointer',fontFamily:'inherit',opacity:exporting?0.6:1}}>
                {exporting?'...':'⬇ PDF'}
              </button>
            </div>
          </div>
          <div style={{display:'inline-block'}} ref={outputRef}>
            <PreviewCard brand={brand} merchant={merchant} existing={existing} options={options} customerLogo={customerLogo} repName={repName}/>
          </div>
          {renderedPng&&(
            <div style={{marginTop:16}}>
              <div style={{fontSize:10,color:'#999',marginBottom:6}}>Right-click the image below to copy or save:</div>
              <img src={renderedPng} alt="Proposal" style={{maxWidth:'100%',borderRadius:8,boxShadow:'0 2px 12px rgba(0,0,0,0.08)'}}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
