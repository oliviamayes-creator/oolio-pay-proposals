'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

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
const AMEX_APPLY_URL = 'https://www.americanexpress.com/en-au/business/merchant/manage-account.html#get-started';

// Oolio Pay inline SVG
const OOLIO_PAY_SVG = 'M592.8,302c2.1,0,4.1,1.1,5.1,2.9l35.7,59.3l35.9-59.3c1.1-1.8,3-2.9,5.1-2.9h45.7c3.3,0,6,2.7,6,6c0,1.1-.3,2.2-.9,3.1l-63.6,105.6V472c0,5.5-4.5,10-10,10h-41.8c-5.5,0-10-4.5-10-10v-56.1l-63.6-104.8c-1.7-2.8-.8-6.5,2-8.2c.9-.6,2-.9,3.1-.9H592.8zM479.4,302c2.5,0,4.6,1.5,5.6,3.8l67.7,168c1.2,3.1-.2,6.6-3.3,7.8c-.7.3-1.5.4-2.2.4h-44.7c-2.5,0-4.8-1.6-5.6-4l-9.7-27.4h-63l-9.7,27.4c-.9,2.4-3.1,4-5.6,4h-43.8c-3.3,0-6-2.7-6-6c0-.8.1-1.5.4-2.2l67.7-168c.9-2.3,3.1-3.8,5.6-3.8H479.4zM283.3,302c16.8,0,31.4,2.7,43.8,8.2s22,13.4,28.8,23.7s10.1,22.3,10.1,36s-3.4,25.7-10.1,36s-16.3,18.2-28.8,23.7s-27,8.2-43.8,8.2h-26.2V472c0,5.5-4.5,10-10,10H206c-5.5,0-10-4.5-10-10V312c0-5.5,4.5-10,10-10L283.3,302zM454.9,365.7c-.6.2-1,.6-1.2,1.2l-14.2,40h32.2l-14.2-40C457,365.9,455.9,365.4,454.9,365.7zM279.7,348.7h-22.3v41.8h22.3c8.3,0,14.5-1.8,18.7-5.5s6.2-8.8,6.2-15.4s-2.1-11.8-6.2-15.4S288,348.7,279.7,348.7zM805,0c66.8,0,121,54.2,121,121s-54.2,121-121,121s-121-54.2-121-121S738.2,0,805,0zM805,81c-22.1,0-40,17.9-40,40s17.9,40,40,40s40-17.9,40-40S827.1,81,805,81zM604,0h60c5.5,0,10,4.5,10,10v222c0,5.5-4.5,10-10,10h-60c-5.5,0-10-4.5-10-10V10C594,4.5,598.5,0,604,0zM424,242c-5.5,0-10-4.5-10-10V10c0-5.5,4.5-10,10-10h60c5.5,0,10,4.5,10,10v152h80c5.5,0,10,4.5,10,10v60c0,5.5-4.5,10-10,10H424zM283,0c66.8,0,121,54.2,121,121s-54.2,121-121,121c-31.1,0-59.6-11.8-81-31.1c-21.4,19.3-49.9,31.1-81,31.1C54.2,242,0,187.8,0,121S54.2,0,121,0c31.1,0,59.6,11.8,81,31.1C223.4,11.8,251.9,0,283,0zM283,81c-22.1,0-40,17.9-40,40s17.9,40,40,40s40-17.9,40-40S305.1,81,283,81zM121,81c-22.1,0-40,17.9-40,40s17.9,40,40,40s40-17.9,40-40S143.1,81,121,81z';
const OolioPayLogo = ({ size = 28, fill = '#fff' }) => (
  <svg viewBox="0 0 926 482" style={{ height: size }} fill={fill} xmlns="http://www.w3.org/2000/svg"><path d={OOLIO_PAY_SVG}/></svg>
);

// ─── Rate types ──────────────────────────────────────────────────────────────
// Each field below carries its own rate % AND its own optional fixed fee per
// transaction, so a blended rate can have a fee while e.g. AMEX/International
// are flat with no fee (see RateFields).
const RATE_TYPES = [
  { id: 'blended', label: 'Blended', fields: ['blended'] },
  { id: 'blended_amex', label: 'Blended & AMEX', fields: ['blended','amex'] },
  { id: 'blended_amex_intl', label: 'Blended & AMEX & International', fields: ['blended','amex','international'] },
  { id: 'debit_credit', label: 'Debit & Credit', fields: ['debit','credit'] },
  { id: 'debit_credit_amex_intl', label: 'Debit & Credit & AMEX & Intl', fields: ['debit','credit','amex','international'] },
];
const RATE_LABELS = { blended:'Blended MSF Rate', debit:'Debit Rate', credit:'Credit Rate', amex:'AMEX Rate', international:'International Rate' };
const RATE_FIELD_KEYS = ['blended','debit','credit','amex','international'];
const rateLabel = (f,amexDirect) => f==='amex' && amexDirect ? 'AMEX Rate (Direct) *' : RATE_LABELS[f];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = v => { const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(2)+'%'; };
const fmtDollar = v => { const n = parseFloat(v); return isNaN(n) ? '—' : '$'+n.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}); };
const fmtRateFee = (rate,fee) => {
  const r = fmt(rate);
  const feeNum = parseFloat(fee);
  return isNaN(feeNum) ? r : `${r} + ${fmtDollar(fee)}`;
};
const emptyRates = () => Object.fromEntries(RATE_FIELD_KEYS.map(k=>[k,{rate:'',fee:''}]));
const emptyOption = () => ({
  rateType:'blended_amex_intl', rates:emptyRates(),
  hasEcom:false, ecomRateType:'blended', ecomRates:emptyRates(),
  saasDiscount:'',saasAmount:'',advantageDiscount:'',advantageAmount:'',terminalCount:'',terminalDiscount:''
});
const emptyExisting = () => ({ ...emptyOption() });
const EXPIRY_OPTIONS = [
  { id:'7', label:'7 days' },
  { id:'14', label:'14 days' },
  { id:'30', label:'30 days' },
];
const addDays = (days) => { const d=new Date(); d.setDate(d.getDate()+Number(days)); return d.toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'}); };
const DRAFT_KEY = 'oolio_proposal_draft';
const BANNER_DISMISS_KEY = 'oolio_banner_dismissed';
const RECENT_KEY = 'oolio_recent_proposals';
const MAX_RECENT = 5;
const TERMINAL_MONTHLY_COST = 28;
const CONTRACT_TERMS = [
  { id:'', label:'— Not set —' },
  { id:'month_to_month', label:'Month to Month' },
  { id:'12', label:'12 Months' },
  { id:'24', label:'24 Months' },
  { id:'36', label:'36 Months' },
];
const fmtMoney = (n) => Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
// Unicode-safe base64 helpers for encoding form state into the shareable URL.
const b64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const b64Decode = (str) => decodeURIComponent(escape(atob(str)));

// ─── Small components ────────────────────────────────────────────────────────
const inputSt = { width:'100%',padding:'8px 10px',border:'1px solid #d0d0d0',borderRadius:6,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit' };
const labelSt = { fontSize:11,fontWeight:600,color:'#555',marginBottom:3,display:'block' };

const warnSt = { fontSize:10,color:'#e67e00',marginTop:3,lineHeight:1.3 };

const noteSt = { fontSize:10,color:'#888',marginTop:3,lineHeight:1.3,fontStyle:'italic' };

function Field({label,value,onChange,placeholder,suffix,warning,note,disabled}){
  return(<div style={{marginBottom:8,opacity:disabled?0.55:1}}><label style={labelSt}>{label}</label><div style={{position:'relative'}}>
    <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={{...inputSt,background:disabled?'#f5f5f5':'#fff',pointerEvents:disabled?'none':'auto',cursor:disabled?'not-allowed':'text'}}/>
    {suffix&&<span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#999'}}>{suffix}</span>}
  </div>{warning&&<div style={warnSt}>{warning}</div>}{note&&<div style={noteSt}>{note}</div>}</div>);
}
function TextAreaField({label,value,onChange,placeholder}){
  return(<div style={{marginBottom:8}}><label style={labelSt}>{label}</label>
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{...inputSt,resize:'vertical',fontFamily:'inherit'}}/>
  </div>);
}
function Select({label,value,onChange,options}){
  return(<div style={{marginBottom:8}}><label style={labelSt}>{label}</label>
    <select value={value} onChange={e=>onChange(e.target.value)} style={{...inputSt,appearance:'auto'}}>
      {options.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
    </select></div>);
}
function Checkbox({label,checked,onChange}){
  return(<label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:600,color:'#555',margin:'12px 0 8px',cursor:'pointer'}}>
    <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)}/>
    {label}
  </label>);
}
function RateFields({rateType,rates,onChange,amexDirect,existingRates,isExisting}){
  const type = RATE_TYPES.find(t=>t.id===rateType); if(!type) return null;
  return(<div>
    {type.fields.map(f=>{
      const cur = rates[f]||{rate:'',fee:''};
      // AMEX Direct describes the NEW offer's terms — the merchant's existing
      // contract may still have a real AMEX rate on it, so leave that editable.
      const isLockedAmex = f==='amex' && amexDirect && !isExisting;
      if(isLockedAmex){
        return(<div key={f} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
          <Field label={rateLabel(f,amexDirect)+' (ex GST %)'} value="" onChange={()=>{}} placeholder="Merchant direct" suffix="%" disabled/>
          <Field label="Fixed Fee (optional)" value="" onChange={()=>{}} placeholder="N/A" suffix="$" disabled note="AMEX rate removed — merchant will set up their own account"/>
        </div>);
      }
      const rateNum = parseFloat(cur.rate);
      const feeNum = parseFloat(cur.fee);
      let rateWarning=null;
      if(f==='blended' && !cur.rate) rateWarning='Rate required';
      else if(!isNaN(rateNum) && !isExisting && existingRates){
        const exNum = parseFloat(existingRates[f]?.rate);
        if(!isNaN(exNum) && rateNum>exNum) rateWarning='New offer rate is higher than current — is this correct?';
      }
      if(!rateWarning && !isNaN(rateNum) && rateNum>4.5) rateWarning='This rate looks high — double check before sending';
      const feeWarning = (!isNaN(feeNum) && feeNum>1) ? `Fixed fees are usually under $1.00 — did you mean $${(feeNum/100).toFixed(2)}?` : null;
      const label = (f==='amex'&&isExisting) ? RATE_LABELS.amex : rateLabel(f,amexDirect);
      return(<div key={f} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
        <Field label={label+' (ex GST %)'} value={cur.rate} onChange={v=>onChange({...rates,[f]:{...cur,rate:v}})} placeholder="0.00" suffix="%" warning={rateWarning}/>
        <Field label="Fixed Fee (optional)" value={cur.fee} onChange={v=>onChange({...rates,[f]:{...cur,fee:v}})} placeholder="None" suffix="$" warning={feeWarning}/>
      </div>);
    })}
  </div>);
}
function SubsidyFields({data,onChange,brandColor}){
  const set=(k,v)=>onChange({...data,[k]:v});
  const count=parseFloat(data.terminalCount);
  const discPct=parseFloat(data.terminalDiscount)||0;
  let terminalCalc=null;
  if(!isNaN(count)&&count>0){
    const full=count*TERMINAL_MONTHLY_COST;
    const owed=full-full*(discPct/100);
    terminalCalc=`${count} terminal${count===1?'':'s'} × $${TERMINAL_MONTHLY_COST} = ${fmtMoney(full)}/month${discPct?` · ${discPct}% off`:''} · You cover: ${fmtMoney(owed)}/month`;
  }
  return(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
    <Field label="SaaS Discount %" value={data.saasDiscount} onChange={v=>set('saasDiscount',v)} placeholder="0" suffix="%"/>
    <Field label="SaaS Amount ($)" value={data.saasAmount} onChange={v=>set('saasAmount',v)} placeholder="0.00" suffix="$"/>
    <Field label="Advantage+ Discount %" value={data.advantageDiscount} onChange={v=>set('advantageDiscount',v)} placeholder="0" suffix="%"/>
    <Field label="Advantage+ Amount ($)" value={data.advantageAmount} onChange={v=>set('advantageAmount',v)} placeholder="0.00" suffix="$"/>
    <Field label="No. of Terminals" value={data.terminalCount} onChange={v=>set('terminalCount',v)} placeholder="0"/>
    <Field label="Terminal Subsidy %" value={data.terminalDiscount} onChange={v=>set('terminalDiscount',v)} placeholder="0" suffix="%"/>
    {terminalCalc&&<div style={{gridColumn:'1 / -1',fontSize:11,fontStyle:'italic',color:brandColor||'#673AB6',marginTop:-4,marginBottom:8}}>{terminalCalc}</div>}
  </div>);
}

// ─── Preview Card ────────────────────────────────────────────────────────────
function PreviewCard({brand,merchant,existing,options,customerLogo,repName,amexDirect,amexQrDataUrl,expiryDays,customNote,markAsDraft,venueNotes,contractTerm}){
  const b = BRANDS[brand];
  const optCount = options.length;
  const rateTypeObj = id => RATE_TYPES.find(t=>t.id===id);
  const today = new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});
  const validUntil = addDays(expiryDays||14);

  const RowItem = ({label,value,muted})=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'3px 0',borderBottom:`1px solid ${muted?'#eee':b.primary+'15'}`,gap:8}}>
      <span style={{fontSize:9,color:muted?'#aaa':'#555',whiteSpace:'nowrap',flexShrink:0}}>{label}</span>
      <span style={{fontSize:9,fontWeight:700,color:muted?'#999':b.primary,textAlign:'right',flex:'1 1 auto',minWidth:0,wordBreak:'break-word',overflowWrap:'anywhere'}}>{value}</span>
    </div>
  );
  const renderRateSet = (rateTypeId,rates,muted,isExisting)=>{
    const type=rateTypeObj(rateTypeId);if(!type)return null;
    // AMEX Direct only hides/relabels the AMEX row for the NEW offer — the
    // existing contract keeps showing its real current AMEX rate untouched.
    const hideAmex = amexDirect && !isExisting;
    return type.fields.filter(f=>!(f==='amex'&&hideAmex)).map(f=>{
      const cur=rates?.[f]||{};
      const label = (f==='amex'&&isExisting) ? RATE_LABELS.amex : rateLabel(f,amexDirect);
      return <RowItem key={f} label={label} value={fmtRateFee(cur.rate,cur.fee)} muted={muted}/>;
    });
  };
  // Two-line price stack: strikethrough RRP on top (only when a discount is
  // actually set), then what the merchant pays — FREE in green at 100% off,
  // otherwise the calculated price in brand colour. No discount = just the
  // plain amount, no strikethrough.
  const PriceRow = ({label,rrpNum,discPctRaw,muted})=>{
    if(isNaN(rrpNum))return null;
    const discNum=parseFloat(discPctRaw);
    const hasDisc=!isNaN(discNum)&&discNum>0;
    const final=hasDisc?rrpNum-rrpNum*(discNum/100):rrpNum;
    const isFree=hasDisc&&discNum>=100;
    const freeColor=muted?'#8fbfae':'#0F6E56';
    const priceColor=muted?'#999':b.primary;
    return(
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'3px 0',borderBottom:`1px solid ${muted?'#eee':b.primary+'15'}`,gap:8}}>
        <span style={{fontSize:9,color:muted?'#aaa':'#555',whiteSpace:'nowrap',flexShrink:0}}>{label}</span>
        <div style={{textAlign:'right',flex:'1 1 auto',minWidth:0}}>
          {hasDisc&&<div style={{fontSize:8,color:muted?'#ccc':'#bbb',textDecoration:'line-through'}}>{fmtMoney(rrpNum)}/mo</div>}
          <div style={{fontSize:9,fontWeight:700,color:isFree?freeColor:priceColor}}>{isFree?'FREE':`${fmtMoney(final)}/mo`}</div>
        </div>
      </div>
    );
  };
  const renderSubsidy = (opt,muted)=>{
    const items=[];
    if(opt.saasDiscount||opt.saasAmount){items.push(<PriceRow key="saas" label="SaaS" rrpNum={parseFloat(opt.saasAmount)} discPctRaw={opt.saasDiscount} muted={muted}/>);}
    if(opt.advantageDiscount||opt.advantageAmount){items.push(<PriceRow key="adv" label="Advantage+" rrpNum={parseFloat(opt.advantageAmount)} discPctRaw={opt.advantageDiscount} muted={muted}/>);}
    const count=parseFloat(opt.terminalCount);
    if(!isNaN(count)&&count>0){
      items.push(<PriceRow key="term" label={`EFTPOS Terminal ×${count}`} rrpNum={count*TERMINAL_MONTHLY_COST} discPctRaw={opt.terminalDiscount} muted={muted}/>);
    }
    return items;
  };
  const SectionLabel = ({children,muted})=>(<div style={{fontSize:8,fontWeight:700,color:muted?'#bbb':b.primary,textTransform:'uppercase',letterSpacing:1.2,marginTop:8,marginBottom:2,opacity:muted?0.7:0.5}}>{children}</div>);

  return(
    <div id="proposal-output" style={{width:680,background:'#fff',borderRadius:14,overflow:'hidden',fontFamily:'Inter, sans-serif',boxShadow:'0 4px 32px rgba(0,0,0,0.08)',position:'relative'}}>
      {markAsDraft&&(
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:5,overflow:'hidden'}}>
          <div style={{fontSize:80,fontWeight:900,color:b.primary,opacity:0.15,transform:'rotate(-30deg)',letterSpacing:10,whiteSpace:'nowrap'}}>DRAFT</div>
        </div>
      )}
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
            {repName?<div style={{color:'rgba(255,255,255,0.6)',fontSize:7,marginTop:2}}>Prepared by {repName} · {today} · Valid until {validUntil}</div>:<div style={{color:'rgba(255,255,255,0.5)',fontSize:7,marginTop:1}}>{today} · Valid until {validUntil}</div>}
          </div>
        </div>
        {venueNotes&&<div style={{color:'rgba(255,255,255,0.7)',fontSize:8,marginTop:6}}>{merchant.name||'Merchant Name'} · {venueNotes}</div>}
      </div>

      {customNote&&customNote.trim()&&(
        <div style={{margin:'10px 28px 0',padding:'8px 12px',background:b.primary+'10',borderLeft:`3px solid ${b.primary}`,borderRadius:4}}>
          <div style={{fontSize:9,fontStyle:'italic',color:b.primary,opacity:0.85,lineHeight:1.5}}>&ldquo;{customNote}&rdquo;</div>
        </div>
      )}

      {/* Body */}
      <div style={{padding:'12px 28px 10px',display:'grid',gridTemplateColumns:optCount===1?'1fr 1fr':`130px repeat(${optCount}, 1fr)`,gap:14}}>
        <div style={{opacity:0.5,minWidth:0}}>
          <div style={{fontSize:9,fontWeight:800,color:'#999',textTransform:'uppercase',letterSpacing:1,paddingBottom:4,borderBottom:'1.5px solid #ddd',marginBottom:2}}>Current</div>
          <SectionLabel muted>In-Store Rates</SectionLabel>{renderRateSet(existing.rateType,existing.rates,true,true)}
          {existing.hasEcom&&<><SectionLabel muted>E-Commerce Rates</SectionLabel>{renderRateSet(existing.ecomRateType,existing.ecomRates,true,true)}</>}
          <SectionLabel muted>Pricing</SectionLabel>{renderSubsidy(existing,true)}
        </div>
        {options.map((opt,i)=>(
          <div key={i} style={{borderLeft:`2.5px solid ${b.primary}`,paddingLeft:12,minWidth:0}}>
            <div style={{fontSize:10,fontWeight:800,color:b.primary,textTransform:'uppercase',letterSpacing:1,paddingBottom:4,borderBottom:`1.5px solid ${b.primary}25`,marginBottom:2}}>{optCount===1?'New Offer':`Option ${i+1}`}</div>
            <SectionLabel>In-Store Rates</SectionLabel>{renderRateSet(opt.rateType,opt.rates,false)}
            {opt.hasEcom&&<><SectionLabel>E-Commerce Rates</SectionLabel>{renderRateSet(opt.ecomRateType,opt.ecomRates,false)}</>}
            <SectionLabel>Pricing</SectionLabel>{renderSubsidy(opt,false)}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{background:'#f7f7f8',padding:'10px 28px 16px',borderTop:'1px solid #eee'}}>
        <img src={TERMINAL_IMG} alt="" style={{float:'right',width:100,objectFit:'contain',marginLeft:14,marginTop:-4}}/>
        <div style={{fontSize:8,color:b.primary,fontWeight:600,letterSpacing:0.3,opacity:0.6,marginBottom:4}}>All rates and fees shown are exclusive of GST.</div>
        {contractTerm&&(
          <div style={{fontSize:8,color:b.primary,opacity:0.7,marginBottom:4}}>Contract Term: {CONTRACT_TERMS.find(t=>t.id===contractTerm)?.label}</div>
        )}
        {amexDirect&&(
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
            <div style={{fontSize:8,color:'#aaa',lineHeight:1.5,flex:1}}>
              <strong style={{color:b.primary,opacity:0.8}}>AMEX Merchant Facility:</strong> This proposal assumes the Merchant will obtain their own American Express Merchant Account. Upon approval, the account will be configured for acceptance via the supplied Oolio payment terminals. Scan to apply:
            </div>
            {amexQrDataUrl&&(
              <img id="amex-qr-img" src={amexQrDataUrl} alt="Scan to apply for an AMEX Merchant Account" style={{width:24,height:24,flexShrink:0,border:'1px solid #eee',borderRadius:2}}/>
            )}
          </div>
        )}
        <div style={{fontSize:8,color:'#aaa',lineHeight:1.5}}>
          *Terms &amp; Conditions apply. Discounts and rates are applicable based on a minimum monthly card transaction volume of 80% of {fmtDollar(merchant.ttv)}. This proposal is indicative only and subject to formal agreement.{amexDirect?' American Express merchant fees are billed directly by American Express and are not included in the rates outlined in this proposal.':''}
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
  const [amexDirect,setAmexDirect]=useState(false);
  const [amexQrDataUrl,setAmexQrDataUrl]=useState(null);
  const [amexLinkCopied,setAmexLinkCopied]=useState(false);
  const [expiryDays,setExpiryDays]=useState('14');
  const [customNote,setCustomNote]=useState('');
  const [markAsDraft,setMarkAsDraft]=useState(false);
  const [venueNotes,setVenueNotes]=useState('');
  const [contractTerm,setContractTerm]=useState('');
  const [draftSavedVisible,setDraftSavedVisible]=useState(false);
  const [linkCopied,setLinkCopied]=useState(false);
  const [bannerDismissed,setBannerDismissed]=useState(false);
  const [hydrated,setHydrated]=useState(false);
  const [recentProposals,setRecentProposals]=useState([]);
  const [exporting,setExporting]=useState(false);
  const [renderedPng,setRenderedPng]=useState(null);
  const outputRef=useRef(null);
  const firstSaveRef=useRef(true);
  const urlSyncTimerRef=useRef(null);
  const b=BRANDS[brand];

  const collectState=useCallback(()=>({
    brand,merchant,existing,options,repName,amexDirect,
    expiryDays,customNote,markAsDraft,venueNotes,contractTerm,
  }),[brand,merchant,existing,options,repName,amexDirect,expiryDays,customNote,markAsDraft,venueNotes,contractTerm]);

  const applyState=useCallback((s)=>{
    if(!s)return;
    if(s.brand)setBrand(s.brand);
    if(s.merchant)setMerchant(s.merchant);
    if(s.existing)setExisting(s.existing);
    if(s.options)setOptions(s.options);
    if(typeof s.repName==='string')setRepName(s.repName);
    if(typeof s.amexDirect==='boolean')setAmexDirect(s.amexDirect);
    if(s.expiryDays)setExpiryDays(s.expiryDays);
    if(typeof s.customNote==='string')setCustomNote(s.customNote);
    if(typeof s.markAsDraft==='boolean')setMarkAsDraft(s.markAsDraft);
    if(typeof s.venueNotes==='string')setVenueNotes(s.venueNotes);
    if(typeof s.contractTerm==='string')setContractTerm(s.contractTerm);
    if(typeof s.customerLogo==='string'||s.customerLogo===null)setCustomerLogo(s.customerLogo??null);
  },[]);

  // Clearing on toggle-on: a rep flipping this after already entering an AMEX
  // rate on a NEW offer shouldn't leave a stale, now-meaningless value sitting
  // in a disabled field. The existing contract is untouched — AMEX Direct only
  // describes the new offer's terms, not the merchant's current real contract.
  const handleAmexDirectChange=useCallback((checked)=>{
    setAmexDirect(checked);
    if(checked){
      const clearAmex=(rates)=>({...rates,amex:{rate:'',fee:''}});
      setOptions(prev=>prev.map(o=>({...o,rates:clearAmex(o.rates),ecomRates:clearAmex(o.ecomRates)})));
    }
  },[]);

  const handleLogoUpload=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>setCustomerLogo(ev.target.result);reader.readAsDataURL(file);};
  const addOption=()=>{if(options.length<3)setOptions([...options,emptyOption()]);};
  const removeOption=i=>{if(options.length>1)setOptions(options.filter((_,j)=>j!==i));};
  const updateOption=(i,data)=>setOptions(options.map((o,j)=>j===i?data:o));

  // Only pulls known merchant facts (SaaS/Advantage+ amounts, terminal count) —
  // rate type, rates, and every discount % are deliberately left for the rep to
  // set fresh on the new offer rather than assumed from the existing contract.
  const copyFromExisting=(i)=>{
    updateOption(i,{
      ...options[i],
      saasAmount:existing.saasAmount,
      advantageAmount:existing.advantageAmount,
      terminalCount:existing.terminalCount,
    });
  };

  useEffect(()=>{
    if(!amexDirect){setAmexQrDataUrl(null);return;}
    let cancelled=false;
    (async()=>{
      const QRCode=await import('qrcode');
      // Generated well above display size (44px) so it stays crisp once html-to-image
      // re-rasterizes the whole card at pixelRatio 3 for PNG/PDF export.
      const dataUrl=await QRCode.toDataURL(AMEX_APPLY_URL,{margin:1,width:240});
      if(!cancelled)setAmexQrDataUrl(dataUrl);
    })();
    return()=>{cancelled=true;};
  },[amexDirect]);

  const copyAmexLink=useCallback(async()=>{
    try{
      await navigator.clipboard.writeText(AMEX_APPLY_URL);
      setAmexLinkCopied(true);
      setTimeout(()=>setAmexLinkCopied(false),2000);
    }catch(err){console.error('Copy failed:',err);alert('Could not copy link. Check console.');}
  },[]);

  // Restore state on first load: a shared ?d= link takes priority over a locally
  // saved draft, since a rep opening a colleague's link shouldn't clobber it.
  // `hydrated` only flips true once this has run, and every effect below that
  // persists state waits on it — otherwise a stale pre-restore render can write
  // blank state over the very draft we're trying to load (see: React StrictMode
  // double-invoking this effect in dev before the restore's setState commits).
  useEffect(()=>{
    try{
      if(sessionStorage.getItem(BANNER_DISMISS_KEY)==='1')setBannerDismissed(true);
    }catch(err){/* sessionStorage unavailable — ignore */}
    try{
      const params=new URLSearchParams(window.location.search);
      const d=params.get('d');
      if(d){
        applyState(JSON.parse(b64Decode(d)));
        setHydrated(true);
        return;
      }
    }catch(err){console.error('Failed to parse shared link state:',err);}
    try{
      const raw=localStorage.getItem(DRAFT_KEY);
      if(raw)applyState(JSON.parse(raw));
    }catch(err){console.error('Failed to restore saved draft:',err);}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Auto-save the full draft (including the logo) to localStorage on every change.
  useEffect(()=>{
    if(!hydrated)return;
    try{
      localStorage.setItem(DRAFT_KEY,JSON.stringify({...collectState(),customerLogo}));
    }catch(err){console.error('Failed to save draft:',err);}
    if(firstSaveRef.current){
      firstSaveRef.current=false;
      return;
    }
    setDraftSavedVisible(true);
    const t=setTimeout(()=>setDraftSavedVisible(false),2000);
    return()=>clearTimeout(t);
  },[hydrated,collectState,customerLogo]);

  // Mirror state into the URL (debounced, logo excluded — it would make the link
  // impractically long) so the "Copy Link" button always has something fresh to share.
  useEffect(()=>{
    if(!hydrated)return;
    if(urlSyncTimerRef.current)clearTimeout(urlSyncTimerRef.current);
    urlSyncTimerRef.current=setTimeout(()=>{
      try{
        const encoded=b64Encode(JSON.stringify(collectState()));
        const url=new URL(window.location.href);
        url.searchParams.set('d',encoded);
        window.history.replaceState(null,'',url.toString());
      }catch(err){console.error('Failed to sync state to URL:',err);}
    },1000);
    return()=>clearTimeout(urlSyncTimerRef.current);
  },[hydrated,collectState]);

  const copyLink=useCallback(async()=>{
    try{
      const encoded=b64Encode(JSON.stringify(collectState()));
      const url=new URL(window.location.href);
      url.searchParams.set('d',encoded);
      window.history.replaceState(null,'',url.toString());
      await navigator.clipboard.writeText(url.toString());
      setLinkCopied(true);
      setTimeout(()=>setLinkCopied(false),2000);
    }catch(err){console.error('Copy link failed:',err);alert('Could not copy link. Check console.');}
  },[collectState]);

  const clearDraft=useCallback(()=>{
    if(!window.confirm('Start a new proposal? This will clear the current draft.'))return;
    try{
      localStorage.removeItem(DRAFT_KEY);
      const url=new URL(window.location.href);
      url.searchParams.delete('d');
      window.history.replaceState(null,'',url.toString());
    }catch(err){console.error('Failed to clear draft:',err);}
    setBrand('oolio');setMerchant({name:'',ttv:''});setCustomerLogo(null);
    setExisting(emptyExisting());setOptions([emptyOption()]);setRepName('');
    setAmexDirect(false);setExpiryDays('14');setCustomNote('');setMarkAsDraft(false);setVenueNotes('');setContractTerm('');
  },[]);

  const dismissBanner=useCallback(()=>{
    setBannerDismissed(true);
    try{sessionStorage.setItem(BANNER_DISMISS_KEY,'1');}catch(err){/* ignore */}
  },[]);

  // Snapshot the full form state on every export so a rep can pull a past
  // proposal back up later without re-entering everything from scratch.
  const saveRecentProposal=useCallback(()=>{
    try{
      const snapshot={
        id:Date.now()+'-'+Math.random().toString(36).slice(2),
        merchantName:merchant.name||'Untitled',
        brand,
        date:new Date().toISOString(),
        state:{...collectState(),customerLogo},
      };
      setRecentProposals(prev=>{
        const next=[snapshot,...prev].slice(0,MAX_RECENT);
        try{localStorage.setItem(RECENT_KEY,JSON.stringify(next));}catch(err){console.error('Failed to save recent proposals:',err);}
        return next;
      });
    }catch(err){console.error('Failed to snapshot recent proposal:',err);}
  },[merchant.name,brand,collectState,customerLogo]);

  const restoreRecent=useCallback((id)=>{
    const item=recentProposals.find(r=>r.id===id);
    if(item)applyState(item.state);
  },[recentProposals,applyState]);

  const removeRecent=useCallback((id)=>{
    setRecentProposals(prev=>{
      const next=prev.filter(r=>r.id!==id);
      try{localStorage.setItem(RECENT_KEY,JSON.stringify(next));}catch(err){console.error('Failed to update recent proposals:',err);}
      return next;
    });
  },[]);

  useEffect(()=>{
    try{
      const raw=localStorage.getItem(RECENT_KEY);
      if(raw)setRecentProposals(JSON.parse(raw));
    }catch(err){console.error('Failed to load recent proposals:',err);}
  },[]);

  const doExport=useCallback(async(format)=>{
    setExporting(true);
    try{
      const el=document.getElementById('proposal-output');if(!el)return;
      const{toPng}=await import('html-to-image');
      const dataUrl=await toPng(el,{pixelRatio:3,cacheBust:true,style:{transform:'scale(1)',transformOrigin:'top left'}});
      saveRecentProposal();
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
        // Overlay a real clickable link on top of the flattened QR code image —
        // a PNG/copy-image is just pixels and can never carry a link, but the PDF can.
        const qrImg=document.getElementById('amex-qr-img');
        if(qrImg){
          const pxToMm=0.264583;
          const containerRect=el.getBoundingClientRect();
          const qrRect=qrImg.getBoundingClientRect();
          doc.link(
            (qrRect.left-containerRect.left)*pxToMm,
            (qrRect.top-containerRect.top)*pxToMm,
            qrRect.width*pxToMm,
            qrRect.height*pxToMm,
            {url:AMEX_APPLY_URL}
          );
        }
        doc.save(`${merchant.name||'proposal'}_${b.name}_pay_proposal.pdf`);
      }
    }catch(err){console.error('Export failed:',err);alert('Export failed. Check console.');}
    finally{setExporting(false);}
  },[merchant.name,b.name,saveRecentProposal]);

  const sectionTitle=br=>({fontSize:13,fontWeight:700,color:br.primary,textTransform:'uppercase',letterSpacing:1,marginBottom:10,paddingBottom:6,borderBottom:`2px solid ${br.primary}20`});

  return(
    <div style={{minHeight:'100vh',background:'#f4f4f6',fontFamily:'Inter, sans-serif'}}>
      {/* Top Bar */}
      <div style={{background:b.gradient,padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 2px 12px rgba(0,0,0,0.15)'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <OolioPayLogo size={24} fill="#fff"/>
          <span style={{color:'#fff',fontSize:15,fontWeight:700,letterSpacing:0.5}}>Oolio Pay | RBA Recontracting Proposal Generator</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{color:'#fff',fontSize:10,opacity:draftSavedVisible?0.7:0,transition:'opacity 0.4s'}}>Draft saved</span>
          <button onClick={clearDraft} style={{padding:'6px 14px',borderRadius:20,border:'2px solid rgba(255,255,255,0.3)',background:'transparent',color:'#fff',fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
            Clear / Start New
          </button>
          <div style={{display:'flex',gap:8}}>
            {['oolio','ordermate'].map(bk=>(
              <button key={bk} onClick={()=>setBrand(bk)} style={{padding:'6px 16px',borderRadius:20,border:brand===bk?'2px solid #fff':'2px solid rgba(255,255,255,0.3)',background:brand===bk?'rgba(255,255,255,0.2)':'transparent',color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                {BRANDS[bk].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{display:'flex',gap:24,padding:24,maxWidth:1400,margin:'0 auto'}}>
        {/* Left Panel */}
        <div style={{width:360,flexShrink:0}}>
          {recentProposals.length>0&&(
            <div style={{background:'#fff',borderRadius:12,padding:18,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
              <div style={sectionTitle(b)}>Recent Proposals ({recentProposals.length})</div>
              {recentProposals.map(r=>(
                <div key={r.id} onClick={()=>restoreRecent(r.id)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:6,cursor:'pointer',fontSize:12,color:'#555',background:'#f7f7f8',marginBottom:6}}>
                  <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.merchantName} · {BRANDS[r.brand]?.name||r.brand} · {new Date(r.date).toLocaleDateString('en-AU',{day:'numeric',month:'short'})}</span>
                  <button onClick={e=>{e.stopPropagation();removeRecent(r.id);}} style={{flexShrink:0,background:'none',border:'none',color:'#c00',cursor:'pointer',fontSize:14,fontWeight:700,lineHeight:1,padding:'0 2px'}}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{background:'#fff',borderRadius:12,padding:18,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
            <div style={sectionTitle(b)}>Merchant Info</div>
            <Field label="Merchant / Venue Name" value={merchant.name} onChange={v=>setMerchant({...merchant,name:v})} placeholder="e.g. The Local Pub"/>
            <Field label="Monthly TTV ($)" value={merchant.ttv} onChange={v=>setMerchant({...merchant,ttv:v})} placeholder="300000" suffix="$" warning={!merchant.ttv?'TTV required for T&Cs':null}/>
            <Field label="Venues (optional)" value={venueNotes} onChange={setVenueNotes} placeholder="e.g. 3 venues — Sydney CBD, Parramatta, Bondi"/>
            <Field label="Prepared By" value={repName} onChange={setRepName} placeholder="e.g. Olivia Mayes"/>
            <Select label="Proposal Valid For" value={expiryDays} onChange={setExpiryDays} options={EXPIRY_OPTIONS}/>
            <Select label="Contract Term" value={contractTerm} onChange={setContractTerm} options={CONTRACT_TERMS}/>
            <TextAreaField label="Personal Note (optional)" value={customNote} onChange={setCustomNote} placeholder="e.g. Great speaking with you today, Sarah — as discussed..."/>
            <div style={{marginBottom:8}}><label style={labelSt}>Customer Logo (optional)</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{fontSize:12}}/>
              <div style={{fontSize:10,color:'#999',marginTop:4}}>For best results, use a logo with a transparent background (PNG).</div>
              {customerLogo&&<button onClick={()=>setCustomerLogo(null)} style={{fontSize:11,color:b.primary,background:'none',border:'none',cursor:'pointer',marginTop:4}}>Remove logo</button>}
            </div>
            <Checkbox label="Mark as Draft" checked={markAsDraft} onChange={setMarkAsDraft}/>
          </div>

          <div style={{background:'#fff',borderRadius:12,padding:18,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
            <div style={sectionTitle(b)}>Proposal Options</div>
            <Checkbox label="AMEX Direct (merchant sets up own account)" checked={amexDirect} onChange={handleAmexDirectChange}/>
          </div>

          <div style={{background:'#fff',borderRadius:12,padding:18,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
            <div style={sectionTitle(b)}>Existing Contract</div>
            <Select label="In-Store Rate Type" value={existing.rateType} onChange={v=>setExisting({...existing,rateType:v})} options={RATE_TYPES}/>
            <RateFields rateType={existing.rateType} rates={existing.rates} onChange={r=>setExisting({...existing,rates:r})} amexDirect={amexDirect} isExisting/>
            <Checkbox label="Add E-Commerce Rates" checked={existing.hasEcom} onChange={v=>setExisting({...existing,hasEcom:v})}/>
            {existing.hasEcom&&(<>
              <Select label="E-Commerce Rate Type" value={existing.ecomRateType} onChange={v=>setExisting({...existing,ecomRateType:v})} options={RATE_TYPES}/>
              <RateFields rateType={existing.ecomRateType} rates={existing.ecomRates} onChange={r=>setExisting({...existing,ecomRates:r})} amexDirect={amexDirect} isExisting/>
            </>)}
            <div style={{marginTop:8}}><SubsidyFields data={existing} onChange={setExisting} brandColor={b.primary}/></div>
          </div>

          {options.map((opt,i)=>(
            <div key={i} style={{background:'#fff',borderRadius:12,padding:18,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,0.06)',borderLeft:`4px solid ${b.primary}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',...sectionTitle(b)}}>
                <span>{options.length===1?'New Offer':`New Option ${i+1}`}</span>
                {options.length>1&&<button onClick={()=>removeOption(i)} style={{fontSize:11,color:'#c00',background:'none',border:'none',cursor:'pointer'}}>Remove</button>}
              </div>
              <button onClick={()=>copyFromExisting(i)} style={{width:'100%',fontSize:11,color:b.primary,background:'none',border:`1px dashed ${b.primary}`,borderRadius:6,padding:'6px 10px',cursor:'pointer',fontFamily:'inherit',marginBottom:10}}>
                Copy existing SaaS, Adv+ & terminals →
              </button>
              <Select label="In-Store Rate Type" value={opt.rateType} onChange={v=>updateOption(i,{...opt,rateType:v})} options={RATE_TYPES}/>
              <RateFields rateType={opt.rateType} rates={opt.rates} onChange={r=>updateOption(i,{...opt,rates:r})} amexDirect={amexDirect} existingRates={existing.rates}/>
              <Checkbox label="Add E-Commerce Rates" checked={opt.hasEcom} onChange={v=>updateOption(i,{...opt,hasEcom:v})}/>
              {opt.hasEcom&&(<>
                <Select label="E-Commerce Rate Type" value={opt.ecomRateType} onChange={v=>updateOption(i,{...opt,ecomRateType:v})} options={RATE_TYPES}/>
                <RateFields rateType={opt.ecomRateType} rates={opt.ecomRates} onChange={r=>updateOption(i,{...opt,ecomRates:r})} amexDirect={amexDirect} existingRates={existing.ecomRates}/>
              </>)}
              <div style={{marginTop:8}}><SubsidyFields data={opt} onChange={d=>updateOption(i,d)} brandColor={b.primary}/></div>
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
              {amexDirect&&(
                <button onClick={copyAmexLink} style={{padding:'7px 14px',borderRadius:8,border:`1.5px solid ${b.primary}40`,background:'#fff',color:b.primary,fontWeight:600,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                  {amexLinkCopied?'✓ Copied':'🔗 Copy AMEX Link'}
                </button>
              )}
              <button onClick={copyLink} style={{padding:'7px 14px',borderRadius:8,border:`1.5px solid ${b.primary}40`,background:'#fff',color:b.primary,fontWeight:600,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                {linkCopied?'✓ Link copied!':'🔗 Copy Link'}
              </button>
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
          {!bannerDismissed&&(
            <div style={{display:'flex',alignItems:'center',gap:10,background:b.primary+'0d',borderLeft:`3px solid ${b.primary}`,borderRadius:8,padding:'8px 14px',marginBottom:12,fontSize:11,color:b.primary}}>
              <div style={{flex:1}}>📥 <strong>When you're ready to share</strong>, use Download PNG or PDF above — the live preview cannot be shared directly.</div>
              <button onClick={dismissBanner} style={{background:'none',border:'none',cursor:'pointer',color:b.primary,fontSize:14,fontWeight:700,lineHeight:1,padding:0}}>×</button>
            </div>
          )}
          <div style={{display:'inline-block'}} ref={outputRef}>
            <PreviewCard brand={brand} merchant={merchant} existing={existing} options={options} customerLogo={customerLogo} repName={repName} amexDirect={amexDirect} amexQrDataUrl={amexQrDataUrl} expiryDays={expiryDays} customNote={customNote} markAsDraft={markAsDraft} venueNotes={venueNotes} contractTerm={contractTerm}/>
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
