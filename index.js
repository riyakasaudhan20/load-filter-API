const express = require('express');
const app = express();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('students.db');

// Handle the 'open' event
db.on('open', () => {
  console.log('Database connection successful');

  // Create the students table
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      name TEXT,
      total_marks INTEGER
    )
  `, (error) => {
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Students table created successfully');
    }
  });

  // Insert 15 data entries into the students table
  for (let i = 1; i <= 40; i++) {
    const name = `Student ${i}`;
    const totalMarks = Math.floor(Math.random() * 100); // Generate a random total marks value

    db.run(
      'INSERT INTO students (name, total_marks) VALUES (?, ?)',
      [name, totalMarks],
      (error) => {
        if (error) {
          console.error('Error inserting data:', error);
        }else{
          console.log('Successfully entered data');
        }
      }
    );
  }

  // Retrieve all entries from the students table
  db.all('SELECT * FROM students', (error, rows) => {
    if (error) {
      console.error('Error retrieving data:', error);
    } else {
      console.log('All entries:');
      rows.forEach((row) => {
        console.log(row);
      });
    }
  });

  // Close the database connection
  db.close();
});

// Handle errors
db.on('error', (error) => {
  console.error('Database connection error:', error);
});

// GET /students
// Query Parameters: page, pageSize
app.get('/students', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;

  // Assuming the student data is stored in a file named students.json
  const students = require('./students.json');
  const paginatedStudents = students.slice(startIndex, endIndex);

  res.json({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    total: students.length,
    data: paginatedStudents,
  });
});

// Server side filtering api

const fs = require('fs');

app.post('/students/filter', (req, res) => {
  const { filters } = req.body;

  // Read the student data from the JSON file
  const studentsData = JSON.parse(fs.readFileSync('students.json'));

  // Perform filtering logic using the 'filters' data
  const filteredData = studentsData.filter(student => {
    // Add your specific filtering conditions based on the 'filters' criteria
    // For example, if you have a 'name' filter, you can check if the student's name matches the filter value
    if (filters.name && student.name !== filters.name) {
      return false;
    }

    // Add more filtering conditions based on other 'filters' criteria as needed

    return true;
  });

  // Send the filtered results back as a response
  res.json(filteredData);
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


// ------------------------------------------------------

// Middleware to parse request bodies as JSON
app.use(express.json());

// API endpoint to load student details with pagination
app.get('/students', (req, res) => {
  const page = req.query.page || 1; // Get the requested page number
  const pageSize = req.query.pageSize || 10; // Get the page size

  const offset = (page - 1) * pageSize;

  // Query to retrieve paginated student details
  const query = `SELECT * FROM students LIMIT ${pageSize} OFFSET ${offset}`;

  // Execute the query
  db.all(query, (error, rows) => {
    if (error) {
      console.error('Error retrieving student details:', error);
      res.status(500).json({ error: 'An error occurred while retrieving student details' });
    } else {
      res.json(rows);
      console.log('Successfully send data');
    }
  });
});

//------------------------------------------------------

// API endpoint for server-side filtering
app.post('/students/filter', (req, res) => {
  const filters = req.body.filters; // Get the filter criteria from the request body

  // Generate the SQL query based on the filter criteria
  let query = 'SELECT * FROM students';
  let params = [];

  if (filters) {
    const conditions = [];

    for (const key in filters) {
      conditions.push(`${key} = ?`);
      params.push(filters[key]);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
  }

  // Execute the query with the provided filter criteria
  db.all(query, params, (error, rows) => {
    if (error) {
      console.error('Error retrieving filtered student details:', error);
      res.status(500).json({ error: 'An error occurred while retrieving filtered student details' });
    } else {
      res.json(rows);
    }
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});