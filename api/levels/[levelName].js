import { getLevel } from "../../backend/utils/levelUtils.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const level = getLevel(req.query.levelName);
    res.status(200).json(level);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}
