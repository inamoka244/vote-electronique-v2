/**
 * VOTE ELECTRONIQUE V2 - Vanilla JS
 * MIAGE Cergy Pontoise
 */

const API_BASE = '';
let etudiantCourant = null;
let candidatSelectionne = null;
let tousLesCandidats = [];

document.addEventListener('DOMContentLoaded', () => {
  chargerCandidats();
});

// ---- NAVIGATION ----
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.nav-link[data-page="${name}"]`).classList.add('active');
  document.getElementById('navLinks').classList.remove('open');
  if (name === 'candidats') chargerCandidats();
  if (name === 'resultats') chargerResultats();
  if (name === 'vote') resetForm();
}

function toggleNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ---- CANDIDATS ----
async function chargerCandidats() {
  const grid = document.getElementById('candidats-grid');
  grid.innerHTML = '<div class="loader"><div class="dot-pulse"></div><p>Chargement...</p></div>';
  try {
    const res = await fetch(`${API_BASE}/api/candidats`);
    const json = await res.json();
    if (!json.success) throw new Error();
    tousLesCandidats = json.data;
    grid.innerHTML = json.data.map(c => `
      <div class="card-v2">
        <div class="card-photo">
          <img src="/images/${c.photo}" alt="${esc(c.nom)}" onerror="this.parentElement.style.background='linear-gradient(135deg,rgba(232,85,61,0.3),rgba(245,166,35,0.2))'">
        </div>
        <div class="card-body">
          <div class="card-name">${esc(c.nom)}</div>
          <div class="card-program">${esc(c.programme)}</div>
          <button class="btn-accent btn-full" onclick="showPage('vote')">Voter pour ce candidat</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    grid.innerHTML = '<div class="loader"><p style="color:var(--danger)">Impossible de charger les candidats.</p></div>';
  }
}

// ---- VOTE STEP 1 ----
async function verifierEtudiant() {
  const input = document.getElementById('identifiant');
  const id = input.value.trim();
  const msg = document.getElementById('msg-id');
  if (!id) { showMsg(msg, 'Veuillez entrer votre identifiant.', 'error'); return; }
  showMsg(msg, 'Verification...', '');
  try {
    const res = await fetch(`${API_BASE}/api/vote/verifier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiant: id })
    });
    const json = await res.json();
    if (!json.success) { showMsg(msg, json.message, 'error'); return; }
    etudiantCourant = json.data;
    showMsg(msg, `Bienvenue ${etudiantCourant.nom} !`, 'success');
    setTimeout(() => showStep2(), 800);
  } catch (e) {
    showMsg(msg, 'Erreur de connexion au serveur.', 'error');
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('step-1').classList.contains('active')) verifierEtudiant();
});

// ---- VOTE STEP 2 ----
function showStep2() {
  document.getElementById('step-1').classList.remove('active');
  document.getElementById('step-2').classList.add('active');
  document.getElementById('etu-info').textContent = `Etudiant : ${etudiantCourant.nom} (${etudiantCourant.identifiant})`;
  if (tousLesCandidats.length === 0) {
    fetch(`${API_BASE}/api/candidats`).then(r => r.json()).then(json => {
      tousLesCandidats = json.data;
      renderVoteList(tousLesCandidats);
    });
  } else {
    renderVoteList(tousLesCandidats);
  }
}

function renderVoteList(list) {
  document.getElementById('candidats-vote-list').innerHTML = list.map(c => `
    <div class="vote-item" onclick="pickCandidat(${c.id},'${esc(c.nom)}')" data-id="${c.id}">
      <div class="vote-avatar"><img src="/images/${c.photo}" alt="${esc(c.nom)}" onerror="this.style.display='none'"></div>
      <div>
        <div class="vote-item-name">${esc(c.nom)}</div>
        <div class="vote-item-prog">${esc(c.programme)}</div>
      </div>
      <div class="vote-check"></div>
    </div>
  `).join('');
}

function pickCandidat(id, nom) {
  candidatSelectionne = { id, nom };
  document.querySelectorAll('.vote-item').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.id) === id);
  });
  setTimeout(() => showStep3(), 400);
}

// ---- VOTE STEP 3 ----
function showStep3() {
  document.getElementById('step-2').classList.remove('active');
  document.getElementById('step-3').classList.add('active');
  document.getElementById('confirm-box').innerHTML = `
    <div class="confirm-name">${esc(candidatSelectionne.nom)}</div>
    <div class="confirm-etu">Vote de : ${esc(etudiantCourant.nom)} (${etudiantCourant.identifiant})</div>
  `;
}

function goBack() {
  document.getElementById('step-3').classList.remove('active');
  document.getElementById('step-2').classList.add('active');
  candidatSelectionne = null;
}

// ---- CONFIRM VOTE ----
async function confirmerVote() {
  if (!etudiantCourant || !candidatSelectionne) return;
  try {
    const res = await fetch(`${API_BASE}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etudiant_id: etudiantCourant.id, candidat_id: candidatSelectionne.id })
    });
    const json = await res.json();
    if (!json.success) { alert('Erreur : ' + json.message); return; }
    document.getElementById('step-3').classList.remove('active');
    document.getElementById('step-success').classList.add('active');
    document.getElementById('success-msg').textContent = json.message;
  } catch (e) {
    alert("Erreur de connexion lors de l'enregistrement du vote.");
  }
}

// ---- RESULTATS ----
async function chargerResultats() {
  const el = document.getElementById('resultats-list');
  el.innerHTML = '<div class="loader"><div class="dot-pulse"></div><p>Chargement...</p></div>';
  try {
    const res = await fetch(`${API_BASE}/api/resultats`);
    const json = await res.json();
    if (!json.success) throw new Error();
    const d = json.data;
    document.getElementById('s-votes').textContent = d.votesExprimes;
    document.getElementById('s-inscrits').textContent = d.totalEtudiants;
    document.getElementById('s-taux').textContent = d.tauxParticipation + '%';
    if (d.resultats.length === 0 || d.totalVotes === 0) {
      el.innerHTML = '<p style="text-align:center;color:var(--text-dim)">Aucun vote enregistre.</p>';
      return;
    }
    el.innerHTML = d.resultats.map((c, i) => {
      const pct = ((c.nombre_votes / d.totalVotes) * 100).toFixed(1);
      const rc = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : 'rx';
      return `
        <div class="result-row">
          <div class="rank-badge ${rc}">${i + 1}</div>
          <div class="result-info">
            <div class="result-name">${esc(c.nom)}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          </div>
          <div class="result-score">
            <div class="score-num">${c.nombre_votes}</div>
            <div class="score-pct">${pct}%</div>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = '<div class="loader"><p style="color:var(--danger)">Erreur de chargement.</p></div>';
  }
}

// ---- UTILS ----
function resetForm() {
  etudiantCourant = null;
  candidatSelectionne = null;
  document.getElementById('identifiant').value = '';
  document.getElementById('msg-id').className = 'msg-box';
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step-1').classList.add('active');
}

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = `msg-box show ${type}`;
}

function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}
