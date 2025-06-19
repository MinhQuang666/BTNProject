DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS container_transactions;
DROP TABLE IF EXISTS containers;
DROP TABLE IF EXISTS container_owners;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS transporters;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS transport_companies;
DROP TABLE IF EXISTS booking_details;
DROP TABLE IF EXISTS xac_nhan;
DROP TABLE IF EXISTS trucks;


CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) 
);
CREATE TABLE transporters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(70)
);
CREATE TABLE locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    image_url VARCHAR(255)
);
CREATE TABLE container_owners (
    owner_code CHAR(3) PRIMARY KEY CHECK (owner_code ~ '^[A-Z]{3}$'),
    name VARCHAR(255)
);
CREATE TABLE containers (
    id SERIAL PRIMARY KEY, -- ID tự động tăng
    container_code VARCHAR(20) NOT NULL UNIQUE CHECK (container_code ~ '^[A-Z]{4}[0-9]{7}$'), -- Mã container, đảm bảo duy nhất
    size VARCHAR(10) NOT NULL, -- Kích cỡ container
    owner_code CHAR(3) REFERENCES container_owners(owner_code) -- Liên kết với bảng container_owners qua owner_code

);

CREATE TABLE trucks (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) NOT NULL UNIQUE, -- Biển số xe
    transporter_id VARCHAR(50) REFERENCES transporters(id) ON DELETE CASCADE, -- Nhà xe sở hữu
    model VARCHAR(100), -- Model xe (tùy chọn)
    driver_name VARCHAR(100), -- Tên tài xế (tùy chọn)
    note TEXT -- Ghi chú thêm
);
CREATE TABLE container_transactions (
    id SERIAL PRIMARY KEY,
    container_id INT REFERENCES containers(id),
    company_id INT REFERENCES companies(id),
    transporter_id VARCHAR(50) REFERENCES transporters(id),
    truck_id INT REFERENCES trucks(id), -- Liên kết với xe kéo
    pickup_location_id VARCHAR(50) REFERENCES locations(id),
    dropoff_location_id VARCHAR(50) REFERENCES locations(id),
    transaction_date DATE NOT NULL
);
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_no VARCHAR(50),
    pickup_date DATE NOT NULL,
    company_name VARCHAR(100) NOT NULL, -- Công ty khách hàng
    transporter_name VARCHAR(70) NOT NULL,
    invoice_company VARCHAR(100), -- Công ty làm hoá đơn (manual input)
    shipping_line VARCHAR(100), -- Hãng tàu (manual input)
    container_code VARCHAR(20) NOT NULL,
    seal VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    size VARCHAR(10) NOT NULL,
    pickup_location VARCHAR(255),
    dropoff_location VARCHAR(255),
    type VARCHAR(20),
    extra_fee VARCHAR(255), -- Chi phí phụ (ghi chú)
    CONSTRAINT fk_container_code FOREIGN KEY (container_code) REFERENCES containers(container_code)
);
CREATE TABLE booking_details (
    id SERIAL PRIMARY KEY,
    booking_no VARCHAR(50),
    pickup_date DATE NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    transporter_name VARCHAR(70) NOT NULL,
    invoice_company VARCHAR(100), 
    shipping_line VARCHAR(100), 
    container_code VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    size VARCHAR(10) NOT NULL,
    pickup_location VARCHAR(255),
    dropoff_location VARCHAR(255),
    type VARCHAR(20),
    extra_fee VARCHAR(255),
    -- Các trường bổ sung nghiệp vụ
    thanh_ly VARCHAR(100),
    phu_thu VARCHAR(100),
    hoa_don VARCHAR(100),
    ngay_hd DATE,
    cai_mep VARCHAR(100),
    phi_hun_trung INTEGER DEFAULT 0,
    kiem_hoa VARCHAR(100),
    xin_so_cont VARCHAR(100),
    qua_tai VARCHAR(100),
    phi_van_chuyen INTEGER DEFAULT 0,
    vat_8 INTEGER DEFAULT 0,
    ghi_chu TEXT,
    -- Các trường tính phí chi tiết
    receiving_price INTEGER DEFAULT 0,
    delivery_price INTEGER DEFAULT 0,
    lifting_fee INTEGER DEFAULT 0,
    lowering_fee INTEGER DEFAULT 0,
    lifting_invoice VARCHAR(100),
    lifting_invoice_date DATE,
    lifting_invoice_supplier VARCHAR(100),
    lowering_invoice VARCHAR(100),
    lowering_invoice_date DATE,   
    lowering_invoice_supplier VARCHAR(100),
    charged BOOLEAN DEFAULT FALSE
);
CREATE TABLE xac_nhan (
    id SERIAL PRIMARY KEY,
    booking_no VARCHAR(50),
    pickup_date DATE NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    transporter_name VARCHAR(70) NOT NULL,
    invoice_company VARCHAR(100),
    shipping_line VARCHAR(100),
    container_code VARCHAR(20) NOT NULL,
    seal VARCHAR(50),
    quantity INT NOT NULL,
    size VARCHAR(10) NOT NULL,
    pickup_location VARCHAR(255),
    dropoff_location VARCHAR(255),
    type VARCHAR(20),
    extra_fee VARCHAR(255),
    -- Các trường bổ sung nghiệp vụ từ booking_details
    thanh_ly VARCHAR(100),
    phu_thu VARCHAR(100),
    hoa_don VARCHAR(100),
    ngay_hd DATE,
    cai_mep VARCHAR(100),
    phi_hun_trung INTEGER ,
    kiem_hoa VARCHAR(100),
    xin_so_cont VARCHAR(100),
    qua_tai VARCHAR(100),
    phi_van_chuyen INTEGER ,
    vat_8 INTEGER ,
    ghi_chu TEXT,
    -- Các trường tính phí chi tiết từ booking_details
    receiving_price INTEGER ,
    delivery_price INTEGER ,
    lifting_fee INTEGER ,
    lowering_fee INTEGER ,
    lifting_invoice VARCHAR(100),
    lifting_invoice_date DATE,
    lifting_invoice_supplier VARCHAR(100),
    lowering_invoice VARCHAR(100),
    lowering_invoice_date DATE,
    lowering_invoice_supplier VARCHAR(100),
    charged BOOLEAN
);


-- Mỗi container_transactions sẽ liên kết với 1 xe kéo (truck_id)

SELECT * FROM companies;
SELECT * FROM transporters;
SELECT * FROM locations;
SELECT * FROM container_owners;
SELECT * FROM containers;
SELECT * FROM container_t
SELECT * FROM booking_details;
SELECT * FROM xac_nhan;
SELECT * FROM trucks;
