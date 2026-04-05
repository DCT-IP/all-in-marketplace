const BASE_URL = "http://127.0.0.1:5000";
// ===== GLOBAL LOGIN FUNCTION (FINAL FIX) =====
async function login() {
    console.log("🔥 login() running");

    const username = document.getElementById("username")?.value;
    const role = document.getElementById("role")?.value;

    if (!username || !role) {
        alert("Fill all fields");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, role })
        });

        const data = await res.json();

        if (res.ok && data.user_id) {
            localStorage.setItem("user_id", data.user_id);
            localStorage.setItem("role", data.role);

            window.location.href = data.role === "seller" ? "/seller" : "/";
        } else {
            alert(data.error || "Login failed");
        }
    } catch (err) {
        console.error(err);
        alert("Something went wrong");
    }
}
// ===== GLOBAL CART FUNCTIONS FIX =====

window.updateQty = async function(productId, change) {
    await fetch(`${BASE_URL}/update_cart`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            user_id: localStorage.getItem("user_id"),
            product_id: productId,
            change
        })
    });

    loadCart();
};

window.removeItem = async function(productId) {
    await fetch(`${BASE_URL}/remove_from_cart`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            user_id: localStorage.getItem("user_id"),
            product_id: productId
        })
    });

    loadCart();
};

function checkout() {
    const form = document.getElementById("checkoutForm");

    form.style.display = "block";

    window.scrollTo({
        top: form.offsetTop,
        behavior: "smooth"
    });
}
window.placeOrder = async function() {
    const user_id = localStorage.getItem("user_id");

    const phone = document.getElementById("phone")?.value;
    const address = document.getElementById("address")?.value;
    const payment_method = document.querySelector('input[name="payment"]:checked')?.value;

    if (!phone || !address) {
        alert("Please fill all details");
        return;
    }

    const res = await fetch(`${BASE_URL}/checkout/${user_id}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            phone,
            address,
            payment_method
        })
    });

    const data = await res.json();

    if (res.ok) {
        alert("Order placed successfully ✅");
        window.location.href = "/order_success";
    } else {
        alert(data.error);
    }
};
let currentIndex = 0;
let sliderInterval;

const protectedRoutes = ["/cart", "/seller"];
const path = window.location.pathname;
const role = localStorage.getItem("role");
const userId = localStorage.getItem("user_id");

// ===== ROUTE PROTECTION =====
if (path.startsWith("/seller") && role !== "seller") {
    window.location.href = "/";
}

const isProtected = protectedRoutes.some(route => path.startsWith(route));
if (isProtected && !userId) {
    window.location.href = "/login";
}

function goToCart() {
    if (!localStorage.getItem("user_id")) {
        window.location.href = "/login";
        return;
    }
    window.location.href = "/cart";
}
// ===== AUTH UI =====
function renderAuthUI() {
    const authArea = document.getElementById("authArea");
    const dashboardBtn = document.getElementById("dashboardBtn");

    if (!authArea) return;

    const uid = localStorage.getItem("user_id");
    const role = localStorage.getItem("role");

    if (dashboardBtn) dashboardBtn.style.display = "none";

    if (uid) {
        authArea.innerHTML = `<button class="logout-btn" onclick="logout()">Logout</button>`;

        if (role === "seller" && dashboardBtn) {
            dashboardBtn.style.display = "inline-block";
            dashboardBtn.onclick = () => window.location.href = "/seller";
        }
    } else {
        authArea.innerHTML = `<button class="login-btn" onclick="goToLogin()">Sign In</button>`;
    }
}

function goToLogin() { window.location.href = "/login"; }
function logout() { localStorage.clear(); window.location.href = "/"; }

// ===== THEME =====
function toggleTheme() {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

function loadTheme() {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
    }
}

// ===== TOAST =====
function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = msg;
    toast.classList.remove("hidden");

    setTimeout(() => toast.classList.add("hidden"), 2000);
}

// ===== APP INIT =====
window.addEventListener("load", () => {
    console.log("🔥 App Init Start");

    renderAuthUI();
    loadTheme();
    setupSearch();
    setupFilter();
    setupSort();
    loadCart();
    loadUserDetails();
    loadOrders();

    // ===== SLIDER INIT =====
    const slider = document.getElementById("slider");
    const user = localStorage.getItem("user_id");

    if (!slider || !user) {
        if (slider) slider.style.display = "none";
        return;
    }

    slider.style.display = "block";

    const productsContainer = document.getElementById("products");

    // skeleton
    if (!productsContainer.innerHTML.trim()) {
    productsContainer.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;
}
console.log("⏳ Waiting for products...");

let tries = 0;

const checkProducts = setInterval(() => {
    const cards = document.querySelectorAll(".product-card");

    console.log("Checking products:", cards.length);

    if (cards.length > 0) {
        console.log("✅ Products ready → loading slider");

        clearInterval(checkProducts);
        loadSlider();
    }

    tries++;
    if (tries > 50) {
        console.error("❌ Products not found");
        clearInterval(checkProducts);
    }

    }, 100);


// ===== FILTER COLLAPSE FINAL FIX =====
const filterToggle = document.getElementById("filterToggle");
const filterBar = document.getElementById("filterBar");

if (filterToggle && filterBar) {

    let collapsed = false;

    // 🔥 FIX: wait for layout to settle
    setTimeout(() => {
        filterBar.style.maxHeight = filterBar.scrollHeight + "px";
    }, 50);

    filterToggle.addEventListener("click", () => {

        collapsed = !collapsed;

        if (collapsed) {
            filterBar.style.maxHeight = "0px";
            filterBar.style.opacity = "0";
            filterToggle.innerText = "Filters ⬇";
        } else {
            filterBar.style.maxHeight = filterBar.scrollHeight + "px";
            filterBar.style.opacity = "1";
            filterToggle.innerText = "Filters ⬆";
        }
    });
}
});

// ===== SEARCH =====
function setupSearch() {
    const input = document.querySelector("input");
    if (!input) return;

    input.addEventListener("input", () => {
        const value = input.value.toLowerCase();

        document.querySelectorAll(".product-card").forEach(card => {
            const name = card.dataset.name || "";
            card.style.display = name.includes(value) ? "block" : "none";
        });
    });
}

// ===== FILTER =====
function setupFilter() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const category = (btn.dataset.category || "").toLowerCase();

            document.querySelectorAll(".product-card").forEach(card => {
                const c = (card.dataset.category || "").toLowerCase();
                const match = category === "all" || c === category || c.includes(category);
                card.style.display = match ? "block" : "none";
            });

            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });
}

// ===== SORT =====
function setupSort() {
    const sortSelect = document.getElementById("sortSelect");
    if (!sortSelect) return;

    sortSelect.addEventListener("change", (e) => {
        const container = document.getElementById("products");
        const cards = Array.from(container.children);

        cards.sort((a, b) => {
            const priceA = parseFloat(a.dataset.finalPrice);
            const priceB = parseFloat(b.dataset.finalPrice);
            const ratingA = parseFloat(a.dataset.rating);
            const ratingB = parseFloat(b.dataset.rating);

            if (e.target.value === "price_low") return priceA - priceB;
            if (e.target.value === "price_high") return priceB - priceA;
            if (e.target.value === "rating") return ratingB - ratingA;
            return 0;
        });

        container.innerHTML = "";
        cards.forEach(c => container.appendChild(c));
    });
}

// ===== ADD TO CART =====
document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;

    const productId = btn.getAttribute("data-product-id");
    if (!productId) {
        console.error("Missing product ID");
        return;
    }

    if (!localStorage.getItem("user_id")) {
        showToast("Login required ⚠️");
        window.location.href = "/login";
        return;
    }

    btn.innerText = "Adding...";
    btn.disabled = true;

    await fetch(`${BASE_URL}/add_to_cart`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            user_id: localStorage.getItem("user_id"),
            product_id: productId,
            quantity: 1
        })
    });

    showToast("Added to cart ✅");

    setTimeout(() => {
        btn.innerText = "Add to Cart";
        btn.disabled = false;
    }, 1000);
});

// ===== LOAD CART =====
async function loadCart() {
    const container = document.getElementById("cartItems");
    if (!container) return;

    const res = await fetch(`${BASE_URL}/cart/${localStorage.getItem("user_id")}`);
    const data = await res.json();

    let total = 0;
    let html = "";

    data.forEach(item => {
        const subtotal = item.price_at_addition * item.quantity;
        total += subtotal;

        html += `
<div class="cart-item">

    <div class="cart-left">
        <img src="${item.image_url}" 
            onerror="this.src='https://via.placeholder.com/200x150?text=No+Image'">

        <div class="cart-details">
            <h4>${item.product_name}</h4>
            <p>₹${item.price_at_addition}</p>
        </div>
    </div>

    <div class="cart-controls">
        <button onclick="updateQty(${item.product_id}, -1)">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateQty(${item.product_id}, 1)">+</button>
    </div>

    <button class="remove-btn" onclick="removeItem(${item.product_id})">
        Remove
    </button>

</div>
`;
    });

    container.innerHTML = html;

    const totalEl = document.getElementById("totalPrice");
    if (totalEl) totalEl.innerText = total;
}

// ===== LOAD ORDERS =====
async function loadOrders() {
    const container = document.getElementById("orders-container");
    if (!container) return;

    const res = await fetch(`${BASE_URL}/orders/${localStorage.getItem("user_id")}`);
    const orders = await res.json();

    let html = "";

    orders.forEach(o => {
        html += `
<div class="order-card">
    <img src="${o.image_url}" onerror="this.src='https://via.placeholder.com/100'">

    <div class="order-info">
        <h4>${o.product_name}</h4>
        <div class="order-meta">
            Qty: ${o.quantity} • ₹${o.total_price}
        </div>
        <div class="order-meta">
            ${new Date(o.order_date).toLocaleDateString()}
        </div>
    </div>

    <div class="order-status">
        ${o.order_status}
    </div>
</div>`;
    });

    container.innerHTML = html || "<p>No orders yet</p>";
}

// ===== USER DETAILS (FIXED) =====
async function loadUserDetails() {
    const id = localStorage.getItem("user_id");
    if (!id) return;

    const res = await fetch(`${BASE_URL}/user/${id}`);
    const user = await res.json();

    const phoneEl = document.getElementById("phone");
    if (user.phone && phoneEl) phoneEl.value = user.phone;

    const addressEl = document.getElementById("address");
    if (user.address && addressEl) addressEl.value = user.address;
}

// ===== SLIDER =====
function loadSlider() {
    const container = document.getElementById("slides");
    if (!container) return;

    const cards = document.querySelectorAll(".product-card");
    if (!cards.length) return;

    let slidesArr = [];

    const topRated = [...cards].sort((a, b) => b.dataset.rating - a.dataset.rating)[0];
    if (topRated) slidesArr.push(buildSlide(topRated, "Top Rated"));

    for (let i = 0; i < cards.length && slidesArr.length < 4; i++) {
        slidesArr.push(buildSlide(cards[i], "Recommended"));
    }

    container.innerHTML = slidesArr.join("");
    setupDots(slidesArr.length);
    console.log("✅ Slider loaded with", slidesArr.length, "slides");
    startSlider();
    updateDots();
}

// ===== SAFE SLIDE BUILDER =====
function buildSlide(card, label) {
    const nameEl = card.querySelector("h3");
    const imgEl = card.querySelector("img");
    const btnEl = card.querySelector(".add-to-cart");

    const name = nameEl ? nameEl.innerText : "Product";
    const img = imgEl ? imgEl.src : "https://via.placeholder.com/300";
    const id = btnEl ? btnEl.getAttribute("data-product-id") : null;

    if (!id) {
        console.error("❌ Missing product ID in slider");
        return "";
    }

    return `
    <div class="slide">
        <img src="${img}">
        <div class="slide-content">
            <h2>${name}</h2>
            <p>${label}</p>
            <button class="add-to-cart" data-product-id="${id}">
                Add to Cart
            </button>
        </div>
    </div>`;
}
// ===== SLIDER CONTROLS =====
function nextSlide() {
    const slides = document.querySelectorAll(".slide");
    const container = document.getElementById("slides");

    if (!slides.length) return;

    currentIndex = (currentIndex + 1) % slides.length;
    container.style.transform = `translateX(-${currentIndex * 100}%)`;

    updateDots();
}

function prevSlide() {
    const slides = document.querySelectorAll(".slide");
    const container = document.getElementById("slides");

    if (!slides.length) return;

    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    container.style.transform = `translateX(-${currentIndex * 100}%)`;

    updateDots();
}

function startSlider() {
    clearInterval(sliderInterval);
    updateDots();
    sliderInterval = setInterval(nextSlide, 4000);
}

window.addEventListener("load", () => {
    const sliderEl = document.getElementById("slider");

    if (!sliderEl) return;

    sliderEl.addEventListener("mouseenter", () => {
        clearInterval(sliderInterval);
    });

    sliderEl.addEventListener("mouseleave", () => {
        startSlider();
    });

    let startX = 0;

    sliderEl.addEventListener("touchstart", e => {
        startX = e.touches[0].clientX;
    });

    sliderEl.addEventListener("touchend", e => {
        const endX = e.changedTouches[0].clientX;

        if (startX - endX > 50) nextSlide();
        if (endX - startX > 50) prevSlide();
    });
});;
function setupDots(count) {
    const dotsContainer = document.getElementById("sliderDots");
    if (!dotsContainer){
        console.error("❌ Dots container not found");
        return;
    }

    let html = "";

    for (let i = 0; i < count; i++) {
        html += `<span class="dot" onclick="goToSlide(${i})"></span>`;
    }

    dotsContainer.innerHTML = html;
    currentIndex = 0;
    updateDots();
}

function updateDots() {
    document.querySelectorAll(".dot").forEach((d, i) => {
        d.classList.toggle("active", i === currentIndex);
    });
}

function goToSlide(i) {
    currentIndex = i;
    document.getElementById("slides").style.transform = `translateX(-${i * 100}%)`;

    updateDots();
}

// ===== CURSOR GLOW =====
document.addEventListener("mousemove", (e) => {
    document.body.style.setProperty("--cursor-x", e.clientX + "px");
    document.body.style.setProperty("--cursor-y", e.clientY + "px");
});

// ===== SAFE LOGIN BINDING (NON-BREAKING) =====
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");

    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            console.log("🔥 Login button clicked");
            await login();
        });
    }
});


// ---------- SIGNUP ----------
const signupBtn = document.getElementById("signup-btn");

if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("username").value.trim();
        const role = document.getElementById("role").value;

        // Basic validation
        if (!name || !email) {
            alert("Please fill all fields");
            return;
        }

        try {
            const res = await fetch("http://127.0.0.1:5000/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    username: email,
                    role: role
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Save user locally (consistent with your auth system)
                localStorage.setItem("user_id", data.user_id);
                localStorage.setItem("role", data.role);

                alert("Signup successful!");

                // Redirect based on role
                if (data.role === "seller") {
                    window.location.href = "/dashboard";
                } else {
                    window.location.href = "/";
                }

            } else {
                alert(data.error || "Signup failed");
            }

        } catch (err) {
            console.error(err);
            alert("Server error");
        }
    });
}
