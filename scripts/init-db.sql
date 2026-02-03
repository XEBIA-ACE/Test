-- Initialize database for Order Management Service
-- This script is executed when the MySQL container starts

CREATE DATABASE IF NOT EXISTS orderdb;

USE orderdb;

-- Grant privileges to orderuser
GRANT ALL PRIVILEGES ON orderdb.* TO 'orderuser'@'%';
FLUSH PRIVILEGES;
