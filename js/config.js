// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * ============================================================================
 * VEREINS- / VERBANDS-KONFIGURATION ("Testen statt Meckern" – Regelquiz)
 * ============================================================================
 *
 * Konfiguration für den Niedersächsisch-Bremischen Basketballverband e.V. (NBBV)
 */

window.CLUB_CONFIG = {
  // --------------------------------------------------------------------------
  // 1. VERBANDS- / VEREINS-IDENTITÄT & KONTAKT
  // --------------------------------------------------------------------------
  club: {
    // Kurzname (für Header, Titel, Teilen-Text & 10/10-Auswertung)
    shortName: 'NBBV',

    // Vollständiger Name (für Untertitel & Footer)
    fullName: 'Niedersächsisch-Bremischer Basketballverband e.V.',

    // Optionale Zusatzzeile im Footer
    subline: 'Landesverband für Basketball in Niedersachsen und Bremen',

    // Name der Aktion / Initiative
    initiativeName: 'Testen statt Meckern',

    // Kontakt-E-Mail für Schiedsrichter- & Kampfrichter-Interessierte (Auswertungs-Screen)
    contactEmail: 'info@nbbv.de',
  },

  // --------------------------------------------------------------------------
  // 2. FARBEN & ERSCHEINUNGSBILD (NBBV CI)
  // --------------------------------------------------------------------------
  theme: {
    // Strukturfarbe (30 %): NBBV Dunkelblau (#002e48)
    primaryColor: '#002e48',

    // Akzentfarbe (10 %): NBBV Orange/Gold (#d78300)
    accentColor: '#d78300',

    // Form des Logos: '50%' für das runde NBBV-Badge
    logoBorderRadius: '50%',
  },

  // --------------------------------------------------------------------------
  // 3. LOGOS & ICONS (Pfade relativ zur index.html)
  // --------------------------------------------------------------------------
  logos: {
    // Vereinfachtes, zentriertes NBBV-Vektorlogo (Basketball + NBBV-Wortmarke ohne Kleingedrucktes)
    headerLogo: './assets/nbbv-logo.svg',
    cardLogoLight: './assets/nbbv-logo.svg',
    cardLogoDark: './assets/nbbv-logo.svg',
    favicon: './assets/nbbv-logo.svg',
    altText: 'Logo des Niedersächsisch-Bremischen Basketballverbandes e.V. (NBBV)',
  },

  // --------------------------------------------------------------------------
  // 4. IMPRESSUM & DATENSCHUTZ (Offizielle Angaben von www.nbbv.de)
  // --------------------------------------------------------------------------
  legal: {
    organizationName: 'Niedersächsisch-Bremischer Basketballverband e.V. (NBBV)',
    organizationDetails:
      'Registergericht: Amtsgericht Hannover · Registernummer: VR 202 488 · USt-IdNr.: DE349580943',
    representativeName:
      'Vorstand (§ 26 / § 30 BGB): Stefan Körner, Carsten Brokelmann, Jörg Meyer, Erik Schliep, Danny Traupe-Busch',
    street: 'Göttinger Chaussee 115',
    postalCodeCity: '30459 Hannover',
    email: 'info@nbbv.de',
    phone: '0511 449853-11',
    responsiblePersonMStV:
      'Niedersächsisch-Bremischer Basketballverband e.V.\nGöttinger Chaussee 115\n30459 Hannover',
    supervisoryAuthority: 'Landesbeauftragten für den Datenschutz Niedersachsen',

    // Optional: Externe Links statt eingebauter Dialog-Popups
    externalImpressumUrl: '',
    externalPrivacyUrl: '',
  },

  // --------------------------------------------------------------------------
  // 5. ANONYME QUIZ-STATISTIK (GoatCounter – ohne Cookies, DSGVO-konform)
  // --------------------------------------------------------------------------
  analytics: {
    enabled: true,
    endpoint: 'https://biba-regeltest.goatcounter.com/count',
    clubSlug: 'nbbv',
  },
};

/**
 * Sofortige Initialisierung im <head> (vor dem ersten Rendern):
 * Setzt Vereinsfarben, Favicon und Seitentitel ohne "Aufblitzen" (FOUC)
 * und konfiguriert GoatCounter für die vereinsbezogene Seitenaufruf-Zählung.
 */
(function applyEarlyHeadConfig() {
  try {
    const cfg = window.CLUB_CONFIG;
    if (!cfg) return;

    const rootStyle = document.documentElement.style;
    if (cfg.theme?.primaryColor) {
      rootStyle.setProperty('--color-primary', cfg.theme.primaryColor);
    }
    if (cfg.theme?.accentColor) {
      rootStyle.setProperty('--color-accent', cfg.theme.accentColor);
    }
    if (cfg.theme?.logoBorderRadius) {
      rootStyle.setProperty('--logo-border-radius', cfg.theme.logoBorderRadius);
    }

    const shortName = cfg.club?.shortName || 'NBBV';
    const fullName = cfg.club?.fullName || shortName;
    const initiative = cfg.club?.initiativeName || 'Testen statt Meckern';

    document.title = `${initiative} | ${shortName} Basketball-Regelquiz`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = `10 zufällige Basketball-Regelfragen (${shortName} – ${fullName}). Teste dein Regelwissen direkt auf der Tribüne!`;
    }

    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && cfg.logos?.favicon) {
      favicon.href = cfg.logos.favicon;
    }

    // GoatCounter vorab konfigurieren:
    // Seitenaufrufe werden unter `/club/<slug>` gezählt (ermöglicht Besucherstatistik pro Verein),
    // während Quiz-Events (`quiz/q/...`) vereinsübergreifend vergleichbar bleiben.
    if (cfg.analytics?.enabled && cfg.analytics?.endpoint) {
      const rawSlug = cfg.analytics.clubSlug || shortName;
      const slug =
        String(rawSlug)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'default-club';

      window.goatcounter = {
        ...window.goatcounter,
        path: function (p) {
          const cleanPath = p && p !== '/' ? p : '';
          return `/club/${slug}${cleanPath}`;
        },
      };
    } else {
      window.goatcounter = { no_onload: true };
    }
  } catch {
    // Fehler in der Früh-Initialisierung niemals nach außen werfen
  }
})();
