CREATE DATABASE IF NOT EXISTS gyms_api;
USE gyms_api;

CREATE TABLE IF NOT EXISTS gyms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    monthlyFee DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    gym_id INT NOT NULL,
    FOREIGN KEY (gym_id) REFERENCES gyms(id)
);

CREATE TABLE IF NOT EXISTS memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    gym_id INT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE,
    trainer_id INT,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (gym_id) REFERENCES gyms(id),
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

