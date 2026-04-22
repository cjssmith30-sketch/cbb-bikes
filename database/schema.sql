-- ============================================================
-- CBB BIKES — MySQL Database Schema
-- Based on ERD: People, Events, Employees, Products, Suppliers
-- ============================================================

CREATE DATABASE IF NOT EXISTS cbb_bikes;
USE cbb_bikes;

-- ── PEOPLE ──
CREATE TABLE People (
  PEID        INT AUTO_INCREMENT PRIMARY KEY,
  F_Name      VARCHAR(50) NOT NULL,
  L_Name      VARCHAR(50) NOT NULL,
  Email       VARCHAR(100) UNIQUE,
  Phone       VARCHAR(20),
  Type        VARCHAR(30) DEFAULT 'Customer',  -- Customer, Participant, Inquiry
  Street      VARCHAR(100),
  City        VARCHAR(60),
  State       VARCHAR(30),
  Zip         VARCHAR(10),
  Cycle_Type  VARCHAR(50),
  Created_At  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── PARENT / GUARDIAN (for minors) ──
CREATE TABLE Parent_Guardian (
  GuardianID  INT AUTO_INCREMENT PRIMARY KEY,
  PEID        INT NOT NULL,
  F_Name      VARCHAR(50),
  L_Name      VARCHAR(50),
  CC_Info     VARCHAR(20),         -- last 4 only
  Liability_Status VARCHAR(20),
  FOREIGN KEY (PEID) REFERENCES People(PEID)
);

-- ── CUSTOMERS ──
CREATE TABLE Customer (
  CID         INT AUTO_INCREMENT PRIMARY KEY,
  PEID        INT NOT NULL UNIQUE,
  DOB         DATE,
  Bike_Discount_Rate  DECIMAL(5,4) DEFAULT 0,
  Other_Discount_Rate DECIMAL(5,4) DEFAULT 0,
  FOREIGN KEY (PEID) REFERENCES People(PEID)
);

-- ── EVENTS ──
CREATE TABLE Event (
  EVID        INT AUTO_INCREMENT PRIMARY KEY,
  Name        VARCHAR(120) NOT NULL,
  Date        DATE NOT NULL,
  Time        TIME,
  Location    VARCHAR(150),
  Type        ENUM('Race','Recreational') NOT NULL,
  Age_Bracket VARCHAR(50),
  Reg_Fee     DECIMAL(8,2) DEFAULT 0,
  Description TEXT,
  Created_At  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── EVENT SUBTYPE: RACES ──
CREATE TABLE Races (
  RaceID      INT AUTO_INCREMENT PRIMARY KEY,
  EVID        INT NOT NULL UNIQUE,
  Race_Type   VARCHAR(50),
  Race_Times  VARCHAR(50),
  FOREIGN KEY (EVID) REFERENCES Event(EVID)
);

-- ── EVENT SUBTYPE: RECREATIONAL ──
CREATE TABLE Recreational (
  RecID       INT AUTO_INCREMENT PRIMARY KEY,
  EVID        INT NOT NULL UNIQUE,
  Name        VARCHAR(120),
  FOREIGN KEY (EVID) REFERENCES Event(EVID)
);

-- ── BIKE WEEK PARTICIPANT ──
CREATE TABLE Bike_Week_Participant (
  PEID              INT NOT NULL,
  Age               INT,
  Age_Bracket       VARCHAR(30),
  Liability_Status  VARCHAR(30),
  Bike_Discount_Rate DECIMAL(5,4) DEFAULT 0,
  Other_Discount_Rate DECIMAL(5,4) DEFAULT 0,
  PRIMARY KEY (PEID),
  FOREIGN KEY (PEID) REFERENCES People(PEID)
);

-- ── PARTICIPATES (Event registration) ──
CREATE TABLE Participates (
  PEID              INT NOT NULL,
  EVID              INT NOT NULL,
  Registration_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Commission        DECIMAL(8,2),
  Discount          DECIMAL(5,4),
  PRIMARY KEY (PEID, EVID),
  FOREIGN KEY (PEID) REFERENCES People(PEID),
  FOREIGN KEY (EVID) REFERENCES Event(EVID)
);

-- ── SUPPLIERS ──
CREATE TABLE Suppliers (
  SID         INT AUTO_INCREMENT PRIMARY KEY,
  Name        VARCHAR(100) NOT NULL,
  Contact_Info VARCHAR(150),
  Street      VARCHAR(100),
  City        VARCHAR(60),
  State       VARCHAR(30),
  Zip         VARCHAR(10)
);

-- ── PRODUCTS ──
CREATE TABLE Products (
  PID         INT AUTO_INCREMENT PRIMARY KEY,
  Name        VARCHAR(120) NOT NULL,
  Description TEXT,
  Type        VARCHAR(50),
  Price       DECIMAL(10,2) NOT NULL,
  MSRP        DECIMAL(10,2),
  Cost        DECIMAL(10,2),
  Added_Date  DATE DEFAULT (CURRENT_DATE)
);

-- ── SUPPLY (Products <-> Suppliers) ──
CREATE TABLE Supply (
  PID         INT NOT NULL,
  SID         INT NOT NULL,
  PRIMARY KEY (PID, SID),
  FOREIGN KEY (PID) REFERENCES Products(PID),
  FOREIGN KEY (SID) REFERENCES Suppliers(SID)
);

-- ── PRODUCT SUBTYPE: BIKE ──
CREATE TABLE Bike (
  PID             INT NOT NULL PRIMARY KEY,
  Build_Kit       VARCHAR(80),
  Drive_Train     VARCHAR(50),
  Suspension_Type VARCHAR(80),
  Frame_Material  VARCHAR(60),
  FOREIGN KEY (PID) REFERENCES Products(PID)
);

-- ── BIKE SUBTYPE: STOCK ──
CREATE TABLE Stock (
  PID         INT NOT NULL PRIMARY KEY,
  Frame_Size  VARCHAR(20),
  FOREIGN KEY (PID) REFERENCES Bike(PID)
);

-- ── BIKE SUBTYPE: CUSTOM ──
CREATE TABLE Custom (
  PID         INT NOT NULL PRIMARY KEY,
  Dimensions  VARCHAR(100),
  FOREIGN KEY (PID) REFERENCES Bike(PID)
);

-- ── PRODUCT SUBTYPE: CLOTHING ──
CREATE TABLE Clothing (
  PID         INT NOT NULL PRIMARY KEY,
  Size        VARCHAR(20),
  Type        VARCHAR(50),
  FOREIGN KEY (PID) REFERENCES Products(PID)
);

-- ── SERVICES ──
CREATE TABLE Services (
  ServiceID   INT AUTO_INCREMENT PRIMARY KEY,
  Name        VARCHAR(100),
  Price       DECIMAL(8,2),
  Date_Serviced DATE,
  Description TEXT
);

-- ── PART / ACCESSORY ──
CREATE TABLE Part_Accessory (
  PartID      INT AUTO_INCREMENT PRIMARY KEY,
  Name        VARCHAR(100),
  Weight      DECIMAL(8,3),
  Description TEXT
);

-- ── SERVICE REQUIRES PART ──
CREATE TABLE Requires (
  ServiceID   INT NOT NULL,
  PartID      INT NOT NULL,
  PRIMARY KEY (ServiceID, PartID),
  FOREIGN KEY (ServiceID) REFERENCES Services(ServiceID),
  FOREIGN KEY (PartID) REFERENCES Part_Accessory(PartID)
);

-- ── EMPLOYEES ──
CREATE TABLE Employees (
  EID             INT AUTO_INCREMENT PRIMARY KEY,
  F_Name          VARCHAR(50) NOT NULL,
  L_Name          VARCHAR(50) NOT NULL,
  Street          VARCHAR(100),
  City            VARCHAR(60),
  State           VARCHAR(30),
  Zip             VARCHAR(10),
  Salary          DECIMAL(10,2),
  Commission_Rate DECIMAL(5,4) DEFAULT 0.04,
  Type            VARCHAR(30) DEFAULT 'CBB'   -- CBB_EMP, Fab_Emp
);

-- ── EMPLOYEE SUBTYPE: CBB EMP (commission-based) ──
CREATE TABLE CBB_EMP (
  EID             INT NOT NULL PRIMARY KEY,
  Commission_Rate DECIMAL(5,4) DEFAULT 0.04,
  FOREIGN KEY (EID) REFERENCES Employees(EID)
);

-- ── EMPLOYEE SUBTYPE: FAB EMP (fabrication) ──
CREATE TABLE Fab_Emp (
  EID                INT NOT NULL PRIMARY KEY,
  Salary             DECIMAL(10,2),
  Fabrication_Skills TEXT,
  FOREIGN KEY (EID) REFERENCES Employees(EID)
);

-- ── MANAGER AUTH (for portal login) ──
CREATE TABLE Manager_Auth (
  AuthID          INT AUTO_INCREMENT PRIMARY KEY,
  EID             INT NOT NULL UNIQUE,
  Username        VARCHAR(80) NOT NULL UNIQUE,
  Password_Hash   VARCHAR(128) NOT NULL,
  Role            VARCHAR(30) DEFAULT 'Manager',
  Active          TINYINT(1) DEFAULT 1,
  Created_At      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (EID) REFERENCES Employees(EID)
);

-- ── BUY (Customer purchases Product, handled by Employee) ──
CREATE TABLE Buy (
  BuyID           INT AUTO_INCREMENT PRIMARY KEY,
  CID             INT NOT NULL,
  PID             INT NOT NULL,
  EID             INT,               -- employee who made the sale
  Qty             INT DEFAULT 1,
  Date_of_Purchase DATE NOT NULL,
  Discount        DECIMAL(5,4) DEFAULT 0,
  Commission      DECIMAL(8,2),
  FOREIGN KEY (CID) REFERENCES Customer(CID),
  FOREIGN KEY (PID) REFERENCES Products(PID),
  FOREIGN KEY (EID) REFERENCES Employees(EID)
);

-- ── PERFORM (Employee performs Service) ──
CREATE TABLE Perform (
  EID         INT NOT NULL,
  ServiceID   INT NOT NULL,
  CID         INT,
  Date        DATE,
  PRIMARY KEY (EID, ServiceID),
  FOREIGN KEY (EID) REFERENCES Employees(EID),
  FOREIGN KEY (ServiceID) REFERENCES Services(ServiceID),
  FOREIGN KEY (CID) REFERENCES Customer(CID)
);

-- ── DESIGN (Fab Emp designs Custom Bike) ──
CREATE TABLE Design (
  EID         INT NOT NULL,
  PID         INT NOT NULL,
  Engineering TEXT,
  PRIMARY KEY (EID, PID),
  FOREIGN KEY (EID) REFERENCES Fab_Emp(EID),
  FOREIGN KEY (PID) REFERENCES Custom(PID)
);

-- ══════════════════════════════════════════
-- SAMPLE DATA
-- ══════════════════════════════════════════

-- Suppliers
INSERT INTO Suppliers (Name, Contact_Info, City, State, Zip) VALUES
('Shimano North America', 'orders@shimano.com', 'Irvine', 'CA', '92618'),
('SRAM LLC', 'dealer@sram.com', 'Chicago', 'IL', '60642'),
('RockShox', 'service@rockshox.com', 'Colorado Springs', 'CO', '80901'),
('Fulcrum Wheels', 'info@fulcrumwheels.com', 'Vicenza', 'IT', '36100');

-- Products
INSERT INTO Products (Name, Description, Type, Price, MSRP, Cost) VALUES
('Velo Pro 9', 'Race-ready road bike', 'Bike', 1899.00, 2100.00, 980.00),
('Ridge Runner XT', 'Trail mountain bike 29er', 'Bike', 2450.00, 2700.00, 1300.00),
('Apex Custom', 'Hand-fabricated custom chromoly build', 'Bike', 3200.00, 3800.00, 1600.00),
('Titan Gravel', 'Adventure gravel bike', 'Bike', 2100.00, 2350.00, 1100.00),
('Enduro Beast', '160mm full suspension', 'Bike', 3600.00, 4000.00, 1950.00),
('CBB Signature Build', 'Titanium custom flagship', 'Bike', 4800.00, 5500.00, 2400.00),
('Street Tracker', 'Urban chromoly commuter', 'Bike', 1299.00, 1450.00, 650.00),
('Hardtail Hero', 'Budget trail hardtail 29er', 'Bike', 1650.00, 1850.00, 860.00),
('Full Tune-Up', 'Complete bike service package', 'Service', 85.00, 95.00, 25.00),
('Race Prep Service', 'Competition race prep', 'Service', 120.00, 140.00, 35.00),
('Annual Protection Plan', 'Yearly unlimited tune-ups', 'Service', 249.00, 299.00, 60.00),
('CBB Jersey - M', 'Team jersey medium', 'Clothing', 69.00, 85.00, 22.00),
('Helmet - Road', 'Lightweight road helmet', 'Accessory', 149.00, 175.00, 60.00);

-- Bike entries
INSERT INTO Bike (PID, Build_Kit, Drive_Train, Suspension_Type, Frame_Material) VALUES
(1, 'Shimano 105', '2x11', 'Carbon Fork', 'Aluminum'),
(2, 'Shimano XT', '1x12', '140mm RockShox', 'Aluminum'),
(3, 'Shimano 105', '2x11', 'Rigid', 'Chromoly Steel'),
(4, 'Shimano GRX', '1x11', 'Carbon Fork', 'Aluminum'),
(5, 'SRAM Eagle', '1x12', '160mm Full Suspension', 'Aluminum'),
(6, 'Custom Spec', '1x12', 'Customer Choice', 'Titanium'),
(7, 'Shimano Claris', '2x8', 'Rigid', 'Chromoly'),
(8, 'Shimano Deore', '1x12', '120mm SR Suntour', 'Aluminum');

-- Stock bikes
INSERT INTO Stock (PID, Frame_Size) VALUES (1,'M'),(2,'L'),(4,'M'),(5,'L'),(7,'M'),(8,'L');
-- Custom bikes
INSERT INTO Custom (PID, Dimensions) VALUES (3,'Custom fit'),(6,'Custom fit');

-- Employees
INSERT INTO Employees (F_Name, L_Name, City, State, Salary, Commission_Rate, Type) VALUES
('Sofia', 'Rivera', 'Durango', 'CO', 52000, 0.05, 'CBB'),
('Chris', 'Bennett', 'Durango', 'CO', 68000, 0.05, 'CBB'),
('Marcus', 'Johnson', 'Durango', 'CO', 48000, 0.04, 'CBB'),
('Kim', 'Lee', 'Durango', 'CO', 46000, 0.04, 'CBB'),
('Tyler', 'Moss', 'Durango', 'CO', 44000, 0.04, 'CBB');

-- Manager auth (password = 'cbb2025' hashed)
INSERT INTO Manager_Auth (EID, Username, Password_Hash, Role) VALUES
(2, 'manager', SHA2(CONCAT('cbb2025', 'cbb_salt'), 256), 'Manager');

-- CBB employees
INSERT INTO CBB_EMP (EID, Commission_Rate) VALUES (1,0.05),(2,0.05),(3,0.04),(4,0.04),(5,0.04);

-- Events
INSERT INTO Event (Name, Date, Time, Location, Type, Age_Bracket, Reg_Fee, Description) VALUES
('Durango Downhill Classic', '2025-06-14', '09:00:00', 'Purgatory Resort, CO', 'Race', '18-59', 45.00, 'Premier downhill race of Bike Week'),
('Mesa Verde Group Ride', '2025-06-21', '07:30:00', 'Mesa Verde Trailhead, CO', 'Recreational', 'All Ages', 15.00, 'Scenic 25-mile group ride'),
('CBB Bike Week Criterium', '2025-07-04', '10:00:00', 'Downtown Durango Circuit', 'Race', '18+', 55.00, 'Fast-paced closed circuit criterium'),
('Animas River Trail Ride', '2025-07-12', '08:00:00', 'Animas Park, Durango', 'Recreational', 'All Ages', 10.00, 'Family-friendly 15-mile ride'),
('Mountain Challenge 50K', '2025-08-03', '06:00:00', 'Engineer Mountain Trail, CO', 'Race', '18-59', 75.00, '50km cross-country epic');

INSERT INTO Races (EVID, Race_Type, Race_Times) VALUES
(1, 'Downhill', 'Timed heats'),
(3, 'Criterium', 'Massed start'),
(5, 'XC', 'Mass start 6am');

INSERT INTO Recreational (EVID, Name) VALUES
(2, 'Mesa Verde Group Ride'),
(4, 'Animas River Trail Ride');
