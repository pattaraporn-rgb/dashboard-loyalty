 ## ระบบทำอะไร
    8
    9 Dashboard สำหรับวิเคราะห์ข้Loyalty CRM ทำงานทั้งหมดในเบราว์เซไม่ต้องserver อัปโหลดExcel 3 ไฟล์แล้วดูได้มีย
       4 หน้ารายงานหลัก
   10
   11 | รายงาน | ข้อมูลที|ใสิ่งที่แ|ดง
   12 |--------|------------|------------|
   13 | สมาชิกใหม| contacts.xlsx | จำนวน ACTIVE จัดกลุ่มรายเด|อน
   14 | Sales Report | Point Report.xlsx | ยอดขายแยกช่องทาง(TikTok / Shopee / Lazada / Manual) |
   15 | Points Report | Point Report.xlsx | คะแนนแจก แยก 2 มุมมอง:ตามช่องทางและตามแหล่งที่มาทั้|หมด
   16 | Redemption | ทั้2 ไฟล์| จำนวนแลก + เปรียบเทียGive vs Used Points |
   17
   18 ---
   19
   20 ## ทำได้✅
   21
   22 - อ่านExcel ในเบราว์เซอร์ล้ไม่ต้องส่งไฟล์ไปที่ใด
   23 - ตรวจสอบคุณภาพข้อมูลอัตโ(ซ้ำ/ วันที่/ิยอดขายเป็น0)
   24 - วิเคราะห์สมาชิกที่ไม่ได้ใช้งา3นเดือนา
   25 - Export รายชื่อสมาชิกactive เป็นCSV
   26 - Sync สองทางกับGoogle Sheets ผ่านApps Script
   27 - เพิ่ม/ลบข้อมูลตรงDashboard ไปยังGoogle Sheets
   28 - Export Dashboard เป็นไฟลHTML snapshot พร้อมchart ทำงานได้
   29 - ปรับส/ โลโก้/ ชื่อร้านได้
   30
   31 ---
   32
   33 ## ทำไม่ได❌
   34
   35 - ไม่มีระบlogin หรือควบคุมสิ—ธใครเปิดไฟล์ได้ก็ดูข้อมูลได้
   36 - เปลี่ยนเครื่องหรืcache = ข้อมูลหา(ต้องใชGoogle Sync จึงจะถาวร)
   37 - ไม่มdate range filter — ดูได้แค่ข้อมูลทั้งหมด
   38 - คลิกchart เพื่drill-down ดูรายละเอียดไม่ได้
   39 - ไม่เห็นพฤติกรรมรายบุดูได้แค่ภาพรวม
   40 - ไม่รองรับข้อมูลเมษายน 2570 (ป้ายชื่อเดือนจะแสดงผิด)
   41
   42 ---
   43
   44 ## Bug ทั้งหมด
   45
   46 ### 🔴 Critical — ต้องแก้ก่อนใช้งานจริง
   47
   48 #### [C1] ปุ่Export รายชื่Inactive พังหลัrefresh หน้า
   49
   50 - **อาการ:** กด Export แล้วไม่มีอะไรเกิไม่มerror แจ้ง
   51 - **สาเหตุ:**ฟังก์ช`exportInactiveMembers` (line 1566) อ่านตัวแป`inactiveData` ซึ่งเป็นข้in-memory — หลัง
       refresh จะกลายเป็นnull ทันททั้งที่ข้อมูลจริงม`D.s1.inactive` ที่โหลดจาlocalStorage สำเร็จแล้ว
   52 - **ผลกระทบ:** User เห็นตัวเลขสมาชinactive ในหน้าdashboard แต่คลิExport ไม่ได้ทุกครrefresh
   53 - **แนวทางแก้:**เปลี่ย`const ia = inactiveData` เป็น`const ia = inactiveData || (D && D.s1 && D.s1.inact
      ive)`
   54
   55 ---
   56
   57 #### [C2] ข้อมูลชื่อและเบอร์โทรลูกค้าถlocalStorage โดยไม่บอก
   58
   59 - **อาการ:** ระบบอ้างว่"ข้อมูลไม่ถูกส่งออกไปแต่ชื+อเบอร์โทรของสมาชิinactive ทั้งหมดถserialize ลงใน `ld_c
      omputed` ใน localStorage
   60 - **สาเหตุ:**`inactiveData` (ซึ่ง`{name, phone, ...}`) ถูกผนวกเข้าไปใobject `D` แล้วเซฟลงlocalStorage (l
      ine 1353) — comment ในโค้ดline 775 และ 955 บอกว่า"in-memory only" แต่เป็นเท็จ
   61 - **ผลกระทบ:** ข้อมูลส่วนบุคคลลูกค้browser ของทุกคนที่เdashboard ขัดกัPDPA และสิ่งUI่บอกผู้ใช้
   62 - **แนวทางแก้:**ก่อนserialize D ให้strip `D.s1.inactive.blank` และ `.overdue` ออก (เก็บแคcounts) พร้อมอัปเ
      ดต comment ให้ตรงความจริง
   63
   64 ---
   65
   66 #### [C3] การเพิ่มสมาช(CRUD) ส่งชื่อและเบอร์โทรURLน
   67
   68 - **อาการ:** เมื่อก"เพิ่มสมาชิข้อมูลเช`{"Name":"สมชาย","Phone No":"0812345678"}` จะถูกฝังใURL query stri
      ng แล้วส่งด้GET request
   69 - **สาเหตุ:**`writeToSheet` (line 1812) ต่อdata เป็น`?data=JSON` ใน URL แทนที่จะส่งrequest body
   70 - **ผลกระทบ:** ชื่อและเบอร์โทรลูกค้าถูกบันbrowser history, proxy log, และ Apps Script execution log อัตโน
      มัต— ข้อมูลรั่วโดยไม่ตั้งใจ
   71 - **แนวทางแก้:**เปลี่ยinsert/delete เป็นPOST พร้อมJSON body — Apps Script ฝั่`doPost` มีอยู่แแค่เพิbranc
      h `batch_insert`
   72
   73 ---
   74
   75 ### 🟠 Major — ทำให้feature ทำงานไม่ครบหรือผลลัพธ์ผิด
   76
   77 #### [M1] Sync จาก Google Sheets ทำให้ข้อมInactive หายไป
   78
   79 - **อาการ:** หลังSync จาก Google Sheets แถบ "สมาชิกที่ไม่ได้ใชแสดงข้อความ"อัปโหลดไฟล์อีกครั้งเพื่อทั้งที่ข้
      อมูลสมาชิsync มาแล้ว
   80 - **สาเหตุ:**`syncFromApi` เรียก`storeContacts` แต่ไม่เรี`computeInactiveData` ทำให้ตัวแป`inactiveData`
      ยังเป็null
   81 - **แนวทางแก้:**เพิ่`if(json.contacts) inactiveData = computeInactiveData(json.contacts);` ก่อน`recomput
      eAndRender()`
   82
   83 ---
   84
   85 #### [M2] Export CSV ของ Inactive มีคอลัม"Status" ว่างเสมอ
   86
   87 - **อาการ:** ดาวน์โหลดCSV แล้วคอลัมStatus ว่างทุกแถว
   88 - **สาเหตุ:**object ที่สร้าง`computeInactiveData` (line 991) ไม่มfield ชื่`status` แต่โค้export (line 15
      71) เรียก`m.status` — ได้`undefined` ทุกครั้ง
   89 - **แนวทางแก้:**เพิ่`status` ใน entry object ตอน build ใน `computeInactiveData`
   90
   91 ---
   92
   93 #### [M3] ปุ่มคัดลApps Script Code พังในFirefox
   94
   95 - **อาการ:** กดแล้วไม่มีอะไรเกิหรือconsole error
   96 - **สาเหตุ:**โค้ด(line 2041) อ่าน`event.target` ซึ่งเปglobal object ทีFirefox ไม่รองรับ
   97 - **แนวทางแก้:**เปลี่ยนเป`onclick="copyGasCode(event)"` และรับ`function copyGasCode(e)` แล้วใช`e.target`
   98
   99 ---
  100
  101 #### [M4] สมาชิกACTIVE ที่ไม่มีวันสมัครถูกตัดออกโดยไม่แจ้ง
  102
  103 - **อาการ:** ตัวเลขสมาชิกรวมใKPI น้อยกว่าความจรโดยไม่มwarning
  104 - **สาเหตุ:**`storeContacts` (line 1006) กรองแถวทีparse วันที่ไม่ได้ออกอย่างด้วย`.filter(r => r.regDate)
      ` — ระบบ Data Quality Check ก็ไม่ได้จับกรณีนี้
  105 - **แนวทางแก้:**เพิ่warning ใน `validateContacts` สำหรับACTIVE rows ที่ไมRegister Date
  104     สาเหตุ:** `storeContacts` (line 1006) กรองแถวทparse วันที่ไม่ได้ออกอย่างเงียบๆ ด้วย `.filter(r => r.regDate)
  107 ---
      ` — ระบบ Data Quality Check ก็ไม่ได้จับกรณีนี้
  105 # **แนวทางแก้:** เพิ่ม warning ใน `validateContacts` สำหรับ ACTIVE rows ที่ไม่มี Register Date
  116
  117 ---
  108
  109 เมื่อ 🟡 Minor — ผลกระทบจำกัด แก้ได้ไม่เร่งด่วน
    0 เหลว
  111 #### [m1] Log Auto-sync ถูกเขียนไปที่แท็บที่ซ่อนอยู่
  112
  113 เมื่อเปิดหน้าเว็บ ระบบ auto-sync และเขียน log ลงแท็บ Database แต่ผู้ใช้เห็นแท็บ Settings อยู่ ทำให้ไม่รู้ว่า sync สำเร็จหรือล้ม
  117 ใช้`fetch` แบบ `mode:'no-cors'` ซึ่งไม่สามารถอresponse ได้— ข้อความ"✅ ส่งข้อมbackup แล้ว"แสดงเสมอแม้Goo
      เหลว
  114
  115 #### [m2] ปุ่ม Backup รายงาน "สำเร็จ" แม้ส่งไม่ถึง
  116
  127 ใช้ `fetch` แบบ `mode:'no-cors'` ซึ่งไม่สามารถอ่าน response ได้ — ข้อความ "✅ ส่งข้อมูล backup แล้ว" แสดงเสมอแม้ Goo
  122
      gle Sheets ไม่ได้รับข้อมูล
  118
  119 #### [m3] ชื่อเดือนหลัง เมษายน 2570 แสดงเป็นรหัสแทน                                                             งไม่เส0
    1 ตารางและกราฟจะแสดง "2027-05" แทน "May 2027" เพราะ month label map hardcode ไว้ถึงแค่ April 2027
  122
  123 #### [m4] `clearAllD ta` ไม่รอให้ล้าง Google Sheeเสร็จก่อน
  124
  125 `clearSheets()` เป็น async แต่ไม่ถูก `await` — ถ้าผู้ใช้ sync ใหม่เร็วมากอาจเกิด race condition กับการล้างข้อมูลที่ยังไม่เส
      ทำให้ภาพรวมไม่ครบถ้วน
      ร็จ
  136 #### [m6] การตรวจหาแถวซ้ำในPoint Report อาจ false positive
  137 #### [m5] ตาราง Give v  Used Points ขาดข้อมูลบางเดือน
  128
  129 เดือนที่มี REDEEMED entries ใน Point Report แต่ไม่มี record ใน Redemptions Details จะหายจากตาราง cross-check —
  135 ---
      ทำให้ภาพรวมไม่ครบถ้วน
  130 ## สรุปภาพรวม
  131 #### [m6] การตรวจหา ถวซ้ำใน Point Report อาจ false positive
  132 | ระดับ| จำนวน | ต้องแก้ก่deploy? |
  143 ใช้ key `วันที่|เบอร์|คะแนน` — ถ้าลูกค้าคนเดียวกันได้คะแนนเท่ากันจาก 2 ช่องทางในเวลาเดียวกัน จะถูก flag ว่าซ้ำทั้งที่ไม่ใช่
  141 | 🔴 Critical | 3 | ใช่— โดยเฉพาะ C2 และ C3 ที่เกี่ยPDPA |
  144 | 🟠 Major | 4 | แนะนำให้แก้ก่อนใช้งาน|ริง
  145 ---
  146
  147 ## สรุปภาพรวม
   38
╌╌╌39╌╌╌ระดับ | จำนวน | ต้องแก้ก่อน depl|
 Do 0ou-------|-------|-------------------|
 > 11 Ye🔴 Critical | 3 | ใช่ — โดยเฉพาะ C2 และ C3 ที่เกี่ยวกับ PDPA |
   22 | 🟠 Major | 4 | แนะนำให้แก้ก่อนใช้งานจริง |n (shift+tab)
   33 | 🟡 Minor | 6 | แก้ได้ทีหลัง ะทบการใช้งานหลัก |
  144
  145 **คำแนะนำ:** แก้ C2 + C3 ก่อนเพราะเกี่ยวกับข้อมูลส่วนบุคคลลูกค้า ตามด้วย C1 ที่ทำให้ feature หลักใช้ไม่ได้ ╌  3. No
