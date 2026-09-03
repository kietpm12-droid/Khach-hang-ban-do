





const SUPABASE_URL = "https://yxzjddriuglqwtzxmgbi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);

function showApp(session){
  $("loginView").classList.toggle("hidden", !!session);
  $("appView").classList.toggle("hidden", !session);
  if(session){ $("userEmail").textContent = session.user.email; loadCustomers(); }
}

async function init(){
  if(SUPABASE_URL.startsWith("DAN_")) {
    $("loginMsg").textContent = "Bạn chưa cấu hình Supabase trong app.js.";
    return;
  }
  const {data:{session}} = await sb.auth.getSession();
  showApp(session);
  sb.auth.onAuthStateChange((_event, session)=>showApp(session));
}

$("loginBtn").onclick = async ()=>{
  $("loginMsg").textContent = "";
  const email=$("email").value.trim(), password=$("password").value;
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error) $("loginMsg").textContent=error.message;
};

$("logoutBtn").onclick = ()=>sb.auth.signOut();

$("gpsBtn").onclick = ()=>{
  if(!navigator.geolocation){$("gpsStatus").textContent="Thiết bị không hỗ trợ GPS";return}
  $("gpsStatus").textContent="Đang lấy vị trí...";
  navigator.geolocation.getCurrentPosition(p=>{
    $("gpsStatus").dataset.lat=p.coords.latitude;
    $("gpsStatus").dataset.lng=p.coords.longitude;
    $("gpsStatus").textContent=`Đã lấy GPS: ${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`;
  },e=>$("gpsStatus").textContent="Không lấy được GPS: "+e.message,{enableHighAccuracy:true});
};

$("saveBtn").onclick = async ()=>{
  const name=$("name").value.trim(), phone=$("phone").value.trim();
  if(!name||!phone){alert("Vui lòng nhập Họ tên và Số điện thoại.");return}
  const {data:{user}}=await sb.auth.getUser();
  const lat=parseFloat($("gpsStatus").dataset.lat), lng=parseFloat($("gpsStatus").dataset.lng);
  const payload={name,phone,cccd:$("cccd").value.trim(),address:$("address").value.trim(),
    note:$("note").value.trim(),latitude:Number.isFinite(lat)?lat:null,longitude:Number.isFinite(lng)?lng:null,
    created_by:user.id};
  const {error}=await sb.from("customers").insert(payload);
  if(error){alert("Lưu thất bại: "+error.message);return}
  ["name","phone","cccd","address","note"].forEach(id=>$(id).value="");
  $("gpsStatus").textContent=""; delete $("gpsStatus").dataset.lat; delete $("gpsStatus").dataset.lng;
  alert("Đã lưu khách hàng."); loadCustomers();
};

async function loadCustomers(){
  const {data,error}=await sb.from("customers").select("*").order("created_at",{ascending:false});
  if(error){alert("Không tải được dữ liệu: "+error.message);return}
  window.customers=data||[]; renderCustomers();
}
function renderCustomers(){
  const q=$("search").value.trim().toLowerCase();
  const rows=window.customers.filter(c=>
    [c.name,c.phone,c.address,c.note,c.cccd].some(v=>(v||"").toLowerCase().includes(q))
  );
  $("count").textContent=`Có ${rows.length} khách hàng`;
  $("customerRows").innerHTML=rows.map(c=>{
    const gps=(c.latitude!=null&&c.longitude!=null)
      ? `<a class="gps" target="_blank" href="https://www.google.com/maps?q=${c.latitude},${c.longitude}">Mở bản đồ</a>`:"";
    return `<tr><td>${esc(c.name)}</td><td>${esc(c.phone)}</td><td>${esc(c.address||"")}</td><td>${gps}</td><td>${esc(c.note||"")}</td><td>${new Date(c.created_at).toLocaleString("vi-VN")}</td></tr>`;
  }).join("");
}
function esc(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
$("search").oninput=renderCustomers;
$("refreshBtn").onclick=loadCustomers;
init();
