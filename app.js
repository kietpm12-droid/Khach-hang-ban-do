// ===============================
// CẤU HÌNH SUPABASE
// ===============================
const SUPABASE_URL = "https://yxzjddriuglqwtzxmgbi.supabase.co";
const SUPABASE_KEY = "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";
const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
// ===============================
// BIẾN TOÀN CỤC
// ===============================
let currentUser = null;
let customers = [];
let editingId = null;
let latitude = null;
let longitude = null;
let photoData = null;
let map = null;
let mapMarkers = [];
// ===============================
// KHI TRANG ĐƯỢC MỞ
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    setupEvents();
    // Nhớ email đăng nhập
    const savedEmail = localStorage.getItem("savedEmail");
    const emailInput = document.getElementById("email");
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }
    // Kiểm tra phiên đăng nhập
    const { data, error } = await db.auth.getSession();
    if (error) {
        console.error(error);
        showLogin();
        return;
    }
    if (data.session) {
        currentUser = data.session.user;
        showApp();
    } else {
        showLogin();
    }
});
// ===============================
// THIẾT LẬP SỰ KIỆN
// ===============================
function setupEvents() {
    // LOGIN
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", login);
    }
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
        passwordInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                login();
            }
        });
    }
    // MENU 3 GẠCH
    const menuBtn = document.getElementById("menuBtn");
    if (menuBtn) {
        menuBtn.addEventListener("click", openMenu);
    }
    const overlay = document.getElementById("menuOverlay");
    if (overlay) {
        overlay.addEventListener("click", closeMenu);
    }
    // MENU ITEM
    document.querySelectorAll(".menu-item").forEach(item => {
        item.addEventListener("click", () => {
            const page = item.dataset.page;
            if (page) {
                showPage(page);
            }
            closeMenu();
        });
    });
    // ĐĂNG XUẤT
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
        cameraBtn.addEventListener("click", () => {
            cameraInput.click();
        });
        cameraInput.addEventListener("change", handlePhoto);
    }
    // LƯU KHÁCH HÀNG
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", saveCustomer);
    }
    // HỦY
    const cancelBtn = document.getElementById("cancelBtn");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            resetForm();
            showPage("home");
        });
    }
    // TÌM KIẾM
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderCustomers(searchInput.value);
        });
    }
}
// ===============================
// HIỂN THỊ LOGIN
// ===============================
function showLogin() {
    const loginPage = document.getElementById("loginPage");
    const appPage = document.getElementById("appPage");
    if (loginPage) {
        loginPage.style.display = "flex";
    }
    if (appPage) {
        appPage.style.display = "none";
    }
}
// ===============================
// HIỂN THỊ APP
// ===============================
async function showApp() {
    const loginPage = document.getElementById("loginPage");
    const appPage = document.getElementById("appPage");
    if (loginPage) {
        loginPage.style.display = "none";
    }
    if (appPage) {
        appPage.style.display = "block";
    }
    // Hiển thị email người dùng
    const menuUser = document.getElementById("menuUser");
    if (menuUser && currentUser) {
        menuUser.textContent = currentUser.email || "";
    }
    // Tải danh sách khách hàng
    await loadCustomers();
}
// ===============================
// ĐĂNG NHẬP
// ===============================
async function login() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    if (!email || !password) {
        alert("Vui lòng nhập email và mật khẩu.");
        return;
    }
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = "Đang đăng nhập...";
    }
    try {
        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) {
            alert("Đăng nhập thất bại: " + error.message);
            return;
        }
        currentUser = data.user;
        // Lưu email nếu có checkbox
        const remember = document.getElementById("remember");
        if (remember && remember.checked) {
            localStorage.setItem("savedEmail", email);
        } else {
            localStorage.removeItem("savedEmail");
        }
        await showApp();
    } catch (error) {
        console.error(error);
        alert("Có lỗi khi đăng nhập.");
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = "Đăng nhập";
        }
    }
}
// ===============================
// MENU
// ===============================
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
// ===============================
// CHUYỂN TRANG
// ===============================
function showPage(page) {
    document.querySelectorAll(".page").forEach(p => {
        p.style.display = "none";
    });
    const target = document.getElementById(page);
    if (target) {
        target.style.display = "block";
    }
    // Trang danh sách
    if (page === "customers") {
        renderCustomers();
    }
    // Trang bản đồ
    if (page === "mapPage") {
        setTimeout(() => {
            initMap();
        }, 200);
    }
    // Trang trang chủ
    if (page === "home") {
        updateHomeStats();
    }
}
// ===============================
// LẤY GPS
// ===============================
function getGPS() {
    if (!navigator.geolocation) {
        alert("Điện thoại không hỗ trợ GPS.");
        return;
    }
    const gpsStatus = document.getElementById("gpsStatus");
    if (gpsStatus) {
        gpsStatus.textContent = "Đang lấy vị trí...";
    }
    navigator.geolocation.getCurrentPosition(
        position => {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            if (gpsStatus) {
                gpsStatus.textContent =
                    `Đã lấy vị trí: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            }
        },
        error => {
            console.error(error);
            if (gpsStatus) {
                gpsStatus.textContent = "Không lấy được vị trí.";
            }
            alert("Không thể lấy vị trí GPS. Hãy cho phép trình duyệt sử dụng vị trí.");
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}
// ===============================
// CHỤP ẢNH CAMERA
// ===============================
function handlePhoto(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Kích thước tối đa
            const maxSize = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round(
                        height * maxSize / width
                    );
                    width = maxSize;
                } else {
                    width = Math.round(
                        width * maxSize / height
                    );
                    height = maxSize;
                }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(
                img,
                0,
                0,
                width,
                height
            );
            // Nén JPEG
            photoData = canvas.toDataURL(
                "image/jpeg",
                0.70
            );
            // Hiển thị ảnh xem trước
            const preview = document.getElementById("photoPreview");
            if (preview) {
                preview.src = photoData;
                preview.style.display = "block";
            }
            const photoStatus = document.getElementById("photoStatus");
            if (photoStatus) {
                const sizeKB =
                    Math.round(
                        photoData.length * 0.75 / 1024
                    );
                photoStatus.textContent =
                    `Ảnh đã chụp - khoảng ${sizeKB} KB`;
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
// ===============================
// LƯU KHÁCH HÀNG
// ===============================
async function saveCustomer() {
    const nameInput = document.getElementById("name");
    const addressInput = document.getElementById("address");
    const noteInput = document.getElementById("note");
    const name = nameInput ? nameInput.value.trim() : "";
    const address = addressInput ? addressInput.value.trim() : "";
    const note = noteInput ? noteInput.value.trim() : "";
    if (!name) {
        alert("Vui lòng nhập họ tên.");
        return;
    }
    if (!address) {
        alert("Vui lòng nhập địa chỉ.");
        return;
    }
    // QUAN TRỌNG:
    // KHÔNG CÓ user_id
    // Tất cả tài khoản đăng nhập đều dùng chung dữ liệu
    const customerData = {
        name: name,
        address: address,
        note: note,
        latitude: latitude,
        longitude: longitude,
        photo_url: photoData
    };
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Đang lưu...";
    }
    try {
        let result;
        // =========================
        // CẬP NHẬT
        // =========================
        if (editingId) {
            result = await db
                .from("customers")
                .update(customerData)
                .eq("id", editingId);
        // =========================
        // THÊM MỚI
        // =========================
        } else {
            result = await db
                .from("customers")
                .insert([customerData]);
        }
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
    } catch (error) {
        console.error(error);
        alert("❌ Có lỗi khi lưu dữ liệu.");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent =
                editingId
                    ? "Cập nhật"
                    : "Lưu khách hàng";
        }
    }
}
// ===============================
// TẢI DANH SÁCH KHÁCH HÀNG
// ===============================
async function loadCustomers() {
    try {
        // QUAN TRỌNG:
        // Không lọc user_id
        // => Gmail nào đăng nhập cũng thấy toàn bộ khách hàng
        const result = await db
            .from("customers")
            .select("*")
            .order("created_at", {
                ascending: false
            });
        if (result.error) {
            console.error(result.error);
            alert(
                "❌ Không tải được dữ liệu: " +
                result.error.message
            );
            return;
        }
        customers = result.data || [];
        renderCustomers();
        updateHomeStats();
        // Nếu bản đồ đang mở
        if (map) {
            loadMapMarkers();
        }
    } catch (error) {
        console.error(error);
        alert("Không thể tải danh sách khách hàng.");
    }
}
// ===============================
// HIỂN THỊ KHÁCH HÀNG
// ===============================
function renderCustomers(searchText = "") {
    const container =
        document.getElementById("customerList");
    if (!container) {
        return;
    }
    const keyword =
        searchText.trim().toLowerCase();
    let list = customers;
    if (keyword) {
        list = customers.filter(customer => {
            return (
                String(customer.name || "")
                    .toLowerCase()
                    .includes(keyword)
                ||
                String(customer.address || "")
                    .toLowerCase()
                    .includes(keyword)
                ||
                String(customer.note || "")
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }
    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                Chưa có khách hàng.
            </div>
        `;
        return;
    }
    container.innerHTML = list.map(customer => {
        const photo = customer.photo_url
            ? `
                <img
                    src="${customer.photo_url}"
                    class="customer-photo"
                    onclick="showPhoto('${customer.id}')"
                >
              `
            : "";
        const gps =
            customer.latitude &&
            customer.longitude
                ? `
                    <button
                        onclick="openCustomerMap(${customer.latitude}, ${customer.longitude})"
                    >
                        📍 Bản đồ
                    </button>
                  `
                : "";
        return `
            <div class="customer-card">
                ${photo}
                <div class="customer-info">
                    <h3>
                        ${escapeHTML(customer.name || "")}
                    </h3>
                    <p>
                        📍 ${escapeHTML(customer.address || "")}
                    </p>
                    ${
                        customer.note
                        ? `
                            <p>
                                📝 ${escapeHTML(customer.note)}
                            </p>
                          `
                        : ""
                    }
                </div>
                <div class="customer-actions">
                    ${gps}
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
                </div>
            </div>
        `;
    }).join("");
}
// ===============================
// SỬA KHÁCH HÀNG
// ===============================
function editCustomer(id) {
    const customer =
        customers.find(c => String(c.id) === String(id));
    if (!customer) {
        alert("Không tìm thấy khách hàng.");
        return;
    }
    editingId = customer.id;
    const nameInput =
        document.getElementById("name");
    const addressInput =
        document.getElementById("address");
    const noteInput =
        document.getElementById("note");
    if (nameInput) {
        nameInput.value = customer.name || "";
    }
    if (addressInput) {
        addressInput.value = customer.address || "";
    }
    if (noteInput) {
        noteInput.value = customer.note || "";
    }
    latitude =
        customer.latitude ?? null;
    longitude =
        customer.longitude ?? null;
    photoData =
        customer.photo_url || null;
    // Hiển thị ảnh cũ
    const preview =
        document.getElementById("photoPreview");
    if (preview) {
        if (photoData) {
            preview.src = photoData;
            preview.style.display = "block";
        } else {
            preview.style.display = "none";
        }
    }
    const saveBtn =
        document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.textContent = "Cập nhật";
    }
    showPage("addCustomer");
}
// ===============================
// XÓA KHÁCH HÀNG
// ===============================
async function deleteCustomer(id) {
    const customer =
        customers.find(c => String(c.id) === String(id));
    if (!customer) {
        return;
    }
    const confirmDelete =
        confirm(
            `Bạn có chắc muốn xóa khách hàng "${customer.name}" không?`
        );
    if (!confirmDelete) {
        return;
    }
    try {
        // Không lọc user_id
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
        alert("✅ Đã xóa khách hàng.");
        await loadCustomers();
    } catch (error) {
        console.error(error);
        alert("❌ Có lỗi khi xóa.");
    }
}
// ===============================
// XEM ẢNH
// ===============================
function showPhoto(id) {
    const customer =
        customers.find(c => String(c.id) === String(id));
    if (!customer || !customer.photo_url) {
        alert("Khách hàng chưa có ảnh.");
        return;
    }
    const win =
        window.open(
            "",
            "_blank"
        );
    if (!win) {
        alert("Trình duyệt đã chặn cửa sổ ảnh.");
        return;
    }
    win.document.write(`
        <html>
        <head>
            <title>Ảnh khách hàng</title>
            <meta
                name="viewport"
                content="width=device-width,initial-scale=1"
            >
            <style>
                body {
                    margin: 0;
                    background: #000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
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
            <img src="${customer.photo_url}">
        </body>
        </html>
    `);
}
// ===============================
// RESET FORM
// ===============================
function resetForm() {
    editingId = null;
    latitude = null;
    longitude = null;
    photoData = null;
    const nameInput =
        document.getElementById("name");
    const addressInput =
        document.getElementById("address");
    const noteInput =
        document.getElementById("note");
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
        preview.style.display = "none";
    }
    if (gpsStatus) {
        gpsStatus.textContent =
            "Chưa lấy vị trí";
    }
    if (photoStatus) {
        photoStatus.textContent =
            "Chưa chụp ảnh";
    }
    const saveBtn =
        document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.textContent =
            "Lưu khách hàng";
    }
}
// ===============================
// BẢN ĐỒ
// ===============================
function initMap() {
    const mapElement =
        document.getElementById("map");
    if (!mapElement) {
        return;
    }
    if (map) {
        map.invalidateSize();
        loadMapMarkers();
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
            maxZoom: 19,
            attribution: "© OpenStreetMap"
        }
    ).addTo(map);
    loadMapMarkers();
}
// ===============================
// MARKER BẢN ĐỒ
// ===============================
function loadMapMarkers() {
    if (!map) {
        return;
    }
    mapMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    mapMarkers = [];
    customers.forEach(customer => {
        if (
            customer.latitude == null ||
            customer.longitude == null
        ) {
            return;
        }
        const marker =
            L.marker([
                Number(customer.latitude),
                Number(customer.longitude)
            ]).addTo(map);
        marker.bindPopup(`
            <strong>
                ${escapeHTML(customer.name || "")}
            </strong>
            <br>
            ${escapeHTML(customer.address || "")}
        `);
        mapMarkers.push(marker);
    });
}
// ===============================
// MỞ BẢN ĐỒ KHÁCH HÀNG
// ===============================
function openCustomerMap(lat, lng) {
    showPage("mapPage");
    setTimeout(() => {
        if (!map) {
            initMap();
        }
        map.setView(
            [Number(lat), Number(lng)],
            17
        );
    }, 300);
}
// ===============================
// THỐNG KÊ TRANG CHỦ
// ===============================
function updateHomeStats() {
    const total =
        document.getElementById("totalCustomers");
    const gpsCount =
        document.getElementById("gpsCustomers");
    const photoCount =
        document.getElementById("photoCustomers");
    if (total) {
        total.textContent =
            customers.length;
    }
    if (gpsCount) {
        gpsCount.textContent =
            customers.filter(c =>
                c.latitude != null &&
                c.longitude != null
            ).length;
    }
    if (photoCount) {
        photoCount.textContent =
            customers.filter(c =>
                c.photo_url
            ).length;
    }
}
// ===============================
// ĐĂNG XUẤT
// ===============================
async function logout() {
    try {
        await db.auth.signOut();
    } catch (error) {
        console.error(error);
    }
    currentUser = null;
    customers = [];
    editingId = null;
    latitude = null;
    longitude = null;
    photoData = null;
    showLogin();
}
// ===============================
// ESCAPE HTML
// ===============================
function escapeHTML(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
