/**
 * Catálogo de marcas y modelos de vehículos disponibles en Argentina.
 *
 * Uso: dropdowns cascading en el registro de repartidor y panel admin.
 *
 * Cobertura objetivo: >95% del parque automotor argentino. Las marcas y
 * modelos están organizados por tipo de vehículo para que el dropdown solo
 * muestre opciones relevantes (ej: si el driver seleccionó MOTO, solo ve
 * marcas de moto).
 *
 * Organizado alfabéticamente dentro de cada tipo. Los modelos también
 * alfabéticamente salvo series numéricas (206, 208, 308...) que van
 * ascendentes.
 *
 * Para marcas/modelos que no están en la lista, el form permite tipear
 * "Otra marca" / "Otro modelo" como escape hatch (ver SearchableSelect
 * con prop allowCustom).
 *
 * Fuente: ACARA (Asociación de Concesionarios de Automotores de la
 * República Argentina) + verificación en sitios de marcas, abril 2026.
 *
 * Mantenimiento: revisar anualmente. Agregar nuevos modelos cuando salgan
 * al mercado argentino (ej: nuevos eléctricos, lanzamientos Chery, JAC,
 * etc.). Quitar modelos discontinuados solo si tienen <10 años de
 * antigüedad en Ushuaia (drivers aún pueden tenerlos).
 */

export type VehicleCategory =
    | "MOTO"
    | "AUTO"
    | "CAMIONETA"
    | "PICKUP"
    | "SUV"
    | "FLETE";

/**
 * Mapa marca → lista de modelos, por categoría.
 * Dentro de cada categoría, marcas ordenadas alfabéticamente.
 * Modelos: alfabéticos o por serie numérica ascendente.
 */
export const ARGENTINE_VEHICLE_CATALOG: Record<VehicleCategory, Record<string, string[]>> = {
    MOTO: {
        "Bajaj": ["Boxer 150", "Dominar 250", "Dominar 400", "NS 125", "NS 160", "NS 200", "Pulsar 135", "Pulsar 150", "Pulsar 180", "Pulsar 200 NS", "Pulsar 200 RS", "Pulsar 220", "Rouser 200 NS", "Rouser 220", "V15", "V16"],
        "Benelli": ["302S", "502C", "Imperiale 400", "Leoncino 500", "Leoncino 800", "TNT 15", "TNT 25", "TNT 300", "TNT 600", "TRK 251", "TRK 502", "TRK 502 X", "TRK 702", "TRK 702 X"],
        "BMW": ["C400 GT", "F 750 GS", "F 850 GS", "G 310 GS", "G 310 R", "R 1250 GS", "R nineT", "S 1000 RR"],
        "Beta": ["Akvo 125", "Akvo 150", "BK 150", "BS 110", "Canyon 250", "Chrono 200", "Enduro 125", "Motard 200", "RR 200", "Tempo 150", "Tr 200", "Trekker 150", "Trekker 200", "Trekker 250", "Urban 150", "Zontes 310", "Zontes T350"],
        "CFMoto": ["250 NK", "300 NK", "300 SR", "400 NK", "650 NK", "650 MT", "650 Adventura", "700 CL-X", "700 MT", "800 MT", "1250 TR-G"],
        "Corven": ["Corven 110", "Corven 150", "Dakar 200", "Energy 110", "Expert 150", "Hunter 150", "Mirage 110", "Mirage 150", "Super 110", "Terrai 150", "Triax 150", "Triax 200", "Triax 250"],
        "Ducati": ["Monster", "Multistrada V2", "Multistrada V4", "Panigale V2", "Panigale V4", "Scrambler Icon", "Streetfighter V2", "Streetfighter V4"],
        "Gilera": ["Smash 110", "Smash Vs", "VC 150", "VC 200"],
        "Guerrero": ["GC 150", "GC 200", "GR 110", "GR 150", "GX 150", "GX1 200", "Queen 150", "Tratto G1", "Tratto G2", "Tratto G3", "Trip 110"],
        "Hero": ["Dash 110", "Eco Deluxe", "Glamour", "Hunk 150", "Ignitor", "Xpulse 200", "Xtreme 160R"],
        "Honda": ["Biz 110", "CB 125F", "CB 190R", "CB 250 Twister", "CB 500F", "CB 500X", "CB 650R", "CBR 250R", "CBR 600RR", "CG 150 Titan", "CRF 250L", "CRF 250 Rally", "CRF 300L", "Dax ST125", "Elite 125", "NC 750X", "NXR 125 Bros", "NXR 160 Bros", "Pop 110i", "Transalp XL750", "Tornado XR250", "Wave 110S", "XR 150L"],
        "Husqvarna": ["401 Vitpilen", "701 Supermoto", "Svartpilen 250", "Svartpilen 401", "Vitpilen 401"],
        "Kawasaki": ["Ninja 400", "Ninja 650", "Ninja ZX-6R", "Ninja ZX-10R", "Versys 300", "Versys 650", "Versys 1000", "Vulcan S", "Z400", "Z650", "Z900", "Z H2"],
        "KTM": ["125 Duke", "200 Duke", "250 Duke", "390 Adventure", "390 Duke", "690 SMC R", "790 Adventure", "890 Duke", "1290 Super Adventure", "1290 Super Duke"],
        "Motomel": ["Blitz 110", "Blitz 150", "CG 150", "CG 200", "CG 250", "Max 110", "S2 150", "S3 125", "Skua 150", "Skua 200", "Skua 250", "SX 150", "SX 200", "SX 250", "X3M 125"],
        "Royal Enfield": ["Classic 350", "Continental GT 650", "Himalayan", "Hunter 350", "Interceptor 650", "Meteor 350", "Scram 411"],
        "Suzuki": ["AX 100", "Access 125", "Burgman 125", "DR 650", "GN 125", "GSX 150F", "GSX-R 750", "GSX-R 1000", "Gixxer 150", "Gixxer 250", "Hayabusa", "V-Strom 250", "V-Strom 650", "V-Strom 1050"],
        "TVS": ["Apache RTR 160", "Apache RTR 180", "Apache RTR 200", "Neo XR", "Raider 125", "Rockz 125", "Sport 100"],
        "Triumph": ["Bonneville Bobber", "Daytona 660", "Scrambler 400 X", "Scrambler 900", "Speed 400", "Speed Triple 1200", "Street Triple", "Tiger 660", "Tiger 900", "Trident 660"],
        "Vespa": ["Primavera 150", "Sprint 150", "GTS 300"],
        "Voge": ["300DS", "300DSX", "300R", "500DS", "500DSX", "500R", "525DSX", "650DS", "650DSX", "900DSX"],
        "Yamaha": ["Crypton 110", "Crypton T110", "FZ 25", "FZ-S FI", "FZ 150", "FZ 250", "Fazer 150", "Fazer 250", "MT-03", "MT-07", "MT-09", "MT-10", "R3", "R7", "R1", "Ténéré 250", "Ténéré 700", "Tenere 900", "XTZ 150", "XTZ 250", "YBR 125", "YZF-R15"],
        "Zanella": ["Patagonian 150", "Patagonian Eagle 250", "RX 150", "RX1", "Sapucai 150", "Styler 125", "Styler 150", "ZB 110", "ZR 150", "ZR 200", "ZR 250"],
        "Otra": ["Otro modelo"],
    },
    AUTO: {
        "Alfa Romeo": ["Giulia", "Giulietta", "Mito", "Stelvio", "Tonale"],
        "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "S3", "TT"],
        "BMW": ["115i", "118i", "120i", "125i", "130i", "135i", "220i", "230i", "318i", "320i", "325i", "328i", "330i", "335i", "520i", "530i", "535i", "540i", "730i", "740i", "Serie 1", "Serie 2", "Serie 3", "Serie 4", "Serie 5", "Serie 7", "Z4"],
        "Chery": ["Arrizo 5", "Fulwin 2", "QQ", "Tiggo 2", "Tiggo 3", "Tiggo 5X"],
        "Chevrolet": ["Agile", "Aveo", "Bolt", "Corsa", "Corsa Classic", "Cruze", "Joy", "Meriva", "Onix", "Onix Plus", "Prisma", "Sonic", "Spark", "Spin", "Vectra"],
        "Chrysler": ["300C", "Neon", "PT Cruiser", "Sebring"],
        "Citroën": ["Berlingo (auto)", "C3", "C3 Aircross", "C3 Picasso", "C3 XR", "C4 Cactus", "C4 Lounge", "C4 Picasso", "C5", "C-Elysée", "DS3", "DS4"],
        "Dodge": ["Avenger", "Caliber", "Challenger", "Charger", "Journey", "Neon", "Stratus"],
        "Fiat": ["500", "Argo", "Cronos", "Fiorino (auto)", "Grand Siena", "Idea", "Linea", "Mobi", "Palio", "Palio Adventure", "Pulse", "Punto", "Qubo", "Siena", "Stilo", "Strada (auto)", "Uno", "Uno Way"],
        "Ford": ["Escort", "Fiesta", "Fiesta Kinetic", "Focus", "Fusion", "Galaxy", "Ka", "Ka Sedán", "Mondeo", "Mustang", "Territory"],
        "Geely": ["Emgrand", "EC7", "Coolray"],
        "Honda": ["City", "Civic", "Fit", "Insight", "Jazz", "New City"],
        "Hyundai": ["Accent", "Creta", "Elantra", "Excel", "Grand i10", "HB20", "i10", "i20", "i30", "i40", "Ioniq", "Kona", "Santa Fe (auto)", "Sonata", "Tiburón", "Veloster"],
        "Jeep": ["Cherokee", "Compass (auto)", "Renegade"],
        "Kia": ["Carens", "Cerato", "Forte", "Niro", "Picanto", "Rio", "Sephia", "Sorento (auto)", "Soul", "Sportage", "Stonic", "Stinger"],
        "Lexus": ["CT200h", "ES300", "IS250", "IS350", "NX200t", "RX350"],
        "Mazda": ["3", "6", "CX-3", "CX-5", "MX-5"],
        "Mercedes-Benz": ["A170", "A200", "A250", "C180", "C200", "C220", "C250", "C300", "CLA", "CLS", "E200", "E250", "E350", "S500", "SLK"],
        "Mini": ["Cooper", "Cooper S", "Countryman", "JCW"],
        "Mitsubishi": ["Colt", "Eclipse", "Lancer", "Mirage"],
        "Nissan": ["Altima", "Kicks", "Leaf", "March", "Maxima", "Note", "Qashqai", "Sentra", "Teana", "Tiida", "Tsuru", "V-Drive", "Versa"],
        "Peugeot": ["206", "207", "207 Compact", "208", "2008", "301", "307", "308", "3008", "408", "408 Sedan", "508", "5008", "Partner (auto)", "RCZ"],
        "Renault": ["9", "11", "12", "18", "19", "Captur", "Clio", "Clio Mio", "Duster (auto)", "Fluence", "Kangoo (auto)", "Kwid", "Laguna", "Logan", "Mégane", "Mégane II", "Mégane III", "R11", "R12", "R18", "R19", "Sandero", "Sandero Stepway", "Scala", "Scenic", "Symbol", "Twingo"],
        "Seat": ["Cordoba", "Ibiza", "León", "Toledo"],
        "Subaru": ["Impreza", "Legacy", "WRX"],
        "Suzuki": ["Baleno", "Celerio", "Ciaz", "Dzire", "Fun", "Grand Vitara (auto)", "Ignis", "S-Presso", "Swift"],
        "Toyota": ["Camry", "Corolla", "Corolla Cross", "Etios", "Etios Sedán", "Prius", "Yaris", "Yaris Sedán"],
        "Volkswagen": ["Bora", "Fox", "Gol", "Gol Country", "Gol Trend", "Golf", "Jetta", "Nivus", "Passat", "Polo", "Polo Classic", "Polo Sedán", "Saveiro (auto)", "Scirocco", "Senda", "Suran", "Taos (auto)", "T-Cross", "Tiguan (auto)", "Up!", "Virtus", "Vento"],
        "Volvo": ["S40", "S60", "V40", "V60", "XC40"],
        "Otra": ["Otro modelo"],
    },
    CAMIONETA: {
        "Chevrolet": ["Captiva", "Orlando", "Spin", "Tracker", "Trailblazer", "Trax", "Zafira"],
        "Citroën": ["Berlingo", "C3 Aircross", "Jumpy"],
        "Fiat": ["500X", "Doblo", "Fiorino", "Freemont", "Idea", "Pulse", "Qubo", "Strada (cabina extendida)"],
        "Ford": ["EcoSport", "Kuga", "Territory"],
        "Honda": ["HR-V", "WR-V"],
        "Hyundai": ["Creta", "H1", "i10 Active", "iX25", "Kona", "Tucson"],
        "Jeep": ["Commander", "Compass", "Renegade"],
        "Kia": ["Carens", "Carnival", "Soul", "Sorento", "Stonic"],
        "Mitsubishi": ["ASX", "Outlander", "Space Star"],
        "Nissan": ["Kicks", "X-Trail"],
        "Peugeot": ["Partner", "Rifter", "Expert"],
        "Renault": ["Captur", "Duster", "Kangoo", "Oroch", "Stepway", "Symbioz"],
        "Seat": ["Ateca", "Arona"],
        "Suzuki": ["Jimny", "Vitara"],
        "Toyota": ["Corolla Cross", "Yaris Cross"],
        "Volkswagen": ["Nivus", "Suran", "T-Cross", "Taigun"],
        "Otra": ["Otro modelo"],
    },
    PICKUP: {
        "Chevrolet": ["Montana", "S10"],
        "Dodge": ["Ram 1500", "Ram 2500"],
        "Fiat": ["Strada", "Toro"],
        "Ford": ["Courier", "F-100", "F-150", "F-250", "Maverick", "Ranger", "Ranger Raptor"],
        "Isuzu": ["D-Max"],
        "Mitsubishi": ["L200", "Montero Sport", "Triton"],
        "Nissan": ["Frontier", "NP300"],
        "Peugeot": ["Landtrek"],
        "Renault": ["Alaskan", "Duster Oroch", "Oroch"],
        "RAM": ["1000", "1500", "2500", "Rampage"],
        "Toyota": ["Hilux", "Hilux SRV", "Hilux SRX", "Hilux GR-Sport"],
        "Volkswagen": ["Amarok", "Saveiro"],
        "Otra": ["Otro modelo"],
    },
    SUV: {
        "Audi": ["Q2", "Q3", "Q5", "Q7", "Q8"],
        "BMW": ["X1", "X2", "X3", "X4", "X5", "X6", "X7"],
        "Chery": ["Tiggo 4", "Tiggo 7", "Tiggo 7 Pro", "Tiggo 8", "Tiggo 8 Pro"],
        "Chevrolet": ["Blazer", "Equinox", "Grand Blazer", "Suburban", "Tahoe", "Trailblazer", "Trax", "TrailBlazer"],
        "Ford": ["Bronco", "Edge", "Endeavour", "Escape", "Everest", "Explorer", "Kuga", "Territory"],
        "Honda": ["CR-V", "Passport", "Pilot"],
        "Hyundai": ["Kona", "Palisade", "Santa Fe", "Tucson"],
        "Jaguar": ["E-Pace", "F-Pace", "I-Pace"],
        "Jeep": ["Cherokee", "Commander", "Compass", "Grand Cherokee", "Wrangler"],
        "Kia": ["Niro", "Seltos", "Sorento", "Sportage", "Telluride"],
        "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Evoque", "Range Rover", "Range Rover Sport", "Velar"],
        "Lexus": ["GX", "LX", "NX", "RX", "UX"],
        "Mercedes-Benz": ["GLA", "GLB", "GLC", "GLE", "GLS", "Clase G"],
        "Mitsubishi": ["Eclipse Cross", "Montero", "Outlander"],
        "Nissan": ["Armada", "Murano", "Pathfinder", "X-Trail"],
        "Peugeot": ["3008", "5008"],
        "Porsche": ["Cayenne", "Macan"],
        "Renault": ["Arkana", "Koleos"],
        "Subaru": ["Ascent", "Forester", "Outback", "XV"],
        "Suzuki": ["Grand Vitara", "S-Cross"],
        "Toyota": ["4Runner", "Fortuner", "Land Cruiser", "Land Cruiser Prado", "RAV4", "Sequoia", "SW4"],
        "Volkswagen": ["Atlas", "Taos", "Tiguan", "Touareg"],
        "Volvo": ["XC40", "XC60", "XC90"],
        "Otra": ["Otro modelo"],
    },
    FLETE: {
        "Citroën": ["Berlingo (furgón)", "Jumper", "Jumpy (furgón)"],
        "Fiat": ["Ducato", "Fiorino (furgón)", "Scudo"],
        "Ford": ["Transit", "Transit Custom"],
        "Hyundai": ["H1 (furgón)", "H350"],
        "Iveco": ["Daily", "Daily 35", "Daily 45", "Daily 55", "Daily 70"],
        "Mercedes-Benz": ["Sprinter 311", "Sprinter 313", "Sprinter 411", "Sprinter 413", "Sprinter 415", "Sprinter 515", "Vito"],
        "Peugeot": ["Boxer", "Expert (furgón)", "Partner (furgón)"],
        "Renault": ["Kangoo (furgón)", "Master", "Trafic"],
        "Volkswagen": ["Crafter", "Transporter", "T-Cross Cargo"],
        "Otra": ["Otro modelo"],
    },
};

/**
 * Mapeo desde el vehicleType del form (lowercase) a la categoría del catálogo.
 */
export function getVehicleCategoryFromFormType(
    vehicleType: string
): VehicleCategory | null {
    const normalized = vehicleType.trim().toUpperCase();
    if (normalized === "MOTO") return "MOTO";
    if (normalized === "AUTO") return "AUTO";
    if (normalized === "CAMIONETA") return "CAMIONETA";
    if (normalized === "PICKUP") return "PICKUP";
    if (normalized === "SUV") return "SUV";
    if (normalized === "FLETE") return "FLETE";
    return null; // bicicleta y no-motorizados no tienen catálogo
}

/**
 * Lista de marcas disponibles para un tipo de vehículo (ordenadas alfabéticamente).
 * "Otra" va siempre al final.
 */
export function getBrandsForCategory(category: VehicleCategory): string[] {
    const brands = Object.keys(ARGENTINE_VEHICLE_CATALOG[category]);
    return brands.sort((a, b) => {
        if (a === "Otra") return 1;
        if (b === "Otra") return -1;
        return a.localeCompare(b, "es");
    });
}

/**
 * Modelos disponibles para una marca dentro de un tipo de vehículo.
 * Retorna [] si la marca no existe en esa categoría.
 */
export function getModelsForBrand(
    category: VehicleCategory,
    brand: string
): string[] {
    const brandMap = ARGENTINE_VEHICLE_CATALOG[category];
    if (!brandMap) return [];
    const models = brandMap[brand];
    if (!models) return [];
    return [...models]; // copia defensiva
}

/**
 * Lista canónica de colores comunes para vehículos en Argentina.
 * Permitimos custom via "Otro" para colores raros (violeta, naranja flúor, etc).
 */
export const VEHICLE_COLORS: string[] = [
    "Azul",
    "Beige",
    "Blanco",
    "Bordó",
    "Celeste",
    "Gris",
    "Gris Plata",
    "Marrón",
    "Naranja",
    "Negro",
    "Rojo",
    "Verde",
    "Amarillo",
    "Dorado",
    "Otro",
];
