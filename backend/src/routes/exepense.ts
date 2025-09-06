import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { query } from "../db";

const router = express.Router();

interface AuthRequest extends Request {
  userId?: number;
}

//  Authentification JWT
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log('Auth header received:', authHeader);

  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  console.log('Extracted token:', token);

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    console.log('Decoded token:', decoded);
    req.userId = (decoded as any).userId; 
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Dans la route GET
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  console.log('Récupération des dépenses pour l\'ID utilisateur :', req.userId); 

  try {
    const { rows } = await query(
      "SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC",
      [req.userId]
    );
    console.log('Fetched expenses:', rows); 
    res.json(rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des dépenses :", error);  
    res.status(500).json({ error: "Échec de la récupération des dépenses" });
  }
});

//  Récupérer toutes les dépenses de l’utilisateur
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query(
      "SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC",
      [req.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

//  Ajouter une dépense
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const { title, amount, category, description, date } = req.body;
  try {
    const { rows } = await query(
      "INSERT INTO expenses (user_id, title, amount, category, description, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [req.userId, title, amount, category, description, date]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ error: "Failed to add expense" });
  }
});

//  Modifier une dépense
router.put("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, amount, category, description, date } = req.body;

  try {
    const { rowCount, rows } = await query(
      "UPDATE expenses SET title=$1, amount=$2, category=$3, description=$4, date=$5, updated_at=NOW() WHERE id=$6 AND user_id=$7 RETURNING *",
      [title, amount, category, description, date, id, req.userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

//  Supprimer une dépense
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const { rowCount } = await query(
      "DELETE FROM expenses WHERE id=$1 AND user_id=$2",
      [id, req.userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;