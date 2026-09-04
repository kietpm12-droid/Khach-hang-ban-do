// ========================================
// KHỞI TẠO SUPABASE
// ========================================
const SUPABASE_URL = "https://yxzjddriuglqwtzxmgbi.supabase.co";
const SUPABASE_KEY = "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";
const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
// ========================================
// BIẾN TOÀN CỤC
// ========================================
let currentUser = null;
let customers = [];
let editingId = null;
let latitude = null;
let longitude = null;
let photoData = null;
let map = null;
let mapMarkers = [];
// ========================================
// KHỞI ĐỘNG
// ========================================
document.addEventListener("DOMContentLoaded", async function () {
  setupEvents();
  // Ghi nhớ email
  const savedEmail = localStorage.getItem("savedEmail");
  if (savedEmail) {
    const emailInput = document.getElementById("email");
    const remember = document.getElementById("remember");
    if (emailInput) {
      emailInput.value = savedEmail;
    }
    if (remember) {
      remember.checked = true;
    }
  }
  // Kiểm tra phiên đăng nhập
  const { data, error } = await db.auth.getSession();
  if (error) {
    console.error(error);
    showLogin();
    return;
  }
  if (data && data.session) {
    currentUser = data.session.user;
    showApp();
  } else {
    showLogin();
  }
});
// ========================================
// GẮN SỰ KIỆN
// ========================================
function setupEvents() {
  document
    .getElementById("loginBtn")
    ?.addEventListener("click", login);
  document
    .getElementById("password")
    ?.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        login();
      }
    });
  document
    .getElementById("menuBtn")
    ?.addEventListener("click", openMenu);
  document
    .getElementById("menuOverlay")
    ?.addEventListener("click", closeMenu);
  document
    .querySelectorAll(".menu-item[data-page]")
    .forEach(function (item) {
      item.addEventListener("click", function () {
        showPage(this.dataset.page);
        closeMenu();
      });
    });
  document
    .getElementById("logoutBtn")
    ?.addEventListener("click", logout);
  document
    .getElementById("gpsBtn")
    ?.addEventListener("click", getGPS);
  document
    .getElementById("cameraBtn")
    ?.addEventListener("click", function () {
      document
        .getElementById("cameraInput")
        ?.click();
    });
  document
    .getElementById("cameraInput")
    ?.addEventListener("change", handlePhoto);
  document
    .getElementById("saveBtn")
    ?.addEventListener("click", saveCustomer);
  document
    .getElementById("cancelBtn")
    ?.addEventListener("click", function () {
      resetForm();
      showPage("home");
    });
  document
    .getElementById("searchInput")
    ?.addEventListener("input", renderCustomers);
}
// ========================================
// ĐĂNG NHẬP
// ========================================
async function login() {
  const email =
    document.getElementById("email").value.trim();
  const password =
    document.getElementById("password").value;
  const remember =
    document.getElementById("remember").checked;
  if (!email || !password) {
    alert("Vui lòng nhập email và mật khẩu.");
    return;
  }
  const btn =
    document.getElementById("loginBtn");
  btn.disabled = true;
  btn.textContent = "Đang đăng nhập...";
  const { data, error } =
    await db.auth.signInWithPassword({
      email: email,
      password: password
    });
  btn.disabled = false;
  btn.textContent = "Đăng nhập";
  if (error) {
    console.error(error);
    alert(
      "Đăng nhập thất bại: " +
      error.message
    );
    return;
  }
  currentUser = data.user;
  if (remember) {
    localStorage.setItem(
      "savedEmail",
      email
    );
  } else {
    localStorage.removeItem(
      "savedEmail"
    );
  }
  showApp();
}
// ========================================
// HIỂN THỊ APP
// ========================================
function showApp() {
  document.getElementById(
    "loginPage"
  ).style.display = "none";
  document.getElementById(
    "appPage"
  ).style.display = "block";
  const menuUser =
    document.getElementById("menuUser");
  if (menuUser) {
    menuUser.textContent =
      currentUser?.email || "";
  }
  showPage("home");
  loadCustomers();
}
// ========================================
// HIỂN THỊ LOGIN
// ========================================
function showLogin() {
  document.getElementById(
    "loginPage"
  ).style.display = "flex";
  document.getElementById(
    "appPage"
  ).style.display = "none";
}
// ========================================
// MENU 3 GẠCH
// ========================================
function openMenu() {
  document
    .getElementById("sideMenu")
    .classList.add("active");
  document
    .getElementById("menuOverlay")
    .classList.add("active");
}
function closeMenu() {
  document
    .getElementById("sideMenu")
    .classList.remove("active");
  document
    .getElementById("menuOverlay")
    .classList.remove("active");
}
// ========================================
// CHUYỂN TRANG
// ========================================
function showPage(pageId) {
  document
    .querySelectorAll(".page")
    .forEach(function (page) {
      page.style.display = "none";
    });
  const page =
    document.getElementById(pageId);
  if (!page) return;
  page.style.display = "block";
  if (pageId === "home") {
    updateStats();
  }
  if (pageId === "customers") {
    renderCustomers();
  }
  if (pageId === "mapPage") {
    setTimeout(function () {
      initMap();
    }, 100);
  }
  if (pageId === "addCustomer") {
    const title =
      document.querySelector(
        "#addCustomer .page-title h2"
      );
    if (title) {
      title.textContent =
        editingId
          ? "Sửa khách hàng"
          : "Thêm khách hàng";
    }
  }
}
// ========================================
// LẤY GPS
// ========================================
function getGPS() {
  const status =
    document.getElementById("gpsStatus");
  if (!navigator.geolocation) {
    alert(
      "Điện thoại không hỗ trợ định vị GPS."
    );
    return;
  }
  status.textContent =
    "📍 Đang lấy vị trí...";
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      latitude =
        pos.coords.latitude;
      longitude =
        pos.coords.longitude;
      status.textContent =
        `✅ Đã lấy GPS: ${
          latitude.toFixed(6)
        }, ${
          longitude.toFixed(6)
        }`;
    },
    function (err) {
      console.error(err);
      status.textContent =
        "❌ Không lấy được vị trí.";
      alert(
        "Không lấy được GPS.\n\n" +
        "Hãy cho phép trình duyệt sử dụng vị trí của bạn."
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}
// ========================================
// CHỤP / XỬ LÝ ẢNH
// ========================================
function handlePhoto(event) {
  const file =
    event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Vui lòng chọn ảnh.");
    return;
  }
  const status =
    document.getElementById(
      "photoStatus"
    );
  const preview =
    document.getElementById(
      "photoPreview"
    );
  status.textContent =
    "📷 Đang xử lý ảnh...";
  const reader =
    new FileReader();
  reader.onload = function (e) {
    const img =
      new Image();
    img.onload = function () {
      const maxSize = 1200;
      let width = img.width;
      let height = img.height;
      if (
        width > maxSize ||
        height > maxSize
      ) {
        if (width > height) {
          height =
            Math.round(
              height * maxSize / width
            );
          width = maxSize;
        } else {
          width =
            Math.round(
              width * maxSize / height
            );
          height = maxSize;
        }
      }
      const canvas =
        document.createElement(
          "canvas"
        );
      canvas.width = width;
      canvas.height = height;
      const ctx =
        canvas.getContext("2d");
      ctx.drawImage(
        img,
        0,
        0,
        width,
        height
      );
      photoData =
        canvas.toDataURL(
          "image/jpeg",
          0.70
        );
      preview.src =
        photoData;
      preview.style.display =
        "block";
      status.textContent =
        `✅ Đã chụp ảnh (${
          Math.round(
            photoData.length * 0.75 / 1024
          )
        } KB)`;
    };
    img.onerror = function () {
      status.textContent =
        "❌ Không đọc được ảnh.";
    };
    img.src =
      e.target.result;
  };
  reader.readAsDataURL(file);
}
// ========================================
// LƯU KHÁCH HÀNG
// ========================================
async function saveCustomer() {
  if (!currentUser) {
    alert(
      "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại."
    );
    return;
  }
  const name =
    document
      .getElementById("name")
      .value
      .trim();
  const address =
    document
      .getElementById("address")
      .value
      .trim();
  const note =
    document
      .getElementById("note")
      .value
      .trim();
  if (!name) {
    alert(
      "Vui lòng nhập họ tên khách hàng."
    );
    return;
  }
  if (!address) {
    alert(
      "Vui lòng nhập địa chỉ khách hàng."
    );
    return;
  }
  const btn =
    document.getElementById(
      "saveBtn"
    );
  btn.disabled = true;
  btn.textContent =
    "Đang lưu...";
  const customerData = {
    name: name,
    address: address,
    note: note,
    latitude: latitude,
    longitude: longitude,
    photo_url: photoData
  };
  let result;
  if (editingId) {
    result =
      await db
        .from("customers")
        .update(customerData)
        .eq("id", editingId);
  } else {
    result =
      await db
        .from("customers")
        .insert([
          customerData
        ]);
  }
  btn.disabled = false;
  btn.textContent =
    "Lưu khách hàng";
  if (result.error) {
    console.error(result.error);
    alert(
      "❌ Lưu thất bại: " +
      result.error.message
    );
    return;
  }
  alert(
    editingId
      ? "✅ Đã cập nhật khách hàng."
      : "✅ Đã lưu khách hàng."
  );
  resetForm();
  await loadCustomers();
  showPage("customers");
}
// ========================================
// TẢI DANH SÁCH KHÁCH HÀNG
// ========================================
async function loadCustomers() {
  const result =
    await db
      .from("customers")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );
  if (result.error) {
    console.error(result.error);
    alert(
      "❌ Không tải được dữ liệu: " +
      result.error.message
    );
    return;
  }
  customers =
    result.data || [];
  renderCustomers();
  updateStats();
  if (map) {
    loadMapMarkers();
  }
}
// ========================================
// HIỂN THỊ DANH SÁCH
// ========================================
function renderCustomers() {
  const list =
    document.getElementById(
      "customerList"
    );
  if (!list) return;
  const keyword =
    (
      document.getElementById(
        "searchInput"
      )?.value || ""
    )
      .trim()
      .toLowerCase();
  const data =
    customers.filter(function (c) {
      return (
        !keyword ||
        String(c.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(c.address || "")
          .toLowerCase()
          .includes(keyword) ||
        String(c.note || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  if (!data.length) {
    list.innerHTML =
      '<div class="empty-state">' +
      'Không tìm thấy khách hàng.' +
      '</div>';
    return;
  }
  list.innerHTML =
    data
      .map(createCustomerCard)
      .join("");
}
// ========================================
// CARD KHÁCH HÀNG
// ========================================
function createCustomerCard(c) {
  const hasGPS =
    c.latitude != null &&
    c.longitude != null;
  return `
    <div class="customer-card">
      <div class="customer-name">
        ${escapeHTML(c.name || "")}
      </div>
      <div class="customer-info">
        📍 ${escapeHTML(
          c.address || "Chưa có địa chỉ"
        )}
      </div>
      ${
        c.note
          ? `
            <div class="customer-info">
              📝 ${escapeHTML(c.note)}
            </div>
          `
          : ""
      }
      ${
        hasGPS
          ? `
            <div class="customer-info">
              🌐 ${
                Number(c.latitude).toFixed(6)
              },
              ${
                Number(c.longitude).toFixed(6)
              }
            </div>
          `
          : `
            <div class="customer-info">
              📍 Chưa có GPS
            </div>
          `
      }
      ${
        c.photo_url
          ? `
            <img
              src="${escapeHTML(c.photo_url)}"
              class="customer-photo"
              alt="Ảnh nhà khách hàng"
            >
          `
          : ""
      }
      <div class="customer-actions">
        <button
          class="edit-btn"
          onclick="editCustomer('${c.id}')"
          type="button"
        >
          ✏️ Sửa
        </button>
        <button
          class="delete-btn"
          onclick="deleteCustomer('${c.id}')"
          type="button"
        >
          🗑️ Xóa
        </button>
        ${
          hasGPS
            ? `
              <button
                class="map-btn"
                onclick="openCustomerMap(
                  ${Number(c.latitude)},
                  ${Number(c.longitude)}
                )"
                type="button"
              >
                🗺️ Xem bản đồ
              </button>
              <button
                class="direction-btn"
                onclick="startNavigation(
                  ${Number(c.latitude)},
                  ${Number(c.longitude)}
                )"
                type="button"
              >
                🚗 Chỉ đường
              </button>
            `
            : ""
        }
        ${
          c.photo_url
            ? `
              <button
                class="photo-btn"
                onclick="showPhoto('${c.id}')"
                type="button"
              >
                📷 Xem ảnh
              </button>
            `
            : ""
        }
      </div>
    </div>
  `;
}
// ========================================
// CHỈ ĐƯỜNG GOOGLE MAPS
// ========================================
function startNavigation(lat, lng) {
  lat = Number(lat);
  lng = Number(lng);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    alert(
      "❌ Vị trí khách hàng không hợp lệ."
    );
    return;
  }
  /*
    Google Maps Directions:
    origin = vị trí hiện tại
    destination = vị trí khách hàng
    Dùng current+location để Google Maps
    tự lấy vị trí hiện tại của điện thoại.
  */
  const googleMapsURL =
    "https://www.google.com/maps/dir/?api=1" +
    "&destination=" +
    encodeURIComponent(
      `${lat},${lng}`
    ) +
    "&travelmode=driving";
  /*
    Mở Google Maps.
    Trên điện thoại thường sẽ chuyển
    sang app Google Maps nếu đã cài.
  */
  window.location.href =
    googleMapsURL;
}
// ========================================
// SỬA KHÁCH HÀNG
// ========================================
function editCustomer(id) {
  const c =
    customers.find(function (x) {
      return String(x.id) === String(id);
    });
  if (!c) {
    alert(
      "Không tìm thấy khách hàng."
    );
    return;
  }
  editingId =
    c.id;
  document.getElementById(
    "name"
  ).value =
    c.name || "";
  document.getElementById(
    "address"
  ).value =
    c.address || "";
  document.getElementById(
    "note"
  ).value =
    c.note || "";
  latitude =
    c.latitude ?? null;
  longitude =
    c.longitude ?? null;
  photoData =
    c.photo_url || null;
  const preview =
    document.getElementById(
      "photoPreview"
    );
  const photoStatus =
    document.getElementById(
      "photoStatus"
    );
  const gpsStatus =
    document.getElementById(
      "gpsStatus"
    );
  if (photoData) {
    preview.src =
      photoData;
    preview.style.display =
      "block";
    photoStatus.textContent =
      "✅ Đã có ảnh";
  } else {
    preview.src = "";
    preview.style.display =
      "none";
    photoStatus.textContent =
      "Chưa chụp ảnh";
  }
  if (
    latitude != null &&
    longitude != null
  ) {
    gpsStatus.textContent =
      `✅ Đã có GPS: ${
        Number(latitude).toFixed(6)
      }, ${
        Number(longitude).toFixed(6)
      }`;
  } else {
    gpsStatus.textContent =
      "Chưa lấy vị trí";
  }
  showPage("addCustomer");
}
// ========================================
// XÓA KHÁCH HÀNG
// ========================================
async function deleteCustomer(id) {
  const c =
    customers.find(function (x) {
      return String(x.id) === String(id);
    });
  if (
    !confirm(
      "Bạn có chắc muốn xóa " +
      (c?.name || "khách hàng này") +
      "?"
    )
  ) {
    return;
  }
  const result =
    await db
      .from("customers")
      .delete()
      .eq("id", id);
  if (result.error) {
    console.error(result.error);
    alert(
      "❌ Xóa thất bại: " +
      result.error.message
    );
    return;
  }
  alert(
    "✅ Đã xóa khách hàng."
  );
  await loadCustomers();
}
// ========================================
// XEM ẢNH
// ========================================
function showPhoto(id) {
  const c =
    customers.find(function (x) {
      return String(x.id) === String(id);
    });
  if (!c?.photo_url) {
    alert(
      "Khách hàng chưa có ảnh."
    );
    return;
  }
  const win =
    window.open(
      "",
      "_blank"
    );
  if (!win) {
    alert(
      "Trình duyệt đang chặn cửa sổ ảnh."
    );
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1"
      >
      <title>
        Ảnh khách hàng
      </title>
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
      <img
        src="${escapeHTML(c.photo_url)}"
      >
    </body>
    </html>
  `);
}
// ========================================
// KHỞI TẠO BẢN ĐỒ
// ========================================
function initMap() {
  const el =
    document.getElementById(
      "map"
    );
  if (!el) return;
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
        maxZoom: 19,
        attribution:
          "&copy; OpenStreetMap"
      }
    ).addTo(map);
  }
  setTimeout(function () {
    map.invalidateSize();
  }, 200);
  loadMapMarkers();
}
// ========================================
// MARKER KHÁCH HÀNG
// ========================================
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
      const marker =
        L.marker([
          lat,
          lng
        ])
        .addTo(map);
      marker.bindPopup(`
        <strong>
          ${escapeHTML(c.name || "")}
        </strong>
        <br>
        ${escapeHTML(
          c.address || ""
        )}
        <br><br>
        <button
          onclick="startNavigation(
            ${lat},
            ${lng}
          )"
          style="
            border:0;
            border-radius:8px;
            padding:9px 12px;
            background:#2563eb;
            color:white;
            font-weight:600;
            cursor:pointer;
          "
        >
          🚗 Chỉ đường
        </button>
      `);
      mapMarkers.push(
        marker
      );
    });
}
// ========================================
// MỞ VỊ TRÍ KHÁCH HÀNG TRÊN BẢN ĐỒ
// ========================================
function openCustomerMap(
  lat,
  lng
) {
  showPage(
    "mapPage"
  );
  setTimeout(function () {
    if (!map) {
      initMap();
    }
    if (map) {
      map.setView(
        [
          Number(lat),
          Number(lng)
        ],
        17
      );
    }
  }, 300);
}
// ========================================
// THỐNG KÊ
// ========================================
function updateStats() {
  const gps =
    customers.filter(function (c) {
      return (
        c.latitude != null &&
        c.longitude != null
      );
    }).length;
  const photos =
    customers.filter(function (c) {
      return !!c.photo_url;
    }).length;
  const total =
    document.getElementById(
      "totalCustomers"
    );
  const gpsEl =
    document.getElementById(
      "gpsCustomers"
    );
  const photosEl =
    document.getElementById(
      "photoCustomers"
    );
  if (total) {
    total.textContent =
      customers.length;
  }
  if (gpsEl) {
    gpsEl.textContent =
      gps;
  }
  if (photosEl) {
    photosEl.textContent =
      photos;
  }
}
// ========================================
// RESET FORM
// ========================================
function resetForm() {
  editingId = null;
  latitude = null;
  longitude = null;
  photoData = null;
  document.getElementById(
    "name"
  ).value = "";
  document.getElementById(
    "address"
  ).value = "";
  document.getElementById(
    "note"
  ).value = "";
  const preview =
    document.getElementById(
      "photoPreview"
    );
  if (preview) {
    preview.src = "";
    preview.style.display =
      "none";
  }
  const photoStatus =
    document.getElementById(
      "photoStatus"
    );
  if (photoStatus) {
    photoStatus.textContent =
      "Chưa chụp ảnh";
  }
  const gpsStatus =
    document.getElementById(
      "gpsStatus"
    );
  if (gpsStatus) {
    gpsStatus.textContent =
      "Chưa lấy vị trí";
  }
  const cameraInput =
    document.getElementById(
      "cameraInput"
    );
  if (cameraInput) {
    cameraInput.value = "";
  }
  const title =
    document.querySelector(
      "#addCustomer .page-title h2"
    );
  if (title) {
    title.textContent =
      "Thêm khách hàng";
  }
}
// ========================================
// ĐĂNG XUẤT
// ========================================
async function logout() {
  if (
    !confirm(
      "Bạn có chắc muốn đăng xuất?"
    )
  ) {
    return;
  }
  const { error } =
    await db.auth.signOut();
  if (error) {
    alert(
      "Đăng xuất thất bại: " +
      error.message
    );
    return;
  }
  currentUser = null;
  customers = [];
  resetForm();
  showLogin();
}
// ========================================
// BẢO VỆ HTML
// ========================================
function escapeHTML(value) {
  if (value == null) {
    return "";
  }
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
