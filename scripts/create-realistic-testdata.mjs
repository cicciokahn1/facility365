import { writeFileSync } from "node:fs";

const now = "2026-09-13T12:00:00.000Z";
const address = (street, zip, city) => ({ street, zip, city, country: "Schweiz" });
const base = (id, number, notes = "TESTDATEN – realistische Praxisszenarien") => ({
  id,
  number,
  createdAt: now,
  updatedAt: now,
  notes,
  photos: [],
  documents: [],
  history: [],
});
const checklist = (...texts) =>
  texts.map((text, index) => ({ id: `check_${index + 1}`, text, done: index === 0 }));
const file = (id, name, category, linkedModule, linkedId) => ({
  id,
  name,
  type: "PDF",
  mimeType: "application/pdf",
  url: "data:application/pdf;base64,",
  size: 1024,
  uploadedAt: now,
  uploadedBy: "Testdaten Facility365",
  category,
  linkedModule,
  linkedId,
});

const customers = [
  {
    ...base("cus_alpenblick", "KD-TEST-001"),
    type: "company",
    name: "Stiftung Alpenblick Pflege",
    firstName: "",
    address: address("Seestrasse 18", "6005", "Luzern"),
    phone: "041 555 20 20",
    mobile: "",
    email: "verwaltung@alpenblick.example",
    website: "https://alpenblick.example",
    status: "active",
    contacts: [],
    contracts: [],
  },
  {
    ...base("cus_schulverband", "KD-TEST-002"),
    type: "company",
    name: "Schulverband Sonnenrain",
    firstName: "",
    address: address("Schulhausweg 4", "3012", "Bern"),
    phone: "031 555 10 10",
    mobile: "",
    email: "verwaltung@sonnenrain.example",
    website: "",
    status: "active",
    contacts: [],
    contracts: [],
  },
  {
    ...base("cus_stadtverwaltung", "KD-TEST-003"),
    type: "company",
    name: "Stadtverwaltung Musterstadt",
    firstName: "",
    address: address("Rathausplatz 1", "8001", "Zürich"),
    phone: "044 555 30 30",
    mobile: "",
    email: "immobilien@musterstadt.example",
    website: "",
    status: "active",
    contacts: [],
    contracts: [],
  },
  {
    ...base("cus_wohnraum", "KD-TEST-004"),
    type: "company",
    name: "Wohnraum Limmat AG",
    firstName: "",
    address: address("Limmatstrasse 88", "8005", "Zürich"),
    phone: "044 555 40 40",
    mobile: "",
    email: "verwaltung@wohnraum.example",
    website: "",
    status: "active",
    contacts: [],
    contracts: [],
  },
  {
    ...base("cus_werk", "KD-TEST-005"),
    type: "company",
    name: "Helvetia Präzisionstechnik AG",
    firstName: "",
    address: address("Industriestrasse 22", "9000", "St. Gallen"),
    phone: "071 555 50 50",
    mobile: "",
    email: "facility@helvetia-technik.example",
    website: "",
    status: "active",
    contacts: [],
    contracts: [],
  },
];

const organizations = [
  {
    ...base("org_facility", "OR-TEST-001"),
    name: "Facility365 Testorganisation",
    shortName: "F365 TEST",
    address: address("Teststrasse 1", "8000", "Zürich"),
    manager: "Martina Keller",
    phone: "044 555 00 00",
    email: "facility365-test@example",
    website: "",
    status: "active",
    description: "Zentrale Organisation für realistische Praxisszenarien.",
  },
];

const siteSpecs = [
  ["site_alpenblick", "ST-TEST-001", "Campus Alpenblick", "ALP", "cus_alpenblick", "Luzern", "Seestrasse 18", "6005"],
  ["site_sonnenrain", "ST-TEST-002", "Schulstandort Sonnenrain", "SON", "cus_schulverband", "Bern", "Schulhausweg 4", "3012"],
  ["site_rathaus", "ST-TEST-003", "Verwaltungsstandort Zentrum", "RATH", "cus_stadtverwaltung", "Zürich", "Rathausplatz 1", "8001"],
  ["site_limmat", "ST-TEST-004", "Wohnsiedlung Limmatgarten", "LIM", "cus_wohnraum", "Zürich", "Limmatstrasse 88", "8005"],
  ["site_helvetia", "ST-TEST-005", "Produktionsstandort Ost", "HPT", "cus_werk", "St. Gallen", "Industriestrasse 22", "9000"],
];
const sites = siteSpecs.map(([id, number, name, shortName, customerId, city, street, zip]) => ({
  ...base(id, number),
  name,
  shortName,
  organizationId: "org_facility",
  customerId,
  address: address(street, zip, city),
  manager: "Facility365 Testteam",
  phone: "044 555 00 01",
  email: "facility365-test@example",
  status: "active",
  description: "Teststandort mit vollständiger Objektstruktur.",
}));

const propertySpecs = [
  ["prop_alpenblick", "LI-TEST-001", "Alters- und Pflegeheim Alpenblick", "site_alpenblick", "cus_alpenblick", 4200],
  ["prop_sonnenrain", "LI-TEST-002", "Schulgebäude Sonnenrain", "site_sonnenrain", "cus_schulverband", 6100],
  ["prop_rathaus", "LI-TEST-003", "Verwaltungsgebäude Zentrum", "site_rathaus", "cus_stadtverwaltung", 7800],
  ["prop_limmat", "LI-TEST-004", "Mehrfamilienhaus Limmatgarten", "site_limmat", "cus_wohnraum", 2950],
  ["prop_helvetia", "LI-TEST-005", "Gewerbe- und Industriegebäude Ost", "site_helvetia", "cus_werk", 12400],
];
const properties = propertySpecs.map(([id, number, name, siteId, customerId, area]) => ({
  ...base(id, number),
  name,
  siteId,
  customerId,
  address: address(
    propertySpecs.find((entry) => entry[0] === id)[2].includes("Alpenblick")
      ? "Seestrasse 18"
      : sites.find((site) => site.id === siteId).address.street,
    sites.find((site) => site.id === siteId).address.zip,
    sites.find((site) => site.id === siteId).address.city,
  ),
  status: "active",
  contractStart: "2026-01-01",
  contractEnd: "2029-12-31",
  plans: [],
  area,
}));

const buildingSpecs = [
  ["bld_alpenblick", "GB-TEST-001", "Hauptgebäude Pflege", "prop_alpenblick", "2012", 4200],
  ["bld_sonnenrain", "GB-TEST-002", "Schulhaus A", "prop_sonnenrain", "1988", 3900],
  ["bld_sonnenrain_turn", "GB-TEST-003", "Turnhalle und Aula", "prop_sonnenrain", "1996", 2200],
  ["bld_rathaus", "GB-TEST-004", "Verwaltungshochhaus", "prop_rathaus", "2004", 7800],
  ["bld_limmat", "GB-TEST-005", "Wohnhaus Limmatgarten 1", "prop_limmat", "1978", 2950],
  ["bld_helvetia", "GB-TEST-006", "Produktions- und Logistikhalle", "prop_helvetia", "2018", 12400],
];
const floorsFor = (buildingId, buildingArea) => [
  { id: `${buildingId}_ug`, name: "Untergeschoss", level: -1, area: Math.round(buildingArea * 0.28), grossArea: Math.round(buildingArea * 0.3), netArea: Math.round(buildingArea * 0.25), usableArea: Math.round(buildingArea * 0.2), trafficArea: Math.round(buildingArea * 0.04), functionalArea: Math.round(buildingArea * 0.18), secondaryArea: Math.round(buildingArea * 0.03), energyReferenceArea: Math.round(buildingArea * 0.22), note: "Technik, Lager und Nebenräume" },
  { id: `${buildingId}_eg`, name: "Erdgeschoss", level: 0, area: Math.round(buildingArea * 0.38), grossArea: Math.round(buildingArea * 0.4), netArea: Math.round(buildingArea * 0.34), usableArea: Math.round(buildingArea * 0.28), trafficArea: Math.round(buildingArea * 0.06), functionalArea: Math.round(buildingArea * 0.25), secondaryArea: Math.round(buildingArea * 0.03), energyReferenceArea: Math.round(buildingArea * 0.35), note: "Hauptzugang und öffentliche Bereiche" },
  { id: `${buildingId}_og1`, name: "1. Obergeschoss", level: 1, area: Math.round(buildingArea * 0.34), grossArea: Math.round(buildingArea * 0.35), netArea: Math.round(buildingArea * 0.3), usableArea: Math.round(buildingArea * 0.25), trafficArea: Math.round(buildingArea * 0.05), functionalArea: Math.round(buildingArea * 0.23), secondaryArea: Math.round(buildingArea * 0.02), energyReferenceArea: Math.round(buildingArea * 0.31), note: "Regelgeschoss" },
];
const buildings = buildingSpecs.map(([id, number, name, propertyId, yearBuilt, area]) => ({
  ...base(id, number),
  name,
  propertyId,
  address: properties.find((property) => property.id === propertyId).address,
  yearBuilt,
  area,
  status: "active",
  description: "Gebäude für Praxistests der CAFM-Prozesse.",
  floors: floorsFor(id, area),
  plans: [],
}));

const roomKinds = [
  ["Empfang", "Empfang", "HNF", "NUF"],
  ["Büro Hausdienst", "Büro", "HNF", "NUF"],
  ["Technikzentrale", "Technik", "NNF", "TF"],
  ["Sanitäranlage", "Sanitär", "NNF", "NUF"],
  ["Korridor", "Verkehrsfläche", "VF", "VF"],
  ["Lager", "Lager", "NNF", "NUF"],
];
const rooms = [];
for (const building of buildings) {
  for (const [index, floor] of building.floors.entries()) {
    const count = index === 0 ? 2 : 3;
    for (let roomIndex = 0; roomIndex < count; roomIndex += 1) {
      const spec = roomKinds[(index * 2 + roomIndex) % roomKinds.length];
      const id = `${building.id}_room_${index + 1}_${roomIndex + 1}`;
      rooms.push({
        ...base(id, `RM-TEST-${String(rooms.length + 1).padStart(3, "0")}`),
        name: `${spec[0]} ${floor.name}`,
        roomNumber: `${floor.level < 0 ? "U" : floor.level === 0 ? "E" : floor.level}0${roomIndex + 1}`,
        buildingId: building.id,
        floorId: floor.id,
        type: spec[1],
        area: 14 + index * 6 + roomIndex * 4,
        sia416AreaType: spec[2],
        din277AreaType: spec[3],
        workplaces: spec[1] === "Büro" ? 4 : 0,
        workplaceList: spec[1] === "Büro"
          ? [
              { id: `${id}_wp1`, code: `${building.id.toUpperCase()}-AP-01`, occupant: "Nora Meier", status: "occupied" },
              { id: `${id}_wp2`, code: `${building.id.toUpperCase()}-AP-02`, occupant: "", status: "free" },
            ]
          : [],
        occupant: "",
        status: "active",
        description: "Raum mit SIA-416- und DIN-277-Zuordnung.",
      });
    }
  }
}

const suppliers = [
  { ...base("sup_hls", "LF-TEST-001"), name: "HLS Service Zürich AG", contactPerson: "Daniel Frei", address: address("Werkstrasse 7", "8050", "Zürich"), phone: "044 555 61 61", mobile: "", email: "service@hls.example", website: "", category: "Heizung/Lüftung/Sanitär", status: "active", hourlyRate: 145 },
  { ...base("sup_clean", "LF-TEST-002"), name: "SauberPlus Facility Services", contactPerson: "Elena Rossi", address: address("Gewerbeweg 12", "3008", "Bern"), phone: "031 555 62 62", mobile: "", email: "einsatz@sauberplus.example", website: "", category: "Reinigung", status: "active", hourlyRate: 58 },
  { ...base("sup_fire", "LF-TEST-003"), name: "Securitas Brandschutz GmbH", contactPerson: "Thomas Graf", address: address("Industrieweg 3", "9000", "St. Gallen"), phone: "071 555 63 63", mobile: "", email: "pruefung@securitas-brandschutz.example", website: "", category: "Brandschutz", status: "active", hourlyRate: 132 },
];
const assets = [
  ["asset_heat_alp", "ANL-TEST-000001", "Heizungsanlage Pflegeheim", "Heizung", "prop_alpenblick", "bld_alpenblick", "bld_alpenblick_ug_room_1_1", "Viessmann", "Vitocrossal 300", "maintenance", 4, 2032, 95000],
  ["asset_lift_alp", "ANL-TEST-000002", "Personenaufzug Nord", "Aufzug", "prop_alpenblick", "bld_alpenblick", "bld_alpenblick_eg_room_2_1", "Schindler", "3300", "active", 5, 2030, 120000],
  ["asset_pv_son", "ANL-TEST-000003", "PV-Anlage Schulhaus", "Photovoltaik", "prop_sonnenrain", "bld_sonnenrain", "bld_sonnenrain_og1_room_1_1", "Meyer Burger", "Glass 380", "active", 3, 2035, 180000],
  ["asset_vent_rath", "ANL-TEST-000004", "Lüftungsanlage Rathaus", "Lüftung", "prop_rathaus", "bld_rathaus", "bld_rathaus_ug_room_1_1", "Zehnder", "ComfoAir XL", "active", 4, 2031, 145000],
  ["asset_boiler_lim", "ANL-TEST-000005", "Warmwasserboiler Limmatgarten", "Sanitär", "prop_limmat", "bld_limmat", "bld_limmat_ug_room_1_1", "Hoval", "CombiVal", "defect", 2, 2028, 28000],
  ["asset_machine_hel", "ANL-TEST-000006", "CNC-Bearbeitungszentrum", "Produktion", "prop_helvetia", "bld_helvetia", "bld_helvetia_eg_room_2_1", "DMG Mori", "DMU 50", "active", 4, 2034, 350000],
];
const assetRelated = new Map(assets.map(([id]) => [id, []]));
const assetEntities = assets.map(([id, number, name, category, propertyId, buildingId, roomId, manufacturer, model, status, conditionRating, replacementYear, replacementCost]) => ({
  ...base(id, number),
  name,
  category,
  manufacturer,
  model,
  serialNumber: `SN-${number.slice(-6)}`,
  propertyId,
  buildingId,
  roomId,
  location: rooms.find((room) => room.id === roomId)?.name ?? "",
  status,
  manufacturedYear: "2019",
  installedAt: "2020-04-01",
  warrantyUntil: "2027-12-31",
  warrantyNote: "Herstellergarantie",
  maintenanceInterval: "annual",
  supplierId: category === "Brandschutz" ? "sup_fire" : "sup_hls",
  parentAssetId: "",
  relatedAssetIds: [],
  lifecycle: status === "defect" ? "maintained" : "inOperation",
  decommissionedAt: "",
  contractId: "",
  costCenter: `CC-${propertyId.slice(-3).toUpperCase()}`,
  criticality: conditionRating <= 2 ? "high" : "medium",
  locationHistory: [{ id: `${id}_loc1`, date: "2020-04-01", buildingId, roomId, location: "Erstinbetriebnahme", note: "Testdaten" }],
  conditionRating,
  conditionAssessedAt: "2026-08-15",
  conditionNote: conditionRating <= 2 ? "Erhöhter Investitionsbedarf" : "Regelmässig geprüft",
  replacementCost,
  plannedReplacementYear: String(replacementYear),
}));

const maintenance = [
  { ...base("mnt_heat_alp", "WA-TEST-001"), title: "Jahreswartung Heizungsanlage", description: "Brenner, Pumpen und Sicherheitskette prüfen.", status: "due", interval: "annual", propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", assetId: "asset_heat_alp", company: "HLS Service Zürich AG", supplierId: "sup_hls", responsible: "Hausdienst Alpenblick", assigneeUserId: "", assigneeTeam: "Technik", lastDate: "2025-09-15", nextDate: "2026-09-15", checklist: checklist("Brenner prüfen", "Sicherheitsventil prüfen", "Messprotokoll ablegen"), legalBasis: "VKF / SIA 384", dutyCategory: "Technische Sicherheit" },
  { ...base("mnt_vent_rath", "WA-TEST-002"), title: "Filterwechsel Lüftung Rathaus", description: "Filter und Luftmengen kontrollieren.", status: "planned", interval: "semiannual", propertyId: "prop_rathaus", buildingId: "bld_rathaus", assetId: "asset_vent_rath", company: "HLS Service Zürich AG", supplierId: "sup_hls", responsible: "Facility Management Stadt", assigneeUserId: "", assigneeTeam: "Haustechnik", lastDate: "2026-03-10", nextDate: "2026-09-20", checklist: checklist("Filter ersetzen", "Luftmenge messen") },
];

const legionella = [{
  ...base("leg_alp", "LEG-TEST-001"),
  title: "Legionellenkontrolle Pflegeheim – Warmwasser",
  propertyId: "prop_alpenblick",
  buildingId: "bld_alpenblick",
  system: "Warmwasser zentral",
  measuringPoint: "Zimmer 214 Dusche",
  date: "2026-08-20",
  hotTemp: 58,
  coldTemp: 14,
  cfu: 180,
  result: "warning",
  measures: "Thermische Desinfektion und Nachkontrolle planen.",
  responsible: "Martina Keller",
  interval: "annual",
  nextDate: "2027-08-20",
  samples: [{ id: "sample_alp_1", point: "Zimmer 214 Dusche", hotTemp: 58, coldTemp: 14, cfu: 180, note: "Grenzwert überschritten" }, { id: "sample_alp_2", point: "Küche", hotTemp: 61, coldTemp: 13, cfu: 40, note: "Unauffällig" }],
}];

const firechecks = [{
  ...base("fire_son", "BS-TEST-001"),
  title: "Feuerlöscher Schulhaus A – Erdgeschoss",
  type: "extinguisher",
  customType: "",
  organizationId: "org_facility",
  siteId: "site_sonnenrain",
  propertyId: "prop_sonnenrain",
  buildingId: "bld_sonnenrain",
  roomId: "bld_sonnenrain_eg_room_1_1",
  assetId: "",
  area: "Korridor beim Haupteingang",
  date: "2026-08-01",
  inspector: "Thomas Graf",
  supplierId: "sup_fire",
  assigneeUserId: "",
  assigneeTeam: "Schulhauswartung",
  condition: "good",
  firingSystem: "",
  fuel: "other",
  sweeper: "",
  firingScope: "periodic",
  coValue: 0,
  sootNumber: 0,
  exhaustTemperature: 0,
  efficiency: 0,
  measurements: "Plombe intakt, Manometer im grünen Bereich.",
  defects: "",
  measures: "",
  dueDate: "2027-08-01",
  interval: "annual",
  nextDate: "2027-08-01",
  status: "done",
  damageId: "",
  orderId: "",
}];

const inspections = [{
  ...base("insp_rath", "KO-TEST-001"),
  title: "Fluchtwegkontrolle Verwaltungshochhaus",
  type: "escapeRoute",
  customType: "",
  organizationId: "org_facility",
  siteId: "site_rathaus",
  propertyId: "prop_rathaus",
  buildingId: "bld_rathaus",
  roomId: "bld_rathaus_eg_room_2_1",
  assetId: "",
  date: "2026-08-28",
  tester: "Facility Management Stadt",
  supplierId: "",
  assigneeUserId: "",
  assigneeTeam: "Sicherheit",
  interval: "quarterly",
  nextDate: "2026-11-28",
  result: "passed",
  status: "done",
  measures: "Keine Massnahmen.",
  legalBasis: "VKF Brandschutzrichtlinie",
  dutyCategory: "Fluchtwege",
}];

const technicalTestBase = (id, number, fields) => ({ ...base(id, number, "TESTDATEN – technische Anlagen"), ...fields });
const testPhoto = (id, name) => ({
  id,
  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  name,
  caption: "Testfoto technische Anlage",
  takenAt: "2026-09-10T10:00:00.000Z",
  size: 68,
});
const technicalDefinitions = {
  heizung: [
    ["flow", "Vorlauf", "78", "°C", "80"],
    ["return", "Rücklauf", "56", "°C", "60"],
    ["pressure", "Druck", "1.8", "bar", "2.0"],
    ["pump", "Pumpe", "OK", "", ""],
    ["operation", "Betriebszustand", "OK", "", ""],
    ["alarm", "Fehlermeldung", "Keine", "", ""],
    ["leakage", "Leckage", "Keine", "", ""],
  ],
  wasser: [
    ["salt", "Salzvorrat", "68", "kg", "80"],
    ["hardness", "Wasserhärte", "9", "°fH", "10"],
    ["pressure", "Druck", "3.2", "bar", "3.5"],
    ["operation", "Betriebszustand", "OK", "", ""],
    ["regeneration", "Regeneration", "OK", "", ""],
    ["alarm", "Fehlermeldung", "Keine", "", ""],
  ],
  lueftung: [
    ["supply", "Zulufttemperatur", "19", "°C", "20"],
    ["extract", "Ablufttemperatur", "23", "°C", "22"],
    ["filter", "Filterzustand", "OK", "", ""],
    ["operation", "Betriebszustand", "OK", "", ""],
    ["airflow", "Luftstrom", "4200", "m³/h", "4000"],
    ["alarm", "Störung", "Keine", "", ""],
  ],
  elektro: [
    ["voltage", "Spannung", "230", "V", "230"],
    ["current", "Strom", "18", "A", "25"],
    ["protection", "Schutz / Sicherungen", "OK", "", ""],
    ["alarm", "Fehlermeldung", "Keine", "", ""],
  ],
  pv: [
    ["power", "Leistung", "142", "kW", "148"],
    ["yield", "Ertrag", "18200", "kWh", "18000"],
    ["inverter", "Wechselrichter", "OK", "", ""],
    ["alarm", "Fehlermeldung", "Keine", "", ""],
  ],
  weitere: [
    ["operation", "Betriebszustand", "OK", "", ""],
    ["pressure", "Druck", "7.2", "bar", "8"],
    ["temperature", "Temperatur", "21", "°C", "22"],
    ["alarm", "Fehlermeldung", "Keine", "", ""],
  ],
  brand: [
    ["operation", "Betriebszustand", "OK", "", ""],
    ["alarm", "Alarm / Fehlermeldung", "Keine", "", ""],
    ["power", "Spannungsversorgung", "OK", "", ""],
  ],
};
const technicalBuildingSpecs = [
  ["bld_tech_school", "GB-TECH-001", "Schulgebäude", "prop_sonnenrain", "1988", 3900],
  ["bld_tech_admin", "GB-TECH-002", "Verwaltungsgebäude", "prop_rathaus", "2004", 7800],
  ["bld_tech_workshop", "GB-TECH-003", "Werkstatt", "prop_helvetia", "2018", 4200],
  ["bld_tech_multi", "GB-TECH-004", "Mehrzweckgebäude", "prop_sonnenrain", "1996", 2200],
];
const technicalBuildings = technicalBuildingSpecs.map(([id, number, name, propertyId, yearBuilt, area]) => ({
  ...base(id, number, "TESTDATEN – technische Anlagen"),
  name,
  propertyId,
  address: properties.find((property) => property.id === propertyId).address,
  yearBuilt,
  area,
  status: "active",
  description: "TEST-Gebäude für vernetzte technische Anlagen.",
  floors: floorsFor(id, area),
  plans: [],
}));
const technicalRoomNames = ["Heizungsraum", "Technikraum", "Elektroverteilung", "Lüftungszentrale", "Sanitärraum", "Dach", "Keller", "Pumpenraum"];
const technicalRooms = technicalBuildings.flatMap((building, buildingIndex) =>
  technicalRoomNames.map((name, index) => ({
    ...base(`${building.id}_room_${index + 1}`, `RM-TECH-${String(buildingIndex * technicalRoomNames.length + index + 1).padStart(3, "0")}`),
    name,
    roomNumber: `T${index + 1}`,
    buildingId: building.id,
    floorId: `${building.id}_${index > 5 ? "og1" : "ug"}`,
    type: name,
    area: 18 + index * 3,
    sia416AreaType: "NNF",
    din277AreaType: "TF",
    workplaces: 0,
    workplaceList: [],
    occupant: "",
    status: "active",
    description: "TEST-Raum für technische Anlagen.",
  })),
);
const technicalAssetSpecs = [
  ["Gasheizung / Wärmeerzeuger", "Heizung", "bld_tech_school", 0, "Viessmann", "Vitocrossal 300", "heizung"],
  ["Umwälzpumpe", "Heizung", "bld_tech_school", 7, "Grundfos", "MAGNA3 32-120", "heizung"],
  ["Heizungsverteiler", "Heizung", "bld_tech_school", 0, "Oventrop", "Regumat M3", "heizung"],
  ["Ausdehnungsgefäss", "Heizung", "bld_tech_admin", 0, "Reflex", "N 200", "heizung"],
  ["Warmwasserspeicher", "Warmwasser", "bld_tech_admin", 4, "Hoval", "EnerVal 500", "wasser"],
  ["Wasserenthärtungsanlage", "Wasser", "bld_tech_school", 4, "BWT", "Perla Home", "wasser"],
  ["Warmwasseranlage", "Warmwasser", "bld_tech_multi", 4, "Hoval", "UltraSource", "wasser"],
  ["Zirkulationspumpe", "Wasser", "bld_tech_multi", 7, "Wilo", "Stratos PICO", "wasser"],
  ["Druckerhöhungsanlage", "Wasser", "bld_tech_workshop", 7, "KSB", "DeltaSolo", "wasser"],
  ["Trinkwasserverteiler", "Wasser", "bld_tech_admin", 4, "GF Piping", "JRG LegioStop", "wasser"],
  ["Hebeanlage", "Wasser", "bld_tech_workshop", 4, "Jung", "Compli 1000", "wasser"],
  ["Lüftungsanlage", "Lüftung", "bld_tech_admin", 3, "Zehnder", "ComfoAir XL", "lueftung"],
  ["Zuluftgerät", "Lüftung", "bld_tech_school", 3, "Systemair", "Geniox 10", "lueftung"],
  ["Abluftgerät", "Lüftung", "bld_tech_multi", 3, "FläktGroup", "eQ Prime", "lueftung"],
  ["Wärmerückgewinnung", "Lüftung", "bld_tech_admin", 3, "FläktGroup", "Rotovex", "lueftung"],
  ["Klimagerät", "Klima", "bld_tech_workshop", 1, "Mitsubishi Electric", "City Multi", "weitere"],
  ["Hauptverteilung", "Elektro", "bld_tech_admin", 2, "Hager", "univers Z", "elektro"],
  ["Unterverteilung", "Elektro", "bld_tech_school", 2, "ABB", "U-Serie", "elektro"],
  ["Notstromanlage", "Elektro", "bld_tech_multi", 1, "Rittal", "UPS-Generator 80", "elektro"],
  ["USV-Anlage", "Elektro", "bld_tech_admin", 2, "APC", "Galaxy VS", "elektro"],
  ["Elektro-Ladestation", "Elektro", "bld_tech_workshop", 2, "ABB", "Terra AC", "elektro"],
  ["PV-Anlage", "Photovoltaik", "bld_tech_school", 5, "Meyer Burger", "Glass 380", "pv"],
  ["Kompressor", "Druckluft", "bld_tech_workshop", 1, "Atlas Copco", "GA 22", "weitere"],
  ["Druckluftanlage", "Druckluft", "bld_tech_workshop", 7, "Kaeser", "SX 8", "weitere"],
  ["Kälteanlage", "Kälte", "bld_tech_workshop", 1, "Carrier", "30XA", "weitere"],
  ["Wärmepumpe", "Wärmepumpe", "bld_tech_multi", 0, "Ochsner", "Air Hawk 518", "heizung"],
  ["Lift", "Lift", "bld_tech_admin", 1, "Schindler", "3300", "weitere"],
  ["Automatische Tür", "Türanlage", "bld_tech_school", 1, "dormakaba", "ED 100", "weitere"],
  ["Toranlage", "Tor", "bld_tech_workshop", 1, "Hörmann", " industrialLine", "weitere"],
  ["Brandmeldeanlage", "Brandschutz", "bld_tech_admin", 1, "Siemens", "Cerberus PRO", "brand"],
  ["Sprinkleranlage", "Brandschutz", "bld_tech_multi", 1, "Minimax", "MX 200", "brand"],
  ["Rauchabzug", "Brandschutz", "bld_tech_school", 1, "D+H", "KA  Zoom", "brand"],
  ["Feuerlöscher", "Brandschutz", "bld_tech_school", 1, "Gloria", "PD 6 GA", "brand"],
];
const technicalAssets = technicalAssetSpecs.map(([name, category, buildingId, roomIndex, manufacturer, model, checklistKey], index) => {
  const room = technicalRooms.find((entry) => entry.buildingId === buildingId && entry.name === technicalRoomNames[roomIndex]);
  const id = `asset_tech_${String(index + 1).padStart(3, "0")}`;
  return technicalAsset({
    id,
    number: `ANL-TECH-${String(index + 1).padStart(3, "0")}`,
    name,
    category,
    buildingId,
    roomId: room.id,
    propertyId: technicalBuildings.find((entry) => entry.id === buildingId).propertyId,
    manufacturer,
    model,
    checklistKey,
    index,
  });
});
function technicalAsset({ id, number, name, category, buildingId, roomId, propertyId, manufacturer, model, checklistKey, index }) {
  const points = technicalDefinitions[checklistKey] ?? technicalDefinitions.weitere;
  return technicalTestBase(id, number, {
    name,
    category,
    manufacturer,
    model,
    serialNumber: `SN-TECH-${String(index + 1).padStart(4, "0")}`,
    propertyId,
    buildingId,
    roomId,
    location: technicalRooms.find((room) => room.id === roomId).name,
    status: index % 9 === 0 ? "maintenance" : "active",
    manufacturedYear: String(2017 + (index % 7)),
    installedAt: `${2019 + (index % 5)}-06-15`,
    warrantyUntil: "2028-06-15",
    warrantyNote: "TEST-Garantie",
    maintenanceInterval: index % 3 === 0 ? "quarterly" : "annual",
    controlInterval: "monthly",
    nextMaintenance: "2026-10-15",
    nextInspection: "2026-10-01",
    responsible: "Martina Keller",
    technicalData: `TEST-Datenblatt: ${model}; Nennleistung ${12 + index} kW; Betriebsart automatisch.`,
    supplierId: "sup_hls",
    lifecycle: "inOperation",
    criticality: index % 4 === 0 ? "high" : "medium",
    conditionRating: index % 5 === 0 ? 3 : 4,
    conditionAssessedAt: "2026-09-01",
    conditionNote: "TEST-Anlage, regelmässig kontrolliert.",
    photos: [testPhoto(`${id}_photo`, `${name}.png`)],
  });
}
const technicalFollowUps = technicalAssets.map((asset, index) => {
  const maintenanceId = `mnt_tech_${String(index + 1).padStart(3, "0")}`;
  const orderId = `ord_tech_${String(index + 1).padStart(3, "0")}`;
  const damageId = `damage_tech_${String(index + 1).padStart(3, "0")}`;
  const reportId = `rep_tech_${String(index + 1).padStart(3, "0")}`;
  const inspectionId = `insp_tech_${String(index + 1).padStart(3, "0")}`;
  const documentId = `doc_tech_${String(index + 1).padStart(3, "0")}`;
  const invoiceId = `invoice_tech_${String(index + 1).padStart(3, "0")}`;
  const points = technicalDefinitions[technicalAssetSpecs[index][6]] ?? technicalDefinitions.weitere;
  const checkpoints = points.map(([key, label, value, unit, target]) => ({ key, label, value, unit, target, status: value === "Keine" ? "ok" : "ok" }));
  const roomId = asset.roomId;
  const commonFields = { propertyId: asset.propertyId, buildingId: asset.buildingId, roomId, assetId: asset.id };
  const property = properties.find((entry) => entry.id === asset.propertyId);
  const customerId = property.customerId;
  const siteId = property.siteId;
  return {
    maintenance: technicalTestBase(maintenanceId, `WA-TECH-${String(index + 1).padStart(3, "0")}`, { title: `Wartung ${asset.name}`, description: `TEST-Wartung für ${asset.name}.`, status: index % 5 === 0 ? "due" : "planned", interval: asset.maintenanceInterval === "quarterly" ? "quarterly" : "annual", ...commonFields, company: "HLS Service Zürich AG", supplierId: "sup_hls", responsible: "Martina Keller", assigneeUserId: "user_martina", assigneeTeam: "Technik", lastDate: "2026-07-15", nextDate: asset.nextMaintenance, checklist: checkpoints.map((point) => ({ id: point.key, text: point.label, done: true })) }),
    inspection: technicalTestBase(inspectionId, `KO-TECH-${String(index + 1).padStart(3, "0")}`, { title: `Technische Checkliste ${asset.name}`, type: "custom", customType: "Technische Anlagen-Checkliste", organizationId: "org_facility", siteId, ...commonFields, date: "2026-09-10", tester: "Martina Keller", supplierId: "sup_hls", assigneeUserId: "user_martina", assigneeTeam: "Technik", interval: "monthly", nextDate: asset.nextInspection, result: "passed", status: "done", measures: "TEST-Kontrolle ohne kritische Abweichung.", technicalCategory: technicalAssetSpecs[index][6], technicalCheckpoints: checkpoints, technicalMeasurements: Object.fromEntries(checkpoints.filter((point) => point.unit).map((point) => [point.key, point.value])), previousMeasurements: Object.fromEntries(checkpoints.filter((point) => point.unit).map((point) => [point.key, String(Number(point.value) - 1)])), photos: asset.photos }),
    order: technicalTestBase(orderId, `AU-TECH-${String(index + 1).padStart(3, "0")}`, { title: `Auftrag ${asset.name}`, description: `TEST-Auftrag aus technischer Kontrolle für ${asset.name}.`, status: index % 4 === 0 ? "inProgress" : "planned", priority: index % 4 === 0 ? "high" : "medium", customerId, ...commonFields, quoteId: "", supplierId: "sup_hls", assignee: "Martina Keller", assigneeUserId: "user_martina", assigneeTeam: "Technik", dueDate: "2026-10-20", startedAt: "2026-09-10T08:00:00.000Z", completedAt: "", workDate: "2026-09-10", workStart: "08:00", workEnd: "10:30", breakMinutes: 15, checklist: checkpoints.map((point) => ({ id: point.key, text: point.label, done: true })), materials: [{ id: `${orderId}_mat`, name: "Prüf- und Ersatzmaterial", quantity: 1, unit: "Pauschal", price: 180 + index * 10, stockItemId: "stock_sensor", billable: true }], externalServices: [], signature: "", signedBy: "", sourceCollection: "maintenances", sourceId: maintenanceId, hourlyRate: 145, photos: asset.photos }),
    damage: technicalTestBase(damageId, `SC-TECH-${String(index + 1).padStart(3, "0")}`, { title: `Abweichung ${asset.name}`, description: `TEST-Schaden/Abweichung aus der technischen Kontrolle von ${asset.name}.`, status: index % 4 === 0 ? "inProgress" : "fixed", priority: index % 4 === 0 ? "high" : "medium", customerId, ...commonFields, reportedBy: "Technische Kontrolle", reportedById: "user_martina", assigneeUserId: "user_martina", assigneeTeam: "Technik", reportedAt: "2026-09-10T10:30:00.000Z", fixedAt: index % 4 === 0 ? "" : "2026-09-12", insuranceCase: false, estimatedCost: 450 + index * 35, photos: asset.photos }),
    report: technicalTestBase(reportId, `RP-TECH-${String(index + 1).padStart(3, "0")}`, { title: `Rapport ${asset.name}`, type: "inspection", status: "final", date: "2026-09-10", author: "Martina Keller", customerId, ...commonFields, orderId, summary: "TEST-Rapport der technischen Kontrolle.", workDescription: `Kontrolle, Messung und Dokumentation von ${asset.name}.`, workStart: "08:00", workEnd: "10:30", breakMinutes: 15, materials: [{ id: `${reportId}_mat`, name: "Prüf- und Ersatzmaterial", quantity: 1, unit: "Pauschal", price: 180 + index * 10 }], externalServices: [], sharedWithCustomer: false, signature: "", signedBy: "Martina Keller", signedAt: "2026-09-10T11:00:00.000Z", billable: true, hourlyRate: 145 }),
    document: technicalTestBase(documentId, `DK-TECH-${String(index + 1).padStart(3, "0")}`, { title: `Technisches Datenblatt ${asset.name}`, category: "Technische Dokumentation", file: file(`${documentId}_file`, `${asset.name.toLowerCase().replaceAll(" ", "-")}.pdf`, "Technische Dokumentation", "documents", documentId), versions: [], organizationId: "org_facility", siteId, customerId, ...commonFields, orderId, maintenanceId, validUntil: "2028-12-31", sharedWithCustomer: false, safetyEvidence: false }),
    invoice: technicalTestBase(invoiceId, `RE-TECH-${String(index + 1).padStart(3, "0")}`, { title: `Kosten ${asset.name}`, status: "draft", customerId, propertyId: asset.propertyId, orderId, quoteId: "", reportId, date: "2026-09-10", dueDate: "2026-10-10", paidAt: "", items: [{ id: `${invoiceId}_item`, position: 1, description: `Arbeitszeit und Material ${asset.name}`, quantity: 1, unit: "Pauschal", unitPrice: 650 + index * 25, vatRate: 8.1 }], currency: "CHF", qrReference: "", payment: { recipient: "Facility365 Testorganisation", address: address("Teststrasse 1", "8000", "Zürich"), iban: "CH5604835012345678009", qrIban: "", bank: "Testbank Schweiz", bic: "ZKBKCHZZ80A", referenceType: "SCOR" } }),
    activity: technicalTestBase(`activity_tech_${String(index + 1).padStart(3, "0")}`, `AK-TECH-${String(index + 1).padStart(3, "0")}`, { at: "2026-09-10T11:00:00.000Z", userName: "Martina Keller", userId: "user_martina", module: "assets", entityId: asset.id, entityNumber: asset.number, entityTitle: asset.name, action: "history.updated" }),
  };
});
const technicalTestData = {
  buildings: technicalBuildings,
  rooms: technicalRooms,
  assets: technicalAssets,
  visitors: [
    {
      ...base("visitor_test_001", "BS-TEST-001", "TESTDATEN – Besucher- und Zutrittsprotokoll"),
      visitorName: "Daniel Frei",
      company: "HLS Service Zürich AG",
      phone: "044 555 61 61",
      email: "service@hls.example",
      purpose: "Jahreswartung Heizungsanlage",
      propertyId: "prop_alpenblick",
      buildingId: "bld_alpenblick",
      hostUserId: "user_martina",
      vehiclePlate: "ZH 365 456",
      badge: "B-001",
      status: "completed",
      checkIn: "2026-09-15T07:55:00.000Z",
      checkOut: "2026-09-15T12:10:00.000Z",
    },
    {
      ...base("visitor_test_002", "BS-TEST-002", "TESTDATEN – Besucher- und Zutrittsprotokoll"),
      visitorName: "Sophie Keller",
      company: "Schulverband Sonnenrain",
      phone: "031 555 10 10",
      email: "sophie.keller@sonnenrain.example",
      purpose: "Besprechung Gebäudebetrieb",
      propertyId: "prop_sonnenrain",
      buildingId: "bld_sonnenrain",
      hostUserId: "user_martina",
      vehiclePlate: "",
      badge: "B-002",
      status: "expected",
      checkIn: "",
      checkOut: "",
    },
  ],
  parking: [
    {
      ...base("parking_test_001", "PP-TEST-001", "TESTDATEN – Parkplatzverwaltung"),
      title: "Besucherparkplatz Nord",
      code: "P-N-01",
      propertyId: "prop_alpenblick",
      buildingId: "bld_alpenblick",
      location: "Einfahrt Nord, Platz 1",
      type: "Besucher",
      status: "available",
      assignedTo: "",
      plate: "",
      validFrom: "",
      validUntil: "",
    },
    {
      ...base("parking_test_002", "PP-TEST-002", "TESTDATEN – Parkplatzverwaltung"),
      title: "Hausdienst Parkplatz",
      code: "P-H-01",
      propertyId: "prop_sonnenrain",
      buildingId: "bld_sonnenrain",
      location: "Hofseite beim Werkraum",
      type: "Hausdienst",
      status: "occupied",
      assignedTo: "Martina Keller",
      plate: "BE 365 777",
      validFrom: "2026-01-01",
      validUntil: "2026-12-31",
    },
    {
      ...base("parking_test_003", "PP-TEST-003", "TESTDATEN – Parkplatzverwaltung"),
      title: "Lieferantenparkplatz",
      code: "P-L-01",
      propertyId: "prop_helvetia",
      buildingId: "bld_helvetia",
      location: "Rampe Süd",
      type: "Lieferant",
      status: "reserved",
      assignedTo: "HLS Service Zürich AG",
      plate: "",
      validFrom: "2026-09-01",
      validUntil: "2026-09-30",
    },
  ],
  waste: [
    {
      ...base("waste_test_001", "AB-TEST-001", "TESTDATEN – Abfallverwaltung"),
      title: "Kehricht Pflegeheim",
      wasteType: "Kehricht",
      propertyId: "prop_alpenblick",
      buildingId: "bld_alpenblick",
      location: "Abfallraum Untergeschoss",
      container: "2 × 800 l Container",
      supplierId: "sup_clean",
      interval: "weekly",
      nextPickup: "2026-09-21",
      status: "active",
      responsibleId: "user_martina",
    },
    {
      ...base("waste_test_002", "AB-TEST-002", "TESTDATEN – Abfallverwaltung"),
      title: "Papier und Karton Schule",
      wasteType: "Papier/Karton",
      propertyId: "prop_sonnenrain",
      buildingId: "bld_sonnenrain",
      location: "Anlieferung Turnhalle",
      container: "1 × 660 l Container",
      supplierId: "sup_clean",
      interval: "biweekly",
      nextPickup: "2026-09-25",
      status: "active",
      responsibleId: "user_martina",
    },
    {
      ...base("waste_test_003", "AB-TEST-003", "TESTDATEN – Abfallverwaltung"),
      title: "Sonderabfall Werkstatt",
      wasteType: "Sonderabfall",
      propertyId: "prop_helvetia",
      buildingId: "bld_helvetia",
      location: "Gesicherter Sammelbereich",
      container: "Sicherheitsbehälter 60 l",
      supplierId: "sup_hls",
      interval: "monthly",
      nextPickup: "2026-10-01",
      status: "paused",
      responsibleId: "user_martina",
    },
  ],
  maintenances: technicalFollowUps.map((entry) => entry.maintenance),
  inspections: technicalFollowUps.map((entry) => entry.inspection),
  orders: technicalFollowUps.map((entry) => entry.order),
  damages: technicalFollowUps.map((entry) => entry.damage),
  reports: technicalFollowUps.map((entry) => entry.report),
  documents: technicalFollowUps.map((entry) => entry.document),
  invoices: technicalFollowUps.map((entry) => entry.invoice),
  activities: technicalFollowUps.map((entry) => entry.activity),
};

const orders = [
  { ...base("ord_alp", "AU-TEST-001"), title: "Störung Warmwasser Zimmertrakt", description: "Warmwasser in Zimmern 210–218 nur lauwarm.", status: "inProgress", priority: "high", customerId: "cus_alpenblick", propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", roomId: "bld_alpenblick_og1_room_2_1", assetId: "asset_heat_alp", quoteId: "", supplierId: "sup_hls", assignee: "Daniel Frei", assigneeUserId: "", assigneeTeam: "Technik", dueDate: "2026-09-16", startedAt: "2026-09-12T08:00:00.000Z", completedAt: "", workDate: "2026-09-12", workStart: "08:00", workEnd: "11:30", breakMinutes: 15, checklist: checklist("Temperatur messen", "Zirkulationspumpe prüfen"), materials: [{ id: "mat_ord_alp", name: "Temperaturfühler PT1000", quantity: 1, unit: "Stk.", price: 85, stockItemId: "stock_sensor", billable: true }], externalServices: [], signature: "", signedBy: "", sourceCollection: "maintenances", sourceId: "mnt_heat_alp", hourlyRate: 145 },
  { ...base("ord_son", "AU-TEST-002"), title: "Defekte Beleuchtung Klassenzimmer 2.14", description: "Drei Leuchten flackern.", status: "planned", priority: "medium", customerId: "cus_schulverband", propertyId: "prop_sonnenrain", buildingId: "bld_sonnenrain", roomId: "bld_sonnenrain_og1_room_2_1", assetId: "", quoteId: "", supplierId: "", assignee: "Hausdienst Sonnenrain", assigneeUserId: "", assigneeTeam: "Hausdienst", dueDate: "2026-09-22", startedAt: "", completedAt: "", workDate: "", workStart: "", workEnd: "", breakMinutes: 0, checklist: checklist("Leuchtmittel prüfen"), materials: [], externalServices: [], signature: "", signedBy: "", sourceCollection: "tickets", sourceId: "ticket_son", hourlyRate: 90 },
];

const reports = [{
  ...base("rep_alp", "RP-TEST-001"),
  title: "Rapport Warmwasserstörung – 12.09.2026",
  type: "order",
  status: "final",
  date: "2026-09-12",
  author: "Daniel Frei",
  customerId: "cus_alpenblick",
  propertyId: "prop_alpenblick",
  buildingId: "bld_alpenblick",
  roomId: "bld_alpenblick_og1_room_2_1",
  assetId: "asset_heat_alp",
  orderId: "ord_alp",
  summary: "Zirkulationspumpe mit ungenügender Leistung festgestellt.",
  workDescription: "Messung, Diagnose, provisorische Einstellung und Materialwechsel.",
  workStart: "08:00",
  workEnd: "11:30",
  breakMinutes: 15,
  materials: [{ id: "mat_rep_alp", name: "Temperaturfühler PT1000", quantity: 1, unit: "Stk.", price: 85, stockItemId: "stock_sensor", billable: true }],
  externalServices: [],
  sharedWithCustomer: true,
  signature: "",
  signedBy: "Martina Keller",
  signedAt: "2026-09-12T12:00:00.000Z",
  billable: true,
  hourlyRate: 145,
}];

const common = (id, number, fields) => ({ ...base(id, number), ...fields });
const data = {
  customers,
  suppliers,
  sources: [common("source_hls", "BQ-TEST-001", { name: "Sanitär-Ersatzteile Direkt", category: "Technik", website: "", contactPerson: "Daniel Frei", phone: "044 555 61 61", mobile: "", email: "bestellung@hls.example", address: address("Werkstrasse 7", "8050", "Zürich"), rating: "5", supplierId: "sup_hls", status: "active" })],
  organizations,
  sites,
  properties,
  buildings,
  rooms,
  assets: assetEntities,
  documents: [
    common("doc_fire", "DK-TEST-001", { title: "Brandschutzkonzept Schulhaus Sonnenrain", category: "Sicherheitsnachweis", file: file("file_fire", "brandschutzkonzept-sonnenrain.pdf", "Sicherheitsnachweis", "documents", "doc_fire"), versions: [], organizationId: "org_facility", siteId: "site_sonnenrain", customerId: "cus_schulverband", propertyId: "prop_sonnenrain", buildingId: "bld_sonnenrain", roomId: "", assetId: "", orderId: "", maintenanceId: "", validUntil: "2027-08-01", sharedWithCustomer: true, safetyEvidence: true }),
    common("doc_contract", "DK-TEST-002", { title: "Wartungsvertrag Heizung Alpenblick", category: "Vertrag", file: file("file_contract", "wartungsvertrag-heizung.pdf", "Vertrag", "documents", "doc_contract"), versions: [], organizationId: "org_facility", siteId: "site_alpenblick", customerId: "cus_alpenblick", propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", roomId: "", assetId: "asset_heat_alp", orderId: "", maintenanceId: "mnt_heat_alp", validUntil: "2027-12-31", sharedWithCustomer: false, safetyEvidence: false }),
  ],
  energy: [
    common("energy_son", "EN-TEST-001", { type: "electricity", typeOther: "", propertyId: "prop_sonnenrain", buildingId: "bld_sonnenrain", month: "2026-08", consumption: 18400, unit: "kWh", cost: 3864 }),
    common("energy_hel", "EN-TEST-002", { type: "gas", typeOther: "", propertyId: "prop_helvetia", buildingId: "bld_helvetia", month: "2026-08", consumption: 32200, unit: "kWh", cost: 4510 }),
  ],
  solarplants: [common("pv_son", "PV-TEST-001", { name: "PV-Anlage Schulhaus Sonnenrain", status: "active", propertyId: "prop_sonnenrain", buildingId: "bld_sonnenrain", assetId: "asset_pv_son", power: 148, commissionedAt: "2022-06-15", moduleCount: 360, moduleType: "Monokristallin 410 Wp", orientation: "Süd", inverter: "SMA Sunny Tripower", inverterCount: 2, batteryCapacity: 80, batteryType: "Lithium", supplierId: "sup_hls", feedInTariff: 0.12, electricityPrice: 0.24, co2Factor: 0.08, investment: 280000, nextMaintenance: "2027-06-15" })],
  solaryields: [common("yield_son", "PVM-TEST-001", { plantId: "pv_son", month: "2026-08", production: 18200, selfUse: 11200, feedIn: 7000, batteryUse: 1800, revenue: 840, savings: 2688, cost: 95 })],
  appointments: [common("appt_heat", "TR-TEST-001", { title: "Wartung Heizungsanlage Alpenblick", type: "maintenance", status: "planned", date: "2026-09-15", timeStart: "08:00", timeEnd: "12:00", location: "Technikzentrale Pflegeheim", assignee: "HLS Service Zürich AG", assigneeUserId: "", customerId: "cus_alpenblick", propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", roomId: "bld_alpenblick_ug_room_1_1", assetId: "asset_heat_alp", description: "Jahreswartung gemäss Vertrag." })],
  orders,
  maintenances: maintenance,
  legionella,
  rcd: [common("rcd_hel", "FI-TEST-001", { title: "FI-Kontrolle Produktionshalle", propertyId: "prop_helvetia", buildingId: "bld_helvetia", assetId: "asset_machine_hel", distribution: "UV Produktion Ost", device: "FI 1 – 300 mA", date: "2026-08-10", tester: "Elektro Muster AG", ratedCurrent: 30, tripCurrent: 27, tripTime: 24, result: "passed", status: "done", interval: "annual", nextDate: "2027-08-10" })],
  inspections,
  playgroundchecks: [],
  firechecks,
  keys: [common("key_son", "SL-TEST-001", { title: "Generalschlüssel Schulhaus", keyNumber: "SON-GS-01", propertyId: "prop_sonnenrain", buildingId: "bld_sonnenrain", roomId: "", location: "Schlüsselschrank Hausdienst", status: "issued", issuedTo: "Hausdienst Sonnenrain", issuedAt: "2026-08-01", returnedAt: "", movements: [{ id: "move_key_1", type: "issue", date: "2026-08-01", person: "Hausdienst Sonnenrain", note: "Dauerhafte Ausgabe" }] })],
  inventory: [common("inv_alp", "IV-TEST-001", { title: "Pflegebett elektrisch", inventoryNumber: "ALP-INV-1042", category: "Pflegeausstattung", organizationId: "org_facility", siteId: "site_alpenblick", propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", roomId: "bld_alpenblick_og1_room_2_1", location: "Zimmer 214", manufacturer: "Stiegelmeyer", model: "Elvido", serial: "ST-214-8891", condition: "good", purchaseDate: "2023-03-15", price: 4200, supplierId: "sup_hls", sourceId: "source_hls", warrantyUntil: "2028-03-15" })],
  vehicles: [common("veh_facility", "FZ-TEST-001", { title: "Servicefahrzeug Facility Nord", plate: "ZH 365 123", brand: "Volkswagen", model: "Caddy Cargo", year: "2023", vin: "WV2TEST365000123", status: "active", mileage: 48200, driver: "Daniel Frei", assigneeUserId: "", siteId: "site_alpenblick", propertyId: "prop_alpenblick", nextService: "2026-11-15", tireChange: "2026-10-20", nextInspection: "2027-03-01", insurer: "Helvetia Versicherungen", policyNumber: "POL-TEST-365", insuranceUntil: "2027-03-31" })],
  tools: [common("tool_meter", "WZ-TEST-001", { title: "Multimeter Installationstester", toolNumber: "WZ-MULTI-07", category: "Messgerät", manufacturer: "Fluke", serial: "FL-365-7788", condition: "good", propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", location: "Werkstatt Hausdienst", nextCheck: "2027-02-01", status: "available", issuedTo: "", issuedAt: "", returnedAt: "", movements: [] })],
  stock: [common("stock_sensor", "LA-TEST-001", { title: "Temperaturfühler PT1000", articleNumber: "SEN-PT1000", quantity: 12, minQuantity: 5, unit: "Stk.", location: "Lager Technik – Regal A3", supplierId: "sup_hls", price: 85 })],
  contracts: [common("contract_heat", "VT-TEST-001", { title: "Wartungsvertrag Heizung Alpenblick", partner: "HLS Service Zürich AG", supplierId: "sup_hls", customerId: "cus_alpenblick", type: "Wartung Heizung", contractNumber: "HV-ALP-2026-01", start: "2026-01-01", end: "2027-12-31", noticeMonths: "3", cost: 14800, propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", status: "active" })],
  damages: [common("damage_boiler", "SC-TEST-001", { title: "Warmwasserboiler verliert Leistung", description: "Temperatur fällt unter Sollwert; technische Abklärung erforderlich.", status: "inProgress", priority: "high", customerId: "cus_wohnraum", propertyId: "prop_limmat", buildingId: "bld_limmat", roomId: "bld_limmat_ug_room_1_1", assetId: "asset_boiler_lim", reportedBy: "Mieterportal", reportedById: "", assigneeUserId: "", assigneeTeam: "Haustechnik", reportedAt: "2026-09-10T09:15:00.000Z", fixedAt: "", insuranceCase: false, estimatedCost: 8500 })],
  tickets: [common("ticket_son", "TI-TEST-001", { title: "Flackernde Beleuchtung Klassenzimmer", description: "Drei LED-Leuchten flackern im Betrieb.", category: "fault", status: "inProgress", priority: "medium", customerId: "cus_schulverband", organizationId: "org_facility", siteId: "site_sonnenrain", propertyId: "prop_sonnenrain", buildingId: "bld_sonnenrain", roomId: "bld_sonnenrain_og1_room_2_1", assetId: "", reportedBy: "Lehrperson", reportedById: "", assigneeUserId: "", reportedAt: "2026-09-11T07:45:00.000Z", dueDate: "2026-09-22", closedAt: "", orderId: "ord_son", damageId: "", maintenanceId: "", reportId: "", comments: [{ id: "comment_son_1", at: "2026-09-11T08:00:00.000Z", author: "Hausdienst Sonnenrain", text: "Auftrag für die nächste Tour eingeplant." }] })],
  reports,
  quotes: [common("quote_lift", "OF-TEST-001", { title: "Ersatzsteuerung Personenaufzug", status: "accepted", customerId: "cus_alpenblick", propertyId: "prop_alpenblick", date: "2026-08-25", validUntil: "2026-10-25", introText: "Offerte für die Erneuerung der Steuerung.", items: [{ id: "quote_item_1", position: 1, description: "Steuerung und Montage", quantity: 1, unit: "Pauschal", unitPrice: 18500, vatRate: 8.1 }], currency: "CHF" })],
  invoices: [common("invoice_alp", "RE-TEST-001", { title: "Rechnung Warmwasserstörung September 2026", status: "draft", customerId: "cus_alpenblick", propertyId: "prop_alpenblick", orderId: "ord_alp", quoteId: "", reportId: "rep_alp", date: "2026-09-12", dueDate: "2026-10-12", paidAt: "", items: [{ id: "inv_item_1", position: 1, description: "Arbeitszeit Daniel Frei", quantity: 3.25, unit: "h", unitPrice: 145, vatRate: 8.1 }, { id: "inv_item_2", position: 2, description: "Temperaturfühler PT1000", quantity: 1, unit: "Stk.", unitPrice: 85, vatRate: 8.1 }], currency: "CHF", qrReference: "210000000003139471430009017", payment: { recipient: "Facility365 Testorganisation", address: address("Teststrasse 1", "8000", "Zürich"), iban: "CH5604835012345678009", qrIban: "", bank: "Testbank Schweiz", bic: "ZKBKCHZZ80A", referenceType: "SCOR" } })],
  cleaningareas: [common("area_alp", "RB-TEST-001", { name: "Zimmertrakt Alpenblick", type: "Pflegezimmer", propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", roomId: "", location: "1. Obergeschoss", area: 820, floorCovering: "PVC und Linoleum", minutesPer100m2: 32, responsibleId: "cleaner_elena", status: "active", description: "Tägliche Reinigung der Bewohnerzimmer und Korridore.", checklist: checklist("Böden reinigen", "Kontaktflächen desinfizieren", "Abfall leeren") })],
  cleaners: [common("cleaner_elena", "RK-TEST-001", { name: "Rossi", firstName: "Elena", role: "lead", phone: "031 555 62 62", mobile: "079 555 62 62", email: "elena.rossi@sauberplus.example", supplierId: "sup_clean", status: "active", hourlyRate: 58 })],
  cleaningplans: [common("cleanplan_alp", "RPL-TEST-001", { title: "Zimmertrakt täglich", areaId: "area_alp", cleanerId: "cleaner_elena", responsibleId: "cleaner_elena", interval: "daily", intervalDays: 1, timeStart: "06:30", startDate: "2026-01-01", nextDate: "2026-09-14", status: "active", checklist: checklist("Böden reinigen", "Sanitär kontrollieren"), tour: "Tour A – Pflegeheim", tourOrder: 1, durationMinutes: 262 })],
  cleaningtasks: [common("cleantask_alp", "RA-TEST-001", { title: "Zimmertrakt Reinigung 14.09.2026", planId: "cleanplan_alp", areaId: "area_alp", propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", roomId: "", date: "2026-09-14", timeStart: "06:30", timeEnd: "10:52", cleanerId: "cleaner_elena", responsibleId: "cleaner_elena", status: "open", checklist: checklist("Böden reinigen", "Kontaktflächen desinfizieren"), materials: [], workDescription: "", billable: true, hourlyRate: 58 })],
  cleaningchecks: [common("cleancheck_alp", "RKO-TEST-001", { title: "Qualitätskontrolle Zimmertrakt", areaId: "area_alp", propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", roomId: "", date: "2026-09-12", inspector: "Martina Keller", result: "passed", status: "done", note: "Gute Ausführung, einzelne Nacharbeiten im Sanitärbereich." })],
  cleaningcomplaints: [common("cleancomplaint_alp", "RKL-TEST-001", { title: "Nachreinigung Zimmer 214", description: "Sanitärbereich nach Bewohnerwechsel nachreinigen.", propertyId: "prop_alpenblick", buildingId: "bld_alpenblick", roomId: "bld_alpenblick_og1_room_2_1", reportedAt: "2026-09-10", reportedBy: "Pflegeleitung", status: "open", priority: "medium", assignedTo: "cleaner_elena", resolvedAt: "" })],
  users: [common("user_martina", "BE-TEST-001", { name: "Martina Keller", email: "martina.keller@facility365-test.example", role: "orgadmin", status: "active", phone: "079 555 00 11", hourlyRate: 120 })],
  activities: [],
};

for (const [collection, records] of Object.entries(technicalTestData)) {
  data[collection] = [...(data[collection] ?? []), ...records];
}

const snapshot = { createdAt: now, collections: data };
writeFileSync("testdata/Facility365-realistische-testdaten.json", `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Erstellt: ${Object.values(data).reduce((sum, items) => sum + items.length, 0)} Datensätze`);
