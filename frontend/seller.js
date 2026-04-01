const BASE_URL = "http://127.0.0.1:5000";

const seller_id = localStorage.getItem("user_id") || 2;

fetch(`${BASE_URL}/seller/${seller_id}`)
.then(res => res.json())
.then(data => {

    // stats
    document.getElementById("total_products").innerText = data.stats.total_products;
    document.getElementById("total_orders").innerText = data.stats.total_orders;
    document.getElementById("total_revenue").innerText = data.stats.total_revenue;

    // products
    const container = document.getElementById("seller_products");
container.innerHTML = "";

data.products.forEach(p => {
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
        <img src="${p.image_url || 'https://via.placeholder.com/150'}" />

        <h4>${p.product_name}</h4>

        <p class="price">₹${p.price}</p>
        <p>Stock: ${p.stock}</p>

        <span class="tag ${p.condition_type}">
            ${p.condition_type}
        </span>

        <p class="sales">Sold: ${p.total_units_sold}</p>
    `;

    container.appendChild(div);
});
});

function toggleDarkMode() {
    document.body.classList.toggle("dark");
}

document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
    });
});