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
    owner_code CHAR(3) PRIMARY KEY CHECK (owner_code ~ '^[A-Z]{3}$'), -- Mã 3 chữ cái làm khóa chính
    name VARCHAR(255) NOT NULL -- Tên chủ sở hữu
);


CREATE TABLE containers (
    id SERIAL PRIMARY KEY, -- ID tự động tăng
    container_code VARCHAR(20) NOT NULL CHECK (container_code ~ '^[A-Z]{4}[0-9]{7}$'), -- Mã container
    size VARCHAR(10) NOT NULL, -- Kích cỡ container
    owner_code CHAR(3) REFERENCES container_owners(owner_code) -- Liên kết với bảng container_owners qua owner_code
);

CREATE TABLE container_transactions (
    id SERIAL PRIMARY KEY,
    container_id INT REFERENCES containers(id),
    company_id INT REFERENCES companies(id),
    transporter_id INT REFERENCES transporters(id),
    pickup_location_id INT REFERENCES locations(id),
    dropoff_location_id INT REFERENCES locations(id),
    transaction_date DATE NOT NULL
);