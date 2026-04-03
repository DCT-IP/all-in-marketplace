const BASE_URL = "http://127.0.0.1:5000";
let currentIndex = 0;
let sliderInterval;
const protectedRoutes = ["/cart", "/seller"];
const path = window.location.pathname;
const role = localStorage.getItem("role");
const userId = localStorage.getItem("user_id");

if (path.startsWith("/seller") && role !== "seller") {
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
                window.location.href = "/seller";
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

window.addEventListener("load", () => {
    console.log("🔥 App Init Start");

    // ===== CORE APP =====
    renderAuthUI();
    loadTheme();
    setupSearch();
    setupFilter();
    setupSort();
    loadCart();
    loadUserDetails();
    loadOrders();

    // ===== AUTH FORMS =====
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

    // ===== SLIDER INIT =====
    const user = JSON.parse(localStorage.getItem("user_id"));
    const slider = document.getElementById("slider");

    if (!slider) {
        console.log("❌ Slider not found");
        return;
    }

    if (!user) {
        slider.style.display = "none";
        console.log("❌ No user → slider hidden");
        return;
    }

    slider.style.display = "block";

    console.log("⏳ Waiting for products...");

    const waitForProducts = setInterval(() => {
        const cards = document.querySelectorAll(".product-card");

        console.log("Checking products:", cards.length);

        if (cards.length > 0) {
            clearInterval(waitForProducts);

            console.log("✅ Products ready → loading slider");

            loadSlider();
        }
    }, 100);
});

function setupSearch() {
    const input = document.querySelector("input");

    input.addEventListener("input", () => {
        const value = input.value.toLowerCase();

        document.querySelectorAll(".product-card").forEach(card => {
            const name = card.dataset.name || "";

            if (name.includes(value)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });
}

function setupFilter() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {

            const category = (btn.dataset.category || "").toLowerCase();

            document.querySelectorAll(".product-card").forEach(card => {
                const cardCategory = (card.dataset.category || "").toLowerCase();

                const match =
                    category === "all" ||
                    cardCategory === category ||
                    cardCategory.includes(category) ||
                    category.includes(cardCategory);

                card.style.display = match ? "block" : "none";
            });

            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
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
    const btn = e.target.closest(".add-to-cart");  // ✅ FIX

    if (!btn) return;

    if (!localStorage.getItem("user_id")) {
        showToast("Login required ⚠️");
        window.location.href = "/login";
        return;
    }

    const productId = btn.dataset.productId;

    if (!productId) {
        console.error("Product ID missing");
        return;
    }

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

    const totalEl = document.getElementById("totalPrice");
    if (totalEl) totalEl.innerText = total;
}

async function signup() {
    const username = document.getElementById("username")?.value;
    const role = document.getElementById("role")?.value;

    if (!username || !role) {
        alert("Fill all fields");
        return;
    }

    const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, role })
    });

    const data = await res.json();

    if (res.ok && data.user_id) {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("role", data.role);

        window.location.href = data.role === "seller" ? "/seller" : "/";
    } else {
        alert(data.error || "Signup failed");
    }
}

async function login() {
    const username = document.getElementById("username")?.value;
    const role = document.getElementById("role")?.value;

    if (!username || !role) {
        alert("Fill all fields");
        return;
    }

    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
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
        window.location.href = "/seller";
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
            window.location.href = "/seller";
        } else {
            window.location.href = "/";
        }
    } else {
        alert(data.error || "Login failed");
    }
});

function checkout() {
    const form = document.getElementById("checkoutForm");

    form.style.display = "block";

    window.scrollTo({
        top: form.offsetTop,
        behavior: "smooth"
    });
}

async function placeOrder() {
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
}

async function loadOrders() {
    const container = document.getElementById("orders-container");
    if (!container) return;

    const user_id = localStorage.getItem("user_id");

    if (!user_id) {
        container.innerHTML = "<p>Please login to view orders</p>";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/orders/${user_id}`);

        if (!res.ok) {
            container.innerHTML = "<p>Failed to load orders</p>";
            return;
        }

        const orders = await res.json();

        if (orders.length === 0) {
            container.innerHTML = "<p>No orders yet</p>";
            return;
        }

        container.innerHTML = ""; // reset

orders.forEach(order => {
    container.innerHTML += `
    <div class="order-card">

        <div class="order-left">
            <img 
                src="${order.image_url || 'https://via.placeholder.com/100'}"
                onerror="this.src='https://via.placeholder.com/100'"
            >

            <div class="order-details">
                <h4>${order.product_name || "Product"}</h4>
                <p>Quantity: ${order.quantity}</p>
                <p class="order-price">₹${order.total_price}</p>
            </div>
        </div>

        <div class="order-right">
            <span class="status ${order.order_status.toLowerCase()}">
                ${order.order_status}
            </span>
            <p class="order-date">
                ${order.order_date ? new Date(order.order_date).toLocaleString() : ""}
            </p>
        </div>

    </div>
    `;
});
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Something went wrong</p>";
    }
}

async function loadUserDetails() {
    const user_id = localStorage.getItem("user_id");

    const res = await fetch(`${BASE_URL}/user/${user_id}`);
    const user = await res.json();

    if (user.phone && document.getElementById("phone")) {
    document.getElementById("phone").value = user.phone;
}

if (user.address && document.getElementById("address")) {
    document.getElementById("address").value = user.address;
}
}
function simulatePayment(method) {
    return new Promise((resolve) => {

        showToast("Redirecting to payment...");

        setTimeout(() => {
            if (method === "upi") {
                showToast("Approve payment in UPI app...");
            } else if (method === "card") {
                showToast("Processing card...");
            }

            setTimeout(() => {
                const success = true; // always success for now

                if (success) {
                    showToast("Payment successful ✅");
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 1500);

        }, 1000);
    });
}

function loadSlider() {
    const container = document.getElementById("slides");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!container) return;

    const cards = document.querySelectorAll(".product-card");
    if (!cards.length) return;

    let slides = [];

    // ===== 1. LAST PURCHASE (if exists)
    if (user && user.last_item_purchased) {
        const match = [...cards].find(card => {
            return card.querySelector(".add-to-cart")?.dataset.productId == user.last_item_purchased;
        });

        if (match) {
            slides.push(buildSlide(match, "Your Last Purchase"));
        }
    }

    // ===== 2. TOP RATED PRODUCT
    const topRated = [...cards].sort((a, b) => {
        return (b.dataset.rating || 0) - (a.dataset.rating || 0);
    })[0];

    if (topRated) {
        slides.push(buildSlide(topRated, "Top Rated"));
    }

    // ===== 3. RANDOM PRODUCTS (fill remaining)
    for (let i = 0; i < cards.length && slides.length < 4; i++) {
        slides.push(buildSlide(cards[i], "Recommended"));
    }

    container.innerHTML = slides.join("");

    setupDots(slides.length);
    startSlider();
    addSwipe();
}

function buildSlide(card, label) {
    const name = card.querySelector("h3")?.innerText;
    const img = card.querySelector("img")?.src;
    const btn = card.querySelector(".add-to-cart");
    const id = btn ? btn.getAttribute("data-product-id") : null;

    if (!id) {
        console.error("Missing product ID in slide");
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
}

function startSlider() {
    clearInterval(sliderInterval);
    sliderInterval = setInterval(nextSlide, 4000);
}

function setupDots(count) {
    const dotsContainer = document.getElementById("sliderDots");
    if (!dotsContainer) return;

    let html = "";

    for (let i = 0; i < count; i++) {
        html += `<span class="dot" onclick="goToSlide(${i})"></span>`;
    }

    dotsContainer.innerHTML = html;
    updateDots();
}
function goToSlide(index) {
    const container = document.getElementById("slides");

    currentIndex = index;
    container.style.transform = `translateX(-${index * 100}%)`;

    updateDots();
}
function updateDots() {
    document.querySelectorAll(".dot").forEach((d, i) => {
        d.classList.toggle("active", i === currentIndex);
    });
}
function addSwipe() {
    let startX = 0;

    const slider = document.getElementById("slider");

    slider.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
    });

    slider.addEventListener("touchend", (e) => {
        let endX = e.changedTouches[0].clientX;

        if (startX - endX > 50) nextSlide();
        if (endX - startX > 50) prevSlide();
    });
}
function getCategoryImage(category) {
    const map = {
        mobiles: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
        computers: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
        audio: "https://images.unsplash.com/photo-1518441902117-8f4b8b8b0d64",
        tvs: "https://images.unsplash.com/photo-1593784991095-a205069470b6",
        cameras: "https://images.unsplash.com/photo-1519183071298-a2962be96a4c"
    };
    return map[category?.toLowerCase()] || "https://picsum.photos/900/300";
}
function addToCart(productId) {
    const user_id = localStorage.getItem("user_id");

    if (!user_id) {
        showToast("Login required");
        return;
    }

    fetch(`${BASE_URL}/add_to_cart`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: user_id,
            product_id: productId,
            quantity: 1
        })
    })
    .then(res => res.json())
    .then(() => {
        showToast("Added to cart ✅");
        loadCart();
    })
    .catch(err => {
        console.error(err);
        showToast("Failed to add ❌");
    });
}