require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");

// Configuration de la base de données
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

const app = express();
const port = 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Route POST - Ajouter un article
app.post("/articles", async (req, res) => {
  try {
    const { title, content, author } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires." });
    }

    const result = await pool.query(
      "INSERT INTO articles(title, content, author) VALUES($1, $2, $3) RETURNING *",
      [title, content, author]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur lors de la création de l'article.",
    });
  }
});

// Route GET - Récupérer tous les articles
app.get("/articles", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM articles ORDER BY id ASC");

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun article trouvé." });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: `Erreur lors de la récupération des articles : ${err.message}`,
    });
  }
});

// Route PATCH - Mettre à jour un article
app.patch("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author } = req.body;

    const result = await pool.query(
      "UPDATE articles SET title = COALESCE($1, title), content = COALESCE($2, content), author = COALESCE($3, author) WHERE id = $4 RETURNING *",
      [title, content, author, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Article non trouvé." });
    }

    res.status(200).json({
      message: "Article mis à jour avec succès.",
      article: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: `Erreur lors de la mise à jour de l'article : ${err.message}`,
    });
  }
});

// Route DELETE - Supprimer un article
app.delete("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM articles WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Article non trouvé." });
    }

    res.status(200).json({
      message: "Article supprimé avec succès.",
      article: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: `Erreur lors de la suppression de l'article : ${err.message}`,
    });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`API en cours d'exécution sur http://localhost:${port}`);
});
