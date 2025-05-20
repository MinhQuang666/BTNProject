<<<<<<< HEAD
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS container_transactions;
DROP TABLE IF EXISTS containers;
DROP TABLE IF EXISTS container_owners;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS transporters;
DROP TABLE IF EXISTS companies;

=======
DROP TABLE companies;
DROP TABLE transporters;
DROP TABLE locations;
DROP TABLE containers;
DROP TABLE container_transactions;
DROP TABLE container_owners;
SELECT * FROM containers
SELECT * FROM transporters;
SELECT * FROM locations;
SELECT * FROM container_owners;
>>>>>>> a5600f063d4a65bcf194a8c01345c4274462a3d9
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE transporters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(70) NOT NULL
);

CREATE TABLE locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255)
);

CREATE TABLE container_owners (
<<<<<<< HEAD
    owner_code CHAR(3) PRIMARY KEY CHECK (owner_code ~ '^[A-Z]{3}$'),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE containers (
    id SERIAL PRIMARY KEY,
    container_code VARCHAR(20) NOT NULL CHECK (container_code ~ '^[A-Z]{4}[0-9]{7}$'),
    size VARCHAR(10) NOT NULL,
    owner_code CHAR(3) REFERENCES container_owners(owner_code)
=======
    owner_code CHAR(3) PRIMARY KEY CHECK (owner_code ~ '^[A-Z]{3}$'), -- Mã 3 chữ cái làm khóa chính
    name VARCHAR(255) NOT NULL -- Tên chủ sở hữu
);


CREATE TABLE containers (
    id SERIAL PRIMARY KEY, -- ID tự động tăng
    container_code VARCHAR(20) NOT NULL CHECK (container_code ~ '^[A-Z]{4}[0-9]{7}$'), -- Mã container
    size VARCHAR(10) NOT NULL, -- Kích cỡ container
    owner_code CHAR(3) REFERENCES container_owners(owner_code) -- Liên kết với bảng container_owners qua owner_code
>>>>>>> a5600f063d4a65bcf194a8c01345c4274462a3d9
);

CREATE TABLE container_transactions (
    id SERIAL PRIMARY KEY,
    container_id INT REFERENCES containers(id),
    company_id INT REFERENCES companies(id),
<<<<<<< HEAD
    transporter_id VARCHAR(50) REFERENCES transporters(id),
    pickup_location_id VARCHAR(50) REFERENCES locations(id),
    dropoff_location_id VARCHAR(50) REFERENCES locations(id),
    transaction_date DATE NOT NULL
);

CREATE TABLE bookings (
    booking_no VARCHAR(50) PRIMARY KEY,
    pickup_date DATE NOT NULL,
    company_id INT REFERENCES companies(id) NOT NULL,
    transporter_id VARCHAR(50) REFERENCES transporters(id) NOT NULL,
    container_id INT REFERENCES containers(id) NOT NULL,
    seal VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    size VARCHAR(10) NOT NULL,
    pickup_location VARCHAR(255),
    dropoff_location VARCHAR(255)
);

-- Xem dữ liệu mẫu
SELECT * FROM companies;
SELECT * FROM transporters;
SELECT * FROM locations;
SELECT * FROM container_owners;
SELECT * FROM containers;
SELECT * FROM container_transactions;
SELECT * FROM bookings;
=======
    transporter_id INT REFERENCES transporters(id),
    pickup_location_id INT REFERENCES locations(id),
    dropoff_location_id INT REFERENCES locations(id),
    transaction_date DATE NOT NULL
);
>>>>>>> a5600f063d4a65bcf194a8c01345c4274462a3d9
