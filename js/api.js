// ════════════════════════════════════════════════════════════════
// API — Supabase sync (fetch all, backup, clear) + CRUD modals
// ════════════════════════════════════════════════════════════════

// ── Pull all rows from one Supabase table (paginated) ──
async function supaFetchAll(table){
  const rows=[], PAGE=1000; let from=0;
  while(true){
    const res=await fetch(`${SUPA.url}/${table}?select=*&order=id&limit=${PAGE}&offset=${from}`,{headers:SUPA.h});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const batch=await res.json();
    rows.push(...batch);
    if(batch.length<PAGE) break;
    from+=PAGE;
  }
  return rows;
}

async function syncFromApi(){
  addLog('info','กำลัง sync จาก Supabase...');
  try{
    const [contacts,pointReport,redemptions]=await Promise.all([
      supaFetchAll('contacts'),
      supaFetchAll('point_report'),
      supaFetchAll('redemptions')
    ]);
    const ts=new Date().toLocaleString('th-TH');
    if(contacts.length){
      inactiveData = computeInactiveData(contacts);
      storeContacts(contacts,{name:'Supabase Sync',rows:contacts.length,uploadDate:ts});
      fileInfo[0]={name:'Supabase Sync',rows:contacts.length,uploadDate:ts};
      addLog('ok',`Contacts: ${contacts.length.toLocaleString()} แถว`);
    }
    if(pointReport.length){
      storePointReport(pointReport,{name:'Supabase Sync',rows:pointReport.length,uploadDate:ts});
      fileInfo[1]={name:'Supabase Sync',rows:pointReport.length,uploadDate:ts};
      addLog('ok',`Point Report: ${pointReport.length.toLocaleString()} แถว`);
    }
    if(redemptions.length){
      storeRedemptions(redemptions,{name:'Supabase Sync',rows:redemptions.length,uploadDate:ts});
      fileInfo[2]={name:'Supabase Sync',rows:redemptions.length,uploadDate:ts};
      addLog('ok',`Redemptions: ${redemptions.length.toLocaleString()} แถว`);
    }
    if(!contacts.length&&!pointReport.length&&!redemptions.length){
      addLog('info','Supabase ยังไม่มีข้อมูล — อัปโหลด Excel เพื่อ backup ครั้งแรก');
      return;
    }
    recomputeAndRender();
    addLog('ok','Sync สำเร็จ — Dashboard อัปเดตแล้ว');
  }catch(err){
    addLog('err','Sync ไม่สำเร็จ: '+err.message);
  }
}

function addLog(type, msg){
  const log=document.getElementById('syncLog');
  const ts=new Date().toLocaleTimeString('th-TH');
  log.innerHTML+=`<div class="log-${type}">[${ts}] ${msg}</div>`;
  log.scrollTop=log.scrollHeight;
}

// ════════════════════════════════════════════════════════════════
// SUPABASE BACKUP & CLEAR — bulk operations
// ════════════════════════════════════════════════════════════════
function supaDateStr(v){
  const d=parseDate(v);
  if(!d) return v;
  return toLocalISODate(d); // "YYYY-MM-DD" using local timezone (avoids UTC shift to previous day)
}

async function backupToSheet(slot, rows){
  const TABLE_NAMES=['contacts','point_report','redemptions'];
  const table=TABLE_NAMES[slot];
  const cols=SUPA_COLS[table];
  // Keep only schema columns; all rows must have identical keys (PGRST102 requires uniform keys in batch insert)
  const clean=rows.map(r=>{const o={};cols.forEach(c=>{const keys=SUPA_ALIASES[c]||[c];const v=findVal(r,keys);o[c]=(v!==''&&v!=null)?(SUPA_DATE_COLS.has(c)?supaDateStr(v):v):null;});return o;});
  addLog('info',`Backup ${clean.length.toLocaleString()} แถว → Supabase "${table}"...`);
  try{
    await fetch(`${SUPA.url}/${table}?id=gte.0`,{method:'DELETE',headers:SUPA.h});
    const CHUNK=500;
    for(let i=0;i<clean.length;i+=CHUNK){
      const res=await fetch(`${SUPA.url}/${table}`,{
        method:'POST',headers:{...SUPA.h,'Prefer':'return=minimal'},
        body:JSON.stringify(clean.slice(i,i+CHUNK))
      });
      if(!res.ok){const t=await res.text();throw new Error(`HTTP ${res.status}: ${t}`);}
    }
    addLog('ok',`Backup สำเร็จ ${clean.length.toLocaleString()} แถว → Supabase`);
  }catch(err){
    addLog('warn',`Backup ไม่สำเร็จ: ${err.message}`);
  }
}

async function clearSheets(){
  addLog('info','กำลังล้างข้อมูลใน Supabase...');
  try{
    await Promise.all([
      fetch(`${SUPA.url}/contacts?id=gte.0`,{method:'DELETE',headers:SUPA.h}),
      fetch(`${SUPA.url}/point_report?id=gte.0`,{method:'DELETE',headers:SUPA.h}),
      fetch(`${SUPA.url}/redemptions?id=gte.0`,{method:'DELETE',headers:SUPA.h})
    ]);
    addLog('ok','ล้างข้อมูลใน Supabase ทั้งหมดแล้ว');
  }catch(err){
    addLog('warn',`ล้างไม่สำเร็จ: ${err.message}`);
  }
}
