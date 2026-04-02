-- ================= CLEAN START =================
DROP TRIGGER IF EXISTS check_stock_before_order;
DROP TRIGGER IF EXISTS reduce_stock_after_order;
DROP TRIGGER IF EXISTS update_last_purchase;

DELIMITER $$

-- ================= STOCK CHECK (SAFE) =================
CREATE TRIGGER check_stock_before_order
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    DECLARE stock_val INT;

    SELECT stock INTO stock_val
    FROM products
    WHERE product_id = NEW.product_id;

    IF stock_val IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Product does not exist';
    END IF;

    IF stock_val < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock!';
    END IF;
END$$

-- ================= UPDATE LAST PURCHASE =================
CREATE TRIGGER update_last_purchase
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    UPDATE users
    SET last_item_purchased = NEW.product_id
    WHERE user_id = NEW.user_id;
END$$

DELIMITER ;

-- ================= REDUCE STOCK (UNSAFE) =================
DELIMITER $$

CREATE TRIGGER reduce_stock_after_order
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    UPDATE products
    SET stock = stock - NEW.quantity
    WHERE product_id = NEW.product_id;
END$$

DELIMITER ;

