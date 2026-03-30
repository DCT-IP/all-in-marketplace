-- ================= USERS =================
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    date_of_join DATE,
    last_item_purchased INT NULL,
    role ENUM('buyer', 'seller') DEFAULT 'buyer'
);

-- ================= PRODUCTS =================
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100),
    product_description TEXT,
    image_url TEXT,
    price DECIMAL(10,2),
    category VARCHAR(50),
    product_condition ENUM('new', 'refurbished'),
    stock INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    seller_id INT,
    FOREIGN KEY (seller_id) REFERENCES users(user_id)
);

-- ================= ORDERS =================
CREATE TABLE IF NOT EXISTS orders (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    product_id INT,
    user_id INT,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ================= SHOPPING CART =================
CREATE TABLE IF NOT EXISTS shopping_cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ================= SAFE UPDATES =================

-- ORDERS TABLE FIX
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='orders' AND COLUMN_NAME='quantity');

SET @sql := IF(@col=0, 
'ALTER TABLE orders ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER product_id', 
'SELECT "quantity exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='orders' AND COLUMN_NAME='total_price');

SET @sql := IF(@col=0, 
'ALTER TABLE orders ADD COLUMN total_price DECIMAL(10,2) NOT NULL AFTER quantity', 
'SELECT "total_price exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='orders' AND COLUMN_NAME='phone');

SET @sql := IF(@col=0, 
'ALTER TABLE orders ADD COLUMN phone VARCHAR(15)', 
'SELECT "phone exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='orders' AND COLUMN_NAME='address');

SET @sql := IF(@col=0, 
'ALTER TABLE orders ADD COLUMN address TEXT', 
'SELECT "address exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='orders' AND COLUMN_NAME='order_status');

SET @sql := IF(@col=0, 
'ALTER TABLE orders ADD COLUMN order_status ENUM("Pending","Completed") DEFAULT "Pending"', 
'SELECT "order_status exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='orders' AND COLUMN_NAME='order_date');

SET @sql := IF(@col=0, 
'ALTER TABLE orders ADD COLUMN order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 
'SELECT "order_date exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- SHOPPING CART FIX
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='shopping_cart' AND COLUMN_NAME='price_at_addition');

SET @sql := IF(@col=0, 
'ALTER TABLE shopping_cart ADD COLUMN price_at_addition DECIMAL(10,2) NOT NULL AFTER quantity', 
'SELECT "price_at_addition exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;