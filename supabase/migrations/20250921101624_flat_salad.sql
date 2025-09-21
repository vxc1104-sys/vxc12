/*
  # Complete Logistics Management System Database

  1. Master Data Tables
    - customers: Complete customer information with contacts
    - ports: World ports database with codes and countries
    - suppliers: Supplier management with categories
    - services: Logistics services with pricing categories
    - document_templates: HTML templates for document generation

  2. Case Management
    - cases: Enhanced with quotation/booking differentiation
    - case_status_history: Track all status changes
    - case_documents: Generated documents linked to cases
    - case_finance: Finance entries with purchase/sales data

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated and anonymous users
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS case_finance CASCADE;
DROP TABLE IF EXISTS case_documents CASCADE;
DROP TABLE IF EXISTS case_status_history CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS ports CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS cases CASCADE;

-- Create customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text UNIQUE NOT NULL,
  company_name text NOT NULL,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  country text,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  secondary_contact_name text,
  secondary_contact_email text,
  secondary_contact_phone text,
  website text,
  opening_hours text,
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ports table with major world ports
CREATE TABLE ports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  port_code text UNIQUE NOT NULL,
  port_name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  region text,
  created_at timestamptz DEFAULT now()
);

-- Create suppliers table
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code text UNIQUE NOT NULL,
  company_name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  address text,
  contact_person text,
  email text,
  phone text,
  website text,
  payment_terms text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code text UNIQUE NOT NULL,
  service_name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  unit text DEFAULT 'per shipment',
  description text,
  default_purchase_price decimal(10,2),
  default_sales_price decimal(10,2),
  currency text DEFAULT 'EUR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document templates table
CREATE TABLE document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_type text NOT NULL,
  html_content text NOT NULL,
  variables jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced cases table
CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE NOT NULL,
  case_type text NOT NULL DEFAULT 'booking', -- 'quotation' or 'booking'
  direction text NOT NULL DEFAULT 'export',
  status text NOT NULL DEFAULT 'draft',
  customer_id uuid REFERENCES customers(id),
  customer_reference text,
  
  -- Cargo information
  cargo_description text,
  container_type text,
  container_quantity integer DEFAULT 1,
  weight_kg decimal(10,2),
  volume_cbm decimal(10,2),
  
  -- Port information
  loading_port_id uuid REFERENCES ports(id),
  discharge_port_id uuid REFERENCES ports(id),
  loading_terminal text,
  discharge_terminal text,
  
  -- Vessel information (booking only)
  vessel_name text,
  carrier text,
  voyage_number text,
  
  -- Dates
  pickup_date date,
  delivery_date date,
  standard_closing timestamptz,
  vwm_closing timestamptz,
  cy_closing timestamptz,
  dock_closing_carrier timestamptz,
  dock_closing_customer timestamptz,
  
  -- Quotation specific
  validity_from date,
  validity_to date,
  
  -- Terms
  incoterms text DEFAULT 'FOB',
  payment_terms text,
  
  -- Internal
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create case status history table
CREATE TABLE case_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text,
  change_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create case documents table
CREATE TABLE case_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_path text,
  html_content text,
  created_at timestamptz DEFAULT now()
);

-- Create case finance table
CREATE TABLE case_finance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  quantity decimal(10,2) DEFAULT 1,
  service_id uuid REFERENCES services(id),
  additional_text text,
  purchase_price decimal(10,2) DEFAULT 0,
  purchase_currency text DEFAULT 'EUR',
  supplier_id uuid REFERENCES suppliers(id),
  sales_price decimal(10,2) DEFAULT 0,
  sales_currency text DEFAULT 'EUR',
  customer_id uuid REFERENCES customers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert major world ports
INSERT INTO ports (port_code, port_name, city, country, region) VALUES
('DEHAM', 'Hamburg', 'Hamburg', 'Germany', 'Europe'),
('NLRTM', 'Rotterdam', 'Rotterdam', 'Netherlands', 'Europe'),
('CNSHA', 'Shanghai', 'Shanghai', 'China', 'Asia'),
('SGSIN', 'Singapore', 'Singapore', 'Singapore', 'Asia'),
('USLAX', 'Los Angeles', 'Los Angeles', 'United States', 'North America'),
('USNYC', 'New York', 'New York', 'United States', 'North America'),
('GBFXT', 'Felixstowe', 'Felixstowe', 'United Kingdom', 'Europe'),
('BEANR', 'Antwerp', 'Antwerp', 'Belgium', 'Europe'),
('HKHKG', 'Hong Kong', 'Hong Kong', 'Hong Kong', 'Asia'),
('KRPUS', 'Busan', 'Busan', 'South Korea', 'Asia'),
('JPYOK', 'Yokohama', 'Yokohama', 'Japan', 'Asia'),
('AEDXB', 'Dubai', 'Dubai', 'United Arab Emirates', 'Middle East'),
('USOAK', 'Oakland', 'Oakland', 'United States', 'North America'),
('USLGB', 'Long Beach', 'Long Beach', 'United States', 'North America'),
('ITGOA', 'Genoa', 'Genoa', 'Italy', 'Europe');

-- Insert default services
INSERT INTO services (service_code, service_name, category, unit, default_purchase_price, default_sales_price) VALUES
('OCF', 'Ocean Freight', 'Transport', 'per container', 1200.00, 1500.00),
('THC-O', 'Terminal Handling Charge Origin', 'Terminal', 'per container', 150.00, 200.00),
('THC-D', 'Terminal Handling Charge Destination', 'Terminal', 'per container', 180.00, 250.00),
('DOC', 'Documentation Fee', 'Documentation', 'per shipment', 50.00, 100.00),
('BAF', 'Bunker Adjustment Factor', 'Surcharge', 'per container', 200.00, 300.00),
('CAF', 'Currency Adjustment Factor', 'Surcharge', 'per container', 50.00, 75.00),
('ISPS', 'ISPS Security Fee', 'Security', 'per container', 25.00, 40.00),
('SEAL', 'Container Seal', 'Equipment', 'per container', 15.00, 25.00),
('TRUCK', 'Trucking', 'Transport', 'per container', 300.00, 450.00),
('CUSTOMS', 'Customs Clearance', 'Customs', 'per shipment', 100.00, 200.00);

-- Insert default suppliers
INSERT INTO suppliers (supplier_code, company_name, category, contact_person, email, phone) VALUES
('MSC001', 'Mediterranean Shipping Company', 'Carrier', 'John Smith', 'booking@msc.com', '+49-40-123456'),
('MAERSK', 'Maersk Line', 'Carrier', 'Sarah Johnson', 'booking@maersk.com', '+49-40-789012'),
('HAPAG', 'Hapag-Lloyd', 'Carrier', 'Michael Brown', 'booking@hapag-lloyd.com', '+49-40-345678'),
('TRUCK01', 'Hamburg Trucking GmbH', 'Trucking', 'Peter Mueller', 'dispatch@hamburg-truck.de', '+49-40-111222'),
('CUST001', 'Hamburg Customs Services', 'Customs', 'Anna Schmidt', 'service@hh-customs.de', '+49-40-333444');

-- Insert sample customers
INSERT INTO customers (customer_code, company_name, address_line1, city, postal_code, country, primary_contact_name, primary_contact_email, primary_contact_phone) VALUES
('ROSSMANN', 'Rossmann GmbH', 'Isernhägener Str. 16', 'Burgwedel', '30938', 'Germany', 'Klaus Weber', 'k.weber@rossmann.de', '+49-5139-898-0'),
('CAMPER', 'Camper GmbH', 'Wandsbeker Str. 45', 'Hamburg', '22041', 'Germany', 'Maria Garcia', 'm.garcia@camper.com', '+49-40-555-0123'),
('TCHIBO', 'Tchibo GmbH', 'Überseering 18', 'Hamburg', '22297', 'Germany', 'Thomas Müller', 't.mueller@tchibo.de', '+49-40-63870');

-- Insert document templates
INSERT INTO document_templates (template_name, template_type, html_content, variables) VALUES
('Transport Order', 'transport_order', 
'<!DOCTYPE html>
<html>
<head>
    <title>Transport Order</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .field { margin-bottom: 10px; }
        .label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TRANSPORT ORDER</h1>
        <p>Case Number: {{case_number}}</p>
    </div>
    
    <div class="section">
        <h3>Customer Information</h3>
        <div class="field"><span class="label">Company:</span> {{customer_name}}</div>
        <div class="field"><span class="label">Reference:</span> {{customer_reference}}</div>
    </div>
    
    <div class="section">
        <h3>Cargo Details</h3>
        <div class="field"><span class="label">Description:</span> {{cargo_description}}</div>
        <div class="field"><span class="label">Container:</span> {{container_type}} x {{container_quantity}}</div>
        <div class="field"><span class="label">Weight:</span> {{weight_kg}} kg</div>
    </div>
    
    <div class="section">
        <h3>Route</h3>
        <div class="field"><span class="label">From:</span> {{loading_port}}</div>
        <div class="field"><span class="label">To:</span> {{discharge_port}}</div>
        <div class="field"><span class="label">Vessel:</span> {{vessel_name}}</div>
    </div>
</body>
</html>', 
'{"case_number": "", "customer_name": "", "customer_reference": "", "cargo_description": "", "container_type": "", "container_quantity": "", "weight_kg": "", "loading_port": "", "discharge_port": "", "vessel_name": ""}'),

('Booking Confirmation', 'booking_confirmation',
'<!DOCTYPE html>
<html>
<head>
    <title>Booking Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .field { margin-bottom: 10px; }
        .label { font-weight: bold; }
        .dates-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .dates-table th, .dates-table td { border: 1px solid #ddd; padding: 8px; }
        .dates-table th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>BOOKING CONFIRMATION</h1>
        <p>Case Number: {{case_number}}</p>
        <p>Date: {{current_date}}</p>
    </div>
    
    <div class="section">
        <h3>Booking Details</h3>
        <div class="field"><span class="label">Customer:</span> {{customer_name}}</div>
        <div class="field"><span class="label">Customer Reference:</span> {{customer_reference}}</div>
        <div class="field"><span class="label">Vessel:</span> {{vessel_name}}</div>
        <div class="field"><span class="label">Carrier:</span> {{carrier}}</div>
    </div>
    
    <div class="section">
        <h3>Important Dates</h3>
        <table class="dates-table">
            <tr><th>Event</th><th>Date</th></tr>
            <tr><td>Standard Closing</td><td>{{standard_closing}}</td></tr>
            <tr><td>VWM Closing</td><td>{{vwm_closing}}</td></tr>
            <tr><td>CY Closing</td><td>{{cy_closing}}</td></tr>
            <tr><td>Pickup Date</td><td>{{pickup_date}}</td></tr>
            <tr><td>Delivery Date</td><td>{{delivery_date}}</td></tr>
        </table>
    </div>
</body>
</html>',
'{"case_number": "", "current_date": "", "customer_name": "", "customer_reference": "", "vessel_name": "", "carrier": "", "standard_closing": "", "vwm_closing": "", "cy_closing": "", "pickup_date": "", "delivery_date": ""}');

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_finance ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (development/demo)
CREATE POLICY "Allow all operations for anonymous users" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON ports FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON suppliers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON services FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON document_templates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON cases FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON case_status_history FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON case_documents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anonymous users" ON case_finance FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON ports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON document_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON cases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON case_status_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON case_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON case_finance FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_customer_code ON customers(customer_code);
CREATE INDEX idx_ports_port_code ON ports(port_code);
CREATE INDEX idx_ports_port_name ON ports(port_name);
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_customer_id ON cases(customer_id);
CREATE INDEX idx_case_finance_case_id ON case_finance(case_id);
CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_status_history_case_id ON case_status_history(case_id);