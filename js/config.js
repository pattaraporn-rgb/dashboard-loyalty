// ════════════════════════════════════════════════════════════════
// CONSTANTS & STATE — global, accessible across all script files
// ════════════════════════════════════════════════════════════════
const PRESETS=['#004EE6','#E63946','#2D9CDB','#219653','#F2994A','#9B51E0','#1A1A2E','#EB5757'];
const CHART_COLORS={
  TikTok:'#1A1A1A', Shopee:'#ED7D31', Lazada:'#4472C4',
  'Loyalty Manual':'#7030A0','Upload Receipt':'#70AD47',
  'Welcome Point':'#C8102E','Invite Friend Collect':'#2AA198',
  'Inviter Friend Collect':'#2AA198', Import:'#8E6DAF',
  'Import Client':'#8E6DAF', Survey:'#A5A5A5'
};
const CH_KEYS=['TikTok','Shopee','Lazada','Loyalty Manual','Upload Receipt'];
const SC_KEYS=['TikTok','Shopee','Lazada','Loyalty Manual','Upload Receipt','Welcome Point','Invite Friend Collect','Inviter Friend Collect','Import','Import Client','Survey'];
const ML={
  '2025-01':'Jan 2025','2025-02':'Feb 2025','2025-03':'Mar 2025','2025-04':'Apr 2025',
  '2025-05':'May 2025','2025-06':'Jun 2025','2025-07':'Jul 2025','2025-08':'Aug 2025',
  '2025-09':'Sep 2025','2025-10':'Oct 2025','2025-11':'Nov 2025','2025-12':'Dec 2025',
  '2026-01':'Jan 2026','2026-02':'Feb 2026','2026-03':'Mar 2026','2026-04':'Apr 2026',
  '2026-05':'May 2026','2026-06':'Jun 2026','2026-07':'Jul 2026','2026-08':'Aug 2026',
  '2026-09':'Sep 2026','2026-10':'Oct 2026','2026-11':'Nov 2026','2026-12':'Dec 2026',
  '2027-01':'Jan 2027','2027-02':'Feb 2027','2027-03':'Mar 2027','2027-04':'Apr 2027'
};

// QA validators: sources that legitimately have GIVEN points with zero sale
const QA_BONUS_SOURCES=['welcome point','invite friend','inviter friend','survey','import client','import'];

// Supabase API config + schema mappings
const SUPA={
  url:'https://uakqwhlpniidbxtwfzva.supabase.co/rest/v1',
  h:{'Content-Type':'application/json',
     'apikey':'sb_publishable_XA3J07paGDDi76ar8EaQ1w_rXHIvASB',
     'Authorization':'Bearer sb_publishable_XA3J07paGDDi76ar8EaQ1w_rXHIvASB'}
};
const SUPA_TABLE={'contacts':'contacts','Point Report':'point_report','Redemptions':'redemptions'};
const SUPA_COLS={
  contacts:['Name','Status','Register Date','Last Activity Date','Last Login','Phone No','Gender','Tier','Points balance','Line User ID'],
  point_report:['Date & time','Member name','Member tel','Point type','Points collected','Sale amount (THB)','Source','Channel','Sub channel'],
  redemptions:['Date & time','Reward name','Reward code','Points used','Member name','Member tel']
};
const SUPA_DATE_COLS=new Set(['Register Date','Last Activity Date','Last Login','Date & time']);
// Excel column names may differ from Supabase column names — list alternatives here
const SUPA_ALIASES={
  'Phone No':    ['phone no','tel','telephone','phone','mobile'],
  'Line User ID':['line user id','line user','lineuserid','line id'],
};

// ── Global mutable state ──
let D = null;                                      // computed dashboard data
let fileInfo = [{},{},{}];                         // file metadata per slot
let chartInstances = {};                           // track chart instances for cleanup
const rendered = [false,false,false,false,false,false];
let qaStore = [null,null,null];                    // data quality results per slot
let inactiveData = null;                           // in-memory only — computed from raw contacts on upload, not persisted
const qaExpanded=[false,false,false];              // QA section expanded state per slot
