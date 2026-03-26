async function loadCart() {
    const userId = localStorage.getItem("user_id");

    const res = await fetch(`${BASE_URL}/cart/${userId}`);
    const data = await res.json();

    const container = document.getElementById("cartItems");
    container.innerHTML = "";

    let total = 0;

    data.forEach(item => {
        const price = item.price_at_addition;
        const subtotal = price * item.quantity;
        total += subtotal;

        container.innerHTML += `
        <div class="cart-item">

            <img src="https://via.placeholder.com/100">

            <div class="cart-details">
                <h4>${item.name}</h4>
                <p>₹${price}</p>

                <div class="quantity-controls">
                    <button onclick="updateQty(${item.product_id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQty(${item.product_id}, 1)">+</button>
                </div>
            </div>

            <button class="remove-btn" onclick="removeItem(${item.product_id})">❌</button>
        </div>
        `;
    });

    document.getElementById("totalPrice").innerText = total;
}