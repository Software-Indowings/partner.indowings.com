const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

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

// Serve the HTML form
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/form.html');
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

  // Save uploaded files
  const uploadDir = __dirname + '/uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
  fs.writeFileSync(uploadDir + '/incorporation_certificate.pdf', incorporationCertificate);
  fs.writeFileSync(uploadDir + '/pan_card.pdf', panCard);
  fs.writeFileSync(uploadDir + '/gstin_certificate.pdf', gstinCertificate);
  fs.writeFileSync(uploadDir + '/cancelled_cheque.pdf', cancelledCheque);

  // Render the submitted data
  res.render('submitted', { formData, directorsData });
});

// Serve uploaded files
app.use('/uploads', express.static(__dirname + '/uploads'));

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log('Server is listening on port ' + port);
});
