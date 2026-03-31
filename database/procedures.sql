DROP PROCEDURE IF EXISTS place_order;

DELIMITER $$

CREATE PROCEDURE place_order(
    IN p_user INT,
    IN p_product INT,
    IN p_quantity INT
)
BEGIN
    DECLARE price_val DECIMAL(10,2);

    -- get product price
    SELECT price INTO price_val
    FROM products
    WHERE product_id = p_product;

    -- insert order (trigger will handle last_item_purchased)
    INSERT INTO orders(user_id, product_id, quantity, total_price)
    VALUES (p_user, p_product, p_quantity, price_val * p_quantity);

END$$

DELIMITER ;