


//* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
  "https://yxzjddriuglqwtzxmgbi.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_QbGR8Dme3YIyDL1aceUIYA_Efyf65Lf";

const sb = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/* =====================================================
   HELPER
===================================================== */

const $ = id => document.getElementById(id);

let customers = [];

let latitude = null;
let longitude = null;

let cameraStream = null;
let photoData = null;

let map = null;
let markers = [];

/* Khách hàng đang chỉnh sửa */
let editingCustomerId = null;


/* =====================================================
   LOGIN
===================================================== */

/* =====================================================
   REMEMBER EMAIL
===================================================== */

const savedEmail =
  localStorage.getItem("rememberEmail");

if (savedEmail) {

  $("email").value =
    savedEmail;

  $("rememberLogin").checked =
    true;

}


/* =====================================================
   INIT
===================================================== */

async function init() {

  const {
    data: { session }
  } = await sb.auth.getSession();

  showApp(session);

  sb.auth.onAuthStateChange(
    (_event, session) => {
      showApp(session);
    }
  );

}


function showApp(session) {

  $("loginView").classList.toggle(
    "hidden",
    !!session
  );

  $("appView").classList.toggle(
    "hidden",
    !session
  );


  if (session) {

    $("menuEmail").textContent =
      session.user.email || "";

    loadCustomers();

  }

}


/* =====================================================
   LOGIN BUTTON
===================================================== */

$("loginBtn").addEventListener(
  "click",
  async () => {

    const email =
      $("email").value.trim();

    const password =
      $("password").value;

    const rememberLogin =
      $("rememberLogin").checked;


    if (rememberLogin) {

      localStorage.setItem(
        "rememberEmail",
        email
      );

    } else {

      localStorage.removeItem(
        "rememberEmail"
      );

    }


    $("loginMsg").textContent =
      "Đang đăng nhập...";


    const { error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });


    if (error) {

      $("loginMsg").textContent =
        error.message;

      return;

    }


    $("loginMsg").textContent = "";

  }
);


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

  await sb.auth.signOut();

  closeMenu();

}


$("logoutBtn").addEventListener(
  "click",
  logout
);


$("menuLogout").addEventListener(
  "click",
  logout
);


/* =====================================================
   MENU
===================================================== */

function openMenu() {

  $("sideMenu").classList.add("open");

  $("menuOverlay").classList.remove(
    "hidden"
  );

}


function closeMenu() {

  $("sideMenu").classList.remove(
    "open"
  );

  $("menuOverlay").classList.add(
    "hidden"
  );

}


$("menuBtn").addEventListener(
  "click",
  openMenu
);


$("closeMenuBtn").addEventListener(
  "click",
  closeMenu
);


$("menuOverlay").addEventListener(
  "click",
  closeMenu
);


/* =====================================================
   PAGE NAVIGATION
===================================================== */

function showMain() {

  $("mainView").classList.remove(
    "hidden"
  );

  $("customersView").classList.add(
    "hidden"
  );

  $("mapView").classList.add(
    "hidden"
  );

  closeMenu();

}


function showCustomers() {

  $("mainView").classList.add(
    "hidden"
  );

  $("customersView").classList.remove(
    "hidden"
  );

  $("mapView").classList.add(
    "hidden"
  );

  renderCustomers();

  closeMenu();

}


function showMap() {

  $("mainView").classList.add(
    "hidden"
  );

  $("customersView").classList.add(
    "hidden"
  );

  $("mapView").classList.remove(
    "hidden"
  );

  closeMenu();


  setTimeout(() => {

    initMap();

    loadMapMarkers();

  }, 100);

}


$("menuAdd").addEventListener(
  "click",
  showMain
);


$("menuCustomers").addEventListener(
  "click",
  showCustomers
);


$("menuMap").addEventListener(
  "click",
  showMap
);


$("backFromCustomers").addEventListener(
  "click",
  showMain
);


$("backFromMap").addEventListener(
  "click",
  showMain
);


/* =====================================================
   GPS
===================================================== */

$("gpsBtn").addEventListener(
  "click",
  getGPS
);


function getGPS() {

  if (!navigator.geolocation) {

    $("gpsStatus").textContent =
      "Thiết bị không hỗ trợ GPS.";

    return;

  }


  $("gpsStatus").textContent =
    "📍 Đang lấy vị trí...";


  navigator.geolocation.getCurrentPosition(

    position => {

      latitude =
        position.coords.latitude;

      longitude =
        position.coords.longitude;


      $("gpsStatus").textContent =
        `✅ Đã lấy vị trí: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    },


    error => {

      console.log(error);

      $("gpsStatus").textContent =
        "❌ Không lấy được GPS. Hãy cho phép trình duyệt sử dụng vị trí.";

    },


    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }

  );

}


/* =====================================================
   CAMERA
===================================================== */

$("cameraBtn").addEventListener(
  "click",
  openCamera
);


async function openCamera() {

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


    $("camera").srcObject =
      cameraStream;


    $("cameraArea").classList.remove(
      "hidden"
    );


    $("photoStatus").textContent =
      "Camera đã mở.";


  } catch (error) {

    console.log(error);

    $("photoStatus").textContent =
      "❌ Không mở được camera. Hãy cấp quyền camera cho Safari.";

  }

}


/* =====================================================
   TAKE PHOTO
===================================================== */

$("takePhotoBtn").addEventListener(
  "click",
  takePhoto
);


function takePhoto() {

  const video =
    $("camera");

  const canvas =
    $("photoCanvas");


  if (!video.videoWidth) {

    $("photoStatus").textContent =
      "Camera chưa sẵn sàng.";

    return;

  }


  const maxWidth = 1200;


  const scale =
    Math.min(
      1,
      maxWidth / video.videoWidth
    );


  canvas.width =
    video.videoWidth * scale;

  canvas.height =
    video.videoHeight * scale;


  const ctx =
    canvas.getContext("2d");


  ctx.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );


  photoData =
    canvas.toDataURL(
      "image/jpeg",
      0.75
    );


  $("photoPreview").src =
    photoData;


  $("photoPreview").classList.remove(
    "hidden"
  );


  $("photoStatus").textContent =
    "✅ Đã chụp ảnh.";


  closeCamera();

}


/* =====================================================
   CLOSE CAMERA
===================================================== */

$("closeCameraBtn").addEventListener(
  "click",
  closeCamera
);


function closeCamera() {

  if (cameraStream) {

    cameraStream
      .getTracks()
      .forEach(track =>
        track.stop()
      );

    cameraStream = null;

  }


  $("camera").srcObject = null;


  $("cameraArea").classList.add(
    "hidden"
  );

}


/* =====================================================
   SAVE / UPDATE CUSTOMER
===================================================== */

$("saveBtn").addEventListener(
  "click",
  saveCustomer
);


async function saveCustomer() {

  const name =
    $("name").value.trim();

  const address =
    $("address").value.trim();

  const note =
    $("note").value.trim();


  if (!name) {

    $("saveStatus").textContent =
      "❌ Vui lòng nhập họ và tên.";

    return;

  }


  $("saveBtn").disabled =
    true;


  $("saveStatus").textContent =
    editingCustomerId
      ? "⏳ Đang cập nhật khách hàng..."
      : "⏳ Đang lưu khách hàng...";


  const {
    data: { user }
  } = await sb.auth.getUser();


  if (!user) {

    $("saveStatus").textContent =
      "❌ Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.";

    $("saveBtn").disabled =
      false;

    return;

  }


  const customer = {

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


  /* =====================================================
     UPDATE
  ===================================================== */

  if (editingCustomerId) {

    const {
      error
    } = await sb
      .from("customers")
      .update(customer)
      .eq(
        "id",
        editingCustomerId
      )
      .eq(
        "user_id",
        user.id
      );


    $("saveBtn").disabled =
      false;


    if (error) {

      console.log(error);

      $("saveStatus").textContent =
        "❌ Cập nhật thất bại: " +
        error.message;

      return;

    }


    $("saveStatus").textContent =
      "✅ Đã cập nhật khách hàng thành công!";


    resetCustomerForm();


    await loadCustomers();

    return;

  }


  /* =====================================================
     INSERT
  ===================================================== */

  const insertData = {

    ...customer,

    user_id:
      user.id

  };


  const {
    error
  } = await sb
    .from("customers")
    .insert(insertData);


  $("saveBtn").disabled =
    false;


  if (error) {

    console.log(error);

    $("saveStatus").textContent =
      "❌ Lưu thất bại: " +
      error.message;

    return;

  }


  $("saveStatus").textContent =
    "✅ Đã lưu khách hàng thành công!";


  resetCustomerForm();


  await loadCustomers();

}


/* =====================================================
   RESET FORM
===================================================== */

function resetCustomerForm() {

  editingCustomerId =
    null;


  $("name").value =
    "";

  $("address").value =
    "";

  $("note").value =
    "";


  $("gpsStatus").textContent =
    "";

  $("photoStatus").textContent =
    "";


  $("photoPreview").src =
    "";

  $("photoPreview").classList.add(
    "hidden"
  );


  latitude =
    null;

  longitude =
    null;

  photoData =
    null;


  /*
     Trả nút về trạng thái thêm mới
  */

  $("saveBtn").textContent =
    "💾 Lưu khách hàng";

}


/* =====================================================
   LOAD CUSTOMERS
===================================================== */

async function loadCustomers() {

  const {
    data: { user }
  } = await sb.auth.getUser();


  if (!user) {

    customers = [];

    renderCustomers();

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

    console.log(error);

    return;

  }


  customers =
    data || [];


  renderCustomers();

}


/* =====================================================
   CUSTOMER SEARCH
===================================================== */

$("search").addEventListener(
  "input",
  renderCustomers
);


/* =====================================================
   RENDER CUSTOMERS
===================================================== */

function renderCustomers() {

  const keyword =
    $("search").value
      .trim()
      .toLowerCase();


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


  $("count").textContent =
    `${filtered.length} khách hàng`;


  if (!filtered.length) {

    $("customerList").innerHTML = `
      <div class="customer-card">
        Không tìm thấy khách hàng.
      </div>
    `;

    return;

  }


  $("customerList").innerHTML =
    filtered.map(customer => {

      const gps =
        customer.latitude != null &&
        customer.longitude != null;


      return `

        <div class="customer-card">

          <div class="customer-name">
            ${escapeHTML(
              customer.name ||
              "Không tên"
            )}
          </div>


          <div class="customer-info">

            ${
              customer.address
              ? "📍 " +
                escapeHTML(
                  customer.address
                ) +
                "<br>"
              : ""
            }


            ${
              customer.note
              ? "📝 " +
                escapeHTML(
                  customer.note
                ) +
                "<br>"
              : ""
            }


            ${
              gps
              ? "🗺️ Đã có vị trí GPS"
              : "⚠️ Chưa có GPS"
            }

          </div>


          <div class="customer-actions">

            ${
              gps
              ?
              `<button
                onclick="focusCustomer(${customer.id})">
                🗺️ Xem bản đồ
              </button>`
              :
              ""
            }


            ${
              customer.photo_url
              ?
              `<button
                onclick="showPhoto('${encodeURIComponent(
                  customer.photo_url
                )}')">
                🏠 Xem ảnh
              </button>`
              :
              ""
            }


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

    }).join("");

}


/* =====================================================
   EDIT CUSTOMER
===================================================== */

window.editCustomer =
  function(id) {

    const customer =
      customers.find(
        c =>
          String(c.id) ===
          String(id)
      );


    if (!customer) {

      alert(
        "❌ Không tìm thấy khách hàng."
      );

      return;

    }


    editingCustomerId =
      customer.id;


    $("name").value =
      customer.name || "";


    $("address").value =
      customer.address || "";


    $("note").value =
      customer.note || "";


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


    if (
      latitude != null &&
      longitude != null
    ) {

      $("gpsStatus").textContent =
        `✅ Vị trí hiện tại: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    } else {

      $("gpsStatus").textContent =
        "⚠️ Khách hàng chưa có GPS.";

    }


    if (customer.photo_url) {

      $("photoPreview").src =
        customer.photo_url;

      $("photoPreview").classList.remove(
        "hidden"
      );

      $("photoStatus").textContent =
        "✅ Đang sử dụng ảnh đã lưu.";

    } else {

      $("photoPreview").src =
        "";

      $("photoPreview").classList.add(
        "hidden"
      );

      $("photoStatus").textContent =
        "";

    }


    $("saveBtn").textContent =
      "💾 Cập nhật khách hàng";


    $("saveStatus").textContent =
      "✏️ Đang chỉnh sửa khách hàng.";


    showMain();


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  };


/* =====================================================
   CANCEL EDIT
===================================================== */

window.cancelEdit =
  function() {

    resetCustomerForm();

    $("saveStatus").textContent =
      "";

  };


/* =====================================================
   DELETE CUSTOMER
===================================================== */

window.deleteCustomer =
  async function(id) {

    const customer =
      customers.find(
        c =>
          String(c.id) ===
          String(id)
      );


    if (!customer) {

      alert(
        "❌ Không tìm thấy khách hàng."
      );

      return;

    }


    const customerName =
      customer.name ||
      "khách hàng này";


    const confirmed =
      confirm(
        `⚠️ Bạn có chắc muốn xóa "${customerName}" không?\n\nDữ liệu khách hàng sẽ bị xóa khỏi hệ thống.`
      );


    if (!confirmed) {

      return;

    }


    const {
      data: { user }
    } = await sb.auth.getUser();


    if (!user) {

      alert(
        "❌ Phiên đăng nhập đã hết. Vui lòng đăng nhập lại."
      );

      return;

    }


    const {
      error
    } = await sb
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

      console.log(error);

      alert(
        "❌ Xóa thất bại:\n" +
        error.message
      );

      return;

    }


    customers =
      customers.filter(
        c =>
          String(c.id) !==
          String(id)
      );


    /*
       Nếu đang chỉnh sửa khách này
       thì thoát chế độ chỉnh sửa
    */

    if (
      String(editingCustomerId) ===
      String(id)
    ) {

      resetCustomerForm();

    }


    renderCustomers();

    loadMapMarkers();


    alert(
      `✅ Đã xóa "${customerName}" thành công.`
    );

  };


/* =====================================================
   MAP
===================================================== */

function initMap() {

  if (map) {

    map.invalidateSize();

    return;

  }


  map =
    L.map("map");


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        "&copy; OpenStreetMap"
    }
  ).addTo(map);


  map.setView(
    [10.762622, 106.660172],
    6
  );

}


/* =====================================================
   MAP MARKERS
===================================================== */

function loadMapMarkers() {

  if (!map) return;


  markers.forEach(
    marker => {

      map.removeLayer(
        marker
      );

    }
  );


  markers = [];


  const gpsCustomers =
    customers.filter(
      customer => {

        return (

          customer.latitude != null &&

          customer.longitude != null &&

          !isNaN(
            customer.latitude
          ) &&

          !isNaN(
            customer.longitude
          )

        );

      }
    );


  $("mapCount").textContent =
    `${gpsCustomers.length} khách có GPS`;


  if (!gpsCustomers.length) {

    map.setView(
      [10.762622, 106.660172],
      6
    );

    return;

  }


  const bounds = [];


  gpsCustomers.forEach(
    customer => {

      const lat =
        Number(
          customer.latitude
        );


      const lng =
        Number(
          customer.longitude
        );


      const marker =
        L.marker(
          [lat, lng]
        ).addTo(map);


      const popup = `

        <div style="min-width:220px">

          <strong style="font-size:17px">
            ${escapeHTML(
              customer.name ||
              "Khách hàng"
            )}
          </strong>

          <br><br>

          ${
            customer.address
            ? `📍 ${escapeHTML(
                customer.address
              )}<br><br>`
            : ""
          }


          ${
            customer.note
            ? `📝 ${escapeHTML(
                customer.note
              )}<br><br>`
            : ""
          }


          <small>
            GPS:
            ${lat.toFixed(6)},
            ${lng.toFixed(6)}
          </small>

        </div>

      `;


      marker.bindPopup(
        popup
      );


      markers.push(
        marker
      );


      bounds.push(
        [lat, lng]
      );

    }
  );


  if (bounds.length === 1) {

    map.setView(
      bounds[0],
      16
    );

  } else {

    map.fitBounds(
      bounds,
      {
        padding: [30, 30]
      }
    );

  }

}


/* =====================================================
   FOCUS CUSTOMER
===================================================== */

window.focusCustomer =
  function(id) {

    const customer =
      customers.find(
        c =>
          String(c.id) ===
          String(id)
      );


    if (!customer) return;


    showMap();


    setTimeout(
      () => {

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


        const marker =
          markers.find(
            m => {

              const pos =
                m.getLatLng();


              return (

                Math.abs(
                  pos.lat - lat
                ) < 0.000001

                &&

                Math.abs(
                  pos.lng - lng
                ) < 0.000001

              );

            }
          );


        if (marker) {

          marker.openPopup();

        }

      },
      300
    );

  };


/* =====================================================
   MY LOCATION
===================================================== */

$("myLocationBtn").addEventListener(
  "click",
  () => {

    if (!navigator.geolocation)
      return;


    navigator.geolocation.getCurrentPosition(
      position => {

        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;


        if (map) {

          map.setView(
            [lat, lng],
            17
          );


          L.circleMarker(
            [lat, lng],
            {
              radius: 8
            }
          )
          .addTo(map)
          .bindPopup(
            "📍 Vị trí hiện tại của bạn"
          )
          .openPopup();

        }

      }
    );

  }
);


/* =====================================================
   SHOW PHOTO
===================================================== */

window.showPhoto =
  function(encoded) {

    const url =
      decodeURIComponent(
        encoded
      );


    const win =
      window.open();


    if (win) {

      win.document.write(`
        <html>
          <body style="
            margin:0;
            background:#000;
            display:flex;
            align-items:center;
            justify-content:center;
            min-height:100vh;
          ">

            <img
              src="${url}"
              style="
                max-width:100%;
                max-height:100vh;
              "
            >

          </body>
        </html>
      `);

    }

  };


/* =====================================================
   ESCAPE HTML
===================================================== */

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


/* =====================================================
   START
===================================================== */

init();
