const BASE_URL = "http://127.0.0.1:5000";

const seller_id = localStorage.getItem("user_id");

if (!seller_id) {
    window.location.href = "/login";
}

fetch(`${BASE_URL}/seller/${seller_id}`)
.then(res => res.json())
.then(data => {

    // ===== STATS =====
    document.getElementById("total_products").innerText = data.stats.total_products || 0;
    document.getElementById("total_orders").innerText = data.stats.total_orders || 0;
    document.getElementById("total_revenue").innerText = "₹" + (data.stats.total_revenue || 0);

    // ===== PRODUCTS =====
    const container = document.getElementById("seller_products");
    container.innerHTML = "";

    data.products.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";

        div.innerHTML = `
            <h4>${p.product_name}</h4>
            <p class="price">₹${p.price}</p>
            <p>Stock: ${p.stock}</p>
            <p>Sold: ${p.total_units_sold || 0}</p>
        `;

        container.appendChild(div);
    });

    // ===== CHART =====
    
    renderRevenueChart(data.daily_revenue);
    if (!data || data.length === 0) {
    document.getElementById("topProductsChart").parentElement.innerHTML =
        "<p>No sales data yet</p>";
    return;
}
    renderTopProductsChart(data.top_products);
});


/* ===== CHART FUNCTION ===== */
let revenueChartInstance = null;

function renderRevenueChart(data) {
    const labels = data.map(item => item.day);
    const values = data.map(item => item.revenue);

    const ctx = document.getElementById("revenueChart").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Revenue",
                data: values,
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true
        }
    });
}

let topChart = null;

function renderTopProductsChart(data) {
    const labels = data.map(p => p.product_name);
    const values = data.map(p => Number(p.sold));

    const ctx = document.getElementById("topProductsChart").getContext("2d");

    if (topChart) topChart.destroy();

    topChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Units Sold",
                data: values,
                borderWidth: 1
            }]
        }
    });
}

function loadSlider() {
    const user = JSON.parse(localStorage.getItem("user"));

    fetch("/products")
    .then(res => res.json())
    .then(products => {

        let slides = []; // use array instead of string (easier control)

        // 🔹 1. Last purchased (if logged in)
        if (user && user.last_item_purchased) {
            const last = products.find(p => p.product_id == user.last_item_purchased);

            if (last) {
                slides.push(`
                <div class="slide">
                    <img src="${last.image_url || 'https://picsum.photos/900/300'}">
                    <div class="slide-content">
                        <h2>${last.product_name}</h2>
                        <p>Recently Purchased</p>
                    </div>
                </div>`);
            }
        }

        // 🔹 2. Top rated product
        const sorted = [...products].sort((a,b) => (b.rating || 0) - (a.rating || 0));
        const top = sorted[0];

        if (top) {
            slides.push(`
            <div class="slide">
                <img src="${top.image_url || 'https://picsum.photos/900/300'}">
                <div class="slide-content">
                    <h2>${top.product_name}</h2>
                    <p>Top Rated ⭐ ${top.rating || 4}</p>
                </div>
            </div>`);
        }

        // 🔹 3. Ensure minimum slides (fix for seller / low data cases)
        if (slides.length < 3) {
            sorted.slice(0, 3).forEach(p => {
                if (slides.length >= 3) return;

                slides.push(`
                <div class="slide">
                    <img src="${p.image_url || 'https://picsum.photos/900/300'}">
                    <div class="slide-content">
                        <h2>${p.product_name}</h2>
                        <p>Featured Product</p>
                    </div>
                </div>`);
            });
        }

        // 🔹 4. Absolute fallback (never empty)
        if (slides.length === 0) {
            slides.push(`
            <div class="slide">
                <img src="https://picsum.photos/900/300">
                <div class="slide-content">
                    <h2>Welcome to OneStop</h2>
                </div>
            </div>`);
        }

        // 🔹 render slides
        document.getElementById("slides").innerHTML = slides.join("");

        startSlider(); // start movement AFTER DOM update
    })
    .catch(err => console.error("Slider error:", err));
}

function startSlider() {
    let index = 0;
    const slides = document.querySelectorAll(".slide");

    setInterval(() => {
        slides.forEach(s => s.style.display = "none");
        slides[index].style.display = "block";
        index = (index + 1) % slides.length;
    }, 3000);
}
function nextSlide() {
    const slides = document.querySelectorAll(".slide");
    currentIndex = (currentIndex + 1) % slides.length;
    document.getElementById("slides").style.transform =
        `translateX(-${currentIndex * 100}%)`;
}

function prevSlide() {
    const slides = document.querySelectorAll(".slide");
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    document.getElementById("slides").style.transform =
        `translateX(-${currentIndex * 100}%)`;
}
/* ===== DARK MODE ===== */
function toggleTheme() {
    document.body.classList.toggle("dark");
}