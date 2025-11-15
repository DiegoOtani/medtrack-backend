import app from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0'; // Aceita conexões de qualquer IP

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Also accessible at http://localhost:${PORT}`);
});
