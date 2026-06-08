/**
 * DATABASE.JS V2 - SQLite via sql.js (100% JavaScript)
 * MIAGE Cergy Pontoise - Vote Electronique V2
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'vote.db');

let db = null;

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS candidats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      programme TEXT NOT NULL,
      photo TEXT DEFAULT 'default.png'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS etudiants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifiant TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      a_vote INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      etudiant_id INTEGER NOT NULL,
      candidat_id INTEGER NOT NULL,
      date_vote DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const candidatCount = queryOne("SELECT COUNT(*) as count FROM candidats");
  if (candidatCount.count === 0) {
    const candidats = [
      { nom: 'Amine TAZI', programme: "Mettre en place une plateforme collaborative pour les travaux de groupe. Organiser des hackathons mensuels pour encourager l'innovation. Créer un système d'entraide entre étudiants pour les examens.", photo: 'candidat1.png' },
      { nom: 'Layla BOUKHARI', programme: "Développer un réseau d'anciens élèves pour faciliter les stages et l'insertion professionnelle. Proposer des ateliers de préparation aux entretiens d'embauche. Améliorer les espaces de détente et de récréation du campus.", photo: 'candidat2.png' },
      { nom: 'Yassine RAHAL', programme: "Créer une bibliothèque numérique partagée avec les ressources de tous les cours. Mettre en place un tutorat peer-to-peer entre étudiants de différentes années. Organiser des conférences avec des professionnels de l'industrie tech.", photo: 'candidat3.png' },
      { nom: 'Nour HAMDANI', programme: "Digitaliser le processus de candidature aux projets académiques. Créer une application de covoiturage étudiant. Installer des bornes de recharge pour appareils dans les salles de cours.", photo: 'candidat4.png' }
    ];
    for (const c of candidats) {
      db.run("INSERT INTO candidats (nom, programme, photo) VALUES (?, ?, ?)", [c.nom, c.programme, c.photo]);
    }
  }

  const etudiantCount = queryOne("SELECT COUNT(*) as count FROM etudiants");
  if (etudiantCount.count === 0) {
    const etudiants = [
      { identifiant: 'ETU001', nom: 'Sofiane KHEDIRI' },
      { identifiant: 'ETU002', nom: 'Ines GUERBOUA' },
      { identifiant: 'ETU003', nom: 'Rami BOUTAYEB' },
      { identifiant: 'ETU004', nom: 'Chloe MOREL' },
      { identifiant: 'ETU005', nom: 'Walid AIT ALI' },
      { identifiant: 'ETU006', nom: 'Sarah FERHAT' },
      { identifiant: 'ETU007', nom: 'Mehdi OUAZAD' },
      { identifiant: 'ETU008', nom: 'Lydia TISSERAND' },
      { identifiant: 'ETU009', nom: 'Hamza BENMOUSSA' },
      { identifiant: 'ETU010', nom: 'Rania DJEBBAR' }
    ];
    for (const e of etudiants) {
      db.run("INSERT INTO etudiants (identifiant, nom) VALUES (?, ?)", [e.identifiant, e.nom]);
    }
  }

  sauvegarder();
  console.log('Base de données SQLite V2 initialisée avec succes !');
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function run(sql, params = []) {
  db.run(sql, params);
  sauvegarder();
}

function sauvegarder() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

module.exports = { initDatabase, queryAll, queryOne, run, sauvegarder };
