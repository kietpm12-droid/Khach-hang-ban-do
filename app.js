// =====================================================
// KHÁCH HÀNG BẢN ĐỒ - APP.JS
// =====================================================

const SUPABASE_URL = "https://yxzjddriuglqwtzxmgbi.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";


// =====================================================
// SUPABASE
// =====================================================

let db = null;

if (typeof supabase === "undefined") {

  document.body.innerHTML = `
    <div style="
      padding:30px;
      font-family:Arial;
      text-align:center;
    ">
      <h2>❌ Không tải được Supabase</h2>
      <p>Vui lòng kiểm tra kết nối mạng rồi tải lại trang.</p>
    </div>
  `;

  throw new Error("Supabase CDN chưa tải");

}

db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// =====================================================
// BIẾN
// =====================================================

let currentUser = null;

let editingCustomerId = null;

let latitude = null;
let longitude = null;

let photoData = null;

let customers = [];

let map = null;

let markersLayer = null;


// =====================================================
// DOM
// =====================================================

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const rememberLogin =
  document.getElementById("rememberLogin");

const loginBtn =
  document.getElementById("loginBtn");

const loginMsg =
  document.getElementById("loginMsg");

const logoutBtn =
  document.getElementById("logoutBtn");

const menuLogout =
  document.getElementById("menuLogout");

const menuBtn =
  document.getElementById("menuBtn");

const closeMenuBtn =
  document.getElementById("closeMenuBtn");

const menuOverlay =
  document.getElementById("menuOverlay");

const sideMenu =
  document.getElementById("sideMenu");

const menuEmail =
  document.getElementById("menuEmail");

const mainView =
  document.getElementById("mainView");

const customersView =
  document.getElementById("customersView");

const mapView =
  document.getElementById("mapView");

const menuAdd =
  document.getElementById("menuAdd");

const menuCustomers =
  document.getElementById("menuCustomers");

const menuMap =
  document.getElementById("menuMap");

const backFromCustomers =
  document.getElementById("backFromCustomers");

const backFromMap =
  document.getElementById("backFromMap");

const nameInput =
  document.getElementById("name");

const addressInput =
  document.getElementById("address");

const noteInput =
  document.getElementById("note");

const gpsBtn =
  document.getElementById("gpsBtn");

const gpsStatus =
  document.getElementById("gpsStatus");

const cameraBtn =
  document.getElementById("cameraBtn");

const cameraInput =
  document.getElementById("cameraInput");

const photoPreview =
  document.getElementById("photoPreview");

const photoStatus =
  document.getElementById("photoStatus");

const saveBtn =
  document.getElementById("saveBtn");

const saveStatus =
  document.getElementById("saveStatus");

const customerList =
  document.getElementById("customerList");

const searchInput =
  document.getElementById("search");

const count =
  document.getElementById("count");

const mapCount =
  document.getElementById("mapCount");

const myLocationBtn =
  document.getElementById("myLocationBtn");

const formTitle =
  document.getElementById("formTitle");


// =====================================================
// KHỞI ĐỘNG
// =====================================================

document.addEventListener("DOMContentLoaded", init);


async function init() {

  const savedEmail =
    localStorage.getItem("rememberEmail");

  if (savedEmail) {

    emailInput.value = savedEmail;

    rememberLogin.checked = true;

  }

  setupEvents();

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

}


// =====================================================
// EVENTS
// =====================================================

function setupEvents() {

  loginBtn.addEventListener(
    "click",
    login
  );

  passwordInput.addEventListener(
    "keydown",
    function(e) {

      if (e.key === "Enter") {
        login();
      }

    }
  );


  logoutBtn.addEventListener(
    "click",
    logout
  );

  menuLogout.addEventListener(
    "click",
    logout
  );


  menuBtn.addEventListener(
    "click",
    openMenu
  );

  closeMenuBtn.addEventListener(
    "click",
    closeMenu
  );

  menuOverlay.addEventListener(
    "click",
    closeMenu
  );


  menuAdd.addEventListener(
    "click",
    () => {

      closeMenu();

      showAddPage();

    }
  );


  menuCustomers.addEventListener(
    "click",
    async () => {

      closeMenu();

      await showCustomersPage();

    }
  );


  menuMap.addEventListener(
    "click",
    async () => {

      closeMenu();

      await showMapPage();

    }
  );


  backFromCustomers.addEventListener(
    "click",
    showAddPage
  );


  backFromMap.addEventListener(
    "click",
    showAddPage
  );


  gpsBtn.addEventListener(
    "click",
    getGPS
  );


  // CAMERA ĐIỆN THOẠI

  cameraBtn.addEventListener(
    "click",
    function() {

      cameraInput.click();

    }
  );


  cameraInput.addEventListener(
    "change",
    handlePhoto
  );


  saveBtn.addEventListener(
    "click",
    saveCustomer
  );


  searchInput.addEventListener(
    "input",
    renderCustomers
  );


  myLocationBtn.addEventListener(
    "click",
    goMyLocation
  );


  db.auth.onAuthStateChange(
    function(event, session) {

      if (
        event === "SIGNED_OUT" ||
        !session
      ) {

        currentUser = null;

        showLogin();

      }

    }
  );

}


// =====================================================
// LOGIN
// =====================================================

async function login() {

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  loginMsg.textContent = "";

  if (!email || !password) {

    loginMsg.textContent =
      "❌ Vui lòng nhập email và mật khẩu.";

    return;

  }

  loginBtn.disabled = true;

  loginBtn.textContent =
    "⏳ Đang đăng nhập...";


  try {

    const {
      data,
      error
    } = await db.auth.signInWithPassword({

      email,
      password

    });


    if (error) {

      throw error;

    }


    currentUser = data.user;


    if (rememberLogin.checked) {

      localStorage.setItem(
        "rememberEmail",
        email
      );

    } else {

      localStorage.removeItem(
        "rememberEmail"
      );

    }


    loginMsg.textContent = "";

    showApp();


  } catch (error) {

    console.error(error);

    loginMsg.textContent =
      "❌ " + (
        error.message ||
        "Đăng nhập thất bại"
      );

  } finally {

    loginBtn.disabled = false;

    loginBtn.textContent =
      "🔐 Đăng nhập";

  }

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

  await db.auth.signOut();

  currentUser = null;

  showLogin();

}


// =====================================================
// HIỂN THỊ LOGIN
// =====================================================

function showLogin() {

  loginView.classList.remove("hidden");

  loginView.style.display = "flex";

  appView.classList.add("hidden");

  appView.style.display = "none";

}


// =====================================================
// HIỂN THỊ APP
// =====================================================

async function showApp() {

  loginView.classList.add("hidden");

  loginView.style.display = "none";

  appView.classList.remove("hidden");

  appView.style.display = "block";


  if (currentUser) {

    menuEmail.textContent =
      currentUser.email || "";

  }


  showAddPage();

}


// =====================================================
// MENU
// =====================================================

function openMenu() {

  sideMenu.classList.add("open");

  menuOverlay.classList.remove("hidden");

}


function closeMenu() {

  sideMenu.classList.remove("open");

  menuOverlay.classList.add("hidden");

}


// =====================================================
// TRANG THÊM
// =====================================================

function showAddPage() {

  mainView.classList.remove("hidden");

  customersView.classList.add("hidden");

  mapView.classList.add("hidden");

}


// =====================================================
// TRANG KHÁCH HÀNG
// =====================================================

async function showCustomersPage() {

  mainView.classList.add("hidden");

  customersView.classList.remove("hidden");

  mapView.classList.add("hidden");


  await loadCustomers();

}


// =====================================================
// TRANG BẢN ĐỒ
// =====================================================

async function showMapPage() {

  mainView.classList.add("hidden");

  customersView.classList.add("hidden");

  mapView.classList.remove("hidden");


  await loadCustomers();

  setTimeout(
    initMap,
    100
  );

}


// =====================================================
// GPS
// =====================================================

function getGPS() {

  if (!navigator.geolocation) {

    gpsStatus.textContent =
      "❌ Thiết bị không hỗ trợ GPS.";

    return;

  }


  gpsStatus.textContent =
    "📍 Đang lấy vị trí...";


  navigator.geolocation.getCurrentPosition(

    function(position) {

      latitude =
        position.coords.latitude;

      longitude =
        position.coords.longitude;


      gpsStatus.textContent =
        `✅ Đã lấy vị trí: ${
          latitude.toFixed(6)
        }, ${
          longitude.toFixed(6)
        }`;

    },


    function(error) {

      console.error(error);

      gpsStatus.textContent =
        "❌ Không lấy được vị trí. Hãy cho phép trình duyệt sử dụng vị trí.";

    },


    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }

  );

}


// =====================================================
// CAMERA ĐIỆN THOẠI
// =====================================================

function handlePhoto(event) {

  const file =
    event.target.files[0];

  if (!file) return;


  photoStatus.textContent =
    "⏳ Đang xử lý ảnh...";


  const reader =
    new FileReader();


  reader.onload = function(e) {

    photoData =
      e.target.result;


    photoPreview.src =
      photoData;


    photoPreview.classList.remove(
      "hidden"
    );


    photoStatus.textContent =
      "✅ Đã chụp ảnh nhà khách.";

  };


  reader.onerror = function() {

    photoStatus.textContent =
      "❌ Không đọc được ảnh.";

  };


  reader.readAsDataURL(file);

}


// =====================================================
// LƯU KHÁCH HÀNG
// =====================================================

async function saveCustomer() {

  if (!currentUser) {

    saveStatus.textContent =
      "❌ Bạn chưa đăng nhập.";

    return;

  }


  const name =
    nameInput.value.trim();

  const address =
    addressInput.value.trim();

  const note =
    noteInput.value.trim();


  if (!name) {

    saveStatus.textContent =
      "❌ Vui lòng nhập họ và tên.";

    nameInput.focus();

    return;

  }


  if (
    latitude === null ||
    longitude === null
  ) {

    saveStatus.textContent =
      "❌ Vui lòng lấy vị trí GPS.";

    return;

  }


  saveBtn.disabled = true;

  saveBtn.textContent =
    "⏳ Đang lưu...";

  saveStatus.textContent = "";


  try {

    const customerData = {

      user_id: currentUser.id,

      name: name,

      address: address,

      note: note,

      latitude: latitude,

      longitude: longitude,

      photo_url: photoData

    };


    let result;


    // =========================
    // THÊM
    // =========================

    if (!editingCustomerId) {

      result =
        await db
          .from("customers")
          .insert(customerData);


    // =========================
    // SỬA
    // =========================

    } else {

      result =
        await db
          .from("customers")
          .update(customerData)
          .eq(
            "id",
            editingCustomerId
          )
          .eq(
            "user_id",
            currentUser.id
          );

    }


    if (result.error) {

      throw result.error;

    }


    saveStatus.textContent =
      editingCustomerId
        ? "✅ Đã cập nhật khách hàng."
        : "✅ Đã lưu khách hàng.";


    resetForm();


  } catch (error) {

    console.error(error);

    saveStatus.textContent =
      "❌ Lưu thất bại: " +
      (
        error.message ||
        "Lỗi không xác định"
      );

  } finally {

    saveBtn.disabled = false;

    saveBtn.textContent =
      "💾 Lưu khách hàng";

  }

}


// =====================================================
// RESET FORM
// =====================================================

function resetForm() {

  editingCustomerId = null;

  nameInput.value = "";

  addressInput.value = "";

  noteInput.value = "";


  latitude = null;

  longitude = null;


  photoData = null;


  photoPreview.src = "";

  photoPreview.classList.add(
    "hidden"
  );


  photoStatus.textContent = "";

  gpsStatus.textContent = "";


  cameraInput.value = "";


  formTitle.textContent =
    "Thêm khách hàng";

}


// =====================================================
// LOAD KHÁCH HÀNG
// =====================================================

async function loadCustomers() {

  if (!currentUser) return;


  customerList.innerHTML =
    "<p>⏳ Đang tải...</p>";


  try {

    const {
      data,
      error
    } = await db
      .from("customers")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {

      throw error;

    }


    customers =
      data || [];


    renderCustomers();


  } catch (error) {

    console.error(error);

    customerList.innerHTML =
      `<p style="color:red">
        ❌ Không tải được dữ liệu.
      </p>`;

  }

}


// =====================================================
// RENDER KHÁCH HÀNG
// =====================================================

function renderCustomers() {

  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();


  let list =
    customers.filter(
      customer => {

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

      }
    );


  count.textContent =
    `${list.length} khách hàng`;


  if (!list.length) {

    customerList.innerHTML =
      "<p>Chưa có khách hàng.</p>";

    return;

  }


  customerList.innerHTML =
    list
      .map(
        customer =>
          customerCard(customer)
      )
      .join("");

}


// =====================================================
// CARD KHÁCH HÀNG
// =====================================================

function customerCard(customer) {

  const photo =
    customer.photo_url
      ? `
        <img
          src="${customer.photo_url}"
          class="customer-photo"
          onclick="showPhoto('${customer.photo_url}')"
        >
      `
      : "";


  return `

    <div class="customer-card">

      ${photo}

      <div class="customer-info">

        <h3>
          ${escapeHTML(
            customer.name || ""
          )}
        </h3>

        <p>
          📍 ${
            escapeHTML(
              customer.address || "Chưa có địa chỉ"
            )
          }
        </p>

        <p>
          📝 ${
            escapeHTML(
              customer.note || "Không có ghi chú"
            )
          }
        </p>

        ${
          customer.latitude !== null &&
          customer.longitude !== null
            ? `
              <p>
                🌐 ${
                  Number(customer.latitude)
                    .toFixed(6)
                },
                ${
                  Number(customer.longitude)
                    .toFixed(6)
                }
              </p>
            `
            : ""
        }

      </div>


      <div class="customer-actions">

        <button
          onclick="editCustomer('${customer.id}')"
        >
          ✏️ Sửa
        </button>

        <button
          onclick="deleteCustomer('${customer.id}')"
        >
          🗑️ Xóa
        </button>

        ${
          customer.latitude !== null &&
          customer.longitude !== null
            ? `
              <button
                onclick="focusCustomer(
                  ${customer.latitude},
                  ${customer.longitude}
                )"
              >
                🗺️ Bản đồ
              </button>
            `
            : ""
        }

      </div>

    </div>

  `;

}


// =====================================================
// SỬA
// =====================================================

window.editCustomer =
  async function(id) {

    const customer =
      customers.find(
        item =>
          String(item.id) === String(id)
      );


    if (!customer) return;


    editingCustomerId =
      customer.id;


    nameInput.value =
      customer.name || "";

    addressInput.value =
      customer.address || "";

    noteInput.value =
      customer.note || "";


    latitude =
      customer.latitude ?? null;

    longitude =
      customer.longitude ?? null;


    photoData =
      customer.photo_url || null;


    if (photoData) {

      photoPreview.src =
        photoData;

      photoPreview.classList.remove(
        "hidden"
      );

      photoStatus.textContent =
        "✅ Đã có ảnh.";

    } else {

      photoPreview.src = "";

      photoPreview.classList.add(
        "hidden"
      );

      photoStatus.textContent = "";

    }


    if (
      latitude !== null &&
      longitude !== null
    ) {

      gpsStatus.textContent =
        `✅ Vị trí hiện tại: ${
          Number(latitude).toFixed(6)
        }, ${
          Number(longitude).toFixed(6)
        }`;

    } else {

      gpsStatus.textContent = "";

    }


    formTitle.textContent =
      "Chỉnh sửa khách hàng";


    saveStatus.textContent = "";

    showAddPage();

  };


// =====================================================
// XÓA
// =====================================================

window.deleteCustomer =
  async function(id) {

    const ok =
      confirm(
        "Bạn có chắc muốn xóa khách hàng này?"
      );


    if (!ok) return;


    try {

      const {
        error
      } = await db
        .from("customers")
        .delete()
        .eq(
          "id",
          id
        )
        .eq(
          "user_id",
          currentUser.id
        );


      if (error) {

        throw error;

      }


      await loadCustomers();


    } catch (error) {

      alert(
        "❌ Xóa thất bại: " +
        error.message
      );

    }

  };


// =====================================================
// MAP
// =====================================================

function initMap() {

  if (!map) {

    map =
      L.map("map")
        .setView(
          [10.0452, 105.7469],
          12
        );


    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          "&copy; OpenStreetMap"
      }
    ).addTo(map);


    markersLayer =
      L.layerGroup().addTo(map);

  }


  markersLayer.clearLayers();


  const locations =
    customers.filter(
      c =>
        c.latitude !== null &&
        c.longitude !== null
    );


  mapCount.textContent =
    `${locations.length} khách có vị trí`;


  if (!locations.length) {

    map.setView(
      [10.0452, 105.7469],
      12
    );

    return;

  }


  const bounds = [];


  locations.forEach(
    customer => {

      const lat =
        Number(customer.latitude);

      const lng =
        Number(customer.longitude);


      const marker =
        L.marker(
          [lat, lng]
        ).addTo(
          markersLayer
        );


      marker.bindPopup(`
        <b>${escapeHTML(
          customer.name || ""
        )}</b><br>
        ${escapeHTML(
          customer.address || ""
        )}
      `);


      bounds.push(
        [lat, lng]
      );

    }
  );


  map.fitBounds(bounds, {
    padding: [30, 30]
  });


  setTimeout(
    () => map.invalidateSize(),
    200
  );

}


// =====================================================
// FOCUS CUSTOMER
// =====================================================

window.focusCustomer =
  function(lat, lng) {

    showMapPage().then(
      function() {

        if (!map) return;

        map.setView(
          [Number(lat), Number(lng)],
          17
        );

      }
    );

  };


// =====================================================
// VỊ TRÍ CỦA TÔI
// =====================================================

function goMyLocation() {

  if (!navigator.geolocation) {

    alert(
      "Thiết bị không hỗ trợ GPS."
    );

    return;

  }


  navigator.geolocation.getCurrentPosition(

    function(position) {

      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;


      if (map) {

        map.setView(
          [lat, lng],
          17
        );


        L.marker(
          [lat, lng]
        )
          .addTo(map)
          .bindPopup(
            "📍 Vị trí của bạn"
          )
          .openPopup();

      }

    },

    function() {

      alert(
        "❌ Không lấy được vị trí."

      );

    },

    {
      enableHighAccuracy: true,
      timeout: 15000
    }

  );

}


// =====================================================
// HIỂN THỊ ẢNH
// =====================================================

window.showPhoto =
  function(src) {

    const win =
      window.open(
        "",
        "_blank"
      );


    if (!win) {

      return;

    }


    win.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta name="viewport"
              content="width=device-width,initial-scale=1">
        <title>Ảnh nhà khách</title>
      </head>

      <body style="
        margin:0;
        background:#000;
        display:flex;
        justify-content:center;
        align-items:center;
        min-height:100vh;
      ">

        <img
          src="${src}"
          style="
            max-width:100%;
            max-height:100vh;
            object-fit:contain;
          "
        >

      </body>
      </html>
    `);

  };


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

  return String(value)
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
