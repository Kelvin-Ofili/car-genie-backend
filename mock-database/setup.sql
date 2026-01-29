-- Mock Dealership Inventory Database Setup
-- This creates a simple inventory database for testing the onboarding flow

-- Create database
CREATE DATABASE IF NOT EXISTS dealership_inventory;
USE dealership_inventory;

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    trim VARCHAR(50),
    body_type VARCHAR(30),
    color_exterior VARCHAR(30),
    color_interior VARCHAR(30),
    mileage INT DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    condition ENUM('new', 'used', 'certified') DEFAULT 'used',
    fuel_type VARCHAR(20),
    transmission VARCHAR(20),
    drivetrain VARCHAR(20),
    engine VARCHAR(50),
    stock_number VARCHAR(50),
    description TEXT,
    features TEXT,
    images JSON,
    status ENUM('available', 'sold', 'pending', 'reserved') DEFAULT 'available',
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_make_model (make, model),
    INDEX idx_year (year),
    INDEX idx_price (price),
    INDEX idx_status (status)
);

-- Insert sample vehicles
INSERT INTO vehicles (vin, make, model, year, trim, body_type, color_exterior, color_interior, mileage, price, condition, fuel_type, transmission, drivetrain, engine, stock_number, description, features, status, location) VALUES
('1HGBH41JXMN109186', 'Honda', 'Accord', 2023, 'EX-L', 'Sedan', 'Silver', 'Black', 15000, 28500.00, 'used', 'Gasoline', 'Automatic', 'FWD', '1.5L Turbo I4', 'ACC-2023-001', 'Well-maintained Honda Accord with low mileage', 'Leather Seats, Sunroof, Navigation, Backup Camera', 'available', 'Main Lot'),
('5UXWX7C5XBA012345', 'BMW', 'X3', 2022, 'xDrive30i', 'SUV', 'Black', 'Beige', 22000, 42000.00, 'certified', 'Gasoline', 'Automatic', 'AWD', '2.0L Turbo I4', 'BMW-X3-022', 'Certified Pre-Owned BMW X3 with warranty', 'Premium Package, Panoramic Roof, Heated Seats', 'available', 'Main Lot'),
('1FTFW1ET5DFA00001', 'Ford', 'F-150', 2024, 'Lariat', 'Pickup', 'Blue', 'Gray', 5000, 52000.00, 'new', 'Gasoline', 'Automatic', '4WD', '5.0L V8', 'F150-2024-LT', 'Brand new F-150 Lariat with all the bells and whistles', 'Towing Package, Leather, Navigation, 360 Camera', 'available', 'Main Lot'),
('3VWD17AJ5EM000001', 'Volkswagen', 'Jetta', 2021, 'SEL', 'Sedan', 'White', 'Black', 35000, 21500.00, 'used', 'Gasoline', 'Automatic', 'FWD', '1.4L Turbo I4', 'VW-JET-021', 'Fuel-efficient Jetta in great condition', 'Heated Seats, Bluetooth, Backup Camera', 'available', 'Main Lot'),
('2T1BURHE5JC000001', 'Toyota', 'Corolla', 2023, 'XLE', 'Sedan', 'Red', 'Black', 12000, 24000.00, 'certified', 'Gasoline', 'CVT', 'FWD', '2.0L I4', 'COR-2023-XLE', 'Certified Toyota Corolla with Toyota warranty', 'Lane Assist, Adaptive Cruise, Apple CarPlay', 'available', 'Main Lot'),
('1C4RJFBG8FC000001', 'Jeep', 'Grand Cherokee', 2022, 'Limited', 'SUV', 'Gray', 'Black', 28000, 38500.00, 'used', 'Gasoline', 'Automatic', '4WD', '3.6L V6', 'JEEP-GC-022', 'Spacious SUV perfect for families', 'Leather, Navigation, Third Row, Towing', 'available', 'Main Lot'),
('5NPE24AF6MH000001', 'Hyundai', 'Sonata', 2021, 'SEL Plus', 'Sedan', 'Blue', 'Gray', 32000, 22000.00, 'used', 'Gasoline', 'Automatic', 'FWD', '2.5L I4', 'HYU-SON-021', 'Reliable sedan with modern features', 'Sunroof, Wireless Charging, Safety Sense', 'available', 'Main Lot'),
('1G1ZD5ST8LF000001', 'Chevrolet', 'Malibu', 2020, 'LT', 'Sedan', 'Black', 'Black', 45000, 19500.00, 'used', 'Gasoline', 'Automatic', 'FWD', '1.5L Turbo I4', 'CHV-MAL-020', 'Affordable mid-size sedan', 'Backup Camera, Bluetooth, Remote Start', 'available', 'Main Lot'),
('WBAJA7C58JWA00001', 'BMW', '3 Series', 2023, '330i', 'Sedan', 'White', 'Black', 8000, 45000.00, 'certified', 'Gasoline', 'Automatic', 'RWD', '2.0L Turbo I4', 'BMW-3-2023', 'Luxury sport sedan with premium features', 'M Sport Package, Navigation, Harman Kardon', 'available', 'Main Lot'),
('JM1DKFB76K0000001', 'Mazda', 'CX-5', 2023, 'Touring', 'SUV', 'Red', 'Black', 18000, 31000.00, 'used', 'Gasoline', 'Automatic', 'AWD', '2.5L I4', 'MAZ-CX5-023', 'Popular crossover with great handling', 'All-Wheel Drive, Leather, Sunroof', 'available', 'Main Lot');

-- Create read-only user for Carrie
CREATE USER IF NOT EXISTS 'carrie_readonly'@'%' IDENTIFIED BY 'Test123!@#';
GRANT SELECT ON dealership_inventory.* TO 'carrie_readonly'@'%';
FLUSH PRIVILEGES;

-- Verify the setup
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as vehicle_count FROM vehicles;
