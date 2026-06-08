const express = require('express');
const path = require('path');
const { initDatabase, queryAll, queryOne, run } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API CANDIDATS
app.get('/api/candidats', (req, res) => {
  try {
    const candidats = queryAll('SELECT * FROM candidats');
    res.json({ success: true, data: candidats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/candidats/:id', (req, res) => {
  try {
    const candidat = queryOne('SELECT * FROM candidats WHERE id = ?', [req.params.id]);
    if (!candidat) return res.status(404).json({ success: false, message: 'Candidat non trouve' });
    res.json({ success: true, data: candidat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// API VOTE
app.post('/api/vote/verifier', (req, res) => {
  try {
    const { identifiant } = req.body;
    if (!identifiant) return res.json({ success: false, message: "Veuillez entrer votre identifiant." });
    const etudiant = queryOne('SELECT * FROM etudiants WHERE identifiant = ?', [identifiant]);
    if (!etudiant) return res.json({ success: false, message: 'Identifiant etudiant non reconnu.' });
    if (etudiant.a_vote === 1) return res.json({ success: false, message: 'Vous avez deja vote. Un seul vote est autorise.' });
    res.json({ success: true, data: etudiant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/vote', (req, res) => {
  try {
    const { etudiant_id, candidat_id } = req.body;
    const etudiant = queryOne('SELECT * FROM etudiants WHERE id = ?', [etudiant_id]);
    if (!etudiant) return res.status(404).json({ success: false, message: 'Etudiant non trouve.' });
    if (etudiant.a_vote === 1) return res.status(403).json({ success: false, message: 'Cet etudiant a deja vote.' });
    const candidat = queryOne('SELECT * FROM candidats WHERE id = ?', [candidat_id]);
    if (!candidat) return res.status(404).json({ success: false, message: 'Candidat non trouve.' });
    run('INSERT INTO votes (etudiant_id, candidat_id) VALUES (?, ?)', [etudiant_id, candidat_id]);
    run('UPDATE etudiants SET a_vote = 1 WHERE id = ?', [etudiant_id]);
    res.json({ success: true, message: 'Votre vote a ete enregistre avec succes ! Merci de votre participation.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur lors du vote.' });
  }
});

// API RESULTATS
app.get('/api/resultats', (req, res) => {
  try {
    const resultats = queryAll(`
      SELECT c.id, c.nom, c.programme, c.photo, COUNT(v.id) AS nombre_votes
      FROM candidats c
      LEFT JOIN votes v ON c.id = v.candidat_id
      GROUP BY c.id
      ORDER BY nombre_votes DESC
    `);
    const totalVotes = queryOne('SELECT COUNT(*) as total FROM votes').total;
    const totalEtudiants = queryOne('SELECT COUNT(*) as total FROM etudiants').total;
    const votesExprimes = queryOne('SELECT COUNT(*) as total FROM etudiants WHERE a_vote = 1').total;
    res.json({
      success: true,
      data: {
        resultats,
        totalVotes,
        totalEtudiants,
        votesExprimes,
        tauxParticipation: totalEtudiants > 0 ? ((votesExprimes / totalEtudiants) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('  +------------------------------------------+');
    console.log('  |   VOTE ELECTRONIQUE V2                      |');
    console.log('  |   MIAGE Cergy Pontoise                     |');
    console.log(`  |   http://localhost:${PORT}                     |`);
    console.log('  +------------------------------------------+');
    console.log('');
  });
}).catch(err => {
  console.error('Erreur de demarrage:', err.message);
  process.exit(1);
});
