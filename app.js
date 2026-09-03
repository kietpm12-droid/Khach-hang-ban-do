const SUPABASE_URL = "https://yxzjddriuglqwtzxmgbi.supabase.co";
const SUPABASE_KEY = "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;
let editingId = null;
let latitude = null;
let longitude = null;
let photoData = null;
let customers = [];
let map = null;
document.addEventListener("DOMContentLoaded", init);
async function init() {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
        document.getElementById("email").value = savedEmail;
        document.getElementById("rememberLogin").checked = true;
    }
    document.getElementById("loginBtn").addEventListener("click", login);
    document.getElementById("cameraBtn").addEventListener("click", () => {
        document.getElementById("cameraInput").click();
    });
    document.getElementById("cameraInput").addEventListener("change", handlePhoto);
    document.getElementById("saveBtn").addEventListener("click", saveCustomer);
    document.getElementById("gpsBtn").addEventListener("click", getGPS);
    document.getElementById("search").addEventListener("input", loadCustomers);
    const { data } = await db.auth.getSession();
    if (data.session) {
        currentUser = data.session.user;
        showApp();
    } else {
        showLogin();
    }
}
/* =========================
   ĐĂNG NHẬP
========================= */
async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const msg = document.getElementById("loginMsg");
    if (!email || !password) {
        msg.textContent = "❌ Vui lòng nhập email và mật khẩu.";
        return;
    }
    msg.textContent = "⏳ Đang đăng nhập...";
    const { data, error } = await db.auth.signInWithPassword({
        email,
        password
    });
    if (error) {
        msg.textContent = "❌ " + error.message;
        return;
    }
    currentUser = data.user;
    if (document.getElementById("rememberLogin").checked) {
        localStorage.setItem("savedEmail", email);
    } else {
        localStorage.removeItem("savedEmail");
    }
    msg.textContent = "";
    showApp();
}
function showLogin() {
    document.getElementById("loginView").classList.remove("hidden");
    document.getElementById("appView").classList.add("hidden");
}
function showApp() {
    document.getElementById("loginView").classList.add("hidden");
    document.getElementById("appView").classList.remove("hidden");
    loadCustomers();
}
/* =========================
   GPS
========================= */
function getGPS() {
    const status = document.getElementById("gpsStatus");
    if (!navigator.geolocation) {
        status.textContent = "❌ Thiết bị không hỗ trợ GPS.";
        return;
    }
    status.textContent = "⏳ Đang lấy vị trí...";
    navigator.geolocation.getCurrentPosition(
        position => {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            status.textContent =
                `✅ Đã lấy vị trí: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        },
        error => {
            status.textContent = "❌ Không lấy được vị trí.";
            console.log(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}
/* =========================
   CHỤP ẢNH + NÉN ẢNH
========================= */
function handlePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const status = document.getElementById("photoStatus");
    const preview = document.getElementById("photoPreview");
    status.textContent = "⏳ Đang nén ảnh...";
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Kích thước tối đa của ảnh
            const MAX_SIZE = 1200;
            let width = img.width;
            let height = img.height;
            // Thu nhỏ ảnh nếu quá lớn
            if (width > MAX_SIZE || height > MAX_SIZE) {
                if (width > height) {
                    height = Math.round(height * MAX_SIZE / width);
                    width = MAX_SIZE;
                } else {
                    width = Math.round(width * MAX_SIZE / height);
                    height = MAX_SIZE;
                }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            // Nén JPEG chất lượng 70%
            canvas.toBlob(
                function(blob) {
                    if (!blob) {
                        status.textContent = "❌ Không nén được ảnh.";
                        return;
                    }
                    const compressedReader = new FileReader();
                    compressedReader.onloadend = function() {
                        photoData = compressedReader.result;
                        preview.src = photoData;
                        preview.classList.remove("hidden");
                        const sizeKB = Math.round(blob.size / 1024);
                        status.textContent =
                            `✅ Đã chụp và nén ảnh (${sizeKB} KB)`;
                    };
                    compressedReader.readAsDataURL(blob);
                },
                "image/jpeg",
                0.70
            );
        };
        img.onerror = function() {
            status.textContent = "❌ Không đọc được ảnh.";
        };
        img.src = e.target.result;
    };
    reader.onerror = function() {
        status.textContent = "❌ Không đọc được ảnh.";
    };
    reader.readAsDataURL(file);
}
/* =========================
   LƯU KHÁCH HÀNG
========================= */
async function saveCustomer() {
    const name = document.getElementById("name").value.trim();
    const address = document.getElementById("address").value.trim();
    const note = document.getElementById("note").value.trim();
    const status = document.getElementById("saveStatus");
    if (!name) {
        status.textContent = "❌ Vui lòng nhập họ tên.";
        return;
    }
    if (!address) {
        status.textContent = "❌ Vui lòng nhập địa chỉ.";
        return;
    }
    if (!currentUser) {
        status.textContent = "❌ Chưa đăng nhập.";
        return;
    }
    status.textContent = "⏳ Đang lưu...";
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
    if (editingId) {
        result = await db
            .from("customers")
            .update(customerData)
            .eq("id", editingId)
            .eq("user_id", currentUser.id);
    } else {
        result = await db
            .from("customers")
            .insert([customerData]);
    }
    if (result.error) {
        console.error(result.error);
        status.textContent = "❌ Lưu thất bại: " + result.error.message;
        return;
    }
    status.textContent = "✅ Đã lưu khách hàng.";
    resetForm();
    await loadCustomers();
}
/* =========================
   RESET FORM
========================= */
function resetForm() {
    editingId = null;
    latitude = null;
    longitude = null;
    photoData = null;
    document.getElementById("name").value = "";
    document.getElementById("address").value = "";
    document.getElementById("note").value = "";
    document.getElementById("photoPreview").src = "";
    document.getElementById("photoPreview").classList.add("hidden");
    document.getElementById("cameraInput").value = "";
    document.getElementById("gpsStatus").textContent = "";
    document.getElementById("photoStatus").textContent = "";
}
/* =========================
   TẢI DANH SÁCH
========================= */
async function loadCustomers() {
    if (!currentUser) return;
    const searchValue =
        document.getElementById("search").value.trim().toLowerCase();
    const { data, error } = await db
        .from("customers")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });
    if (error) {
        console.error(error);
        return;
    }
    customers = data || [];
    if (searchValue) {
        customers = customers.filter(customer =>
            (customer.name || "").toLowerCase().includes(searchValue) ||
            (customer.address || "").toLowerCase().includes(searchValue)
        );
    }
    renderCustomers();
}
/* =========================
   HIỂN THỊ KHÁCH HÀNG
========================= */
function renderCustomers() {
    const list = document.getElementById("customerList");
    list.innerHTML = "";
    if (customers.length === 0) {
        list.innerHTML = "<p>Chưa có khách hàng.</p>";
        return;
    }
    customers.forEach(customer => {
        const card = document.createElement("div");
        card.className = "customer-card";
        card.innerHTML = `
            <h3>${escapeHTML(customer.name || "")}</h3>
            <p>
                📍 ${escapeHTML(customer.address || "")}
            </p>
            ${
                customer.note
                ? `<p>📝 ${escapeHTML(customer.note)}</p>`
                : ""
            }
            ${
                customer.photo_url
                ? `
                    <img
                        src="${customer.photo_url}"
                        style="width:100%;max-height:250px;object-fit:cover;border-radius:10px;"
                        onclick="showPhoto('${customer.id}')"
                    >
                `
                : ""
            }
            <div style="margin-top:10px;">
                <button onclick="editCustomer('${customer.id}')">
                    ✏️ Sửa
                </button>
                <button onclick="deleteCustomer('${customer.id}')">
                    🗑️ Xóa
                </button>
                ${
                    customer.latitude && customer.longitude
                    ? `
                        <button onclick="openMapLocation(${customer.latitude},${customer.longitude})">
                            🗺️ Bản đồ
                        </button>
                    `
                    : ""
                }
            </div>
        `;
        list.appendChild(card);
    });
}
/* =========================
   SỬA KHÁCH HÀNG
========================= */
function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    editingId = customer.id;
    document.getElementById("name").value = customer.name || "";
    document.getElementById("address").value = customer.address || "";
    document.getElementById("note").value = customer.note || "";
    latitude = customer.latitude;
    longitude = customer.longitude;
    photoData = customer.photo_url || null;
    if (photoData) {
        const preview = document.getElementById("photoPreview");
        preview.src = photoData;
        preview.classList.remove("hidden");
        document.getElementById("photoStatus").textContent =
            "✅ Đã có ảnh.";
    }
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
/* =========================
   XÓA KHÁCH HÀNG
========================= */
async function deleteCustomer(id) {
    if (!confirm("Bạn có chắc muốn xóa khách hàng này?")) {
        return;
    }
    const { error } = await db
        .from("customers")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);
    if (error) {
        alert("❌ Xóa thất bại: " + error.message);
        return;
    }
    await loadCustomers();
}
/* =========================
   ẢNH
========================= */
function showPhoto(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer || !customer.photo_url) return;
    const win = window.open("");
    win.document.write(`
        <html>
        <head>
            <title>Ảnh nhà khách</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            <img
                src="${customer.photo_url}"
                style="max-width:100%;max-height:100vh;object-fit:contain;"
            >
        </body>
        </html>
    `);
}
/* =========================
   BẢN ĐỒ
========================= */
function openMapLocation(lat, lng) {
    if (!map) {
        initMap();
    }
    document.getElementById("mapView").classList.remove("hidden");
    setTimeout(() => {
        map.invalidateSize();
        map.setView([lat, lng], 17);
        L.marker([lat, lng])
            .addTo(map)
            .bindPopup("📍 Vị trí khách hàng")
            .openPopup();
    }, 200);
}
function initMap() {
    map = L.map("map").setView([10.0452, 105.7469], 13);
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "&copy; OpenStreetMap"
        }
    ).addTo(map);
}
/* =========================
   HTML AN TOÀN
========================= */
function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
