// ════════════════════════════════════════════════════════════════
// AUTH — Google OAuth gate. Only @rocket.in.th may enter.
// Loads after config.js (needs SUPA) and the supabase-js CDN.
// ════════════════════════════════════════════════════════════════
const ALLOWED_DOMAIN = '@rocket.in.th';

// Reuse the project URL + publishable key already defined in config.js.
// SUPA.url ends with "/rest/v1" → strip it to get the project base URL.
const sbAuth = window.supabase.createClient(
  SUPA.url.replace(/\/rest\/v1\/?$/,''),
  SUPA.h.apikey,
  { auth:{ flowType:'pkce', detectSessionInUrl:true, persistSession:true, autoRefreshToken:true } }
);

// REST calls in api.js/upload.js read SUPA.h. Swap the Authorization header from
// the anon key to the logged-in user's JWT, so PostgREST evaluates RLS as that
// authenticated user (and can see their verified email claim).
function applyAuthToken(session){
  if(session && session.access_token) SUPA.h['Authorization'] = 'Bearer ' + session.access_token;
}
sbAuth.auth.onAuthStateChange((_event, session)=>{ if(session) applyAuthToken(session); });

async function loginWithGoogle(){
  const btn=document.getElementById('googleLoginBtn');
  if(btn){ btn.disabled=true; }
  const { error } = await sbAuth.auth.signInWithOAuth({
    provider:'google',
    options:{
      redirectTo: location.origin + location.pathname,
      // hd = hint to Google's account picker (NOT security — trigger+RLS enforce it)
      queryParams:{ hd:'rocket.in.th', prompt:'select_account' }
    }
  });
  if(error){ if(btn) btn.disabled=false; showDenied('เปิดหน้า Google ไม่สำเร็จ: '+error.message); }
}

async function logout(){
  try{ await sbAuth.auth.signOut(); }catch(e){}
  // clear cached data from this browser on the way out
  ['ld_contacts','ld_point','ld_redemp','ld_computed'].forEach(k=>localStorage.removeItem(k));
  location.replace(location.pathname);
}

// The gate: returns a valid @rocket.in.th session, or null (and shows the
// correct screen). Called once from app.js before the dashboard boots.
async function guardSession(){
  const q=new URLSearchParams(location.search);
  const hs=new URLSearchParams(location.hash.replace(/^#/,''));
  const oauthErr=q.get('error_description')||hs.get('error_description')||q.get('error')||hs.get('error');

  let session=null;
  try{ session=(await sbAuth.auth.getSession()).data.session; }catch(e){}

  // tidy the address bar after the OAuth redirect is processed
  if(location.search.includes('code=')||location.hash.includes('access_token')||oauthErr){
    history.replaceState(null,'',location.pathname);
  }

  if(!session){
    if(oauthErr) showDenied('เข้าสู่ระบบไม่สำเร็จ — บัญชีนี้ไม่ได้รับอนุญาตให้ใช้งานระบบ');
    else showLogin();
    return null;
  }

  const email=((session.user && session.user.email) || '').toLowerCase();
  if(!email.endsWith(ALLOWED_DOMAIN)){
    await sbAuth.auth.signOut();
    showDenied('บัญชี '+email+' ไม่มีสิทธิ์ — อนุญาตเฉพาะอีเมล @rocket.in.th เท่านั้น');
    return null;
  }

  applyAuthToken(session);
  showApp(email);
  return session;
}

// ── Gate UI ──
function gateState(which){ // 'checking' | 'login' | 'denied' | 'app'
  const gate=document.getElementById('authGate');
  ['authChecking','authLoginBox','authDeniedBox'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
  if(which==='app'){ if(gate) gate.style.display='none'; document.body.classList.remove('locked'); return; }
  if(gate) gate.style.display='flex';
  document.body.classList.add('locked');
  const map={checking:'authChecking',login:'authLoginBox',denied:'authDeniedBox'};
  const el=document.getElementById(map[which]); if(el) el.style.display='block';
  if(typeof refreshIcons==='function') refreshIcons();
}
function showLogin(){ gateState('login'); }
function showDenied(msg){ const m=document.getElementById('authDeniedMsg'); if(m) m.textContent=msg||''; gateState('denied'); }
function showApp(email){
  gateState('app');
  const chip=document.getElementById('authUserChip');
  if(chip){ chip.style.display='inline-flex'; const e=document.getElementById('authUserEmail'); if(e) e.textContent=email; }
}
