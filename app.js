


const SUPABASE_URL = "https://yxzjddriuglqwtzxmgbi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);

function showApp(session) {
  $("loginView").classList.toggle("hidden", !!session);
  $("appView").classList.toggle("hidden", !session);

  if (session) {
    $("userEmail").textContent = session.user.email;
    loadCustomers();
  }
}

async function init() {
  if (SUPABASE_URL.startsWith("DAN_")) {
    $("loginMsg").textContent = "Bạn chưa cấu hình Supabase trong app.js.";
    return;
  }

  const { data: { session } } = await sb.auth.getSession();
  showApp(session);

  sb.auth.onAuthStateChange((_event, session) => {
    showApp(session);
  });
}

// ĐĂNG NHẬP
$("loginBtn").onclick = async () => {
  $("loginMsg").textContent = "";

  const email = $("email").value.trim();
  const password = $("password").value;

  const { error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    $("loginMsg").textContent = error.message;
  }
};

// ĐĂNG XUẤT
$("logoutBtn").onclick = () => sb.auth.signOut();

// LẤY GPS
$("gpsBtn").onclick = () => {
  if (!navigator.geolocation) {
    $("gpsStatus").textContent = "Thiết bị không hỗ trợ GPS";
    return;
  }

  $("gpsStatus").textContent = "Đang lấy vị trí...";

  navigator.geolocation.getCurrentPosition(
    p => {
      $("gpsStatus").dataset.lat = p.coords.latitude;
      $("gpsStatus").dataset.lng = p.coords.longitude;

      $("gpsStatus").textContent =
        `Đã lấy GPS: ${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`;
    },
    e => {
      $("gpsStatus").textContent =
        "Không lấy được GPS: " + e.message;
    },
    {
      enableHighAccuracy: true
    }
  );
};

// LƯU KHÁCH HÀNG
$("saveBtn").onclick = async () => {
  const name = $("name").value.trim();
  const phone = $("phone").value.trim();

  if (!name || !phone) {
    alert("Vui lòng nhập Họ tên và Số điện thoại.");
    return;
  }

  const { data: { user } } = await sb.auth.getUser();

  const lat = parseFloat($("gpsStatus").dataset.lat);
  const lng = parseFloat($("gpsStatus").dataset.lng);

  const payload = {
    name,
    phone,
    cccd: $("cccd").value.trim(),
    address: $("address").value.trim(),
    note: $("note").value.trim(),
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
    created_by: user.id
  };

  const { error } = await sb
    .from("customers")
    .insert(payload);

  if (error) {
    alert("Lưu thất bại: " + error.message);
    return;
  }

  ["name", "phone", "cccd", "address", "note"]
    .forEach(id => $(id).value = "");

  $("gpsStatus").textContent = "";
  delete $("gpsStatus").dataset.lat;
  delete $("gpsStatus").dataset.lng;

  alert("Đã lưu khách hàng.");
  loadCustomers();
};

// TẢI DANH SÁCH
async function loadCustomers() {
  const { data, error } = await sb
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Không tải được dữ liệu: " + error.message);
    return;
  }

  window.customers = data || [];
  renderCustomers();
}

// HIỂN THỊ
function renderCustomers() {
  const q = $("search").value.trim().toLowerCase();

  const rows = window.customers.filter(c =>
    [c.name, c.phone, c.address, c.note, c.cccd]
      .some(v => (v || "").toLowerCase().includes(q))
  );

  $("count").textContent = `Có ${rows.length} khách hàng`;

  $("customerRows").innerHTML = rows.map(c => {

    let gps = `<span style="color:#999">Chưa có vị trí</span>`;

    if (c.latitude != null && c.longitude != null) {
      const mapsUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`;

      gps = `
        <a class="gps"
           target="_blank"
           rel="noopener"
           href="${mapsUrl}">
           📍 Dẫn đường
        </a>
      `;
    }

    return `
      <tr>
        <td>${esc(c.name)}</td>
        <td>${esc(c.phone)}</td>
        <td>${esc(c.address || "")}</td>

        <td>
          ${gps}
        </td>

        <td>${esc(c.note || "")}</td>

        <td>
          ${new Date(c.created_at).toLocaleString("vi-VN")}
        </td>

        <td>
          <button onclick="editCustomer(${c.id})">
            ✏️ Sửa
          </button>

          <button
            onclick="deleteCustomer(${c.id})"
            style="background:#dc3545;color:white;">
            🗑️ Xóa
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// SỬA KHÁCH HÀNG
window.editCustomer = async function(id) {

  const customer = window.customers.find(c => c.id === id);

  if (!customer) {
    alert("Không tìm thấy khách hàng.");
    return;
  }

  const name = prompt("Họ tên:", customer.name);
  if (name === null) return;

  const phone = prompt("Số điện thoại:", customer.phone);
  if (phone === null) return;

  const address = prompt(
    "Địa chỉ:",
    customer.address || ""
  );
  if (address === null) return;

  const note = prompt(
    "Ghi chú:",
    customer.note || ""
  );
  if (note === null) return;

  const { error } = await sb
    .from("customers")
    .update({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      note: note.trim()
    })
    .eq("id", id);

  if (error) {
    alert("Sửa thất bại: " + error.message);
    return;
  }

  alert("Đã cập nhật khách hàng.");
  loadCustomers();
};

// XÓA KHÁCH HÀNG
window.deleteCustomer = async function(id) {

  const customer = window.customers.find(c => c.id === id);

  if (!customer) {
    alert("Không tìm thấy khách hàng.");
    return;
  }

  const ok = confirm(
    `Bạn có chắc muốn XÓA khách hàng:\n\n${customer.name}\n${customer.phone}\n\nKhông thể hoàn tác!`
  );

  if (!ok) return;

  const { error } = await sb
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Xóa thất bại: " + error.message);
    return;
  }

  alert("Đã xóa khách hàng.");
  loadCustomers();
};

// CHỐNG LỖI HTML
function esc(v) {
  return String(v).replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
}

$("search").oninput = renderCustomers;
$("refreshBtn").onclick = loadCustomers;

init();
