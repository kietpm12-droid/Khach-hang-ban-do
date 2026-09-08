// ============================================================
// APP.JS
// QUẢN LÝ KHÁCH HÀNG + GPS + ẢNH NHÀ + BẢN ĐỒ
// ============================================================
"use strict";
// ============================================================
// SUPABASE
// ============================================================
const SUPABASE_URL =
    "https://yxzjddriuglqwtzxmgbi.supabase.co";
const SUPABASE_KEY =
    "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";
// Kiểm tra Supabase
if (!window.supabase) {
    document.addEventListener("DOMContentLoaded", function () {
        alert(
            "❌ Không tải được Supabase.\n\n" +
            "Hãy kiểm tra kết nối Internet và tải lại trang."
        );
    });
    throw new Error("Supabase JS chưa được tải.");
}
const db =
    window.supabase.createClient(
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
document.addEventListener(
    "DOMContentLoaded",
    async function () {
        try {
            setupEvents();
            loadRememberedEmail();
            const {
                data,
                error
            } = await db.auth.getSession();
            if (error) {
                console.error(error);
                showLogin();
                return;
            }
            if (
                data &&
                data.session &&
                data.session.user
            ) {
                currentUser =
                    data.session.user;
                showApp();
            } else {
                showLogin();
            }
        } catch (error) {
            console.error(
                "Lỗi khởi động:",
                error
            );
            showLogin();
        }
    }
);
// ============================================================
// GẮN SỰ KIỆN
// ============================================================
function setupEvents() {
    // --------------------------------------------------------
    // LOGIN
    // --------------------------------------------------------
    const loginBtn =
        document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener(
            "click",
            login
        );
    }
    const passwordInput =
        document.getElementById("password");
    if (passwordInput) {
        passwordInput.addEventListener(
            "keydown",
            function (event) {
                if (event.key === "Enter") {
                    login();
                }
            }
        );
    }
    // --------------------------------------------------------
    // MENU
    // --------------------------------------------------------
    const menuBtn =
        document.getElementById("menuBtn");
    if (menuBtn) {
        menuBtn.addEventListener(
            "click",
            openMenu
        );
    }
    const menuOverlay =
        document.getElementById("menuOverlay");
    if (menuOverlay) {
        menuOverlay.addEventListener(
            "click",
            closeMenu
        );
    }
    document
        .querySelectorAll("[data-page]")
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    const page =
                        this.getAttribute(
                            "data-page"
                        );
                    closeMenu();
                    showPage(page);
                }
            );
        });
    // --------------------------------------------------------
    // LOGOUT
    // --------------------------------------------------------
    const logoutBtn =
        document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            logout
        );
    }
    // --------------------------------------------------------
    // GPS
    // --------------------------------------------------------
    const gpsBtn =
        document.getElementById("gpsBtn");
    if (gpsBtn) {
        gpsBtn.addEventListener(
            "click",
            getGPS
        );
    }
    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------
    const cameraBtn =
        document.getElementById("cameraBtn");
    const cameraInput =
        document.getElementById("cameraInput");
    if (
        cameraBtn &&
        cameraInput
    ) {
        cameraBtn.addEventListener(
            "click",
            function () {
                cameraInput.click();
            }
        );
        cameraInput.addEventListener(
            "change",
            handlePhoto
        );
    }
    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------
    const saveBtn =
        document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.addEventListener(
            "click",
            saveCustomer
        );
    }
    // --------------------------------------------------------
    // CANCEL
    // --------------------------------------------------------
    const cancelBtn =
        document.getElementById("cancelBtn");
    if (cancelBtn) {
        cancelBtn.addEventListener(
            "click",
            function () {
                resetForm();
                showPage("customers");
            }
        );
    }
    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------
    const searchInput =
        document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener(
            "input",
            function () {
                openedCustomerId = null;
                renderCustomers(
                    this.value
                );
            }
        );
    }
}
// ============================================================
// NHỚ EMAIL
// ============================================================
function loadRememberedEmail() {
    const savedEmail =
        localStorage.getItem(
            "savedEmail"
        );
    const emailInput =
        document.getElementById("email");
    const remember =
        document.getElementById("remember");
    if (
        savedEmail &&
        emailInput
    ) {
        emailInput.value =
            savedEmail;
    }
    if (
        savedEmail &&
        remember
    ) {
        remember.checked = true;
    }
}
// ============================================================
// LOGIN
// ============================================================
async function login() {
    const emailInput =
        document.getElementById("email");
    const passwordInput =
        document.getElementById("password");
    const remember =
        document.getElementById("remember");
    const loginBtn =
        document.getElementById("loginBtn");
    if (
        !emailInput ||
        !passwordInput
    ) {
        return;
    }
    const email =
        emailInput.value.trim();
    const password =
        passwordInput.value;
    if (!email || !password) {
        alert(
            "❌ Vui lòng nhập email và mật khẩu."
        );
        return;
    }
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent =
            "Đang đăng nhập...";
    }
    try {
        const {
            data,
            error
        } =
            await db.auth.signInWithPassword({
                email: email,
                password: password
            });
        if (error) {
            console.error(error);
            alert(
                "❌ Đăng nhập thất bại:\n\n" +
                error.message
            );
            return;
        }
        currentUser =
            data.user;
        // GHI NHỚ EMAIL
        if (
            remember &&
            remember.checked
        ) {
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
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent =
                "Đăng nhập";
        }
    }
}
// ============================================================
// HIỂN THỊ APP
// ============================================================
function showApp() {
    const loginPage =
        document.getElementById(
            "loginPage"
        );
    const appPage =
        document.getElementById(
            "appPage"
        );
    if (loginPage) {
        loginPage.style.display =
            "none";
    }
    if (appPage) {
        appPage.style.display =
            "block";
    }
    // Hiển thị email
    const menuUser =
        document.getElementById(
            "menuUser"
        );
    if (
        menuUser &&
        currentUser
    ) {
        menuUser.textContent =
            currentUser.email || "";
    }
    showPage("home");
    loadCustomers();
}
// ============================================================
// HIỂN THỊ LOGIN
// ============================================================
function showLogin() {
    const loginPage =
        document.getElementById(
            "loginPage"
        );
    const appPage =
        document.getElementById(
            "appPage"
        );
    if (loginPage) {
        loginPage.style.display =
            "flex";
    }
    if (appPage) {
        appPage.style.display =
            "none";
    }
}
// ============================================================
// MENU
// ============================================================
function openMenu() {
    const menu =
        document.getElementById(
            "sideMenu"
        );
    const overlay =
        document.getElementById(
            "menuOverlay"
        );
    if (menu) {
        menu.classList.add(
            "active"
        );
    }
    if (overlay) {
        overlay.classList.add(
            "active"
        );
    }
}
function closeMenu() {
    const menu =
        document.getElementById(
            "sideMenu"
        );
    const overlay =
        document.getElementById(
            "menuOverlay"
        );
    if (menu) {
        menu.classList.remove(
            "active"
        );
    }
    if (overlay) {
        overlay.classList.remove(
            "active"
        );
    }
}
// ============================================================
// CHUYỂN TRANG
// ============================================================
function showPage(page) {
    document
        .querySelectorAll(".page")
        .forEach(function (element) {
            element.style.display =
                "none";
        });
    let target = null;
    // HOME
    if (page === "home") {
        target =
            document.getElementById(
                "home"
            );
    }
    // THÊM KHÁCH
    if (page === "addCustomer") {
        target =
            document.getElementById(
                "addCustomer"
            );
    }
    // DANH SÁCH
    if (page === "customers") {
        target =
            document.getElementById(
                "customers"
            );
    }
    // BẢN ĐỒ
    if (page === "mapPage") {
        target =
            document.getElementById(
                "mapPage"
            );
    }
    if (target) {
        target.style.display =
            "block";
    }
    // HOME
    if (page === "home") {
        updateStats();
    }
    // DANH SÁCH
    if (page === "customers") {
        openedCustomerId = null;
        const searchInput =
            document.getElementById(
                "searchInput"
            );
        renderCustomers(
            searchInput
                ? searchInput.value
                : ""
        );
    }
    // MAP
    if (page === "mapPage") {
        setTimeout(
            function () {
                initMap();
            },
            150
        );
    }
}
// ============================================================
// GPS
// ============================================================
function getGPS() {
    if (
        !navigator.geolocation
    ) {
        alert(
            "❌ Thiết bị không hỗ trợ GPS."
        );
        return;
    }
    const status =
        document.getElementById(
            "gpsStatus"
        );
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
                    "📍 " +
                    latitude.toFixed(6) +
                    ", " +
                    longitude.toFixed(6);
            }
        },
        function (error) {
            console.error(error);
            if (status) {
                status.textContent =
                    "❌ Không lấy được vị trí.";
            }
            alert(
                "❌ Không lấy được GPS.\n\n" +
                "Hãy cho phép trình duyệt truy cập vị trí."
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
    if (
        !file.type.startsWith(
            "image/"
        )
    ) {
        alert(
            "❌ Vui lòng chọn file ảnh."
        );
        return;
    }
    const reader =
        new FileReader();
    reader.onload =
        function (e) {
            const img =
                new Image();
            img.onload =
                function () {
                    const maxSize =
                        1200;
                    let width =
                        img.width;
                    let height =
                        img.height;
                    if (
                        width > maxSize ||
                        height > maxSize
                    ) {
                        if (
                            width > height
                        ) {
                            height =
                                height *
                                (
                                    maxSize /
                                    width
                                );
                            width =
                                maxSize;
                        } else {
                            width =
                                width *
                                (
                                    maxSize /
                                    height
                                );
                            height =
                                maxSize;
                        }
                    }
                    const canvas =
                        document.createElement(
                            "canvas"
                        );
                    canvas.width =
                        Math.round(
                            width
                        );
                    canvas.height =
                        Math.round(
                            height
                        );
                    const ctx =
                        canvas.getContext(
                            "2d"
                        );
                    ctx.drawImage(
                        img,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );
                    photoData =
                        canvas.toDataURL(
                            "image/jpeg",
                            0.70
                        );
                    const preview =
                        document.getElementById(
                            "photoPreview"
                        );
                    if (preview) {
                        preview.src =
                            photoData;
                        preview.style.display =
                            "block";
                    }
                    const status =
                        document.getElementById(
                            "photoStatus"
                        );
                    if (status) {
                        status.textContent =
                            "✅ Đã chọn ảnh nhà";
                    }
                };
            img.src =
                e.target.result;
        };
    reader.readAsDataURL(file);
}
// ============================================================
// LƯU KHÁCH HÀNG
// ============================================================
async function saveCustomer() {
    if (!currentUser) {
        alert(
            "❌ Vui lòng đăng nhập."
        );
        return;
    }
    const nameInput =
        document.getElementById(
            "name"
        );
    const addressInput =
        document.getElementById(
            "address"
        );
    const noteInput =
        document.getElementById(
            "note"
        );
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
        alert(
            "❌ Vui lòng nhập họ tên khách hàng."
        );
        return;
    }
    if (!address) {
        alert(
            "❌ Vui lòng nhập địa chỉ."
        );
        return;
    }
    const customerData = {
        name: name,
        address: address,
        note: note,
        latitude: latitude,
        longitude: longitude,
        photo_url: photoData,
        created_by:
            currentUser.id
    };
    const saveBtn =
        document.getElementById(
            "saveBtn"
        );
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent =
            editingId
                ? "Đang cập nhật..."
                : "Đang lưu...";
    }
    try {
        // ----------------------------------------------------
        // CẬP NHẬT
        // ----------------------------------------------------
        if (editingId) {
            const {
                error
            } =
                await db
                    .from("customers")
                    .update(customerData)
                    .eq(
                        "id",
                        editingId
                    );
            if (error) {
                console.error(error);
                alert(
                    "❌ Lỗi cập nhật:\n\n" +
                    error.message
                );
                return;
            }
            alert(
                "✅ Đã cập nhật khách hàng."
            );
        }
        // ----------------------------------------------------
        // THÊM MỚI
        // ----------------------------------------------------
        else {
            const {
                error
            } =
                await db
                    .from("customers")
                    .insert(
                        [customerData]
                    );
            if (error) {
                console.error(error);
                alert(
                    "❌ Lỗi lưu khách hàng:\n\n" +
                    error.message
                );
                return;
            }
            alert(
                "✅ Đã lưu khách hàng."
            );
        }
        resetForm();
        await loadCustomers();
        showPage("customers");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent =
                "Lưu khách hàng";
        }
    }
}
// ============================================================
// TẢI KHÁCH HÀNG
// ============================================================
async function loadCustomers() {
    const container =
        document.getElementById(
            "customerList"
        );
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                ⏳ Đang tải dữ liệu...
            </div>
        `;
    }
    const {
        data,
        error
    } =
        await db
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
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    ❌ Không thể tải dữ liệu.<br><br>
                    ${escapeHTML(error.message)}
                </div>
            `;
        }
        return;
    }
    customers =
        data || [];
    renderCustomers();
    updateStats();
    if (map) {
        loadMapMarkers();
    }
}
// ============================================================
// RENDER DANH SÁCH
// ============================================================
function renderCustomers(
    searchText = ""
) {
    const container =
        document.getElementById(
            "customerList"
        );
    if (!container) return;
    const keyword =
        String(searchText || "")
            .trim()
            .toLowerCase();
    const filtered =
        customers.filter(
            function (customer) {
                if (!keyword) {
                    return true;
                }
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
    if (
        filtered.length === 0
    ) {
        container.innerHTML = `
            <div class="empty-state">
                📭 Không tìm thấy khách hàng
            </div>
        `;
        return;
    }
    container.innerHTML =
        filtered
            .map(
                createCustomerCard
            )
            .join("");
}
// ============================================================
// TẠO CARD
// ============================================================
function createCustomerCard(
    customer
) {
    const id =
        String(customer.id);
    const isOpen =
        String(openedCustomerId) === id;
    // ========================================================
    // DẠNG THU GỌN
    // ========================================================
    if (!isOpen) {
        return `
            <div
                class="customer-card compact-card"
                onclick="toggleCustomerDetail('${escapeHTML(id)}')"
            >
                <div class="customer-summary">
                    <div class="customer-summary-text">
                        <div class="customer-name">
                            👤 ${escapeHTML(
                                customer.name ||
                                "Chưa có tên"
                            )}
                        </div>
                        <div class="customer-address">
                            📍 ${escapeHTML(
                                customer.address ||
                                "Chưa có địa chỉ"
                            )}
                        </div>
                    </div>
                    <div class="customer-arrow">
                        ›
                    </div>
                </div>
            </div>
        `;
    }
    // ========================================================
    // DẠNG CHI TIẾT
    // ========================================================
    return `
        <div
            class="customer-card compact-card"
        >
            <!-- HEADER -->
            <div
                class="customer-summary"
                onclick="toggleCustomerDetail('${escapeHTML(id)}')"
            >
                <div class="customer-summary-text">
                    <div class="customer-name">
                        👤 ${escapeHTML(
                            customer.name ||
                            "Chưa có tên"
                        )}
                    </div>
                    <div class="customer-address">
                        📍 ${escapeHTML(
                            customer.address ||
                            "Chưa có địa chỉ"
                        )}
                    </div>
                </div>
                <div class="customer-arrow">
                    ▲
                </div>
            </div>
            <!-- CHI TIẾT -->
            <div class="customer-detail">
                <div class="detail-row">
                    <strong>📍 Địa chỉ</strong>
                    <span>
                        ${escapeHTML(
                            customer.address ||
                            "Chưa có địa chỉ"
                        )}
                    </span>
                </div>
                ${
                    customer.note
                        ? `
                            <div class="detail-row">
                                <strong>📝 Ghi chú</strong>
                                <span>
                                    ${escapeHTML(
                                        customer.note
                                    )}
                                </span>
                            </div>
                        `
                        : ""
                }
                ${
                    customer.latitude != null &&
                    customer.longitude != null
                        ? `
                            <div class="detail-row">
                                <strong>📌 GPS</strong>
                                <span>
                                    ${Number(
                                        customer.latitude
                                    ).toFixed(6)},
                                    ${Number(
                                        customer.longitude
                                    ).toFixed(6)}
                                </span>
                            </div>
                        `
                        : `
                            <div class="detail-row">
                                <strong>📌 GPS</strong>
                                <span>
                                    Chưa có vị trí
                                </span>
                            </div>
                        `
                }
                <!-- ẢNH -->
                ${
                    customer.photo_url
                        ? `
                            <div class="customer-photo-box">
                                <strong>
                                    🏠 Ảnh nhà
                                </strong>
                                <img
                                    class="customer-photo"
                                    src="${escapeHTML(
                                        customer.photo_url
                                    )}"
                                    alt="Ảnh nhà"
                                    onclick="event.stopPropagation(); showPhoto('${escapeHTML(id)}')"
                                >
                                <div class="photo-hint">
                                    👆 Bấm vào ảnh để xem lớn
                                </div>
                            </div>
                        `
                        : `
                            <div class="customer-photo-box">
                                <div class="empty-state">
                                    🏠 Chưa có ảnh nhà
                                </div>
                            </div>
                        `
                }
                <!-- NÚT -->
                <div class="customer-actions">
                    ${
                        customer.latitude != null &&
                        customer.longitude != null
                            ? `
                                <button
                                    class="map-btn"
                                    onclick="event.stopPropagation(); startNavigation(${Number(customer.latitude)}, ${Number(customer.longitude)})"
                                >
                                    🚗 Chỉ đường
                                </button>
                            `
                            : `
                                <button
                                    class="map-btn"
                                    disabled
                                >
                                    📍 Chưa có GPS
                                </button>
                            `
                    }
                    <button
                        class="edit-btn"
                        onclick="event.stopPropagation(); editCustomer('${escapeHTML(id)}')"
                    >
                        ✏️ Sửa
                    </button>
                    <button
                        class="photo-btn"
                        onclick="event.stopPropagation(); openCustomerMap('${escapeHTML(id)}')"
                    >
                        🗺️ Bản đồ
                    </button>
                    <button
                        class="delete-btn"
                        onclick="event.stopPropagation(); deleteCustomer('${escapeHTML(id)}')"
                    >
                        🗑️ Xóa
                    </button>
                </div>
            </div>
        </div>
    `;
}
// ============================================================
// MỞ / ĐÓNG CHI TIẾT
// ============================================================
function toggleCustomerDetail(
    id
) {
    if (
        String(openedCustomerId) ===
        String(id)
    ) {
        openedCustomerId = null;
    } else {
        openedCustomerId = id;
    }
    const searchInput =
        document.getElementById(
            "searchInput"
        );
    renderCustomers(
        searchInput
            ? searchInput.value
            : ""
    );
}
// ============================================================
// XEM ẢNH LỚN
// ============================================================
function showPhoto(id) {
    const customer =
        customers.find(
            function (item) {
                return (
                    String(item.id) ===
                    String(id)
                );
            }
        );
    if (
        !customer ||
        !customer.photo_url
    ) {
        alert(
            "❌ Không có ảnh."
        );
        return;
    }
    const newWindow =
        window.open(
            "",
            "_blank"
        );
    if (!newWindow) {
        alert(
            "⚠️ Trình duyệt chặn cửa sổ xem ảnh."
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
                ${escapeHTML(
                    customer.name ||
                    "Ảnh nhà"
                )}
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
                    max-height:96vh;
                    object-fit:contain;
                }
            </style>
        </head>
        <body>
            <img
                src="${escapeHTML(
                    customer.photo_url
                )}"
                alt="Ảnh nhà"
            >
        </body>
        </html>
    `);
    newWindow.document.close();
}
// ============================================================
// CHỈ ĐƯỜNG
// ============================================================
function startNavigation(
    lat,
    lng
) {
    const latitudeValue =
        Number(lat);
    const longitudeValue =
        Number(lng);
    if (
        !Number.isFinite(
            latitudeValue
        ) ||
        !Number.isFinite(
            longitudeValue
        )
    ) {
        alert(
            "❌ GPS không hợp lệ."
        );
        return;
    }
    const url =
        "https://www.google.com/maps/dir/?api=1" +
        "&destination=" +
        latitudeValue +
        "," +
        longitudeValue;
    window.open(
        url,
        "_blank"
    );
}
// ============================================================
// SỬA KHÁCH HÀNG
// ============================================================
function editCustomer(
    id
) {
    const customer =
        customers.find(
            function (item) {
                return (
                    String(item.id) ===
                    String(id)
                );
            }
        );
    if (!customer) {
        alert(
            "❌ Không tìm thấy khách hàng."
        );
        return;
    }
    editingId =
        customer.id;
    const nameInput =
        document.getElementById(
            "name"
        );
    const addressInput =
        document.getElementById(
            "address"
        );
    const noteInput =
        document.getElementById(
            "note"
        );
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
            ? Number(
                customer.latitude
            )
            : null;
    longitude =
        customer.longitude != null
            ? Number(
                customer.longitude
            )
            : null;
    photoData =
        customer.photo_url || null;
    // GPS STATUS
    const gpsStatus =
        document.getElementById(
            "gpsStatus"
        );
    if (gpsStatus) {
        if (
            latitude != null &&
            longitude != null
        ) {
            gpsStatus.textContent =
                "📍 " +
                latitude.toFixed(6) +
                ", " +
                longitude.toFixed(6);
        } else {
            gpsStatus.textContent =
                "📍 Chưa có GPS";
        }
    }
    // PHOTO
    const preview =
        document.getElementById(
            "photoPreview"
        );
    if (preview) {
        if (photoData) {
            preview.src =
                photoData;
            preview.style.display =
                "block";
        } else {
            preview.src = "";
            preview.style.display =
                "none";
        }
    }
    const photoStatus =
        document.getElementById(
            "photoStatus"
        );
    if (photoStatus) {
        photoStatus.textContent =
            photoData
                ? "✅ Đang sử dụng ảnh hiện tại"
                : "Chưa có ảnh";
    }
    showPage(
        "addCustomer"
    );
}
// ============================================================
// XÓA KHÁCH HÀNG
// ============================================================
async function deleteCustomer(
    id
) {
    const customer =
        customers.find(
            function (item) {
                return (
                    String(item.id) ===
                    String(id)
                );
            }
        );
    const customerName =
        customer
            ? customer.name
            : "khách hàng";
    const confirmed =
        confirm(
            'Bạn có chắc muốn xóa "' +
            customerName +
            '" không?'
        );
    if (!confirmed) {
        return;
    }
    const {
        error
    } =
        await db
            .from("customers")
            .delete()
            .eq(
                "id",
                id
            );
    if (error) {
        console.error(error);
        alert(
            "❌ Không thể xóa:\n\n" +
            error.message
        );
        return;
    }
    openedCustomerId = null;
    alert(
        "✅ Đã xóa khách hàng."
    );
    await loadCustomers();
}
// ============================================================
// MỞ BẢN ĐỒ KHÁCH HÀNG
// ============================================================
function openCustomerMap(
    id
) {
    const customer =
        customers.find(
            function (item) {
                return (
                    String(item.id) ===
                    String(id)
                );
            }
        );
    if (!customer) {
        alert(
            "❌ Không tìm thấy khách hàng."
        );
        return;
    }
    if (
        customer.latitude == null ||
        customer.longitude == null
    ) {
        alert(
            "❌ Khách hàng này chưa có GPS."
        );
        return;
    }
    showPage(
        "mapPage"
    );
    setTimeout(
        function () {
            if (!map) return;
            const lat =
                Number(
                    customer.latitude
                );
            const lng =
                Number(
                    customer.longitude
                );
            map.setView(
                [lat, lng],
                17
            );
            mapMarkers.forEach(
                function (marker) {
                    const position =
                        marker.getLatLng();
                    if (
                        Math.abs(
                            position.lat -
                            lat
                        ) < 0.000001
                        &&
                        Math.abs(
                            position.lng -
                            lng
                        ) < 0.000001
                    ) {
                        marker.openPopup();
                    }
                }
            );
        },
        400
    );
}
// ============================================================
// KHỞI TẠO BẢN ĐỒ
// ============================================================
function initMap() {
    const mapElement =
        document.getElementById(
            "map"
        );
    if (!mapElement) {
        return;
    }
    if (
        typeof L ===
        "undefined"
    ) {
        alert(
            "❌ Không tải được Leaflet."
        );
        return;
    }
    if (map) {
        setTimeout(
            function () {
                map.invalidateSize();
                loadMapMarkers();
            },
            100
        );
        return;
    }
    map =
        L.map(
            "map"
        ).setView(
            [
                10.0452,
                105.7469
            ],
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
    setTimeout(
        function () {
            map.invalidateSize();
        },
        200
    );
    loadMapMarkers();
}
// ============================================================
// MARKER BẢN ĐỒ
// ============================================================
function loadMapMarkers() {
    if (!map) return;
    mapMarkers.forEach(
        function (marker) {
            map.removeLayer(
                marker
            );
        }
    );
    mapMarkers = [];
    customers
        .filter(
            function (customer) {
                return (
                    customer.latitude != null &&
                    customer.longitude != null
                );
            }
        )
        .forEach(
            function (customer) {
                const lat =
                    Number(
                        customer.latitude
                    );
                const lng =
                    Number(
                        customer.longitude
                    );
                if (
                    !Number.isFinite(lat) ||
                    !Number.isFinite(lng)
                ) {
                    return;
                }
                let icon;
                // ------------------------------------------------
                // CÓ ẢNH
                // ------------------------------------------------
                if (
                    customer.photo_url
                ) {
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
                                    box-shadow:0 2px 8px rgba(0,0,0,.35);
                                ">
                                    <img
                                        src="${escapeHTML(
                                            customer.photo_url
                                        )}"
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
                // ------------------------------------------------
                // KHÔNG CÓ ẢNH
                // ------------------------------------------------
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
                                    box-shadow:0 2px 8px rgba(0,0,0,.35);
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
                            icon:
                                icon
                        }
                    )
                    .addTo(map);
                marker.bindPopup(`
                    <div style="
                        min-width:220px;
                        max-width:280px;
                    ">
                        ${
                            customer.photo_url
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            customer.photo_url
                                        )}"
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
                            ${escapeHTML(
                                customer.name ||
                                "Chưa có tên"
                            )}
                        </div>
                        <div style="
                            font-size:14px;
                            margin-bottom:10px;
                        ">
                            📍 ${escapeHTML(
                                customer.address ||
                                "Chưa có địa chỉ"
                            )}
                        </div>
                        ${
                            customer.note
                                ? `
                                    <div style="
                                        font-size:14px;
                                        margin-bottom:10px;
                                    ">
                                        📝 ${escapeHTML(
                                            customer.note
                                        )}
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
                                color:#fff;
                                font-weight:600;
                                cursor:pointer;
                            "
                        >
                            🚗 Chỉ đường
                        </button>
                    </div>
                `);
                mapMarkers.push(
                    marker
                );
            }
        );
}
// ============================================================
// THỐNG KÊ
// ============================================================
function updateStats() {
    const total =
        customers.length;
    const gpsCount =
        customers.filter(
            function (customer) {
                return (
                    customer.latitude != null &&
                    customer.longitude != null
                );
            }
        ).length;
    const photoCount =
        customers.filter(
            function (customer) {
                return !!customer.photo_url;
            }
        ).length;
    const totalElement =
        document.getElementById(
            "totalCustomers"
        );
    const gpsElement =
        document.getElementById(
            "gpsCustomers"
        );
    const photoElement =
        document.getElementById(
            "photoCustomers"
        );
    if (totalElement) {
        totalElement.textContent =
            total;
    }
    if (gpsElement) {
        gpsElement.textContent =
            gpsCount;
    }
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
        document.getElementById(
            "name"
        );
    const addressInput =
        document.getElementById(
            "address"
        );
    const noteInput =
        document.getElementById(
            "note"
        );
    const cameraInput =
        document.getElementById(
            "cameraInput"
        );
    const preview =
        document.getElementById(
            "photoPreview"
        );
    const gpsStatus =
        document.getElementById(
            "gpsStatus"
        );
    const photoStatus =
        document.getElementById(
            "photoStatus"
        );
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
            "Chưa lấy vị trí";
    }
    if (photoStatus) {
        photoStatus.textContent =
            "Chưa chụp ảnh";
    }
}
// ============================================================
// ĐĂNG XUẤT
// ============================================================
async function logout() {
    const confirmed =
        confirm(
            "Bạn có muốn đăng xuất không?"
        );
    if (!confirmed) {
        return;
    }
    const {
        error
    } =
        await db.auth.signOut();
    if (error) {
        console.error(error);
        alert(
            "❌ Không thể đăng xuất:\n\n" +
            error.message
        );
        return;
    }
    currentUser = null;
    customers = [];
    openedCustomerId = null;
    editingId = null;
    latitude = null;
    longitude = null;
    photoData = null;
    if (map) {
        map.remove();
        map = null;
    }
    mapMarkers = [];
    showLogin();
}
// ============================================================
// ESCAPE HTML
// ============================================================
function escapeHTML(
    value
) {
    return String(
        value ?? ""
    )
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
