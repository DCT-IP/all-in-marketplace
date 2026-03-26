from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

# IMPORT QUERIES
from models.queries import (
    get_all_products,
    get_user,
    get_cart,
    add_to_cart,
    update_cart,
    remove_from_cart,
    get_seller_stats,
    get_seller_products
)

app = Flask(__name__,
            template_folder='../frontend',
            static_folder='../frontend')
CORS(app)


# ---------------- HOME ----------------
@app.route('/')
def home():
    products = get_all_products()
    return render_template('index.html', products=products)


# ---------------- LOGIN ----------------
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')

    data = request.json
    username = data.get("username")
    role = data.get("role")

    user = get_user(username, role)

    if user:
        user_id = user.get("user_id") or user.get("id")
        return jsonify({ "user_id": user_id,"role": user.get("role")})

    return jsonify({"error": "Invalid credentials"}), 401


# ---------------- CART PAGE ----------------
@app.route('/cart')
def cart_page():
    return render_template('cart.html')


# ---------------- CART APIs ----------------
@app.route('/cart/<int:user_id>')
def cart(user_id):
    return jsonify(get_cart(user_id))


@app.route('/add_to_cart', methods=['POST'])
def add_cart():
    data = request.json

    add_to_cart(
        data["user_id"],
        data["product_id"],
        data.get("quantity", 1)
    )

    return jsonify({"message": "added"})


@app.route('/update_cart', methods=['POST'])
def update_cart_api():
    data = request.json

    update_cart(
        data["user_id"],
        data["product_id"],
        data["change"]
    )
    return jsonify({"message": "updated"})

@app.route('/remove_from_cart', methods=['POST'])
def remove_cart_api():
    data = request.json
    remove_from_cart(
        data["user_id"],
        data["product_id"]
    )
    return jsonify({"message": "removed"})


# ---------------- DASHBOARD ----------------
@app.route('/dashboard/<int:user_id>')
def dashboard(user_id):
    return render_template('dashboard.html', user_id=user_id)


# ---------------- SELLER ----------------
@app.route('/seller/<int:seller_id>')
def seller(seller_id):
    stats = get_seller_stats(seller_id)
    products = get_seller_products(seller_id)

    return jsonify({
        "stats": stats,
        "products": products
    })


# ---------------- RUN ----------------
if __name__ == '__main__':
    app.run(debug=True)