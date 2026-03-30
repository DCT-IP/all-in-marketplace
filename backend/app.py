from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from models.queries import *

app = Flask(
    __name__,
    template_folder='../frontend',
    static_folder='../frontend'
)
CORS(app)


@app.route('/')
def home():
    return render_template('index.html', products=get_all_products())


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return render_template("signup.html")

    data = request.get_json() or {}

    user_id = add_user(None, data.get("username"), data.get("role"))

    if not user_id:
        return jsonify({"error": "User already exists"}), 400

    return jsonify({
        "user_id": user_id,
        "role": data.get("role")
    })


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    data = request.get_json() or {}

    user = get_user(data.get("username"), data.get("role"))

    if user:
        return jsonify({
            "user_id": user["user_id"],
            "role": user["role"]
        })

    return jsonify({"error": "Invalid credentials"}), 401


@app.route('/cart')
def cart_page():
    return render_template('cart.html')


@app.route('/cart/<int:user_id>')
def cart(user_id):
    return jsonify(get_cart(user_id))


@app.route('/add_to_cart', methods=['POST'])
def add_cart():
    data = request.json
    add_to_cart(data["user_id"], data["product_id"], data.get("quantity", 1))
    return jsonify({"message": "added"})


@app.route('/update_cart', methods=['POST'])
def update_cart_api():
    data = request.json
    update_cart(data["user_id"], data["product_id"], data["change"])
    return jsonify({"message": "updated"})


@app.route('/remove_from_cart', methods=['POST'])
def remove_cart_api():
    data = request.json
    remove_from_cart(data["user_id"], data["product_id"])
    return jsonify({"message": "removed"})


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route('/seller/<int:seller_id>')
def seller(seller_id):
    return jsonify({
        "stats": get_seller_stats(seller_id),
        "products": get_seller_products(seller_id)
    })


@app.route("/orders/<int:user_id>")
def orders(user_id):
    return jsonify(get_orders(user_id))


@app.route("/checkout/<int:user_id>", methods=["POST"])
def checkout(user_id):
    result = process_checkout(user_id)
    
    if result["status"] == "error":
        return jsonify({"error": result["message"]}), 400

    return jsonify({"message": "Order placed successfully"})


if __name__ == '__main__':
    app.run(debug=True)