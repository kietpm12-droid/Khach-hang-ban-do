// ============================================================
// APP.JS
// KHÁCH HÀNG BẢN ĐỒ
// PHIÊN BẢN ĐỒNG BỘ INDEX + CSS
// ============================================================

"use strict";


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://yxzjddriuglqwtzxmgbi.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";


let db = null;

if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
) {

    db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

} else {

    console.error(
        "❌ Không tải được Supabase."
    );

}


// ============================================================
// BIẾN
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

        console.log(
            "APP.JS đã khởi động"
        );

        setupEvents();

        // ------------------------------------------
        // GHI NHỚ EMAIL
        // ------------------------------------------

        const savedEmail =
            localStorage.getItem(
                "savedEmail"
            );

        const emailInput =
            document.getElementById(
                "email"
            );

        const rememberInput =
            document.getElementById(
                "remember"
            );

        if (
            savedEmail &&
            emailInput
        ) {

            emailInput.value =
                savedEmail;

            if (rememberInput) {

                rememberInput.checked =
                    true;

            }

        }


        // ------------------------------------------
        // KIỂM TRA SUPABASE
        // ------------------------------------------

        if (!db) {

            alert(
                "❌ Không tải được Supabase.\n\n" +
                "Hãy kiểm tra kết nối Internet " +
                "và thử tải lại trang."
            );

            showLogin();

            return;

        }


        // ------------------------------------------
        // KIỂM TRA SESSION
        // ------------------------------------------

        try {

            const result =
                await db.auth.getSession();

            if (result.error) {

                console.error(
                    result.error
                );

                showLogin();

                return;

            }

            const session =
                result.data.session;

            if (
                session &&
                session.user
            ) {

                currentUser =
                    session.user;

                showApp();

            } else {

                showLogin();

            }

        } catch (error) {

            console.error(
                "Lỗi kiểm tra đăng nhập:",
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

    // ------------------------------------------
    // LOGIN
    // ------------------------------------------

    const loginBtn =
        document.getElementById(
            "loginBtn"
        );

    if (loginBtn) {

        loginBtn.addEventListener(
            "click",
            login
        );

    }


    // ------------------------------------------
    // ENTER EMAIL
    // ------------------------------------------

    const emailInput =
        document.getElementById(
            "email"
        );

    if (emailInput) {

        emailInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    login();

                }

            }
        );

    }


    // ------------------------------------------
    // ENTER PASSWORD
    // ------------------------------------------

    const passwordInput =
        document.getElementById(
            "password"
        );

    if (passwordInput) {

        passwordInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    login();

                }

            }
        );

    }


    // ------------------------------------------
    // MENU
    // ------------------------------------------

    const menuBtn =
        document.getElementById(
            "menuBtn"
        );

    if (menuBtn) {

        menuBtn.addEventListener(
            "click",
            openMenu
        );

    }


    const menuOverlay =
        document.getElementById(
            "menuOverlay"
        );

    if (menuOverlay) {

        menuOverlay.addEventListener(
            "click",
            closeMenu
        );

    }


    // ------------------------------------------
    // LOGOUT
    // ------------------------------------------

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logout
        );

    }


    // ------------------------------------------
    // MENU ITEMS
    // ------------------------------------------

    document
        .querySelectorAll(
            ".menu-item[data-page]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const page =
                            button.dataset.page;

                        showPage(page);

                        closeMenu();

                    }
                );

            }
        );


    // ------------------------------------------
    // GPS
    // ------------------------------------------

    const gpsBtn =
        document.getElementById(
            "gpsBtn"
        );

    if (gpsBtn) {

        gpsBtn.addEventListener(
            "click",
            getGPS
        );

    }


    // ------------------------------------------
    // CAMERA
    // ------------------------------------------

    const cameraBtn =
        document.getElementById(
            "cameraBtn"
        );

    const cameraInput =
        document.getElementById(
            "cameraInput"
        );

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


    // ------------------------------------------
    // SAVE
    // ------------------------------------------

    const saveBtn =
        document.getElementById(
            "saveBtn"
        );

    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            saveCustomer
        );

    }


    // ------------------------------------------
    // CANCEL
    // ------------------------------------------

    const cancelBtn =
        document.getElementById(
            "cancelBtn"
        );

    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            function () {

                resetForm();

                showPage(
                    "home"
                );

            }
        );

    }


    // ------------------------------------------
    // SEARCH
    // ------------------------------------------

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                renderCustomers(
                    searchInput.value
                );

            }
        );

    }

}


// ============================================================
// LOGIN
// ============================================================

async function login() {

    const emailInput =
        document.getElementById(
            "email"
        );

    const passwordInput =
        document.getElementById(
            "password"
        );

    const rememberInput =
        document.getElementById(
            "remember"
        );


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


    if (
        !email ||
        !password
    ) {

        alert(
            "❌ Vui lòng nhập Email và mật khẩu."
        );

        return;

    }


    if (!db) {

        alert(
            "❌ Supabase chưa sẵn sàng."
        );

        return;

    }


    const loginBtn =
        document.getElementById(
            "loginBtn"
        );


    if (loginBtn) {

        loginBtn.disabled =
            true;

        loginBtn.textContent =
            "Đang đăng nhập...";

    }


    try {

        const result =
            await db.auth.signInWithPassword({

                email:
                    email,

                password:
                    password

            });


        const data =
            result.data;

        const error =
            result.error;


        if (error) {

            console.error(
                error
            );

            alert(
                "❌ Đăng nhập thất bại:\n\n" +
                error.message
            );

            return;

        }


        currentUser =
            data.user;


        // --------------------------------------
        // GHI NHỚ EMAIL
        // --------------------------------------

        if (
            rememberInput &&
            rememberInput.checked
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


    } catch (error) {

        console.error(
            error
        );

        alert(
            "❌ Có lỗi xảy ra khi đăng nhập:\n\n" +
            error.message
        );

    } finally {

        if (loginBtn) {

            loginBtn.disabled =
                false;

            loginBtn.textContent =
                "Đăng nhập";

        }

    }

}


// ============================================================
// HIỆN APP
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


    const menuUser =
        document.getElementById(
            "menuUser"
        );


    if (
        menuUser &&
        currentUser
    ) {

        menuUser.textContent =
            currentUser.email ||
            "";

    }


    showPage(
        "home"
    );

    loadCustomers();

}


// ============================================================
// HIỆN LOGIN
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

    const sideMenu =
        document.getElementById(
            "sideMenu"
        );

    const overlay =
        document.getElementById(
            "menuOverlay"
        );


    if (sideMenu) {

        sideMenu.classList.add(
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

    const sideMenu =
        document.getElementById(
            "sideMenu"
        );

    const overlay =
        document.getElementById(
            "menuOverlay"
        );


    if (sideMenu) {

        sideMenu.classList.remove(
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

    const pages =
        document.querySelectorAll(
            ".page"
        );


    pages.forEach(
        function (item) {

            item.style.display =
                "none";

        }
    );


    let target =
        null;


    if (
        page ===
        "home"
    ) {

        target =
            document.getElementById(
                "home"
            );

    }

    else if (
        page ===
        "addCustomer"
    ) {

        target =
            document.getElementById(
                "addCustomer"
            );

    }

    else if (
        page ===
        "customers"
    ) {

        target =
            document.getElementById(
                "customers"
            );

        renderCustomers();

    }

    else if (
        page ===
        "mapPage"
    ) {

        target =
            document.getElementById(
                "mapPage"
            );

    }


    if (target) {

        target.style.display =
            "block";

    }


    // ------------------------------------------
    // MAP
    // ------------------------------------------

    if (
        page ===
        "mapPage"
    ) {

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

    const status =
        document.getElementById(
            "gpsStatus"
        );

    const button =
        document.getElementById(
            "gpsBtn"
        );


    if (
        !navigator.geolocation
    ) {

        alert(
            "❌ Điện thoại/trình duyệt không hỗ trợ GPS."
        );

        return;

    }


    if (status) {

        status.textContent =
            "📍 Đang lấy vị trí...";

    }


    if (button) {

        button.disabled =
            true;

    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;


            if (status) {

                status.innerHTML =
                    "✅ Đã lấy GPS<br>" +
                    latitude.toFixed(6) +
                    ", " +
                    longitude.toFixed(6);

            }


            if (button) {

                button.disabled =
                    false;

            }

        },


        function (error) {

            console.error(
                error
            );


            let message =
                "❌ Không lấy được vị trí.";


            if (
                error.code ===
                1
            ) {

                message =
                    "❌ Bạn chưa cho phép website sử dụng vị trí.";

            }

            else if (
                error.code ===
                2
            ) {

                message =
                    "❌ Không xác định được vị trí.";

            }

            else if (
                error.code ===
                3
            ) {

                message =
                    "❌ Lấy vị trí quá thời gian.";

            }


            if (status) {

                status.textContent =
                    message;

            }


            if (button) {

                button.disabled =
                    false;

            }

        },


        {
            enableHighAccuracy:
                true,

            timeout:
                15000,

            maximumAge:
                0
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


    if (status) {

        status.textContent =
            "📷 Đang xử lý ảnh...";

    }


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

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
                        width >
                            maxSize ||
                        height >
                            maxSize
                    ) {

                        if (
                            width >
                            height
                        ) {

                            height =
                                height *
                                maxSize /
                                width;

                            width =
                                maxSize;

                        } else {

                            width =
                                width *
                                maxSize /
                                height;

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


                    if (!ctx) {

                        if (status) {

                            status.textContent =
                                "❌ Không xử lý được ảnh.";

                        }

                        return;

                    }


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


                    if (preview) {

                        preview.src =
                            photoData;

                        preview.style.display =
                            "block";

                    }


                    if (status) {

                        status.textContent =
                            "✅ Đã chụp ảnh";

                    }

                };


            img.onerror =
                function () {

                    if (status) {

                        status.textContent =
                            "❌ Không đọc được ảnh.";

                    }

                };


            img.src =
                event.target.result;

        };


    reader.onerror =
        function () {

            if (status) {

                status.textContent =
                    "❌ Không thể đọc ảnh.";

            }

        };


    reader.readAsDataURL(
        file
    );

}


// ============================================================
// LƯU KHÁCH HÀNG
// ============================================================

async function saveCustomer() {

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
            "❌ Vui lòng nhập địa chỉ khách hàng."
        );

        return;

    }


    if (!db) {

        alert(
            "❌ Supabase chưa sẵn sàng."
        );

        return;

    }


    const saveBtn =
        document.getElementById(
            "saveBtn"
        );


    const isEditing =
        editingId !== null;


    if (saveBtn) {

        saveBtn.disabled =
            true;

        saveBtn.textContent =
            isEditing
                ? "Đang cập nhật..."
                : "Đang lưu...";

    }


    try {

        const customerData = {

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


        // ================================================
        // UPDATE
        // ================================================

        if (isEditing) {

            const result =
                await db
                    .from("customers")
                    .update(
                        customerData
                    )
                    .eq(
                        "id",
                        editingId
                    );


            if (result.error) {

                console.error(
                    result.error
                );

                alert(
                    "❌ Cập nhật thất bại:\n\n" +
                    result.error.message
                );

                return;

            }


            alert(
                "✅ Đã cập nhật khách hàng."
            );

        }


        // ================================================
        // INSERT
        // ================================================

        else {

            const result =
                await db
                    .from("customers")
                    .insert([
                        customerData
                    ]);


            if (result.error) {

                console.error(
                    result.error
                );


                let message =
                    result.error.message;


                if (
                    message.includes(
                        "phone"
                    )
                ) {

                    message +=
                        "\n\nBạn cần chạy SQL:\n\n" +
                        "alter table public.customers\n" +
                        "alter column phone drop not null;";

                }


                if (
                    message.includes(
                        "photo_url"
                    )
                ) {

                    message +=
                        "\n\nBạn cần chạy SQL:\n\n" +
                        "alter table public.customers\n" +
                        "add column if not exists photo_url text;";

                }


                alert(
                    "❌ Lưu khách hàng thất bại:\n\n" +
                    message
                );

                return;

            }


            alert(
                "✅ Đã lưu khách hàng."
            );

        }


        resetForm();

        await loadCustomers();

        showPage(
            "customers"
        );


    } catch (error) {

        console.error(
            error
        );

        alert(
            "❌ Có lỗi xảy ra:\n\n" +
            error.message
        );

    } finally {

        if (saveBtn) {

            saveBtn.disabled =
                false;

            saveBtn.textContent =
                editingId
                    ? "Cập nhật khách hàng"
                    : "Lưu khách hàng";

        }

    }

}


// ============================================================
// LOAD KHÁCH HÀNG
// ============================================================

async function loadCustomers() {

    if (!db) {

        return;

    }


    try {

        const result =
            await db
                .from("customers")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (result.error) {

            console.error(
                "Lỗi tải khách hàng:",
                result.error
            );


            const list =
                document.getElementById(
                    "customerList"
                );


            if (list) {

                list.innerHTML = `
                    <div class="empty-state">
                        ❌ Không tải được dữ liệu khách hàng.
                        <br><br>
                        ${escapeHTML(
                            result.error.message
                        )}
                    </div>
                `;

            }

            return;

        }


        customers =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        renderCustomers();

        updateStats();


        if (map) {

            loadMapMarkers();

        }


    } catch (error) {

        console.error(
            "Lỗi loadCustomers:",
            error
        );

    }

}


// ============================================================
// RENDER DANH SÁCH
// ============================================================

function renderCustomers(
    searchText = ""
) {

    const list =
        document.getElementById(
            "customerList"
        );


    if (!list) {

        return;

    }


    const keyword =
        String(
            searchText ||
            ""
        )
            .trim()
            .toLowerCase();


    const filtered =
        customers.filter(
            function (customer) {

                if (!keyword) {

                    return true;

                }


                const name =
                    String(
                        customer.name ||
                        ""
                    )
                        .toLowerCase();


                const address =
                    String(
                        customer.address ||
                        ""
                    )
                        .toLowerCase();


                const note =
                    String(
                        customer.note ||
                        ""
                    )
                        .toLowerCase();


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


    if (
        filtered.length ===
        0
    ) {

        list.innerHTML = `
            <div class="empty-state">
                ${
                    keyword
                        ? "🔍 Không tìm thấy khách hàng."
                        : "👥 Chưa có khách hàng."
                }
            </div>
        `;

        return;

    }


    list.innerHTML =
        filtered
            .map(
                createCustomerCard
            )
            .join("");

}


// ============================================================
// CARD KHÁCH HÀNG
// ============================================================

function createCustomerCard(
    customer
) {

    const id =
        customer.id;


    const isOpen =
        openedCustomerId !==
            null &&
        String(
            openedCustomerId
        ) ===
            String(id);


    const name =
        escapeHTML(
            customer.name ||
            "Không có tên"
        );


    const address =
        escapeHTML(
            customer.address ||
            "Chưa có địa chỉ"
        );


    let html = `

        <div
            class="customer-card compact-card ${
                isOpen
                    ? "expanded"
                    : ""
            }"
        >

            <div
                class="customer-summary"
                onclick="toggleCustomerDetail('${escapeAttr(id)}')"
            >

                <div class="customer-summary-text">

                    <div class="customer-name">
                        👤 ${name}
                    </div>

                    <div class="customer-address">
                        📍 ${address}
                    </div>

                </div>


                <div class="customer-arrow">
                    ${
                        isOpen
                            ? "▲"
                            : "▼"
                    }
                </div>

            </div>
    `;


    // ========================================================
    // DETAIL
    // ========================================================

    if (isOpen) {

        const note =
            escapeHTML(
                customer.note ||
                "Không có ghi chú"
            );


        const hasGPS =
            customer.latitude !==
                null &&
            customer.latitude !==
                undefined &&
            customer.longitude !==
                null &&
            customer.longitude !==
                undefined;


        html += `

            <div class="customer-detail">

                <div class="detail-row">

                    <strong>
                        👤 Họ tên:
                    </strong>

                    <span>
                        ${name}
                    </span>

                </div>


                <div class="detail-row">

                    <strong>
                        📍 Địa chỉ:
                    </strong>

                    <span>
                        ${address}
                    </span>

                </div>


                <div class="detail-row">

                    <strong>
                        📝 Ghi chú:
                    </strong>

                    <span>
                        ${note}
                    </span>

                </div>
        `;


        // ====================================================
        // GPS
        // ====================================================

        if (hasGPS) {

            html += `

                <div class="detail-row">

                    <strong>
                        🌐 GPS:
                    </strong>

                    <span>
                        ${Number(
                            customer.latitude
                        ).toFixed(6)},
                        ${Number(
                            customer.longitude
                        ).toFixed(6)}
                    </span>

                </div>

            `;

        } else {

            html += `

                <div class="detail-row">

                    <strong>
                        🌐 GPS:
                    </strong>

                    <span>
                        Chưa có vị trí
                    </span>

                </div>

            `;

        }


        // ====================================================
        // PHOTO
        // ====================================================

        if (
            customer.photo_url
        ) {

            html += `

                <div class="customer-photo-box">

                    <img
                        src="${escapeAttr(
                            customer.photo_url
                        )}"
                        class="customer-photo"
                        alt="Ảnh nhà khách hàng"
                        onclick="showPhoto('${escapeAttr(id)}')"
                    >

                    <div class="photo-hint">
                        👆 Chạm vào ảnh để xem lớn
                    </div>

                </div>

            `;

        }


        // ====================================================
        // BUTTONS
        // ====================================================

        html += `

                <div class="customer-actions">

                    ${
                        hasGPS
                            ? `
                                <button
                                    type="button"
                                    class="action-btn map-btn"
                                    onclick="event.stopPropagation(); openCustomerMap('${escapeAttr(id)}')"
                                >
                                    🗺️ Bản đồ
                                </button>
                            `
                            : ""
                    }


                    ${
                        hasGPS
                            ? `
                                <button
                                    type="button"
                                    class="action-btn nav-btn"
                                    onclick="event.stopPropagation(); navigateToCustomer('${escapeAttr(id)}')"
                                >
                                    🧭 Chỉ đường
                                </button>
                            `
                            : ""
                    }


                    <button
                        type="button"
                        class="action-btn edit-btn"
                        onclick="event.stopPropagation(); editCustomer('${escapeAttr(id)}')"
                    >
                        ✏️ Sửa
                    </button>


                    <button
                        type="button"
                        class="action-btn delete-btn"
                        onclick="event.stopPropagation(); deleteCustomer('${escapeAttr(id)}')"
                    >
                        🗑️ Xóa
                    </button>

                </div>

            </div>

        `;

    }


    html += `

        </div>

    `;


    return html;

}


// ============================================================
// MỞ / ĐÓNG CHI TIẾT
// ============================================================

function toggleCustomerDetail(
    id
) {

    if (
        openedCustomerId !==
            null &&
        String(
            openedCustomerId
        ) ===
            String(id)
    ) {

        openedCustomerId =
            null;

    } else {

        openedCustomerId =
            id;

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
                    String(
                        item.id
                    ) ===
                    String(id)
                );

            }
        );


    if (
        !customer ||
        !customer.photo_url
    ) {

        alert(
            "❌ Khách hàng chưa có ảnh."
        );

        return;

    }


    // --------------------------------------------------------
    // TẠO MODAL
    // --------------------------------------------------------

    const oldModal =
        document.getElementById(
            "photoModal"
        );


    if (oldModal) {

        oldModal.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "photoModal";


    modal.innerHTML = `

        <div
            style="
                position:fixed;
                inset:0;
                background:rgba(0,0,0,.92);
                z-index:99999;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:15px;
            "
            onclick="this.parentElement.remove()"
        >

            <img
                src="${escapeAttr(
                    customer.photo_url
                )}"
                alt="Ảnh nhà khách hàng"
                style="
                    max-width:100%;
                    max-height:92vh;
                    object-fit:contain;
                    border-radius:10px;
                "
                onclick="event.stopPropagation()"
            >

            <button
                type="button"
                onclick="this.parentElement.parentElement.remove()"
                style="
                    position:absolute;
                    top:15px;
                    right:15px;
                    width:42px;
                    height:42px;
                    border:0;
                    border-radius:50%;
                    background:white;
                    color:#111827;
                    font-size:22px;
                    font-weight:bold;
                "
            >
                ×
            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );

}


// ============================================================
// SỬA KHÁCH HÀNG
// ============================================================

function editCustomer(id) {

    const customer =
        customers.find(
            function (item) {

                return (
                    String(
                        item.id
                    ) ===
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
            customer.name ||
            "";

    }


    if (addressInput) {

        addressInput.value =
            customer.address ||
            "";

    }


    if (noteInput) {

        noteInput.value =
            customer.note ||
            "";

    }


    latitude =
        customer.latitude !==
            null &&
        customer.latitude !==
            undefined
            ? Number(
                customer.latitude
            )
            : null;


    longitude =
        customer.longitude !==
            null &&
        customer.longitude !==
            undefined
            ? Number(
                customer.longitude
            )
            : null;


    photoData =
        customer.photo_url ||
        null;


    // ------------------------------------------
    // GPS
    // ------------------------------------------

    const gpsStatus =
        document.getElementById(
            "gpsStatus"
        );


    if (gpsStatus) {

        if (
            latitude !== null &&
            longitude !== null
        ) {

            gpsStatus.innerHTML =
                "✅ Đã có GPS<br>" +
                latitude.toFixed(6) +
                ", " +
                longitude.toFixed(6);

        } else {

            gpsStatus.textContent =
                "Chưa lấy vị trí";

        }

    }


    // ------------------------------------------
    // PHOTO
    // ------------------------------------------

    const preview =
        document.getElementById(
            "photoPreview"
        );

    const photoStatus =
        document.getElementById(
            "photoStatus"
        );


    if (preview) {

        if (photoData) {

            preview.src =
                photoData;

            preview.style.display =
                "block";

        } else {

            preview.src =
                "";

            preview.style.display =
                "none";

        }

    }


    if (photoStatus) {

        photoStatus.textContent =
            photoData
                ? "✅ Đã có ảnh"
                : "Chưa chụp ảnh";

    }


    const saveBtn =
        document.getElementById(
            "saveBtn"
        );


    if (saveBtn) {

        saveBtn.textContent =
            "Cập nhật khách hàng";

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
                    String(
                        item.id
                    ) ===
                    String(id)
                );

            }
        );


    if (!customer) {

        return;

    }


    const confirmed =
        confirm(
            "Bạn có chắc muốn xóa khách hàng:\n\n" +
            (
                customer.name ||
                ""
            )
        );


    if (!confirmed) {

        return;

    }


    if (!db) {

        alert(
            "❌ Supabase chưa sẵn sàng."
        );

        return;

    }


    try {

        const result =
            await db
                .from("customers")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (result.error) {

            console.error(
                result.error
            );

            alert(
                "❌ Xóa thất bại:\n\n" +
                result.error.message
            );

            return;

        }


        if (
            openedCustomerId !==
                null &&
            String(
                openedCustomerId
            ) ===
                String(id)
        ) {

            openedCustomerId =
                null;

        }


        alert(
            "✅ Đã xóa khách hàng."
        );


        await loadCustomers();


    } catch (error) {

        console.error(
            error
        );

        alert(
            "❌ Có lỗi khi xóa khách hàng:\n\n" +
            error.message
        );

    }

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
                    String(
                        item.id
                    ) ===
                    String(id)
                );

            }
        );


    if (!customer) {

        return;

    }


    if (
        customer.latitude ===
            null ||
        customer.latitude ===
            undefined ||
        customer.longitude ===
            null ||
        customer.longitude ===
            undefined
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

            initMap();


            if (map) {

                map.setView(
                    [
                        Number(
                            customer.latitude
                        ),

                        Number(
                            customer.longitude
                        )
                    ],

                    17
                );

            }

        },
        250
    );

}


// ============================================================
// CHỈ ĐƯỜNG
// ============================================================

function navigateToCustomer(
    id
) {

    const customer =
        customers.find(
            function (item) {

                return (
                    String(
                        item.id
                    ) ===
                    String(id)
                );

            }
        );


    if (!customer) {

        return;

    }


    if (
        customer.latitude ===
            null ||
        customer.latitude ===
            undefined ||
        customer.longitude ===
            null ||
        customer.longitude ===
            undefined
    ) {

        alert(
            "❌ Khách hàng chưa có GPS."
        );

        return;

    }


    const lat =
        Number(
            customer.latitude
        );


    const lng =
        Number(
            customer.longitude
        );


    const url =
        "https://www.google.com/maps/dir/?api=1" +
        "&destination=" +
        encodeURIComponent(
            lat + "," + lng
        );


    window.open(
        url,
        "_blank"
    );

}


// ============================================================
// KHỞI TẠO MAP
// ============================================================

function initMap() {

    const mapElement =
        document.getElementById(
            "map"
        );


    if (!mapElement) {

        return;

    }


    // ------------------------------------------
    // MAP ĐÃ TỒN TẠI
    // ------------------------------------------

    if (map) {

        setTimeout(
            function () {

                map.invalidateSize();

            },
            100
        );

        return;

    }


    // ------------------------------------------
    // KIỂM TRA LEAFLET
    // ------------------------------------------

    if (
        typeof L ===
        "undefined"
    ) {

        console.error(
            "Leaflet chưa được tải."
        );


        mapElement.innerHTML = `

            <div
                style="
                    padding:20px;
                    text-align:center;
                "
            >
                ❌ Không tải được bản đồ.
            </div>

        `;


        return;

    }


    // ------------------------------------------
    // TẠO MAP
    // ------------------------------------------

    map =
        L.map(
            "map"
        ).setView(
            [
                10.4600,
                105.6300
            ],
            13
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom:
                19,

            attribution:
                "&copy; OpenStreetMap"

        }
    ).addTo(
        map
    );


    loadMapMarkers();


    setTimeout(
        function () {

            if (map) {

                map.invalidateSize();

            }

        },
        200
    );

}


// ============================================================
// MARKER
// ============================================================

function loadMapMarkers() {

    if (!map) {

        return;

    }


    // ------------------------------------------
    // XÓA MARKER CŨ
    // ------------------------------------------

    mapMarkers.forEach(
        function (marker) {

            map.removeLayer(
                marker
            );

        }
    );


    mapMarkers = [];


    // ------------------------------------------
    // TẠO MARKER
    // ------------------------------------------

    customers.forEach(
        function (customer) {

            if (
                customer.latitude ===
                    null ||
                customer.latitude ===
                    undefined ||
                customer.longitude ===
                    null ||
                customer.longitude ===
                    undefined
            ) {

                return;

            }


            const lat =
                Number(
                    customer.latitude
                );


            const lng =
                Number(
                    customer.longitude
                );


            if (
                Number.isNaN(
                    lat
                ) ||
                Number.isNaN(
                    lng
                )
            ) {

                return;

            }


            const marker =
                L.marker(
                    [
                        lat,
                        lng
                    ]
                ).addTo(
                    map
                );


            const name =
                escapeHTML(
                    customer.name ||
                    "Khách hàng"
                );


            const address =
                escapeHTML(
                    customer.address ||
                    ""
                );


            marker.bindPopup(`

                <div
                    style="
                        min-width:180px;
                    "
                >

                    <strong>
                        👤 ${name}
                    </strong>

                    <br>

                    <span>
                        📍 ${address}
                    </span>

                    <br><br>

                    <button
                        type="button"
                        onclick="openCustomerMap('${escapeAttr(customer.id)}')"
                        style="
                            padding:6px 10px;
                            border:0;
                            border-radius:6px;
                            cursor:pointer;
                        "
                    >
                        Xem vị trí
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
                    customer.latitude !==
                        null &&
                    customer.latitude !==
                        undefined &&
                    customer.longitude !==
                        null &&
                    customer.longitude !==
                        undefined
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

    editingId =
        null;

    latitude =
        null;

    longitude =
        null;

    photoData =
        null;


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
            "";

    }


    if (addressInput) {

        addressInput.value =
            "";

    }


    if (noteInput) {

        noteInput.value =
            "";

    }


    const gpsStatus =
        document.getElementById(
            "gpsStatus"
        );


    if (gpsStatus) {

        gpsStatus.textContent =
            "Chưa lấy vị trí";

    }


    const photoStatus =
        document.getElementById(
            "photoStatus"
        );


    if (photoStatus) {

        photoStatus.textContent =
            "Chưa chụp ảnh";

    }


    const preview =
        document.getElementById(
            "photoPreview"
        );


    if (preview) {

        preview.src =
            "";

        preview.style.display =
            "none";

    }


    const cameraInput =
        document.getElementById(
            "cameraInput"
        );


    if (cameraInput) {

        cameraInput.value =
            "";

    }


    const saveBtn =
        document.getElementById(
            "saveBtn"
        );


    if (saveBtn) {

        saveBtn.textContent =
            "Lưu khách hàng";

    }

}


// ============================================================
// ĐĂNG XUẤT
// ============================================================

async function logout() {

    const confirmed =
        confirm(
            "Bạn có chắc muốn đăng xuất?"
        );


    if (!confirmed) {

        return;

    }


    try {

        if (db) {

            await db.auth.signOut();

        }

    } catch (error) {

        console.error(
            error
        );

    }


    currentUser =
        null;

    customers =
        [];

    openedCustomerId =
        null;


    if (map) {

        map.remove();

        map =
            null;

        mapMarkers =
            [];

    }


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


function escapeAttr(
    value
) {

    return escapeHTML(
        value
    );

}


// ============================================================
// CHO HTML GỌI ĐƯỢC HÀM
// ============================================================

window.showPage =
    showPage;

window.toggleCustomerDetail =
    toggleCustomerDetail;

window.showPhoto =
    showPhoto;

window.editCustomer =
    editCustomer;

window.deleteCustomer =
    deleteCustomer;

window.openCustomerMap =
    openCustomerMap;

window.navigateToCustomer =
    navigateToCustomer;

window.getGPS =
    getGPS;

window.logout =
    logout;


// ============================================================
// HOÀN TẤT
// ============================================================

console.log(
    "✅ Khách Hàng Bản Đồ - APP.JS đã sẵn sàng"
);
