const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

const app = express();

// Set EJS as the view engine
// app.set('view engine', 'ejs');

app.use('/assets', express.static(path.join(__dirname, 'assets')));
// MySQL connection configuration
const connection = mysql.createConnection({
    host: 'ls-b120627a54c35ec7aa532f95056b0e3ba1d5b806.cx8km2ky23qf.ap-south-1.rds.amazonaws.com',
    user: 'dbmasteruser',
    password: 'IndoWings',
    database: 'partnerportal'
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected to database as id ' + connection.threadId);
});

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

// Route for the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for the registration page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// Handle form submission
app.post('/submit', (req, res) => {
  const formData = req.body;
  const files = req.files;

  // Process file uploads
  const incorporationCertificate = files.file_incorporation.data;
  const panCard = files.file_pan.data;
  const gstinCertificate = files.file_gstin.data;
  const cancelledCheque = files.file_cancelled_cheque.data;

  // Prepare director data
  const directorsData = [];
  for (let i = 1; i <= formData.number_of_directors; i++) {
    const director = {
      DIN: formData[`din_${i}`],
      name: formData[`name_${i}`],
      address: formData[`address_${i}`],
      PAN: formData[`pan_${i}`],
      Aadhar: formData[`aadhar_${i}`],
      mobile: formData[`mobile_${i}`],
      email: formData[`email_${i}`],
      panFile: files[`file_pan_${i}`].data,
      aadharFile: files[`file_aadhar_${i}`].data
    };
    directorsData.push(director);
  }

  // Insert company data into MySQL
  const companyQuery = 'INSERT INTO company_kyc (type_of_company, name_of_entity, date_of_incorporation, pan_number, gstin, bank_details, ifsc_code, registered_address, communication_address, pincode, district, state, email, phone_number, incorporation_certificate, pan_card, gstin_certificate, cancelled_cheque) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  connection.query(companyQuery, [formData.type_of_company, formData.name_of_entity, formData.date_of_incorporation, formData.pan_number, formData.gstin, formData.bank_details, formData.ifsc_code, formData.registered_address, formData.communication_address, formData.pincode, formData.district, formData.state, formData.email, formData.phone_number, incorporationCertificate, panCard, gstinCertificate, cancelledCheque], (err, result) => {
    if (err) {
      console.error('Error inserting company data: ' + err.stack);
      res.status(500).send('Error submitting data. Please try again.');
      return;
    }
    console.log('Company data inserted successfully!');

    // Insert director data into MySQL
    const companyId = result.insertId; // ID of the newly inserted company
    const directorQuery = 'INSERT INTO directors (company_id, DIN, name, address, PAN, Aadhar, mobile, email, pan_file, aadhar_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    directorsData.forEach((director) => {
      connection.query(directorQuery, [companyId, director.DIN, director.name, director.address, director.PAN, director.Aadhar, director.mobile, director.email, director.panFile, director.aadharFile], (err) => {
        if (err) {
          console.error('Error inserting director data: ' + err.stack);
          res.status(500).send('Error submitting data. Please try again.');
          return;
        }
        console.log('Director data inserted successfully!');
      });
    });

    res.redirect('/?submitted=true');
    
  });
});


// Start the server
const port = 3000;
app.listen(port, () => {
  console.log('Server is listening on port ' + port);
});
