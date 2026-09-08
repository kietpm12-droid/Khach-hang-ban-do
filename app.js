// ============================================================
// APP.JS
// QUẢN LÝ KHÁCH HÀNG + GPS + ẢNH NHÀ + BẢN ĐỒ
// ============================================================

const SUPABASE_URL = "https://yxzjddriuglqwtzxmgbi.supabase.co";
const SUPABASE_KEY = "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ============================================================
// BIẾN TOÀN CỤC
// ============================================================

let currentUser = null;
let customers = [];

let editingId = null;

let latitude = null;
let longitude = null;

let photoData = null;

let map = null;
let mapMarkers = [];

let openedCustomerId = null;


// ============================================================
// KHỞI ĐỘNG
// ============================================================

document.addEventListener("DOMContentLoaded", async function () {

  setupEvents();

  // --------------------------------------------
  // NHỚ EMAIL ĐĂNG NHẬP
  // --------------------------------------------

  const savedEmail = localStorage.getItem("savedEmail");

  const emailInput = document.getElementById("email");
  const rememberCheckbox = document.getElementById("rememberLogin");

  if (savedEmail && emailInput) {
    emailInput.value = savedEmail;

    if (rememberCheckbox) {
      rememberCheckbox.checked = true;
    }
  }

  // --------------------------------------------
  // KIỂM TRA SESSION
  // --------------------------------------------

  const {
    data: {
      session
    }
  } = await db.auth.getSession();

  if (session && session.user) {

    currentUser = session.user;

    showApp();

  } else {

    showLogin();

  }

});


// ============================================================
// GẮN SỰ KIỆN
// ============================================================

function setupEvents() {

  // LOGIN
  const loginBtn = document.getElementById("loginBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", login);
  }

  const passwordInput = document.getElementById("password");

  if (passwordInput) {

    passwordInput.addEventListener("keydown", function (e) {

      if (e.key === "Enter") {
        login();
      }

    });

  }


  // MENU
  const menuBtn = document.getElementById("menuBtn");

  if (menuBtn) {
    menuBtn.addEventListener("click", openMenu);
  }


  const menuOverlay = document.getElementById("menuOverlay");

  if (menuOverlay) {
    menuOverlay.addEventListener("click", closeMenu);
  }


  document.querySelectorAll("[data-page]").forEach(function (item) {

    item.addEventListener("click", function () {

      const page = this.dataset.page;

      closeMenu();

      showPage(page);

    });

  });


  // LOGOUT
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }


  // GPS
  const gpsBtn = document.getElementById("gpsBtn");

  if (gpsBtn) {
    gpsBtn.addEventListener("click", getGPS);
  }


  // CAMERA
  const cameraBtn = document.getElementById("cameraBtn");
  const cameraInput = document.getElementById("cameraInput");

  if (cameraBtn && cameraInput) {

    cameraBtn.addEventListener("click", function () {
      cameraInput.click();
    });

    cameraInput.addEventListener("change", handlePhoto);

  }


  // SAVE
  const saveBtn = document.getElementById("saveBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveCustomer);
  }


  // CANCEL
  const cancelBtn = document.getElementById("cancelBtn");

  if (cancelBtn) {

    cancelBtn.addEventListener("click", function () {

      resetForm();

      showPage("customers");

    });

  }


  // SEARCH
  const searchInput = document.getElementById("searchCustomer");

  if (searchInput) {

    searchInput.addEventListener("input", function () {

      renderCustomers(this.value);

    });

  }

}


// ============================================================
// LOGIN
// ============================================================

async function login() {

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {

    alert("❌ Vui lòng nhập email và mật khẩu.");

    return;

  }


  const {
    data,
    error
  } = await db.auth.signInWithPassword({

    email: email,
    password: password

  });


  if (error) {

    console.error(error);

    alert("❌ Đăng nhập thất bại:\n" + error.message);

    return;

  }


  currentUser = data.user;


  const rememberCheckbox = document.getElementById("rememberLogin");

  if (rememberCheckbox && rememberCheckbox.checked) {

    localStorage.setItem(
      "savedEmail",
      email
    );

  } else {

    localStorage.removeItem("savedEmail");

  }


  showApp();

}


// ============================================================
// HIỂN THỊ APP
// ============================================================

function showApp() {

  const loginPage = document.getElementById("loginPage");
  const app = document.getElementById("app");

  if (loginPage) {
    loginPage.style.display = "none";
  }

  if (app) {
    app.style.display = "block";
  }


  // HIỂN THỊ EMAIL TRÊN MENU
  const userEmail = document.getElementById("userEmail");

  if (userEmail && currentUser) {

    userEmail.textContent =
      currentUser.email || "";

  }


  showPage("home");

  loadCustomers();

}


// ============================================================
// HIỂN THỊ LOGIN
// ============================================================

function showLogin() {

  const loginPage = document.getElementById("loginPage");
  const app = document.getElementById("app");

  if (loginPage) {
    loginPage.style.display = "flex";
  }

  if (app) {
    app.style.display = "none";
  }

}


// ============================================================
// MENU
// ============================================================

function openMenu() {

  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");

  if (menu) {
    menu.classList.add("open");
  }

  if (overlay) {
    overlay.classList.add("show");
  }

}


function closeMenu() {

  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");

  if (menu) {
    menu.classList.remove("open");
  }

  if (overlay) {
    overlay.classList.remove("show");
  }

}


// ============================================================
// CHUYỂN TRANG
// ============================================================

function showPage(page) {

  document.querySelectorAll(".page").forEach(function (p) {

    p.style.display = "none";

  });


  let target = null;

  if (page === "home") {
    target = document.getElementById("homePage");
  }

  if (page === "add") {
    target = document.getElementById("addCustomerPage");
  }

  if (page === "customers") {
    target = document.getElementById("customersPage");
  }

  if (page === "map") {
    target = document.getElementById("mapPage");
  }


  if (target) {
    target.style.display = "block";
  }


  // TRANG HOME
  if (page === "home") {

    updateStats();

  }


  // DANH SÁCH KHÁCH HÀNG
  if (page === "customers") {

    openedCustomerId = null;

    const searchInput =
      document.getElementById("searchCustomer");

    renderCustomers(
      searchInput ? searchInput.value : ""
    );

  }


  // BẢN ĐỒ
  if (page === "map") {

    setTimeout(function () {

      initMap();

    }, 100);

  }


  // THÊM KHÁCH
  if (page === "add") {

    const title =
      document.getElementById("addCustomerTitle");

    if (title) {

      title.textContent =
        editingId
          ? "Chỉnh sửa khách hàng"
          : "Thêm khách hàng";

    }

  }

}


// ============================================================
// GPS
// ============================================================

function getGPS() {

  if (!navigator.geolocation) {

    alert("❌ Thiết bị không hỗ trợ GPS.");

    return;

  }


  const status =
    document.getElementById("gpsStatus");


  if (status) {

    status.textContent =
      "📍 Đang lấy vị trí...";

  }


  navigator.geolocation.getCurrentPosition(

    function (position) {

      latitude =
        position.coords.latitude;

      longitude =
        position.coords.longitude;


      if (status) {

        status.textContent =
          `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      }

    },

    function (error) {

      console.error(error);

      if (status) {

        status.textContent =
          "❌ Không lấy được vị trí.";

      }

      alert(
        "❌ Không lấy được GPS.\n" +
        "Hãy bật quyền vị trí cho trình duyệt."
      );

    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }

  );

}


// ============================================================
// XỬ LÝ ẢNH
// ============================================================

function handlePhoto(event) {

  const file =
    event.target.files &&
    event.target.files[0];

  if (!file) return;


  if (!file.type.startsWith("image/")) {

    alert("❌ Vui lòng chọn file ảnh.");

    return;

  }


  const reader = new FileReader();


  reader.onload = function (e) {

    const img = new Image();


    img.onload = function () {

      // --------------------------------------------
      // GIẢM KÍCH THƯỚC ẢNH
      // --------------------------------------------

      const maxSize = 1200;

      let width = img.width;
      let height = img.height;


      if (width > maxSize || height > maxSize) {

        if (width > height) {

          height =
            height * (maxSize / width);

          width = maxSize;

        } else {

          width =
            width * (maxSize / height);

          height = maxSize;

        }

      }


      const canvas =
        document.createElement("canvas");

      canvas.width = Math.round(width);
      canvas.height = Math.round(height);


      const ctx =
        canvas.getContext("2d");


      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );


      // --------------------------------------------
      // JPEG QUALITY 70%
      // --------------------------------------------

      photoData =
        canvas.toDataURL(
          "image/jpeg",
          0.70
        );


      const preview =
        document.getElementById("photoPreview");


      if (preview) {

        preview.src = photoData;

        preview.style.display = "block";

      }


      const photoStatus =
        document.getElementById("photoStatus");


      if (photoStatus) {

        photoStatus.textContent =
          "✅ Đã chọn ảnh nhà";

      }

    };


    img.src = e.target.result;

  };


  reader.readAsDataURL(file);

}


// ============================================================
// LƯU KHÁCH HÀNG
// ============================================================

async function saveCustomer() {

  if (!currentUser) {

    alert("❌ Chưa đăng nhập.");

    return;

  }


  const nameInput =
    document.getElementById("customerName");

  const addressInput =
    document.getElementById("customerAddress");

  const noteInput =
    document.getElementById("customerNote");


  const name =
    nameInput
      ? nameInput.value.trim()
      : "";

  const address =
    addressInput
      ? addressInput.value.trim()
      : "";

  const note =
    noteInput
      ? noteInput.value.trim()
      : "";


  if (!name) {

    alert("❌ Vui lòng nhập tên khách hàng.");

    return;

  }


  if (!address) {

    alert("❌ Vui lòng nhập địa chỉ.");

    return;

  }


  const customerData = {

    name: name,

    address: address,

    note: note,

    latitude: latitude,

    longitude: longitude,

    photo_url: photoData

  };


  // ==========================================================
  // CẬP NHẬT
  // ==========================================================

  if (editingId) {

    const {
      error
    } = await db
      .from("customers")
      .update(customerData)
      .eq("id", editingId);


    if (error) {

      console.error(error);

      alert(
        "❌ Lỗi cập nhật:\n" +
        error.message
      );

      return;

    }


    alert("✅ Đã cập nhật khách hàng.");

  }

  // ==========================================================
  // THÊM MỚI
  // ==========================================================

  else {

    const {
      error
    } = await db
      .from("customers")
      .insert([customerData]);


    if (error) {

      console.error(error);

      alert(
        "❌ Lỗi lưu khách hàng:\n" +
        error.message
      );

      return;

    }


    alert("✅ Đã lưu khách hàng.");

  }


  resetForm();

  editingId = null;

  await loadCustomers();

  showPage("customers");

}


// ============================================================
// TẢI DANH SÁCH KHÁCH HÀNG
// ============================================================

async function loadCustomers() {

  const {
    data,
    error
  } = await db
    .from("customers")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(error);

    alert(
      "❌ Không thể tải danh sách khách hàng:\n" +
      error.message
    );

    return;

  }


  customers = data || [];


  renderCustomers();


  updateStats();


  if (map) {

    loadMapMarkers();

  }

}


// ============================================================
// RENDER DANH SÁCH KHÁCH HÀNG
// ============================================================
//
// QUAN TRỌNG:
// Chỉ hiển thị:
// - Tên
// - Địa chỉ
//
// BẤM VÀO KHÁCH HÀNG:
// mới hiện:
// - Địa chỉ đầy đủ
// - Ghi chú
// - GPS
// - Ảnh nhà
// - Chỉ đường
// - Sửa
// - Xóa
//
// ============================================================

function renderCustomers(searchText = "") {

  const container =
    document.getElementById("customersList");


  if (!container) return;


  const keyword =
    String(searchText || "")
      .trim()
      .toLowerCase();


  const filtered =
    customers.filter(function (c) {

      if (!keyword) return true;


      return (

        String(c.name || "")
          .toLowerCase()
          .includes(keyword)

        ||

        String(c.address || "")
          .toLowerCase()
          .includes(keyword)

        ||

        String(c.note || "")
          .toLowerCase()
          .includes(keyword)

      );

    });


  if (filtered.length === 0) {

    container.innerHTML = `
      <div style="
        padding:30px 15px;
        text-align:center;
        color:#777;
      ">
        📭 Chưa có khách hàng
      </div>
    `;

    return;

  }


  container.innerHTML =
    filtered
      .map(function (c) {

        return createCustomerCard(c);

      })
      .join("");

}


// ============================================================
// TẠO CARD KHÁCH HÀNG
// ============================================================

function createCustomerCard(c) {

  const isOpen =
    String(openedCustomerId) === String(c.id);


  // ==========================================================
  // LIST NHỎ
  // ==========================================================

  if (!isOpen) {

    return `
      <div
        class="customer-list-item"
        onclick="toggleCustomerDetail('${escapeHTML(String(c.id))}')"
        style="
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:12px;
          padding:12px 14px;
          margin-bottom:8px;
          cursor:pointer;
          box-shadow:0 1px 3px rgba(0,0,0,0.05);
          transition:0.2s;
        "
      >

        <div style="
          display:flex;
          align-items:center;
          gap:10px;
        ">

          <div style="
            width:38px;
            height:38px;
            min-width:38px;
            border-radius:50%;
            background:#eff6ff;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:19px;
          ">
            👤
          </div>


          <div style="
            flex:1;
            min-width:0;
          ">

            <div style="
              font-size:16px;
              font-weight:700;
              color:#111827;
              white-space:nowrap;
              overflow:hidden;
              text-overflow:ellipsis;
            ">
              ${escapeHTML(c.name || "Chưa có tên")}
            </div>


            <div style="
              margin-top:3px;
              font-size:13px;
              color:#6b7280;
              white-space:nowrap;
              overflow:hidden;
              text-overflow:ellipsis;
            ">
              📍 ${escapeHTML(c.address || "Chưa có địa chỉ")}
            </div>

          </div>


          <div style="
            font-size:20px;
            color:#9ca3af;
          ">
            ›
          </div>

        </div>

      </div>
    `;

  }


  // ==========================================================
  // CHI TIẾT KHI BẤM VÀO KHÁCH HÀNG
  // ==========================================================

  return `
    <div
      class="customer-detail-card"
      style="
        background:#fff;
        border:1px solid #dbeafe;
        border-radius:14px;
        margin-bottom:10px;
        overflow:hidden;
        box-shadow:0 3px 12px rgba(0,0,0,0.08);
      "
    >

      <!-- HEADER -->
      <div
        onclick="toggleCustomerDetail('${escapeHTML(String(c.id))}')"
        style="
          padding:14px;
          background:#eff6ff;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:space-between;
        "
      >

        <div style="
          font-size:17px;
          font-weight:700;
          color:#111827;
        ">
          👤 ${escapeHTML(c.name || "Chưa có tên")}
        </div>


        <div style="
          font-size:20px;
          color:#2563eb;
        ">
          ▲
        </div>

      </div>


      <!-- CHI TIẾT -->
      <div style="
        padding:14px;
      ">


        <!-- ĐỊA CHỈ -->
        <div style="
          margin-bottom:12px;
        ">

          <div style="
            font-size:13px;
            color:#6b7280;
            margin-bottom:4px;
          ">
            📍 Địa chỉ
          </div>

          <div style="
            font-size:15px;
            font-weight:500;
            color:#111827;
          ">
            ${escapeHTML(c.address || "Chưa có địa chỉ")}
          </div>

        </div>


        <!-- GHI CHÚ -->
        ${
          c.note
            ? `
              <div style="
                margin-bottom:12px;
              ">

                <div style="
                  font-size:13px;
                  color:#6b7280;
                  margin-bottom:4px;
                ">
                  📝 Ghi chú
                </div>

                <div style="
                  font-size:15px;
                  color:#111827;
                  white-space:pre-wrap;
                ">
                  ${escapeHTML(c.note)}
                </div>

              </div>
            `
            : ""
        }


        <!-- GPS -->
        ${
          c.latitude != null &&
          c.longitude != null
            ? `
              <div style="
                margin-bottom:14px;
              ">

                <div style="
                  font-size:13px;
                  color:#6b7280;
                  margin-bottom:4px;
                ">
                  📌 Vị trí GPS
                </div>

                <div style="
                  font-size:14px;
                  color:#111827;
                ">
                  ${Number(c.latitude).toFixed(6)},
                  ${Number(c.longitude).toFixed(6)}
                </div>

              </div>
            `
            : ""
        }


        <!-- ẢNH NHÀ -->
        ${
          c.photo_url
            ? `
              <div style="
                margin-bottom:14px;
              ">

                <div style="
                  font-size:13px;
                  color:#6b7280;
                  margin-bottom:6px;
                ">
                  🏠 Ảnh nhà
                </div>


                <img
                  src="${escapeHTML(c.photo_url)}"
                  alt="Ảnh nhà"
                  onclick="showPhoto('${escapeHTML(String(c.id))}')"
                  style="
                    width:100%;
                    max-height:320px;
                    object-fit:cover;
                    border-radius:12px;
                    display:block;
                    cursor:pointer;
                    border:1px solid #e5e7eb;
                  "
                >


                <div style="
                  margin-top:5px;
                  text-align:center;
                  font-size:12px;
                  color:#6b7280;
                ">
                  👆 Bấm vào ảnh để xem lớn
                </div>

              </div>
            `
            : `
              <div style="
                padding:14px;
                margin-bottom:14px;
                text-align:center;
                background:#f9fafb;
                border-radius:10px;
                color:#9ca3af;
              ">
                🏠 Chưa có ảnh nhà
              </div>
            `
        }


        <!-- CÁC NÚT -->
        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
        ">


          ${
            c.latitude != null &&
            c.longitude != null
              ? `
                <button
                  onclick="startNavigation(${Number(c.latitude)}, ${Number(c.longitude)})"
                  style="
                    border:0;
                    border-radius:9px;
                    padding:11px 8px;
                    background:#2563eb;
                    color:#fff;
                    font-weight:600;
                    cursor:pointer;
                  "
                >
                  🚗 Chỉ đường
                </button>
              `
              : `
                <button
                  disabled
                  style="
                    border:0;
                    border-radius:9px;
                    padding:11px 8px;
                    background:#d1d5db;
                    color:#6b7280;
                  "
                >
                  📍 Chưa có GPS
                </button>
              `
          }


          <button
            onclick="editCustomer('${escapeHTML(String(c.id))}')"
            style="
              border:0;
              border-radius:9px;
              padding:11px 8px;
              background:#f59e0b;
              color:#fff;
              font-weight:600;
              cursor:pointer;
            "
          >
            ✏️ Sửa
          </button>


          <button
            onclick="openCustomerMap('${escapeHTML(String(c.id))}')"
            style="
              border:0;
              border-radius:9px;
              padding:11px 8px;
              background:#10b981;
              color:#fff;
              font-weight:600;
              cursor:pointer;
            "
          >
            🗺️ Bản đồ
          </button>


          <button
            onclick="deleteCustomer('${escapeHTML(String(c.id))}')"
            style="
              border:0;
              border-radius:9px;
              padding:11px 8px;
              background:#ef4444;
              color:#fff;
              font-weight:600;
              cursor:pointer;
            "
          >
            🗑️ Xóa
          </button>


        </div>

      </div>

    </div>
  `;

}


// ============================================================
// MỞ / ĐÓNG CHI TIẾT KHÁCH HÀNG
// ============================================================

function toggleCustomerDetail(id) {

  if (
    openedCustomerId !== null &&
    String(openedCustomerId) === String(id)
  ) {

    openedCustomerId = null;

  } else {

    openedCustomerId = id;

  }


  const searchInput =
    document.getElementById("searchCustomer");


  renderCustomers(
    searchInput ? searchInput.value : ""
  );

}


// ============================================================
// XEM ẢNH LỚN
// ============================================================

function showPhoto(id) {

  const customer =
    customers.find(function (c) {

      return String(c.id) === String(id);

    });


  if (!customer || !customer.photo_url) {

    alert("❌ Không có ảnh.");

    return;

  }


  const newWindow =
    window.open("", "_blank");


  if (!newWindow) {

    alert(
      "⚠️ Trình duyệt đang chặn cửa sổ xem ảnh."
    );

    return;

  }


  newWindow.document.write(`
    <!DOCTYPE html>

    <html lang="vi">

    <head>

      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width,initial-scale=1"
      >

      <title>
        ${escapeHTML(customer.name || "Ảnh nhà")}
      </title>

      <style>

        * {
          box-sizing:border-box;
        }

        body {
          margin:0;
          background:#000;
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:10px;
        }

        img {
          max-width:100%;
          max-height:95vh;
          object-fit:contain;
        }

      </style>

    </head>

    <body>

      <img
        src="${escapeHTML(customer.photo_url)}"
        alt="Ảnh nhà"
      >

    </body>

    </html>
  `);

  newWindow.document.close();

}


// ============================================================
// ĐIỀU HƯỚNG GOOGLE MAPS
// ============================================================

function startNavigation(lat, lng) {

  const latitudeValue =
    Number(lat);

  const longitudeValue =
    Number(lng);


  if (
    !Number.isFinite(latitudeValue) ||
    !Number.isFinite(longitudeValue)
  ) {

    alert("❌ Tọa độ GPS không hợp lệ.");

    return;

  }


  const url =
    `https://www.google.com/maps/dir/?api=1&destination=${latitudeValue},${longitudeValue}`;


  window.open(
    url,
    "_blank"
  );

}


// ============================================================
// SỬA KHÁCH HÀNG
// ============================================================

function editCustomer(id) {

  const customer =
    customers.find(function (c) {

      return String(c.id) === String(id);

    });


  if (!customer) {

    alert("❌ Không tìm thấy khách hàng.");

    return;

  }


  editingId = customer.id;


  const nameInput =
    document.getElementById("customerName");

  const addressInput =
    document.getElementById("customerAddress");

  const noteInput =
    document.getElementById("customerNote");


  if (nameInput) {

    nameInput.value =
      customer.name || "";

  }


  if (addressInput) {

    addressInput.value =
      customer.address || "";

  }


  if (noteInput) {

    noteInput.value =
      customer.note || "";

  }


  latitude =
    customer.latitude != null
      ? Number(customer.latitude)
      : null;


  longitude =
    customer.longitude != null
      ? Number(customer.longitude)
      : null;


  photoData =
    customer.photo_url || null;


  // GPS STATUS
  const gpsStatus =
    document.getElementById("gpsStatus");


  if (gpsStatus) {

    if (
      latitude != null &&
      longitude != null
    ) {

      gpsStatus.textContent =
        `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    } else {

      gpsStatus.textContent =
        "📍 Chưa có GPS";

    }

  }


  // PHOTO PREVIEW
  const preview =
    document.getElementById("photoPreview");


  if (preview) {

    if (photoData) {

      preview.src = photoData;

      preview.style.display =
        "block";

    } else {

      preview.style.display =
        "none";

    }

  }


  showPage("add");

}


// ============================================================
// XÓA KHÁCH HÀNG
// ============================================================

async function deleteCustomer(id) {

  const customer =
    customers.find(function (c) {

      return String(c.id) === String(id);

    });


  const customerName =
    customer
      ? customer.name
      : "khách hàng";


  const confirmed =
    confirm(
      `Bạn có chắc muốn xóa "${customerName}" không?`
    );


  if (!confirmed) return;


  const {
    error
  } = await db
    .from("customers")
    .delete()
    .eq("id", id);


  if (error) {

    console.error(error);

    alert(
      "❌ Không thể xóa:\n" +
      error.message
    );

    return;

  }


  openedCustomerId = null;


  alert("✅ Đã xóa khách hàng.");


  await loadCustomers();

}


// ============================================================
// MỞ BẢN ĐỒ CỦA KHÁCH HÀNG
// ============================================================

function openCustomerMap(id) {

  const customer =
    customers.find(function (c) {

      return String(c.id) === String(id);

    });


  if (!customer) {

    alert("❌ Không tìm thấy khách hàng.");

    return;

  }


  if (
    customer.latitude == null ||
    customer.longitude == null
  ) {

    alert("❌ Khách hàng này chưa có GPS.");

    return;

  }


  showPage("map");


  setTimeout(function () {

    if (!map) return;


    const lat =
      Number(customer.latitude);

    const lng =
      Number(customer.longitude);


    map.setView(
      [lat, lng],
      17
    );


    mapMarkers.forEach(function (marker) {

      const position =
        marker.getLatLng();


      if (
        Math.abs(position.lat - lat) < 0.000001 &&
        Math.abs(position.lng - lng) < 0.000001
      ) {

        marker.openPopup();

      }

    });

  }, 300);

}


// ============================================================
// KHỞI TẠO BẢN ĐỒ
// ============================================================

function initMap() {

  const mapElement =
    document.getElementById("map");


  if (!mapElement) return;


  // Nếu bản đồ đã tồn tại
  if (map) {

    setTimeout(function () {

      map.invalidateSize();

      loadMapMarkers();

    }, 100);

    return;

  }


  map =
    L.map("map").setView(
      [10.0452, 105.7469],
      12
    );


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        "&copy; OpenStreetMap"
    }
  ).addTo(map);


  setTimeout(function () {

    map.invalidateSize();

  }, 200);


  loadMapMarkers();

}


// ============================================================
// MARKER BẢN ĐỒ
// ============================================================
//
// ẢNH TRÊN MAP NHỎ.
// BẤM VÀO MARKER MỚI HIỆN TÊN + THÔNG TIN.
// ============================================================

function loadMapMarkers() {

  if (!map) return;


  mapMarkers.forEach(function (marker) {

    map.removeLayer(marker);

  });


  mapMarkers = [];


  customers
    .filter(function (c) {

      return (
        c.latitude != null &&
        c.longitude != null
      );

    })
    .forEach(function (c) {

      const lat =
        Number(c.latitude);

      const lng =
        Number(c.longitude);


      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {

        return;

      }


      let icon;


      // ======================================================
      // CÓ ẢNH
      // ======================================================

      if (c.photo_url) {

        icon =
          L.divIcon({

            className:
              "customer-map-icon",

            html: `
              <div style="
                width:42px;
                height:42px;
                border-radius:50%;
                overflow:hidden;
                background:#fff;
                border:3px solid #fff;
                box-shadow:0 2px 8px rgba(0,0,0,0.35);
              ">

                <img
                  src="${escapeHTML(c.photo_url)}"
                  style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    display:block;
                  "
                >

              </div>
            `,

            iconSize:
              [48, 48],

            iconAnchor:
              [24, 24],

            popupAnchor:
              [0, -24]

          });

      }

      // ======================================================
      // KHÔNG CÓ ẢNH
      // ======================================================

      else {

        icon =
          L.divIcon({

            className:
              "customer-map-icon",

            html: `
              <div style="
                width:36px;
                height:36px;
                border-radius:50%;
                background:#2563eb;
                border:3px solid #fff;
                box-shadow:0 2px 8px rgba(0,0,0,0.35);
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:18px;
              ">
                📍
              </div>
            `,

            iconSize:
              [42, 42],

            iconAnchor:
              [21, 21],

            popupAnchor:
              [0, -21]

          });

      }


      const marker =
        L.marker(
          [lat, lng],
          {
            icon: icon
          }
        )
        .addTo(map);


      // ======================================================
      // POPUP
      // ======================================================

      marker.bindPopup(`

        <div style="
          min-width:220px;
          max-width:280px;
        ">

          ${
            c.photo_url
              ? `
                <img
                  src="${escapeHTML(c.photo_url)}"
                  style="
                    width:100%;
                    max-height:180px;
                    object-fit:cover;
                    border-radius:10px;
                    display:block;
                    margin-bottom:10px;
                  "
                >
              `
              : ""
          }


          <div style="
            font-size:17px;
            font-weight:700;
            margin-bottom:6px;
          ">
            ${escapeHTML(c.name || "Chưa có tên")}
          </div>


          <div style="
            font-size:14px;
            margin-bottom:6px;
          ">
            📍 ${escapeHTML(c.address || "Chưa có địa chỉ")}
          </div>


          ${
            c.note
              ? `
                <div style="
                  font-size:14px;
                  margin-bottom:10px;
                ">
                  📝 ${escapeHTML(c.note)}
                </div>
              `
              : ""
          }


          <button
            onclick="startNavigation(${lat},${lng})"
            style="
              width:100%;
              border:0;
              border-radius:8px;
              padding:10px 12px;
              background:#2563eb;
              color:white;
              font-weight:600;
              cursor:pointer;
            "
          >
            🚗 Chỉ đường
          </button>

        </div>

      `);


      mapMarkers.push(marker);

    });

}


// ============================================================
// THỐNG KÊ
// ============================================================

function updateStats() {

  const total =
    customers.length;


  const gpsCount =
    customers.filter(function (c) {

      return (
        c.latitude != null &&
        c.longitude != null
      );

    }).length;


  const photoCount =
    customers.filter(function (c) {

      return !!c.photo_url;

    }).length;


  // Tổng khách
  const totalElement =
    document.getElementById("totalCustomers");


  if (totalElement) {

    totalElement.textContent =
      total;

  }


  // Có GPS
  const gpsElement =
    document.getElementById("gpsCustomers");


  if (gpsElement) {

    gpsElement.textContent =
      gpsCount;

  }


  // Có ảnh
  const photoElement =
    document.getElementById("photoCustomers");


  if (photoElement) {

    photoElement.textContent =
      photoCount;

  }

}


// ============================================================
// RESET FORM
// ============================================================

function resetForm() {

  editingId = null;

  latitude = null;

  longitude = null;

  photoData = null;


  const nameInput =
    document.getElementById("customerName");

  const addressInput =
    document.getElementById("customerAddress");

  const noteInput =
    document.getElementById("customerNote");

  const cameraInput =
    document.getElementById("cameraInput");

  const preview =
    document.getElementById("photoPreview");

  const gpsStatus =
    document.getElementById("gpsStatus");

  const photoStatus =
    document.getElementById("photoStatus");


  if (nameInput) {
    nameInput.value = "";
  }


  if (addressInput) {
    addressInput.value = "";
  }


  if (noteInput) {
    noteInput.value = "";
  }


  if (cameraInput) {
    cameraInput.value = "";
  }


  if (preview) {

    preview.src = "";

    preview.style.display =
      "none";

  }


  if (gpsStatus) {

    gpsStatus.textContent =
      "📍 Chưa lấy GPS";

  }


  if (photoStatus) {

    photoStatus.textContent =
      "";

  }

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

  const {
    error
  } = await db.auth.signOut();


  if (error) {

    console.error(error);

    alert(
      "❌ Không thể đăng xuất:\n" +
      error.message
    );

    return;

  }


  currentUser = null;

  customers = [];

  map = null;

  mapMarkers = [];

  showLogin();

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
