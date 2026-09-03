const SUPABASE_URL = "https://yxzjddriuglqwtzxmgbi.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";

const sb = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = (id) => document.getElementById(id);

let customers = [];
let latitude = null;
let longitude = null;
let cameraStream = null;
let photoData = null;
let editingCustomerId = null;

let map = null;
let markers = [];


/* =========================
   KHỞI ĐỘNG
========================= */

document.addEventListener("DOMContentLoaded", () => {
  init();
});


async function init() {
  console.log("APP JS đã chạy");

  // Kiểm tra phiên đăng nhập
  const { data, error } = await sb.auth.getSession();

  if (error) {
    console.error("Lỗi kiểm tra đăng nhập:", error);
  }

  if (data && data.session) {
    showApp(data.session);
  } else {
    showLogin();
  }

  // Theo dõi trạng thái đăng nhập
  sb.auth.onAuthStateChange((event, session) => {
    console.log("Auth event:", event);

    if (session) {
      showApp(session);
    } else {
      showLogin();
    }
  });

  setupEvents();
}


/* =========================
   GIAO DIỆN LOGIN / APP
========================= */

function showLogin() {
  const loginView = $("loginView");
  const appView = $("appView");

  if (loginView) loginView.style.display = "";
  if (appView) appView.style.display = "none";
}


async function showApp(session) {
  const loginView = $("loginView");
  const appView = $("appView");

  if (loginView) loginView.style.display = "none";
  if (appView) appView.style.display = "";

  const menuEmail = $("menuEmail");

  if (menuEmail && session && session.user) {
    menuEmail.textContent = session.user.email || "";
  }

  await loadCustomers();
}


/* =========================
   SỰ KIỆN
========================= */

function setupEvents() {

  /* LOGIN */

  const loginBtn = $("loginBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", login);
  }

  const loginForm = $("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      login();
    });
  }


  /* LOGOUT */

  const logoutBtn = $("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const menuLogout = $("menuLogout");

  if (menuLogout) {
    menuLogout.addEventListener("click", logout);
  }


  /* MENU */

  const menuBtn = $("menuBtn");
  const closeMenuBtn = $("closeMenuBtn");
  const menuOverlay = $("menuOverlay");

  if (menuBtn) {
    menuBtn.addEventListener("click", openMenu);
  }

  if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", closeMenu);
  }

  if (menuOverlay) {
    menuOverlay.addEventListener("click", closeMenu);
  }


  /* NAVIGATION */

  if ($("menuAdd")) {
    $("menuAdd").addEventListener("click", () => {
      closeMenu();
      showMain();
    });
  }

  if ($("menuCustomers")) {
    $("menuCustomers").addEventListener("click", () => {
      closeMenu();
      showCustomers();
    });
  }

  if ($("menuMap")) {
    $("menuMap").addEventListener("click", () => {
      closeMenu();
      showMap();
    });
  }

  if ($("backFromCustomers")) {
    $("backFromCustomers").addEventListener("click", showMain);
  }

  if ($("backFromMap")) {
    $("backFromMap").addEventListener("click", showMain);
  }


  /* GPS */

  if ($("gpsBtn")) {
    $("gpsBtn").addEventListener("click", getGPS);
  }


  /* CAMERA */

  if ($("cameraBtn")) {
    $("cameraBtn").addEventListener("click", openCamera);
  }

  if ($("takePhotoBtn")) {
    $("takePhotoBtn").addEventListener("click", takePhoto);
  }

  if ($("closeCameraBtn")) {
    $("closeCameraBtn").addEventListener("click", closeCamera);
  }


  /* SAVE */

  if ($("saveBtn")) {
    $("saveBtn").addEventListener("click", saveCustomer);
  }


  /* SEARCH */

  if ($("search")) {
    $("search").addEventListener("input", renderCustomers);
  }
}


/* =========================
   ĐĂNG NHẬP
========================= */

async function login() {

  const emailInput = $("email");
  const passwordInput = $("password");
  const loginStatus = $("loginStatus");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value : "";

  if (!email || !password) {
    if (loginStatus) {
      loginStatus.textContent = "❌ Vui lòng nhập email và mật khẩu";
    }
    return;
  }

  if (loginStatus) {
    loginStatus.textContent = "⏳ Đang đăng nhập...";
  }

  const loginBtn = $("loginBtn");

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = "⏳ Đang đăng nhập...";
  }

  try {

    const { data, error } = await sb.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error("LOGIN ERROR:", error);

      if (loginStatus) {
        loginStatus.textContent = "❌ " + error.message;
      }

      return;
    }

    if (data && data.session) {

      localStorage.setItem("rememberEmail", email);

      if (loginStatus) {
        loginStatus.textContent = "✅ Đăng nhập thành công";
      }

      showApp(data.session);
    }

  } catch (err) {

    console.error(err);

    if (loginStatus) {
      loginStatus.textContent =
        "❌ Có lỗi xảy ra: " + err.message;
    }

  } finally {

    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Đăng nhập";
    }
  }
}


/* =========================
   ĐĂNG XUẤT
========================= */

async function logout() {

  const { error } = await sb.auth.signOut();

  if (error) {
    alert("❌ Đăng xuất thất bại: " + error.message);
    return;
  }

  showLogin();
}


/* =========================
   MENU
========================= */

function openMenu() {

  const sideMenu = $("sideMenu");
  const menuOverlay = $("menuOverlay");

  if (sideMenu) {
    sideMenu.classList.add("open");
  }

  if (menuOverlay) {
    menuOverlay.style.display = "block";
  }
}


function closeMenu() {

  const sideMenu = $("sideMenu");
  const menuOverlay = $("menuOverlay");

  if (sideMenu) {
    sideMenu.classList.remove("open");
  }

  if (menuOverlay) {
    menuOverlay.style.display = "none";
  }
}


/* =========================
   CHUYỂN TRANG
========================= */

function hideAllViews() {

  const mainView = $("mainView");
  const customersView = $("customersView");
  const mapView = $("mapView");

  if (mainView) mainView.style.display = "none";
  if (customersView) customersView.style.display = "none";
  if (mapView) mapView.style.display = "none";
}


function showMain() {

  hideAllViews();

  const mainView = $("mainView");

  if (mainView) {
    mainView.style.display = "";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function showCustomers() {

  hideAllViews();

  const customersView = $("customersView");

  if (customersView) {
    customersView.style.display = "";
  }

  renderCustomers();
}


function showMap() {

  hideAllViews();

  const mapView = $("mapView");

  if (mapView) {
    mapView.style.display = "";
  }

  setTimeout(() => {
    initMap();
    loadMarkers();
  }, 200);
}


/* =========================
   GPS
========================= */

function getGPS() {

  const gpsStatus = $("gpsStatus");

  if (!navigator.geolocation) {

    if (gpsStatus) {
      gpsStatus.textContent =
        "❌ Thiết bị không hỗ trợ GPS";
    }

    return;
  }

  if (gpsStatus) {
    gpsStatus.textContent = "📍 Đang lấy vị trí...";
  }

  navigator.geolocation.getCurrentPosition(

    (position) => {

      latitude = position.coords.latitude;
      longitude = position.coords.longitude;

      if (gpsStatus) {
        gpsStatus.textContent =
          `✅ GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

    },

    (error) => {

      console.error(error);

      if (gpsStatus) {

        if (error.code === 1) {
          gpsStatus.textContent =
            "❌ Bạn chưa cho phép truy cập vị trí";
        } else {
          gpsStatus.textContent =
            "❌ Không lấy được vị trí";
        }
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}


/* =========================
   CAMERA
========================= */

async function openCamera() {

  const cameraArea = $("cameraArea");
  const camera = $("camera");
  const photoStatus = $("photoStatus");

  if (!navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia) {

    if (photoStatus) {
      photoStatus.textContent =
        "❌ Trình duyệt không hỗ trợ camera";
    }

    return;
  }

  try {

    cameraStream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment"
          }
        },
        audio: false
      });

    if (camera) {
      camera.srcObject = cameraStream;
      camera.play();
    }

    if (cameraArea) {
      cameraArea.style.display = "";
    }

    if (photoStatus) {
      photoStatus.textContent =
        "📷 Camera đã mở";
    }

  } catch (error) {

    console.error(error);

    if (photoStatus) {
      photoStatus.textContent =
        "❌ Không thể mở camera: " + error.message;
    }
  }
}


function takePhoto() {

  const camera = $("camera");
  const canvas = $("photoCanvas");
  const preview = $("photoPreview");
  const photoStatus = $("photoStatus");

  if (!camera || !canvas) {
    return;
  }

  const width = camera.videoWidth;
  const height = camera.videoHeight;

  if (!width || !height) {

    if (photoStatus) {
      photoStatus.textContent =
        "❌ Camera chưa sẵn sàng";
    }

    return;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    camera,
    0,
    0,
    width,
    height
  );

  photoData =
    canvas.toDataURL(
      "image/jpeg",
      0.75
    );

  if (preview) {
    preview.src = photoData;
    preview.style.display = "";
  }

  if (photoStatus) {
    photoStatus.textContent =
      "✅ Đã chụp ảnh";
  }

  closeCamera();
}


function closeCamera() {

  if (cameraStream) {

    cameraStream.getTracks().forEach(
      track => track.stop()
    );

    cameraStream = null;
  }

  const cameraArea = $("cameraArea");

  if (cameraArea) {
    cameraArea.style.display = "none";
  }
}


/* =========================
   LƯU / CẬP NHẬT KHÁCH HÀNG
========================= */

async function saveCustomer() {

  const nameInput = $("name");
  const addressInput = $("address");
  const noteInput = $("note");
  const saveStatus = $("saveStatus");
  const saveBtn = $("saveBtn");

  const name =
    nameInput ? nameInput.value.trim() : "";

  const address =
    addressInput ? addressInput.value.trim() : "";

  const note =
    noteInput ? noteInput.value.trim() : "";

  if (!name) {

    if (saveStatus) {
      saveStatus.textContent =
        "❌ Vui lòng nhập họ tên khách hàng";
    }

    return;
  }

  const {
    data: { user },
    error: userError
  } = await sb.auth.getUser();

  if (userError || !user) {

    if (saveStatus) {
      saveStatus.textContent =
        "❌ Phiên đăng nhập đã hết";
    }

    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent =
      editingCustomerId
        ? "⏳ Đang cập nhật..."
        : "⏳ Đang lưu...";
  }

  const customerData = {
    name: name,
    address: address || null,
    note: note || null,
    latitude: latitude,
    longitude: longitude,
    photo_url: photoData
  };

  try {

    let error = null;

    if (editingCustomerId) {

      const result = await sb
        .from("customers")
        .update(customerData)
        .eq("id", editingCustomerId)
        .eq("user_id", user.id);

      error = result.error;

    } else {

      const result = await sb
        .from("customers")
        .insert({
          ...customerData,
          user_id: user.id
        });

      error = result.error;
    }

    if (error) {

      console.error(error);

      if (saveStatus) {
        saveStatus.textContent =
          "❌ Lưu thất bại: " + error.message;
      }

      return;
    }

    if (saveStatus) {
      saveStatus.textContent =
        editingCustomerId
          ? "✅ Đã cập nhật khách hàng"
          : "✅ Đã lưu khách hàng";
    }

    resetCustomerForm();

    await loadCustomers();

  } catch (error) {

    console.error(error);

    if (saveStatus) {
      saveStatus.textContent =
        "❌ Có lỗi: " + error.message;
    }

  } finally {

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent =
        "💾 Lưu khách hàng";
    }
  }
}


/* =========================
   XÓA FORM
========================= */

function resetCustomerForm() {

  if ($("name")) $("name").value = "";
  if ($("address")) $("address").value = "";
  if ($("note")) $("note").value = "";

  latitude = null;
  longitude = null;
  photoData = null;
  editingCustomerId = null;

  if ($("gpsStatus")) {
    $("gpsStatus").textContent =
      "Chưa lấy vị trí";
  }

  if ($("photoStatus")) {
    $("photoStatus").textContent =
      "Chưa chụp ảnh";
  }

  if ($("photoPreview")) {
    $("photoPreview").src = "";
    $("photoPreview").style.display = "none";
  }

  if ($("saveBtn")) {
    $("saveBtn").textContent =
      "💾 Lưu khách hàng";
  }
}


/* =========================
   TẢI DANH SÁCH
========================= */

async function loadCustomers() {

  const {
    data: { user },
    error: userError
  } = await sb.auth.getUser();

  if (userError || !user) {
    console.log("Chưa đăng nhập");
    return;
  }

  const { data, error } = await sb
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(
      "LOAD CUSTOMERS ERROR:",
      error
    );

    return;
  }

  customers = data || [];

  renderCustomers();

  if (map) {
    loadMarkers();
  }
}


/* =========================
   HIỂN THỊ KHÁCH HÀNG
========================= */

function renderCustomers() {

  const list = $("customerList");
  const count = $("count");
  const searchInput = $("search");

  if (!list) return;

  const keyword =
    searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

  const filtered = customers.filter(customer => {

    return (
      String(customer.name || "")
        .toLowerCase()
        .includes(keyword) ||

      String(customer.address || "")
        .toLowerCase()
        .includes(keyword) ||

      String(customer.note || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  if (count) {
    count.textContent =
      filtered.length;
  }

  if (filtered.length === 0) {

    list.innerHTML =
      `<div class="empty">
        Chưa có khách hàng
      </div>`;

    return;
  }

  list.innerHTML =
    filtered.map(customer => {

      const gps =
        customer.latitude != null &&
        customer.longitude != null;

      const photo =
        customer.photo_url
          ? `<button onclick="showPhoto(${JSON.stringify(customer.photo_url)})">
               📷 Xem ảnh
             </button>`
          : "";

      return `
        <div class="customer-card">

          <div class="customer-name">
            ${escapeHTML(customer.name)}
          </div>

          <div>
            📍 ${escapeHTML(customer.address || "Chưa có địa chỉ")}
          </div>

          <div>
            📝 ${escapeHTML(customer.note || "Không có ghi chú")}
          </div>

          <div>
            ${
              gps
                ? "📍 Đã lưu GPS"
                : "⚠️ Chưa có GPS"
            }
          </div>

          <div class="customer-actions">

            ${
              gps
                ? `<button onclick="focusCustomer(${customer.id})">
                     🗺️ Xem bản đồ
                   </button>`
                : ""
            }

            ${photo}

            <button onclick="editCustomer(${customer.id})">
              ✏️ Chỉnh sửa
            </button>

            <button
              class="delete-btn"
              onclick="deleteCustomer(${customer.id})">
              🗑️ Xóa
            </button>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================
   CHỈNH SỬA
========================= */

function editCustomer(id) {

  const customer =
    customers.find(
      item => Number(item.id) === Number(id)
    );

  if (!customer) {
    alert("❌ Không tìm thấy khách hàng");
    return;
  }

  editingCustomerId = customer.id;

  if ($("name")) {
    $("name").value =
      customer.name || "";
  }

  if ($("address")) {
    $("address").value =
      customer.address || "";
  }

  if ($("note")) {
    $("note").value =
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

  if ($("gpsStatus")) {

    $("gpsStatus").textContent =
      latitude != null &&
      longitude != null
        ? `✅ GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        : "Chưa có GPS";
  }

  if ($("photoPreview")) {

    if (photoData) {
      $("photoPreview").src = photoData;
      $("photoPreview").style.display = "";
    } else {
      $("photoPreview").src = "";
      $("photoPreview").style.display = "none";
    }
  }

  if ($("photoStatus")) {

    $("photoStatus").textContent =
      photoData
        ? "✅ Đã có ảnh"
        : "Chưa có ảnh";
  }

  if ($("saveBtn")) {
    $("saveBtn").textContent =
      "💾 Cập nhật khách hàng";
  }

  showMain();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   XÓA KHÁCH HÀNG
========================= */

async function deleteCustomer(id) {

  const customer =
    customers.find(
      item => Number(item.id) === Number(id)
    );

  if (!customer) {
    alert("❌ Không tìm thấy khách hàng");
    return;
  }

  const confirmed =
    confirm(
      `Bạn có chắc muốn xóa khách hàng "${customer.name}" không?`
    );

  if (!confirmed) {
    return;
  }

  const {
    data: { user },
    error: userError
  } = await sb.auth.getUser();

  if (userError || !user) {
    alert("❌ Phiên đăng nhập đã hết");
    return;
  }

  const { error } = await sb
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {

    console.error(error);

    alert(
      "❌ Xóa thất bại:\n" +
      error.message
    );

    return;
  }

  customers =
    customers.filter(
      item => Number(item.id) !== Number(id)
    );

  renderCustomers();

  if (map) {
    loadMarkers();
  }

  alert("✅ Đã xóa khách hàng");
}


/* =========================
   BẢN ĐỒ
========================= */

function initMap() {

  const mapElement = $("map");

  if (!mapElement) {
    return;
  }

  if (map) {

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return;
  }

  map =
    L.map("map").setView(
      [10.0452, 105.7469],
      13
    );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}


function loadMarkers() {

  if (!map) return;

  markers.forEach(
    marker => map.removeLayer(marker)
  );

  markers = [];

  const validCustomers =
    customers.filter(
      customer =>
        customer.latitude != null &&
        customer.longitude != null
    );

  validCustomers.forEach(customer => {

    const marker =
      L.marker([
        Number(customer.latitude),
        Number(customer.longitude)
      ])
      .addTo(map);

    marker.bindPopup(`
      <strong>
        ${escapeHTML(customer.name)}
      </strong>
      <br>
      ${escapeHTML(customer.address || "")}
      <br>
      ${
        customer.note
          ? escapeHTML(customer.note)
          : ""
      }
    `);

    marker.customerId =
      customer.id;

    markers.push(marker);
  });

  const mapCount = $("mapCount");

  if (mapCount) {
    mapCount.textContent =
      validCustomers.length;
  }
}


function focusCustomer(id) {

  const customer =
    customers.find(
      item => Number(item.id) === Number(id)
    );

  if (!customer) return;

  if (
    customer.latitude == null ||
    customer.longitude == null
  ) {
    alert("❌ Khách hàng chưa có GPS");
    return;
  }

  showMap();

  setTimeout(() => {

    if (!map) return;

    const lat =
      Number(customer.latitude);

    const lng =
      Number(customer.longitude);

    map.setView(
      [lat, lng],
      17
    );

    const marker =
      markers.find(
        item =>
          Number(item.customerId) ===
          Number(id)
      );

    if (marker) {
      marker.openPopup();
    }

  }, 400);
}


/* =========================
   VỊ TRÍ CỦA TÔI
========================= */

function showMyLocation() {

  if (
    latitude == null ||
    longitude == null
  ) {
    alert(
      "❌ Bạn chưa lấy GPS"
    );
    return;
  }

  if (!map) return;

  map.setView(
    [latitude, longitude],
    17
  );

  L.marker([
    latitude,
    longitude
  ])
  .addTo(map)
  .bindPopup(
    "📍 Vị trí của tôi"
  )
  .openPopup();
}


if ($("myLocationBtn")) {
  $("myLocationBtn").addEventListener(
    "click",
    showMyLocation
  );
}


/* =========================
   XEM ẢNH
========================= */

function showPhoto(photo) {

  if (!photo) {
    return;
  }

  const win =
    window.open(
      "",
      "_blank"
    );

  if (!win) {
    alert(
      "❌ Trình duyệt đã chặn cửa sổ ảnh"
    );
    return;
  }

  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta name="viewport"
            content="width=device-width,initial-scale=1">
      <title>Ảnh khách hàng</title>
      <style>
        body {
          margin: 0;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }

        img {
          max-width: 100%;
          max-height: 100vh;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <img src="${photo}">
    </body>
    </html>
  `);

  win.document.close();
}


/* =========================
   CHỐNG HTML
========================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   EMAIL GHI NHỚ
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const emailInput =
      $("email");

    if (emailInput) {

      const savedEmail =
        localStorage.getItem(
          "rememberEmail"
        );

      if (savedEmail) {
        emailInput.value =
          savedEmail;
      }
    }
  }
);
