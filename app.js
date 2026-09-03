/* =====================================================
   KHÁCH HÀNG BẢN ĐỒ
   APP.JS
===================================================== */
/* =====================================================
   SUPABASE
===================================================== */
const SUPABASE_URL =
    "https://yxzjddriuglqwtzxmgbi.supabase.co";
const SUPABASE_KEY =
    "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";
const db =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
/* =====================================================
   BIẾN
===================================================== */
let currentUser = null;
let customers = [];
let editingId = null;
let latitude = null;
let longitude = null;
let photoData = null;
let map = null;
let mapMarkers = [];
/* =====================================================
   KHỞI ĐỘNG
===================================================== */
document.addEventListener(
    "DOMContentLoaded",
    async function () {
        setupEvents();
        const savedEmail =
            localStorage.getItem("savedEmail");
        const email =
            document.getElementById("email");
        const remember =
            document.getElementById("rememberLogin");
        if (savedEmail && email) {
            email.value = savedEmail;
            if (remember) {
                remember.checked = true;
            }
        }
        const result =
            await db.auth.getSession();
        if (
            result.data &&
            result.data.session
        ) {
            currentUser =
                result.data.session.user;
            showApp();
        } else {
            showLogin();
        }
    }
);
/* =====================================================
   GÁN SỰ KIỆN
===================================================== */
function setupEvents() {
    const loginBtn =
        document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener(
            "click",
            login
        );
    }
    const password =
        document.getElementById("password");
    if (password) {
        password.addEventListener(
            "keydown",
            function (e) {
                if (e.key === "Enter") {
                    login();
                }
            }
        );
    }
    const menuBtn =
        document.getElementById("menuBtn");
    if (menuBtn) {
        menuBtn.addEventListener(
            "click",
            openMenu
        );
    }
    const overlay =
        document.getElementById("menuOverlay");
    if (overlay) {
        overlay.addEventListener(
            "click",
            closeMenu
        );
    }
    document
        .querySelectorAll(".menu-item[data-page]")
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    showPage(
                        button.dataset.page
                    );
                    closeMenu();
                }
            );
        });
    const logoutBtn =
        document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            logout
        );
    }
    const gpsBtn =
        document.getElementById("gpsBtn");
    if (gpsBtn) {
        gpsBtn.addEventListener(
            "click",
            getGPS
        );
    }
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
    const saveBtn =
        document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.addEventListener(
            "click",
            saveCustomer
        );
    }
    const cancelBtn =
        document.getElementById("cancelBtn");
    if (cancelBtn) {
        cancelBtn.addEventListener(
            "click",
            function () {
                resetForm();
                showPage("home");
            }
        );
    }
    const search =
        document.getElementById("search");
    if (search) {
        search.addEventListener(
            "input",
            renderCustomers
        );
    }
}
/* =====================================================
   LOGIN
===================================================== */
async function login() {
    const email =
        document
            .getElementById("email")
            .value
            .trim();
    const password =
        document
            .getElementById("password")
            .value;
    const msg =
        document.getElementById(
            "loginMsg"
        );
    if (!email || !password) {
        msg.textContent =
            "❌ Vui lòng nhập email và mật khẩu.";
        return;
    }
    msg.textContent =
        "⏳ Đang đăng nhập...";
    const result =
        await db.auth.signInWithPassword({
            email: email,
            password: password
        });
    if (result.error) {
        console.error(
            result.error
        );
        msg.textContent =
            "❌ " +
            result.error.message;
        return;
    }
    currentUser =
        result.data.user;
    const remember =
        document.getElementById(
            "rememberLogin"
        );
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
    msg.textContent = "";
    showApp();
}
/* =====================================================
   SHOW LOGIN
===================================================== */
function showLogin() {
    const login =
        document.getElementById(
            "loginView"
        );
    const app =
        document.getElementById(
            "appView"
        );
    if (login) {
        login.classList.remove(
            "hidden"
        );
    }
    if (app) {
        app.classList.add(
            "hidden"
        );
    }
}
/* =====================================================
   SHOW APP
===================================================== */
function showApp() {
    const login =
        document.getElementById(
            "loginView"
        );
    const app =
        document.getElementById(
            "appView"
        );
    if (login) {
        login.classList.add(
            "hidden"
        );
    }
    if (app) {
        app.classList.remove(
            "hidden"
        );
    }
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
    loadCustomers();
}
/* =====================================================
   MENU
===================================================== */
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
            "open"
        );
    }
    if (overlay) {
        overlay.classList.remove(
            "hidden"
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
            "open"
        );
    }
    if (overlay) {
        overlay.classList.add(
            "hidden"
        );
    }
}
/* =====================================================
   CHUYỂN TRANG
===================================================== */
function showPage(page) {
    document
        .querySelectorAll(".page")
        .forEach(function (item) {
            item.classList.add(
                "hidden"
            );
        });
    const target =
        document.getElementById(
            "page-" + page
        );
    if (target) {
        target.classList.remove(
            "hidden"
        );
    }
    const title =
        document.getElementById(
            "topTitle"
        );
    if (title) {
        if (page === "home") {
            title.textContent =
                "Khách Hàng Bản Đồ";
        }
        if (page === "add") {
            title.textContent =
                editingId
                    ? "Sửa khách hàng"
                    : "Thêm khách hàng";
        }
        if (page === "customers") {
            title.textContent =
                "Danh sách khách hàng";
            renderCustomers();
        }
        if (page === "map") {
            title.textContent =
                "Bản đồ khách hàng";
            setTimeout(
                function () {
                    initMap();
                    loadMapMarkers();
                },
                100
            );
        }
    }
    if (page === "home") {
        updateHomeStats();
    }
}
/* =====================================================
   GPS
===================================================== */
function getGPS() {
    const status =
        document.getElementById(
            "gpsStatus"
        );
    if (!navigator.geolocation) {
        status.textContent =
            "❌ Điện thoại không hỗ trợ GPS.";
        return;
    }
    status.textContent =
        "⏳ Đang lấy vị trí...";
    navigator.geolocation.getCurrentPosition(
        function (position) {
            latitude =
                position.coords.latitude;
            longitude =
                position.coords.longitude;
            status.textContent =
                "✅ Đã lấy vị trí: " +
                latitude.toFixed(6) +
                ", " +
                longitude.toFixed(6);
        },
        function (error) {
            console.error(error);
            status.textContent =
                "❌ Không lấy được vị trí. " +
                "Hãy cho phép trình duyệt sử dụng GPS.";
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}
/* =====================================================
   CHỤP ẢNH + NÉN
===================================================== */
function handlePhoto(event) {
    const file =
        event.target.files &&
        event.target.files[0];
    if (!file) {
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
        "⏳ Đang nén ảnh...";
    const reader =
        new FileReader();
    reader.onload =
        function () {
            const img =
                new Image();
            img.onload =
                function () {
                    const MAX_SIZE =
                        1200;
                    let width =
                        img.naturalWidth;
                    let height =
                        img.naturalHeight;
                    if (
                        width > MAX_SIZE ||
                        height > MAX_SIZE
                    ) {
                        if (
                            width >= height
                        ) {
                            height =
                                Math.round(
                                    height *
                                    (
                                        MAX_SIZE /
                                        width
                                    )
                                );
                            width =
                                MAX_SIZE;
                        } else {
                            width =
                                Math.round(
                                    width *
                                    (
                                        MAX_SIZE /
                                        height
                                    )
                                );
                            height =
                                MAX_SIZE;
                        }
                    }
                    const canvas =
                        document.createElement(
                            "canvas"
                        );
                    canvas.width =
                        width;
                    canvas.height =
                        height;
                    const ctx =
                        canvas.getContext(
                            "2d"
                        );
                    ctx.drawImage(
                        img,
                        0,
                        0,
                        width,
                        height
                    );
                    canvas.toBlob(
                        function (blob) {
                            if (!blob) {
                                status.textContent =
                                    "❌ Không thể nén ảnh.";
                                return;
                            }
                            const compressedReader =
                                new FileReader();
                            compressedReader.onload =
                                function () {
                                    photoData =
                                        compressedReader.result;
                                    if (preview) {
                                        preview.src =
                                            photoData;
                                        preview.classList.remove(
                                            "hidden"
                                        );
                                    }
                                    const kb =
                                        Math.round(
                                            blob.size /
                                            1024
                                        );
                                    status.textContent =
                                        "✅ Ảnh đã nén: " +
                                        kb +
                                        " KB";
                                };
                            compressedReader.readAsDataURL(
                                blob
                            );
                        },
                        "image/jpeg",
                        0.70
                    );
                };
            img.onerror =
                function () {
                    status.textContent =
                        "❌ Không đọc được ảnh.";
                };
            img.src =
                reader.result;
        };
    reader.onerror =
        function () {
            status.textContent =
                "❌ Không đọc được ảnh.";
        };
    reader.readAsDataURL(
        file
    );
}
/* =====================================================
   LƯU KHÁCH HÀNG
===================================================== */
async function saveCustomer() {
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
    const status =
        document.getElementById(
            "saveStatus"
        );
    if (!name) {
        status.textContent =
            "❌ Vui lòng nhập họ tên.";
        return;
    }
    if (!address) {
        status.textContent =
            "❌ Vui lòng nhập địa chỉ.";
        return;
    }
    if (!currentUser) {
        status.textContent =
            "❌ Bạn chưa đăng nhập.";
        return;
    }
    status.textContent =
        "⏳ Đang lưu khách hàng...";
    const customerData = {
        user_id:
            currentUser.id,
        name:
            name,
        address:
            address,
        note:
            note,
        latitude:
            latitude,
        longitude:
            longitude,
        photo_url:
            photoData
    };
    let result;
    if (editingId) {
        result =
            await db
                .from("customers")
                .update(customerData)
                .eq(
                    "id",
                    editingId
                )
                .eq(
                    "user_id",
                    currentUser.id
                );
    } else {
        result =
            await db
                .from("customers")
                .insert([
                    customerData
                ]);
    }
    if (result.error) {
        console.error(
            result.error
        );
        status.textContent =
            "❌ Lưu thất bại: " +
            result.error.message;
        return;
    }
    status.textContent =
        "✅ Đã lưu khách hàng.";
    resetForm();
    await loadCustomers();
    setTimeout(
        function () {
            showPage(
                "customers"
            );
        },
        500
    );
}
/* =====================================================
   RESET FORM
===================================================== */
function resetForm() {
    editingId = null;
    latitude = null;
    longitude = null;
    photoData = null;
    const name =
        document.getElementById(
            "name"
        );
    const address =
        document.getElementById(
            "address"
        );
    const note =
        document.getElementById(
            "note"
        );
    if (name) {
        name.value = "";
    }
    if (address) {
        address.value = "";
    }
    if (note) {
        note.value = "";
    }
    const preview =
        document.getElementById(
            "photoPreview"
        );
    if (preview) {
        preview.src = "";
        preview.classList.add(
            "hidden"
        );
    }
    const cameraInput =
        document.getElementById(
            "cameraInput"
        );
    if (cameraInput) {
        cameraInput.value = "";
    }
    const gpsStatus =
        document.getElementById(
            "gpsStatus"
        );
    if (gpsStatus) {
        gpsStatus.textContent = "";
    }
    const photoStatus =
        document.getElementById(
            "photoStatus"
        );
    if (photoStatus) {
        photoStatus.textContent = "";
    }
    const saveStatus =
        document.getElementById(
            "saveStatus"
        );
    if (saveStatus) {
        saveStatus.textContent = "";
    }
    const addTitle =
        document.getElementById(
            "addTitle"
        );
    if (addTitle) {
        addTitle.textContent =
            "➕ Thêm khách hàng";
    }
}
/* =====================================================
   LOAD KHÁCH HÀNG
===================================================== */
async function loadCustomers() {
    if (!currentUser) {
        return;
    }
    const result =
        await db
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
    if (result.error) {
        console.error(
            result.error
        );
        const list =
            document.getElementById(
                "customerList"
            );
        if (list) {
            list.innerHTML =
                "<div class='empty'>" +
                "❌ Không tải được dữ liệu.<br>" +
                escapeHTML(
                    result.error.message
                ) +
                "</div>";
        }
        return;
    }
    customers =
        result.data || [];
    renderCustomers();
    updateHomeStats();
}
/* =====================================================
   HIỂN THỊ DANH SÁCH
===================================================== */
function renderCustomers() {
    const list =
        document.getElementById(
            "customerList"
        );
    if (!list) {
        return;
    }
    const search =
        document.getElementById(
            "search"
        );
    const keyword =
        search
            ? search.value
                .trim()
                .toLowerCase()
            : "";
    let filtered =
        customers;
    if (keyword) {
        filtered =
            customers.filter(
                function (customer) {
                    const name =
                        (
                            customer.name ||
                            ""
                        ).toLowerCase();
                    const address =
                        (
                            customer.address ||
                            ""
                        ).toLowerCase();
                    const note =
                        (
                            customer.note ||
                            ""
                        ).toLowerCase();
                    return (
                        name.includes(
                            keyword
                        ) ||
                        address.includes(
                            keyword
                        ) ||
                        note.includes(
                            keyword
                        )
                    );
                }
            );
    }
    if (filtered.length === 0) {
        list.innerHTML =
            "<div class='empty'>" +
            "📭 Chưa có khách hàng." +
            "</div>";
        return;
    }
    list.innerHTML = "";
    filtered.forEach(
        function (customer) {
            const card =
                document.createElement(
                    "div"
                );
            card.className =
                "customer-card";
            let photoHTML = "";
            if (customer.photo_url) {
                photoHTML =
                    `
                    <img
                        class="customer-photo"
                        src="${customer.photo_url}"
                        alt="Ảnh nhà khách"
                        onclick="showPhoto('${customer.id}')"
                    >
                    `;
            }
            let gpsHTML = "";
            if (
                customer.latitude !== null &&
                customer.longitude !== null
            ) {
                gpsHTML =
                    `
                    <button
                        class="small-button map-button"
                        onclick="openMapLocation(
                            ${customer.latitude},
                            ${customer.longitude}
                        )"
                    >
                        🗺️ Bản đồ
                    </button>
                    `;
            }
            card.innerHTML =
                `
                <div class="customer-name">
                    ${escapeHTML(
                        customer.name || ""
                    )}
                </div>
                <div class="customer-info">
                    📍
                    ${escapeHTML(
                        customer.address || ""
                    )}
                </div>
                ${
                    customer.note
                    ?
                    `
                    <div class="customer-info">
                        📝
                        ${escapeHTML(
                            customer.note
                        )}
                    </div>
                    `
                    :
                    ""
                }
                ${photoHTML}
                <div class="customer-actions">
                    <button
                        class="small-button edit-button"
                        onclick="editCustomer(
                            '${customer.id}'
                        )"
                    >
                        ✏️ Sửa
                    </button>
                    <button
                        class="small-button delete-button"
                        onclick="deleteCustomer(
                            '${customer.id}'
                        )"
                    >
                        🗑️ Xóa
                    </button>
                    ${gpsHTML}
                </div>
                `;
            list.appendChild(
                card
            );
        }
    );
}
/* =====================================================
   SỬA
===================================================== */
function editCustomer(id) {
    const customer =
        customers.find(
            function (item) {
                return item.id === id;
            }
        );
    if (!customer) {
        return;
    }
    editingId =
        customer.id;
    document
        .getElementById("name")
        .value =
        customer.name || "";
    document
        .getElementById("address")
        .value =
        customer.address || "";
    document
        .getElementById("note")
        .value =
        customer.note || "";
    latitude =
        customer.latitude;
    longitude =
        customer.longitude;
    photoData =
        customer.photo_url || null;
    const preview =
        document.getElementById(
            "photoPreview"
        );
    if (
        photoData &&
        preview
    ) {
        preview.src =
            photoData;
        preview.classList.remove(
            "hidden"
        );
        const status =
            document.getElementById(
                "photoStatus"
            );
        if (status) {
            status.textContent =
                "✅ Đã có ảnh.";
        }
    }
    const addTitle =
        document.getElementById(
            "addTitle"
        );
    if (addTitle) {
        addTitle.textContent =
            "✏️ Sửa khách hàng";
    }
    showPage("add");
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
/* =====================================================
   XÓA
===================================================== */
async function deleteCustomer(id) {
    const ok =
        confirm(
            "Bạn có chắc muốn xóa khách hàng này?"
        );
    if (!ok) {
        return;
    }
    const result =
        await db
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
    if (result.error) {
        alert(
            "❌ Xóa thất bại: " +
            result.error.message
        );
        return;
    }
    await loadCustomers();
}
/* =====================================================
   XEM ẢNH
===================================================== */
function showPhoto(id) {
    const customer =
        customers.find(
            function (item) {
                return item.id === id;
            }
        );
    if (
        !customer ||
        !customer.photo_url
    ) {
        return;
    }
    const win =
        window.open("");
    if (!win) {
        alert(
            "Trình duyệt đang chặn cửa sổ xem ảnh."
        );
        return;
    }
    win.document.write(
        `
        <!doctype html>
        <html>
        <head>
            <meta
                name="viewport"
                content="width=device-width,initial-scale=1"
            >
            <title>Ảnh nhà khách</title>
        </head>
        <body
            style="
                margin:0;
                background:#000;
                min-height:100vh;
                display:flex;
                align-items:center;
                justify-content:center;
            "
        >
            <img
                src="${customer.photo_url}"
                style="
                    max-width:100%;
                    max-height:100vh;
                    object-fit:contain;
                "
            >
        </body>
        </html>
        `
    );
}
/* =====================================================
   MAP
===================================================== */
function initMap() {
    const mapElement =
        document.getElementById(
            "map"
        );
    if (!mapElement) {
        return;
    }
    if (map) {
        map.invalidateSize();
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
            13
        );
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap"
        }
    ).addTo(map);
}
/* =====================================================
   MARKER
===================================================== */
function loadMapMarkers() {
    if (!map) {
        return;
    }
    mapMarkers.forEach(
        function (marker) {
            map.removeLayer(
                marker
            );
        }
    );
    mapMarkers = [];
    const validCustomers =
        customers.filter(
            function (customer) {
                return (
                    customer.latitude !== null &&
                    customer.longitude !== null
                );
            }
        );
    validCustomers.forEach(
        function (customer) {
            const marker =
                L.marker([
                    customer.latitude,
                    customer.longitude
                ])
                .addTo(map)
                .bindPopup(
                    `
                    <b>
                        ${escapeHTML(
                            customer.name || ""
                        )}
                    </b>
                    <br>
                    📍
                    ${escapeHTML(
                        customer.address || ""
                    )}
                    `
                );
            mapMarkers.push(
                marker
            );
        }
    );
    if (
        validCustomers.length > 0
    ) {
        const first =
            validCustomers[0];
        map.setView(
            [
                first.latitude,
                first.longitude
            ],
            14
        );
    }
}
/* =====================================================
   MỞ VỊ TRÍ
===================================================== */
function openMapLocation(
    lat,
    lng
) {
    showPage("map");
    setTimeout(
        function () {
            if (!map) {
                return;
            }
            map.setView(
                [
                    lat,
                    lng
                ],
                17
            );
            L.marker([
                lat,
                lng
            ])
            .addTo(map)
            .bindPopup(
                "📍 Vị trí khách hàng"
            )
            .openPopup();
        },
        200
    );
}
/* =====================================================
   THỐNG KÊ TRANG CHỦ
===================================================== */
function updateHomeStats() {
    const box =
        document.getElementById(
            "homeStats"
        );
    if (!box) {
        return;
    }
    const total =
        customers.length;
    const gps =
        customers.filter(
            function (customer) {
                return (
                    customer.latitude !== null &&
                    customer.longitude !== null
                );
            }
        ).length;
    const photos =
        customers.filter(
            function (customer) {
                return !!customer.photo_url;
            }
        ).length;
    box.innerHTML =
        `
        <p>
            👥 Tổng khách hàng:
            <b>${total}</b>
        </p>
        <p>
            📍 Đã có GPS:
            <b>${gps}</b>
        </p>
        <p>
            📷 Đã có ảnh:
            <b>${photos}</b>
        </p>
        `;
}
/* =====================================================
   LOGOUT
===================================================== */
async function logout() {
    const ok =
        confirm(
            "Bạn có chắc muốn đăng xuất?"
        );
    if (!ok) {
        return;
    }
    await db.auth.signOut();
    currentUser = null;
    customers = [];
    resetForm();
    closeMenu();
    showLogin();
}
/* =====================================================
   ESCAPE HTML
===================================================== */
function escapeHTML(text) {
    return String(text)
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
