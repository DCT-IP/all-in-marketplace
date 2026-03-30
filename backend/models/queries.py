# models/queries.py

from db import get_connection
from decimal import Decimal

# ---------------- PRODUCTS ----------------
def get_all_products():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()

    cursor.close()
    conn.close()

    cleaned = []
    for p in products:
        p["price"] = float(p["price"]) if p["price"] else 0
        p["rating"] = float(p["rating"]) if p["rating"] else 0
        p["discount_percent"] = p["discount_percent"] or 0
        p["stock"] = p["stock"] or 0
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
        SELECT COUNT(*) AS total_products
        FROM products
        WHERE seller_id = %s
    """, (seller_id,))

    stats = cursor.fetchone()

    cursor.close()
    conn.close()
    return stats


def get_seller_products(seller_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT * FROM products
        WHERE seller_id = %s
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
        SELECT o.order_id, o.product_id, o.quantity, o.total_price,
               o.order_status, o.order_date,
               p.product_name
        FROM orders o
        JOIN products p ON o.product_id = p.product_id
        WHERE o.user_id = %s
        ORDER BY o.order_date DESC
    """, (user_id,))

    data = cursor.fetchall()

    cursor.close()
    conn.close()
    return data


def process_checkout(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 🔒 Lock rows to prevent race conditions
        cursor.execute("""
            SELECT sc.product_id, sc.quantity, sc.price_at_addition, p.stock
            FROM shopping_cart sc
            JOIN products p ON sc.product_id = p.product_id
            WHERE sc.user_id = %s
            FOR UPDATE
        """, (user_id,))

        items = cursor.fetchall()

        if not items:
            return {"status": "error", "message": "Cart is empty"}

        # ✅ STOCK VALIDATION
        for item in items:
            if item["quantity"] > item["stock"]:
                return {
                    "status": "error",
                    "message": f"Insufficient stock for product {item['product_id']}"
                }

        # ✅ CREATE ORDERS + UPDATE STOCK
        for item in items:
            price = item["price_at_addition"]

            # FIX: Decimal safe multiplication
            if not isinstance(price, Decimal):
                price = Decimal(price)

            total = price * item["quantity"]

            cursor.execute("""
                INSERT INTO orders (user_id, product_id, quantity, total_price)
                VALUES (%s, %s, %s, %s)
            """, (
                user_id,
                item["product_id"],
                item["quantity"],
                float(total)   # MySQL safe
            ))

            cursor.execute("""
                UPDATE products
                SET stock = stock - %s
                WHERE product_id = %s
            """, (
                item["quantity"],
                item["product_id"]
            ))
            # ✅ CLEAR CART
        cursor.execute("""
            DELETE FROM shopping_cart WHERE user_id = %s
        """, (user_id,))

        conn.commit()

        return {"status": "success"}

    except Exception as e:
        conn.rollback()
        print("CHECKOUT ERROR:", e)
        return {"status": "error", "message": str(e)}

    finally:
        cursor.close()
        conn.close()