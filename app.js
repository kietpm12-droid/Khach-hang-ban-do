const SUPABASE_URL = "https://yxzjddriuglqwtzxmgbi.supabase.co";
const SUPABASE_KEY = "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


let currentUser = null;
let customers = [];

let editingId = null;

let latitude = null;
let longitude = null;

let photoData = null;

let map = null;
let mapMarkers = [];



/* ==================================================
   KHỞI ĐỘNG
================================================== */

document.addEventListener("DOMContentLoaded", async function () {

    setupEvents();

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


    const {
        data,
        error
    } = await db.auth.getSession();


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



/* ==================================================
   SỰ KIỆN
================================================== */

function setupEvents() {

    const loginBtn =
        document.getElementById("loginBtn");

    const password =
        document.getElementById("password");

    const menuBtn =
        document.getElementById("menuBtn");

    const menuOverlay =
        document.getElementById("menuOverlay");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const gpsBtn =
        document.getElementById("gpsBtn");

    const cameraBtn =
        document.getElementById("cameraBtn");

    const cameraInput =
        document.getElementById("cameraInput");

    const saveBtn =
        document.getElementById("saveBtn");

    const cancelBtn =
        document.getElementById("cancelBtn");

    const searchInput =
        document.getElementById("searchInput");


    if (loginBtn) {

        loginBtn.addEventListener(
            "click",
            login
        );

    }


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


    if (menuBtn) {

        menuBtn.addEventListener(
            "click",
            openMenu
        );

    }


    if (menuOverlay) {

        menuOverlay.addEventListener(
            "click",
            closeMenu
        );

    }


    document
        .querySelectorAll(".menu-item[data-page]")
        .forEach(function (item) {

            item.addEventListener(
                "click",
                function () {

                    const page =
                        this.getAttribute("data-page");

                    showPage(page);

                    closeMenu();

                }
            );

        });


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logout
        );

    }


    if (gpsBtn) {

        gpsBtn.addEventListener(
            "click",
            getGPS
        );

    }


    if (cameraBtn) {

        cameraBtn.addEventListener(
            "click",
            function () {

                if (cameraInput) {

                    cameraInput.click();

                }

            }
        );

    }


    if (cameraInput) {

        cameraInput.addEventListener(
            "change",
            handlePhoto
        );

    }


    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            saveCustomer
        );

    }


    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            function () {

                resetForm();

                showPage("home");

            }
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderCustomers
        );

    }

}



/* ==================================================
   ĐĂNG NHẬP
================================================== */

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


    const loginBtn =
        document.getElementById("loginBtn");


    if (loginBtn) {

        loginBtn.disabled = true;
        loginBtn.textContent = "Đang đăng nhập...";

    }


    const {
        data,
        error
    } = await db.auth.signInWithPassword({

        email: email,
        password: password

    });


    if (loginBtn) {

        loginBtn.disabled = false;
        loginBtn.textContent = "Đăng nhập";

    }


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



/* ==================================================
   HIỂN THỊ APP
================================================== */

function showApp() {

    const loginPage =
        document.getElementById("loginPage");

    const appPage =
        document.getElementById("appPage");


    if (loginPage) {
        loginPage.style.display = "none";
    }


    if (appPage) {
        appPage.style.display = "block";
    }


    const menuUser =
        document.getElementById("menuUser");


    if (menuUser && currentUser) {

        menuUser.textContent =
            currentUser.email || "";

    }


    showPage("home");

    loadCustomers();

}



/* ==================================================
   HIỂN THỊ LOGIN
================================================== */

function showLogin() {

    const loginPage =
        document.getElementById("loginPage");

    const appPage =
        document.getElementById("appPage");


    if (loginPage) {
        loginPage.style.display = "flex";
    }


    if (appPage) {
        appPage.style.display = "none";
    }

}



/* ==================================================
   MENU
================================================== */

function openMenu() {

    const sideMenu =
        document.getElementById("sideMenu");

    const overlay =
        document.getElementById("menuOverlay");


    if (sideMenu) {
        sideMenu.classList.add("active");
    }


    if (overlay) {
        overlay.classList.add("active");
    }

}


function closeMenu() {

    const sideMenu =
        document.getElementById("sideMenu");

    const overlay =
        document.getElementById("menuOverlay");


    if (sideMenu) {
        sideMenu.classList.remove("active");
    }


    if (overlay) {
        overlay.classList.remove("active");
    }

}



/* ==================================================
   CHUYỂN TRANG
================================================== */

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(function (page) {

            page.style.display = "none";

        });


    const page =
        document.getElementById(pageId);


    if (!page) {
        return;
    }


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



/* ==================================================
   GPS
================================================== */

function getGPS() {

    const status =
        document.getElementById("gpsStatus");


    if (!navigator.geolocation) {

        alert(
            "Điện thoại không hỗ trợ định vị GPS."
        );

        return;
    }


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
                    "✅ Đã lấy GPS: " +
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
                "Không lấy được GPS. Hãy cho phép trình duyệt sử dụng vị trí."
            );

        },


        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

}



/* ==================================================
   CAMERA
================================================== */

function handlePhoto(event) {

    const file =
        event.target.files &&
        event.target.files[0];


    if (!file) {
        return;
    }


    if (!file.type.startsWith("image/")) {

        alert("Vui lòng chọn ảnh.");

        return;
    }


    const status =
        document.getElementById("photoStatus");

    const preview =
        document.getElementById("photoPreview");


    if (status) {

        status.textContent =
            "📷 Đang xử lý ảnh...";

    }


    const reader =
        new FileReader();


    reader.onload = function (e) {

        const img =
            new Image();


        img.onload = function () {

            const maxSize = 1200;

            let width = img.width;
            let height = img.height;


            if (width > maxSize ||
                height > maxSize) {

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
                document.createElement("canvas");


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


            if (preview) {

                preview.src = photoData;
                preview.style.display = "block";

            }


            const sizeKB =
                Math.round(
                    photoData.length * 0.75 / 1024
                );


            if (status) {

                status.textContent =
                    "✅ Đã chụp ảnh (" +
                    sizeKB +
                    " KB)";

            }

        };


        img.onerror = function () {

            if (status) {

                status.textContent =
                    "❌ Không đọc được ảnh.";

            }

        };


        img.src = e.target.result;

    };


    reader.readAsDataURL(file);

}



/* ==================================================
   LƯU KHÁCH HÀNG
================================================== */

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

        alert("Vui lòng nhập họ tên khách hàng.");

        return;
    }


    if (!address) {

        alert("Vui lòng nhập địa chỉ khách hàng.");

        return;
    }


    const saveBtn =
        document.getElementById("saveBtn");


    if (saveBtn) {

        saveBtn.disabled = true;
        saveBtn.textContent = "Đang lưu...";

    }


    /*
      KHÔNG CÓ user_id
      => Tất cả tài khoản đăng nhập
      => dùng chung dữ liệu
    */

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
                .insert([customerData]);

    }


    if (saveBtn) {

        saveBtn.disabled = false;
        saveBtn.textContent =
            editingId
                ? "Lưu khách hàng"
                : "Lưu khách hàng";

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

}



/* ==================================================
   LOAD DATA
================================================== */

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



/* ==================================================
   HIỂN THỊ DANH SÁCH
================================================== */

function renderCustomers() {

    const list =
        document.getElementById("customerList");


    if (!list) {
        return;
    }


    const searchInput =
        document.getElementById("searchInput");


    const keyword =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    let data =
        customers.filter(function (customer) {

            if (!keyword) {
                return true;
            }


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


    if (data.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                Không tìm thấy khách hàng.
            </div>
        `;

        return;
    }


    list.innerHTML =
        data.map(function (customer) {

            return createCustomerCard(customer);

        }).join("");

}



/* ==================================================
   CUSTOMER CARD
================================================== */

function createCustomerCard(customer) {

    const hasGPS =
        customer.latitude !== null &&
        customer.longitude !== null &&
        customer.latitude !== undefined &&
        customer.longitude !== undefined;


    let photoHTML = "";


    if (customer.photo_url) {

        photoHTML = `

            <img
                src="${escapeHTML(customer.photo_url)}"
                class="customer-photo"
                alt="Ảnh nhà khách hàng"
            >

        `;

    }


    return `

        <div class="customer-card">

            <div class="customer-name">
                ${escapeHTML(customer.name || "")}
            </div>


            <div class="customer-info">
                📍 ${escapeHTML(customer.address || "Chưa có địa chỉ")}
            </div>


            ${
                customer.note
                ?
                `
                <div class="customer-info">
                    📝 ${escapeHTML(customer.note)}
                </div>
                `
                :
                ""
            }


            ${
                hasGPS
                ?
                `
                <div class="customer-info">
                    🌐 ${Number(customer.latitude).toFixed(6)},
                    ${Number(customer.longitude).toFixed(6)}
                </div>
                `
                :
                `
                <div class="customer-info">
                    📍 Chưa có GPS
                </div>
                `
            }


            ${photoHTML}


            <div class="customer-actions">

                <button
                    class="edit-btn"
                    onclick="editCustomer('${customer.id}')"
                    type="button"
                >
                    ✏️ Sửa
                </button>


                <button
                    class="delete-btn"
                    onclick="deleteCustomer('${customer.id}')"
                    type="button"
                >
                    🗑️ Xóa
                </button>


                ${
                    hasGPS
                    ?
                    `
                    <button
                        class="map-btn"
                        onclick="
                            openCustomerMap(
                                ${customer.latitude},
                                ${customer.longitude}
                            )
                        "
                        type="button"
                    >
                        🗺️ Xem bản đồ
                    </button>
                    `
                    :
                    ""
                }


                ${
                    customer.photo_url
                    ?
                    `
                    <button
                        class="photo-btn"
                        onclick="showPhoto('${customer.id}')"
                        type="button"
                    >
                        📷 Xem ảnh
                    </button>
                    `
                    :
                    ""
                }

            </div>

        </div>

    `;

}



/* ==================================================
   SỬA KHÁCH HÀNG
================================================== */

function editCustomer(id) {

    const customer =
        customers.find(function (item) {

            return String(item.id) === String(id);

        });


    if (!customer) {

        alert("Không tìm thấy khách hàng.");

        return;
    }


    editingId = customer.id;


    document.getElementById("name").value =
        customer.name || "";


    document.getElementById("address").value =
        customer.address || "";


    document.getElementById("note").value =
        customer.note || "";


    latitude =
        customer.latitude !== null
            ? customer.latitude
            : null;


    longitude =
        customer.longitude !== null
            ? customer.longitude
            : null;


    photoData =
        customer.photo_url || null;


    const preview =
        document.getElementById("photoPreview");


    const photoStatus =
        document.getElementById("photoStatus");


    const gpsStatus =
        document.getElementById("gpsStatus");


    if (photoData && preview) {

        preview.src = photoData;
        preview.style.display = "block";

        if (photoStatus) {

            photoStatus.textContent =
                "✅ Đã có ảnh";

        }

    } else {

        if (preview) {

            preview.style.display = "none";

        }

        if (photoStatus) {

            photoStatus.textContent =
                "Chưa chụp ảnh";

        }

    }


    if (
        latitude !== null &&
        longitude !== null
    ) {

        if (gpsStatus) {

            gpsStatus.textContent =
                "✅ Đã có GPS: " +
                Number(latitude).toFixed(6) +
                ", " +
                Number(longitude).toFixed(6);

        }

    } else {

        if (gpsStatus) {

            gpsStatus.textContent =
                "Chưa lấy vị trí";

        }

    }


    showPage("addCustomer");

}



/* ==================================================
   XÓA
================================================== */

async function deleteCustomer(id) {

    const customer =
        customers.find(function (item) {

            return String(item.id) === String(id);

        });


    const name =
        customer
            ? customer.name
            : "khách hàng này";


    const confirmed =
        confirm(
            "Bạn có chắc muốn xóa " +
            name +
            "?"
        );


    if (!confirmed) {
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


    alert("✅ Đã xóa khách hàng.");


    await loadCustomers();

}



/* ==================================================
   XEM ẢNH
================================================== */

function showPhoto(id) {

    const customer =
        customers.find(function (item) {

            return String(item.id) === String(id);

        });


    if (!customer || !customer.photo_url) {

        alert("Khách hàng chưa có ảnh.");

        return;
    }


    const win =
        window.open("", "_blank");


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
                src="${escapeHTML(customer.photo_url)}"
            >

        </body>

        </html>

    `);

}



/* ==================================================
   MAP
================================================== */

function initMap() {

    const mapElement =
        document.getElementById("map");


    if (!mapElement) {
        return;
    }


    if (!map) {

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

    }


    setTimeout(function () {

        map.invalidateSize();

    }, 200);


    loadMapMarkers();

}



function loadMapMarkers() {

    if (!map) {
        return;
    }


    mapMarkers.forEach(function (marker) {

        map.removeLayer(marker);

    });


    mapMarkers = [];


    const gpsCustomers =
        customers.filter(function (customer) {

            return (
                customer.latitude !== null &&
                customer.longitude !== null &&
                customer.latitude !== undefined &&
                customer.longitude !== undefined
            );

        });


    gpsCustomers.forEach(function (customer) {

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



function openCustomerMap(lat, lng) {

    showPage("mapPage");


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



/* ==================================================
   THỐNG KÊ
================================================== */

function updateStats() {

    const total =
        customers.length;


    const gps =
        customers.filter(function (customer) {

            return (
                customer.latitude !== null &&
                customer.longitude !== null &&
                customer.latitude !== undefined &&
                customer.longitude !== undefined
            );

        }).length;


    const photos =
        customers.filter(function (customer) {

            return !!customer.photo_url;

        }).length;


    const totalElement =
        document.getElementById("totalCustomers");


    const gpsElement =
        document.getElementById("gpsCustomers");


    const photoElement =
        document.getElementById("photoCustomers");


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (gpsElement) {

        gpsElement.textContent =
            gps;

    }


    if (photoElement) {

        photoElement.textContent =
            photos;

    }

}



/* ==================================================
   RESET FORM
================================================== */

function resetForm() {

    editingId = null;

    latitude = null;
    longitude = null;

    photoData = null;


    const name =
        document.getElementById("name");

    const address =
        document.getElementById("address");

    const note =
        document.getElementById("note");

    const preview =
        document.getElementById("photoPreview");

    const photoStatus =
        document.getElementById("photoStatus");

    const gpsStatus =
        document.getElementById("gpsStatus");

    const cameraInput =
        document.getElementById("cameraInput");


    if (name) {
        name.value = "";
    }


    if (address) {
        address.value = "";
    }


    if (note) {
        note.value = "";
    }


    if (preview) {

        preview.src = "";
        preview.style.display = "none";

    }


    if (photoStatus) {

        photoStatus.textContent =
            "Chưa chụp ảnh";

    }


    if (gpsStatus) {

        gpsStatus.textContent =
            "Chưa lấy vị trí";

    }


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



/* ==================================================
   ĐĂNG XUẤT
================================================== */

async function logout() {

    const confirmed =
        confirm(
            "Bạn có chắc muốn đăng xuất?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await db.auth.signOut();


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



/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
