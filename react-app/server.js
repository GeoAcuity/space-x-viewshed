const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Configure CORS options
const corsOptions = {
  origin: 'http://localhost:3000', // URL of your frontend application
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type'
};

// Enable CORS with the specified options
app.use(cors(corsOptions));

// Serve static files from the "frontend" directory
app.use(express.static(path.join(__dirname, '../space-x-viewshed')));

// Define a simple endpoint
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});