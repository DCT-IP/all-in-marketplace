const BASE_URL = "http://127.0.0.1:5000";

// ---------- AUTH CHECK ----------
const protectedRoutes = ["/cart", "/dashboard"];
const path = window.location.pathname;

const userId = localStorage.getItem("user_id");
const role = localStorage.getItem("role");

// 🔥 Block dashboard if NOT seller
if (path.startsWith("/dashboard") && role !== "seller") {
    window.location.href = "/";
}

// 🔥 Protect routes
const isProtected = protectedRoutes.some(route => path.startsWith(route));
if (isProtected && !userId) {
    window.location.href = "/login";
}


// ---------- AUTH UI ----------
function renderAuthUI() {
    const authArea = document.getElementById("authArea");
    const dashboardBtn = document.getElementById("dashboardBtn");

    if (!authArea) return;

    const userId = localStorage.getItem("user_id");
    const role = localStorage.getItem("role");

    if (dashboardBtn) dashboardBtn.style.display = "none";

    if (userId) {
        authArea.innerHTML = `
            <button class="logout-btn" onclick="logout()">Logout</button>
        `;

        if (role === "seller" && dashboardBtn) {
            dashboardBtn.style.display = "inline-block";
            dashboardBtn.onclick = () => {
                window.location.href = "/dashboard/" + userId;
            };
        }
    } else {
        authArea.innerHTML = `
            <button class="login-btn" onclick="goToLogin()">Sign In</button>
        `;
    }
}


// ---------- NAV ----------
function goToLogin() {
    window.location.href = "/login";
}

function logout() {
    localStorage.clear();
    window.location.href = "/";
}

function goToCart() {
    if (!localStorage.getItem("user_id")) {
        window.location.href = "/login";
        return;
    }
    window.location.href = "/cart";
}


// ---------- DARK MODE ----------
function toggleTheme() {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

function loadTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
        document.body.classList.add("dark");
    }
}


// ---------- TOAST ----------
function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = msg;
    toast.classList.remove("hidden");

    setTimeout(() => toast.classList.add("hidden"), 2000);
}


// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
    renderAuthUI();
    loadTheme();
    setupSearch();
    setupFilter();
    setupSort();
    loadCart();
});


// ---------- SEARCH ----------
function setupSearch() {
    const searchBar = document.getElementById("searchBar");
    if (!searchBar) return;

    searchBar.addEventListener("input", (e) => {
        const val = e.target.value.toLowerCase();

        document.querySelectorAll(".product-card").forEach(card => {
            card.style.display =
                card.dataset.name.includes(val) ? "block" : "none";
        });
    });
}


// ---------- FILTER ----------
function setupFilter() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const category = btn.dataset.category;

            document.querySelectorAll(".product-card").forEach(card => {
                card.style.display =
                    category === "all" || card.dataset.category === category
                        ? "block"
                        : "none";
            });
        });
    });
}


// ---------- SORT ----------
function setupSort() {
    const sortSelect = document.getElementById("sortSelect");
    if (!sortSelect) return;

    sortSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        const container = document.getElementById("products");
        if (!container) return;

        const cards = Array.from(container.children);

        cards.sort((a, b) => {
            const priceA = parseFloat(a.dataset.finalPrice);
            const priceB = parseFloat(b.dataset.finalPrice);

            const ratingA = parseFloat(a.dataset.rating);
            const ratingB = parseFloat(b.dataset.rating);

            if (val === "price_low") return priceA - priceB;
            if (val === "price_high") return priceB - priceA;
            if (val === "rating") return ratingB - ratingA;

            return 0;
        });

        container.innerHTML = "";
        cards.forEach(c => container.appendChild(c));
    });
}


// ---------- ADD TO CART ----------
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("add-to-cart")) {

        if (!localStorage.getItem("user_id")) {
            showToast("Login required ⚠️");
            window.location.href = "/login";
            return;
        }

        const productId = e.target.dataset.productId;

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
    }
});


// ---------- CART ----------
async function loadCart() {
    const container = document.getElementById("cartItems");
    if (!container) return;

    const res = await fetch(`${BASE_URL}/cart/${localStorage.getItem("user_id")}`);
    const data = await res.json();

    let total = 0;
    container.innerHTML = "";

    data.forEach(item => {
        const subtotal = item.price_at_addition * item.quantity;
        total += subtotal;

        container.innerHTML += `
        <div class="cart-item">
            <img src="https://via.placeholder.com/80">
            <div>
                <h4>${item.name}</h4>
                <p>₹${item.price_at_addition}</p>

                <button onclick="updateQty(${item.product_id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQty(${item.product_id}, 1)">+</button>
            </div>

            <button onclick="removeItem(${item.product_id})">Remove</button>
        </div>
        `;
    });

    const totalEl = document.getElementById("totalPrice");
    if (totalEl) totalEl.innerText = total;
}


async function updateQty(productId, change) {
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
}


async function removeItem(productId) {
    await fetch(`${BASE_URL}/remove_from_cart`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            user_id: localStorage.getItem("user_id"),
            product_id: productId
        })
    });

    loadCart();
}