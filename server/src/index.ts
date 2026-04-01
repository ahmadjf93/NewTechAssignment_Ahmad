import app from './app';

// Prefer PORT from environment, default to 4000 for local dev.
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Start the HTTP server and log the bound URL.
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
