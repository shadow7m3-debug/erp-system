
// ╔══════════════════════════════════════════════════════════════╗
// ║  نظام ERP v4.1 — تحديث العملات والمرفقات                    ║
// ╠══════════════════════════════════════════════════════════════╣
// ║  ✅ v4.0 كامل                                                ║
// ║  🆕 دعم متعدد العملات: دينار جزائري، يورو، جنيه، دولار      ║
// ║  🆕 فواتير الشراء بالعملة الصعبة + سعر الصرف                ║
// ║  🆕 فواتير البيع بالدينار الجزائري دائماً                    ║
// ║  🆕 رفع وتحميل فواتير PDF/صورة في المشتريات                  ║
// ║  🆕 جميع الأرقام إنجليزية فقط                               ║
// ╚══════════════════════════════════════════════════════════════╝

import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ══════════════════════════════════════════════
// 1. DATABASE
// ══════════════════════════════════════════════
const DB = {
  get:   k   => { try { return JSON.parse(localStorage.getItem(`erp41_${k}`) || "[]"); } catch { return []; } },
  set:   (k,d)=> { try { localStorage.setItem(`erp41_${k}`, JSON.stringify(d)); } catch {} },
  obj:   (k,d={})=>{ try { return JSON.parse(localStorage.getItem(`erp41_${k}`) || JSON.stringify(d)); } catch { return d; } },
  clear: ()  => Object.keys(localStorage).filter(k=>k.startsWith("erp41_")).forEach(k=>localStorage.removeItem(k)),
};

// ══════════════════════════════════════════════
// 2. CURRENCIES — العملات
// ══════════════════════════════════════════════
const CURRENCIES = {
  DZD: { code:"DZD", symbol:"د.ج",  name:"دينار جزائري",  flag:"🇩🇿", type:"local"  },
  EUR: { code:"EUR", symbol:"€",    name:"يورو",           flag:"🇪🇺", type:"foreign"},
  GBP: { code:"GBP", symbol:"£",    name:"جنيه إسترليني", flag:"🇬🇧", type:"foreign"},
  USD: { code:"USD", symbol:"$",    name:"دولار أمريكي",  flag:"🇺🇸", type:"foreign"},
};

// أسعار الصرف الافتراضية (1 وحدة من العملة الأجنبية = كم دينار)
const DEFAULT_RATES = { EUR: 145.5, GBP: 170.2, USD: 134.8 };

// تحويل من عملة أجنبية للدينار
const toDZD = (amount, currency, rates=null) => {
  const r = rates || DB.obj("exchangeRates", DEFAULT_RATES);
  if (currency === "DZD") return Number(amount);
  return Number(amount) * (r[currency] || 1);
};

// ══════════════════════════════════════════════
// 3. SEED DATA
// ══════════════════════════════════════════════
const seed = () => {
  if (DB.get("seeded").length) return;

  DB.set("departments",[
    {id:1,name:"الإدارة العليا",    color:"#7C3AED",icon:"👑"},
    {id:2,name:"المخزون والمستودع", color:"#2563EB",icon:"📦"},
    {id:3,name:"الإنتاج والتصنيع",  color:"#059669",icon:"🏭"},
    {id:4,name:"المبيعات والتسويق", color:"#D97706",icon:"💼"},
    {id:5,name:"المشتريات",         color:"#DC2626",icon:"🛒"},
    {id:6,name:"الموارد البشرية",   color:"#0891B2",icon:"👥"},
    {id:7,name:"المحاسبة والمالية", color:"#65A30D",icon:"💰"},
  ]);

  DB.set("roles",[
    {id:"admin",     label:"مدير عام",      deptId:1,perms:["*"],color:"#7C3AED"},
    {id:"inventory", label:"مسؤول مخزون",  deptId:2,perms:["inventory","products","warehouse","scan"],color:"#2563EB"},
    {id:"production",label:"مسؤول إنتاج",  deptId:3,perms:["production","bom","scan"],color:"#059669"},
    {id:"sales",     label:"مسؤول مبيعات", deptId:4,perms:["sales","scan"],color:"#D97706"},
    {id:"purchase",  label:"مسؤول مشتريات",deptId:5,perms:["purchase","scan"],color:"#DC2626"},
    {id:"hr",        label:"موارد بشرية",  deptId:6,perms:["hr"],color:"#0891B2"},
    {id:"accountant",label:"محاسب",         deptId:7,perms:["reports"],color:"#65A30D"},
    {id:"worker",    label:"موظف",          deptId:3,perms:["scan"],color:"#64748B"},
  ]);

  DB.set("users",[
    {id:1,name:"أحمد العمري",     email:"admin@erp.com",   pass:"admin123", role:"admin",      deptId:1,active:true},
    {id:2,name:"سارة المحمدي",   email:"inv@erp.com",     pass:"inv123",   role:"inventory",  deptId:2,active:true},
    {id:3,name:"خالد النجار",    email:"prod@erp.com",    pass:"prod123",  role:"production", deptId:3,active:true},
    {id:4,name:"فاطمة الزهراني",email:"sales@erp.com",   pass:"sales123", role:"sales",      deptId:4,active:true},
    {id:5,name:"عمر الغامدي",    email:"purchase@erp.com",pass:"pur123",   role:"purchase",   deptId:5,active:true},
    {id:6,name:"نورة الشمري",    email:"hr@erp.com",      pass:"hr123",    role:"hr",         deptId:6,active:true},
    {id:7,name:"يوسف القحطاني", email:"acc@erp.com",     pass:"acc123",   role:"accountant", deptId:7,active:true},
  ]);

  DB.set("suppliers",[
    {id:1,name:"شركة الخليج للمواد الكيميائية",phone:"0501234567",city:"الرياض",   country:"SA",currency:"USD"},
    {id:2,name:"مصنع الوطنية للتغليف",         phone:"0551234567",city:"جدة",     country:"SA",currency:"DZD"},
    {id:3,name:"Euro Chemical GmbH",            phone:"+49301234567",city:"Berlin",country:"DE",currency:"EUR"},
    {id:4,name:"UK Plastics Ltd",               phone:"+44201234567",city:"London",country:"GB",currency:"GBP"},
  ]);

  DB.set("customers",[
    {id:1,name:"شركة البناء المتحدة",       phone:"0512345678",city:"الجزائر العاصمة",currency:"DZD"},
    {id:2,name:"مجموعة الاستثمار الصناعي", phone:"0523456789",city:"وهران",           currency:"DZD"},
    {id:3,name:"شركة الخدمات اللوجستية",   phone:"0534567890",city:"قسنطينة",         currency:"DZD"},
  ]);

  DB.set("exchangeRates", DEFAULT_RATES);

  DB.set("rawMaterials",[
    {id:1,code:"RM001",name:"مسحوق الألومنيوم",   category:"معادن",   supplierId:1,unit:"كيلوجرام",qty:500,minStock:100,unitCost:45, costCurrency:"USD"},
    {id:2,code:"RM002",name:"راتنج البولي إيثيلين",category:"بوليمرات",supplierId:3,unit:"كيلوجرام",qty:300,minStock:80, unitCost:28, costCurrency:"EUR"},
    {id:3,code:"RM003",name:"علب كرتون 500 مل",    category:"تغليف",  supplierId:2,unit:"قطعة",    qty:2000,minStock:500,unitCost:150,costCurrency:"DZD"},
    {id:4,code:"RM004",name:"أحبار طباعة زرقاء",   category:"أحبار",  supplierId:4,unit:"لتر",     qty:45,  minStock:20, unitCost:18, costCurrency:"GBP"},
    {id:5,code:"RM005",name:"أكياس بلاستيك شفاف",  category:"تغليف",  supplierId:2,unit:"قطعة",    qty:5000,minStock:1000,unitCost:30, costCurrency:"DZD"},
    {id:6,code:"RM006",name:"محلول التبييض",        category:"كيماويات",supplierId:1,unit:"لتر",   qty:25,  minStock:30, unitCost:12, costCurrency:"USD"},
  ]);

  DB.set("products",[
    {id:1,code:"FP001",name:"منتج ألومنيوم مطروق A",category:"معدنية",  unit:"قطعة",qty:150,minStock:50, costPrice:25000,sellPrice:38000,batchNumber:"BATCH-001"},
    {id:2,code:"FP002",name:"أنبوب بولي إيثيلين B",  category:"بلاستيك",unit:"متر", qty:200,minStock:80, costPrice:8500, sellPrice:14000,batchNumber:"BATCH-002"},
    {id:3,code:"FP003",name:"مادة تعبئة مركزة C",    category:"كيماويات",unit:"لتر",qty:30, minStock:50, costPrice:29000,sellPrice:46000,batchNumber:"BATCH-003"},
  ]);

  DB.set("purchaseInvoices",[
    {id:1,invoiceNo:"PO-2024-001",supplierId:1,invoiceDate:"2024-01-10",currency:"USD",exchangeRate:134.8,
     items:[{matId:1,qty:200,unitCost:45},{matId:6,qty:50,unitCost:12}],
     subtotal:9600,taxAmount:0,discount:0,total:9600,totalDZD:1294080,
     status:"مكتملة",uploadedBy:5,attachmentName:null,attachmentData:null},
    {id:2,invoiceNo:"PO-2024-002",supplierId:3,invoiceDate:"2024-02-15",currency:"EUR",exchangeRate:145.5,
     items:[{matId:2,qty:100,unitCost:28}],
     subtotal:2800,taxAmount:0,discount:0,total:2800,totalDZD:407400,
     status:"مكتملة",uploadedBy:5,attachmentName:null,attachmentData:null},
    {id:3,invoiceNo:"PO-2024-003",supplierId:4,invoiceDate:"2024-03-01",currency:"GBP",exchangeRate:170.2,
     items:[{matId:4,qty:20,unitCost:18}],
     subtotal:360,taxAmount:0,discount:0,total:360,totalDZD:61272,
     status:"مكتملة",uploadedBy:5,attachmentName:null,attachmentData:null},
  ]);

  DB.set("bom",[
    {id:1,productId:1,version:"1.0",wastePercent:5,estimatedCost:25000,active:true,createdBy:3,items:[{matId:1,qty:2,unit:"كج",type:"raw"},{matId:3,qty:1,unit:"قطعة",type:"packaging"}]},
    {id:2,productId:2,version:"1.0",wastePercent:3,estimatedCost:8500, active:true,createdBy:3,items:[{matId:2,qty:1.5,unit:"كج",type:"raw"},{matId:5,qty:2,unit:"قطعة",type:"packaging"}]},
  ]);

  DB.set("productionPlans",[
    {id:1,productId:1,bomId:1,plannedQty:100,plannedDate:"2024-03-15",status:"مكتملة",  createdBy:3,approvedBy:1,actualQty:97,wasteQty:3},
    {id:2,productId:2,bomId:2,plannedQty:150,plannedDate:"2024-04-20",status:"قيد الانتظار",createdBy:3,approvedBy:null},
  ]);

  // فواتير البيع دائماً بالدينار الجزائري
  DB.set("salesInvoices",[
    {id:1,invoiceNo:"INV-2024-001",customerId:1,invoiceDate:"2024-03-20",currency:"DZD",
     items:[{prodId:1,qty:30,unitPrice:38000,discount:0,costPrice:25000}],
     subtotal:1140000,taxAmount:171000,discount:0,total:1311000,
     status:"مسلمة",warehouseStatus:"مجهزة",createdBy:4,preparedBy:2},
    {id:2,invoiceNo:"INV-2024-002",customerId:2,invoiceDate:"2024-04-05",currency:"DZD",
     items:[{prodId:2,qty:50,unitPrice:14000,discount:50000,costPrice:8500}],
     subtotal:700000,taxAmount:97500,discount:50000,total:747500,
     status:"بانتظار تجهيز المخزن",warehouseStatus:"معلقة",createdBy:4,preparedBy:null},
  ]);

  DB.set("employees",[
    {id:1,empNo:"EMP001",name:"محمد العتيبي",    dept:"الإنتاج", position:"مشغل آلات",  hireDate:"2022-03-01",basicSalary:45000,allowances:8000,active:true},
    {id:2,empNo:"EMP002",name:"عبدالرحمن السبيعي",dept:"المخزون",position:"أمين مخزن",  hireDate:"2021-06-15",basicSalary:52000,allowances:6000,active:true},
    {id:3,empNo:"EMP003",name:"حمد الرشيدي",     dept:"المبيعات",position:"مندوب مبيعات",hireDate:"2023-01-10",basicSalary:60000,allowances:12000,active:true},
    {id:4,empNo:"EMP004",name:"سلطان الدوسري",   dept:"الإنتاج", position:"مشرف إنتاج", hireDate:"2020-09-01",basicSalary:85000,allowances:15000,active:true},
  ]);

  const att=[];
  for(let e=1;e<=4;e++) for(let d=1;d<=30;d++){
    const isW=[5,6].includes(new Date(2024,3,d).getDay());
    const isAbs=!isW&&[7,14].includes(d)&&e===1;
    att.push({id:e*100+d,empId:e,date:`2024-04-${String(d).padStart(2,"0")}`,
      checkIn:isW||isAbs?null:"08:00",checkOut:isW||isAbs?null:"17:00",
      workHours:isW||isAbs?0:9,lateMinutes:0,status:isW?"إجازة":isAbs?"غياب":"حضور"});
  }
  DB.set("attendance",att);
  DB.set("auditLogs",[{id:1,userId:1,action:"تسجيل دخول",module:"النظام",createdAt:new Date().toISOString()}]);
  DB.set("scanLog",[]);
  DB.set("notifications",[
    {id:1,type:"warning",title:"مخزون منخفض",message:"محلول التبييض وصل للحد الأدنى",read:false,createdAt:new Date().toISOString()},
  ]);
  DB.set("settings",{
    companyName:"شركة الصناعات المتقدمة",
    companyNameEn:"Advanced Industries Co.",
    address:"الجزائر — المنطقة الصناعية",
    phone:"+213-21-123456",
    email:"info@advanced-ind.dz",
    vatNumber:"000123456789",
    localCurrency:"DZD",
    taxRate:19,
  });
  DB.set("seeded",["done"]);
};

// ══════════════════════════════════════════════
// 4. UTILS — أرقام إنجليزية فقط
// ══════════════════════════════════════════════
const T = {
  id:      ()  => Date.now()+Math.floor(Math.random()*9999),
  now:     ()  => new Date().toISOString(),
  today:   ()  => new Date().toISOString().split("T")[0],

  // أرقام إنجليزية فقط مع فواصل
  fmt: n => {
    const num = Number(n)||0;
    return num.toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2});
  },

  // رقم بدون فواصل (إنجليزي)
  fmtNum: n => (Number(n)||0).toLocaleString("en-US"),

  // تاريخ بالإنجليزية
  fmtDate: d => d ? new Date(d).toLocaleDateString("en-GB") : "—",
  fmtDT:   d => d ? new Date(d).toLocaleString("en-GB") : "—",

  // تنسيق مبلغ مع رمز العملة
  fmtCur: (amount, currency="DZD") => {
    const cur = CURRENCIES[currency] || CURRENCIES.DZD;
    return `${T.fmt(amount)} ${cur.symbol}`;
  },

  log: (uId,action,module) => {
    const logs=DB.get("auditLogs");
    logs.unshift({id:T.id(),userId:uId,action,module,createdAt:T.now()});
    DB.set("auditLogs",logs.slice(0,500));
  },
  notify: (type,title,message) => {
    const n=DB.get("notifications");
    n.unshift({id:T.id(),type,title,message,read:false,createdAt:T.now()});
    DB.set("notifications",n.slice(0,50));
  },
};

// ══════════════════════════════════════════════
// 5. PERMISSIONS
// ══════════════════════════════════════════════
const PERMS={
  admin:["*"],inventory:["dashboard","inventory","products","warehouse","scan"],
  production:["dashboard","production","bom","scan"],sales:["dashboard","sales","scan"],
  purchase:["dashboard","purchase","scan"],hr:["dashboard","hr"],
  accountant:["dashboard","reports"],worker:["dashboard","scan"],
};
const can=(role,p)=>{const ps=PERMS[role]||[];return ps.includes("*")||ps.includes(p);};

// ══════════════════════════════════════════════
// 6. THEME & CSS
// ══════════════════════════════════════════════
const C={
  primary:"#0F3460",blue:"#2563EB",blueSoft:"#EFF6FF",blueText:"#1D4ED8",
  green:"#059669",greenSoft:"#ECFDF5",greenText:"#047857",
  amber:"#D97706",amberSoft:"#FFFBEB",amberText:"#B45309",
  red:"#DC2626",redSoft:"#FEF2F2",redText:"#B91C1C",
  purple:"#7C3AED",purpleSoft:"#F5F3FF",purpleText:"#6D28D9",
  bg:"#F8FAFC",card:"#FFFFFF",border:"#E2E8F0",
  text:"#0F172A",muted:"#64748B",
  sidebar:"#0F172A",
};
const COLS=["#2563EB","#059669","#D97706","#DC2626","#7C3AED","#0891B2"];
const TS={background:"#0F172A",border:"none",borderRadius:8,color:"#fff",fontSize:11};

const css=`
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body,#root{font-family:'IBM Plex Sans Arabic',sans-serif;direction:rtl;background:${C.bg};color:${C.text};min-height:100vh;font-size:14px;}
  /* أرقام إنجليزية دائماً */
  .num,.num *,td .amount,input[type="number"]{font-variant-numeric:tabular-nums;font-feature-settings:"tnum";direction:ltr;unicode-bidi:embed;}
  ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px;}
  .sidebar{width:256px;min-height:100vh;background:${C.sidebar};position:fixed;right:0;top:0;z-index:200;display:flex;flex-direction:column;}
  .main{margin-right:256px;min-height:100vh;padding:24px 28px;}
  .card{background:#fff;border-radius:16px;border:1px solid ${C.border};padding:22px;margin-bottom:16px;transition:box-shadow .2s;}
  .card:hover{box-shadow:0 4px 20px rgba(0,0,0,.06);}
  .btn{padding:9px 18px;border-radius:10px;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:all .15s;white-space:nowrap;}
  .btn:active{transform:scale(.97);}
  .btn-blue{background:${C.blue};color:#fff;}.btn-blue:hover{background:${C.blueText};}
  .btn-green{background:${C.green};color:#fff;}.btn-green:hover{background:#047857;}
  .btn-red{background:${C.red};color:#fff;}.btn-amber{background:${C.amber};color:#fff;}
  .btn-purple{background:${C.purple};color:#fff;}.btn-ghost{background:transparent;color:${C.muted};border:1px solid ${C.border};}
  .btn-ghost:hover{background:${C.bg};}.btn-sm{padding:6px 12px;font-size:12px;border-radius:8px;}
  .btn-icon{padding:7px;border-radius:8px;border:none;cursor:pointer;background:${C.bg};color:${C.muted};display:inline-flex;align-items:center;transition:all .15s;}
  .btn-icon:hover{background:${C.border};}
  input,select,textarea{font-family:inherit;direction:rtl;width:100%;padding:10px 13px;border:1.5px solid ${C.border};border-radius:10px;font-size:13px;color:${C.text};background:#fff;outline:none;transition:all .18s;}
  input[type="number"]{direction:ltr;text-align:left;}
  input:focus,select:focus,textarea:focus{border-color:${C.blue};box-shadow:0 0 0 3px ${C.blue}18;}
  label{font-size:11px;font-weight:700;color:${C.muted};display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;}
  .fg{margin-bottom:14px;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{background:#F8FAFC;padding:10px 13px;text-align:right;font-weight:700;color:${C.muted};border-bottom:2px solid ${C.border};font-size:11px;text-transform:uppercase;letter-spacing:.4px;}
  td{padding:10px 13px;border-bottom:1px solid #F1F5F9;vertical-align:middle;}
  tr:last-child td{border-bottom:none;}tr:hover td{background:#FAFBFC;}
  .badge{display:inline-flex;align-items:center;gap:3px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;}
  .b-blue{background:${C.blueSoft};color:${C.blueText};}.b-green{background:${C.greenSoft};color:${C.greenText};}
  .b-amber{background:${C.amberSoft};color:${C.amberText};}.b-red{background:${C.redSoft};color:${C.redText};}
  .b-purple{background:${C.purpleSoft};color:${C.purpleText};}.b-gray{background:#F1F5F9;color:#475569;}
  .kpi{background:#fff;border-radius:14px;padding:20px;border:1px solid ${C.border};position:relative;overflow:hidden;}
  .kpi-v{font-size:26px;font-weight:800;line-height:1;margin:8px 0 5px;letter-spacing:-1px;direction:ltr;display:block;}
  .kpi-l{font-size:11px;color:${C.muted};font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
  .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.65);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(6px);}
  .modal{background:#fff;border-radius:20px;width:100%;max-height:94vh;overflow-y:auto;}
  .modal-hd{padding:18px 24px;border-bottom:1px solid ${C.border};display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;z-index:1;border-radius:20px 20px 0 0;}
  .modal-bd{padding:22px 24px;}.modal-ft{padding:14px 24px;border-top:1px solid ${C.border};display:flex;gap:8px;justify-content:flex-end;background:#FAFBFC;border-radius:0 0 20px 20px;}
  .tabs{display:flex;gap:3px;background:#F1F5F9;padding:4px;border-radius:12px;margin-bottom:20px;}
  .tab{padding:7px 16px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600;color:${C.muted};border:none;background:none;transition:all .15s;}
  .tab.on{background:#fff;color:${C.blue};box-shadow:0 1px 6px rgba(0,0,0,.1);}
  .alert{padding:11px 15px;border-radius:10px;font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
  .a-warn{background:${C.amberSoft};color:${C.amberText};border:1px solid #FDE68A;}
  .a-err{background:${C.redSoft};color:${C.redText};border:1px solid #FCA5A5;}
  .a-ok{background:${C.greenSoft};color:${C.greenText};border:1px solid #A7F3D0;}
  .a-info{background:${C.blueSoft};color:${C.blueText};border:1px solid #BFDBFE;}
  .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
  .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
  .flex{display:flex;}.aic{align-items:center;}.jb{justify-content:space-between;}
  .mb2{margin-bottom:8px;}.mb3{margin-bottom:12px;}.mb4{margin-bottom:18px;}
  /* رفع الملفات */
  .upload-zone{border:2px dashed ${C.border};border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:all .2s;}
  .upload-zone:hover,.upload-zone.drag{border-color:${C.blue};background:${C.blueSoft};}
  .upload-zone.has-file{border-color:${C.green};background:${C.greenSoft};}
  /* شارة العملة */
  .cur-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:700;font-family:monospace;}
  .cur-DZD{background:#F0FDF4;color:#166534;}
  .cur-EUR{background:#EFF6FF;color:#1E40AF;}
  .cur-GBP{background:#FDF4FF;color:#6B21A8;}
  .cur-USD{background:#FFFBEB;color:#92400E;}
  @media(max-width:900px){.sidebar{display:none}.main{margin-right:0}.g4{grid-template-columns:1fr 1fr}}
  @media print{.sidebar,.no-print{display:none!important}.main{margin:0!important;padding:0!important}}
`;

// ══════════════════════════════════════════════
// 7. SMALL COMPONENTS
// ══════════════════════════════════════════════
const Ic=({d,s=16,c="currentColor",sw=2})=>(
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);
const icons={
  dash:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  inv: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  buy: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0",
  prod:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18",
  sale:"M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  hr:  "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  rep: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8",
  usr: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z",
  set: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  bell:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  srch:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  plus:"M12 5v14 M5 12h14",
  edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  del: "M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  x:   "M18 6L6 18 M6 6l12 12",
  chk: "M20 6L9 17l-5-5",
  warn:"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  prt: "M6 9V2h12v7 M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2 M6 14h12v8H6z",
  dwn: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  upl: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  out: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  trnd:"M23 6l-9.5 9.5-5-5L1 18",
  wh:  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  bom: "M3 3h18v18H3z M9 9h6 M9 12h6 M9 15h4",
  exch:"M7 16V4m0 0L3 8m4-4l4 4 M17 8v12m0 0l4-4m-4 4l-4-4",
  scan:"M3 7V5a2 2 0 012-2h2 M17 3h2a2 2 0 012 2v2 M21 17v2a2 2 0 01-2 2h-2 M7 21H5a2 2 0 01-2-2v-2 M7 12h10",
  file:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6",
  clip:"M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
};
const Icon=({n,s=16,c="currentColor",sw=2})=><Ic d={icons[n]||""} s={s} c={c} sw={sw}/>;
const Badge=({label,cls="b-gray"})=><span className={`badge ${cls}`}>{label}</span>;
const smap=s=>({
  "مكتملة":"b-green","مسلمة":"b-green","متوفر":"b-green","حضور":"b-green","مجهزة":"b-green",
  "قيد التصنيع":"b-blue","جاهزة":"b-blue",
  "قيد الانتظار":"b-amber","بانتظار تجهيز المخزن":"b-amber","معلقة":"b-amber","منخفض":"b-amber",
  "ملغاة":"b-red","غياب":"b-red",
})[s]||"b-gray";

// شارة العملة
const CurBadge=({currency})=>{
  const cur=CURRENCIES[currency]||CURRENCIES.DZD;
  return <span className={`cur-badge cur-${currency}`}>{cur.flag} {cur.code} {cur.symbol}</span>;
};

// ══════════════════════════════════════════════
// 8. MODAL
// ══════════════════════════════════════════════
const Modal=({open,close,title,children,footer,size=740})=>{
  if(!open)return null;
  return(
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&close()}>
      <div className="modal" style={{maxWidth:size}}>
        <div className="modal-hd">
          <h3 style={{fontSize:15,fontWeight:700}}>{title}</h3>
          <button className="btn-icon" onClick={close}><Icon n="x" s={16}/></button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer&&<div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// 9. FILE UPLOAD COMPONENT — رفع الملفات
// ══════════════════════════════════════════════
const FileUpload=({value,onChange,label="رفع الفاتورة (PDF أو صورة)"})=>{
  const [dragging,setDragging]=useState(false);
  const inputRef=useRef(null);

  const handleFile=file=>{
    if(!file)return;
    const allowed=["application/pdf","image/jpeg","image/png","image/jpg"];
    if(!allowed.includes(file.type)){alert("يُسمح فقط بـ PDF أو JPG أو PNG");return;}
    if(file.size>10*1024*1024){alert("حجم الملف يجب أن يكون أقل من 10MB");return;}

    const reader=new FileReader();
    reader.onload=e=>{
      onChange({
        name:file.name,
        type:file.type,
        size:file.size,
        data:e.target.result, // base64
        uploadedAt:T.now(),
      });
    };
    reader.readAsDataURL(file);
  };

  const viewFile=()=>{
    if(!value?.data)return;
    const w=window.open();
    if(value.type==="application/pdf"){
      w.document.write(`<iframe src="${value.data}" style="width:100%;height:100vh;border:none;"></iframe>`);
    } else {
      w.document.write(`<img src="${value.data}" style="max-width:100%;"/>`);
    }
  };

  const downloadFile=()=>{
    if(!value?.data)return;
    const a=document.createElement("a");
    a.href=value.data;
    a.download=value.name;
    a.click();
  };

  return(
    <div>
      <label>{label}</label>
      {value?.name
        ?(
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:C.greenSoft,border:`1px solid #A7F3D0`,borderRadius:10}}>
            <Icon n="file" s={20} c={C.green}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:13,color:C.greenText}}>{value.name}</div>
              <div style={{fontSize:11,color:C.muted}}>
                {(value.size/1024).toFixed(1)} KB — تم الرفع {T.fmtDate(value.uploadedAt?.split("T")[0])}
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button className="btn-icon" title="معاينة" onClick={viewFile}><Icon n="eye" s={14} c={C.green}/></button>
              <button className="btn-icon" title="تحميل" onClick={downloadFile}><Icon n="dwn" s={14} c={C.blue}/></button>
              <button className="btn-icon" title="حذف" onClick={()=>onChange(null)}><Icon n="x" s={14} c={C.red}/></button>
            </div>
          </div>
        ):(
          <div
            className={`upload-zone ${dragging?"drag":""}`}
            onClick={()=>inputRef.current?.click()}
            onDragOver={e=>{e.preventDefault();setDragging(true);}}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
          >
            <Icon n="upl" s={28} c={C.muted}/>
            <div style={{marginTop:8,fontWeight:600,color:C.muted}}>
              اسحب الملف هنا أو اضغط للرفع
            </div>
            <div style={{fontSize:11,color:C.light,marginTop:4}}>PDF أو JPG أو PNG — الحد الأقصى 10MB</div>
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}}
              onChange={e=>handleFile(e.target.files[0])}/>
          </div>
        )
      }
    </div>
  );
};

// ══════════════════════════════════════════════
// 10. EXCHANGE RATES WIDGET
// ══════════════════════════════════════════════
const ExchangeRates=()=>{
  const [rates,setRates]=useState(DB.obj("exchangeRates",DEFAULT_RATES));
  const [editing,setEditing]=useState(false);
  const [tmp,setTmp]=useState({...rates});

  const save=()=>{
    DB.set("exchangeRates",tmp);
    setRates(tmp);
    setEditing(false);
  };

  return(
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}>
          <Icon n="exch" s={18} c={C.blue}/>
          أسعار الصرف — الدينار الجزائري
        </div>
        <button className="btn-ghost btn-sm" onClick={()=>editing?save():setEditing(true)}>
          {editing?<><Icon n="chk" s={13}/>حفظ</>:<><Icon n="edit" s={13}/>تعديل</>}
        </button>
      </div>
      <div className="g3">
        {Object.entries(CURRENCIES).filter(([k])=>k!=="DZD").map(([code,cur])=>(
          <div key={code} style={{padding:"12px 14px",background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <span style={{fontSize:20}}>{cur.flag}</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>{cur.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{code}</div>
              </div>
            </div>
            {editing?(
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <input type="number" value={tmp[code]} onChange={e=>setTmp({...tmp,[code]:Number(e.target.value)})}
                  style={{textAlign:"left",direction:"ltr",flex:1,padding:"6px 10px"}}/>
                <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>د.ج</span>
              </div>
            ):(
              <div style={{fontSize:18,fontWeight:800,color:C.blue,direction:"ltr",textAlign:"left"}}>
                1 {cur.symbol} = {T.fmt(rates[code])} <span style={{fontSize:12,color:C.muted}}>د.ج</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// 11. PRINT INVOICE WITH CURRENCY
// ══════════════════════════════════════════════
const printInv=(inv,type="sale")=>{
  const s=DB.obj("settings",{});
  const customers=DB.get("customers"),suppliers=DB.get("suppliers"),products=DB.get("products"),materials=DB.get("rawMaterials");
  const rates=DB.obj("exchangeRates",DEFAULT_RATES);
  const party=type==="sale"?customers.find(c=>c.id===Number(inv.customerId)):suppliers.find(x=>x.id===Number(inv.supplierId));
  const currency=inv.currency||"DZD";
  const cur=CURRENCIES[currency]||CURRENCIES.DZD;

  const items=(inv.items||[]).map(it=>{
    const p=type==="sale"?products.find(x=>x.id===Number(it.prodId)):materials.find(x=>x.id===Number(it.matId));
    return{name:p?.name||"—",qty:it.qty,price:type==="sale"?it.unitPrice:it.unitCost,disc:it.discount||0};
  });

  const taxAmt=inv.taxAmount||inv.tax_amount||0;
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${inv.invoiceNo}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,sans-serif;color:#0F172A;padding:15mm;font-size:10.5pt;direction:rtl;}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:16px;border-bottom:3px solid #0F3460;}
    .co{font-size:18pt;font-weight:800;color:#0F3460;margin-bottom:4px;}
    .cur-box{background:#EFF6FF;border:2px solid #2563EB;border-radius:10px;padding:10px 16px;text-align:center;}
    .cur-name{font-size:14pt;font-weight:800;color:#1E40AF;}
    .info{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;}
    .ib{background:#F8FAFC;padding:12px;border-radius:8px;border:1px solid #E2E8F0;}
    .ib h4{font-size:8pt;color:#64748B;text-transform:uppercase;margin-bottom:6px;}
    table{width:100%;border-collapse:collapse;margin-bottom:12px;}
    th{background:#0F3460;color:#fff;padding:9px 11px;text-align:right;font-size:9pt;}
    td{padding:9px 11px;border-bottom:1px solid #F1F5F9;font-size:9.5pt;}
    .num{direction:ltr;text-align:left;font-family:monospace;}
    .tot{max-width:280px;margin-right:auto;background:#F8FAFC;padding:14px;border-radius:8px;border:1px solid #E2E8F0;}
    .tr{display:flex;justify-content:space-between;padding:4px 0;font-size:9pt;}
    .grand{font-size:14pt;font-weight:800;color:#0F3460;border-top:2px solid #0F3460;padding-top:8px;margin-top:6px;}
    ${currency!=="DZD"?`.dzd-box{background:#F0FDF4;border:1px solid #A7F3D0;border-radius:8px;padding:10px;margin-top:8px;font-size:10pt;color:#166534;text-align:center;}`:""}
    .foot{margin-top:28px;padding-top:12px;border-top:1px solid #E2E8F0;text-align:center;color:#94A3B8;font-size:8pt;}
  </style></head><body>
  <div class="hdr">
    <div>
      <div class="co">${s.companyName||"الشركة"}</div>
      <div style="color:#64748B;font-size:9pt;">${s.address||""}</div>
      <div style="color:#64748B;font-size:9pt;">${s.phone||""} | ${s.email||""}</div>
      <div style="color:#64748B;font-size:9pt;">الرقم الضريبي: ${s.vatNumber||""}</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:13pt;font-weight:800;color:#2563EB;margin-bottom:8px;">${type==="sale"?"فاتورة بيع":"فاتورة شراء"}</div>
      <div style="font-size:9pt;color:#64748B;">${inv.invoiceNo}</div>
      <div style="font-size:9pt;color:#64748B;">${T.fmtDate(inv.invoiceDate)}</div>
      <div class="cur-box" style="margin-top:8px;">
        <div class="cur-name">${cur.flag} ${cur.name}</div>
        <div style="font-size:8pt;color:#64748B;">${cur.code} — ${cur.symbol}</div>
        ${currency!=="DZD"?`<div style="font-size:8pt;color:#475569;">1 ${cur.symbol} = ${T.fmt(inv.exchangeRate||rates[currency]||1)} د.ج</div>`:""}
      </div>
    </div>
  </div>
  <div class="info">
    <div class="ib"><h4>${type==="sale"?"العميل":"المورد"}</h4>
      <div style="font-weight:700;font-size:11pt;">${party?.name||"—"}</div>
      <div style="color:#64748B;font-size:9pt;">${party?.city||""} | ${party?.phone||""}</div>
    </div>
    <div class="ib"><h4>تفاصيل الفاتورة</h4>
      <div style="font-size:9pt;">رقم: <strong>${inv.invoiceNo}</strong></div>
      <div style="font-size:9pt;">الحالة: <strong>${inv.status}</strong></div>
      <div style="font-size:9pt;">طباعة: ${new Date().toLocaleDateString("en-GB")}</div>
    </div>
  </div>
  <table><thead><tr><th>#</th><th>البند</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
  <tbody>${items.map((it,i)=>`<tr><td>${i+1}</td><td>${it.name}</td>
    <td class="num">${it.qty}</td>
    <td class="num">${T.fmt(it.price)} ${cur.symbol}</td>
    <td class="num"><strong>${T.fmt(it.qty*it.price)} ${cur.symbol}</strong></td></tr>`).join("")}
  </tbody></table>
  <div style="display:flex;justify-content:flex-end;"><div class="tot">
    <div class="tr"><span>المجموع الفرعي:</span><span class="num">${T.fmt(inv.subtotal)} ${cur.symbol}</span></div>
    <div class="tr"><span>الضريبة (${s.taxRate||19}%):</span><span class="num">${T.fmt(taxAmt)} ${cur.symbol}</span></div>
    <div class="tr"><span>الخصم:</span><span class="num">- ${T.fmt(inv.discount||0)} ${cur.symbol}</span></div>
    <div class="tr grand"><span>الإجمالي:</span><span class="num">${T.fmt(inv.total)} ${cur.symbol}</span></div>
  </div></div>
  ${currency!=="DZD"?`<div class="dzd-box">المبلغ بالدينار الجزائري: <strong>${T.fmt(inv.totalDZD||toDZD(inv.total,currency))} د.ج</strong> (بسعر صرف ${T.fmt(inv.exchangeRate||rates[currency]||1)} د.ج لكل ${cur.symbol})</div>`:""}
  <div class="foot">${s.companyName||""} | ${s.email||""} | الرقم الضريبي: ${s.vatNumber||""}</div>
  </body></html>`;
  const w=window.open("","_blank","width=900,height=700");
  w.document.write(html);w.document.close();setTimeout(()=>w.print(),600);
};

// ══════════════════════════════════════════════
// 12. QR CANVAS
// ══════════════════════════════════════════════
const QRCanvas=({data,size=120})=>{
  const ref=useRef(null);
  useEffect(()=>{
    const cv=ref.current;if(!cv)return;
    const ctx=cv.getContext("2d");
    const hash=[...data].reduce((a,c)=>a+c.charCodeAt(0),0);
    const N=21,cell=size/N;
    ctx.fillStyle="#fff";ctx.fillRect(0,0,size,size);
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){
      const inTL=r<7&&c<7,inTR=r<7&&c>13,inBL=r>13&&c<7;
      if(inTL||inTR||inBL){
        const dr=inBL?r-14:r,dc=inTR?c-14:c;
        ctx.fillStyle=((dr===0||dr===6||dc===0||dc===6)||(dr>=2&&dr<=4&&dc>=2&&dc<=4))?"#0F172A":"#fff";
      } else {
        ctx.fillStyle=((r*31+c*17+hash)%3===0)?"#0F172A":"#fff";
      }
      ctx.fillRect(c*cell,r*cell,cell,cell);
    }
    const df=(x,y)=>{
      ctx.fillStyle="#0F172A";ctx.fillRect(x,y,7*cell,7*cell);
      ctx.fillStyle="#fff";ctx.fillRect(x+cell,y+cell,5*cell,5*cell);
      ctx.fillStyle="#0F172A";ctx.fillRect(x+2*cell,y+2*cell,3*cell,3*cell);
    };
    df(0,0);df((N-7)*cell,0);df(0,(N-7)*cell);
  },[data,size]);
  return <canvas ref={ref} width={size} height={size} style={{borderRadius:8,display:"block"}}/>;
};

// ══════════════════════════════════════════════
// 13. LOGIN
// ══════════════════════════════════════════════
const Login=({onLogin})=>{
  const [email,setEmail]=useState(""),[pass,setPass]=useState(""),[err,setErr]=useState(""),[loading,setLoading]=useState(false);
  const go=()=>{
    setLoading(true);setErr("");
    setTimeout(()=>{
      const u=DB.get("users").find(u=>u.email===email&&u.pass===pass&&u.active);
      u?onLogin(u):setErr("البريد أو كلمة المرور غير صحيحة");
      setLoading(false);
    },400);
  };
  const roles=DB.get("roles"),depts=DB.get("departments");
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:24,padding:44,width:"100%",maxWidth:430,boxShadow:"0 30px 80px rgba(0,0,0,.4)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:68,height:68,background:"linear-gradient(135deg,#2563EB,#7C3AED)",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:32}}>🏭</div>
          <h1 style={{fontSize:22,fontWeight:800,color:C.primary}}>نظام إدارة المصنع</h1>
          <p style={{color:C.muted,fontSize:12,marginTop:4}}>Manufacturing ERP v4.1 — متعدد العملات</p>
          <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:8}}>
            {Object.values(CURRENCIES).map(c=><span key={c.code} style={{fontSize:16}} title={c.name}>{c.flag}</span>)}
          </div>
        </div>
        {err&&<div className="alert a-err mb3">⚠ {err}</div>}
        <div className="fg"><label>البريد الإلكتروني</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="example@erp.com"/>
        </div>
        <div className="fg"><label>كلمة المرور</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="••••••••"/>
        </div>
        <button className="btn btn-blue" style={{width:"100%",padding:"12px",fontSize:14}} onClick={go} disabled={loading}>
          {loading?"جاري التحقق...":"دخول ←"}
        </button>
        <div style={{marginTop:18,padding:12,background:C.bg,borderRadius:10}}>
          <p style={{fontWeight:700,color:C.muted,fontSize:11,marginBottom:8}}>حسابات تجريبية:</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            {DB.get("users").slice(0,6).map(u=>{
              const role=roles.find(r=>r.id===u.role),dept=depts.find(d=>d.id===u.deptId);
              return(<div key={u.id} onClick={()=>{setEmail(u.email);setPass(u.pass);}}
                style={{cursor:"pointer",padding:"6px 8px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:11,display:"flex",alignItems:"center",gap:4}}>
                <span>{dept?.icon}</span><strong style={{color:role?.color||C.blue}}>{role?.label}</strong>
              </div>);
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// 14. SIDEBAR
// ══════════════════════════════════════════════
const Sidebar=({user,page,nav,logout})=>{
  const roles=DB.get("roles"),depts=DB.get("departments");
  const role=roles.find(r=>r.id===user.role),dept=depts.find(d=>d.id===user.deptId);
  const pending=DB.get("salesInvoices").filter(i=>i.status==="بانتظار تجهيز المخزن").length;
  const lowStock=DB.get("rawMaterials").filter(m=>m.qty<=m.minStock).length;

  const navItems=[
    {k:"dashboard", l:"لوحة التحكم",       e:"📊",n:"dash",p:"dashboard"},
    {k:"inventory", l:"المواد الأولية",     e:"📦",n:"inv", p:"inventory",badge:lowStock>0?lowStock:null},
    {k:"products",  l:"المنتجات النهائية",  e:"🏷", n:"wh",  p:"inventory"},
    {k:"purchase",  l:"فواتير الشراء",      e:"🛒",n:"buy", p:"purchase"},
    {k:"bom",       l:"وصفات BOM",          e:"📋",n:"bom", p:"bom"},
    {k:"production",l:"التصنيع",            e:"🏭",n:"prod",p:"production"},
    {k:"sales",     l:"فواتير البيع",       e:"💰",n:"sale",p:"sales"},
    {k:"warehouse", l:"تجهيز الطلبات",     e:"🚚",n:"wh",  p:"inventory",badge:pending>0?pending:null},
    {k:"hr",        l:"الموارد البشرية",    e:"👥",n:"hr",  p:"hr"},
    {k:"reports",   l:"التقارير",           e:"📈",n:"rep", p:"reports"},
    {k:"currency",  l:"أسعار الصرف",       e:"💱",n:"exch",p:"*"},
    {k:"users",     l:"المستخدمون",         e:"🔐",n:"usr", p:"*"},
    {k:"settings",  l:"الإعدادات",          e:"⚙️", n:"set", p:"*"},
    {k:"audit",     l:"سجل النشاط",         e:"📜",n:"audit",p:"*"},
  ].filter(i=>i.p==="*"?can(user.role,"*"):can(user.role,i.p));

  return(
    <div className="sidebar">
      <div style={{padding:"16px 14px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,background:"linear-gradient(135deg,#2563EB,#7C3AED)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏭</div>
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:13}}>ERP v4.1</div>
            <div style={{color:"#475569",fontSize:10}}>🇩🇿 € £ $</div>
          </div>
        </div>
      </div>
      <div style={{padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        <div style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,background:role?.color||C.blue,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#fff",fontSize:14,flexShrink:0}}>{user.name.slice(0,2)}</div>
          <div style={{overflow:"hidden"}}>
            <div style={{color:"#fff",fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
              <span style={{fontSize:11}}>{dept?.icon}</span>
              <span style={{color:"#64748B",fontSize:11}}>{role?.label}</span>
            </div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"8px 8px",overflowY:"auto"}}>
        {navItems.map(item=>{
          const active=page===item.k;
          return(
            <div key={item.k} onClick={()=>nav(item.k)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,marginBottom:1,cursor:"pointer",background:active?"rgba(37,99,235,.2)":"transparent",borderRight:active?`3px solid #2563EB`:"3px solid transparent",transition:"all .15s"}}>
              <span style={{fontSize:15}}>{item.e}</span>
              <span style={{fontSize:13,fontWeight:active?700:400,color:active?"#93C5FD":"#94A3B8",flex:1}}>{item.l}</span>
              {item.badge&&<span style={{background:C.red,color:"#fff",borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:700}}>{item.badge}</span>}
            </div>
          );
        })}
      </nav>
      <div style={{padding:"10px 8px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
        <div onClick={logout} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,cursor:"pointer",color:"#64748B"}}>
          <Icon n="out" s={16} c="#64748B"/><span style={{fontSize:13}}>تسجيل الخروج</span>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// 15. KPI
// ══════════════════════════════════════════════
const KPI=({label,value,icon,color=C.blue,change,dir="up",sub})=>(
  <div className="kpi">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <span className="kpi-l">{label}</span>
      <div style={{width:40,height:40,background:color+"18",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon n={icon} s={19} c={color} sw={1.5}/>
      </div>
    </div>
    <div className="kpi-v" style={{color}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:C.muted,marginBottom:4}}>{sub}</div>}
    {change!==undefined&&<span style={{fontSize:12,fontWeight:700,padding:"2px 8px",borderRadius:20,background:dir==="up"?C.greenSoft:C.redSoft,color:dir==="up"?C.greenText:C.redText,display:"inline-flex",alignItems:"center",gap:3}}>
      {dir==="up"?"↑":"↓"}{change}%
    </span>}
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${color}33,${color})`}}/>
  </div>
);

// ══════════════════════════════════════════════
// 16. SEARCH BAR
// ══════════════════════════════════════════════
const SearchBar=({value,onChange,placeholder="بحث..."})=>(
  <div style={{position:"relative",flex:1}}>
    <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
      <Icon n="srch" s={15} c={C.muted}/>
    </div>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{paddingRight:38}}/>
  </div>
);

// ══════════════════════════════════════════════
// 17. TOP BAR
// ══════════════════════════════════════════════
const TopBar=({title,subtitle,actions,user})=>{
  const [open,setOpen]=useState(false);
  const [notifs,setNotifs]=useState(DB.get("notifications"));
  const unread=notifs.filter(n=>!n.read).length;
  const markAll=()=>{const n=notifs.map(x=>({...x,read:true}));DB.set("notifications",n);setNotifs(n);};

  return(
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24}}>
      <div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.text,letterSpacing:"-0.5px"}}>{title}</h2>
        {subtitle&&<p style={{color:C.muted,fontSize:13,marginTop:3}}>{subtitle}</p>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {actions}
        <div style={{position:"relative"}}>
          <button className="btn-icon" onClick={()=>setOpen(!open)} style={{position:"relative"}}>
            <Icon n="bell" s={18}/>
            {unread>0&&<span style={{position:"absolute",top:2,left:2,width:16,height:16,background:C.red,borderRadius:"50%",fontSize:9,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>}
          </button>
          {open&&(
            <div style={{position:"absolute",left:0,top:"calc(100% + 8px)",width:320,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,boxShadow:"0 12px 40px rgba(0,0,0,.15)",zIndex:300}}>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:700,fontSize:13}}>التنبيهات</span>
                <button className="btn-ghost btn-sm" onClick={markAll} style={{fontSize:11}}>تحديد الكل كمقروء</button>
              </div>
              {notifs.map(n=>(
                <div key={n.id} style={{padding:"10px 16px",borderBottom:"1px solid #F8FAFC",background:n.read?"transparent":"#FEFCE8"}}>
                  <Badge label={n.title} cls={n.type==="warning"?"b-amber":n.type==="success"?"b-green":"b-blue"}/>
                  <p style={{fontSize:12,color:C.muted,marginTop:4}}>{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// 18. DASHBOARD
// ══════════════════════════════════════════════
const DashboardPage=({user})=>{
  const mats=DB.get("rawMaterials"),prods=DB.get("products");
  const sInvs=DB.get("salesInvoices"),pInvs=DB.get("purchaseInvoices");
  const plans=DB.get("productionPlans"),rates=DB.obj("exchangeRates",DEFAULT_RATES);

  // المبيعات دائماً بالدينار
  const totalSalesDZD=sInvs.filter(i=>i.status==="مسلمة").reduce((s,i)=>s+i.total,0);
  // المشتريات بالدينار (مُحوّلة)
  const totalPurchDZD=pInvs.reduce((s,i)=>s+(i.totalDZD||toDZD(i.total,i.currency,rates)),0);
  const invValue=mats.reduce((s,m)=>s+m.qty*toDZD(m.unitCost,m.costCurrency||"DZD",rates),0)+prods.reduce((s,p)=>s+p.qty*p.costPrice,0);
  const lowStock=mats.filter(m=>m.qty<=m.minStock);
  const pending=sInvs.filter(i=>i.status==="بانتظار تجهيز المخزن");

  const monthly=["Jan","Feb","Mar","Apr","May"].map((name,i)=>{
    const mo=String(i+1).padStart(2,"0");
    const s=sInvs.filter(x=>x.invoiceDate?.startsWith(`2024-${mo}`)&&x.status==="مسلمة").reduce((a,x)=>a+x.total,0);
    const p=pInvs.filter(x=>x.invoiceDate?.startsWith(`2024-${mo}`)).reduce((a,x)=>a+(x.totalDZD||toDZD(x.total,x.currency,rates)),0);
    return{name,Sales:Math.round(s/1000),Purchases:Math.round(p/1000)};
  });

  const prodPie=prods.map((p,i)=>{
    const sold=sInvs.flatMap(x=>x.items||[]).filter(it=>Number(it.prodId)===p.id).reduce((s,it)=>s+Number(it.qty),0);
    return{name:p.name.split(" ").slice(0,2).join(" "),value:sold,fill:COLS[i%COLS.length]};
  }).filter(x=>x.value>0);

  return(
    <div>
      <TopBar title={`مرحباً، ${user.name} 👋`}
        subtitle={new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
        user={user}/>
      <div className="g4 mb4">
        <KPI label="إجمالي المبيعات" value={`${T.fmt(totalSalesDZD)} د.ج`} icon="sale" color={C.green} change={12.4}/>
        <KPI label="إجمالي المشتريات" value={`${T.fmt(totalPurchDZD)} د.ج`} icon="buy" color={C.blue} change={-3.2} dir="down" sub="محوّل للدينار"/>
        <KPI label="قيمة المخزون" value={`${T.fmt(invValue)} د.ج`} icon="inv" color={C.purple} change={5.8}/>
        <KPI label="مواد منخفضة" value={lowStock.length} icon="warn" color={C.amber}/>
      </div>

      {/* أسعار الصرف السريعة */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {Object.entries(CURRENCIES).filter(([k])=>k!=="DZD").map(([code,cur])=>{
          const rate=rates[code]||0;
          return(
            <div key={code} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",background:"#fff",borderRadius:10,border:`1px solid ${C.border}`,fontSize:13}}>
              <span style={{fontSize:18}}>{cur.flag}</span>
              <span style={{fontWeight:700}}>1 {cur.symbol}</span>
              <span style={{color:C.muted}}>=</span>
              <span style={{fontWeight:800,color:C.blue,direction:"ltr"}}>{T.fmt(rate)}</span>
              <span style={{color:C.muted,fontSize:11}}>د.ج</span>
            </div>
          );
        })}
      </div>

      <div className="g2 mb4">
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>المبيعات والمشتريات الشهرية (ألف د.ج)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.15}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient>
                <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.15}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TS}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Area type="monotone" dataKey="Sales" name="مبيعات" stroke={C.green} strokeWidth={2} fill="url(#gs)"/>
              <Area type="monotone" dataKey="Purchases" name="مشتريات" stroke={C.blue} strokeWidth={2} fill="url(#gp)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>المنتجات المباعة</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={prodPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({value})=>value}>
              {prodPie.map((e,i)=><Cell key={i} fill={e.fill}/>)}
            </Pie><Tooltip contentStyle={TS}/><Legend wrapperStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>⚠️ التنبيهات</div>
          {lowStock.length===0&&pending.length===0
            ?<div className="alert a-ok">✓ كل شيء بخير</div>
            :<>{lowStock.map(m=><div key={m.id} className="alert a-warn mb2" style={{fontSize:12}}>مادة منخفضة: <strong>{m.name}</strong> ({m.qty} {m.unit})</div>)}
              {pending.map(o=><div key={o.id} className="alert a-info mb2" style={{fontSize:12}}>{o.invoiceNo} تنتظر التجهيز</div>)}</>
          }
        </div>
        <div className="card">
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>آخر فواتير البيع 🇩🇿</div>
          {sInvs.slice(-4).reverse().map(i=>{
            const c=DB.get("customers").find(x=>x.id===Number(i.customerId));
            return(<div key={i.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingBottom:10,borderBottom:`1px solid #F1F5F9`}}>
              <div><div style={{fontSize:13,fontWeight:600}}>{i.invoiceNo}</div><div style={{fontSize:11,color:C.muted}}>{c?.name||"—"}</div></div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:13,fontWeight:700,color:C.blue,direction:"ltr"}}>{T.fmt(i.total)} د.ج</div>
                <Badge label={i.status} cls={smap(i.status)}/>
              </div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// 19. PURCHASE PAGE — فواتير الشراء بالعملة الصعبة + رفع ملف
// ══════════════════════════════════════════════
const PurchasePage=({user})=>{
  const [invs,setInvs]=useState(DB.get("purchaseInvoices"));
  const [modal,setModal]=useState(false);
  const [viewModal,setViewModal]=useState(null);
  const [search,setSearch]=useState("");
  const [form,setForm]=useState({invoiceNo:"",supplierId:"",invoiceDate:T.today(),currency:"USD",exchangeRate:134.8,discount:0});
  const [items,setItems]=useState([{matId:"",qty:1,unitCost:0}]);
  const [attachment,setAttachment]=useState(null);
  const [qrView,setQrView]=useState(null);
  const suppliers=DB.get("suppliers"),materials=DB.get("rawMaterials");
  const rates=DB.obj("exchangeRates",DEFAULT_RATES);

  // حساب الإجماليات
  const calc=()=>{
    const sub=items.reduce((s,i)=>s+Number(i.qty)*Number(i.unitCost),0);
    const total=sub-Number(form.discount);
    const rate=Number(form.exchangeRate)||rates[form.currency]||1;
    return{sub,total,totalDZD:total*rate};
  };
  const {sub,total,totalDZD}=calc();
  const cur=CURRENCIES[form.currency]||CURRENCIES.USD;

  // عند تغيير العملة، نحدث سعر الصرف تلقائياً
  const onCurrencyChange=c=>{
    const rate=rates[c]||1;
    setForm({...form,currency:c,exchangeRate:rate});
  };

  const save=()=>{
    const inv={...form,id:T.id(),items,subtotal:sub,taxAmount:0,total,totalDZD,
      status:"مكتملة",uploadedBy:user.id,
      attachmentName:attachment?.name||null,
      attachmentData:attachment?.data||null,
      attachmentType:attachment?.type||null,
      createdAt:T.today()};
    const list=DB.get("purchaseInvoices");list.push(inv);DB.set("purchaseInvoices",list);
    // تحديث المخزون
    const mats=DB.get("rawMaterials");
    items.forEach(it=>{const i=mats.findIndex(m=>m.id===Number(it.matId));if(i>=0)mats[i].qty=Number(mats[i].qty)+Number(it.qty);});
    DB.set("rawMaterials",mats);
    T.log(user.id,"إضافة فاتورة شراء","المشتريات");
    T.notify("success","فاتورة شراء جديدة",`تم إضافة ${inv.invoiceNo} بعملة ${form.currency}`);
    setInvs(DB.get("purchaseInvoices"));setModal(false);
    setItems([{matId:"",qty:1,unitCost:0}]);setAttachment(null);
  };

  const filtered=invs.filter(i=>i.invoiceNo.includes(search)||(suppliers.find(s=>s.id===Number(i.supplierId))?.name||"").includes(search));

  // عرض المرفق
  const viewAttachment=inv=>{
    if(!inv.attachmentData)return;
    const w=window.open();
    if(inv.attachmentType==="application/pdf"){
      w.document.write(`<iframe src="${inv.attachmentData}" style="width:100%;height:100vh;border:none;"></iframe>`);
    } else {
      w.document.write(`<img src="${inv.attachmentData}" style="max-width:100%;"/>`);
    }
  };

  return(
    <div>
      <TopBar title="🛒 فواتير الشراء" user={user}
        subtitle={`${invs.length} فاتورة — الإجمالي بالدينار: ${T.fmt(invs.reduce((s,i)=>s+(i.totalDZD||0),0))} د.ج`}
        actions={<button className="btn btn-blue btn-sm" onClick={()=>setModal(true)}><Icon n="plus" s={14}/>فاتورة جديدة</button>}/>

      {/* أسعار الصرف */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",padding:"10px 14px",background:"#fff",borderRadius:12,border:`1px solid ${C.border}`}}>
        <span style={{fontSize:12,fontWeight:700,color:C.muted,alignSelf:"center"}}>أسعار الصرف الحالية:</span>
        {Object.entries(CURRENCIES).filter(([k])=>k!=="DZD").map(([code,cur])=>(
          <span key={code} style={{fontSize:13,fontWeight:700,direction:"ltr"}}>
            {cur.flag} 1{cur.symbol} = <span style={{color:C.blue}}>{T.fmt(rates[code])}</span> <span style={{color:C.muted,fontSize:11}}>د.ج</span>
          </span>
        ))}
      </div>

      <div className="card">
        <div style={{display:"flex",gap:10,marginBottom:14}}><SearchBar value={search} onChange={setSearch} placeholder="بحث برقم الفاتورة أو المورد..."/></div>
        <table>
          <thead><tr><th>رقم الفاتورة</th><th>المورد</th><th>التاريخ</th><th>العملة</th><th>المبلغ الأصلي</th><th>المبلغ بالدينار</th><th>الحالة</th><th>مرفق</th><th>QR+طباعة</th></tr></thead>
          <tbody>
            {filtered.map(inv=>{
              const sup=suppliers.find(s=>s.id===Number(inv.supplierId));
              const c=CURRENCIES[inv.currency]||CURRENCIES.DZD;
              return(
                <tr key={inv.id}>
                  <td style={{fontWeight:700,color:C.blue}}>{inv.invoiceNo}</td>
                  <td>{sup?.name||"—"}<div style={{fontSize:11,color:C.muted}}>{sup?.city||""}</div></td>
                  <td style={{direction:"ltr",textAlign:"left"}}>{T.fmtDate(inv.invoiceDate)}</td>
                  <td><CurBadge currency={inv.currency||"DZD"}/></td>
                  <td style={{fontWeight:700,direction:"ltr",textAlign:"left"}}>{T.fmt(inv.total)} {c.symbol}</td>
                  <td style={{fontWeight:800,color:C.primary,direction:"ltr",textAlign:"left"}}>{T.fmt(inv.totalDZD||inv.total)} <span style={{fontSize:11,color:C.muted}}>د.ج</span></td>
                  <td><Badge label={inv.status} cls={smap(inv.status)}/></td>
                  <td>
                    {inv.attachmentData
                      ?<div style={{display:"flex",gap:4}}>
                        <button className="btn-icon" title="معاينة" onClick={()=>viewAttachment(inv)}><Icon n="eye" s={14} c={C.green}/></button>
                        <button className="btn-icon" title="تحميل" onClick={()=>{const a=document.createElement("a");a.href=inv.attachmentData;a.download=inv.attachmentName||"invoice";a.click();}}><Icon n="dwn" s={14} c={C.blue}/></button>
                      </div>
                      :<span style={{fontSize:11,color:C.light}}>لا يوجد</span>
                    }
                  </td>
                  <td><div style={{display:"flex",gap:4,position:"relative"}}>
                    <button className="btn-icon" onClick={()=>setQrView(qrView===inv.id?null:inv.id)}>▦</button>
                    <button className="btn-icon" onClick={()=>printInv(inv,"purchase")}><Icon n="prt" s={14}/></button>
                    {qrView===inv.id&&(
                      <div style={{position:"absolute",left:0,top:"calc(100% + 4px)",background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:14,boxShadow:"0 8px 30px rgba(0,0,0,.12)",zIndex:10,textAlign:"center"}}>
                        <QRCanvas data={JSON.stringify({inv:inv.invoiceNo,cur:inv.currency,total:inv.total,dzd:inv.totalDZD})} size={120}/>
                        <div style={{fontSize:10,color:C.muted,marginTop:6}}>{inv.invoiceNo}</div>
                        <button style={{marginTop:8,width:"100%",padding:"5px",background:C.blue,color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontSize:11}} onClick={()=>setQrView(null)}>إغلاق</button>
                      </div>
                    )}
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal إضافة فاتورة شراء */}
      <Modal open={modal} close={()=>setModal(false)} title="إضافة فاتورة شراء جديدة" size={860}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>إلغاء</button><button className="btn btn-blue" onClick={save}>حفظ وتحديث المخزون</button></>}>
        <div className="g2">
          <div className="fg"><label>رقم الفاتورة</label><input value={form.invoiceNo} onChange={e=>setForm({...form,invoiceNo:e.target.value})} placeholder="PO-2024-XXX"/></div>
          <div className="fg"><label>المورد</label>
            <select value={form.supplierId} onChange={e=>{
              const sup=suppliers.find(s=>s.id===Number(e.target.value));
              const cur=sup?.currency||"USD";
              setForm({...form,supplierId:e.target.value,currency:cur,exchangeRate:rates[cur]||1});
            }}>
              <option value="">اختر المورد</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name} ({s.currency||"USD"})</option>)}
            </select>
          </div>
          <div className="fg"><label>تاريخ الفاتورة</label><input type="date" value={form.invoiceDate} onChange={e=>setForm({...form,invoiceDate:e.target.value})}/></div>

          {/* اختيار العملة */}
          <div className="fg">
            <label>عملة الفاتورة</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {Object.entries(CURRENCIES).filter(([k])=>k!=="DZD").map(([code,c])=>(
                <div key={code} onClick={()=>onCurrencyChange(code)}
                  style={{padding:"10px 8px",borderRadius:10,border:`2px solid ${form.currency===code?C.blue:C.border}`,background:form.currency===code?C.blueSoft:"transparent",cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:22}}>{c.flag}</div>
                  <div style={{fontWeight:700,fontSize:12,color:form.currency===code?C.blue:C.text}}>{code}</div>
                  <div style={{fontSize:11,color:C.muted}}>{c.symbol}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="fg">
            <label>سعر الصرف — 1 {cur.symbol} = كم دينار</label>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input type="number" value={form.exchangeRate} onChange={e=>setForm({...form,exchangeRate:e.target.value})} style={{flex:1}}/>
              <span style={{whiteSpace:"nowrap",color:C.muted,fontSize:13}}>د.ج / {cur.symbol}</span>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>السعر الافتراضي: {rates[form.currency]} د.ج</div>
          </div>

          <div className="fg"><label>الخصم ({cur.symbol})</label><input type="number" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})}/></div>
        </div>

        {/* المواد */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontWeight:700,fontSize:13}}>المواد المشتراة ({cur.flag} {cur.name})</span>
          <button className="btn btn-ghost btn-sm" onClick={()=>setItems([...items,{matId:"",qty:1,unitCost:0}])}><Icon n="plus" s={13}/>إضافة</button>
        </div>
        <table>
          <thead><tr><th>المادة</th><th>الكمية</th><th>التكلفة ({cur.symbol})</th><th>الإجمالي ({cur.symbol})</th><th>—</th></tr></thead>
          <tbody>{items.map((it,idx)=>(
            <tr key={idx}>
              <td><select value={it.matId} onChange={e=>{const n=[...items];n[idx].matId=e.target.value;setItems(n);}}>
                <option value="">اختر</option>{materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select></td>
              <td><input type="number" value={it.qty} style={{width:70}} onChange={e=>{const n=[...items];n[idx].qty=e.target.value;setItems(n);}}/></td>
              <td><input type="number" value={it.unitCost} style={{width:100}} onChange={e=>{const n=[...items];n[idx].unitCost=e.target.value;setItems(n);}}/></td>
              <td style={{fontWeight:600,direction:"ltr",textAlign:"left"}}>{T.fmt(Number(it.qty)*Number(it.unitCost))} {cur.symbol}</td>
              <td><button className="btn-icon" onClick={()=>setItems(items.filter((_,i)=>i!==idx))}><Icon n="del" s={13} c={C.red}/></button></td>
            </tr>
          ))}</tbody>
        </table>

        {/* الإجماليات */}
        <div style={{marginTop:12,background:C.bg,padding:14,borderRadius:10,fontSize:13}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{color:C.muted}}>المجموع الفرعي:</span>
            <strong style={{direction:"ltr"}}>{T.fmt(sub)} {cur.symbol}</strong>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{color:C.muted}}>الخصم:</span>
            <strong style={{direction:"ltr"}}>- {T.fmt(Number(form.discount))} {cur.symbol}</strong>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",borderTop:`2px solid ${C.border}`,paddingTop:8,fontWeight:800,fontSize:15}}>
            <span>الإجمالي بـ {form.currency}:</span>
            <span style={{color:C.blue,direction:"ltr"}}>{T.fmt(total)} {cur.symbol}</span>
          </div>
          <div style={{marginTop:8,padding:"10px 14px",background:"#F0FDF4",borderRadius:8,display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:14}}>
            <span>🇩🇿 بالدينار الجزائري:</span>
            <span style={{color:"#166534",direction:"ltr"}}>{T.fmt(totalDZD)} د.ج</span>
          </div>
        </div>

        {/* رفع الفاتورة */}
        <div style={{marginTop:16}}>
          <FileUpload value={attachment} onChange={setAttachment} label="رفع نسخة الفاتورة (PDF أو صورة)"/>
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════
// 20. SALES PAGE — البيع دائماً بالدينار
// ══════════════════════════════════════════════
const SalesPage=({user})=>{
  const [invs,setInvs]=useState(DB.get("salesInvoices"));
  const [modal,setModal]=useState(false);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("الكل");
  const [form,setForm]=useState({invoiceNo:"",customerId:"",invoiceDate:T.today(),tax:19,discount:0});
  const [items,setItems]=useState([{prodId:"",qty:1,unitPrice:0,discount:0}]);
  const [qrView,setQrView]=useState(null);
  const customers=DB.get("customers"),products=DB.get("products");

  const calc=()=>{
    const sub=items.reduce((s,i)=>s+Number(i.qty)*Number(i.unitPrice)-Number(i.discount||0),0);
    const ta=sub*(Number(form.tax)/100);
    return{sub,ta,total:sub+ta-Number(form.discount)};
  };
  const {sub,ta,total}=calc();
  const statuses=["الكل",...new Set(invs.map(i=>i.status))];
  const filtered=invs.filter(i=>{
    const cn=customers.find(c=>c.id===Number(i.customerId))?.name||"";
    return(i.invoiceNo.includes(search)||cn.includes(search))&&(statusFilter==="الكل"||i.status===statusFilter);
  });

  const save=()=>{
    const inv={...form,id:T.id(),items,currency:"DZD",subtotal:sub,taxAmount:ta,total,
      status:"بانتظار تجهيز المخزن",warehouseStatus:"معلقة",createdBy:user.id,createdAt:T.today()};
    const list=DB.get("salesInvoices");list.push(inv);DB.set("salesInvoices",list);
    T.log(user.id,"إنشاء فاتورة بيع","المبيعات");
    T.notify("info","فاتورة بيع جديدة",`${inv.invoiceNo} — ${T.fmt(total)} د.ج`);
    setInvs(DB.get("salesInvoices"));setModal(false);
    setItems([{prodId:"",qty:1,unitPrice:0,discount:0}]);
  };

  return(
    <div>
      <TopBar title="💰 فواتير البيع" user={user}
        subtitle={`جميع الفواتير بالدينار الجزائري 🇩🇿 — مسلّمة: ${T.fmt(invs.filter(i=>i.status==="مسلمة").reduce((s,i)=>s+i.total,0))} د.ج`}
        actions={<button className="btn btn-blue btn-sm" onClick={()=>setModal(true)}><Icon n="plus" s={14}/>فاتورة بيع جديدة</button>}/>

      {/* شارة الدينار */}
      <div className="alert a-info mb4" style={{fontSize:13}}>
        🇩🇿 <strong>فواتير البيع تُحرر دائماً بالدينار الجزائري (د.ج)</strong> — عملة المبيعات المحلية
      </div>

      <div className="card">
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <SearchBar value={search} onChange={setSearch} placeholder="بحث برقم الفاتورة أو العميل..."/>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{width:200}}>
            {statuses.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <table>
          <thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>التاريخ</th><th>العملة</th><th>الإجمالي</th><th>حالة الفاتورة</th><th>المخزن</th><th>QR + طباعة</th></tr></thead>
          <tbody>{filtered.map(inv=>{
            const cust=customers.find(c=>c.id===Number(inv.customerId));
            return(
              <tr key={inv.id}>
                <td style={{fontWeight:700,color:C.blue}}>{inv.invoiceNo}</td>
                <td>{cust?.name||"—"}<div style={{fontSize:11,color:C.muted}}>{cust?.city||""}</div></td>
                <td style={{direction:"ltr",textAlign:"left"}}>{T.fmtDate(inv.invoiceDate)}</td>
                <td><CurBadge currency="DZD"/></td>
                <td style={{fontWeight:800,color:C.primary,direction:"ltr",textAlign:"left"}}>{T.fmt(inv.total)} <span style={{fontSize:11}}>د.ج</span></td>
                <td><Badge label={inv.status} cls={smap(inv.status)}/></td>
                <td><Badge label={inv.warehouseStatus||"معلقة"} cls={inv.warehouseStatus==="مجهزة"?"b-green":"b-amber"}/></td>
                <td><div style={{display:"flex",gap:4,position:"relative"}}>
                  <button className="btn-icon" onClick={()=>setQrView(qrView===inv.id?null:inv.id)}>▦</button>
                  <button className="btn-icon" onClick={()=>printInv(inv,"sale")}><Icon n="prt" s={14}/></button>
                  {qrView===inv.id&&(
                    <div style={{position:"absolute",left:0,top:"calc(100% + 4px)",background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:14,boxShadow:"0 8px 30px rgba(0,0,0,.12)",zIndex:10,textAlign:"center"}}>
                      <QRCanvas data={JSON.stringify({inv:inv.invoiceNo,cur:"DZD",total:inv.total})} size={120}/>
                      <div style={{fontSize:10,color:C.muted,marginTop:6}}>{inv.invoiceNo} — {T.fmt(inv.total)} د.ج</div>
                      <button style={{marginTop:8,width:"100%",padding:"5px",background:C.blue,color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontSize:11}} onClick={()=>setQrView(null)}>إغلاق</button>
                    </div>
                  )}
                </div></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>

      <Modal open={modal} close={()=>setModal(false)} title="إنشاء فاتورة بيع جديدة 🇩🇿 دينار جزائري" size={860}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>إلغاء</button><button className="btn btn-blue" onClick={save}>إنشاء وإرسال للمخزن</button></>}>
        {/* شارة الدينار */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#F0FDF4",borderRadius:10,marginBottom:16,border:"1px solid #A7F3D0"}}>
          <span style={{fontSize:24}}>🇩🇿</span>
          <div>
            <div style={{fontWeight:700,color:"#166534"}}>عملة البيع: الدينار الجزائري (د.ج)</div>
            <div style={{fontSize:12,color:"#166534"}}>جميع الأسعار والمبالغ بالدينار الجزائري</div>
          </div>
        </div>
        <div className="g2">
          <div className="fg"><label>رقم الفاتورة</label><input value={form.invoiceNo} onChange={e=>setForm({...form,invoiceNo:e.target.value})} placeholder="INV-2024-XXX"/></div>
          <div className="fg"><label>العميل</label>
            <select value={form.customerId} onChange={e=>setForm({...form,customerId:e.target.value})}>
              <option value="">اختر</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="fg"><label>التاريخ</label><input type="date" value={form.invoiceDate} onChange={e=>setForm({...form,invoiceDate:e.target.value})}/></div>
          <div className="fg"><label>الضريبة %</label><input type="number" value={form.tax} onChange={e=>setForm({...form,tax:e.target.value})}/></div>
          <div className="fg"><label>خصم إضافي (د.ج)</label><input type="number" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})}/></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontWeight:700,fontSize:13}}>المنتجات — الأسعار بالدينار الجزائري</span>
          <button className="btn btn-ghost btn-sm" onClick={()=>setItems([...items,{prodId:"",qty:1,unitPrice:0,discount:0}])}><Icon n="plus" s={13}/>إضافة</button>
        </div>
        <table>
          <thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة (د.ج)</th><th>خصم (د.ج)</th><th>الإجمالي (د.ج)</th><th>—</th></tr></thead>
          <tbody>{items.map((it,idx)=>(
            <tr key={idx}>
              <td><select value={it.prodId} onChange={e=>{const n=[...items];n[idx].prodId=e.target.value;const p=products.find(x=>x.id===Number(e.target.value));if(p)n[idx].unitPrice=p.sellPrice;setItems(n);}}>
                <option value="">اختر</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} (متاح: {p.qty})</option>)}
              </select></td>
              <td><input type="number" value={it.qty} style={{width:70}} onChange={e=>{const n=[...items];n[idx].qty=e.target.value;setItems(n);}}/></td>
              <td><input type="number" value={it.unitPrice} style={{width:110}} onChange={e=>{const n=[...items];n[idx].unitPrice=e.target.value;setItems(n);}}/></td>
              <td><input type="number" value={it.discount||0} style={{width:90}} onChange={e=>{const n=[...items];n[idx].discount=e.target.value;setItems(n);}}/></td>
              <td style={{fontWeight:600,direction:"ltr",textAlign:"left"}}>{T.fmt(Number(it.qty)*Number(it.unitPrice)-Number(it.discount||0))}</td>
              <td><button className="btn-icon" onClick={()=>setItems(items.filter((_,i)=>i!==idx))}><Icon n="del" s={13} c={C.red}/></button></td>
            </tr>
          ))}</tbody>
        </table>
        <div style={{marginTop:12,background:C.bg,padding:14,borderRadius:10,fontSize:13}}>
          {[["المجموع الفرعي",`${T.fmt(sub)} د.ج`],[`الضريبة (${form.tax}%)`,`${T.fmt(ta)} د.ج`],[`الخصم`,`- ${T.fmt(Number(form.discount))} د.ج`]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:C.muted}}>{l}:</span><strong style={{direction:"ltr"}}>{v}</strong></div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",borderTop:`2px solid ${C.border}`,paddingTop:8,fontWeight:800,fontSize:16,color:C.primary}}>
            <span>🇩🇿 الإجمالي:</span><span style={{direction:"ltr"}}>{T.fmt(total)} د.ج</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════
// 21. CURRENCY SETTINGS PAGE
// ══════════════════════════════════════════════
const CurrencyPage=({user})=>(
  <div>
    <TopBar title="💱 أسعار الصرف" user={user}
      subtitle="إدارة أسعار صرف العملات مقابل الدينار الجزائري"/>
    <div className="alert a-info mb4">
      💡 الاستيراد يكون بالعملة الصعبة (€ £ $) — البيع يكون بالدينار الجزائري دائماً (د.ج)
    </div>
    <ExchangeRates/>
    <div className="card">
      <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>العملات المدعومة</div>
      <div className="g2">
        {Object.entries(CURRENCIES).map(([code,cur])=>(
          <div key={code} style={{padding:16,background:C.bg,borderRadius:12,border:`1px solid ${C.border}`,display:"flex",gap:14,alignItems:"center"}}>
            <div style={{fontSize:36}}>{cur.flag}</div>
            <div>
              <div style={{fontWeight:800,fontSize:16}}>{cur.symbol} — {cur.name}</div>
              <div style={{fontSize:12,color:C.muted}}>{code}</div>
              <Badge label={cur.type==="local"?"عملة محلية":"عملة أجنبية"} cls={cur.type==="local"?"b-green":"b-blue"}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════
// 22. INVENTORY PAGE
// ══════════════════════════════════════════════
const InventoryPage=({user})=>{
  const [data,setData]=useState(DB.get("rawMaterials"));
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({code:"",name:"",category:"",supplierId:"",unit:"كيلوجرام",qty:0,minStock:0,unitCost:0,costCurrency:"DZD"});
  const suppliers=DB.get("suppliers"),rates=DB.obj("exchangeRates",DEFAULT_RATES);
  const filtered=data.filter(m=>m.name.includes(search)||m.code.includes(search));

  const save=()=>{
    const list=DB.get("rawMaterials");
    if(editing){const i=list.findIndex(m=>m.id===editing.id);list[i]={...editing,...form,qty:Number(form.qty),minStock:Number(form.minStock),unitCost:Number(form.unitCost)};}
    else list.push({...form,id:T.id(),qty:Number(form.qty),minStock:Number(form.minStock),unitCost:Number(form.unitCost),createdBy:user.id,createdAt:T.today()});
    DB.set("rawMaterials",list);setData(DB.get("rawMaterials"));setModal(false);
  };

  return(
    <div>
      <TopBar title="📦 المواد الأولية" user={user}
        subtitle={`${data.length} مادة — القيمة بالدينار: ${T.fmt(data.reduce((s,m)=>s+m.qty*toDZD(m.unitCost,m.costCurrency||"DZD",rates),0))} د.ج`}
        actions={<button className="btn btn-blue btn-sm" onClick={()=>{setEditing(null);setForm({code:"",name:"",category:"",supplierId:"",unit:"كيلوجرام",qty:0,minStock:0,unitCost:0,costCurrency:"DZD"});setModal(true);}}><Icon n="plus" s={14}/>إضافة مادة</button>}/>
      <div className="card">
        <div style={{marginBottom:14}}><SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو الكود..."/></div>
        <table>
          <thead><tr><th>الكود</th><th>المادة</th><th>الكمية</th><th>الحد الأدنى</th><th>تكلفة الوحدة</th><th>عملة التكلفة</th><th>التكلفة بالدينار</th><th>الحالة</th><th>إجراء</th></tr></thead>
          <tbody>{filtered.map(m=>{
            const sup=suppliers.find(s=>s.id===Number(m.supplierId));
            const costDZD=toDZD(m.unitCost,m.costCurrency||"DZD",rates);
            return(
              <tr key={m.id}>
                <td><code style={{background:C.bg,padding:"2px 7px",borderRadius:6,fontSize:11,fontWeight:700}}>{m.code}</code></td>
                <td><div style={{fontWeight:600}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{sup?.name||"—"}</div></td>
                <td><div style={{fontWeight:700,color:m.qty<=m.minStock?C.red:C.green,direction:"ltr",textAlign:"left"}}>{m.qty} {m.unit}</div></td>
                <td style={{color:C.muted,direction:"ltr",textAlign:"left"}}>{m.minStock}</td>
                <td style={{direction:"ltr",textAlign:"left"}}>{T.fmt(m.unitCost)} {CURRENCIES[m.costCurrency||"DZD"]?.symbol}</td>
                <td><CurBadge currency={m.costCurrency||"DZD"}/></td>
                <td style={{fontWeight:700,color:C.blue,direction:"ltr",textAlign:"left"}}>{T.fmt(costDZD)} <span style={{fontSize:11,color:C.muted}}>د.ج</span></td>
                <td>{m.qty<=m.minStock?<Badge label="منخفض ⚠" cls="b-amber"/>:<Badge label="متوفر ✓" cls="b-green"/>}</td>
                <td><button className="btn-icon" onClick={()=>{setEditing(m);setForm(m);setModal(true);}}><Icon n="edit" s={14}/></button></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <Modal open={modal} close={()=>setModal(false)} title={editing?"تعديل مادة":"إضافة مادة أولية"}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>إلغاء</button><button className="btn btn-blue" onClick={save}>حفظ</button></>}>
        <div className="g2">
          {[["code","كود المادة"],["name","اسم المادة"],["category","التصنيف"],["qty","الكمية"],["minStock","الحد الأدنى"],["unitCost","تكلفة الوحدة"]].map(([k,l])=>(
            <div key={k} className="fg"><label>{l}</label><input type={["qty","minStock","unitCost"].includes(k)?"number":"text"} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>
          ))}
          <div className="fg"><label>عملة التكلفة</label>
            <select value={form.costCurrency} onChange={e=>setForm({...form,costCurrency:e.target.value})}>
              {Object.entries(CURRENCIES).map(([k,v])=><option key={k} value={k}>{v.flag} {v.name} ({v.symbol})</option>)}
            </select>
          </div>
          <div className="fg"><label>وحدة القياس</label>
            <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}>
              {["كيلوجرام","لتر","قطعة","متر","طن","جرام"].map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="fg"><label>المورد</label>
            <select value={form.supplierId} onChange={e=>setForm({...form,supplierId:e.target.value})}>
              <option value="">اختر</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        {form.unitCost>0&&form.costCurrency&&form.costCurrency!=="DZD"&&(
          <div className="alert a-info">التكلفة بالدينار: <strong>{T.fmt(toDZD(form.unitCost,form.costCurrency,rates))} د.ج</strong></div>
        )}
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════
// 23. PRODUCTS PAGE
// ══════════════════════════════════════════════
const ProductsPage=({user})=>{
  const [data,setData]=useState(DB.get("products"));
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({code:"",name:"",category:"",unit:"قطعة",qty:0,minStock:0,costPrice:0,sellPrice:0,batchNumber:""});
  const filtered=data.filter(p=>p.name.includes(search)||p.code.includes(search));

  const save=()=>{
    const list=DB.get("products");
    if(editing){const i=list.findIndex(p=>p.id===editing.id);list[i]={...editing,...form};}
    else list.push({...form,id:T.id(),createdAt:T.today()});
    DB.set("products",list);setData(DB.get("products"));setModal(false);
  };

  return(
    <div>
      <TopBar title="🏷 المنتجات النهائية" user={user}
        subtitle={`الأسعار بالدينار الجزائري 🇩🇿 — قيمة المخزون: ${T.fmt(data.reduce((s,p)=>s+p.qty*p.costPrice,0))} د.ج`}
        actions={<button className="btn btn-blue btn-sm" onClick={()=>{setEditing(null);setForm({code:"",name:"",category:"",unit:"قطعة",qty:0,minStock:0,costPrice:0,sellPrice:0,batchNumber:""});setModal(true);}}><Icon n="plus" s={14}/>منتج جديد</button>}/>
      <div className="card">
        <div style={{marginBottom:14}}><SearchBar value={search} onChange={setSearch}/></div>
        <table>
          <thead><tr><th>الكود</th><th>المنتج</th><th>الكمية</th><th>تكلفة الإنتاج (د.ج)</th><th>سعر البيع (د.ج)</th><th>هامش الربح</th><th>الحالة</th><th>إجراء</th></tr></thead>
          <tbody>{filtered.map(p=>{
            const m=p.sellPrice>0?((p.sellPrice-p.costPrice)/p.sellPrice*100).toFixed(1):0;
            return(
              <tr key={p.id}>
                <td><code style={{background:C.bg,padding:"2px 7px",borderRadius:6,fontSize:11}}>{p.code}</code></td>
                <td><div style={{fontWeight:600}}>{p.name}</div><div style={{fontSize:11,color:C.muted}}>{p.batchNumber}</div></td>
                <td style={{fontWeight:700,color:p.qty<=p.minStock?C.red:C.green,direction:"ltr",textAlign:"left"}}>{p.qty} {p.unit}</td>
                <td style={{direction:"ltr",textAlign:"left"}}>{T.fmt(p.costPrice)} <span style={{fontSize:11,color:C.muted}}>د.ج</span></td>
                <td style={{fontWeight:700,color:C.blue,direction:"ltr",textAlign:"left"}}>{T.fmt(p.sellPrice)} <span style={{fontSize:11,color:C.muted}}>د.ج</span></td>
                <td><Badge label={`${m}%`} cls={Number(m)>=25?"b-green":Number(m)>=15?"b-amber":"b-red"}/></td>
                <td>{p.qty<=p.minStock?<Badge label="منخفض ⚠" cls="b-amber"/>:<Badge label="متوفر ✓" cls="b-green"/>}</td>
                <td><button className="btn-icon" onClick={()=>{setEditing(p);setForm(p);setModal(true);}}><Icon n="edit" s={14}/></button></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <Modal open={modal} close={()=>setModal(false)} title={editing?"تعديل منتج":"إضافة منتج نهائي"}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>إلغاء</button><button className="btn btn-blue" onClick={save}>حفظ</button></>}>
        <div className="alert a-info mb3">جميع الأسعار بالدينار الجزائري 🇩🇿</div>
        <div className="g2">
          {[["code","كود المنتج"],["name","اسم المنتج"],["category","التصنيف"],["batchNumber","رقم الدفعة"],["qty","الكمية"],["minStock","الحد الأدنى"],["costPrice","تكلفة الإنتاج (د.ج)"],["sellPrice","سعر البيع (د.ج)"]].map(([k,l])=>(
            <div key={k} className="fg"><label>{l}</label><input type={["qty","minStock","costPrice","sellPrice"].includes(k)?"number":"text"} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>
          ))}
          <div className="fg"><label>وحدة القياس</label>
            <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}>
              {["قطعة","كيلوجرام","لتر","متر"].map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        {form.sellPrice>0&&form.costPrice>0&&(
          <div className="alert a-ok">هامش الربح: <strong>{((form.sellPrice-form.costPrice)/form.sellPrice*100).toFixed(1)}%</strong> — ربح الوحدة: <strong>{T.fmt(form.sellPrice-form.costPrice)} د.ج</strong></div>
        )}
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════
// 24. REMAINING PAGES (BOM, Production, Warehouse, HR, Reports, Users, Settings, Audit)
// ══════════════════════════════════════════════
const BOMPage=({user})=>{
  const [boms,setBoms]=useState(DB.get("bom"));
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({productId:"",version:"1.0",wastePercent:5});
  const [bomItems,setBomItems]=useState([{matId:"",qty:1,unit:"كيلوجرام",type:"raw"}]);
  const products=DB.get("products"),materials=DB.get("rawMaterials"),rates=DB.obj("exchangeRates",DEFAULT_RATES);
  const calcCost=()=>bomItems.reduce((s,i)=>{const m=materials.find(x=>x.id===Number(i.matId));return s+(m?toDZD(m.unitCost,m.costCurrency||"DZD",rates)*Number(i.qty):0);},0);
  const save=()=>{
    const bom={...form,id:T.id(),items:bomItems,estimatedCost:calcCost(),active:true,createdBy:user.id};
    const list=DB.get("bom");list.push(bom);DB.set("bom",list);setBoms(DB.get("bom"));setModal(false);
  };
  return(
    <div>
      <TopBar title="📋 وصفات التصنيع BOM" user={user} subtitle="التكاليف محسوبة بالدينار الجزائري"
        actions={<button className="btn btn-blue btn-sm" onClick={()=>{setForm({productId:"",version:"1.0",wastePercent:5});setBomItems([{matId:"",qty:1,unit:"كيلوجرام",type:"raw"}]);setModal(true);}}><Icon n="plus" s={14}/>وصفة جديدة</button>}/>
      <div className="g2">{boms.map(bom=>{
        const prod=products.find(p=>p.id===Number(bom.productId));
        return(<div key={bom.id} className="card">
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <div><div style={{fontWeight:700,fontSize:15}}>{prod?.name||"—"}</div><div style={{fontSize:12,color:C.muted}}>الإصدار {bom.version} | هالك: {bom.wastePercent}%</div></div>
            <div style={{textAlign:"left"}}><div style={{fontSize:20,fontWeight:800,color:C.amber,direction:"ltr"}}>{T.fmt(bom.estimatedCost)}</div><div style={{fontSize:11,color:C.muted}}>د.ج / وحدة</div></div>
          </div>
          <table><thead><tr><th>المادة</th><th>الكمية</th><th>النوع</th></tr></thead>
          <tbody>{(bom.items||[]).map((it,i)=>{const mat=materials.find(m=>m.id===Number(it.matId));return(<tr key={i}><td>{mat?.name||"—"}</td><td style={{direction:"ltr",textAlign:"left"}}>{it.qty} {it.unit}</td><td><Badge label={it.type==="raw"?"مادة خام":"تغليف"} cls={it.type==="raw"?"b-blue":"b-amber"}/></td></tr>);})}
          </tbody></table>
        </div>);
      })}</div>
      <Modal open={modal} close={()=>setModal(false)} title="وصفة تصنيع جديدة" size={820}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>إلغاء</button><button className="btn btn-blue" onClick={save}>حفظ</button></>}>
        <div className="g2">
          <div className="fg"><label>المنتج</label><select value={form.productId} onChange={e=>setForm({...form,productId:e.target.value})}><option value="">اختر</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="fg"><label>الإصدار</label><input value={form.version} onChange={e=>setForm({...form,version:e.target.value})}/></div>
          <div className="fg"><label>نسبة الهالك %</label><input type="number" value={form.wastePercent} onChange={e=>setForm({...form,wastePercent:e.target.value})}/></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontWeight:700,fontSize:13}}>المواد</span>
          <button className="btn btn-ghost btn-sm" onClick={()=>setBomItems([...bomItems,{matId:"",qty:1,unit:"كيلوجرام",type:"raw"}])}><Icon n="plus" s={13}/>إضافة</button>
        </div>
        <table><thead><tr><th>المادة</th><th>الكمية</th><th>الوحدة</th><th>النوع</th><th>—</th></tr></thead>
        <tbody>{bomItems.map((it,idx)=>(
          <tr key={idx}>
            <td><select value={it.matId} onChange={e=>{const n=[...bomItems];n[idx].matId=e.target.value;setBomItems(n);}}><option value="">اختر</option>{materials.map(m=><option key={m.id} value={m.id}>{m.name} ({CURRENCIES[m.costCurrency||"DZD"]?.symbol})</option>)}</select></td>
            <td><input type="number" value={it.qty} style={{width:80}} onChange={e=>{const n=[...bomItems];n[idx].qty=e.target.value;setBomItems(n);}}/></td>
            <td><select value={it.unit} style={{width:100}} onChange={e=>{const n=[...bomItems];n[idx].unit=e.target.value;setBomItems(n);}}>{["كيلوجرام","لتر","قطعة","متر"].map(u=><option key={u}>{u}</option>)}</select></td>
            <td><select value={it.type} onChange={e=>{const n=[...bomItems];n[idx].type=e.target.value;setBomItems(n);}}><option value="raw">مادة خام</option><option value="packaging">تغليف</option></select></td>
            <td><button className="btn-icon" onClick={()=>setBomItems(bomItems.filter((_,i)=>i!==idx))}><Icon n="del" s={13} c={C.red}/></button></td>
          </tr>
        ))}</tbody></table>
        <div style={{marginTop:10,padding:10,background:C.bg,borderRadius:8,fontWeight:700}}>
          التكلفة التقديرية: <span style={{color:C.amber,fontSize:16,direction:"ltr"}}>{T.fmt(calcCost())} د.ج</span>
        </div>
      </Modal>
    </div>
  );
};

const ProductionPage=({user})=>{
  const [plans,setPlans]=useState(DB.get("productionPlans"));
  const [modal,setModal]=useState(false);
  const [actModal,setActModal]=useState(false);
  const [sel,setSel]=useState(null);
  const [form,setForm]=useState({productId:"",bomId:"",plannedQty:100,plannedDate:T.today(),notes:""});
  const [actForm,setActForm]=useState({actualQty:0,wasteQty:0,notes:""});
  const products=DB.get("products"),boms=DB.get("bom"),materials=DB.get("rawMaterials");
  const savePlan=()=>{
    const plan={...form,id:T.id(),status:"قيد الانتظار",createdBy:user.id,createdAt:T.today()};
    const list=DB.get("productionPlans");list.push(plan);DB.set("productionPlans",list);setPlans(DB.get("productionPlans"));setModal(false);
  };
  const executeActual=()=>{
    const list=DB.get("productionPlans"),idx=list.findIndex(p=>p.id===sel.id);
    list[idx]={...list[idx],status:"مكتملة",actualQty:Number(actForm.actualQty),wasteQty:Number(actForm.wasteQty)};
    DB.set("productionPlans",list);
    const bom=boms.find(b=>b.id===Number(sel.bomId));
    if(bom){const mats=DB.get("rawMaterials");(bom.items||[]).forEach(it=>{const i=mats.findIndex(m=>m.id===Number(it.matId));if(i>=0)mats[i].qty=Math.max(0,Number(mats[i].qty)-Number(it.qty)*Number(actForm.actualQty));});DB.set("rawMaterials",mats);}
    const prods=DB.get("products"),pi=prods.findIndex(p=>p.id===Number(sel.productId));
    if(pi>=0){prods[pi].qty=Number(prods[pi].qty)+Number(actForm.actualQty);DB.set("products",prods);}
    T.log(user.id,"تسجيل تصنيع فعلي","الإنتاج");setPlans(DB.get("productionPlans"));setActModal(false);
  };
  return(
    <div>
      <TopBar title="🏭 خطط التصنيع" user={user}
        actions={<button className="btn btn-blue btn-sm" onClick={()=>{setForm({productId:"",bomId:"",plannedQty:100,plannedDate:T.today(),notes:""});setModal(true);}}><Icon n="plus" s={14}/>خطة جديدة</button>}/>
      <div className="g4 mb4">{["قيد الانتظار","قيد التصنيع","مكتملة","ملغاة"].map(s=>(
        <div key={s} className="kpi"><div className="kpi-l">{s}</div>
          <div className="kpi-v" style={{color:s==="مكتملة"?C.green:s==="قيد التصنيع"?C.blue:s==="ملغاة"?C.red:C.amber,fontSize:36,direction:"ltr"}}>{plans.filter(p=>p.status===s).length}</div>
        </div>
      ))}</div>
      <div className="card"><table>
        <thead><tr><th>المنتج</th><th>الكمية المخططة</th><th>التاريخ</th><th>الكمية الفعلية</th><th>الهالك</th><th>الكفاءة</th><th>الحالة</th><th>إجراء</th></tr></thead>
        <tbody>{plans.map(plan=>{
          const prod=products.find(p=>p.id===Number(plan.productId));
          const eff=plan.actualQty?(plan.actualQty/plan.plannedQty*100).toFixed(1):null;
          return(<tr key={plan.id}>
            <td style={{fontWeight:600}}>{prod?.name||"—"}</td>
            <td style={{direction:"ltr",textAlign:"left"}}>{plan.plannedQty} {prod?.unit}</td>
            <td style={{direction:"ltr",textAlign:"left"}}>{T.fmtDate(plan.plannedDate)}</td>
            <td style={{fontWeight:700,color:plan.actualQty?C.green:C.muted,direction:"ltr",textAlign:"left"}}>{plan.actualQty||"—"}</td>
            <td style={{color:plan.wasteQty>0?C.red:C.muted,direction:"ltr",textAlign:"left"}}>{plan.wasteQty||"—"}</td>
            <td>{eff?<Badge label={`${eff}%`} cls={Number(eff)>=90?"b-green":Number(eff)>=70?"b-amber":"b-red"}/>:"—"}</td>
            <td><Badge label={plan.status} cls={smap(plan.status)||"b-gray"}/></td>
            <td>{plan.status==="قيد الانتظار"&&<button className="btn btn-green btn-sm" onClick={()=>{setSel(plan);setActForm({actualQty:plan.plannedQty,wasteQty:0,notes:""});setActModal(true);}}><Icon n="chk" s={13}/>تسجيل</button>}</td>
          </tr>);
        })}</tbody>
      </table></div>
      <Modal open={modal} close={()=>setModal(false)} title="خطة تصنيع جديدة"
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>إلغاء</button><button className="btn btn-blue" onClick={savePlan}>إنشاء</button></>}>
        <div className="g2">
          <div className="fg"><label>المنتج</label><select value={form.productId} onChange={e=>setForm({...form,productId:e.target.value})}><option value="">اختر</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="fg"><label>وصفة التصنيع</label><select value={form.bomId} onChange={e=>setForm({...form,bomId:e.target.value})}><option value="">اختر</option>{boms.filter(b=>!form.productId||b.productId===Number(form.productId)).map(b=><option key={b.id} value={b.id}>الإصدار {b.version}</option>)}</select></div>
          <div className="fg"><label>الكمية المخططة</label><input type="number" value={form.plannedQty} onChange={e=>setForm({...form,plannedQty:e.target.value})}/></div>
          <div className="fg"><label>تاريخ التصنيع</label><input type="date" value={form.plannedDate} onChange={e=>setForm({...form,plannedDate:e.target.value})}/></div>
          <div className="fg" style={{gridColumn:"span 2"}}><label>ملاحظات</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></div>
        </div>
      </Modal>
      <Modal open={actModal} close={()=>setActModal(false)} title="تسجيل التصنيع الفعلي"
        footer={<><button className="btn btn-ghost" onClick={()=>setActModal(false)}>إلغاء</button><button className="btn btn-green" onClick={executeActual}><Icon n="chk" s={14}/>تأكيد</button></>}>
        {sel&&<><div className="alert a-warn mb3">سيتم خصم المواد الأولية تلقائياً</div>
          <div className="g2">
            <div className="fg"><label>الكمية الفعلية</label><input type="number" value={actForm.actualQty} onChange={e=>setActForm({...actForm,actualQty:e.target.value})}/></div>
            <div className="fg"><label>الهالك</label><input type="number" value={actForm.wasteQty} onChange={e=>setActForm({...actForm,wasteQty:e.target.value})}/></div>
          </div>
          <div style={{background:C.bg,padding:12,borderRadius:10,fontSize:13}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span>المخطط:</span><strong style={{direction:"ltr"}}>{sel.plannedQty}</strong></div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>الفرق:</span>
              <strong style={{color:Number(actForm.actualQty)>=sel.plannedQty?C.green:C.red,direction:"ltr"}}>{Number(actForm.actualQty)-sel.plannedQty} ({sel.plannedQty>0?((Number(actForm.actualQty)/sel.plannedQty)*100).toFixed(1):0}%)</strong>
            </div>
          </div>
        </>}
      </Modal>
    </div>
  );
};

const WarehousePage=({user})=>{
  const [invs,setInvs]=useState(DB.get("salesInvoices"));
  const customers=DB.get("customers"),products=DB.get("products");
  const pending=invs.filter(i=>i.status==="بانتظار تجهيز المخزن");
  const confirm=(inv)=>{
    const prods=DB.get("products");
    inv.items.forEach(it=>{const i=prods.findIndex(p=>p.id===Number(it.prodId));if(i>=0)prods[i].qty=Math.max(0,Number(prods[i].qty)-Number(it.qty));});
    DB.set("products",prods);
    const list=DB.get("salesInvoices"),idx=list.findIndex(i=>i.id===inv.id);
    list[idx]={...list[idx],status:"جاهزة",warehouseStatus:"مجهزة",preparedBy:user.id};
    DB.set("salesInvoices",list);T.log(user.id,"تجهيز طلب","المخزن");setInvs(DB.get("salesInvoices"));
  };
  return(
    <div>
      <TopBar title="🚚 تجهيز الطلبات" user={user} subtitle={`${pending.length} طلب ينتظر`}/>
      {pending.length===0?<div className="alert a-ok">✓ لا توجد طلبات معلقة</div>
      :pending.map(inv=>{
        const cust=customers.find(c=>c.id===Number(inv.customerId));
        const ok=inv.items.every(it=>{const p=products.find(x=>x.id===Number(it.prodId));return p&&p.qty>=Number(it.qty);});
        return(<div key={inv.id} className="card" style={{borderRight:`4px solid ${ok?C.blue:C.amber}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div><div style={{fontSize:16,fontWeight:800}}>{inv.invoiceNo}</div><div style={{fontSize:13,color:C.muted}}>{cust?.name||"—"} | {T.fmtDate(inv.invoiceDate)}</div></div>
            <div style={{textAlign:"left"}}><div style={{fontSize:20,fontWeight:800,color:C.primary,direction:"ltr",marginBottom:8}}>{T.fmt(inv.total)} د.ج</div>
              <button className="btn btn-green btn-sm" onClick={()=>confirm(inv)} disabled={!ok}><Icon n="chk" s={13}/>تأكيد التجهيز</button>
            </div>
          </div>
          <table><thead><tr><th>المنتج</th><th>المطلوب</th><th>المتوفر</th><th>الحالة</th></tr></thead>
          <tbody>{inv.items.map((it,i)=>{
            const p=products.find(x=>x.id===Number(it.prodId));const avail=p?.qty||0;
            return(<tr key={i}><td style={{fontWeight:600}}>{p?.name||"—"}</td>
              <td style={{direction:"ltr",textAlign:"left"}}>{it.qty}</td>
              <td style={{fontWeight:700,color:avail>=it.qty?C.green:C.red,direction:"ltr",textAlign:"left"}}>{avail}</td>
              <td>{avail>=it.qty?<Badge label="متوفر ✓" cls="b-green"/>:<Badge label={`ناقص ${it.qty-avail}`} cls="b-red"/>}</td>
            </tr>);
          })}</tbody></table>
        </div>);
      })}
    </div>
  );
};

const HRPage=({user})=>{
  const [tab,setTab]=useState("employees");
  const [employees,setEmployees]=useState(DB.get("employees"));
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({empNo:"",name:"",dept:"",position:"",hireDate:T.today(),basicSalary:0,allowances:0});
  const attendance=DB.get("attendance");
  const getAtt=eId=>{const r=attendance.filter(a=>a.empId===eId);return{present:r.filter(a=>a.status==="حضور").length,absent:r.filter(a=>a.status==="غياب").length};};
  const calcNet=e=>{const att=getAtt(e.id),dr=(Number(e.basicSalary)+Number(e.allowances))/30;return Number(e.basicSalary)+Number(e.allowances)-att.absent*dr;};
  const save=()=>{
    const list=DB.get("employees");
    if(form.id){const i=list.findIndex(e=>e.id===form.id);list[i]={...list[i],...form};}
    else list.push({...form,id:T.id(),active:true});
    DB.set("employees",list);setEmployees(DB.get("employees"));setModal(false);
  };
  return(
    <div>
      <TopBar title="👥 الموارد البشرية" user={user}
        subtitle={`الرواتب بالدينار الجزائري — إجمالي: ${T.fmt(employees.reduce((s,e)=>s+calcNet(e),0))} د.ج`}/>
      <div className="tabs">
        {[["employees","الموظفون"],["salary","كشف الرواتب"],["attendance","الحضور"]].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      {tab==="employees"&&<>
        <div style={{marginBottom:14}}><button className="btn btn-blue btn-sm" onClick={()=>{setForm({empNo:"",name:"",dept:"",position:"",hireDate:T.today(),basicSalary:0,allowances:0});setModal(true);}}><Icon n="plus" s={14}/>إضافة موظف</button></div>
        <div className="g2">{employees.map(e=>{
          const att=getAtt(e.id),net=calcNet(e);
          return(<div key={e.id} className="card">
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
              <div style={{width:48,height:48,background:"linear-gradient(135deg,#2563EB,#7C3AED)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",flexShrink:0}}>{e.name.slice(0,2)}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15}}>{e.name}</div>
                <div style={{fontSize:12,color:C.muted}}>{e.position} | {e.dept}</div>
                <div style={{display:"flex",gap:4,marginTop:6}}>
                  <Badge label={`حضور: ${att.present}`} cls="b-green"/>
                  {att.absent>0&&<Badge label={`غياب: ${att.absent}`} cls="b-red"/>}
                </div>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:17,fontWeight:800,color:C.primary,direction:"ltr"}}>{T.fmt(net)}</div>
                <div style={{fontSize:11,color:C.muted}}>د.ج صافي</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{width:"100%"}} onClick={()=>{setForm({...e});setModal(true);}}><Icon n="edit" s={12}/>تعديل</button>
          </div>);
        })}</div>
      </>}
      {tab==="salary"&&<div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>كشف رواتب — أبريل 2024 (بالدينار الجزائري)</div>
        <table><thead><tr><th>الموظف</th><th>الراتب الأساسي (د.ج)</th><th>البدلات (د.ج)</th><th>حضور</th><th>غياب</th><th>صافي الراتب (د.ج)</th></tr></thead>
        <tbody>{employees.map(e=>{
          const att=getAtt(e.id),net=calcNet(e);
          return(<tr key={e.id}>
            <td style={{fontWeight:600}}>{e.name}</td>
            <td style={{direction:"ltr",textAlign:"left"}}>{T.fmt(e.basicSalary)}</td>
            <td style={{direction:"ltr",textAlign:"left"}}>{T.fmt(e.allowances)}</td>
            <td style={{color:C.green,fontWeight:700,direction:"ltr",textAlign:"left"}}>{att.present}</td>
            <td style={{color:att.absent>0?C.red:C.muted,direction:"ltr",textAlign:"left"}}>{att.absent}</td>
            <td style={{fontWeight:800,color:C.primary,direction:"ltr",textAlign:"left",fontSize:14}}>{T.fmt(net)} <span style={{fontSize:11,color:C.muted}}>د.ج</span></td>
          </tr>);
        })}</tbody></table>
        <div style={{marginTop:12,padding:12,background:C.bg,borderRadius:10,display:"flex",justifyContent:"space-between"}}>
          <span style={{color:C.muted}}>الإجمالي:</span>
          <strong style={{color:C.primary,direction:"ltr",fontSize:16}}>{T.fmt(employees.reduce((s,e)=>s+calcNet(e),0))} د.ج</strong>
        </div>
      </div>}
      {tab==="attendance"&&<div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>تقرير الحضور — أبريل 2024</div>
        <table><thead><tr><th>الموظف</th><th>القسم</th><th>حضور</th><th>غياب</th><th>نسبة الحضور</th></tr></thead>
        <tbody>{employees.map(e=>{
          const att=getAtt(e.id),total=att.present+att.absent,pct=total>0?Math.round(att.present/total*100):100;
          return(<tr key={e.id}><td style={{fontWeight:600}}>{e.name}</td><td>{e.dept}</td>
            <td style={{color:C.green,fontWeight:700,direction:"ltr",textAlign:"left"}}>{att.present}</td>
            <td style={{color:att.absent>0?C.red:C.muted,direction:"ltr",textAlign:"left"}}>{att.absent}</td>
            <td><div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,height:6,background:C.border,borderRadius:3}}><div style={{width:`${pct}%`,height:"100%",background:pct>=90?C.green:C.amber,borderRadius:3}}/></div>
              <span style={{fontSize:12,fontWeight:700,direction:"ltr",minWidth:34}}>{pct}%</span>
            </div></td>
          </tr>);
        })}</tbody></table>
      </div>}
      <Modal open={modal} close={()=>setModal(false)} title={form.id?"تعديل موظف":"موظف جديد"}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>إلغاء</button><button className="btn btn-blue" onClick={save}>حفظ</button></>}>
        <div className="alert a-info mb3">الراتب والبدلات بالدينار الجزائري 🇩🇿</div>
        <div className="g2">
          {[["empNo","الرقم الوظيفي"],["name","الاسم الكامل"],["dept","القسم"],["position","الوظيفة"],["hireDate","تاريخ التعيين"],["basicSalary","الراتب الأساسي (د.ج)"],["allowances","البدلات (د.ج)"]].map(([k,l])=>(
            <div key={k} className="fg"><label>{l}</label><input type={["hireDate"].includes(k)?"date":["basicSalary","allowances"].includes(k)?"number":"text"} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

const ReportsPage=({user})=>{
  const [tab,setTab]=useState("overview");
  const mats=DB.get("rawMaterials"),prods=DB.get("products");
  const sInvs=DB.get("salesInvoices"),pInvs=DB.get("purchaseInvoices");
  const customers=DB.get("customers"),rates=DB.obj("exchangeRates",DEFAULT_RATES);

  const totalSalesDZD=sInvs.filter(i=>i.status==="مسلمة").reduce((s,i)=>s+i.total,0);
  const totalPurchDZD=pInvs.reduce((s,i)=>s+(i.totalDZD||toDZD(i.total,i.currency,rates)),0);
  const cogs=sInvs.filter(i=>i.status==="مسلمة").flatMap(i=>i.items||[]).reduce((s,it)=>{const p=prods.find(x=>x.id===Number(it.prodId));return s+(p?p.costPrice*Number(it.qty):0);},0);
  const profit=totalSalesDZD-cogs;

  const monthly=["Jan","Feb","Mar","Apr","May"].map((name,i)=>{
    const mo=String(i+1).padStart(2,"0");
    const s=sInvs.filter(x=>x.invoiceDate?.startsWith(`2024-${mo}`)&&x.status==="مسلمة").reduce((a,x)=>a+x.total,0);
    const p=pInvs.filter(x=>x.invoiceDate?.startsWith(`2024-${mo}`)).reduce((a,x)=>a+(x.totalDZD||toDZD(x.total,x.currency,rates)),0);
    return{name,Sales:Math.round(s/1000),Purchases:Math.round(p/1000)};
  });

  return(
    <div>
      <TopBar title="📈 التقارير والتحليلات" user={user} subtitle="جميع المبالغ بالدينار الجزائري 🇩🇿"/>
      <div className="tabs">
        {[["overview","ملخص"],["sales","المبيعات"],["inventory","المخزون"],["finance","المالية"]].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      {tab==="overview"&&<>
        <div className="g4 mb4">
          <KPI label="إجمالي المبيعات" value={`${T.fmt(totalSalesDZD)} د.ج`} icon="sale" color={C.green} change={12.4}/>
          <KPI label="إجمالي المشتريات" value={`${T.fmt(totalPurchDZD)} د.ج`} icon="buy" color={C.blue} change={-3.2} dir="down"/>
          <KPI label="إجمالي الأرباح" value={`${T.fmt(profit)} د.ج`} icon="trnd" color={C.purple} change={18.6}/>
          <KPI label="هامش الربح" value={totalSalesDZD>0?((profit/totalSalesDZD)*100).toFixed(1)+"%":"0%"} icon="rep" color={C.amber}/>
        </div>
        <div className="card mb4">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>المبيعات والمشتريات الشهرية (ألف د.ج)</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}k`}/>
              <Tooltip contentStyle={TS} formatter={v=>[`${T.fmt(v*1000)} د.ج`]}/><Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="Sales" name="مبيعات" fill={C.green} radius={[4,4,0,0]}/>
              <Bar dataKey="Purchases" name="مشتريات" fill={C.blue} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* مصدر العملات في المشتريات */}
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>المشتريات حسب العملة</div>
          <table><thead><tr><th>العملة</th><th>عدد الفواتير</th><th>الإجمالي بالعملة الأصلية</th><th>الإجمالي بالدينار</th><th>النسبة</th></tr></thead>
          <tbody>{Object.entries(CURRENCIES).map(([code,cur])=>{
            const ci=pInvs.filter(i=>(i.currency||"DZD")===code);
            if(!ci.length)return null;
            const total=ci.reduce((s,i)=>s+i.total,0);
            const totalDZD=ci.reduce((s,i)=>s+(i.totalDZD||toDZD(i.total,code,rates)),0);
            return(<tr key={code}>
              <td><CurBadge currency={code}/></td>
              <td style={{direction:"ltr",textAlign:"left"}}>{ci.length}</td>
              <td style={{fontWeight:700,direction:"ltr",textAlign:"left"}}>{T.fmt(total)} {cur.symbol}</td>
              <td style={{fontWeight:800,color:C.primary,direction:"ltr",textAlign:"left"}}>{T.fmt(totalDZD)} <span style={{fontSize:11,color:C.muted}}>د.ج</span></td>
              <td><Badge label={`${totalPurchDZD>0?(totalDZD/totalPurchDZD*100).toFixed(1):0}%`} cls="b-blue"/></td>
            </tr>);
          })}</tbody></table>
        </div>
      </>}
      {tab==="sales"&&<div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>تفاصيل فواتير البيع (الدينار الجزائري)</div>
        <table><thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>التاريخ</th><th>الإجمالي (د.ج)</th><th>الحالة</th><th>الربح (د.ج)</th></tr></thead>
        <tbody>{sInvs.map(inv=>{
          const cust=customers.find(c=>c.id===Number(inv.customerId));
          const invCogs=(inv.items||[]).reduce((s,it)=>{const p=prods.find(x=>x.id===Number(it.prodId));return s+(p?p.costPrice*Number(it.qty):0);},0);
          const p=inv.subtotal-invCogs;
          return(<tr key={inv.id}>
            <td style={{fontWeight:700,color:C.blue}}>{inv.invoiceNo}</td>
            <td>{cust?.name||"—"}</td>
            <td style={{direction:"ltr",textAlign:"left"}}>{T.fmtDate(inv.invoiceDate)}</td>
            <td style={{fontWeight:700,direction:"ltr",textAlign:"left"}}>{T.fmt(inv.total)} <span style={{fontSize:11,color:C.muted}}>د.ج</span></td>
            <td><Badge label={inv.status} cls={smap(inv.status)}/></td>
            <td style={{fontWeight:700,color:p>=0?C.green:C.red,direction:"ltr",textAlign:"left"}}>{T.fmt(p)} <span style={{fontSize:11,color:C.muted}}>د.ج</span></td>
          </tr>);
        })}</tbody></table>
      </div>}
      {tab==="inventory"&&<div className="g2">
        <div className="card"><div style={{fontWeight:700,fontSize:14,marginBottom:12}}>المواد الأولية</div>
          <table><thead><tr><th>المادة</th><th>الكمية</th><th>تكلفة الوحدة</th><th>بالدينار</th><th>الحالة</th></tr></thead>
          <tbody>{mats.map(m=>{const cd=toDZD(m.unitCost,m.costCurrency||"DZD",rates);return(<tr key={m.id}><td style={{fontWeight:600}}>{m.name}</td><td style={{direction:"ltr",textAlign:"left"}}>{m.qty} {m.unit}</td>
            <td><span style={{direction:"ltr",display:"inline-block"}}>{T.fmt(m.unitCost)} {CURRENCIES[m.costCurrency||"DZD"]?.symbol}</span></td>
            <td style={{fontWeight:700,direction:"ltr",textAlign:"left"}}>{T.fmt(cd)} <span style={{fontSize:11,color:C.muted}}>د.ج</span></td>
            <td>{m.qty<=m.minStock?<Badge label="منخفض" cls="b-amber"/>:<Badge label="جيد" cls="b-green"/>}</td>
          </tr>);})}
          </tbody></table>
        </div>
        <div className="card"><div style={{fontWeight:700,fontSize:14,marginBottom:12}}>المنتجات النهائية (بالدينار)</div>
          <table><thead><tr><th>المنتج</th><th>الكمية</th><th>سعر البيع (د.ج)</th><th>هامش الربح</th></tr></thead>
          <tbody>{prods.map(p=>{const m=p.sellPrice>0?((p.sellPrice-p.costPrice)/p.sellPrice*100).toFixed(1):0;return(<tr key={p.id}><td style={{fontWeight:600}}>{p.name}</td>
            <td style={{direction:"ltr",textAlign:"left",color:p.qty<=p.minStock?C.red:C.green,fontWeight:700}}>{p.qty}</td>
            <td style={{direction:"ltr",textAlign:"left",fontWeight:700,color:C.blue}}>{T.fmt(p.sellPrice)} <span style={{fontSize:11,color:C.muted}}>د.ج</span></td>
            <td><Badge label={`${m}%`} cls={Number(m)>=25?"b-green":"b-amber"}/></td>
          </tr>);})}
          </tbody></table>
        </div>
      </div>}
      {tab==="finance"&&<>
        <div className="g4 mb4">
          <KPI label="الإيرادات" value={`${T.fmt(totalSalesDZD)} د.ج`} icon="sale" color={C.green}/>
          <KPI label="تكلفة البضاعة" value={`${T.fmt(cogs)} د.ج`} icon="inv" color={C.red}/>
          <KPI label="إجمالي الربح" value={`${T.fmt(profit)} د.ج`} icon="trnd" color={C.blue}/>
          <KPI label="هامش الربح" value={totalSalesDZD>0?((profit/totalSalesDZD)*100).toFixed(1)+"%":"0%"} icon="rep" color={C.purple}/>
        </div>
        <div className="card"><div style={{fontWeight:700,fontSize:14,marginBottom:14}}>هامش ربح كل منتج (بالدينار)</div>
          <table><thead><tr><th>المنتج</th><th>تكلفة الإنتاج (د.ج)</th><th>سعر البيع (د.ج)</th><th>ربح الوحدة (د.ج)</th><th>هامش الربح</th></tr></thead>
          <tbody>{prods.map(p=>{const m=p.sellPrice>0?((p.sellPrice-p.costPrice)/p.sellPrice*100).toFixed(1):0;return(<tr key={p.id}>
            <td style={{fontWeight:700}}>{p.name}</td>
            <td style={{direction:"ltr",textAlign:"left"}}>{T.fmt(p.costPrice)}</td>
            <td style={{direction:"ltr",textAlign:"left",fontWeight:700,color:C.blue}}>{T.fmt(p.sellPrice)}</td>
            <td style={{direction:"ltr",textAlign:"left",fontWeight:700,color:C.green}}>{T.fmt(p.sellPrice-p.costPrice)}</td>
            <td><Badge label={`${m}%`} cls={Number(m)>=25?"b-green":Number(m)>=15?"b-amber":"b-red"}/></td>
          </tr>);})}
          </tbody></table>
        </div>
      </>}
    </div>
  );
};

const UsersPage=({user})=>{
  const [tab,setTab]=useState("users");
  const [users,setUsers]=useState(DB.get("users"));
  const [depts,setDepts]=useState(DB.get("departments"));
  const [roles]=useState(DB.get("roles"));
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:"",email:"",pass:"",role:"worker",deptId:1});

  const saveUser=()=>{
    const list=DB.get("users");
    if(editing){const i=list.findIndex(u=>u.id===editing.id);list[i]={...editing,...form};}
    else list.push({...form,id:T.id(),active:true,createdAt:T.today()});
    DB.set("users",list);T.log(user.id,"إضافة/تعديل مستخدم","المستخدمون");setUsers(DB.get("users"));setModal(false);
  };

  const toggle=uid=>{
    if(uid===user.id)return;
    const list=DB.get("users"),i=list.findIndex(u=>u.id===uid);
    list[i].active=!list[i].active;DB.set("users",list);setUsers(DB.get("users"));
  };

  const permLabels={"لوحة التحكم":"dashboard","المخزون":"inventory","المشتريات":"purchase","الإنتاج":"production","المبيعات":"sales","المخزن":"warehouse","HR":"hr","التقارير":"reports","السكان":"scan","الإدارة":"*"};

  return(
    <div>
      <TopBar title="🔐 إدارة المستخدمين" user={user}
        subtitle={`${users.filter(u=>u.active).length} مستخدم نشط في ${depts.length} قسم`}
        actions={<div style={{display:"flex",gap:8}}>
          {tab==="users"&&<button className="btn btn-blue btn-sm" onClick={()=>{setEditing(null);setForm({name:"",email:"",pass:"",role:"worker",deptId:1});setModal(true);}}><Icon n="plus" s={13}/>مستخدم جديد</button>}
        </div>}/>
      <div className="tabs">
        {[["users","المستخدمون"],["depts","الأقسام"],["perms","مصفوفة الصلاحيات"]].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      {tab==="users"&&<>{depts.map(dept=>{
        const du=users.filter(u=>u.deptId===dept.id);if(!du.length)return null;
        return(<div key={dept.id} style={{marginBottom:22}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:20}}>{dept.icon}</span>
            <h3 style={{fontSize:15,fontWeight:700}}>{dept.name}</h3>
            <Badge label={`${du.filter(u=>u.active).length} نشط`} cls="b-blue"/>
          </div>
          <div className="g4">{du.map(u=>{
            const role=roles.find(r=>r.id===u.role);
            return(<div key={u.id} style={{background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:16}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:12}}>
                <div style={{width:44,height:44,background:role?.color||C.blue,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#fff",fontSize:15,flexShrink:0}}>{u.name.slice(0,2)}</div>
                <div style={{flex:1,overflow:"hidden"}}>
                  <div style={{fontWeight:700,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.name}</div>
                  <div style={{fontSize:11,color:C.muted}}>{u.email}</div>
                </div>
              </div>
              <div style={{marginBottom:10}}><Badge label={role?.label||u.role} cls="b-blue"/></div>
              <div style={{display:"flex",gap:6}}>
                <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>{setEditing(u);setForm(u);setModal(true);}}>✏ تعديل</button>
                {u.id!==user.id&&<button className={`btn btn-sm ${u.active?"btn-amber":"btn-green"}`} onClick={()=>toggle(u.id)}>{u.active?"إيقاف":"تفعيل"}</button>}
              </div>
            </div>);
          })}</div>
        </div>);
      })}</>}
      {tab==="depts"&&<div className="g3">
        {depts.map(d=><div key={d.id} className="card">
          <div style={{fontSize:34,marginBottom:8}}>{d.icon}</div>
          <div style={{fontWeight:700,fontSize:16}}>{d.name}</div>
          <Badge label={`${users.filter(u=>u.deptId===d.id&&u.active).length} موظف`} cls="b-blue"/>
        </div>)}
      </div>}
      {tab==="perms"&&<div className="card">
        <div style={{overflowX:"auto"}}>
          <table><thead><tr><th>الدور</th>{Object.keys(permLabels).map(h=><th key={h} style={{textAlign:"center",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{roles.map(role=>{
            const dept=depts.find(d=>d.id===role.deptId);
            return(<tr key={role.id}>
              <td><div style={{display:"flex",alignItems:"center",gap:6}}><span>{dept?.icon}</span><span style={{fontWeight:700,color:role.color}}>{role.label}</span></div></td>
              {Object.values(permLabels).map(perm=>(
                <td key={perm} style={{textAlign:"center"}}>{can(role.id,perm)?<span style={{color:C.green,fontSize:16,fontWeight:800}}>✓</span>:<span style={{color:"#E2E8F0"}}>—</span>}</td>
              ))}
            </tr>);
          })}</tbody></table>
        </div>
      </div>}
      <Modal open={modal} close={()=>setModal(false)} title={editing?"تعديل مستخدم":"مستخدم جديد"} size={560}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>إلغاء</button><button className="btn btn-blue" onClick={saveUser}>حفظ</button></>}>
        <div className="g2">
          <div className="fg"><label>الاسم</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="fg"><label>البريد الإلكتروني</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div className="fg"><label>كلمة المرور</label><input type="password" value={form.pass} onChange={e=>setForm({...form,pass:e.target.value})}/></div>
          <div className="fg"><label>القسم</label><select value={form.deptId} onChange={e=>setForm({...form,deptId:Number(e.target.value)})}>{depts.map(d=><option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}</select></div>
        </div>
        <div className="fg"><label>الدور والصلاحيات</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
            {roles.map(r=>{
              const dept=depts.find(d=>d.id===r.deptId);
              return(<div key={r.id} onClick={()=>setForm({...form,role:r.id})}
                style={{padding:"10px 12px",borderRadius:10,border:`2px solid ${form.role===r.id?r.color:C.border}`,background:form.role===r.id?r.color+"18":"transparent",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span>{dept?.icon}</span><span style={{fontWeight:700,fontSize:13,color:form.role===r.id?r.color:C.text}}>{r.label}</span>
                </div>
                <div style={{fontSize:10,color:C.muted,marginTop:3}}>{r.perms.includes("*")?"وصول كامل":r.perms.slice(0,3).join(" · ")}</div>
              </div>);
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

const SettingsPage=({user})=>{
  const [settings,setSettings]=useState(DB.obj("settings",{}));
  const [saved,setSaved]=useState(false);
  const [rates,setRates]=useState(DB.obj("exchangeRates",DEFAULT_RATES));
  const save=()=>{DB.set("settings",settings);DB.set("exchangeRates",rates);T.log(user.id,"تعديل الإعدادات","الإعدادات");setSaved(true);setTimeout(()=>setSaved(false),2500);};
  return(
    <div>
      <TopBar title="⚙️ إعدادات النظام" user={user}/>
      {saved&&<div className="alert a-ok mb3">✓ تم حفظ الإعدادات</div>}
      <div className="g2">
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>بيانات الشركة</div>
          {[["companyName","اسم الشركة"],["companyNameEn","الاسم بالإنجليزية"],["phone","الهاتف"],["email","البريد الإلكتروني"],["vatNumber","الرقم الضريبي"],["address","العنوان"]].map(([k,l])=>(
            <div key={k} className="fg"><label>{l}</label><input value={settings[k]||""} onChange={e=>setSettings({...settings,[k]:e.target.value})}/></div>
          ))}
        </div>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>العملات وأسعار الصرف</div>
          <div className="alert a-info mb3" style={{fontSize:12}}>🇩🇿 الدينار الجزائري هو العملة الرئيسية للبيع والرواتب</div>
          {Object.entries(CURRENCIES).filter(([k])=>k!=="DZD").map(([code,cur])=>(
            <div key={code} className="fg">
              <label>1 {cur.symbol} ({cur.name}) = كم دينار</label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="number" value={rates[code]||""} onChange={e=>setRates({...rates,[code]:Number(e.target.value)})} style={{flex:1}}/>
                <span style={{fontSize:13,color:C.muted,whiteSpace:"nowrap"}}>{cur.flag} → 🇩🇿</span>
              </div>
            </div>
          ))}
          <div className="fg"><label>نسبة الضريبة %</label><input type="number" value={settings.taxRate||19} onChange={e=>setSettings({...settings,taxRate:Number(e.target.value)})}/></div>
          <div style={{marginTop:14,padding:12,background:C.redSoft,borderRadius:10,border:`1px solid #FCA5A5`}}>
            <div style={{fontWeight:700,color:C.red,fontSize:13,marginBottom:8}}>⚠️ منطقة الخطر</div>
            <button className="btn btn-red btn-sm" onClick={()=>{if(window.confirm("سيتم حذف جميع البيانات!")){DB.clear();window.location.reload();}}}>إعادة ضبط النظام</button>
          </div>
        </div>
      </div>
      <div style={{textAlign:"left"}}>
        <button className="btn btn-blue" onClick={save}><Icon n="chk" s={14}/>حفظ الإعدادات</button>
      </div>
    </div>
  );
};

const AuditPage=({user})=>{
  const [logs,setLogs]=useState(DB.get("auditLogs").slice(0,200));
  const [search,setSearch]=useState("");
  const users=DB.get("users");
  const filtered=logs.filter(l=>{const u=users.find(x=>x.id===l.userId);return(u?.name||"").includes(search)||l.action.includes(search)||l.module.includes(search);});
  const mc={"النظام":"b-gray","المخزون":"b-blue","المشتريات":"b-amber","المبيعات":"b-green","الإنتاج":"b-purple","الموارد البشرية":"b-purple","الإعدادات":"b-amber","المستخدمون":"b-red"};
  return(
    <div>
      <TopBar title="📜 سجل النشاط" user={user} subtitle="سجل كامل لجميع العمليات"/>
      <div className="card">
        <div style={{marginBottom:14}}><SearchBar value={search} onChange={setSearch} placeholder="بحث بالمستخدم أو الإجراء..."/></div>
        <table><thead><tr><th>#</th><th>المستخدم</th><th>الإجراء</th><th>الوحدة</th><th>التاريخ والوقت</th></tr></thead>
        <tbody>{filtered.map((log,i)=>{
          const u=users.find(x=>x.id===log.userId);
          return(<tr key={log.id}>
            <td style={{color:C.muted,fontSize:11,direction:"ltr",textAlign:"left"}}>{i+1}</td>
            <td><div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,background:C.blueSoft,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:C.blue,flexShrink:0}}>{u?.name?.slice(0,2)||"?"}</div>
              <span style={{fontWeight:600,fontSize:12}}>{u?.name||"مجهول"}</span>
            </div></td>
            <td style={{fontSize:13}}>{log.action}</td>
            <td><Badge label={log.module} cls={mc[log.module]||"b-gray"}/></td>
            <td style={{fontSize:11,color:C.muted,direction:"ltr",textAlign:"left"}}>{T.fmtDT(log.createdAt)}</td>
          </tr>);
        })}</tbody></table>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// 25. APP ROOT
// ══════════════════════════════════════════════
export default function App() {
  const [user,setUser]=useState(null);
  const [page,setPage]=useState("dashboard");

  useEffect(()=>{ seed(); },[]);

  if(!user) return(<><style>{css}</style><Login onLogin={u=>{setUser(u);setPage("dashboard");}}/></>);

  const pages={
    dashboard: <DashboardPage  user={user}/>,
    inventory: <InventoryPage  user={user}/>,
    products:  <ProductsPage   user={user}/>,
    purchase:  <PurchasePage   user={user}/>,
    bom:       <BOMPage        user={user}/>,
    production:<ProductionPage user={user}/>,
    sales:     <SalesPage      user={user}/>,
    warehouse: <WarehousePage  user={user}/>,
    hr:        <HRPage         user={user}/>,
    reports:   <ReportsPage    user={user}/>,
    currency:  <CurrencyPage   user={user}/>,
    users:     <UsersPage      user={user}/>,
    settings:  <SettingsPage   user={user}/>,
    audit:     <AuditPage      user={user}/>,
  };

  return(
    <>
      <style>{css}</style>
      <Sidebar user={user} page={page} nav={setPage} logout={()=>setUser(null)}/>
      <div className="main">{pages[page]||<DashboardPage user={user}/>}</div>
    </>
  );
}
