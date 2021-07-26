export default async function handler(req, res) {
  const response = await fetch("http://detector-insightface:8000/");
  const data = await response.json();
  res.status(200).json(data);
}
