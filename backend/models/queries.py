# models/queries.py

from db import get_connection
from decimal import Decimal

# ---------------- PRODUCTS ----------------
def get_all_products():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            product_id,
            product_name,
            product_description,
            price,
            stock,
            category,
            product_condition,
            IFNULL(image_url, '') AS image_url,
            IFNULL(rating, 0) AS rating,
            IFNULL(reviews, 0) AS reviews,
            IFNULL(discount_percent, 0) AS discount_percent
        FROM products
    """)

    products = cursor.fetchall()

    cursor.close()
    conn.close()

    cleaned = []
    for p in products:
        p["price"] = float(p["price"]) if p["price"] is not None else 0
        p["rating"] = float(p["rating"]) if p["rating"] is not None else 0
        p["discount_percent"] = int(p["discount_percent"]) if p["discount_percent"] is not None else 0
        p["stock"] = int(p["stock"]) if p["stock"] is not None else 0

        # ✅ FIX: image fallback (VERY IMPORTANT)
        if not p["image_url"]:
            p["image_url"] = "https://source.unsplash.com/200x150/?product"

        cleaned.append(p)

    return cleaned


# ---------------- USERS ----------------
def get_user(username, role):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT user_id, username, role
        FROM users
        WHERE email = %s AND role = %s
    """, (username, role))

    user = cursor.fetchone()

    cursor.close()
    conn.close()
    return user


def add_user(name, username, role):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # check duplicate email
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (username,))
        if cursor.fetchone():
            return None

        cursor.execute("""
            INSERT INTO users (username, email, role)
            VALUES (%s, %s, %s)
        """, (username.split("@")[0], username, role))

        conn.commit()
        return cursor.lastrowid

    except Exception as e:
        conn.rollback()
        print("ADD USER ERROR:", e)
        return None

    finally:
        cursor.close()
        conn.close()

# ---------------- CART ----------------
def get_cart(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT sc.product_id, sc.quantity, sc.price_at_addition,
               p.product_name, p.image_url
        FROM shopping_cart sc
        JOIN products p ON sc.product_id = p.product_id
        WHERE sc.user_id = %s
    """, (user_id,))

    data = cursor.fetchall()

    cursor.close()
    conn.close()
    return data


def add_to_cart(user_id, product_id, quantity):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT quantity FROM shopping_cart
            WHERE user_id = %s AND product_id = %s
        """, (user_id, product_id))

        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
                UPDATE shopping_cart
                SET quantity = quantity + %s
                WHERE user_id = %s AND product_id = %s
            """, (quantity, user_id, product_id))
        else:
            cursor.execute("""
                SELECT price FROM products WHERE product_id = %s
            """, (product_id,))
            price_row = cursor.fetchone()

            if not price_row:
                raise Exception("Product not found")

            price = price_row[0]

            cursor.execute("""
                INSERT INTO shopping_cart (user_id, product_id, quantity, price_at_addition)
                VALUES (%s, %s, %s, %s)
            """, (user_id, product_id, quantity, price))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("ADD TO CART ERROR:", e)

    finally:
        cursor.close()
        conn.close()


def update_cart(user_id, product_id, change):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE shopping_cart
            SET quantity = quantity + %s
            WHERE user_id = %s AND product_id = %s
        """, (change, user_id, product_id))

        cursor.execute("""
            DELETE FROM shopping_cart
            WHERE user_id = %s AND product_id = %s AND quantity <= 0
        """, (user_id, product_id))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("UPDATE CART ERROR:", e)

    finally:
        cursor.close()
        conn.close()


def remove_from_cart(user_id, product_id):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            DELETE FROM shopping_cart
            WHERE user_id = %s AND product_id = %s
        """, (user_id, product_id))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("REMOVE CART ERROR:", e)

    finally:
        cursor.close()
        conn.close()


# ---------------- SELLER ----------------
def get_seller_stats(seller_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
    SELECT 
    COUNT(DISTINCT p.product_id) AS total_products,
    SUM(o.total_price) AS total_revenue,
    COUNT(o.order_id) AS total_orders,
    AVG(o.total_price) AS avg_order_value
FROM products p
LEFT JOIN orders o ON p.product_id = o.product_id
WHERE p.seller_id = %s;
""", (seller_id,))

    stats = cursor.fetchone()

    cursor.close()
    conn.close()
    return stats


def get_top_products(seller_id, limit=5):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT p.product_name, SUM(o.quantity) AS sold
        FROM orders o
        JOIN products p ON o.product_id = p.product_id
        WHERE p.seller_id = %s
        GROUP BY p.product_id
        ORDER BY sold DESC
        LIMIT %s;
    """, (seller_id, limit))  

    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data


def place_order_sp(user_id, product_id, qty, phone, address):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.callproc("place_order_procedure", (
            user_id, product_id, qty, phone, address
        ))
        conn.commit()
        return {"status": "success"}

    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}

    finally:
        cursor.close()
        conn.close()


def get_daily_revenue(seller_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            DATE(o.order_date) AS day,
            SUM(o.total_price) AS revenue
        FROM orders o
        JOIN products p ON o.product_id = p.product_id
        WHERE p.seller_id = %s
        GROUP BY day
        ORDER BY day
    """, (seller_id,))

    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data


def get_seller_products(seller_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
    SELECT 
        p.product_id,
        p.product_name,
        p.price,
        p.stock,
        p.category,
        p.condition_type,   -- ✅ ADD THIS
        COUNT(o.order_id) AS total_orders,
        COALESCE(SUM(o.quantity), 0) AS total_units_sold
    FROM products p
    LEFT JOIN orders o ON p.product_id = o.product_id
    WHERE p.seller_id = %s
    GROUP BY 
        p.product_id,
        p.product_name,
        p.price,
        p.stock,
        p.category,
        p.condition_type
    ORDER BY total_units_sold DESC
""", (seller_id,))

    data = cursor.fetchall()

    cursor.close()
    conn.close()
    return data


# ---------------- ORDERS ----------------
def get_orders(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
    o.order_id,
    o.quantity,
    o.total_price,
    o.order_status,
    o.order_date,
    p.product_name,
    p.image_url,
    p.price,
    u.username
FROM orders o
JOIN products p ON o.product_id = p.product_id
JOIN users u ON o.user_id = u.user_id
WHERE o.user_id = %s
ORDER BY o.order_date DESC
    """, (user_id, user_id))

    data = cursor.fetchall()

    cursor.close()
    conn.close()
    return data

def get_orders_by_user(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            o.order_id,
            o.product_id,
            o.quantity,
            o.total_price,
            o.order_status,
            o.order_date,
            p.product_name,
            p.image_url
        FROM orders o
        JOIN products p ON o.product_id = p.product_id
        WHERE o.user_id = %s
        ORDER BY o.order_date DESC
    """, (user_id,))

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data

def process_checkout(user_id, phone, address, payment_method):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # update user details FIRST
        cursor.execute("""
            UPDATE users
            SET phone = %s, address = %s
            WHERE user_id = %s
        """, (phone, address, user_id))

        # get cart
        cursor.execute("""
            SELECT sc.product_id, sc.quantity, sc.price_at_addition, p.stock
            FROM shopping_cart sc
            JOIN products p ON sc.product_id = p.product_id
            WHERE sc.user_id = %s
        """, (user_id,))
        items = cursor.fetchall()

        if not items:
            conn.commit()
            return {"status": "error", "message": "Cart is empty"}
        order_status = f"Placed ({payment_method.upper()})"
        # stock check
        for item in items:
            if item["quantity"] > item["stock"]:
                return {
                    "status": "error",
                    "message": f"Insufficient stock for product {item['product_id']}"
                }
            
        # insert orders
        for item in items:
            total = item["quantity"] * float(item["price_at_addition"])

            cursor.execute("""
                INSERT INTO orders (user_id, product_id, quantity, total_price, phone, address, order_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                item["product_id"],
                item["quantity"],
                total,
                phone,
                address,
                order_status
            ))

            # cursor.execute("""
            #     UPDATE products
            #     SET stock = stock - %s
            #     WHERE product_id = %s
            # """, (item["quantity"], item["product_id"]))

        # clear cart
        cursor.execute("DELETE FROM shopping_cart WHERE user_id = %s", (user_id,))

        conn.commit()
        return {"status": "success"}

    except Exception as e:
        conn.rollback()
        print("CHECKOUT ERROR:", e)
        return {"status": "error", "message": str(e)}

    finally:
        cursor.close()
        conn.close()

def get_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT user_id, username, role, phone, address
        FROM users
        WHERE user_id = %s
    """, (user_id,))

    user = cursor.fetchone()

    cursor.close()
    conn.close()
    return user

def get_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT user_id, username, role, phone, address
        FROM users
        WHERE user_id = %s
    """, (user_id,))

    user = cursor.fetchone()

    cursor.close()
    conn.close()
    return user