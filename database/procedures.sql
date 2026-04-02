DROP PROCEDURE IF EXISTS place_order_procedure;

-- ================= STORED PROCEDURE FOR PLACING ORDER =================

DELIMITER $$

CREATE PROCEDURE place_order_procedure(
    IN uid INT,
    IN pid INT,
    IN qty INT,
    IN phone_val VARCHAR(20),
    IN address_val TEXT
)
BEGIN
    DECLARE total DECIMAL(10,2);

    SELECT price * qty INTO total
    FROM products
    WHERE product_id = pid;

    INSERT INTO orders(user_id, product_id, quantity, total_price, phone, address, order_status)
    VALUES(uid, pid, qty, total, phone_val, address_val, 'Placed');
END$$

DELIMITER ;