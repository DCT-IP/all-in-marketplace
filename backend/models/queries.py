from db import get_cursor


# ---------------- USERS ----------------
def get_all_users():
    db, cursor = get_cursor()
    try:
        cursor.execute("SELECT * FROM users")
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()


def add_user(username, role):
    db, cursor = get_cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, role) VALUES (%s, %s)",
            (username, role)
        )
        db.commit()
    finally:
        cursor.close()
        db.close()


def get_user(username, role):
    db, cursor = get_cursor()
    try:
        cursor.execute(
            """
            SELECT * FROM users
            WHERE LOWER(username) = LOWER(%s) AND role = %s
            """,
            (username, role)
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        db.close()


# ---------------- PRODUCTS ----------------
def get_all_products():
    db, cursor = get_cursor()
    try:
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()

        for p in products:
            p['price'] = float(p['price'])
            p['discount_percent'] = float(p.get('discount_percent') or 0)
            p['rating'] = float(p.get('rating') or 0)

        return products
    finally:
        cursor.close()
        db.close()


# ---------------- CART ----------------
def get_cart(user_id):
    db, cursor = get_cursor()
    try:
        cursor.execute("""
            SELECT c.product_id, p.product_name AS name,
                   c.quantity, c.price_at_addition
            FROM shopping_cart c
            JOIN products p ON c.product_id = p.product_id
            WHERE c.user_id = %s
        """, (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()


def add_to_cart(user_id, product_id, quantity):
    db, cursor = get_cursor()
    try:
        # get product price
        cursor.execute(
            "SELECT price FROM products WHERE product_id = %s",
            (product_id,)
        )
        price = cursor.fetchone()["price"]

        # check if already exists
        cursor.execute(
            """
            SELECT * FROM shopping_cart
            WHERE user_id = %s AND product_id = %s
            """,
            (user_id, product_id)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                """
                UPDATE shopping_cart
                SET quantity = quantity + %s
                WHERE user_id = %s AND product_id = %s
                """,
                (quantity, user_id, product_id)
            )
        else:
            cursor.execute(
                """
                INSERT INTO shopping_cart (user_id, product_id, quantity, price_at_addition)
                VALUES (%s, %s, %s, %s)
                """,
                (user_id, product_id, quantity, price)
            )

        db.commit()
    finally:
        cursor.close()
        db.close()


def update_cart(user_id, product_id, change):
    db, cursor = get_cursor()
    try:
        cursor.execute(
            """
            UPDATE shopping_cart
            SET quantity = quantity + %s
            WHERE user_id = %s AND product_id = %s
            """,
            (change, user_id, product_id)
        )

        # remove if quantity <= 0
        cursor.execute(
            """
            DELETE FROM shopping_cart
            WHERE user_id = %s AND product_id = %s AND quantity <= 0
            """,
            (user_id, product_id)
        )

        db.commit()
    finally:
        cursor.close()
        db.close()


def remove_from_cart(user_id, product_id):
    db, cursor = get_cursor()
    try:
        cursor.execute(
            """
            DELETE FROM shopping_cart
            WHERE user_id = %s AND product_id = %s
            """,
            (user_id, product_id)
        )
        db.commit()
    finally:
        cursor.close()
        db.close()


# ---------------- SELLER ----------------
def get_seller_products(seller_id):
    db, cursor = get_cursor()
    try:
        cursor.execute(
            """
            SELECT product_name, price, stock, rating, reviews, discount_percent
            FROM products
            WHERE seller_id = %s
            """,
            (seller_id,)
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()


def get_seller_stats(seller_id):
    db, cursor = get_cursor()
    try:
        cursor.execute("""
            SELECT COUNT(*) AS total_products
            FROM products
            WHERE seller_id = %s
        """, (seller_id,))
        total_products = cursor.fetchone()["total_products"]

        cursor.execute("""
            SELECT COUNT(*) AS total_orders
            FROM orders o
            JOIN products p ON o.product_id = p.product_id
            WHERE p.seller_id = %s
        """, (seller_id,))
        total_orders = cursor.fetchone()["total_orders"]

        return {
            "total_products": total_products,
            "total_orders": total_orders
        }

    finally:
        cursor.close()
        db.close()