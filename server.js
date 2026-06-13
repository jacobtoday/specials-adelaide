const express = require('express');
const path = require('path');
const app = express();

// Serve all static files from the current directory
app.use(express.static(path.join(__dirname), {
  index: 'index.html',
  extensions: ['html'],
}));

// Protect admin route — basic layer (real auth is in admin.html itself)
// For extra security you can add HTTP Basic Auth here before going live
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Catch-all → index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Specials Adelaide running on port ${PORT}`);
});
