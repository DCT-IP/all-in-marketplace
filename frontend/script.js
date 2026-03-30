const BASE_URL = "http://127.0.0.1:5000";

const protectedRoutes = ["/cart", "/dashboard"];
const path = window.location.pathname;

const userId = localStorage.getItem("user_id");

if (path.startsWith("/dashboard") && role !== "seller") {
    window.location.href = "/";
}

const isProtected = protectedRoutes.some(route => path.startsWith(route));
if (isProtected && !userId) {
    window.location.href = "/login";
}

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
                window.location.href = "/dashboard";
            };
        }
    } else {
        authArea.innerHTML = `
            <button class="login-btn" onclick="goToLogin()">Sign In</button>
        `;
    }
}

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

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = msg;
    toast.classList.remove("hidden");

    setTimeout(() => toast.classList.add("hidden"), 2000);
}

document.addEventListener("DOMContentLoaded", () => {
    renderAuthUI();
    loadTheme();
    setupSearch();
    setupFilter();
    setupSort();
    loadCart();

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await login();
        });
    }

    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await signup();
        });
    }
});

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

// async function handleLogin(event) {
//     event.preventDefault();

//     const username = document.getElementById("username")?.value;
//     const role = document.getElementById("role")?.value;

//     try {
//         const res = await fetch(`${BASE_URL}/login`, {
//             method: "POST",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({ username, role })
//         });

//         const data = await res.json();

//         if (res.ok && data.user_id) {
//             localStorage.setItem("user_id", data.user_id);
//             localStorage.setItem("role", data.role);

//             if (data.role === "seller") {
//                 window.location.href = "/dashboard";
//             } else {
//                 window.location.href = "/";
//             }
//         } else {
//             alert("Invalid login");
//         }

//     } catch (err) {
//         console.error(err);
//         alert("Server error");
//     }
// }

document.getElementById("signup-btn")?.addEventListener("click", async () => {
    const name = document.getElementById("name").value;
    const username = document.getElementById("username").value;
    const role = document.getElementById("role").value;

    if (!name || !username || !role) return alert("Fill all fields");

    const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, username, role })
    });

    if (!res.ok) {
        const text = await res.text();
        console.error(text);
        return alert("Signup failed");
    }

    const data = await res.json();

    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("role", data.role);

    if (data.role === "seller") {
        window.location.href = "/dashboard";
    } else {
        window.location.href = "/";
    }
});
// -------- LOGIN --------
document.getElementById("login-btn")?.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const role = document.getElementById("role").value;

    if (!username || !role) return alert("Fill all fields");

    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, role })
    });

    const data = await res.json();

    if (res.ok && data.user_id) {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("role", data.role);

        if (data.role === "seller") {
            window.location.href = "/dashboard";
        } else {
            window.location.href = "/";
        }
    } else {
        alert(data.error || "Login failed");
    }
});

async function checkout() {
    const user_id = localStorage.getItem("user_id");

    if (!user_id) {
        alert("Login required");
        return;
    }

    const res = await fetch(`/checkout/${user_id}`, {
        method: "POST"
    });

    const data = await res.json();

    if (res.ok) {
        alert("Order placed successfully ✅");
        window.location.reload();
    } else {
        alert(data.error);
    }
}

async function loadOrders() {
    const user_id = localStorage.getItem("user_id");

    const res = await fetch(`/orders/${user_id}`);
    const orders = await res.json();

    const container = document.getElementById("orders-container");
    container.innerHTML = "";

    orders.forEach(order => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p>Product: ${order.product_id}</p>
            <p>Quantity: ${order.quantity}</p>
            <p>Total: ₹${order.total_price}</p>
        `;
        container.appendChild(div);
    });
}