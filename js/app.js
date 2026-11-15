// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * "Testen statt Meckern" – Basketball-Regelquiz Engine
 * Reine statische Vanilla-JS-Anwendung für GitHub Pages
 */

const QUESTIONS_PER_ROUND = 10;
const LETTERS = ['A', 'B', 'C', 'D'];

const quizState = {
  allQuestions: [],
  recentQuestionIds: [],
  currentQuestions: [],
  currentIndex: 0,
  score: 0,
  isAnswered: false,
  history: [],
};

let catalogLoadPromise = null;
const pendingAnalyticsEvents = [];

/**
 * Liest die Vereins-Konfiguration aus window.CLUB_CONFIG (js/config.js)
 * mit sicheren Platzhalter-Standardwerten als Fallback.
 */
function getClubConfig() {
  return window.CLUB_CONFIG || {};
}

function getClubShortName() {
  return getClubConfig().club?.shortName || 'BC Musterstadt';
}

function getInitiativeName() {
  return getClubConfig().club?.initiativeName || 'Testen statt Meckern';
}

function getClubSlug() {
  const cfg = getClubConfig();
  const raw = cfg.analytics?.clubSlug || getClubShortName();
  return (
    String(raw)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'default-club'
  );
}

function isAnalyticsEnabled() {
  const analytics = getClubConfig().analytics;
  if (!analytics) return true;
  return Boolean(analytics.enabled && analytics.endpoint);
}

/**
 * Sendet ein anonymes Custom Event an GoatCounter (non-blocking & fehlertolerant).
 * Falls das async-Skript bei schwachem Hallenempfang verzögert lädt, werden frühe
 * Events kurzzeitig im Speicher gepuffert und bei Bereitschaft nachgesendet.
 */
function flushPendingAnalyticsEvents() {
  try {
    if (!isAnalyticsEnabled()) {
      pendingAnalyticsEvents.length = 0;
      return;
    }
    if (!window.goatcounter || typeof window.goatcounter.count !== 'function') {
      return;
    }
    while (pendingAnalyticsEvents.length > 0) {
      const evt = pendingAnalyticsEvents.shift();
      window.goatcounter.count({
        path: evt.path,
        title: evt.title,
        event: true,
      });
    }
  } catch {
    // Tracking-Fehler oder Content-Blocker niemals nach außen werfen
  }
}

function trackEvent(path, title) {
  try {
    if (!isAnalyticsEnabled()) {
      return;
    }
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      flushPendingAnalyticsEvents();
      window.goatcounter.count({
        path,
        title,
        event: true,
      });
    } else if (pendingAnalyticsEvents.length < 25) {
      pendingAnalyticsEvents.push({ path, title });
    }
  } catch {
    // Tracking-Fehler oder Content-Blocker niemals nach außen werfen
  }
}

window.addEventListener('load', flushPendingAnalyticsEvents);

/**
 * Lädt GoatCounter nur dann, wenn in js/config.js aktiviert
 */
function initAnalytics() {
  try {
    if (!isAnalyticsEnabled()) {
      return;
    }
    const endpoint = getClubConfig().analytics?.endpoint || 'https://biba-regeltest.goatcounter.com/count';
    if (document.querySelector('script[data-goatcounter]')) {
      return;
    }
    const script = document.createElement('script');
    script.dataset.goatcounter = endpoint;
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.addEventListener('load', flushPendingAnalyticsEvents);
    document.body.appendChild(script);
  } catch {
    // Niemals Fehler werfen, wenn Content-Blocker greifen
  }
}

/**
 * Überträgt alle Vereins-Einstellungen aus js/config.js (Farben, Logos, Vereinsname,
 * Kontakt-E-Mail, Impressum & Datenschutzerklärung) in das DOM.
 */
function applyClubConfig() {
  const cfg = getClubConfig();
  const shortName = getClubShortName();
  const fullName = cfg.club?.fullName ?? 'Basketball-Club Musterstadt 1990 e.V.';
  const subline = cfg.club?.subline ?? 'Abteilung Basketball · Musterstadt';
  const initiative = getInitiativeName();
  const contactEmail = cfg.club?.contactEmail ?? 'schiri@bc-musterstadt.example';

  // Header
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    if (cfg.logos?.headerLogo) headerLogo.src = cfg.logos.headerLogo;
    if (cfg.logos?.altText) headerLogo.alt = cfg.logos.altText;
  }
  const headerClubName = document.getElementById('header-club-name');
  if (headerClubName) headerClubName.textContent = shortName;

  const headerInitiative = document.getElementById('header-initiative-name');
  if (headerInitiative) headerInitiative.textContent = initiative;

  // Officials-Box (Auswertungs-Screen)
  const logoLight = document.getElementById('officials-logo-light');
  if (logoLight) {
    if (cfg.logos?.cardLogoLight) logoLight.src = cfg.logos.cardLogoLight;
    if (cfg.logos?.altText) logoLight.alt = cfg.logos.altText;
  }
  const logoDark = document.getElementById('officials-logo-dark');
  if (logoDark) {
    if (cfg.logos?.cardLogoDark) logoDark.src = cfg.logos.cardLogoDark;
    if (cfg.logos?.altText) logoDark.alt = cfg.logos.altText;
  }
  const officialsSubtitle = document.getElementById('officials-subtitle');
  if (officialsSubtitle) {
    officialsSubtitle.textContent = fullName || shortName;
  }
  const officialsCta = document.getElementById('officials-cta');
  const officialsContactLink = document.getElementById('officials-contact-link');
  if (officialsContactLink && contactEmail) {
    officialsContactLink.href = `mailto:${contactEmail}`;
    officialsContactLink.textContent = contactEmail;
    if (officialsCta) officialsCta.hidden = false;
  } else if (officialsCta && !contactEmail) {
    officialsCta.hidden = true;
  }

  // Footer
  const footerShort = document.getElementById('footer-club-short');
  if (footerShort) footerShort.textContent = shortName;

  const footerFull = document.getElementById('footer-club-full');
  if (footerFull) {
    footerFull.textContent = fullName && fullName !== shortName ? ` – ${fullName}` : '';
  }

  const footerMeta = document.getElementById('footer-meta');
  if (footerMeta) {
    footerMeta.textContent = subline;
    footerMeta.hidden = !subline;
  }

  const footerInitiative = document.getElementById('footer-initiative-name');
  if (footerInitiative) footerInitiative.textContent = initiative;

  // Rechtliche Angaben (Impressum & Datenschutz)
  const legal = cfg.legal;
  if (legal) {
    // Externe Links vs. eingebaute Dialoge
    const impressumBtn = document.getElementById('footer-impressum-btn');
    const impressumLink = document.getElementById('footer-impressum-link');
    if (legal.externalImpressumUrl && impressumBtn && impressumLink) {
      impressumBtn.hidden = true;
      impressumLink.href = legal.externalImpressumUrl;
      impressumLink.hidden = false;
    }

    const privacyBtn = document.getElementById('footer-privacy-btn');
    const privacyLink = document.getElementById('footer-privacy-link');
    if (legal.externalPrivacyUrl && privacyBtn && privacyLink) {
      privacyBtn.hidden = true;
      privacyLink.href = legal.externalPrivacyUrl;
      privacyLink.hidden = false;
    }

    const orgName = legal.organizationName || `${shortName}${fullName ? ` – ${fullName}` : ''}`;
    const impOrgName = document.getElementById('impressum-org-name');
    if (impOrgName) impOrgName.textContent = orgName;

    const impOrgDetails = document.getElementById('impressum-org-details');
    if (impOrgDetails) {
      impOrgDetails.textContent = legal.organizationDetails || '';
      impOrgDetails.hidden = !legal.organizationDetails;
    }

    const addressLines = [legal.representativeName, legal.street, legal.postalCodeCity]
      .filter(Boolean)
      .join('\n');
    const impAddress = document.getElementById('impressum-address');
    if (impAddress && addressLines) impAddress.textContent = addressLines;

    const legalEmail = legal.email || contactEmail;
    const impEmailLink = document.getElementById('impressum-email-link');
    if (impEmailLink && legalEmail) {
      impEmailLink.href = `mailto:${legalEmail}`;
      impEmailLink.textContent = legalEmail;
    }

    const impPhoneRow = document.getElementById('impressum-phone-row');
    const impPhoneText = document.getElementById('impressum-phone-text');
    if (impPhoneRow && impPhoneText) {
      if (legal.phone) {
        impPhoneText.textContent = legal.phone;
        impPhoneRow.hidden = false;
      } else {
        impPhoneRow.hidden = true;
      }
    }

    const impMstv = document.getElementById('impressum-mstv');
    if (impMstv) {
      impMstv.textContent = legal.responsiblePersonMStV || addressLines;
    }

    // Datenschutzerklärung
    const privOrgName = document.getElementById('privacy-org-name');
    if (privOrgName) privOrgName.textContent = orgName;

    const privAddressLine = document.getElementById('privacy-address-line');
    if (privAddressLine) {
      const singleLineAddr = [legal.representativeName, legal.street, legal.postalCodeCity]
        .filter(Boolean)
        .join(', ');
      if (singleLineAddr) privAddressLine.textContent = singleLineAddr;
    }

    const privEmailLink = document.getElementById('privacy-email-link');
    if (privEmailLink && legalEmail) {
      privEmailLink.href = `mailto:${legalEmail}`;
      privEmailLink.textContent = legalEmail;
    }

    const privAuthority = document.getElementById('privacy-supervisory-authority');
    if (privAuthority && legal.supervisoryAuthority) {
      privAuthority.textContent = legal.supervisoryAuthority;
    }
  }

  // Falls Analytics deaktiviert ist, Abschnitt 4 in der Datenschutzerklärung ausblenden
  // und nachfolgende Überschriften sauber durchnummerieren.
  const analyticsSection = document.getElementById('privacy-analytics-section');
  const storageHeading = document.getElementById('privacy-heading-storage');
  const rightsHeading = document.getElementById('privacy-heading-rights');
  if (!isAnalyticsEnabled()) {
    if (analyticsSection) analyticsSection.hidden = true;
    if (storageHeading) {
      storageHeading.textContent = '4. Lokale Speicherung des Farbschemas (localStorage)';
    }
    if (rightsHeading) {
      rightsHeading.textContent = '5. Deine Rechte';
    }
  }
}

// DOM-Referenzen
const viewStart = document.getElementById('view-start');
const viewQuiz = document.getElementById('view-quiz');
const viewResult = document.getElementById('view-result');
const srAnnouncer = document.getElementById('sr-announcer');

const btnStartQuiz = document.getElementById('btn-start-quiz');
const btnNextQuestion = document.getElementById('btn-next-question');
const btnRestartQuiz = document.getElementById('btn-restart-quiz');
const btnShareResult = document.getElementById('btn-share-result');
const themeToggleBtn = document.getElementById('theme-toggle');

const questionCounter = document.getElementById('question-counter');
const scoreCounter = document.getElementById('score-counter');
const quizProgress = document.getElementById('quiz-progress');
const questionCategory = document.getElementById('question-category');
const questionRole = document.getElementById('question-role');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');

const explanationBox = document.getElementById('explanation-box');
const feedbackBadge = document.getElementById('feedback-badge');
const feedbackHeadline = document.getElementById('feedback-headline');
const explanationText = document.getElementById('explanation-text');
const ruleReference = document.getElementById('rule-reference');

const resultScoreValue = document.getElementById('result-score-value');
const resultRankBadge = document.getElementById('result-rank-badge');
const resultHeadline = document.getElementById('result-headline');
const resultSubtext = document.getElementById('result-subtext');
const reviewList = document.getElementById('review-list');

/**
 * Kryptografisch gestützter Fisher-Yates Shuffle
 */
function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    let j;
    if (window.crypto?.getRandomValues) {
      const rand = new Uint32Array(1);
      window.crypto.getRandomValues(rand);
      j = rand[0] % (i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Lädt den Fragenkatalog einmalig aus ./data/questions.json in den Speicher
 */
async function loadQuestionCatalog() {
  if (quizState.allQuestions.length >= QUESTIONS_PER_ROUND) {
    return quizState.allQuestions;
  }
  if (catalogLoadPromise) {
    return catalogLoadPromise;
  }

  catalogLoadPromise = (async () => {
    try {
      const response = await fetch('./data/questions.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length >= QUESTIONS_PER_ROUND) {
        quizState.allQuestions = data;
      }
    } catch (error) {
      console.error('Fehler beim Laden von ./data/questions.json:', error);
    } finally {
      catalogLoadPromise = null;
    }
    return quizState.allQuestions;
  })();

  return catalogLoadPromise;
}

/**
 * Zieht 10 zufällige Fragen und mischt deren Antwortoptionen
 */
function prepareRoundQuestions() {
  const pool = quizState.allQuestions;

  // Bevorzuge Fragen, die nicht in der direkt vorherigen Runde gestellt wurden
  const freshQuestions = pool.filter((q) => !quizState.recentQuestionIds.includes(q.id));
  const usedQuestions = pool.filter((q) => quizState.recentQuestionIds.includes(q.id));

  const selected = [
    ...shuffleArray(freshQuestions),
    ...shuffleArray(usedQuestions),
  ].slice(0, QUESTIONS_PER_ROUND);

  quizState.recentQuestionIds = selected.map((q) => q.id);

  quizState.currentQuestions = selected.map((q) => {
    const mappedOptions = q.options.map((text, idx) => ({
      text,
      isCorrect: idx === q.correctIndex,
    }));
    return {
      ...q,
      shuffledOptions: shuffleArray(mappedOptions),
    };
  });
}

/**
 * Wechselt die aktive Ansicht und setzt den Tastatur-/Screenreader-Fokus
 */
function switchView(activeView, focusTarget, pageTitle) {
  [viewStart, viewQuiz, viewResult].forEach((view) => {
    view.hidden = view !== activeView;
  });
  document.title = pageTitle;
  if (focusTarget) {
    focusTarget.focus();
  }
}

/**
 * Startet einen neuen Quiz-Durchlauf
 */
async function startQuiz() {
  if (quizState.allQuestions.length < QUESTIONS_PER_ROUND) {
    await loadQuestionCatalog();
  }

  if (quizState.allQuestions.length < QUESTIONS_PER_ROUND) {
    btnStartQuiz.textContent = 'Fragen konnten nicht geladen werden – erneut versuchen';
    return;
  }

  btnStartQuiz.textContent = 'Jetzt Regelwissen testen';
  prepareRoundQuestions();
  quizState.currentIndex = 0;
  quizState.score = 0;
  quizState.isAnswered = false;
  quizState.history = [];

  trackEvent(
    `quiz/club/${getClubSlug()}`,
    `Quiz-Runde gestartet: ${getClubShortName()}`
  );

  renderCurrentQuestion(true);
}

/**
 * Rendert die aktuelle Frage
 */
function renderCurrentQuestion(isFirstQuestion = false) {
  const index = quizState.currentIndex;
  const total = quizState.currentQuestions.length;
  const question = quizState.currentQuestions[index];

  quizState.isAnswered = false;
  explanationBox.hidden = true;
  explanationBox.classList.remove('is-correct-feedback', 'is-wrong-feedback');

  questionCounter.textContent = `Frage ${index + 1} von ${total}`;
  scoreCounter.textContent = `${quizState.score} / ${total} richtig`;
  quizProgress.max = total;
  quizProgress.value = index + 1;

  questionCategory.textContent = question.category;
  questionRole.textContent = `Fokus: ${question.officialRole}`;
  questionText.textContent = question.question;

  optionsContainer.replaceChildren();

  question.shuffledOptions.forEach((opt, optIdx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.dataset.index = String(optIdx);

    const letterSpan = document.createElement('span');
    letterSpan.className = 'option-letter';
    letterSpan.setAttribute('aria-hidden', 'true');
    letterSpan.textContent = LETTERS[optIdx] ?? String(optIdx + 1);

    const contentSpan = document.createElement('span');
    contentSpan.className = 'option-content';
    contentSpan.textContent = opt.text;

    btn.append(letterSpan, contentSpan);
    btn.addEventListener('click', () => handleAnswerSelection(optIdx));
    optionsContainer.appendChild(btn);
  });

  const pageTitle = `Frage ${index + 1} von ${total} | ${getClubShortName()} Regelquiz`;
  if (isFirstQuestion || viewQuiz.hidden) {
    switchView(viewQuiz, questionText, pageTitle);
  } else {
    document.title = pageTitle;
    questionText.focus();
  }

  const stepNumber = String(index + 1).padStart(2, '0');
  trackEvent(
    `quiz/step/${stepNumber}`,
    `Quiz-Fortschritt: Frage ${index + 1} von ${total}`
  );
}

/**
 * Verarbeitet die Auswahl einer Antwortoption
 */
function handleAnswerSelection(selectedIndex) {
  if (quizState.isAnswered) {
    return;
  }
  quizState.isAnswered = true;

  const question = quizState.currentQuestions[quizState.currentIndex];
  const selectedOption = question.shuffledOptions[selectedIndex];
  const isCorrect = Boolean(selectedOption?.isCorrect);

  if (isCorrect) {
    quizState.score += 1;
  }

  const total = quizState.currentQuestions.length;
  scoreCounter.textContent = `${quizState.score} / ${total} richtig`;

  const buttons = optionsContainer.querySelectorAll('.option-btn');
  buttons.forEach((btn, idx) => {
    btn.setAttribute('aria-disabled', 'true');
    const opt = question.shuffledOptions[idx];

    if (opt.isCorrect) {
      btn.classList.add('is-correct');
      const tag = document.createElement('span');
      tag.className = 'option-state-tag';
      tag.textContent = idx === selectedIndex ? '✓ Richtig' : '✓ Richtige Lösung';
      btn.appendChild(tag);
    } else if (idx === selectedIndex) {
      btn.classList.add('is-wrong');
      const tag = document.createElement('span');
      tag.className = 'option-state-tag';
      tag.textContent = '✗ Falsch';
      btn.appendChild(tag);
    }
  });

  const correctOption = question.shuffledOptions.find((o) => o.isCorrect);
  quizState.history.push({
    question: question.question,
    chosenText: selectedOption.text,
    correctText: correctOption ? correctOption.text : '',
    isCorrect,
    explanation: question.explanation,
    ruleReference: question.ruleReference,
  });

  explanationBox.classList.toggle('is-correct-feedback', isCorrect);
  explanationBox.classList.toggle('is-wrong-feedback', !isCorrect);

  if (isCorrect) {
    feedbackBadge.textContent = '✓ Richtig';
    feedbackHeadline.textContent = 'Stark! Genau richtig entschieden.';
  } else {
    feedbackBadge.textContent = '✗ Knapp daneben';
    feedbackHeadline.textContent = 'Hier liegt die Tribüne oft falsch!';
  }

  explanationText.textContent = question.explanation;
  ruleReference.textContent = `📖 Offizielle Regel: ${question.ruleReference}`;

  const isLastQuestion = quizState.currentIndex + 1 >= total;
  btnNextQuestion.textContent = isLastQuestion ? 'Zur Auswertung' : 'Nächste Frage';

  explanationBox.hidden = false;
  srAnnouncer.textContent = `${feedbackBadge.textContent}. ${feedbackHeadline.textContent} ${question.explanation}`;

  const questionId = question.id || `q-${quizState.currentIndex + 1}`;
  const outcome = isCorrect ? 'correct' : 'wrong';
  const outcomeLabel = isCorrect ? 'Richtig' : 'Falsch';
  trackEvent(
    `quiz/q/${outcome}/${questionId}`,
    `${outcomeLabel}: ${questionId} (${question.category})`
  );
}

/**
 * Liefert den passenden Auswertungstext für 0/10 bis 10/10 gemäß Vorgabe
 */
function getEvaluation(score) {
  if (score === 0) {
    return {
      rank: '😅 Tribünen-Rookie',
      headline:
        '0/10 Richtige! Versuch es gleich noch einmal, vielleicht hast du ja etwas gelernt.',
      subtext:
        'Keine Sorge: Basketball hat eines der detailliertesten Regelwerke im Weltsport. Genau deshalb machen unsere Schiedsrichter und Kampfrichter extra Lehrgänge!',
    };
  }
  if (score <= 2) {
    return {
      rank: '👀 Bauchgefühl-Coach',
      headline: `${score}/10 Richtige! Da war noch viel Bauchgefühl dabei – versuch es gleich noch einmal!`,
      subtext:
        'Man sieht: Was von der Tribüne nach einem klaren Fehlpfiff aussieht, ist im offiziellen Regelwerk oft ganz anders geregelt.',
    };
  }
  if (score <= 4) {
    return {
      rank: '🏀 Halbzeit-Theoretiker',
      headline: `${score}/10 Richtige! Ein paar Grundlagen sitzen schon, aber die Details haben es in sich.`,
      subtext:
        'Unsere Schiedsrichter und Anschreiber müssen all diese Feinheiten nicht nur kennen, sondern unter Zeitdruck live entscheiden.',
    };
  }
  if (score === 5) {
    return {
      rank: '⚖️ Solides Mittelfeld',
      headline:
        '5/10 Richtige! Das ist schon nicht schlecht, aber für den Schiri-Schein reicht es noch nicht.',
      subtext:
        'Die Hälfte sitzt! Bei den kniffligen Fällen merkt man aber schnell, wie viel Wissen hinter jedem Pfiff und jedem Signal am Tisch steckt.',
    };
  }
  if (score <= 7) {
    return {
      rank: '👏 Regel-Kenner',
      headline: `${score}/10 Richtige! Starkes Ergebnis – du hast schon ein richtig gutes Auge fürs Spiel!`,
      subtext:
        'Du lässt dich von typischen Basketball-Mythen kaum täuschen. Wie wäre es mal mit einem Blick hinter die Kulissen am Kampfrichtertisch?',
    };
  }
  if (score <= 9) {
    return {
      rank: '🔥 Kampfgericht-Kandidat',
      headline: `${score}/10 Richtige! Fast fehlerfrei – du kennst die Regeln besser als 95 % der Halle!`,
      subtext:
        'Mit diesem Regelwissen weißt du genau, wie anspruchsvoll der Job unserer Unparteiischen und Anschreiber ist.',
    };
  }
  const shortName = getClubShortName();
  let clubPhrase = `bei ${shortName}`;
  if (shortName === 'BG BiBA') {
    clubPhrase = 'bei der BG BiBA';
  } else if (shortName === 'NBBV') {
    clubPhrase = 'beim NBBV';
  }
  return {
    rank: '🏆 Schiri-Versteher',
    headline:
      '10/10 Richtige! Perfekt - Du weißt wahrscheinlich ganz genau wie schwer es ist immer die richtigen Entscheidungen zu treffen.',
    subtext: `Volle Punktzahl! Entweder hast du selbst schon die Pfeife in der Hand gehabt – oder du bist unser nächstes Talent für Schiedsrichter & Kampfgericht ${clubPhrase}!`,
  };
}

/**
 * Zeigt die Endauswertung an
 */
function showResults() {
  const score = quizState.score;
  const total = quizState.currentQuestions.length;
  const evaluation = getEvaluation(score);

  resultScoreValue.textContent = `${score}/${total}`;
  resultRankBadge.textContent = evaluation.rank;
  resultHeadline.textContent = evaluation.headline;
  resultSubtext.textContent = evaluation.subtext;

  // Rückblick-Liste aller 10 Fragen aufbauen
  reviewList.replaceChildren();
  quizState.history.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'review-item';

    const title = document.createElement('strong');
    title.textContent = `${item.isCorrect ? '✓' : '✗'} ${item.question}`;

    const answerP = document.createElement('p');
    answerP.className = 'review-item-answer';
    answerP.textContent = `Richtige Antwort: ${item.correctText}`;

    const refP = document.createElement('p');
    refP.className = 'review-item-ref';
    refP.textContent = item.ruleReference;

    li.append(title, answerP, refP);
    reviewList.appendChild(li);
  });

  switchView(
    viewResult,
    resultHeadline,
    `Auswertung: ${score}/${total} | ${getClubShortName()} Regelquiz`
  );

  const paddedScore = String(score).padStart(2, '0');
  trackEvent(
    `quiz/finish/score-${paddedScore}`,
    `Quiz abgeschlossen: ${score} von ${total} richtig`
  );
}

/**
 * Teilt das Quiz-Ergebnis über Web Share API oder Zwischenablage
 */
async function shareResult() {
  const total = quizState.currentQuestions.length || QUESTIONS_PER_ROUND;
  const shortName = getClubShortName();
  const initiative = getInitiativeName();
  const shareText = `🏀 Ich habe ${quizState.score}/${total} Richtige beim ${shortName} Basketball-Regelquiz „${initiative}“ geschafft! Schaffst du mehr?`;
  const shareUrl = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${initiative} – ${shortName} Regelquiz`,
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch {
      // Nutzer hat Teilen abgebrochen oder Fallback nötig
    }
  }

  try {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    const originalText = btnShareResult.textContent;
    btnShareResult.textContent = '✓ In Zwischenablage kopiert!';
    setTimeout(() => {
      btnShareResult.textContent = originalText;
    }, 2500);
  } catch {
    // Falls Clipboard nicht verfügbar ist, nichts tun
  }
}

/**
 * Zwei-Stufen Dark-Mode-Toggle nach modern-web-guidance (dark-mode-toggle)
 */
function initThemeToggle() {
  const metaScheme = document.querySelector('meta[name="color-scheme"]');
  if (!metaScheme || !themeToggleBtn) {
    return;
  }

  themeToggleBtn.addEventListener('click', () => {
    let stored = null;
    try {
      stored = localStorage.getItem('color-scheme');
    } catch {}

    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemScheme = systemIsDark ? 'dark' : 'light';
    const currentRendered = stored === 'dark' || stored === 'light' ? stored : systemScheme;
    const targetScheme = currentRendered === 'dark' ? 'light' : 'dark';

    try {
      if (targetScheme !== systemScheme) {
        localStorage.setItem('color-scheme', targetScheme);
        metaScheme.content = targetScheme;
      } else {
        localStorage.removeItem('color-scheme');
        metaScheme.content = 'light dark';
      }
    } catch {
      metaScheme.content = targetScheme;
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'color-scheme') {
      metaScheme.content = event.newValue ?? 'light dark';
    }
  });
}

/**
 * Initialisiert die rechtlichen Dialoge (Impressum & Datenschutzerklärung)
 * inkl. Light-Dismiss-Fallback für Browser ohne natives closedby="any"
 */
function initLegalDialogs() {
  for (const trigger of document.querySelectorAll('[data-dialog-open]')) {
    trigger.addEventListener('click', () => {
      const targetId = trigger.getAttribute('data-dialog-open');
      const dialog = targetId ? document.getElementById(targetId) : null;
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
    });
  }

  if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
    const isOutsideDialog = (event, dialog) => {
      const rect = dialog.getBoundingClientRect();
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      );
    };

    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (event) => {
        pressedOutside = event.target === dialog && isOutsideDialog(event, dialog);
      });
      dialog.addEventListener('pointerup', (event) => {
        if (pressedOutside && event.target === dialog && isOutsideDialog(event, dialog)) {
          dialog.close();
        }
      });
    }
  }
}

// Event-Listener registrieren
btnStartQuiz.addEventListener('click', startQuiz);

btnNextQuestion.addEventListener('click', () => {
  if (quizState.currentIndex + 1 < quizState.currentQuestions.length) {
    quizState.currentIndex += 1;
    renderCurrentQuestion(false);
  } else {
    showResults();
  }
});

btnRestartQuiz.addEventListener('click', startQuiz);
btnShareResult.addEventListener('click', shareResult);

// Initialisierung
applyClubConfig();
initAnalytics();
initThemeToggle();
initLegalDialogs();
loadQuestionCatalog();
