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
let photoData = null;
let cameraStream = null;
let editingCustomerId = null;

let map = null;
let markers = [];


// ================= START =================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ APP JS đã chạy");
  init();
});


// ================= INIT =================

async function init() {

  setupEvents();

  const savedEmail = localStorage.getItem("rememberEmail");

  if (savedEmail && $("email")) {
    $("email").value = savedEmail;
  }

  const { data, error } = await sb.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    showLogin();
    return;
  }

  if (data && data.session) {
    await showApp(data.session);
  } else {
    showLogin();
  }

  sb.auth.onAuthStateChange(async (event, session) => {

    console.log("Auth event:", event);

    if (session) {
      await showApp(session);
    } else {
      showLogin();
    }

  });
}


// ================= VIEW =================

function showLogin() {

  const loginView = $("loginView");
  const appView = $("appView");

  if (loginView) {
    loginView.classList.remove("hidden");
    loginView.style.display = "";
  }

  if (appView) {
    appView.classList.add("hidden");
    appView.style.display = "none";
  }
}


async function showApp(session) {

  const loginView = $("loginView");
  const appView = $("appView");

  if (loginView) {
    loginView.classList.add("hidden");
    loginView.style.display = "none";
  }

  if (appView) {
    appView.classList.remove("hidden");
    appView.style.display = "";
  }

  if ($("menuEmail") && session?.user) {
    $("menuEmail").textContent = session.user.email || "";
  }

  await loadCustomers();

  showMain();
}


// ================= EVENTS =================

function setupEvents() {

  // Login
  const loginBtn = $("loginBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", login);
  }


  // Logout
  const logoutBtn = $("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }


  const menuLogout = $("menuLogout");

  if (menuLogout) {
    menuLogout.addEventListener("click", logout);
  }


  // Menu
  const menuBtn = $("menuBtn");

  if (menuBtn) {
    menuBtn.addEventListener("click", openMenu);
  }


  const closeMenuBtn = $("closeMenuBtn");

  if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", closeMenu);
  }


  const menuOverlay = $("menuOverlay");

  if (menuOverlay) {
    menuOverlay.addEventListener("click", closeMenu);
  }


  // Menu Add
  const menuAdd = $("menuAdd");

  if (menuAdd) {
    menuAdd.addEventListener("click", () => {
      closeMenu();
      showMain();
    });
  }


  // Menu Customers
  const menuCustomers = $("menuCustomers");

  if (menuCustomers) {
    menuCustomers.addEventListener("click", () => {
      closeMenu();
      showCustomers();
    });
  }


  // Menu Map
  const menuMap = $("menuMap");

  if (menuMap) {
    menuMap.addEventListener("click", () => {
      closeMenu();
      showMap();
    });
  }


  // Back
  const backCustomers = $("backFromCustomers");

  if (backCustomers) {
    backCustomers.addEventListener("click", showMain);
  }


  const backMap = $("backFromMap");

  if (backMap) {
    backMap.addEventListener("click", showMain);
  }


  // GPS
  const gpsBtn = $("gpsBtn");

  if (gpsBtn) {
    gpsBtn.addEventListener("click", getGPS);
  }


  // Camera
  const cameraBtn = $("cameraBtn");

  if (cameraBtn) {
    cameraBtn.addEventListener("click", openCamera);
  }


  const takePhotoBtn = $("takePhotoBtn");

  if (takePhotoBtn) {
    takePhotoBtn.addEventListener("click", takePhoto);
  }


  const closeCameraBtn = $("closeCameraBtn");

  if (closeCameraBtn) {
    closeCameraBtn.addEventListener("click", closeCamera);
  }


  // Save
  const saveBtn = $("saveBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveCustomer);
  }


  // Search
  const search = $("search");

  if (search) {
    search.addEventListener("input", renderCustomers);
  }


  // My location
  const myLocationBtn = $("myLocationBtn");

  if (myLocationBtn) {
    myLocationBtn.addEventListener(
      "click",
      showMyLocation
    );
  }
}


// ================= LOGIN =================

async function login() {

  const email = $("email")?.value.trim() || "";
  const password = $("password")?.value || "";

  const loginMsg = $("loginMsg");
  const loginBtn = $("loginBtn");

  if (!email || !password) {

    if (loginMsg) {
      loginMsg.textContent =
        "❌ Vui lòng nhập email và mật khẩu";
    }

    return;
  }


  if (loginMsg) {
    loginMsg.textContent =
      "⏳ Đang đăng nhập...";
  }


  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent =
      "⏳ Đang đăng nhập...";
  }


  try {

    const { data, error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });


    if (error) {

      console.error("LOGIN ERROR:", error);

      if (loginMsg) {
        loginMsg.textContent =
          "❌ " + error.message;
      }

      return;
    }


    if (data?.session) {

      const remember =
        $("rememberLogin")?.checked;

      if (remember) {
        localStorage.setItem(
          "rememberEmail",
          email
        );
      } else {
        localStorage.removeItem(
          "rememberEmail"
        );
      }


      if (loginMsg) {
        loginMsg.textContent =
          "✅ Đăng nhập thành công";
      }

      await showApp(data.session);
    }

  } catch (error) {

    console.error(error);

    if (loginMsg) {
      loginMsg.textContent =
        "❌ Có lỗi: " + error.message;
    }

  } finally {

    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent =
        "🔐 Đăng nhập";
    }
  }
}


// ================= LOGOUT =================

async function logout() {

  const { error } =
    await sb.auth.signOut();

  if (error) {

    alert(
      "❌ Đăng xuất thất bại:\n" +
      error.message
    );

    return;
  }

  showLogin();
}


// ================= MENU =================

function openMenu() {

  const sideMenu = $("sideMenu");
  const overlay = $("menuOverlay");

  if (sideMenu) {
    sideMenu.classList.add("open");
  }

  if (overlay) {
    overlay.classList.remove("hidden");
    overlay.style.display = "block";
  }
}


function closeMenu() {

  const sideMenu = $("sideMenu");
  const overlay = $("menuOverlay");

  if (sideMenu) {
    sideMenu.classList.remove("open");
  }

  if (overlay) {
    overlay.classList.add("hidden");
    overlay.style.display = "none";
  }
}


// ================= PAGE =================

function hideAllViews() {

  const main = $("mainView");
  const customersView = $("customersView");
  const mapView = $("mapView");

  if (main) {
    main.classList.add("hidden");
    main.style.display = "none";
  }

  if (customersView) {
    customersView.classList.add("hidden");
    customersView.style.display = "none";
  }

  if (mapView) {
    mapView.classList.add("hidden");
    mapView.style.display = "none";
  }
}


function showMain() {

  hideAllViews();

  const main = $("mainView");

  if (main) {
    main.classList.remove("hidden");
    main.style.display = "";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function showCustomers() {

  hideAllViews();

  const view = $("customersView");

  if (view) {
    view.classList.remove("hidden");
    view.style.display = "";
  }

  renderCustomers();
}


function showMap() {

  hideAllViews();

  const view = $("mapView");

  if (view) {
    view.classList.remove("hidden");
    view.style.display = "";
  }

  setTimeout(() => {

    initMap();
    loadMarkers();

  }, 300);
}


// ================= GPS =================

function getGPS() {

  const status = $("gpsStatus");

  if (!navigator.geolocation) {

    if (status) {
      status.textContent =
        "❌ Thiết bị không hỗ trợ GPS";
    }

    return;
  }


  if (status) {
    status.textContent =
      "📍 Đang lấy vị trí...";
  }


  navigator.geolocation.getCurrentPosition(

    (position) => {

      latitude =
        position.coords.latitude;

      longitude =
        position.coords.longitude;


      if (status) {

        status.textContent =
          `✅ GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
    },

    (error) => {

      console.error(error);

      if (!status) return;

      if (error.code === 1) {

        status.textContent =
          "❌ Bạn chưa cho phép truy cập vị trí";

      } else {

        status.textContent =
          "❌ Không lấy được vị trí";
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}


// ================= CAMERA =================

async function openCamera() {

  const cameraArea = $("cameraArea");
  const camera = $("camera");
  const status = $("photoStatus");


  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    if (status) {
      status.textContent =
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

      camera.srcObject =
        cameraStream;

      await camera.play();
    }


    if (cameraArea) {

      cameraArea.classList.remove("hidden");
      cameraArea.style.display = "";
    }


    if (status) {
      status.textContent =
        "📷 Camera đã mở";
    }

  } catch (error) {

    console.error(error);

    if (status) {
      status.textContent =
        "❌ Không thể mở camera: " +
        error.message;
    }
  }
}


function takePhoto() {

  const camera = $("camera");
  const canvas = $("photoCanvas");
  const preview = $("photoPreview");
  const status = $("photoStatus");


  if (!camera || !canvas) return;


  const width =
    camera.videoWidth;

  const height =
    camera.videoHeight;


  if (!width || !height) {

    if (status) {
      status.textContent =
        "❌ Camera chưa sẵn sàng";
    }

    return;
  }


  canvas.width = width;
  canvas.height = height;


  const ctx =
    canvas.getContext("2d");

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

    preview.classList.remove("hidden");
    preview.style.display = "";
  }


  if (status) {
    status.textContent =
      "✅ Đã chụp ảnh";
  }


  closeCamera();
}


function closeCamera() {

  if (cameraStream) {

    cameraStream
      .getTracks()
      .forEach(track =>
        track.stop()
      );

    cameraStream = null;
  }


  const cameraArea =
    $("cameraArea");

  if (cameraArea) {

    cameraArea.classList.add("hidden");
    cameraArea.style.display = "none";
  }
}


// ================= SAVE =================

async function saveCustomer() {

  const name =
    $("name")?.value.trim() || "";

  const address =
    $("address")?.value.trim() || "";

  const note =
    $("note")?.value.trim() || "";

  const status =
    $("saveStatus");

  const saveBtn =
    $("saveBtn");


  if (!name) {

    if (status) {
      status.textContent =
        "❌ Vui lòng nhập họ tên khách hàng";
    }

    return;
  }


  const {
    data: { user },
    error: userError
  } = await sb.auth.getUser();


  if (userError || !user) {

    if (status) {
      status.textContent =
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

    address:
      address || null,

    note:
      note || null,

    latitude:
      latitude,

    longitude:
      longitude,

    photo_url:
      photoData
  };


  try {

    let error = null;


    // UPDATE
    if (editingCustomerId) {

      const result =
        await sb
          .from("customers")
          .update(customerData)
          .eq(
            "id",
            editingCustomerId
          )
          .eq(
            "user_id",
            user.id
          );

      error =
        result.error;

    }

    // INSERT
    else {

      const result =
        await sb
          .from("customers")
          .insert({
            ...customerData,
            user_id: user.id
          });

      error =
        result.error;
    }


    if (error) {

      console.error(
        "SAVE ERROR:",
        error
      );

      if (status) {
        status.textContent =
          "❌ Lưu thất bại: " +
          error.message;
      }

      return;
    }


    if (status) {

      status.textContent =
        editingCustomerId
          ? "✅ Đã cập nhật khách hàng"
          : "✅ Đã lưu khách hàng";
    }


    resetCustomerForm();

    await loadCustomers();

  } catch (error) {

    console.error(error);

    if (status) {
      status.textContent =
        "❌ Có lỗi: " +
        error.message;
    }

  } finally {

    if (saveBtn) {

      saveBtn.disabled = false;

      saveBtn.textContent =
        "💾 Lưu khách hàng";
    }
  }
}


// ================= RESET FORM =================

function resetCustomerForm() {

  if ($("name")) {
    $("name").value = "";
  }

  if ($("address")) {
    $("address").value = "";
  }

  if ($("note")) {
    $("note").value = "";
  }


  latitude = null;
  longitude = null;
  photoData = null;
  editingCustomerId = null;


  if ($("gpsStatus")) {
    $("gpsStatus").textContent = "";
  }


  if ($("photoStatus")) {
    $("photoStatus").textContent = "";
  }


  if ($("photoPreview")) {

    $("photoPreview").src = "";

    $("photoPreview").classList.add("hidden");
    $("photoPreview").style.display = "none";
  }


  if ($("saveStatus")) {
    $("saveStatus").textContent = "";
  }


  if ($("saveBtn")) {
    $("saveBtn").textContent =
      "💾 Lưu khách hàng";
  }
}


// ================= LOAD CUSTOMERS =================

async function loadCustomers() {

  const {
    data: { user },
    error: userError
  } = await sb.auth.getUser();


  if (userError || !user) {
    return;
  }


  const {
    data,
    error
  } = await sb
    .from("customers")
    .select("*")
    .eq(
      "user_id",
      user.id
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "LOAD ERROR:",
      error
    );

    return;
  }


  customers =
    data || [];


  renderCustomers();


  if (map) {
    loadMarkers();
  }
}


// ================= CUSTOMER LIST =================

function renderCustomers() {

  const list =
    $("customerList");

  const count =
    $("count");

  const search =
    $("search");


  if (!list) return;


  const keyword =
    search
      ? search.value
          .trim()
          .toLowerCase()
      : "";


  const filtered =
    customers.filter(customer => {

      return (

        String(
          customer.name || ""
        )
          .toLowerCase()
          .includes(keyword)

        ||

        String(
          customer.address || ""
        )
          .toLowerCase()
          .includes(keyword)

        ||

        String(
          customer.note || ""
        )
          .toLowerCase()
          .includes(keyword)
      );
    });


  if (count) {
    count.textContent =
      filtered.length +
      " khách hàng";
  }


  if (!filtered.length) {

    list.innerHTML =
      `<div class="empty">
        Chưa có khách hàng
      </div>`;

    return;
  }


  list.innerHTML =
    filtered
      .map(customer => {

        const gps =
          customer.latitude != null &&
          customer.longitude != null;


        const photo =
          customer.photo_url
            ? `
              <button
                onclick="showPhoto(${JSON.stringify(customer.photo_url)})">
                📷 Xem ảnh
              </button>
            `
            : "";


        return `
          <div class="customer-card">

            <div class="customer-name">
              ${escapeHTML(customer.name)}
            </div>

            <div>
              📍 ${
                escapeHTML(
                  customer.address ||
                  "Chưa có địa chỉ"
                )
              }
            </div>

            <div>
              📝 ${
                escapeHTML(
                  customer.note ||
                  "Không có ghi chú"
                )
              }
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
                  ? `
                    <button
                      onclick="focusCustomer(${customer.id})">
                      🗺️ Xem bản đồ
                    </button>
                  `
                  : ""
              }

              ${photo}

              <button
                onclick="editCustomer(${customer.id})">
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
      })
      .join("");
}


// ================= EDIT =================

function editCustomer(id) {

  const customer =
    customers.find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (!customer) {

    alert(
      "❌ Không tìm thấy khách hàng"
    );

    return;
  }


  editingCustomerId =
    customer.id;


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
    customer.photo_url ||
    null;


  if ($("gpsStatus")) {

    $("gpsStatus").textContent =
      latitude != null &&
      longitude != null

        ? `✅ GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

        : "";
  }


  if ($("photoPreview")) {

    if (photoData) {

      $("photoPreview").src =
        photoData;

      $("photoPreview").classList.remove("hidden");
      $("photoPreview").style.display = "";

    } else {

      $("photoPreview").src = "";

      $("photoPreview").classList.add("hidden");
      $("photoPreview").style.display = "none";
    }
  }


  if ($("photoStatus")) {

    $("photoStatus").textContent =
      photoData
        ? "✅ Đã có ảnh"
        : "";
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


// ================= DELETE =================

async function deleteCustomer(id) {

  const customer =
    customers.find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (!customer) {

    alert(
      "❌ Không tìm thấy khách hàng"
    );

    return;
  }


  const confirmed =
    confirm(
      `Bạn có chắc muốn xóa khách hàng "${customer.name}" không?`
    );


  if (!confirmed) return;


  const {
    data: { user },
    error: userError
  } = await sb.auth.getUser();


  if (userError || !user) {

    alert(
      "❌ Phiên đăng nhập đã hết"
    );

    return;
  }


  const { error } =
    await sb
      .from("customers")
      .delete()
      .eq(
        "id",
        id
      )
      .eq(
        "user_id",
        user.id
      );


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
      item =>
        Number(item.id) !==
        Number(id)
    );


  renderCustomers();


  if (map) {
    loadMarkers();
  }


  alert(
    "✅ Đã xóa khách hàng"
  );
}


// ================= MAP =================

function initMap() {

  const mapElement =
    $("map");


  if (!mapElement) return;


  if (map) {

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return;
  }


  map =
    L.map("map")
      .setView(
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


// ================= MARKERS =================

function loadMarkers() {

  if (!map) return;


  markers.forEach(
    marker =>
      map.removeLayer(marker)
  );


  markers = [];


  const validCustomers =
    customers.filter(
      customer =>
        customer.latitude != null &&
        customer.longitude != null
    );


  validCustomers.forEach(
    customer => {

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
        ${escapeHTML(
          customer.address || ""
        )}
        <br>
        ${escapeHTML(
          customer.note || ""
        )}
      `);


      marker.customerId =
        customer.id;


      markers.push(marker);
    }
  );


  const mapCount =
    $("mapCount");


  if (mapCount) {

    mapCount.textContent =
      validCustomers.length +
      " khách hàng";
  }
}


// ================= FOCUS CUSTOMER =================

function focusCustomer(id) {

  const customer =
    customers.find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (!customer) return;


  if (
    customer.latitude == null ||
    customer.longitude == null
  ) {

    alert(
      "❌ Khách hàng chưa có GPS"
    );

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

  }, 500);
}


// ================= MY LOCATION =================

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
    [
      latitude,
      longitude
    ],
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


// ================= PHOTO =================

function showPhoto(photo) {

  if (!photo) return;


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

      <meta
        name="viewport"
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


// ================= ESCAPE HTML =================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}
