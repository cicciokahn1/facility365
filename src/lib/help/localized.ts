import type { Language } from '@/lib/i18n/dictionary';
import type { HelpCategory, HelpStep } from '@/lib/help/content';

type CategoryCopy = { title: string; description: string };

const CATEGORY_COPY: Record<Exclude<Language, 'de'>, Record<string, CategoryCopy>> = {
  fr: {
    'new-tools': { title: 'Nouveaux outils', description: 'Les nouveaux accès simples pour les concierges.' },
    start: { title: 'Premiers pas', description: 'Découvrir Facility365 et son organisation.' },
    work: { title: 'Mandats, dommages et rapports', description: 'Saisir et terminer le travail quotidien.' },
    technics: { title: 'Technique, entretien et contrôles', description: 'Gérer les installations et prouver les obligations.' },
    cleaning: { title: 'Nettoyage', description: 'Plans, tâches, personnel et qualité.' },
    energy: { title: 'Énergie et solaire', description: 'Consommation, photovoltaïque et rendement.' },
    operations: { title: 'Exploitation', description: 'Inventaire, outils, véhicules, clés et stock.' },
    documents: { title: 'Documents et contrats', description: 'Documents, délais et garanties.' },
    planning: { title: 'Calendrier et tâches', description: 'Rendez-vous, liste du jour et rappels.' },
    finance: { title: 'Factures et analyses', description: 'Offres, factures, coûts et rapports.' },
    admin: { title: 'Utilisateurs et administration', description: 'Rôles, droits, paramètres et corbeille.' },
  },
  it: {
    'new-tools': { title: 'Nuovi strumenti', description: 'I nuovi percorsi semplici per i custodi.' },
    start: { title: 'Primi passi', description: 'Scoprire Facility365 e la sua struttura.' },
    work: { title: 'Ordini, danni e rapporti', description: 'Registrare e completare il lavoro quotidiano.' },
    technics: { title: 'Tecnica, manutenzione e controlli', description: 'Gestire gli impianti e dimostrare gli obblighi.' },
    cleaning: { title: 'Pulizia', description: 'Piani, attività, personale e qualità.' },
    energy: { title: 'Energia e solare', description: 'Consumi, fotovoltaico e rendimento.' },
    operations: { title: 'Gestione operativa', description: 'Inventario, utensili, veicoli, chiavi e magazzino.' },
    documents: { title: 'Documenti e contratti', description: 'Documenti, scadenze e garanzie.' },
    planning: { title: 'Calendario e attività', description: 'Appuntamenti, elenco di oggi e promemoria.' },
    finance: { title: 'Fatture e analisi', description: 'Offerte, fatture, costi e rapporti.' },
    admin: { title: 'Utenti e amministrazione', description: 'Ruoli, diritti, impostazioni e cestino.' },
  },
  en: {
    'new-tools': { title: 'New tools', description: 'The latest simple workflows for caretakers.' },
    start: { title: 'Getting started', description: 'Learn what Facility365 is and how it is organised.' },
    work: { title: 'Orders, damage and reports', description: 'Record and complete daily work.' },
    technics: { title: 'Technical, maintenance and inspections', description: 'Manage assets and prove operator duties.' },
    cleaning: { title: 'Cleaning', description: 'Plans, tasks, staff and quality.' },
    energy: { title: 'Energy and solar', description: 'Consumption, photovoltaics and yield.' },
    operations: { title: 'Operations', description: 'Inventory, tools, vehicles, keys and stock.' },
    documents: { title: 'Documents and contracts', description: 'Documents, deadlines and warranties.' },
    planning: { title: 'Calendar and tasks', description: 'Appointments, today list and reminders.' },
    finance: { title: 'Invoices and analytics', description: 'Quotes, invoices, costs and reports.' },
    admin: { title: 'Users and administration', description: 'Roles, permissions, settings and trash.' },
  },
};

const ARTICLE_TITLES: Record<Exclude<Language, 'de'>, Record<string, string>> = {
  fr: {
    'today-filters': 'Aujourd’hui : tout, en retard et aujourd’hui',
    'inspection-folder': 'Classeur de contrôle du concierge',
    'outdoor-areas': 'Gérer les aménagements extérieurs',
    hazards: 'Registre des produits dangereux',
    fleet: 'Véhicules et machines',
    'private-area': 'Mon espace',
    'github-login': 'Se connecter avec GitHub',
    what: 'Qu’est-ce que Facility365 ?', structure: 'Comment l’application est-elle organisée ?', hierarchy: 'Organisation → site → immeuble → bâtiment → pièce → installation',
    plans: 'Plans de bâtiment, surfaces et postes de travail', orders: 'Créer et traiter des mandats', tickets: 'Helpdesk : annonces et tickets',
    damages: 'Saisir et traiter les dommages', reports: 'Rapports et temps de travail', handover: 'Remise de l’objet',
    assets: 'Utiliser les installations et les codes QR', maintenances: 'Gérer les entretiens', inspections: 'Effectuer des contrôles',
    firesafety: 'Protection incendie et contrôle du chauffage', playgrounds: 'Contrôles des places de jeux', cleaning: 'Organiser le nettoyage',
    energy: 'Saisir l’énergie', solar: 'Photovoltaïque et rendements solaires', operations: 'Inventaire, outils, véhicules, clés et stock',
    documents: 'Gérer les documents, contrats et garanties', calendar: 'Calendrier et tâches', microsoft: 'Microsoft 365 et Outlook',
    finance: 'Offres, factures et coûts', analytics: 'Rapports et analyses', users: 'Utilisateurs, rôles et droits',
    settings: 'Paramètres et notifications', api: 'Interfaces : API et webhooks', trash: 'Corbeille et historique',
  },
  it: {
    'today-filters': 'Oggi: tutto, in ritardo e oggi',
    'inspection-folder': 'Raccoglitore controlli custode',
    'outdoor-areas': 'Gestire le aree esterne',
    hazards: 'Registro delle sostanze pericolose',
    fleet: 'Veicoli e macchine',
    'private-area': 'La mia area',
    'github-login': 'Accedi con GitHub',
    what: 'Che cos’è Facility365?', structure: 'Come è organizzata l’app?', hierarchy: 'Organizzazione → sito → immobile → edificio → locale → impianto',
    plans: 'Piani degli edifici, superfici e postazioni', orders: 'Creare e gestire ordini', tickets: 'Helpdesk: segnalazioni e ticket',
    damages: 'Registrare e gestire i danni', reports: 'Rapporti e tempi di lavoro', handover: 'Consegna dell’immobile',
    assets: 'Usare impianti e codici QR', maintenances: 'Gestire la manutenzione', inspections: 'Eseguire controlli',
    firesafety: 'Protezione antincendio e controllo del riscaldamento', playgrounds: 'Controlli dei parchi giochi', cleaning: 'Organizzare la pulizia',
    energy: 'Registrare l’energia', solar: 'Fotovoltaico e rendimenti solari', operations: 'Inventario, utensili, veicoli, chiavi e magazzino',
    documents: 'Gestire documenti, contratti e garanzie', calendar: 'Calendario e attività', microsoft: 'Microsoft 365 e Outlook',
    finance: 'Offerte, fatture e costi', analytics: 'Rapporti e analisi', users: 'Utenti, ruoli e diritti',
    settings: 'Impostazioni e notifiche', api: 'Interfacce: API e webhook', trash: 'Cestino e cronologia',
  },
  en: {
    'today-filters': 'Today: all, overdue and today',
    'inspection-folder': 'Caretaker inspection folder',
    'outdoor-areas': 'Manage outdoor areas',
    hazards: 'Hazardous substances register',
    fleet: 'Vehicles and machines',
    'private-area': 'My area',
    'github-login': 'Sign in with GitHub',
    what: 'What is Facility365?', structure: 'How is the app organised?', hierarchy: 'Organisation → site → property → building → room → asset',
    plans: 'Building plans, areas and workstations', orders: 'Create and manage orders', tickets: 'Helpdesk: requests and tickets',
    damages: 'Record and process damage', reports: 'Reports and working time', handover: 'Property handover',
    assets: 'Use assets and QR codes', maintenances: 'Manage maintenance', inspections: 'Perform inspections',
    firesafety: 'Fire safety and heating inspections', playgrounds: 'Playground inspections', cleaning: 'Organise cleaning',
    energy: 'Record energy', solar: 'Photovoltaics and solar yield', operations: 'Inventory, tools, vehicles, keys and stock',
    documents: 'Manage documents, contracts and warranties', calendar: 'Calendar and tasks', microsoft: 'Microsoft 365 and Outlook',
    finance: 'Quotes, invoices and costs', analytics: 'Reports and analytics', users: 'Users, roles and permissions',
    settings: 'Settings and notifications', api: 'Interfaces: API and webhooks', trash: 'Trash and history',
  },
};

const STEP_COPY: Record<Exclude<Language, 'de'>, [string, string, string, string, string]> = {
  fr: ['1. Ouvrir', '2. Créer', '3. Modifier', '4. Enregistrer', '5. Terminer'],
  it: ['1. Aprire', '2. Creare', '3. Modificare', '4. Salvare', '5. Completare'],
  en: ['1. Open', '2. Create', '3. Edit', '4. Save', '5. Complete'],
};

const STEP_TEXT: Record<Exclude<Language, 'de'>, [string, string, string, string, string]> = {
  fr: ['Ouvrir le module depuis la navigation.', 'Appuyer sur « Nouveau » et saisir les informations nécessaires.', 'Compléter les données importantes et ajouter une photo si nécessaire.', 'Appuyer sur « Enregistrer ».', 'Utiliser « Terminé » lorsque le travail est fini.'],
  it: ['Aprire il modulo dalla navigazione.', 'Toccare « Nuovo » e inserire le dati necessari.', 'Completare le dati importanti e aggiungere una foto se necessario.', 'Toccare « Salva ».', 'Usare « Completato » quando il lavoro è finito.'],
  en: ['Open the module from the navigation.', 'Select “New” and enter the required information.', 'Complete the important details and add a photo if needed.', 'Select “Save”.', 'Use “Complete” when the work is finished.'],
};

export function localizedHelpCategories(language: Language, categories: HelpCategory[]): HelpCategory[] {
  if (language === 'de') return categories;
  const categoryCopy = CATEGORY_COPY[language];
  const articleTitles = ARTICLE_TITLES[language];
  const stepTitles = STEP_COPY[language];
  const stepTexts = STEP_TEXT[language];

  return categories.map((category) => {
    const localizedCategory = categoryCopy[category.id];
    return {
      ...category,
      title: localizedCategory?.title ?? category.title,
      description: localizedCategory?.description ?? category.description,
      articles: category.articles.map((article) => {
        const title = articleTitles[article.id] ?? article.title;
        return {
          ...article,
          title,
          summary: title,
          paragraphs: [title + '. ' + (localizedCategory?.description ?? '')],
          steps: article.steps
            ? stepTitles.map((stepTitle, index) => ({
                title: stepTitle,
                text: stepTexts[index],
              })) as HelpStep[]
            : undefined,
          keywords: [title, localizedCategory?.title ?? ''],
        };
      }),
    };
  });
}
