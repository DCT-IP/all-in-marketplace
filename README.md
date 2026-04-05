# One-Stop Marketplace (DBMS Project)

## Overview
This project is a database-driven electronic marketplace system that allows users to browse products, manage a shopping cart, and perform transactions.
It demonstrates core DBMS concepts such as normalization, relationships, and database-driven application design.

---

## Tech Stack
- Backend: Python (Flask)
- Database: MySQL
- Frontend: HTML, CSS (Templates)

---

## Database Features
- Relational schema with multiple tables
- Foreign key constraints for data integrity
- Normalized design (up to 3NF)
- Sample data for testing
- Triggers and procedures (optional enhancements)

---

## Setup Instructions

### 1. Install dependencies
pip install -r requirements.txt

### 2. Setup MySQL Database
-- Open MySQL Workbench or any MySQL client
CREATE DATABASE marketplace;
USE marketplace;

-- Execute the SQL scripts:
-- schema.sql creates tables, constraints, and procedures
-- sample_data.sql populates initial data

### 3. Configure Database Connection
Database credentials are stored in db.py:

# db.py
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "your_password"
DB_NAME = "marketplace"

def get_connection():
    import mysql.connector
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

### 4. Run the Application
python backend/app.py

Open your browser at: http://127.0.0.1:5000

---

## Features
- User authentication and roles (buyer/seller)
- Product browsing, search, and filtering
- Shopping cart (add/update/remove)
- Checkout and order management
- Seller dashboard with stats and top products
- Database-driven dynamic rendering
- Modern UI with glassmorphism

---

## Sample Queries
SELECT * FROM users;
SELECT * FROM products;

SELECT u.username, p.product_name
FROM users u
JOIN orders o ON u.user_id = o.user_id
JOIN products p ON o.product_id = p.product_id;

---

## Made by
- Dheeman Thakur - 240957082 - [DCT-IP](https://github.com/dheemanthakur45) - dheemanchaitanyathakur@gmail.com 
- Sreevatsa Rajesh - 240957021
- Aryan Utekar - 240957086