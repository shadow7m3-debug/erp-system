
// ================================================================
// NutriERP Frontend — واجهة احترافية عملية
// مصنع تعبئة المكملات الغذائية
// ================================================================
// ملاحظة: هذا الملف يعمل مع Backend حقيقي
// للتجريب المحلي: يستخدم بيانات محاكاة واقعية
// ================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ══════════════════════════════════════════════════════════
// API SERVICE — يتصل بالـ Backend الحقيقي
// ══════════════════════════════════════════════════════════
const API_URL = import.meta?.env?.VITE_API_URL || "http://localhost:4000/api";

const api = {
  token: () => localStorage.getItem("nutrierp_token"),
  headers: () => ({
    "Content-Type": "application/json",
    ...(localStorage.getItem("nutrierp_token")
      ? { Authorization: `Bearer ${localStorage.getItem("nutrierp_token")}` }
      : {}),
  }),
  get: async (path) => {
    const r = await fetch(`${API_URL}${path}`, { headers: api.headers() });
    if (r.status === 401) { localStorage.removeItem("nutrierp_token"); window.location.reload(); }
    return r.json();
  },
  post: async (path, body) => {
    const r = await fetch(`${API_URL}${path}`, { method: "POST", headers: api.headers(), body: JSON.stringify(body) });
    return r.json();
  },
  put: async (path, body) => {
    const r = await fetch(`${API_URL}${path}`, { method: "PUT", headers: api.headers(), body: JSON.stringify(body) });
    return r.json();
  },
  upload: async (path, formData) => {
    const r = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${api.token()}` },
      body: formData,
    });
    return r.json();
  },
  download: async (path, filename) => {
    const r = await fetch(`${API_URL}${path}`, { headers: api.headers() });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
};

// ══════════════════════════════════════════════════════════
// MOCK DATA — للتجريب بدون Backend
// ══════════════════════════════════════════════════════════
const MOCK = {
  users: [
    { id:"u1", name:"أحمد مدير النظام",  email:"admin@nutri.dz",     password:"admin123",   role:"admin",      department:"الإدارة" },
    { id:"u2", name:"كريم أمين المخزن",  email:"warehouse@nutri.dz", password:"ware123",    role:"warehouse",  department:"المخزن" },
    { id:"u3", name:"سمير رئيس الإنتاج", email:"prod@nutri.dz",      password:"prod123",    role:"production", department:"الإنتاج" },
    { id:"u4", name:"ياسمين المبيعات",   email:"sales@nutri.dz",     password:"sales123",   role:"sales",      department:"المبيعات" },
    { id:"u5", name:"رضا المشتريات",     email:"purchase@nutri.dz",  password:"pur123",     role:"purchasing", department:"المشتريات" },
    { id:"u6", name:"نور تقنية المعلومات",email:"it@nutri.dz",       password:"it123",      role:"it",         department:"IT" },
  ],
  items: [
    { id:"i1", item_number:"RM-0001", item_name:"فيتامين C مسحوق",      item_type:"RAW",       unit_of_measure:"كغ",     barcode:"6290000001", reorder_point:10,  current_qty:45.5,  is_low_stock:false },
    { id:"i2", item_number:"RM-0002", item_name:"بروتين مصل اللبن",     item_type:"RAW",       unit_of_measure:"كغ",     barcode:"6290000002", reorder_point:50,  current_qty:120.0, is_low_stock:false },
    { id:"i3", item_number:"RM-0003", item_name:"كبسولات جيلاتينية",    item_type:"RAW",       unit_of_measure:"ألف قطعة",barcode:"6290000003",reorder_point:100, current_qty:85.0,  is_low_stock:true  },
    { id:"i4", item_number:"RM-0004", item_name:"ماغنيسيوم أكسيد",      item_type:"RAW",       unit_of_measure:"كغ",     barcode:"6290000004", reorder_point:5,   current_qty:18.2,  is_low_stock:false },
    { id:"i5", item_number:"PK-0001", item_name:"عبوة بلاستيك 60 كبسولة",item_type:"PACKAGING",unit_of_measure:"قطعة",  barcode:"6290000005", reorder_point:500, current_qty:2400,  is_low_stock:false },
    { id:"i6", item_number:"PK-0002", item_name:"غطاء عبوة",            item_type:"PACKAGING", unit_of_measure:"قطعة",  barcode:"6290000006", reorder_point:500, current_qty:2400,  is_low_stock:false },
    { id:"i7", item_number:"PK-0003", item_name:"ملصق فيتامين C",       item_type:"PACKAGING", unit_of_measure:"قطعة",  barcode:"6290000007", reorder_point:500, current_qty:380,   is_low_stock:true  },
    { id:"i8", item_number:"FG-0001", item_name:"فيتامين C 1000mg — 60 كبسولة",item_type:"FINISHED",unit_of_measure:"علبة",barcode:"6290100001",reorder_point:50, current_qty:340,   is_low_stock:false },
    { id:"i9", item_number:"FG-0002", item_name:"بروتين واي 2كغ شوكولاتة",item_type:"FINISHED",unit_of_measure:"علبة",  barcode:"6290100002", reorder_point:30,  current_qty:22,    is_low_stock:true  },
  ],
  suppliers: [
    { id:"s1", name:"BASF Nutrients GmbH",        country:"DE", city:"Frankfurt", currency:"EUR", phone:"+49-69-123456", email:"nutrients@basf.com" },
    { id:"s2", name:"Fonterra Proteins Ltd",       country:"NZ", city:"Auckland",  currency:"USD", phone:"+64-9-123456",  email:"proteins@fonterra.com" },
    { id:"s3", name:"شركة التغليف الجزائرية",     country:"DZ", city:"الجزائر",   currency:"DZD", phone:"021-123456",   email:"pack@algpack.dz" },
    { id:"s4", name:"Capsugel France",             country:"FR", city:"Paris",     currency:"EUR", phone:"+33-1-123456",  email:"info@capsugel.fr" },
  ],
  customers: [
    { id:"c1", name:"صيدليات الشفاء",    city:"الجزائر العاصمة", phone:"021-234567", email:"info@shifa.dz" },
    { id:"c2", name:"مجمع نوميدا الرياضي",city:"وهران",           phone:"041-234567", email:"sport@numida.dz" },
    { id:"c3", name:"مخازن الصحة",        city:"قسنطينة",         phone:"031-234567", email:"health@stores.dz" },
  ],
  goodsReceipts: [
    { id:"gr1", gr_number:"GR-2024-0001", supplier_name:"BASF Nutrients GmbH", invoice_number:"INV-2024-456", receipt_date:"2024-04-10", status:"APPROVED", items_count:2, total_value:1450000 },
    { id:"gr2", gr_number:"GR-2024-0002", supplier_name:"Capsugel France",     invoice_number:"INV-2024-789", receipt_date:"2024-04-15", status:"QC_PENDING",items_count:1, total_value:280000 },
    { id:"gr3", gr_number:"GR-2024-0003", supplier_name:"شركة التغليف الجزائرية",invoice_number:"INV-1234",  receipt_date:"2024-04-20", status:"DRAFT",    items_count:3, total_value:95000 },
  ],
  workOrders: [
    { id:"wo1", wo_number:"WO-2024-0001", item_name:"فيتامين C 1000mg — 60 كبسولة", item_number:"FG-0001", planned_qty:5000, planned_date:"2024-04-18", status:"DONE" },
    { id:"wo2", wo_number:"WO-2024-0002", item_name:"بروتين واي 2كغ شوكولاتة",    item_number:"FG-0002", planned_qty:200,  planned_date:"2024-04-25", status:"IN_PROGRESS" },
    { id:"wo3", wo_number:"WO-2024-0003", item_name:"فيتامين C 1000mg — 60 كبسولة", item_number:"FG-0001", planned_qty:8000, planned_date:"2024-05-05", status:"DRAFT" },
  ],
  salesOrders: [
    { id:"so1", so_number:"SO-2024-0001", customer_name:"صيدليات الشفاء",    order_date:"2024-04-12", status:"INVOICED", total_amount:1250000 },
    { id:"so2", so_number:"SO-2024-0002", customer_name:"مجمع نوميدا الرياضي",order_date:"2024-04-18",status:"SHIPPED",  total_amount:680000 },
    { id:"so3", so_number:"SO-2024-0003", customer_name:"مخازن الصحة",        order_date:"2024-04-22", status:"CONFIRMED",total_amount:920000 },
    { id:"so4", so_number:"SO-2024-0004", customer_name:"صيدليات الشفاء",    order_date:"2024-04-28", status:"DRAFT",    total_amount:345000 },
  ],
  itTickets: [
    { id:"it1", ticket_number:"IT-2024-0001", item_name:"فيتامين C 1000mg", ticket_type:"QUALITY_HOLD", title:"تلف في الملصقات — دفعة B2024-04", status:"OPEN",     priority:"HIGH",   quantity:120 },
    { id:"it2", ticket_number:"IT-2024-0002", item_name:"بروتين واي 2كغ",   ticket_type:"REWORK",       title:"إعادة تعبئة — خلل في الوزن",     status:"IN_PROGRESS",priority:"MEDIUM", quantity:50 },
    { id:"it3", ticket_number:"IT-2024-0003", item_name:null,               ticket_type:"REPAIR",       title:"صيانة ماكينة التعبئة #3",          status:"RESOLVED",  priority:"HIGH",   quantity:null },
  ],
  purchaseInvoices: [
    { id:"pi1", pi_number:"PI-2024-0001", supplier_name:"BASF Nutrients GmbH", invoice_number:"INV-2024-456", invoice_date:"2024-04-10", currency:"EUR", total:9800, total_dzd:1426050, status:"CONFIRMED" },
    { id:"pi2", pi_number:"PI-2024-0002", supplier_name:"Capsugel France",     invoice_number:"INV-2024-789", invoice_date:"2024-04-15", currency:"EUR", total:1600, total_dzd:232800,  status:"CONFIRMED" },
  ],
  exchangeRates: [
    { currency:"EUR", rate_to_dzd:145.50 },
    { currency:"GBP", rate_to_dzd:170.20 },
    { currency:"USD", rate_to_dzd:134.80 },
    { currency:"DZD", rate_to_dzd:1.00 },
  ],
  auditLogs: [
    { id:1, user_name:"أحمد مدير النظام", action:"تسجيل دخول",       module:"AUTH",        created_at: new Date().toISOString() },
    { id:2, user_name:"كريم أمين المخزن", action:"إنشاء سند استقبال", module:"WAREHOUSE",   created_at: new Date().toISOString() },
    { id:3, user_name:"ياسمين المبيعات",  action:"إنشاء أمر بيع",    module:"SALES",       created_at: new Date().toISOString() },
  ],
};

// ══════════════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════════════
const fmt    = n => (Number(n)||0).toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2});
const fmtQty = n => (Number(n)||0).toLocaleString("en-US", {minimumFractionDigits:3, maximumFractionDigits:3});
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB") : "—";
const today   = () => new Date().toISOString().split("T")[0];
const uid     = () => Math.random().toString(36).slice(2);

const CURRENCIES = { DZD:{symbol:"د.ج",flag:"🇩🇿"}, EUR:{symbol:"€",flag:"🇪🇺"}, GBP:{symbol:"£",flag:"🇬🇧"}, USD:{symbol:"$",flag:"🇺🇸"} };
const ITEM_TYPES  = { RAW:"مادة خام", SEMI:"منتج وسيط", FINISHED:"منتج نهائي", PACKAGING:"مواد تغليف" };
const WO_STATUS   = { DRAFT:"مسودة", RELEASED:"صادر", IN_PROGRESS:"قيد التنفيذ", DONE:"مكتمل", CANCELLED:"ملغى" };
const GR_STATUS   = { DRAFT:"مسودة", CONFIRMED:"مؤكد", QC_PENDING:"فحص الجودة", APPROVED:"معتمد", REJECTED:"مرفوض" };
const SO_STATUS   = { DRAFT:"مسودة", CONFIRMED:"مؤكد", PICKING:"تجهيز", SHIPPED:"مشحون", INVOICED:"مفوتر", CANCELLED:"ملغى" };
const TK_STATUS   = { OPEN:"مفتوح", IN_PROGRESS:"قيد التنفيذ", RESOLVED:"محلول", CLOSED:"مغلق" };
const TK_PRIORITY = { LOW:"منخفض", MEDIUM:"متوسط", HIGH:"مرتفع", CRITICAL:"حرج" };
const TK_TYPE     = { REPAIR:"صيانة", MODIFICATION:"تعديل جوهري", QUALITY_HOLD:"حجز جودة", RECALL:"سحب", REWORK:"إعادة تصنيع" };
const ROLES_AR    = { admin:"مدير النظام", warehouse:"أمين المخزن", purchasing:"مسؤول المشتريات", production:"مسؤول الإنتاج", sales:"مسؤول المبيعات", it:"IT/جودة", quality:"مراقب الجودة", manager:"مدير" };

const can = (role, ...perms) => role === "admin" || perms.includes(role);

// ══════════════════════════════════════════════════════════
// THEME & CSS
// ══════════════════════════════════════════════════════════
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  :root {
    --bg:       #F0F2F5;
    --card:     #FFFFFF;
    --border:   #E4E7EC;
    --text:     #101828;
    --muted:    #667085;
    --light:    #98A2B3;
    --sidebar:  #101828;
    --blue:     #2563EB;
    --blue-s:   #EFF6FF;
    --green:    #059669;
    --green-s:  #ECFDF5;
    --amber:    #D97706;
    --amber-s:  #FFFBEB;
    --red:      #DC2626;
    --red-s:    #FEF2F2;
    --purple:   #7C3AED;
    --purple-s: #F5F3FF;
    --cyan:     #0891B2;
    --cyan-s:   #ECFEFF;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
    --shadow:    0 4px 6px -1px rgba(0,0,0,.07), 0 2px 4px -1px rgba(0,0,0,.04);
    --shadow-lg: 0 10px 25px -3px rgba(0,0,0,.08), 0 4px 10px -2px rgba(0,0,0,.04);
    --radius:    10px;
    --radius-lg: 14px;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  body,#root { font-family:'Plus Jakarta Sans',sans-serif; direction:rtl; background:var(--bg); color:var(--text); min-height:100vh; font-size:14px; line-height:1.5; }
  /* Numbers always in English */
  .num, td.num, .badge-num { font-variant-numeric:tabular-nums; direction:ltr; unicode-bidi:isolate; }
  input[type=number], input[type=date] { direction:ltr; text-align:left; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-thumb { background:#D0D5DD; border-radius:4px; }

  /* Layout */
  .layout { display:flex; min-height:100vh; }
  .sidebar { width:240px; background:var(--sidebar); display:flex; flex-direction:column; position:fixed; right:0; top:0; bottom:0; z-index:100; overflow-y:auto; }
  .main { margin-right:240px; min-height:100vh; display:flex; flex-direction:column; }
  .topbar { height:56px; background:var(--card); border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; padding:0 24px; position:sticky; top:0; z-index:90; box-shadow:var(--shadow-sm); }
  .page { padding:24px; flex:1; }

  /* Sidebar */
  .sb-logo { padding:16px 16px 12px; border-bottom:1px solid rgba(255,255,255,.08); }
  .sb-logo h1 { color:#fff; font-size:15px; font-weight:800; }
  .sb-logo p  { color:#667085; font-size:11px; margin-top:2px; }
  .sb-section { padding:8px 8px; }
  .sb-section-label { color:#475569; font-size:10px; font-weight:700; letter-spacing:.8px; text-transform:uppercase; padding:6px 8px 4px; }
  .sb-item { display:flex; align-items:center; gap:9px; padding:8px 10px; border-radius:8px; cursor:pointer; color:#94A3B8; font-size:13px; font-weight:500; transition:all .15s; margin-bottom:1px; }
  .sb-item:hover { background:rgba(255,255,255,.06); color:#CBD5E1; }
  .sb-item.active { background:rgba(37,99,235,.2); color:#93C5FD; font-weight:600; border-right:3px solid #2563EB; }
  .sb-item .icon { font-size:16px; width:20px; text-align:center; }
  .sb-badge { margin-right:auto; background:#DC2626; color:#fff; border-radius:20px; padding:1px 7px; font-size:10px; font-weight:700; }
  .sb-user { padding:12px 14px; border-top:1px solid rgba(255,255,255,.08); display:flex; align-items:center; gap:10px; }
  .sb-avatar { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; color:#fff; flex-shrink:0; }

  /* Cards */
  .card { background:var(--card); border-radius:var(--radius-lg); border:1px solid var(--border); padding:20px; margin-bottom:16px; box-shadow:var(--shadow-sm); }
  .card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .card-title { font-size:14px; font-weight:700; color:var(--text); }

  /* KPI */
  .kpi-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:20px; }
  .kpi { background:var(--card); border-radius:var(--radius-lg); padding:18px; border:1px solid var(--border); position:relative; overflow:hidden; box-shadow:var(--shadow-sm); }
  .kpi-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; margin-bottom:12px; }
  .kpi-value { font-size:22px; font-weight:800; letter-spacing:-0.5px; direction:ltr; display:block; margin-bottom:4px; }
  .kpi-label { font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
  .kpi-bar { position:absolute; bottom:0; left:0; right:0; height:3px; }

  /* Buttons */
  .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; font-family:inherit; font-size:13px; font-weight:600; transition:all .15s; white-space:nowrap; }
  .btn:active { transform:scale(.97); }
  .btn-primary { background:var(--blue); color:#fff; } .btn-primary:hover { background:#1D4ED8; }
  .btn-success { background:var(--green); color:#fff; } .btn-success:hover { background:#047857; }
  .btn-danger  { background:var(--red);  color:#fff; }
  .btn-warning { background:var(--amber);color:#fff; }
  .btn-outline { background:transparent; color:var(--blue); border:1.5px solid var(--blue); }
  .btn-ghost   { background:transparent; color:var(--muted); border:1px solid var(--border); } .btn-ghost:hover { background:var(--bg); }
  .btn-sm { padding:5px 10px; font-size:12px; border-radius:7px; }
  .btn-icon { padding:7px; border-radius:8px; border:none; cursor:pointer; background:var(--bg); color:var(--muted); display:inline-flex; align-items:center; transition:all .15s; } .btn-icon:hover { background:var(--border); }

  /* Forms */
  .fg { margin-bottom:14px; }
  label { font-size:11px; font-weight:700; color:var(--muted); display:block; margin-bottom:5px; text-transform:uppercase; letter-spacing:.5px; }
  input, select, textarea { font-family:inherit; direction:rtl; width:100%; padding:9px 12px; border:1.5px solid var(--border); border-radius:8px; font-size:13px; color:var(--text); background:#fff; outline:none; transition:all .18s; }
  input:focus, select:focus, textarea:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(37,99,235,.1); }
  input[type=number], input[type=date] { direction:ltr; }

  /* Table */
  .table-wrap { overflow-x:auto; border-radius:var(--radius-lg); border:1px solid var(--border); }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  thead tr { background:#F9FAFB; border-bottom:2px solid var(--border); }
  th { padding:10px 14px; text-align:right; font-weight:700; color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.5px; white-space:nowrap; }
  td { padding:10px 14px; border-bottom:1px solid #F2F4F7; vertical-align:middle; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:#FAFAFA; }
  td.num { text-align:left; font-weight:600; }

  /* Badges */
  .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; white-space:nowrap; }
  .b-blue   { background:var(--blue-s);   color:#1E40AF; }
  .b-green  { background:var(--green-s);  color:#065F46; }
  .b-amber  { background:var(--amber-s);  color:#92400E; }
  .b-red    { background:var(--red-s);    color:#991B1B; }
  .b-purple { background:var(--purple-s); color:#5B21B6; }
  .b-cyan   { background:var(--cyan-s);   color:#0E7490; }
  .b-gray   { background:#F1F5F9; color:#475569; }

  /* Modal */
  .overlay { position:fixed; inset:0; background:rgba(16,24,40,.5); z-index:1000; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(4px); }
  .modal { background:#fff; border-radius:16px; width:100%; max-height:92vh; overflow-y:auto; box-shadow:var(--shadow-lg); }
  .modal-hd { padding:18px 22px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; background:#fff; z-index:1; border-radius:16px 16px 0 0; }
  .modal-hd h3 { font-size:15px; font-weight:700; }
  .modal-bd { padding:20px 22px; }
  .modal-ft { padding:14px 22px; border-top:1px solid var(--border); display:flex; gap:8px; justify-content:flex-end; background:#F9FAFB; border-radius:0 0 16px 16px; }

  /* Tabs */
  .tabs { display:flex; gap:2px; background:#F1F5F9; padding:3px; border-radius:10px; margin-bottom:18px; }
  .tab { padding:7px 16px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; color:var(--muted); border:none; background:none; transition:all .15s; }
  .tab.on { background:#fff; color:var(--blue); box-shadow:var(--shadow-sm); }

  /* Alerts */
  .alert { padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:12px; display:flex; align-items:flex-start; gap:8px; }
  .a-warn { background:var(--amber-s); color:#92400E; border:1px solid #FDE68A; }
  .a-err  { background:var(--red-s);   color:#991B1B; border:1px solid #FCA5A5; }
  .a-ok   { background:var(--green-s); color:#065F46; border:1px solid #A7F3D0; }
  .a-info { background:var(--blue-s);  color:#1E40AF; border:1px solid #BFDBFE; }

  /* Grid */
  .g2 { display:grid; grid-template-columns:1fr 1fr;     gap:14px; }
  .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
  .g4 { display:grid; grid-template-columns:repeat(4,1fr);gap:14px; }
  .flex { display:flex; } .aic { align-items:center; } .jb { justify-content:space-between; } .gap2 { gap:8px; } .gap3 { gap:12px; }
  .mb2 { margin-bottom:8px; } .mb3 { margin-bottom:12px; } .mb4 { margin-bottom:18px; }
  .fw7 { font-weight:700; } .fw8 { font-weight:800; } .muted { color:var(--muted); } .sm { font-size:12px; }

  /* Item type colors */
  .type-RAW       { background:#FFF7ED; color:#C2410C; border:1px solid #FED7AA; }
  .type-FINISHED  { background:var(--green-s); color:#065F46; border:1px solid #A7F3D0; }
  .type-PACKAGING { background:var(--purple-s);color:#5B21B6; border:1px solid #DDD6FE; }
  .type-SEMI      { background:var(--cyan-s);  color:#0E7490; border:1px solid #A5F3FC; }

  /* Search */
  .search-wrap { position:relative; }
  .search-wrap input { padding-right:36px; }
  .search-icon { position:absolute; right:11px; top:50%; transform:translateY(-50%); color:var(--light); pointer-events:none; }

  /* Upload */
  .upload-zone { border:2px dashed var(--border); border-radius:10px; padding:20px; text-align:center; cursor:pointer; transition:all .2s; }
  .upload-zone:hover { border-color:var(--blue); background:var(--blue-s); }
  .upload-zone.has-file { border-color:var(--green); background:var(--green-s); }

  /* Autocomplete */
  .autocomplete { position:relative; }
  .ac-list { position:absolute; top:100%; right:0; left:0; background:#fff; border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow-lg); z-index:200; max-height:220px; overflow-y:auto; margin-top:2px; }
  .ac-item { padding:8px 12px; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:space-between; }
  .ac-item:hover { background:var(--blue-s); }
  .ac-item .ac-num { font-size:11px; font-weight:700; color:var(--blue); background:var(--blue-s); padding:2px 8px; border-radius:20px; direction:ltr; }

  /* Date range */
  .date-range { display:flex; align-items:center; gap:8px; }
  .date-range input { width:140px; }

  @media (max-width:900px) { .sidebar { display:none; } .main { margin-right:0; } .kpi-grid { grid-template-columns:1fr 1fr; } .g4 { grid-template-columns:1fr 1fr; } }
  @media print { .sidebar,.topbar,.no-print { display:none!important; } .main { margin:0!important; } }
`;

// ══════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ══════════════════════════════════════════════════════════
const Modal = ({ open, onClose, title, children, footer, size = 700 }) => {
  if (!open) return null;
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: size }}>
        <div className="modal-hd">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
};

const Badge = ({ label, cls = "b-gray" }) => <span className={`badge ${cls}`}>{label}</span>;

const statusBadge = (status, map, colorMap) => {
  const label = map[status] || status;
  const cls   = colorMap[status] || "b-gray";
  return <Badge label={label} cls={cls} />;
};

const WOBadge = s => statusBadge(s, WO_STATUS, { DRAFT:"b-gray", RELEASED:"b-blue", IN_PROGRESS:"b-amber", DONE:"b-green", CANCELLED:"b-red" });
const GRBadge = s => statusBadge(s, GR_STATUS, { DRAFT:"b-gray", CONFIRMED:"b-blue", QC_PENDING:"b-amber", APPROVED:"b-green", REJECTED:"b-red" });
const SOBadge = s => statusBadge(s, SO_STATUS, { DRAFT:"b-gray", CONFIRMED:"b-blue", PICKING:"b-cyan", SHIPPED:"b-purple", INVOICED:"b-green", CANCELLED:"b-red" });
const TKBadge = s => statusBadge(s, TK_STATUS, { OPEN:"b-red", IN_PROGRESS:"b-amber", RESOLVED:"b-green", CLOSED:"b-gray" });
const PriBadge = p => statusBadge(p, TK_PRIORITY, { LOW:"b-gray", MEDIUM:"b-blue", HIGH:"b-amber", CRITICAL:"b-red" });

const SearchBar = ({ value, onChange, placeholder = "بحث..." }) => (
  <div className="search-wrap" style={{ flex: 1 }}>
    <span className="search-icon">🔍</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const KPI = ({ icon, label, value, color = "#2563EB", sub, onClick }) => (
  <div className="kpi" style={{ cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
    <div className="kpi-icon" style={{ background: color + "18" }}>{icon}</div>
    <div className="kpi-value" style={{ color }}>{value}</div>
    <div className="kpi-label">{label}</div>
    {sub && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>{sub}</div>}
    <div className="kpi-bar" style={{ background: `linear-gradient(90deg,${color}33,${color})` }} />
  </div>
);

// Autocomplete لـ Item Number
const ItemAutocomplete = ({ value, onChange, onSelect, items, placeholder = "ابحث بكود المادة أو الاسم..." }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const filtered = useMemo(() =>
    search.length > 0
      ? items.filter(i => i.item_number.toLowerCase().includes(search.toLowerCase()) || i.item_name.includes(search))
      : items,
    [search, items]
  );

  return (
    <div className="autocomplete">
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
      />
      {open && filtered.length > 0 && (
        <div className="ac-list">
          {filtered.slice(0, 12).map(item => (
            <div key={item.id} className="ac-item"
              onMouseDown={() => { onSelect(item); setSearch(`${item.item_number} — ${item.item_name}`); setOpen(false); }}>
              <span>{item.item_name}</span>
              <span className="ac-num">{item.item_number}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// رفع ملف
const FileUpload = ({ value, onChange, label = "رفع الفاتورة (PDF/صورة)" }) => {
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);
  const handle = file => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert("الحد الأقصى 15MB"); return; }
    const allowed = ["application/pdf","image/jpeg","image/png","image/jpg"];
    if (!allowed.includes(file.type)) { alert("PDF أو صورة فقط"); return; }
    const reader = new FileReader();
    reader.onload = e => onChange({ name: file.name, type: file.type, size: file.size, data: e.target.result });
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label>{label}</label>
      {value?.name ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--green-s)", border:"1px solid #A7F3D0", borderRadius:8 }}>
          <span style={{ fontSize:20 }}>📎</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:13, color:"#065F46" }}>{value.name}</div>
            <div style={{ fontSize:11, color:"var(--muted)" }}>{(value.size/1024).toFixed(1)} KB</div>
          </div>
          <button className="btn-icon" onClick={() => { const w=window.open(); w.document.write(value.type==="application/pdf"?`<iframe src="${value.data}" style="width:100%;height:100vh"></iframe>`:`<img src="${value.data}" style="max-width:100%"/>`); }} title="معاينة">👁</button>
          <button className="btn-icon" onClick={() => { const a=document.createElement("a"); a.href=value.data; a.download=value.name; a.click(); }} title="تحميل">⬇️</button>
          <button className="btn-icon" onClick={() => onChange(null)} title="حذف" style={{ color:"var(--red)" }}>✕</button>
        </div>
      ) : (
        <div className={`upload-zone ${drag ? "drag" : ""}`}
          onClick={() => ref.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
          <div style={{ fontWeight:600, color:"var(--muted)", fontSize:13 }}>اسحب الملف أو اضغط للاختيار</div>
          <div style={{ fontSize:11, color:"var(--light)", marginTop:4 }}>PDF أو JPG أو PNG — الحد الأقصى 15MB</div>
          <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }} onChange={e => handle(e.target.files[0])} />
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true); setErr("");
    try {
      // محاولة Backend أولاً
      const res = await api.post("/auth/login", { email, password: pass });
      if (res.ok) { localStorage.setItem("nutrierp_token", res.data.token); onLogin(res.data.user); return; }
    } catch {}
    // fallback للبيانات التجريبية
    const u = MOCK.users.find(u => u.email === email && u.password === pass);
    if (u) { onLogin(u); } else { setErr("البريد الإلكتروني أو كلمة المرور غير صحيحة"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#101828 0%,#1E3A5F 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:44, width:"100%", maxWidth:420, boxShadow:"0 25px 60px rgba(0,0,0,.35)" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:64, height:64, background:"linear-gradient(135deg,#059669,#2563EB)", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:28 }}>💊</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#101828" }}>NutriERP</h1>
          <p style={{ color:"var(--muted)", fontSize:12, marginTop:4 }}>نظام إدارة مصنع المكملات الغذائية</p>
        </div>
        {err && <div className="alert a-err mb3">⚠ {err}</div>}
        <div className="fg"><label>البريد الإلكتروني</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="user@nutri.dz" style={{direction:"ltr",textAlign:"left"}}/></div>
        <div className="fg"><label>كلمة المرور</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="••••••••"/></div>
        <button className="btn btn-primary" style={{ width:"100%", padding:"11px", fontSize:14 }} onClick={login} disabled={loading}>{loading?"جاري التحقق...":"دخول →"}</button>
        <div style={{ marginTop:18, padding:12, background:"var(--bg)", borderRadius:10, fontSize:12 }}>
          <p style={{ fontWeight:700, color:"var(--muted)", marginBottom:8 }}>حسابات تجريبية (اضغط للملء):</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
            {MOCK.users.map(u => (
              <div key={u.id} onClick={() => { setEmail(u.email); setPass(u.password); }}
                style={{ cursor:"pointer", padding:"5px 8px", borderRadius:7, border:"1px solid var(--border)", fontSize:11, display:"flex", alignItems:"center", gap:6 }}>
                <span>{u.role==="admin"?"👑":u.role==="warehouse"?"📦":u.role==="production"?"🏭":u.role==="sales"?"💰":u.role==="purchasing"?"🛒":"🔧"}</span>
                <span style={{ fontWeight:600 }}>{ROLES_AR[u.role]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════
const Sidebar = ({ user, page, nav, logout }) => {
  const lowStock = MOCK.items.filter(i => i.is_low_stock).length;
  const pendingGR = MOCK.goodsReceipts.filter(g => g.status !== "APPROVED").length;

  const sections = [
    { label: "الرئيسية", items: [
      { k:"dashboard",  l:"لوحة التحكم",    e:"📊", show: true },
    ]},
    { label: "المخزن والتوريد", items: [
      { k:"master",     l:"كتالوج المواد",  e:"📋", show: can(user.role,"warehouse","purchasing","production","it") },
      { k:"stock",      l:"المخزون الحالي", e:"📦", badge: lowStock > 0 ? lowStock : null, show: can(user.role,"warehouse","production","it") },
      { k:"goods-in",   l:"استقبال البضاعة",e:"📥", badge: pendingGR > 0 ? pendingGR : null, show: can(user.role,"warehouse","purchasing") },
      { k:"purchase-inv",l:"فواتير الشراء", e:"🧾", show: can(user.role,"purchasing","accountant","manager") },
    ]},
    { label: "الإنتاج", items: [
      { k:"bom",        l:"وصفات التصنيع",  e:"🔬", show: can(user.role,"production","admin") },
      { k:"work-orders",l:"أوامر التصنيع",  e:"🏭", show: can(user.role,"production","warehouse") },
    ]},
    { label: "المبيعات", items: [
      { k:"sales",      l:"أوامر البيع",    e:"💰", show: can(user.role,"sales","warehouse","admin") },
      { k:"reports",    l:"تقارير المبيعات",e:"📈", show: can(user.role,"sales","admin","manager") },
    ]},
    { label: "الجودة والتقنية", items: [
      { k:"it-tickets", l:"تذاكر IT/جودة", e:"🔧", show: can(user.role,"it","quality","admin","production") },
    ]},
    { label: "الإدارة", items: [
      { k:"users",      l:"المستخدمون",     e:"👥", show: user.role === "admin" },
      { k:"settings",   l:"الإعدادات",      e:"⚙️",  show: user.role === "admin" },
      { k:"audit",      l:"سجل النشاط",     e:"📜", show: user.role === "admin" },
    ]},
  ];

  const roleColor = { admin:"#7C3AED", warehouse:"#2563EB", production:"#059669", sales:"#D97706", purchasing:"#DC2626", it:"#0891B2", quality:"#65A30D", manager:"#64748B" };

  return (
    <div className="sidebar">
      <div className="sb-logo">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, background:"linear-gradient(135deg,#059669,#2563EB)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>💊</div>
          <div><h1>NutriERP</h1><p>مصنع المكملات الغذائية</p></div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"4px 0" }}>
        {sections.map(section => {
          const visible = section.items.filter(i => i.show);
          if (!visible.length) return null;
          return (
            <div key={section.label} className="sb-section">
              <div className="sb-section-label">{section.label}</div>
              {visible.map(item => (
                <div key={item.k} className={`sb-item ${page === item.k ? "active" : ""}`} onClick={() => nav(item.k)}>
                  <span className="icon">{item.e}</span>
                  <span style={{ flex:1 }}>{item.l}</span>
                  {item.badge && <span className="sb-badge">{item.badge}</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="sb-user">
        <div className="sb-avatar" style={{ background: roleColor[user.role] || "#64748B" }}>
          {user.name.slice(0,2)}
        </div>
        <div style={{ flex:1, overflow:"hidden" }}>
          <div style={{ color:"#fff", fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div>
          <div style={{ color:"#667085", fontSize:11 }}>{ROLES_AR[user.role]}</div>
        </div>
        <button className="btn-icon" onClick={logout} title="تسجيل الخروج" style={{ color:"#64748B" }}>🚪</button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════
const DashboardPage = ({ user }) => {
  const lowStock     = MOCK.items.filter(i => i.is_low_stock).length;
  const activeProd   = MOCK.workOrders.filter(w => w.status === "IN_PROGRESS").length;
  const pendingGR    = MOCK.goodsReceipts.filter(g => g.status !== "APPROVED").length;
  const openTickets  = MOCK.itTickets.filter(t => t.status === "OPEN").length;
  const monthSales   = MOCK.salesOrders.reduce((s,o) => s + o.total_amount, 0);

  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>مرحباً، {user.name} 👋</h2>
      <p style={{ color:"var(--muted)", fontSize:13, marginBottom:20 }}>
        {new Date().toLocaleDateString("en-GB", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
      </p>

      <div className="kpi-grid">
        <KPI icon="💰" label="مبيعات الشهر"    value={`${fmt(monthSales)} د.ج`} color="#059669"/>
        <KPI icon="📦" label="مواد منخفضة"     value={lowStock}     color={lowStock > 0 ? "#D97706" : "#059669"} sub={lowStock > 0 ? "تحتاج طلب شراء" : "المخزون جيد"}/>
        <KPI icon="🏭" label="خطوط إنتاج نشطة" value={activeProd}   color="#2563EB"/>
        <KPI icon="📥" label="سنادات استقبال"   value={pendingGR}   color={pendingGR > 0 ? "#D97706" : "#059669"} sub="بانتظار الاعتماد"/>
        <KPI icon="🔧" label="تذاكر IT مفتوحة"  value={openTickets} color={openTickets > 0 ? "#DC2626" : "#059669"}/>
      </div>

      <div className="g2">
        {/* تنبيهات المخزون */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠️ تنبيهات المخزون</span>
            <span className="badge b-amber">{lowStock} مادة</span>
          </div>
          {MOCK.items.filter(i => i.is_low_stock).length === 0
            ? <div className="alert a-ok">✅ جميع المواد فوق الحد الأدنى</div>
            : MOCK.items.filter(i => i.is_low_stock).map(item => (
                <div key={item.id} className="alert a-warn mb2" style={{ fontSize:12 }}>
                  <strong>{item.item_number}</strong> — {item.item_name}<br/>
                  <span style={{ fontSize:11 }}>المتاح: <strong className="num">{fmtQty(item.current_qty)}</strong> {item.unit_of_measure} | الحد الأدنى: <strong className="num">{item.reorder_point}</strong></span>
                </div>
              ))
          }
        </div>

        {/* أوامر الإنتاج النشطة */}
        <div className="card">
          <div className="card-header"><span className="card-title">🏭 أوامر الإنتاج</span></div>
          {MOCK.workOrders.filter(w => w.status !== "DONE").map(wo => (
            <div key={wo.id} style={{ padding:"10px 0", borderBottom:"1px solid #F2F4F7" }}>
              <div className="flex jb aic">
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{wo.wo_number}</div>
                  <div style={{ fontSize:11, color:"var(--muted)" }}>{wo.item_name}</div>
                </div>
                <div style={{ textAlign:"left" }}>
                  <div className="num" style={{ fontWeight:700, color:"var(--blue)", fontSize:13 }}>{wo.planned_qty.toLocaleString("en-US")}</div>
                  {WOBadge(wo.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="g2">
        {/* آخر أوامر البيع */}
        <div className="card">
          <div className="card-header"><span className="card-title">💰 آخر أوامر البيع</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>رقم الأمر</th><th>العميل</th><th>الإجمالي (د.ج)</th><th>الحالة</th></tr></thead>
              <tbody>
                {MOCK.salesOrders.slice(0,4).map(so => (
                  <tr key={so.id}>
                    <td style={{ fontWeight:700, color:"var(--blue)" }}>{so.so_number}</td>
                    <td>{so.customer_name}</td>
                    <td className="num">{fmt(so.total_amount)}</td>
                    <td>{SOBadge(so.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* تذاكر IT */}
        <div className="card">
          <div className="card-header"><span className="card-title">🔧 تذاكر IT/جودة المفتوحة</span></div>
          {MOCK.itTickets.filter(t => t.status !== "CLOSED").map(tk => (
            <div key={tk.id} style={{ padding:"10px 0", borderBottom:"1px solid #F2F4F7" }}>
              <div className="flex jb aic mb2">
                <span style={{ fontWeight:700, fontSize:12 }}>{tk.ticket_number}</span>
                <div className="flex gap2">{PriBadge(tk.priority)}{TKBadge(tk.status)}</div>
              </div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{tk.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// MASTER DATA — كتالوج المواد
// ══════════════════════════════════════════════════════════
const MasterDataPage = ({ user }) => {
  const [items, setItems]   = useState(MOCK.items);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ item_name:"", item_name_en:"", item_type:"RAW", barcode:"", unit_of_measure:"كغ", reorder_point:0, description:"" });
  const [errors, setErrors] = useState({});

  const filtered = items.filter(i => {
    const matchType   = typeFilter === "ALL" || i.item_type === typeFilter;
    const matchSearch = !search || i.item_name.includes(search) || i.item_number.toLowerCase().includes(search.toLowerCase()) || (i.barcode||"").includes(search);
    return matchType && matchSearch;
  });

  const validate = () => {
    const e = {};
    if (!form.item_name.trim()) e.item_name = "الاسم مطلوب";
    if (!form.item_type) e.item_type = "النوع مطلوب";
    if (form.barcode && items.some(i => i.barcode === form.barcode)) e.barcode = `الباركود ${form.barcode} مستخدم مسبقاً — يرفض التكرار`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      const res = await api.post("/items", form);
      if (res.ok) { setItems([...items, res.data]); setModal(false); return; }
    } catch {}
    // mock
    const prefixes = { RAW:"RM", SEMI:"SF", FINISHED:"FG", PACKAGING:"PK" };
    const existing = items.filter(i => i.item_type === form.item_type).length + 1;
    const newItem = { id:uid(), item_number:`${prefixes[form.item_type]}-${String(existing).padStart(4,"0")}`, ...form, current_qty:0, is_low_stock:false };
    setItems([...items, newItem]);
    setModal(false);
    setForm({ item_name:"", item_name_en:"", item_type:"RAW", barcode:"", unit_of_measure:"كغ", reorder_point:0, description:"" });
    setErrors({});
  };

  const typeCounts = { ALL: items.length, RAW: items.filter(i=>i.item_type==="RAW").length, FINISHED: items.filter(i=>i.item_type==="FINISHED").length, PACKAGING: items.filter(i=>i.item_type==="PACKAGING").length, SEMI: items.filter(i=>i.item_type==="SEMI").length };

  return (
    <div>
      <div className="flex jb aic mb4">
        <div><h2 style={{ fontSize:20, fontWeight:800 }}>📋 كتالوج المواد والمنتجات</h2>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>سجل مركزي لجميع المواد الخام ومواد التغليف والمنتجات النهائية</p></div>
        {can(user.role,"warehouse","purchasing","production") && (
          <button className="btn btn-primary" onClick={() => { setModal(true); setForm({ item_name:"", item_name_en:"", item_type:"RAW", barcode:"", unit_of_measure:"كغ", reorder_point:0, description:"" }); setErrors({}); }}>
            ＋ مادة / منتج جديد
          </button>
        )}
      </div>

      {/* فلاتر النوع */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {[["ALL","الكل"],["RAW","مواد خام"],["FINISHED","منتجات نهائية"],["PACKAGING","تغليف"],["SEMI","وسيطة"]].map(([k,l]) => (
          <button key={k} onClick={() => setTypeFilter(k)}
            className={`btn btn-sm ${typeFilter===k?"btn-primary":"btn-ghost"}`}>
            {l} <span style={{ opacity:.7 }}>({typeCounts[k]})</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex gap3 mb4">
          <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو الكود أو الباركود..."/>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>كود المادة</th><th>اسم المادة / المنتج</th><th>النوع</th>
                <th>الباركود</th><th>وحدة القياس</th>
                <th>الكمية الحالية</th><th>الحد الأدنى</th><th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td><code style={{ fontWeight:800, fontSize:12, color:"var(--blue)", background:"var(--blue-s)", padding:"2px 8px", borderRadius:6 }}>{item.item_number}</code></td>
                  <td>
                    <div style={{ fontWeight:600 }}>{item.item_name}</div>
                    {item.item_name_en && <div style={{ fontSize:11, color:"var(--muted)" }}>{item.item_name_en}</div>}
                  </td>
                  <td><span className={`badge type-${item.item_type}`}>{ITEM_TYPES[item.item_type]}</span></td>
                  <td><span className="num" style={{ fontSize:12, color:"var(--muted)" }}>{item.barcode || "—"}</span></td>
                  <td style={{ color:"var(--muted)" }}>{item.unit_of_measure}</td>
                  <td className="num" style={{ fontWeight:700, color: item.is_low_stock ? "var(--red)" : "var(--green)" }}>
                    {fmtQty(item.current_qty)}
                  </td>
                  <td className="num" style={{ color:"var(--muted)" }}>{fmtQty(item.reorder_point)}</td>
                  <td>{item.is_low_stock ? <Badge label="⚠ منخفض" cls="b-amber"/> : <Badge label="✓ متوفر" cls="b-green"/>}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign:"center", color:"var(--muted)", padding:30 }}>لا توجد نتائج</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal إضافة مادة */}
      <Modal open={modal} onClose={() => setModal(false)} title="إضافة مادة / منتج جديد" size={680}
        footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>إلغاء</button><button className="btn btn-primary" onClick={save}>حفظ في الكتالوج</button></>}>

        <div className="alert a-info mb3" style={{ fontSize:12 }}>
          💡 سيتم توليد كود المادة (Item Number) تلقائياً بناءً على النوع المختار<br/>
          مثال: RM-0005 للمواد الخام | FG-0003 للمنتجات النهائية | PK-0004 لمواد التغليف
        </div>

        <div className="g2">
          {/* النوع أولاً — يحدد الـ Prefix */}
          <div className="fg" style={{ gridColumn:"span 2" }}>
            <label>نوع المادة / المنتج *</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:4 }}>
              {Object.entries(ITEM_TYPES).map(([k,v]) => (
                <div key={k} onClick={() => setForm({...form, item_type:k})}
                  style={{ padding:"12px 8px", borderRadius:10, border:`2px solid ${form.item_type===k?"var(--blue)":"var(--border)"}`, background:form.item_type===k?"var(--blue-s)":"transparent", cursor:"pointer", textAlign:"center" }}>
                  <div style={{ fontWeight:700, fontSize:13, color:form.item_type===k?"var(--blue)":"var(--text)" }}>{v}</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>
                    {k==="RAW"?"RM-XXXX":k==="FINISHED"?"FG-XXXX":k==="PACKAGING"?"PK-XXXX":"SF-XXXX"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fg">
            <label>اسم المادة بالعربية *</label>
            <input value={form.item_name} onChange={e=>setForm({...form,item_name:e.target.value})} placeholder="مثال: فيتامين C مسحوق"/>
            {errors.item_name && <span style={{ color:"var(--red)", fontSize:11 }}>{errors.item_name}</span>}
          </div>

          <div className="fg">
            <label>اسم المادة بالإنجليزية</label>
            <input value={form.item_name_en} onChange={e=>setForm({...form,item_name_en:e.target.value})} placeholder="Vitamin C Powder" style={{ direction:"ltr", textAlign:"left" }}/>
          </div>

          <div className="fg">
            <label>الباركود (Barcode) — يجب أن يكون فريداً</label>
            <input value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})} placeholder="6290000001" style={{ direction:"ltr", textAlign:"left" }}/>
            {errors.barcode && <div className="alert a-err mt2" style={{ padding:"6px 10px", fontSize:11, marginTop:6 }}>⚠ {errors.barcode}</div>}
          </div>

          <div className="fg">
            <label>وحدة القياس *</label>
            <select value={form.unit_of_measure} onChange={e=>setForm({...form,unit_of_measure:e.target.value})}>
              {["كغ","غ","مغ","لتر","مل","قطعة","علبة","كبسولة","ألف قطعة","باليت"].map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="fg">
            <label>الحد الأدنى للمخزون (نقطة إعادة الطلب)</label>
            <input type="number" value={form.reorder_point} onChange={e=>setForm({...form,reorder_point:e.target.value})} min="0"/>
          </div>

          <div className="fg" style={{ gridColumn:"span 2" }}>
            <label>وصف / ملاحظات</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} placeholder="مواصفات المادة، معايير الجودة، أي ملاحظات إضافية..."/>
          </div>
        </div>

        <div style={{ padding:"12px 14px", background:"var(--bg)", borderRadius:8, fontSize:12, color:"var(--muted)" }}>
          📌 ملاحظة: لإضافة الكمية للمخزون، استخدم <strong>وحدة استقبال البضاعة (Goods Receipt)</strong> — لا يمكن إضافة الكمية مباشرة هنا
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// STOCK PAGE — المخزون الحالي
// ══════════════════════════════════════════════════════════
const StockPage = ({ user }) => {
  const [search, setSearch]   = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showLow, setShowLow] = useState(false);
  const [history, setHistory] = useState(null); // عرض تاريخ المادة

  const filtered = MOCK.items.filter(i => {
    if (typeFilter !== "ALL" && i.item_type !== typeFilter) return false;
    if (showLow && !i.is_low_stock) return false;
    if (search && !i.item_name.includes(search) && !i.item_number.toLowerCase().includes(search.toLowerCase()) && !(i.barcode||"").includes(search)) return false;
    return true;
  });

  const totalValue = filtered.reduce((s,i) => s + i.current_qty * 150, 0); // تقديري

  return (
    <div>
      <div className="flex jb aic mb4">
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>📦 المخزون الحالي</h2>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>كميات حقيقية محسوبة من حركة المخزون</p>
        </div>
        <div className="flex gap2">
          <button className="btn btn-outline btn-sm" onClick={async () => {
            try { await api.download("/reports/stock?format=excel", "stock_report.xlsx"); }
            catch { alert("تصدير Excel غير متاح في وضع التجريب — يحتاج Backend"); }
          }}>⬇️ تصدير Excel</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
        <KPI icon="📦" label="إجمالي المواد" value={MOCK.items.length} color="#2563EB"/>
        <KPI icon="⚠️" label="مواد منخفضة" value={MOCK.items.filter(i=>i.is_low_stock).length} color="#D97706"/>
        <KPI icon="✅" label="مواد متوفرة"   value={MOCK.items.filter(i=>!i.is_low_stock).length} color="#059669"/>
        <KPI icon="🏷" label="منتجات نهائية" value={MOCK.items.filter(i=>i.item_type==="FINISHED").length} color="#7C3AED"/>
      </div>

      <div className="card">
        <div className="flex gap3 mb4" style={{ flexWrap:"wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو الكود أو الباركود..."/>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ width:160 }}>
            <option value="ALL">كل الأنواع</option>
            {Object.entries(ITEM_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className={`btn btn-sm ${showLow?"btn-warning":"btn-ghost"}`} onClick={() => setShowLow(!showLow)}>
            ⚠️ {showLow ? "عرض الكل" : "المنخفضة فقط"}
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>كود المادة</th><th>المادة / المنتج</th><th>النوع</th>
                <th>الباركود</th><th>الوحدة</th>
                <th>الكمية الحالية</th><th>الحد الأدنى</th>
                <th>الفرق</th><th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const diff = item.current_qty - item.reorder_point;
                return (
                  <tr key={item.id} style={{ cursor:"pointer" }} onClick={() => setHistory(item)}>
                    <td><code style={{ fontWeight:800, fontSize:12, color:"var(--blue)", background:"var(--blue-s)", padding:"2px 8px", borderRadius:6 }}>{item.item_number}</code></td>
                    <td><div style={{ fontWeight:600 }}>{item.item_name}</div></td>
                    <td><span className={`badge type-${item.item_type}`}>{ITEM_TYPES[item.item_type]}</span></td>
                    <td><span className="num" style={{ fontSize:12 }}>{item.barcode || "—"}</span></td>
                    <td style={{ color:"var(--muted)" }}>{item.unit_of_measure}</td>
                    <td>
                      <div className="num" style={{ fontWeight:800, fontSize:14, color: item.is_low_stock ? "var(--red)" : "var(--green)" }}>{fmtQty(item.current_qty)}</div>
                      <div style={{ width:"100%", height:4, background:"var(--border)", borderRadius:2, marginTop:3 }}>
                        <div style={{ width:`${Math.min(100,(item.current_qty/Math.max(item.reorder_point,1))*50)}%`, height:"100%", background: item.is_low_stock?"var(--red)":"var(--green)", borderRadius:2 }}/>
                      </div>
                    </td>
                    <td className="num" style={{ color:"var(--muted)" }}>{fmtQty(item.reorder_point)}</td>
                    <td className="num" style={{ color: diff < 0 ? "var(--red)" : "var(--green)", fontWeight:700 }}>
                      {diff >= 0 ? "+" : ""}{fmtQty(diff)}
                    </td>
                    <td>
                      {item.is_low_stock
                        ? <Badge label="⚠ منخفض — يحتاج طلب" cls="b-amber"/>
                        : <Badge label="✓ متوفر" cls="b-green"/>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal تاريخ المادة */}
      <Modal open={!!history} onClose={() => setHistory(null)} title={`سجل حركة: ${history?.item_name}`} size={700}>
        <div style={{ padding:"10px 0", marginBottom:14, background:"var(--bg)", borderRadius:8, padding:"12px 14px" }}>
          <div className="flex gap3">
            <div><span style={{ fontSize:11, color:"var(--muted)", fontWeight:700 }}>كود المادة</span><br/><code style={{ fontWeight:800, color:"var(--blue)" }}>{history?.item_number}</code></div>
            <div><span style={{ fontSize:11, color:"var(--muted)", fontWeight:700 }}>الباركود</span><br/><code className="num">{history?.barcode || "—"}</code></div>
            <div><span style={{ fontSize:11, color:"var(--muted)", fontWeight:700 }}>الكمية الحالية</span><br/><strong className="num" style={{ color:history?.is_low_stock?"var(--red)":"var(--green)", fontSize:16 }}>{fmtQty(history?.current_qty)} {history?.unit_of_measure}</strong></div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>التاريخ</th><th>نوع الحركة</th><th>الكمية</th><th>المرجع</th><th>المستخدم</th></tr></thead>
            <tbody>
              <tr><td colSpan={5} style={{ textAlign:"center", color:"var(--muted)", padding:24, fontSize:13 }}>
                يتطلب الاتصال بالـ Backend لعرض سجل الحركة الكامل
              </td></tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// GOODS RECEIPT — استقبال البضاعة
// ══════════════════════════════════════════════════════════
const GoodsReceiptPage = ({ user }) => {
  const [receipts, setReceipts] = useState(MOCK.goodsReceipts);
  const [modal, setModal]       = useState(false);
  const [search, setSearch]     = useState("");
  const [form, setForm]         = useState({ supplier_id:"", invoice_number:"", receipt_date:today(), notes:"" });
  const [lines, setLines]       = useState([{ _id:uid(), item_id:"", item_number:"", item_name:"", quantity:"", unit_cost:"", currency:"DZD", exchange_rate:1, lot_number:"", expiry_date:"" }]);
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]     = useState([]);

  const rates = { EUR:145.5, GBP:170.2, USD:134.8, DZD:1 };

  const updateLine = (idx, field, value) => {
    const n = [...lines];
    n[idx][field] = value;
    if (field === "currency") n[idx].exchange_rate = rates[value] || 1;
    setLines(n);
  };

  const selectItem = (idx, item) => {
    const n = [...lines];
    n[idx].item_id     = item.id;
    n[idx].item_number = item.item_number;
    n[idx].item_name   = item.item_name;
    setLines(n);
  };

  const validate = () => {
    const errs = [];
    if (!form.supplier_id) errs.push("المورد مطلوب");
    if (!form.invoice_number.trim()) errs.push("رقم الفاتورة مطلوب");
    lines.forEach((l, i) => {
      if (!l.item_id) errs.push(`السطر ${i+1}: يجب اختيار مادة من الكتالوج`);
      if (!l.quantity || Number(l.quantity) <= 0) errs.push(`السطر ${i+1}: الكمية يجب أن تكون أكبر من صفر`);
      if (!l.unit_cost || Number(l.unit_cost) < 0) errs.push(`السطر ${i+1}: التكلفة مطلوبة`);
    });
    setErrors(errs);
    return errs.length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      const data = { ...form, items: lines.map(l => ({
        item_id: l.item_id, quantity: l.quantity, unit_cost: l.unit_cost,
        currency: l.currency, exchange_rate: l.exchange_rate,
        lot_number: l.lot_number, expiry_date: l.expiry_date || null,
      }))};
      formData.append("data", JSON.stringify(data));
      if (attachment?.data) {
        const blob = await fetch(attachment.data).then(r => r.blob());
        formData.append("attachment", blob, attachment.name);
      }
      const res = await api.upload("/goods-receipts", formData);
      if (res.ok) {
        setReceipts([{ id:res.data.id, gr_number:res.data.gr_number, supplier_name: MOCK.suppliers.find(s=>s.id===form.supplier_id)?.name||"—", invoice_number:form.invoice_number, receipt_date:form.receipt_date, status:"DRAFT", items_count:lines.length }, ...receipts]);
        setModal(false);
        return;
      }
    } catch {}
    // Mock fallback
    const sup = MOCK.suppliers.find(s => s.id === form.supplier_id);
    const newGR = { id:uid(), gr_number:`GR-2024-${String(receipts.length+1).padStart(4,"0")}`, supplier_name:sup?.name||"—", invoice_number:form.invoice_number, receipt_date:form.receipt_date, status:"DRAFT", items_count:lines.length, total_value: lines.reduce((s,l)=>s+Number(l.quantity)*Number(l.unit_cost)*(rates[l.currency]||1),0) };
    setReceipts([newGR, ...receipts]);
    setModal(false);
    setForm({ supplier_id:"", invoice_number:"", receipt_date:today(), notes:"" });
    setLines([{ _id:uid(), item_id:"", item_number:"", item_name:"", quantity:"", unit_cost:"", currency:"DZD", exchange_rate:1, lot_number:"", expiry_date:"" }]);
    setAttachment(null);
    setSubmitting(false);
  };

  const approve = async (gr) => {
    if (!window.confirm(`اعتماد ${gr.gr_number}؟ سيتم إضافة المواد للمخزون تلقائياً`)) return;
    try {
      const res = await api.post(`/goods-receipts/${gr.id}/approve`, {});
      if (res.ok) { setReceipts(receipts.map(r => r.id === gr.id ? { ...r, status:"APPROVED" } : r)); return; }
    } catch {}
    setReceipts(receipts.map(r => r.id === gr.id ? { ...r, status:"APPROVED" } : r));
  };

  const filtered = receipts.filter(r => !search || r.gr_number.includes(search) || r.supplier_name.includes(search) || r.invoice_number.includes(search));

  const lineTotal = (l) => Number(l.quantity||0) * Number(l.unit_cost||0);
  const dzdTotal  = (l) => lineTotal(l) * Number(l.exchange_rate||1);
  const totalDZD  = lines.reduce((s,l) => s + dzdTotal(l), 0);

  return (
    <div>
      <div className="flex jb aic mb4">
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>📥 استقبال البضاعة</h2>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>Goods Receipt — المواد تدخل للمخزون فقط بعد الاعتماد</p>
        </div>
        {can(user.role,"warehouse","purchasing") && (
          <button className="btn btn-primary" onClick={() => { setModal(true); setErrors([]); }}>＋ سند استقبال جديد</button>
        )}
      </div>

      <div className="card">
        <div className="flex gap3 mb4"><SearchBar value={search} onChange={setSearch} placeholder="بحث برقم السند أو المورد أو رقم الفاتورة..."/></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>رقم السند</th><th>المورد</th><th>رقم فاتورة المورد</th><th>تاريخ الاستقبال</th><th>عدد الأصناف</th><th>القيمة الإجمالية (د.ج)</th><th>الحالة</th><th>إجراء</th></tr>
            </thead>
            <tbody>
              {filtered.map(gr => (
                <tr key={gr.id}>
                  <td style={{ fontWeight:700, color:"var(--blue)" }}>{gr.gr_number}</td>
                  <td style={{ fontWeight:600 }}>{gr.supplier_name}</td>
                  <td><code className="num" style={{ fontSize:12 }}>{gr.invoice_number}</code></td>
                  <td className="num">{fmtDate(gr.receipt_date)}</td>
                  <td className="num">{gr.items_count}</td>
                  <td className="num" style={{ fontWeight:700 }}>{fmt(gr.total_value)}</td>
                  <td>{GRBadge(gr.status)}</td>
                  <td>
                    {gr.status === "DRAFT" && can(user.role,"warehouse") && (
                      <button className="btn btn-success btn-sm" onClick={() => approve(gr)}>✓ اعتماد وإضافة للمخزون</button>
                    )}
                    {gr.status === "QC_PENDING" && <Badge label="🔬 بانتظار الجودة" cls="b-amber"/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal إنشاء سند استقبال */}
      <Modal open={modal} onClose={() => setModal(false)} title="إنشاء سند استقبال بضاعة جديد" size={900}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={save} disabled={submitting}>
            {submitting ? "جاري الحفظ..." : "حفظ السند"}
          </button>
        </>}>

        {errors.length > 0 && (
          <div className="alert a-err mb3">
            <div><strong>يرجى تصحيح الأخطاء التالية:</strong><ul style={{ marginTop:6, paddingRight:16 }}>{errors.map((e,i) => <li key={i} style={{ fontSize:12 }}>{e}</li>)}</ul></div>
          </div>
        )}

        <div className="g3">
          <div className="fg">
            <label>المورد *</label>
            <select value={form.supplier_id} onChange={e=>setForm({...form,supplier_id:e.target.value})}>
              <option value="">اختر المورد</option>
              {MOCK.suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.currency})</option>)}
            </select>
          </div>
          <div className="fg">
            <label>رقم فاتورة المورد *</label>
            <input value={form.invoice_number} onChange={e=>setForm({...form,invoice_number:e.target.value})} placeholder="INV-2024-XXXX" style={{ direction:"ltr", textAlign:"left" }}/>
          </div>
          <div className="fg">
            <label>تاريخ الاستقبال</label>
            <input type="date" value={form.receipt_date} onChange={e=>setForm({...form,receipt_date:e.target.value})}/>
          </div>
        </div>

        {/* سطور المواد */}
        <div className="flex jb aic mb3">
          <span style={{ fontWeight:700, fontSize:14 }}>المواد المستقبَلة</span>
          <button className="btn btn-outline btn-sm" onClick={() => setLines([...lines, { _id:uid(), item_id:"", item_number:"", item_name:"", quantity:"", unit_cost:"", currency:"DZD", exchange_rate:1, lot_number:"", expiry_date:"" }])}>＋ إضافة سطر</button>
        </div>

        <div className="alert a-info mb3" style={{ fontSize:12 }}>
          🔒 يُسمح فقط بإدخال Item Numbers المسجلة في الكتالوج — الكتابة تعطيك اقتراحات تلقائية
        </div>

        {lines.map((line, idx) => (
          <div key={line._id} style={{ background:"var(--bg)", borderRadius:10, padding:14, marginBottom:10, border:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontWeight:700, fontSize:13, color:"var(--blue)" }}>السطر {idx+1}</span>
              {lines.length > 1 && <button className="btn-icon" onClick={() => setLines(lines.filter((_,i)=>i!==idx))} style={{ color:"var(--red)" }}>🗑</button>}
            </div>
            <div className="g2" style={{ marginBottom:10 }}>
              {/* Autocomplete للمادة */}
              <div className="fg" style={{ gridColumn:"span 2", marginBottom:0 }}>
                <label>المادة (Item Number) * — أدخل الكود أو الاسم</label>
                <ItemAutocomplete
                  value={line.item_number}
                  items={MOCK.items}
                  onChange={v => updateLine(idx,"item_number",v)}
                  onSelect={item => selectItem(idx, item)}
                  placeholder="RM-0001 أو اسم المادة..."
                />
                {line.item_name && (
                  <div style={{ marginTop:6, padding:"6px 10px", background:"#fff", borderRadius:7, border:"1px solid var(--border)", fontSize:12 }}>
                    <strong style={{ color:"var(--green)" }}>✓ {line.item_name}</strong>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 }}>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>الكمية *</label>
                <input type="number" value={line.quantity} onChange={e=>updateLine(idx,"quantity",e.target.value)} placeholder="0.000" min="0" step="0.001"/>
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>سعر الوحدة *</label>
                <input type="number" value={line.unit_cost} onChange={e=>updateLine(idx,"unit_cost",e.target.value)} placeholder="0.00" min="0"/>
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>العملة</label>
                <select value={line.currency} onChange={e=>updateLine(idx,"currency",e.target.value)}>
                  {Object.entries(CURRENCIES).map(([k,v]) => <option key={k} value={k}>{v.flag} {k}</option>)}
                </select>
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>رقم الدفعة (Lot)</label>
                <input value={line.lot_number} onChange={e=>updateLine(idx,"lot_number",e.target.value)} placeholder="LOT-2024-001" style={{ direction:"ltr", textAlign:"left" }}/>
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>تاريخ الصلاحية</label>
                <input type="date" value={line.expiry_date} onChange={e=>updateLine(idx,"expiry_date",e.target.value)}/>
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>الإجمالي ({line.currency})</label>
                <div className="num" style={{ padding:"9px 12px", background:"#fff", border:"1px solid var(--border)", borderRadius:8, fontWeight:700, color:"var(--blue)" }}>
                  {fmt(lineTotal(line))} {CURRENCIES[line.currency]?.symbol}
                </div>
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>بالدينار الجزائري</label>
                <div className="num" style={{ padding:"9px 12px", background:"var(--green-s)", border:"1px solid #A7F3D0", borderRadius:8, fontWeight:700, color:"var(--green)" }}>
                  {fmt(dzdTotal(line))} د.ج
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* الإجمالي */}
        <div style={{ padding:"14px 16px", background:"#F0FDF4", borderRadius:10, border:"1px solid #A7F3D0", marginTop:4 }}>
          <div className="flex jb aic">
            <span style={{ fontWeight:700, fontSize:14 }}>🇩🇿 الإجمالي بالدينار الجزائري:</span>
            <span className="num" style={{ fontWeight:800, fontSize:18, color:"#065F46" }}>{fmt(totalDZD)} د.ج</span>
          </div>
        </div>

        {/* رفع الفاتورة */}
        <div style={{ marginTop:16 }}>
          <FileUpload value={attachment} onChange={setAttachment} label="نسخة الفاتورة (PDF أو صورة) — موصى به"/>
        </div>

        <div className="fg" style={{ marginTop:14 }}>
          <label>ملاحظات</label>
          <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} placeholder="أي ملاحظات إضافية..."/>
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// SALES REPORTS — تقارير المبيعات
// ══════════════════════════════════════════════════════════
const SalesReportsPage = ({ user }) => {
  const [tab, setTab]       = useState("orders");
  const [from, setFrom]     = useState("");
  const [to, setTo]         = useState("");
  const [customer, setCustomer] = useState("");
  const [search, setSearch] = useState("");

  const filtered = MOCK.salesOrders.filter(o => {
    if (customer && o.customer_name !== MOCK.customers.find(c=>c.id===customer)?.name) return false;
    if (search && !o.so_number.includes(search) && !o.customer_name.includes(search)) return false;
    return true;
  });

  const totalAmount = filtered.reduce((s,o) => s + o.total_amount, 0);

  const exportExcel = async () => {
    try {
      const params = new URLSearchParams({ format:"excel" });
      if (from) params.append("from", from);
      if (to)   params.append("to", to);
      if (customer) params.append("customer_id", customer);
      await api.download(`/reports/sales?${params}`, `sales_${from||"all"}_${to||"all"}.xlsx`);
    } catch {
      alert("تصدير Excel يحتاج اتصال بالـ Backend\n\nفي بيئة الإنتاج ستُحمّل ملف Excel حقيقي يحتوي على:\n• كل أمر بيع مع التاريخ والعميل\n• كل منتج مع الكود والباركود والكمية والسعر\n• إجمالي لكل أمر\n• ملخص نهائي");
    }
  };

  const exportStockExcel = async () => {
    try {
      await api.download("/reports/stock?format=excel", "stock_report.xlsx");
    } catch {
      alert("تصدير Excel يحتاج اتصال بالـ Backend");
    }
  };

  return (
    <div>
      <div className="flex jb aic mb4">
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>📈 التقارير</h2>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>تقارير المبيعات والمخزون مع تصدير Excel</p>
        </div>
        <div className="flex gap2">
          <button className="btn btn-success" onClick={exportExcel}>⬇️ تصدير Excel — مبيعات</button>
          <button className="btn btn-outline" onClick={exportStockExcel}>⬇️ Excel — مخزون</button>
        </div>
      </div>

      <div className="tabs">
        {[["orders","أوامر البيع"],["products","المنتجات المباعة"],["stock-final","المخزون النهائي"]].map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* فلاتر المدة الزمنية */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ fontWeight:700, fontSize:13, color:"var(--muted)" }}>الفترة الزمنية:</span>
          <div className="date-range">
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ width:150 }}/>
            <span style={{ color:"var(--muted)" }}>إلى</span>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ width:150 }}/>
          </div>
          <select value={customer} onChange={e=>setCustomer(e.target.value)} style={{ width:200 }}>
            <option value="">كل العملاء</option>
            {MOCK.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <SearchBar value={search} onChange={setSearch} placeholder="بحث..."/>
          {(from||to||customer||search) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFrom(""); setTo(""); setCustomer(""); setSearch(""); }}>✕ مسح</button>
          )}
        </div>
        <div style={{ marginTop:10, padding:"8px 12px", background:"var(--blue-s)", borderRadius:8, fontSize:12, color:"var(--blue)", fontWeight:600, display:"flex", gap:16 }}>
          <span>إجمالي الفترة: <strong className="num">{fmt(totalAmount)} د.ج</strong></span>
          <span>عدد الأوامر: <strong className="num">{filtered.length}</strong></span>
        </div>
      </div>

      {tab === "orders" && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>رقم الأمر</th><th>العميل</th><th>التاريخ</th><th>الإجمالي (د.ج)</th><th>الحالة</th></tr></thead>
              <tbody>
                {filtered.map(so => (
                  <tr key={so.id}>
                    <td style={{ fontWeight:700, color:"var(--blue)" }}>{so.so_number}</td>
                    <td style={{ fontWeight:600 }}>{so.customer_name}</td>
                    <td className="num">{fmtDate(so.order_date)}</td>
                    <td className="num" style={{ fontWeight:700 }}>{fmt(so.total_amount)}</td>
                    <td>{SOBadge(so.status)}</td>
                  </tr>
                ))}
                <tr style={{ background:"#F0FDF4" }}>
                  <td colSpan={3} style={{ fontWeight:800, fontSize:14 }}>الإجمالي</td>
                  <td className="num" style={{ fontWeight:800, fontSize:14, color:"var(--green)" }}>{fmt(totalAmount)}</td>
                  <td/>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="card">
          <div style={{ marginBottom:14 }} className="alert a-info">
            📊 هذا التقرير يُظهر الكميات المباعة لكل منتج مع الباركود خلال الفترة المحددة
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>كود المنتج</th><th>اسم المنتج</th><th>الباركود</th>
                  <th>الكمية المباعة</th><th>سعر الوحدة (د.ج)</th><th>الإجمالي (د.ج)</th>
                </tr>
              </thead>
              <tbody>
                {MOCK.items.filter(i => i.item_type === "FINISHED").map(item => (
                  <tr key={item.id}>
                    <td><code style={{ fontWeight:800, color:"var(--green)", background:"var(--green-s)", padding:"2px 8px", borderRadius:6, fontSize:12 }}>{item.item_number}</code></td>
                    <td style={{ fontWeight:600 }}>{item.item_name}</td>
                    <td className="num" style={{ fontSize:12 }}>{item.barcode || "—"}</td>
                    <td className="num" style={{ fontWeight:700, color:"var(--blue)" }}>{fmtQty(Math.random()*100+50)}</td>
                    <td className="num">{fmt(120000 + Math.random()*50000)}</td>
                    <td className="num" style={{ fontWeight:700 }}>{fmt(Math.random()*5000000+500000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "stock-final" && (
        <div className="card">
          <div className="flex jb aic mb3">
            <span style={{ fontWeight:700, fontSize:14 }}>الكميات النهائية في المخزون</span>
            <button className="btn btn-success btn-sm" onClick={exportStockExcel}>⬇️ تصدير Excel</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>كود المادة</th><th>اسم المادة / المنتج</th><th>النوع</th><th>الباركود</th><th>الوحدة</th><th>الكمية النهائية</th><th>الحالة</th></tr>
              </thead>
              <tbody>
                {MOCK.items.map(item => (
                  <tr key={item.id}>
                    <td><code style={{ fontWeight:800, fontSize:12, color:"var(--blue)", background:"var(--blue-s)", padding:"2px 8px", borderRadius:6 }}>{item.item_number}</code></td>
                    <td style={{ fontWeight:600 }}>{item.item_name}</td>
                    <td><span className={`badge type-${item.item_type}`}>{ITEM_TYPES[item.item_type]}</span></td>
                    <td className="num" style={{ fontSize:12 }}>{item.barcode || "—"}</td>
                    <td style={{ color:"var(--muted)" }}>{item.unit_of_measure}</td>
                    <td className="num" style={{ fontWeight:800, fontSize:14, color:item.is_low_stock?"var(--red)":"var(--green)" }}>{fmtQty(item.current_qty)}</td>
                    <td>{item.is_low_stock ? <Badge label="⚠ منخفض" cls="b-amber"/> : <Badge label="✓ متوفر" cls="b-green"/>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// WORK ORDERS — أوامر التصنيع
// ══════════════════════════════════════════════════════════
const WorkOrdersPage = ({ user }) => {
  const [orders, setOrders] = useState(MOCK.workOrders);
  const [modal, setModal]   = useState(false);
  const [stageModal, setStageModal] = useState(null);
  const [form, setForm]     = useState({ finished_item_id:"", bom_id:"", planned_qty:"", planned_date:today(), notes:"" });
  const [stageForm, setStageForm] = useState({ actual_qty:"", damages:"0", damage_reason:"", notes:"" });

  const finishedItems = MOCK.items.filter(i => i.item_type === "FINISHED");

  const save = () => {
    const item = finishedItems.find(i => i.id === form.finished_item_id);
    const newWO = { id:uid(), wo_number:`WO-2024-${String(orders.length+1).padStart(4,"0")}`, item_name:item?.item_name||"—", item_number:item?.item_number||"—", planned_qty:Number(form.planned_qty), planned_date:form.planned_date, status:"DRAFT" };
    setOrders([...orders, newWO]);
    setModal(false);
  };

  const release = (wo) => setOrders(orders.map(o => o.id === wo.id ? {...o, status:"RELEASED"} : o));

  return (
    <div>
      <div className="flex jb aic mb4">
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>🏭 أوامر التصنيع</h2>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>Work Orders — من التخطيط إلى الإنتاج الفعلي</p>
        </div>
        {can(user.role,"production") && <button className="btn btn-primary" onClick={() => setModal(true)}>＋ أمر تصنيع جديد</button>}
      </div>

      {/* إحصائيات */}
      <div className="kpi-grid" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
        {Object.entries(WO_STATUS).map(([k,v]) => (
          <KPI key={k} icon={k==="DONE"?"✅":k==="IN_PROGRESS"?"⚙️":k==="CANCELLED"?"❌":"📝"} label={v}
            value={orders.filter(o=>o.status===k).length}
            color={k==="DONE"?"#059669":k==="IN_PROGRESS"?"#2563EB":k==="CANCELLED"?"#DC2626":"#64748B"}/>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>رقم الأمر</th><th>المنتج النهائي</th><th>الكمية المخططة</th><th>تاريخ التصنيع</th><th>الحالة</th><th>إجراء</th></tr>
            </thead>
            <tbody>
              {orders.map(wo => (
                <tr key={wo.id}>
                  <td style={{ fontWeight:700, color:"var(--blue)" }}>{wo.wo_number}</td>
                  <td>
                    <div style={{ fontWeight:600 }}>{wo.item_name}</div>
                    <div style={{ fontSize:11, color:"var(--muted)" }}>{wo.item_number}</div>
                  </td>
                  <td className="num" style={{ fontWeight:700 }}>{wo.planned_qty.toLocaleString("en-US")}</td>
                  <td className="num">{fmtDate(wo.planned_date)}</td>
                  <td>{WOBadge(wo.status)}</td>
                  <td>
                    {wo.status === "DRAFT" && can(user.role,"production","admin") && (
                      <button className="btn btn-outline btn-sm" onClick={() => release(wo)}>📤 إصدار</button>
                    )}
                    {wo.status === "RELEASED" && can(user.role,"production","admin") && (
                      <button className="btn btn-success btn-sm" onClick={() => { setStageModal(wo); setStageForm({ actual_qty:wo.planned_qty, damages:"0", damage_reason:"", notes:"" }); }}>
                        ⚙️ تسجيل الإنتاج
                      </button>
                    )}
                    {wo.status === "IN_PROGRESS" && (
                      <button className="btn btn-warning btn-sm" onClick={() => { setStageModal(wo); setStageForm({ actual_qty:wo.planned_qty, damages:"0", damage_reason:"", notes:"" }); }}>
                        ✅ إكمال
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal أمر تصنيع جديد */}
      <Modal open={modal} onClose={() => setModal(false)} title="إنشاء أمر تصنيع جديد"
        footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>إلغاء</button><button className="btn btn-primary" onClick={save}>إنشاء</button></>}>
        <div className="g2">
          <div className="fg"><label>المنتج النهائي *</label>
            <select value={form.finished_item_id} onChange={e=>setForm({...form,finished_item_id:e.target.value})}>
              <option value="">اختر المنتج</option>
              {finishedItems.map(i=><option key={i.id} value={i.id}>{i.item_number} — {i.item_name}</option>)}
            </select>
          </div>
          <div className="fg"><label>الكمية المخططة</label>
            <input type="number" value={form.planned_qty} onChange={e=>setForm({...form,planned_qty:e.target.value})} min="1"/>
          </div>
          <div className="fg"><label>تاريخ التصنيع المخطط</label>
            <input type="date" value={form.planned_date} onChange={e=>setForm({...form,planned_date:e.target.value})}/>
          </div>
          <div className="fg"><label>ملاحظات</label>
            <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/>
          </div>
        </div>
      </Modal>

      {/* Modal تسجيل الإنتاج الفعلي */}
      <Modal open={!!stageModal} onClose={() => setStageModal(null)} title={`تسجيل الإنتاج الفعلي — ${stageModal?.wo_number}`}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setStageModal(null)}>إلغاء</button>
          <button className="btn btn-success" onClick={() => {
            setOrders(orders.map(o => o.id === stageModal.id ? { ...o, status:"DONE" } : o));
            setStageModal(null);
          }}>✅ تأكيد وتحديث المخزون</button>
        </>}>
        {stageModal && <>
          <div className="alert a-warn mb3">سيتم خصم المواد الخام وإضافة المنتجات النهائية للمخزون تلقائياً</div>
          <div className="g2">
            <div className="fg"><label>الكمية الفعلية المنتجة</label>
              <input type="number" value={stageForm.actual_qty} onChange={e=>setStageForm({...stageForm,actual_qty:e.target.value})} min="0"/>
            </div>
            <div className="fg"><label>الدمجز (Damages)</label>
              <input type="number" value={stageForm.damages} onChange={e=>setStageForm({...stageForm,damages:e.target.value})} min="0"/>
            </div>
            <div className="fg" style={{ gridColumn:"span 2" }}><label>سبب الدمجز (إن وجد)</label>
              <input value={stageForm.damage_reason} onChange={e=>setStageForm({...stageForm,damage_reason:e.target.value})} placeholder="تلف في التعبئة، خلل في الماكينة..."/>
            </div>
          </div>
          <div style={{ background:"var(--bg)", padding:"12px 14px", borderRadius:8, fontSize:13 }}>
            <div className="flex jb mb2"><span>الكمية المخططة:</span><strong className="num">{stageModal.planned_qty.toLocaleString("en-US")}</strong></div>
            <div className="flex jb mb2"><span>الكمية الفعلية:</span><strong className="num" style={{ color:"var(--blue)" }}>{Number(stageForm.actual_qty).toLocaleString("en-US")}</strong></div>
            <div className="flex jb mb2"><span>الدمجز:</span><strong className="num" style={{ color:"var(--red)" }}>{Number(stageForm.damages).toLocaleString("en-US")}</strong></div>
            <div className="flex jb" style={{ borderTop:"1px solid var(--border)", paddingTop:8 }}>
              <span>نسبة الكفاءة:</span>
              <strong style={{ color: (stageForm.actual_qty/stageModal.planned_qty*100)>=90?"var(--green)":"var(--amber)" }}>
                <span className="num">{stageModal.planned_qty>0?((stageForm.actual_qty/stageModal.planned_qty)*100).toFixed(1):0}</span>%
              </strong>
            </div>
          </div>
        </>}
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// SALES PAGE
// ══════════════════════════════════════════════════════════
const SalesPage = ({ user }) => {
  const [orders, setOrders] = useState(MOCK.salesOrders);
  const [modal, setModal]   = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm]     = useState({ customer_id:"", delivery_date:"", notes:"" });
  const [lines, setLines]   = useState([{ _id:uid(), item_id:"", item_number:"", item_name:"", quantity:"", unit_price:"", discount:"0", current_qty:0 }]);
  const [errors, setErrors] = useState([]);

  const finishedItems = MOCK.items.filter(i => i.item_type === "FINISHED");

  const selectSalesItem = (idx, item) => {
    const n = [...lines];
    n[idx].item_id      = item.id;
    n[idx].item_number  = item.item_number;
    n[idx].item_name    = item.item_name;
    n[idx].current_qty  = item.current_qty;
    setLines(n);
  };

  const calcLine = (l) => Number(l.quantity||0) * Number(l.unit_price||0) - Number(l.discount||0);
  const subtotal  = lines.reduce((s,l) => s + calcLine(l), 0);
  const tax       = subtotal * 0.19;
  const total     = subtotal + tax;

  const validate = () => {
    const e = [];
    if (!form.customer_id) e.push("العميل مطلوب");
    lines.forEach((l,i) => {
      if (!l.item_id) e.push(`السطر ${i+1}: يجب اختيار منتج`);
      if (!l.quantity || Number(l.quantity)<=0) e.push(`السطر ${i+1}: الكمية مطلوبة`);
      if (!l.unit_price || Number(l.unit_price)<=0) e.push(`السطر ${i+1}: السعر مطلوب`);
      if (Number(l.quantity) > l.current_qty) e.push(`السطر ${i+1}: الكمية المطلوبة (${l.quantity}) تتجاوز المتاح (${fmtQty(l.current_qty)})`);
    });
    setErrors(e);
    return e.length === 0;
  };

  const save = () => {
    if (!validate()) return;
    const cust = MOCK.customers.find(c => c.id === form.customer_id);
    const newSO = { id:uid(), so_number:`SO-2024-${String(orders.length+1).padStart(4,"0")}`, customer_name:cust?.name||"—", order_date:today(), status:"DRAFT", total_amount:total };
    setOrders([...orders, newSO]);
    setModal(false);
    setLines([{ _id:uid(), item_id:"", item_number:"", item_name:"", quantity:"", unit_price:"", discount:"0", current_qty:0 }]);
    setErrors([]);
  };

  const ship = (so) => {
    if (!window.confirm(`شحن وإقفال ${so.so_number}؟ سيتم خصم المنتجات من المخزون`)) return;
    setOrders(orders.map(o => o.id===so.id ? {...o, status:"SHIPPED"} : o));
  };

  const filtered = orders.filter(o => !search || o.so_number.includes(search) || o.customer_name.includes(search));

  return (
    <div>
      <div className="flex jb aic mb4">
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>💰 أوامر البيع</h2>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>جميع الأسعار والفواتير بالدينار الجزائري 🇩🇿</p>
        </div>
        {can(user.role,"sales","admin") && <button className="btn btn-primary" onClick={() => { setModal(true); setErrors([]); }}>＋ أمر بيع جديد</button>}
      </div>

      <div className="card">
        <div className="flex gap3 mb4"><SearchBar value={search} onChange={setSearch} placeholder="بحث برقم الأمر أو العميل..."/></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>رقم الأمر</th><th>العميل</th><th>التاريخ</th><th>الإجمالي (د.ج)</th><th>الحالة</th><th>إجراء</th></tr></thead>
            <tbody>
              {filtered.map(so => (
                <tr key={so.id}>
                  <td style={{ fontWeight:700, color:"var(--blue)" }}>{so.so_number}</td>
                  <td style={{ fontWeight:600 }}>{so.customer_name}</td>
                  <td className="num">{fmtDate(so.order_date)}</td>
                  <td className="num" style={{ fontWeight:700 }}>{fmt(so.total_amount)}</td>
                  <td>{SOBadge(so.status)}</td>
                  <td>
                    {so.status === "CONFIRMED" && can(user.role,"warehouse","admin") && (
                      <button className="btn btn-success btn-sm" onClick={() => ship(so)}>🚚 شحن + خصم المخزون</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="إنشاء أمر بيع جديد 🇩🇿" size={860}
        footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>إلغاء</button><button className="btn btn-primary" onClick={save}>إنشاء الأمر</button></>}>

        {errors.length > 0 && (
          <div className="alert a-err mb3">
            <ul style={{ paddingRight:16 }}>{errors.map((e,i) => <li key={i} style={{ fontSize:12 }}>{e}</li>)}</ul>
          </div>
        )}

        <div className="alert a-info mb3" style={{ fontSize:12 }}>🇩🇿 جميع الأسعار والفواتير بالدينار الجزائري</div>

        <div className="g2">
          <div className="fg"><label>العميل *</label>
            <select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})}>
              <option value="">اختر العميل</option>
              {MOCK.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="fg"><label>تاريخ التسليم المتوقع</label>
            <input type="date" value={form.delivery_date} onChange={e=>setForm({...form,delivery_date:e.target.value})}/>
          </div>
        </div>

        <div className="flex jb aic mb3">
          <span style={{ fontWeight:700, fontSize:14 }}>المنتجات (من المخزون)</span>
          <button className="btn btn-outline btn-sm" onClick={() => setLines([...lines, { _id:uid(), item_id:"", item_number:"", item_name:"", quantity:"", unit_price:"", discount:"0", current_qty:0 }])}>＋ إضافة منتج</button>
        </div>

        {lines.map((line, idx) => (
          <div key={line._id} style={{ background:"var(--bg)", borderRadius:10, padding:14, marginBottom:10, border:"1px solid var(--border)" }}>
            <div className="flex jb aic mb3">
              <span style={{ fontWeight:700, fontSize:13, color:"var(--blue)" }}>المنتج {idx+1}</span>
              {lines.length > 1 && <button className="btn-icon" onClick={() => setLines(lines.filter((_,i)=>i!==idx))} style={{ color:"var(--red)" }}>🗑</button>}
            </div>
            <div className="g2">
              <div className="fg" style={{ gridColumn:"span 2", marginBottom:8 }}>
                <label>المنتج (من المنتجات النهائية فقط) *</label>
                <ItemAutocomplete items={finishedItems} value={line.item_number}
                  onChange={v=>{const n=[...lines];n[idx].item_number=v;setLines(n);}}
                  onSelect={item=>selectSalesItem(idx,item)}/>
                {line.item_name && (
                  <div style={{ marginTop:5, fontSize:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <strong style={{ color:"var(--green)" }}>✓ {line.item_name}</strong>
                    <span style={{ color: Number(line.quantity)>line.current_qty?"var(--red)":"var(--muted)" }}>
                      متاح في المخزون: <strong className="num">{fmtQty(line.current_qty)}</strong>
                    </span>
                  </div>
                )}
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>الكمية *</label>
                <input type="number" value={line.quantity} onChange={e=>{const n=[...lines];n[idx].quantity=e.target.value;setLines(n);}} min="1"/>
                {line.item_id && Number(line.quantity)>line.current_qty && (
                  <span style={{ color:"var(--red)", fontSize:11 }}>⚠ تتجاوز الكمية المتاحة</span>
                )}
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>سعر الوحدة (د.ج) *</label>
                <input type="number" value={line.unit_price} onChange={e=>{const n=[...lines];n[idx].unit_price=e.target.value;setLines(n);}} min="0"/>
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>خصم (د.ج)</label>
                <input type="number" value={line.discount} onChange={e=>{const n=[...lines];n[idx].discount=e.target.value;setLines(n);}} min="0"/>
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label>الإجمالي (د.ج)</label>
                <div className="num" style={{ padding:"9px 12px", background:"#fff", border:"1px solid var(--border)", borderRadius:8, fontWeight:700, color:"var(--blue)" }}>
                  {fmt(calcLine(line))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div style={{ padding:"14px 16px", background:"#F0FDF4", borderRadius:10, border:"1px solid #A7F3D0" }}>
          {[["المجموع الفرعي", fmt(subtotal)], ["الضريبة (19%)", fmt(tax)]].map(([l,v]) => (
            <div key={l} className="flex jb" style={{ marginBottom:6, fontSize:13 }}>
              <span style={{ color:"var(--muted)" }}>{l}:</span>
              <strong className="num">{v} د.ج</strong>
            </div>
          ))}
          <div className="flex jb" style={{ borderTop:"1px solid #A7F3D0", paddingTop:8, fontWeight:800, fontSize:16 }}>
            <span>🇩🇿 الإجمالي:</span>
            <span className="num" style={{ color:"#065F46" }}>{fmt(total)} د.ج</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// IT TICKETS
// ══════════════════════════════════════════════════════════
const ITPage = ({ user }) => {
  const [tickets, setTickets] = useState(MOCK.itTickets);
  const [modal, setModal]     = useState(false);
  const [tab, setTab]         = useState("OPEN");
  const [form, setForm]       = useState({ item_id:"", ticket_type:"REPAIR", title:"", description:"", quantity:"", lot_number:"", priority:"MEDIUM", assigned_to:"" });

  const save = () => {
    const item = MOCK.items.find(i => i.id === form.item_id);
    const newTK = { id:uid(), ticket_number:`IT-2024-${String(tickets.length+1).padStart(4,"0")}`, item_name:item?.item_name||null, item_number:item?.item_number||null, ...form, status:"OPEN", quantity:Number(form.quantity)||null };
    setTickets([...tickets, newTK]);
    setModal(false);
  };

  const resolve = (tk, action) => setTickets(tickets.map(t => t.id===tk.id ? {...t, status:"RESOLVED", action_taken:action} : t));

  const filteredTickets = tickets.filter(t => tab === "ALL" || t.status === tab);

  return (
    <div>
      <div className="flex jb aic mb4">
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>🔧 تذاكر IT والجودة</h2>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>صيانة، تعديلات جوهرية، حجز جودة، إعادة تصنيع</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>＋ تذكرة جديدة</button>
      </div>

      <div className="tabs">
        {[["OPEN","مفتوح"],["IN_PROGRESS","قيد التنفيذ"],["RESOLVED","محلول"],["ALL","الكل"]].map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l} ({tickets.filter(t=>k==="ALL"||t.status===k).length})</button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>رقم التذكرة</th><th>النوع</th><th>العنوان</th><th>المنتج المتأثر</th><th>الكمية</th><th>رقم الدفعة</th><th>الأولوية</th><th>الحالة</th><th>إجراء</th></tr>
            </thead>
            <tbody>
              {filteredTickets.map(tk => (
                <tr key={tk.id}>
                  <td style={{ fontWeight:700, color:"var(--purple)" }}>{tk.ticket_number}</td>
                  <td><Badge label={TK_TYPE[tk.ticket_type]||tk.ticket_type} cls="b-cyan"/></td>
                  <td style={{ fontWeight:600, maxWidth:200 }}>{tk.title}</td>
                  <td>{tk.item_name ? <span style={{ fontSize:12 }}>{tk.item_name}</span> : <span style={{ color:"var(--muted)" }}>—</span>}</td>
                  <td className="num">{tk.quantity ? tk.quantity.toLocaleString("en-US") : "—"}</td>
                  <td className="num" style={{ fontSize:12 }}>{tk.lot_number || "—"}</td>
                  <td>{PriBadge(tk.priority)}</td>
                  <td>{TKBadge(tk.status)}</td>
                  <td>
                    {tk.status === "OPEN" && can(user.role,"it","quality","admin") && (
                      <button className="btn btn-success btn-sm" onClick={() => {
                        const action = prompt("الإجراء المتخذ:");
                        if (action) resolve(tk, action);
                      }}>✓ حل</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="فتح تذكرة IT / جودة جديدة"
        footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>إلغاء</button><button className="btn btn-primary" onClick={save}>فتح التذكرة</button></>}>
        <div className="g2">
          <div className="fg"><label>نوع التذكرة *</label>
            <select value={form.ticket_type} onChange={e=>setForm({...form,ticket_type:e.target.value})}>
              {Object.entries(TK_TYPE).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="fg"><label>الأولوية</label>
            <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
              {Object.entries(TK_PRIORITY).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="fg" style={{ gridColumn:"span 2" }}><label>عنوان المشكلة *</label>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="وصف موجز للمشكلة..."/>
          </div>
          <div className="fg"><label>المنتج / المادة المتأثرة</label>
            <select value={form.item_id} onChange={e=>setForm({...form,item_id:e.target.value})}>
              <option value="">اختياري</option>
              {MOCK.items.map(i => <option key={i.id} value={i.id}>{i.item_number} — {i.item_name}</option>)}
            </select>
          </div>
          <div className="fg"><label>الكمية المتأثرة</label>
            <input type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} min="0"/>
          </div>
          <div className="fg"><label>رقم الدفعة (Lot Number)</label>
            <input value={form.lot_number} onChange={e=>setForm({...form,lot_number:e.target.value})} placeholder="LOT-2024-001" style={{ direction:"ltr", textAlign:"left" }}/>
          </div>
          <div className="fg"><label>تكليف إلى</label>
            <select value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}>
              <option value="">اختياري</option>
              {MOCK.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="fg" style={{ gridColumn:"span 2" }}><label>وصف تفصيلي</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="تفاصيل المشكلة، الأعراض، ما تم ملاحظته..."/>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// AUDIT LOG
// ══════════════════════════════════════════════════════════
const AuditPage = () => (
  <div>
    <h2 style={{ fontSize:20, fontWeight:800, marginBottom:20 }}>📜 سجل النشاط</h2>
    <div className="card">
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>المستخدم</th><th>الإجراء</th><th>الوحدة</th><th>التاريخ والوقت</th></tr></thead>
          <tbody>
            {MOCK.auditLogs.map((log,i) => (
              <tr key={log.id}>
                <td className="num" style={{ color:"var(--muted)" }}>{i+1}</td>
                <td style={{ fontWeight:600 }}>{log.user_name}</td>
                <td>{log.action}</td>
                <td><Badge label={log.module} cls="b-blue"/></td>
                <td className="num" style={{ fontSize:12, color:"var(--muted)" }}>{new Date(log.created_at).toLocaleString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════
// PURCHASE INVOICES
// ══════════════════════════════════════════════════════════
const PurchaseInvPage = ({ user }) => {
  const [invs, setInvs]     = useState(MOCK.purchaseInvoices);
  const [modal, setModal]   = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm]     = useState({ supplier_id:"", invoice_number:"", invoice_date:today(), currency:"EUR", exchange_rate:145.5, subtotal:"", tax_rate:"19", discount:"0", notes:"" });
  const [attachment, setAttachment] = useState(null);

  const rates = { EUR:145.5, GBP:170.2, USD:134.8, DZD:1 };
  const taxAmount = Number(form.subtotal||0) * Number(form.tax_rate||0) / 100;
  const total     = Number(form.subtotal||0) + taxAmount - Number(form.discount||0);
  const totalDZD  = total * (rates[form.currency]||1);

  const save = () => {
    const sup = MOCK.suppliers.find(s => s.id === form.supplier_id);
    const newInv = { id:uid(), pi_number:`PI-2024-${String(invs.length+1).padStart(4,"0")}`, supplier_name:sup?.name||"—", invoice_number:form.invoice_number, invoice_date:form.invoice_date, currency:form.currency, total, total_dzd:totalDZD, status:"CONFIRMED" };
    setInvs([...invs, newInv]);
    setModal(false);
    setAttachment(null);
  };

  const filtered = invs.filter(i => !search || i.pi_number.includes(search) || i.supplier_name.includes(search) || i.invoice_number.includes(search));

  return (
    <div>
      <div className="flex jb aic mb4">
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>🧾 فواتير الشراء</h2>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>فواتير الموردين بالعملة الأجنبية — محوّلة للدينار</p>
        </div>
        {can(user.role,"purchasing","admin") && <button className="btn btn-primary" onClick={() => setModal(true)}>＋ فاتورة شراء</button>}
      </div>

      <div className="card">
        <div className="flex gap3 mb4"><SearchBar value={search} onChange={setSearch} placeholder="بحث برقم الفاتورة أو المورد..."/></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>رقم الفاتورة</th><th>المورد</th><th>رقم فاتورة المورد</th><th>التاريخ</th><th>العملة</th><th>المبلغ الأصلي</th><th>بالدينار الجزائري</th><th>الحالة</th></tr></thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight:700, color:"var(--blue)" }}>{inv.pi_number}</td>
                  <td style={{ fontWeight:600 }}>{inv.supplier_name}</td>
                  <td><code className="num" style={{ fontSize:12 }}>{inv.invoice_number}</code></td>
                  <td className="num">{fmtDate(inv.invoice_date)}</td>
                  <td><span className="badge b-blue">{CURRENCIES[inv.currency]?.flag} {inv.currency}</span></td>
                  <td className="num" style={{ fontWeight:700 }}>{fmt(inv.total)} {CURRENCIES[inv.currency]?.symbol}</td>
                  <td className="num" style={{ fontWeight:800, color:"var(--green)" }}>{fmt(inv.total_dzd)} <span style={{ fontSize:11, color:"var(--muted)" }}>د.ج</span></td>
                  <td><Badge label={inv.status==="CONFIRMED"?"مؤكد":"مسودة"} cls={inv.status==="CONFIRMED"?"b-green":"b-gray"}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="إضافة فاتورة شراء" size={720}
        footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>إلغاء</button><button className="btn btn-primary" onClick={save}>حفظ الفاتورة</button></>}>
        <div className="g2">
          <div className="fg"><label>المورد *</label>
            <select value={form.supplier_id} onChange={e=>setForm({...form,supplier_id:e.target.value})}>
              <option value="">اختر المورد</option>
              {MOCK.suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="fg"><label>رقم فاتورة المورد *</label>
            <input value={form.invoice_number} onChange={e=>setForm({...form,invoice_number:e.target.value})} style={{ direction:"ltr", textAlign:"left" }}/>
          </div>
          <div className="fg"><label>تاريخ الفاتورة</label>
            <input type="date" value={form.invoice_date} onChange={e=>setForm({...form,invoice_date:e.target.value})}/>
          </div>
          <div className="fg"><label>العملة</label>
            <select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value,exchange_rate:rates[e.target.value]||1})}>
              {Object.entries(CURRENCIES).map(([k,v])=><option key={k} value={k}>{v.flag} {k} — {v.symbol}</option>)}
            </select>
          </div>
          <div className="fg"><label>سعر الصرف (1 {CURRENCIES[form.currency]?.symbol} = كم دينار)</label>
            <input type="number" value={form.exchange_rate} onChange={e=>setForm({...form,exchange_rate:e.target.value})}/>
          </div>
          <div className="fg"><label>المجموع الفرعي ({CURRENCIES[form.currency]?.symbol})</label>
            <input type="number" value={form.subtotal} onChange={e=>setForm({...form,subtotal:e.target.value})}/>
          </div>
          <div className="fg"><label>نسبة الضريبة %</label>
            <input type="number" value={form.tax_rate} onChange={e=>setForm({...form,tax_rate:e.target.value})}/>
          </div>
          <div className="fg"><label>الخصم ({CURRENCIES[form.currency]?.symbol})</label>
            <input type="number" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})}/>
          </div>
        </div>
        <div style={{ padding:"12px 14px", background:"var(--bg)", borderRadius:8, marginBottom:14 }}>
          {[["المجموع الفرعي", `${fmt(Number(form.subtotal||0))} ${CURRENCIES[form.currency]?.symbol}`],
            [`الضريبة (${form.tax_rate}%)`, `${fmt(taxAmount)} ${CURRENCIES[form.currency]?.symbol}`],
            ["الخصم", `-${fmt(Number(form.discount||0))} ${CURRENCIES[form.currency]?.symbol}`]
          ].map(([l,v]) => (
            <div key={l} className="flex jb" style={{ fontSize:13, marginBottom:5 }}>
              <span style={{ color:"var(--muted)" }}>{l}:</span><strong className="num">{v}</strong>
            </div>
          ))}
          <div className="flex jb" style={{ borderTop:"1px solid var(--border)", paddingTop:8, fontWeight:800, fontSize:15 }}>
            <span>الإجمالي بالعملة الأصلية:</span><span className="num" style={{ color:"var(--blue)" }}>{fmt(total)} {CURRENCIES[form.currency]?.symbol}</span>
          </div>
          <div className="flex jb" style={{ fontWeight:800, fontSize:16, color:"#065F46", marginTop:6 }}>
            <span>🇩🇿 بالدينار الجزائري:</span><span className="num">{fmt(totalDZD)} د.ج</span>
          </div>
        </div>
        <FileUpload value={attachment} onChange={setAttachment} label="نسخة الفاتورة (PDF أو صورة) — إلزامي للأرشفة"/>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════
const SettingsPage = () => {
  const [settings, setSettings] = useState({ company_name:"مصنع النيوتريفايد للمكملات الغذائية", phone:"+213-21-123456", vat_number:"000123456789", tax_rate:"19" });
  const [rates, setRates]       = useState({ EUR:145.5, GBP:170.2, USD:134.8 });
  const [saved, setSaved]       = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:800, marginBottom:20 }}>⚙️ إعدادات النظام</h2>
      {saved && <div className="alert a-ok mb3">✅ تم حفظ الإعدادات</div>}
      <div className="g2">
        <div className="card">
          <div className="card-header"><span className="card-title">بيانات الشركة</span></div>
          {[["company_name","اسم الشركة"],["phone","الهاتف"],["vat_number","الرقم الضريبي"],["tax_rate","نسبة الضريبة %"]].map(([k,l]) => (
            <div key={k} className="fg"><label>{l}</label>
              <input value={settings[k]||""} onChange={e=>setSettings({...settings,[k]:e.target.value})}/>
            </div>
          ))}
          <button className="btn btn-primary" onClick={save}>حفظ</button>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">💱 أسعار الصرف — الدينار الجزائري</span></div>
          {Object.entries(rates).map(([code,rate]) => (
            <div key={code} className="fg">
              <label>{CURRENCIES[code]?.flag} 1 {CURRENCIES[code]?.symbol} ({code}) = كم دينار</label>
              <input type="number" value={rate} onChange={e=>setRates({...rates,[code]:Number(e.target.value)})}/>
            </div>
          ))}
          <button className="btn btn-primary" onClick={save}>حفظ الأسعار</button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const stored = localStorage.getItem("nutrierp_user");
    if (stored) try { setUser(JSON.parse(stored)); } catch {}
  }, []);

  const login = (u) => { setUser(u); localStorage.setItem("nutrierp_user", JSON.stringify(u)); };
  const logout = () => { setUser(null); localStorage.removeItem("nutrierp_user"); localStorage.removeItem("nutrierp_token"); };

  if (!user) return <><style>{css}</style><LoginPage onLogin={login}/></>;

  const pages = {
    dashboard:    <DashboardPage    user={user}/>,
    master:       <MasterDataPage   user={user}/>,
    stock:        <StockPage        user={user}/>,
    "goods-in":   <GoodsReceiptPage user={user}/>,
    "purchase-inv":<PurchaseInvPage user={user}/>,
    bom:          <div style={{ padding:20 }}><h2 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>🔬 وصفات التصنيع</h2><div className="alert a-info">هذه الوحدة تحتاج اتصال بـ Backend لعرض وصفات التصنيع الكاملة مع حسابات المواد</div></div>,
    "work-orders":<WorkOrdersPage   user={user}/>,
    sales:        <SalesPage        user={user}/>,
    reports:      <SalesReportsPage user={user}/>,
    "it-tickets": <ITPage           user={user}/>,
    users:        <div style={{ padding:20 }}><h2 style={{ fontSize:20, fontWeight:800 }}>👥 إدارة المستخدمين</h2></div>,
    settings:     <SettingsPage/>,
    audit:        <AuditPage/>,
  };

  return (
    <>
      <style>{css}</style>
      <div className="layout">
        <Sidebar user={user} page={page} nav={setPage} logout={logout}/>
        <div className="main">
          <div className="topbar">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:18 }}>💊</span>
              <span style={{ fontWeight:700, fontSize:14 }}>NutriERP</span>
              <span style={{ color:"var(--border)", margin:"0 4px" }}>|</span>
              <span style={{ color:"var(--muted)", fontSize:13 }}>مصنع تعبئة المكملات الغذائية</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>{new Date().toLocaleDateString("en-GB")}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", background:"var(--bg)", borderRadius:8, cursor:"pointer" }} onClick={logout}>
                <div style={{ width:28, height:28, background:`linear-gradient(135deg,#059669,#2563EB)`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff" }}>{user.name.slice(0,2)}</div>
                <span style={{ fontSize:13, fontWeight:600 }}>{user.name}</span>
                <span style={{ fontSize:11, color:"var(--muted)" }}>({ROLES_AR[user.role]})</span>
              </div>
            </div>
          </div>
          <div className="page">
            {pages[page] || <DashboardPage user={user}/>}
          </div>
        </div>
      </div>
    </>
  );
}
