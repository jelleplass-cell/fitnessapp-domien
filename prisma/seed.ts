import { PrismaClient, Role, Difficulty, Location, Language, EventType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create super admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@fitness.app" },
    update: {
      role: Role.SUPER_ADMIN,
      password: adminPassword,
    },
    create: {
      email: "admin@fitness.app",
      password: adminPassword,
      name: "Super Admin",
      firstName: "Super",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
      language: Language.NL,
    },
  });
  console.log("Created super admin:", admin.email);

  // Create instructor
  const instructorPassword = await bcrypt.hash("instructor123", 10);
  const instructor = await prisma.user.upsert({
    where: { email: "trainer@fitness.app" },
    update: {
      role: Role.INSTRUCTOR,
      password: instructorPassword,
    },
    create: {
      email: "trainer@fitness.app",
      password: instructorPassword,
      name: "Jan de Trainer",
      firstName: "Jan",
      lastName: "de Trainer",
      phone: "+31612345678",
      role: Role.INSTRUCTOR,
      language: Language.NL,
    },
  });
  console.log("Created instructor:", instructor.email);

  // Create a test client (linked to instructor)
  const clientPassword = await bcrypt.hash("client123", 10);
  const client = await prisma.user.upsert({
    where: { email: "klant@example.com" },
    update: {},
    create: {
      email: "klant@example.com",
      password: clientPassword,
      name: "Pieter Klant",
      firstName: "Pieter",
      lastName: "Klant",
      phone: "+31687654321",
      role: Role.CLIENT,
      language: Language.NL,
      instructorId: instructor.id,
    },
  });
  console.log("Created client:", client.email);

  // ============================================================
  // CATEGORIES
  // ============================================================
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: "category-strength" },
      update: {},
      create: {
        id: "category-strength",
        name: "Krachttraining",
        description: "Bouw spiermassa en kracht op met gewichten en bodyweight",
        color: "#EF4444",
        icon: "dumbbell",
        creatorId: instructor.id,
      },
    }),
    prisma.category.upsert({
      where: { id: "category-cardio" },
      update: {},
      create: {
        id: "category-cardio",
        name: "Cardio",
        description: "Verbeter je conditie en verbrand calorieën",
        color: "#3B82F6",
        icon: "heart",
        creatorId: instructor.id,
      },
    }),
    prisma.category.upsert({
      where: { id: "category-yoga" },
      update: {},
      create: {
        id: "category-yoga",
        name: "Yoga",
        description: "Verbeter flexibiliteit, balans en mentale rust",
        color: "#8B5CF6",
        icon: "lotus",
        creatorId: instructor.id,
      },
    }),
    prisma.category.upsert({
      where: { id: "category-pilates" },
      update: {},
      create: {
        id: "category-pilates",
        name: "Pilates",
        description: "Versterk je core en verbeter je houding",
        color: "#EC4899",
        icon: "activity",
        creatorId: instructor.id,
      },
    }),
    prisma.category.upsert({
      where: { id: "category-hiit" },
      update: {},
      create: {
        id: "category-hiit",
        name: "HIIT",
        description: "High Intensity Interval Training voor maximale vetverbranding",
        color: "#F97316",
        icon: "zap",
        creatorId: instructor.id,
      },
    }),
    prisma.category.upsert({
      where: { id: "category-flexibility" },
      update: {},
      create: {
        id: "category-flexibility",
        name: "Stretching & Mobility",
        description: "Verbeter je beweeglijkheid en voorkom blessures",
        color: "#10B981",
        icon: "stretch",
        creatorId: instructor.id,
      },
    }),
    prisma.category.upsert({
      where: { id: "category-home" },
      update: {},
      create: {
        id: "category-home",
        name: "Thuis Workouts",
        description: "Effectief trainen zonder apparatuur",
        color: "#06B6D4",
        icon: "home",
        creatorId: instructor.id,
      },
    }),
    prisma.category.upsert({
      where: { id: "category-outdoor" },
      update: {},
      create: {
        id: "category-outdoor",
        name: "Buiten Sporten",
        description: "Training in de buitenlucht",
        color: "#22C55E",
        icon: "sun",
        creatorId: instructor.id,
      },
    }),
  ]);
  console.log(`Created ${categories.length} categories`);

  // ============================================================
  // 100 EXERCISES - Diverse collectie
  // ============================================================

  // Helper function to create exercise data
  const createExercise = (
    id: string,
    name: string,
    description: string,
    instructions: string,
    durationMinutes: number,
    sets: number,
    reps: number | null,
    holdSeconds: number | null,
    restSeconds: number,
    caloriesPerSet: number,
    requiresEquipment: boolean,
    equipment: string | null,
    location: Location,
    muscleGroups: string,
    youtubeUrl?: string
  ) => ({
    id,
    name,
    description,
    instructions,
    durationMinutes,
    sets,
    reps,
    holdSeconds,
    restSeconds,
    caloriesPerSet,
    requiresEquipment,
    equipment,
    location,
    muscleGroups,
    youtubeUrl,
    creatorId: instructor.id,
  });

  const exerciseData = [
    // ========== KRACHTTRAINING - BOVENLICHAAM (1-20) ==========
    createExercise(
      "ex-001", "Push-ups",
      "Klassieke push-ups voor borst, schouders en triceps.",
      "1. Begin in plank positie met handen iets breder dan schouderbreed\n2. Houd je lichaam in een rechte lijn van hoofd tot hielen\n3. Zak langzaam naar beneden tot je borst bijna de grond raakt\n4. Duw jezelf explosief weer omhoog\n5. Herhaal zonder je rug te laten doorzakken",
      10, 3, 15, null, 60, 15, false, null, Location.HOME, "borst,schouders,triceps"
    ),
    createExercise(
      "ex-002", "Diamond Push-ups",
      "Push-up variatie met handen dicht bij elkaar voor extra triceps focus.",
      "1. Plaats je handen onder je borst, duimen en wijsvingers vormen een diamant\n2. Houd je ellebogen dicht bij je lichaam\n3. Zak langzaam naar beneden\n4. Duw omhoog met focus op triceps\n5. Houd je core aangespannen",
      10, 3, 12, null, 60, 18, false, null, Location.HOME, "triceps,borst,schouders"
    ),
    createExercise(
      "ex-003", "Pike Push-ups",
      "Push-up variatie met focus op schouders, goede voorbereiding voor handstand push-ups.",
      "1. Begin in een omgekeerde V-positie (downward dog)\n2. Houd je benen zo recht mogelijk\n3. Buig je ellebogen en breng je hoofd naar de grond\n4. Duw jezelf terug omhoog\n5. Houd je heupen hoog tijdens de beweging",
      10, 3, 10, null, 75, 16, false, null, Location.HOME, "schouders,triceps,borst"
    ),
    createExercise(
      "ex-004", "Bankdrukken",
      "De klassieke compound oefening voor borstspierontwikkeling.",
      "1. Lig plat op de bank met voeten stevig op de grond\n2. Pak de stang met een greep iets breder dan schouderbreed\n3. Til de stang van het rek en houd boven je borst\n4. Zak gecontroleerd naar je borst\n5. Duw explosief omhoog naar startpositie",
      20, 4, 10, null, 120, 25, true, "Bankdruk station, halterstang, gewichten", Location.GYM, "borst,schouders,triceps"
    ),
    createExercise(
      "ex-005", "Incline Dumbbell Press",
      "Schuine bankdruk met dumbbells voor bovenste borstspieren.",
      "1. Stel de bank in op 30-45 graden\n2. Pak dumbbells en breng naar schouderhoogte\n3. Duw omhoog tot armen gestrekt\n4. Zak gecontroleerd terug\n5. Hou je schouderbladen samengeknepen",
      15, 4, 12, null, 90, 20, true, "Verstelbare bank, dumbbells", Location.GYM, "borst,schouders"
    ),
    createExercise(
      "ex-006", "Dumbbell Flyes",
      "Isolatie oefening voor borstspieren met stretch.",
      "1. Lig op een vlakke bank met dumbbells boven je borst\n2. Lichte buiging in ellebogen behouden\n3. Open armen in een wijde boog naar beneden\n4. Voel de stretch in je borst\n5. Breng dumbbells terug naar boven",
      12, 3, 12, null, 60, 15, true, "Vlakke bank, dumbbells", Location.GYM, "borst"
    ),
    createExercise(
      "ex-007", "Dips",
      "Compound oefening voor triceps en onderste borst.",
      "1. Pak de dip stangen vast en til jezelf op\n2. Leun licht voorover voor meer borstactivatie\n3. Zak tot je bovenarmen parallel zijn aan de grond\n4. Duw jezelf explosief omhoog\n5. Houd beweging gecontroleerd",
      12, 3, 10, null, 90, 20, true, "Dip station of parallettes", Location.GYM, "triceps,borst,schouders"
    ),
    createExercise(
      "ex-008", "Tricep Dips op stoel",
      "Tricep oefening die thuis uitgevoerd kan worden.",
      "1. Plaats handen op de rand van een stevige stoel\n2. Benen gestrekt voor je, hielen op de grond\n3. Zak door je armen tot 90 graden\n4. Duw jezelf weer omhoog\n5. Houd je rug dicht bij de stoel",
      10, 3, 15, null, 60, 12, false, "Stevige stoel of bank", Location.HOME, "triceps,schouders"
    ),
    createExercise(
      "ex-009", "Shoulder Press",
      "Staande overhead press voor sterke schouders.",
      "1. Sta met voeten op heupbreedte, dumbbells op schouderhoogte\n2. Core aangespannen, onderrug in neutrale positie\n3. Duw dumbbells recht omhoog\n4. Breng gecontroleerd terug naar schouders\n5. Adem uit bij het omhoog duwen",
      15, 4, 10, null, 90, 18, true, "Dumbbells of halterstang", Location.GYM, "schouders,triceps"
    ),
    createExercise(
      "ex-010", "Lateral Raises",
      "Isolatie oefening voor zijdeltoïden.",
      "1. Sta rechtop met dumbbells langs je zij\n2. Lichte buiging in ellebogen\n3. Til armen zijwaarts tot schouderhoogte\n4. Korte pauze bovenaan\n5. Zak gecontroleerd terug",
      10, 3, 15, null, 45, 10, true, "Lichte dumbbells", Location.GYM, "schouders"
    ),
    createExercise(
      "ex-011", "Front Raises",
      "Isolatie oefening voor voorste schouders.",
      "1. Sta met dumbbells voor je bovenbenen\n2. Armen licht gebogen\n3. Til één arm naar voren tot schouderhoogte\n4. Zak gecontroleerd terug\n5. Wissel af tussen armen",
      10, 3, 12, null, 45, 10, true, "Dumbbells", Location.GYM, "schouders"
    ),
    createExercise(
      "ex-012", "Face Pulls",
      "Belangrijke oefening voor achterste schouders en houding.",
      "1. Stel cable machine in op gezichtshoogte\n2. Pak het touw met beide handen\n3. Trek naar je gezicht, ellebogen hoog\n4. Knijp schouderbladen samen\n5. Keer gecontroleerd terug",
      10, 3, 15, null, 45, 12, true, "Cable machine met touw", Location.GYM, "achterste schouders,rug"
    ),
    createExercise(
      "ex-013", "Bicep Curls",
      "Klassieke isolatie oefening voor biceps.",
      "1. Sta met dumbbells langs je zij, handpalmen naar voren\n2. Houd bovenarm stil\n3. Buig elleboog en curl gewicht omhoog\n4. Knijp biceps bovenaan\n5. Zak gecontroleerd terug",
      10, 3, 12, null, 60, 12, true, "Dumbbells of halterstang", Location.GYM, "biceps"
    ),
    createExercise(
      "ex-014", "Hammer Curls",
      "Bicep curl variatie voor onderarm en brachialis.",
      "1. Sta met dumbbells langs je zij, neutrale grip\n2. Handpalmen naar elkaar toe\n3. Curl omhoog met neutrale polsen\n4. Houd beweging gecontroleerd\n5. Wissel af of beide tegelijk",
      10, 3, 12, null, 60, 12, true, "Dumbbells", Location.GYM, "biceps,onderarmen"
    ),
    createExercise(
      "ex-015", "Tricep Kickbacks",
      "Isolatie oefening voor triceps.",
      "1. Buig voorover met één hand op bank\n2. Bovenarm parallel aan romp\n3. Strek onderarm naar achteren\n4. Knijp tricep bovenaan\n5. Buig terug en herhaal",
      10, 3, 12, null, 45, 10, true, "Dumbbells, bank", Location.GYM, "triceps"
    ),
    createExercise(
      "ex-016", "Skull Crushers",
      "Liggende tricep extensie oefening.",
      "1. Lig op bank met EZ-bar of dumbbells boven je\n2. Houd bovenarmen verticaal\n3. Buig ellebogen, gewicht naar voorhoofd\n4. Strek armen terug omhoog\n5. Houd ellebogen stil",
      12, 3, 12, null, 75, 15, true, "EZ-bar of dumbbells, bank", Location.GYM, "triceps"
    ),
    createExercise(
      "ex-017", "Pull-ups",
      "King of back exercises - compound oefening.",
      "1. Pak de stang met overhandse grip, iets breder dan schouders\n2. Hang met gestrekte armen\n3. Trek jezelf omhoog tot kin boven stang\n4. Knijp schouderbladen samen bovenaan\n5. Zak gecontroleerd terug",
      15, 4, 8, null, 120, 20, true, "Pull-up bar", Location.GYM, "rug,biceps,schouders"
    ),
    createExercise(
      "ex-018", "Chin-ups",
      "Pull-up variatie met meer biceps betrokkenheid.",
      "1. Pak de stang met onderhandse grip op schouderbreed\n2. Hang met gestrekte armen\n3. Trek jezelf omhoog tot kin boven stang\n4. Focus op biceps en rug\n5. Zak gecontroleerd terug",
      15, 4, 8, null, 120, 20, true, "Pull-up bar", Location.GYM, "biceps,rug"
    ),
    createExercise(
      "ex-019", "Bent Over Rows",
      "Compound oefening voor middenrug.",
      "1. Buig voorover met vlakke rug, knieën licht gebogen\n2. Pak de stang met overhandse grip\n3. Trek stang naar je navel\n4. Knijp schouderbladen samen\n5. Zak gecontroleerd terug",
      15, 4, 10, null, 90, 20, true, "Halterstang met gewichten", Location.GYM, "rug,biceps"
    ),
    createExercise(
      "ex-020", "Single Arm Dumbbell Row",
      "Eenzijdige roei oefening voor rugspieren.",
      "1. Plaats één knie en hand op bank\n2. Andere voet op de grond, dumbbell in hand\n3. Trek dumbbell naar heup\n4. Elleboog langs lichaam\n5. Zak gecontroleerd en wissel",
      12, 3, 10, null, 60, 15, true, "Dumbbell, bank", Location.GYM, "rug,biceps"
    ),

    // ========== KRACHTTRAINING - ONDERLICHAAM (21-40) ==========
    createExercise(
      "ex-021", "Bodyweight Squats",
      "Basis squat beweging zonder gewicht.",
      "1. Sta met voeten op schouderbreed\n2. Armen voor je of gekruist op borst\n3. Zak door knieën, heupen naar achteren\n4. Tot bovenbenen parallel aan grond\n5. Duw door hielen omhoog",
      10, 3, 20, null, 60, 12, false, null, Location.HOME, "benen,billen,core"
    ),
    createExercise(
      "ex-022", "Goblet Squats",
      "Squat met gewicht voor betere techniek.",
      "1. Houd dumbbell of kettlebell tegen borst\n2. Voeten op schouderbreed, tenen licht naar buiten\n3. Zak diep door je knieën\n4. Houd borst omhoog en rug recht\n5. Duw omhoog naar start",
      12, 3, 12, null, 75, 18, true, "Dumbbell of kettlebell", Location.GYM, "benen,billen,core"
    ),
    createExercise(
      "ex-023", "Barbell Back Squats",
      "De koning van alle beenoefeningn.",
      "1. Plaats stang op bovenrug, onder traps\n2. Sta met voeten op schouderbreed\n3. Zak gecontroleerd tot parallel of lager\n4. Knieën in lijn met tenen\n5. Duw explosief omhoog",
      20, 4, 8, null, 150, 30, true, "Squat rack, halterstang, gewichten", Location.GYM, "benen,billen,core,rug"
    ),
    createExercise(
      "ex-024", "Front Squats",
      "Squat variatie met meer quad focus.",
      "1. Stang rust op voorste schouders, clean grip\n2. Ellebogen hoog, parallel aan grond\n3. Zak recht naar beneden\n4. Houd romp verticaler dan back squat\n5. Duw omhoog",
      18, 4, 8, null, 150, 28, true, "Squat rack, halterstang", Location.GYM, "quadriceps,core,billen"
    ),
    createExercise(
      "ex-025", "Walking Lunges",
      "Dynamische lunge voor benen en balans.",
      "1. Sta rechtop met of zonder gewichten\n2. Stap naar voren in lunge\n3. Beide knieën op 90 graden\n4. Duw af en breng achterste been naar voren\n5. Herhaal afwisselend",
      12, 3, 20, null, 60, 15, false, "Optioneel: dumbbells", Location.HOME, "benen,billen,balans"
    ),
    createExercise(
      "ex-026", "Reverse Lunges",
      "Lunge naar achteren voor minder kniedruk.",
      "1. Sta rechtop, handen op heupen of met gewichten\n2. Stap naar achteren in lunge\n3. Voorste knie op 90 graden\n4. Achterste knie raakt bijna grond\n5. Duw terug naar start",
      12, 3, 12, null, 60, 15, false, "Optioneel: dumbbells", Location.HOME, "benen,billen"
    ),
    createExercise(
      "ex-027", "Bulgarian Split Squats",
      "Eenzijdige squat voor beenkracht en balans.",
      "1. Plaats achterste voet op bank achter je\n2. Voorste voet stap naar voren\n3. Zak recht naar beneden\n4. Voorste knie op 90 graden\n5. Duw omhoog en wissel been",
      15, 3, 10, null, 90, 18, true, "Bank of verhoging", Location.GYM, "benen,billen,balans"
    ),
    createExercise(
      "ex-028", "Romanian Deadlifts",
      "Hip hinge voor hamstrings en billen.",
      "1. Sta met stang of dumbbells voor je bovenbenen\n2. Lichte knie buiging, heupen naar achteren\n3. Zak tot je stretch voelt in hamstrings\n4. Houd rug vlak\n5. Heupen naar voren voor start",
      15, 4, 10, null, 90, 22, true, "Halterstang of dumbbells", Location.GYM, "hamstrings,billen,onderrug"
    ),
    createExercise(
      "ex-029", "Conventional Deadlifts",
      "Fundamentele compound oefening.",
      "1. Sta met voeten onder stang, heupbreed\n2. Pak stang net buiten knieën\n3. Borst omhoog, rug vlak\n4. Duw door benen en strek heupen\n5. Keer beweging om naar grond",
      20, 4, 6, null, 180, 35, true, "Halterstang, gewichten", Location.GYM, "rug,benen,billen,core"
    ),
    createExercise(
      "ex-030", "Sumo Deadlifts",
      "Deadlift variatie met wijde stand.",
      "1. Sta met voeten wijd, tenen naar buiten\n2. Pak stang met smalle grip tussen benen\n3. Borst omhoog, duw knieën naar buiten\n4. Til door benen en heupen\n5. Lock out en keer terug",
      20, 4, 6, null, 180, 35, true, "Halterstang, gewichten", Location.GYM, "benen,billen,rug,adductoren"
    ),
    createExercise(
      "ex-031", "Hip Thrusts",
      "Beste isolatie oefening voor bilspieren.",
      "1. Rug tegen bank, schouderbladen op rand\n2. Stang of gewicht op heupen\n3. Voeten plat op grond, knieën gebogen\n4. Duw heupen omhoog tot romp horizontaal\n5. Knijp billen bovenaan",
      15, 4, 12, null, 90, 20, true, "Bank, stang of dumbbell", Location.GYM, "billen,hamstrings"
    ),
    createExercise(
      "ex-032", "Glute Bridges",
      "Hip thrust variatie zonder bank.",
      "1. Lig op rug, knieën gebogen, voeten plat\n2. Armen langs lichaam\n3. Duw heupen omhoog\n4. Knijp billen aan top\n5. Zak gecontroleerd terug",
      10, 3, 15, null, 45, 12, false, null, Location.HOME, "billen,hamstrings,core"
    ),
    createExercise(
      "ex-033", "Leg Press",
      "Machine oefening voor quadriceps.",
      "1. Zit in leg press, rug plat tegen kussen\n2. Voeten op platform, heupbreed\n3. Duw gewicht omhoog, benen gestrekt\n4. Zak gecontroleerd terug\n5. Stop voordat knieën te ver buigen",
      15, 4, 12, null, 90, 22, true, "Leg press machine", Location.GYM, "quadriceps,billen"
    ),
    createExercise(
      "ex-034", "Leg Extensions",
      "Isolatie oefening voor quadriceps.",
      "1. Zit in machine, enkels onder kussen\n2. Rug tegen steun\n3. Strek benen volledig\n4. Knijp quads bovenaan\n5. Zak gecontroleerd terug",
      10, 3, 15, null, 60, 12, true, "Leg extension machine", Location.GYM, "quadriceps"
    ),
    createExercise(
      "ex-035", "Lying Leg Curls",
      "Isolatie oefening voor hamstrings.",
      "1. Lig op buik in machine\n2. Enkels onder kussen\n3. Curl benen omhoog naar billen\n4. Knijp hamstrings\n5. Zak gecontroleerd terug",
      10, 3, 12, null, 60, 12, true, "Leg curl machine", Location.GYM, "hamstrings"
    ),
    createExercise(
      "ex-036", "Standing Calf Raises",
      "Oefening voor kuitspieren.",
      "1. Sta op verhoging met ballen van voeten\n2. Hielen hangen over rand\n3. Duw omhoog op tenen\n4. Maximale contractie bovenaan\n5. Zak diep voor stretch",
      10, 4, 15, null, 45, 10, true, "Verhoging of calf raise machine", Location.GYM, "kuiten"
    ),
    createExercise(
      "ex-037", "Seated Calf Raises",
      "Kuitoefening met focus op soleus.",
      "1. Zit met knieën onder kussen\n2. Ballen van voeten op platform\n3. Duw omhoog op tenen\n4. Houd piek contractie\n5. Zak gecontroleerd",
      10, 3, 15, null, 45, 8, true, "Seated calf raise machine", Location.GYM, "kuiten"
    ),
    createExercise(
      "ex-038", "Step-ups",
      "Functionele oefening voor benen.",
      "1. Sta voor bank of verhoging\n2. Zet één voet op platform\n3. Duw door die voet omhoog\n4. Breng andere voet naast\n5. Stap terug en wissel",
      12, 3, 12, null, 60, 15, true, "Bank of plyo box", Location.GYM, "benen,billen,balans"
    ),
    createExercise(
      "ex-039", "Box Jumps",
      "Explosieve plyometrische oefening.",
      "1. Sta voor plyo box\n2. Zwaai armen naar achteren\n3. Spring explosief op box\n4. Land zacht met gebogen knieën\n5. Stap terug en herhaal",
      12, 3, 8, null, 90, 20, true, "Plyo box", Location.GYM, "benen,explosiviteit"
    ),
    createExercise(
      "ex-040", "Wall Sits",
      "Isometrische oefening voor quadriceps.",
      "1. Leun met rug tegen muur\n2. Zak tot bovenbenen parallel\n3. Knieën op 90 graden\n4. Houd deze positie aan\n5. Adem rustig door",
      8, 3, null, 45, 60, 10, false, null, Location.HOME, "quadriceps,uithoudingsvermogen"
    ),

    // ========== CORE TRAINING (41-50) ==========
    createExercise(
      "ex-041", "Plank",
      "Fundamentele core oefening.",
      "1. Ga op onderarmen en tenen liggen\n2. Lichaam in rechte lijn\n3. Buik en billen aangespannen\n4. Kijk naar de grond\n5. Houd positie vast",
      8, 3, null, 60, 45, 8, false, null, Location.HOME, "core,buik,rug"
    ),
    createExercise(
      "ex-042", "Side Plank",
      "Plank variatie voor obliques.",
      "1. Lig op je zij, steun op onderarm\n2. Til heupen van grond\n3. Lichaam in rechte lijn\n4. Bovenste hand op heup of omhoog\n5. Wissel van kant",
      8, 3, null, 30, 30, 6, false, null, Location.HOME, "obliques,core"
    ),
    createExercise(
      "ex-043", "Dead Bug",
      "Core oefening met anti-extensie focus.",
      "1. Lig op rug, armen omhoog, knieën op 90 graden\n2. Onderrug plat op grond\n3. Strek tegenovergestelde arm en been\n4. Houd onderrug plat\n5. Wissel af",
      10, 3, 20, null, 45, 8, false, null, Location.HOME, "core,stabiliteit"
    ),
    createExercise(
      "ex-044", "Bird Dog",
      "Anti-rotatie core oefening.",
      "1. Begin op handen en knieën\n2. Strek tegenovergestelde arm en been\n3. Houd rug vlak\n4. Breng terug naar start\n5. Wissel kant",
      10, 3, 16, null, 45, 6, false, null, Location.HOME, "core,rug,balans"
    ),
    createExercise(
      "ex-045", "Bicycle Crunches",
      "Dynamische core oefening voor buikspieren.",
      "1. Lig op rug, handen achter hoofd\n2. Benen van grond, knieën gebogen\n3. Breng elleboog naar tegenovergestelde knie\n4. Strek het andere been\n5. Wissel vloeiend af",
      10, 3, 20, null, 45, 10, false, null, Location.HOME, "buik,obliques"
    ),
    createExercise(
      "ex-046", "Russian Twists",
      "Rotatiebeweging voor obliques.",
      "1. Zit met knieën gebogen, voeten van grond\n2. Leun licht achterover\n3. Draai romp naar één kant\n4. Raak grond naast heup aan\n5. Draai naar andere kant",
      10, 3, 20, null, 45, 10, false, "Optioneel: gewicht of medicijnbal", Location.HOME, "obliques,core"
    ),
    createExercise(
      "ex-047", "Leg Raises",
      "Oefening voor onderste buikspieren.",
      "1. Lig op rug, benen gestrekt\n2. Handen onder billen voor steun\n3. Til benen omhoog tot 90 graden\n4. Houd onderrug op grond\n5. Zak gecontroleerd terug",
      10, 3, 15, null, 45, 12, false, null, Location.HOME, "onderbuik,core"
    ),
    createExercise(
      "ex-048", "Hanging Leg Raises",
      "Gevorderde core oefening.",
      "1. Hang aan pull-up bar\n2. Benen bij elkaar\n3. Til benen omhoog tot horizontaal of hoger\n4. Controleer de beweging\n5. Zak gecontroleerd terug",
      12, 3, 10, null, 60, 15, true, "Pull-up bar", Location.GYM, "onderbuik,core,grip"
    ),
    createExercise(
      "ex-049", "Ab Rollouts",
      "Gevorderde anti-extensie oefening.",
      "1. Kniel met ab wheel voor je\n2. Rol langzaam naar voren\n3. Strek zo ver mogelijk met controle\n4. Trek jezelf terug naar start\n5. Houd core aangespannen",
      10, 3, 10, null, 75, 15, true, "Ab wheel", Location.GYM, "core,schouders"
    ),
    createExercise(
      "ex-050", "Mountain Climbers",
      "Dynamische core en cardio oefening.",
      "1. Begin in plank positie\n2. Trek één knie naar borst\n3. Spring en wissel van been\n4. Houd heupen laag\n5. Blijf snel wisselen",
      8, 3, 30, null, 45, 15, false, null, Location.HOME, "core,cardio,schouders"
    ),

    // ========== CARDIO (51-65) ==========
    createExercise(
      "ex-051", "Hardlopen buiten",
      "Klassieke cardio training in de buitenlucht.",
      "1. Warm op met 5 minuten wandelen\n2. Begin met licht joggen\n3. Vind je comfortabele tempo\n4. Houd ademhaling gelijkmatig\n5. Cool down met wandelen",
      30, 1, 1, null, 0, 300, false, null, Location.OUTDOOR, "benen,cardio,conditie"
    ),
    createExercise(
      "ex-052", "Interval Running",
      "Afwisselend hardlopen en wandelen.",
      "1. Warm-up: 5 min wandelen\n2. Sprint 30 seconden\n3. Wandel 90 seconden\n4. Herhaal 8-10 keer\n5. Cool-down: 5 min wandelen",
      25, 1, 10, null, 0, 280, false, null, Location.OUTDOOR, "cardio,benen,vetverbranding"
    ),
    createExercise(
      "ex-053", "Fietsen buiten",
      "Cardio op de fiets in de buitenlucht.",
      "1. Controleer je fiets\n2. Begin rustig om op te warmen\n3. Varieer je tempo\n4. Gebruik verschillende versnellingen\n5. Cool down laatste 5 minuten",
      45, 1, 1, null, 0, 400, true, "Fiets, helm", Location.OUTDOOR, "benen,cardio,conditie"
    ),
    createExercise(
      "ex-054", "Spinning / Hometrainer",
      "Intensieve fietstraining binnen.",
      "1. Stel zadel en stuur in\n2. Warm op 5 minuten rustig\n3. Wissel tussen zittend en staand\n4. Varieer weerstand en snelheid\n5. Cool down en stretch",
      30, 1, 1, null, 0, 350, true, "Spinning fiets of hometrainer", Location.GYM, "benen,cardio"
    ),
    createExercise(
      "ex-055", "Roeien op machine",
      "Full-body cardio oefening.",
      "1. Zit met voeten in riemen\n2. Pak handvat, armen gestrekt\n3. Duw met benen, trek met armen\n4. Keer beweging om\n5. Houd consistente slag",
      20, 1, 1, null, 0, 250, true, "Roeimachine", Location.GYM, "rug,benen,armen,cardio"
    ),
    createExercise(
      "ex-056", "Loopband wandelen",
      "Low-impact cardio op loopband.",
      "1. Begin langzaam\n2. Verhoog snelheid geleidelijk\n3. Optioneel: incline verhogen\n4. Houd goede houding\n5. Cool down laatse minuten",
      30, 1, 1, null, 0, 150, true, "Loopband", Location.GYM, "benen,cardio"
    ),
    createExercise(
      "ex-057", "Loopband hardlopen",
      "Hardlopen op de loopband.",
      "1. Warm op met wandelen\n2. Verhoog naar jogtempo\n3. Vind comfortabel tempo\n4. Houd romp rechtop\n5. Cool down laatste 5 minuten",
      25, 1, 1, null, 0, 280, true, "Loopband", Location.GYM, "benen,cardio"
    ),
    createExercise(
      "ex-058", "Jumping Jacks",
      "Klassieke cardio oefening.",
      "1. Sta rechtop, armen langs zij\n2. Spring, spreid benen en armen\n3. Land met voeten wijd, handen boven hoofd\n4. Spring terug naar start\n5. Houd tempo hoog",
      8, 3, 30, null, 30, 20, false, null, Location.HOME, "cardio,full-body"
    ),
    createExercise(
      "ex-059", "High Knees",
      "Cardio oefening met knie heffingen.",
      "1. Sta rechtop\n2. Trek knie hoog op naar borst\n3. Wissel snel van been\n4. Armen mee bewegen\n5. Blijf op de bal van je voet",
      8, 3, 30, null, 30, 18, false, null, Location.HOME, "cardio,benen,core"
    ),
    createExercise(
      "ex-060", "Burpees",
      "Volledige lichaamsoefening die kracht en cardio combineert.",
      "1. Sta rechtop\n2. Zak naar squat, handen op grond\n3. Spring voeten naar achteren (plank)\n4. Doe een push-up\n5. Spring naar squat en omhoog met handen boven hoofd",
      10, 3, 10, null, 90, 30, false, null, Location.HOME, "full-body,cardio,kracht"
    ),
    createExercise(
      "ex-061", "Jump Rope / Touwtje springen",
      "Klassieke cardio met springtouw.",
      "1. Houd touw achter je\n2. Zwaai over hoofd\n3. Spring met beide voeten\n4. Land zacht op voorvoet\n5. Houd polsen ontspannen",
      15, 3, null, 60, 60, 35, true, "Springtouw", Location.HOME, "cardio,benen,coördinatie"
    ),
    createExercise(
      "ex-062", "Stair Climbing",
      "Traplopen voor cardio en beenkracht.",
      "1. Vind een trap of stairmaster\n2. Loop in stevig tempo omhoog\n3. Gebruik hele voet op tree\n4. Houd romp rechtop\n5. Wissel tempo voor variatie",
      20, 1, 1, null, 0, 200, true, "Trap of stairmaster", Location.GYM, "benen,cardio,billen"
    ),
    createExercise(
      "ex-063", "Zwemmen",
      "Low-impact full-body cardio.",
      "1. Warm op met rustige baantjes\n2. Wissel tussen slagen\n3. Focus op techniek\n4. Varieer intensiteit\n5. Cool down met rustige baantjes",
      30, 1, 1, null, 0, 350, true, "Zwembad", Location.GYM, "full-body,cardio"
    ),
    createExercise(
      "ex-064", "Elliptical Trainer",
      "Low-impact cardio machine.",
      "1. Stap op machine\n2. Pak handvatten of laat los\n3. Beweeg in vloeiende beweging\n4. Varieer weerstand\n5. Houd goede houding",
      25, 1, 1, null, 0, 250, true, "Elliptical trainer", Location.GYM, "benen,armen,cardio"
    ),
    createExercise(
      "ex-065", "Battle Ropes",
      "Intensieve cardio met touwen.",
      "1. Sta in halve squat\n2. Pak touwen stevig vast\n3. Maak golven door armen te bewegen\n4. Wissel tussen patronen\n5. Houd core aangespannen",
      10, 3, null, 30, 45, 25, true, "Battle ropes", Location.GYM, "armen,schouders,core,cardio"
    ),

    // ========== YOGA (66-80) ==========
    createExercise(
      "ex-066", "Downward Facing Dog",
      "Fundamentele yoga houding voor hele lichaam stretch.",
      "1. Begin op handen en knieën\n2. Duw heupen omhoog en achter\n3. Vorm omgekeerde V met lichaam\n4. Druk hielen richting grond\n5. Ontspan hoofd en nek",
      5, 1, null, 45, 0, 5, false, "Yogamat", Location.HOME, "hamstrings,schouders,rug,kuiten"
    ),
    createExercise(
      "ex-067", "Child's Pose (Balasana)",
      "Rusthouding voor ontspanning.",
      "1. Kniel op de mat\n2. Zit op je hielen\n3. Vouw voorover, voorhoofd op mat\n4. Armen langs lichaam of gestrekt voor je\n5. Adem diep en ontspan",
      5, 1, null, 60, 0, 3, false, "Yogamat", Location.HOME, "rug,heupen,ontspanning"
    ),
    createExercise(
      "ex-068", "Warrior I (Virabhadrasana I)",
      "Staande krachtige houding.",
      "1. Stap één been ver naar achteren\n2. Achtervoet 45 graden naar buiten\n3. Buig voorste knie tot 90 graden\n4. Hef armen boven hoofd\n5. Kijk omhoog tussen handen",
      8, 1, null, 30, 15, 5, false, "Yogamat", Location.HOME, "benen,heupen,schouders,balans"
    ),
    createExercise(
      "ex-069", "Warrior II (Virabhadrasana II)",
      "Staande houding voor kracht en focus.",
      "1. Benen wijd, voorste voet naar voren\n2. Achtervoet parallel aan achterkant mat\n3. Buig voorste knie\n4. Strek armen horizontaal\n5. Kijk over voorste hand",
      8, 1, null, 30, 15, 5, false, "Yogamat", Location.HOME, "benen,heupen,armen"
    ),
    createExercise(
      "ex-070", "Triangle Pose (Trikonasana)",
      "Zijwaartse stretch houding.",
      "1. Benen wijd, voorste voet naar voren\n2. Strek armen horizontaal\n3. Reik naar voren, dan naar beneden\n4. Onderste hand op scheenbeen of grond\n5. Kijk naar bovenste hand",
      8, 1, null, 30, 15, 4, false, "Yogamat", Location.HOME, "heupen,hamstrings,zij"
    ),
    createExercise(
      "ex-071", "Tree Pose (Vrksasana)",
      "Balanshoudingen voor concentratie.",
      "1. Sta op één been\n2. Plaats andere voet op dij of kuit\n3. Nooit op de knie!\n4. Handen in gebedshouding of boven hoofd\n5. Vind vast punt voor ogen",
      5, 1, null, 30, 15, 4, false, "Yogamat", Location.HOME, "balans,benen,concentratie"
    ),
    createExercise(
      "ex-072", "Cat-Cow Stretch",
      "Dynamische rugmobiliteit oefening.",
      "1. Begin op handen en knieën\n2. Cat: rond rug omhoog, kin naar borst\n3. Cow: laat buik zakken, kijk omhoog\n4. Beweeg met ademhaling\n5. Herhaal vloeiend",
      5, 1, 10, null, 0, 4, false, "Yogamat", Location.HOME, "rug,wervelkolom,mobiliteit"
    ),
    createExercise(
      "ex-073", "Cobra Pose (Bhujangasana)",
      "Backbend voor rugsterkte.",
      "1. Lig op buik, handen onder schouders\n2. Druk heupen in de mat\n3. Til borst omhoog\n4. Houd ellebogen dicht bij lichaam\n5. Kijk recht vooruit",
      5, 1, null, 30, 15, 4, false, "Yogamat", Location.HOME, "rug,core,borst"
    ),
    createExercise(
      "ex-074", "Pigeon Pose",
      "Diepe heupopener.",
      "1. Begin in downward dog\n2. Breng één knie naar voren\n3. Leg scheenbeen zo horizontaal mogelijk\n4. Achterbeen gestrekt naar achteren\n5. Vouw voorover voor diepere stretch",
      8, 1, null, 60, 30, 5, false, "Yogamat", Location.HOME, "heupen,billen,bekken"
    ),
    createExercise(
      "ex-075", "Seated Forward Fold",
      "Zittende vooroverbuiging voor hamstrings.",
      "1. Zit met gestrekte benen\n2. Flex voeten, tenen naar je toe\n3. Reik naar voren met rechte rug\n4. Pak voeten, enkels of schenen\n5. Ontspan in de stretch",
      5, 1, null, 45, 0, 4, false, "Yogamat", Location.HOME, "hamstrings,rug"
    ),
    createExercise(
      "ex-076", "Bridge Pose (Setu Bandhasana)",
      "Rugbuiging vanuit liggende positie.",
      "1. Lig op rug, knieën gebogen\n2. Voeten heupbreed, dicht bij billen\n3. Duw heupen omhoog\n4. Entrelacer vingers onder lichaam\n5. Houd nek ontspannen",
      5, 1, null, 30, 15, 5, false, "Yogamat", Location.HOME, "billen,rug,borst"
    ),
    createExercise(
      "ex-077", "Happy Baby Pose",
      "Ontspannende heupopener.",
      "1. Lig op rug\n2. Trek knieën naar borst\n3. Pak buitenkant voeten\n4. Trek knieën naar oksels\n5. Schommel zachtjes heen en weer",
      5, 1, null, 45, 0, 3, false, "Yogamat", Location.HOME, "heupen,lies,onderrug"
    ),
    createExercise(
      "ex-078", "Supine Twist",
      "Liggende draai voor rugmobiliteit.",
      "1. Lig op rug, armen gespreid\n2. Trek één knie naar borst\n3. Laat knie over lichaam vallen\n4. Kijk naar tegenovergestelde kant\n5. Wissel van kant",
      5, 1, null, 30, 15, 3, false, "Yogamat", Location.HOME, "rug,heupen,zij"
    ),
    createExercise(
      "ex-079", "Sun Salutation A",
      "Klassieke yoga flow sequentie.",
      "1. Mountain pose, handen omhoog\n2. Forward fold naar beneden\n3. Halfway lift, platte rug\n4. Plank, chaturanga, upward dog\n5. Downward dog, spring naar voren, omhoog",
      15, 3, 5, null, 30, 15, false, "Yogamat", Location.HOME, "full-body,flexibiliteit,kracht"
    ),
    createExercise(
      "ex-080", "Corpse Pose (Savasana)",
      "Eindontspanning en meditatie.",
      "1. Lig plat op rug\n2. Benen en armen ontspannen, licht gespreid\n3. Handpalmen naar boven\n4. Sluit ogen\n5. Adem diep en ontspan volledig",
      10, 1, null, 300, 0, 2, false, "Yogamat", Location.HOME, "ontspanning,meditatie"
    ),

    // ========== PILATES (81-90) ==========
    createExercise(
      "ex-081", "The Hundred",
      "Klassieke Pilates core activering.",
      "1. Lig op rug, benen in tabletop of gestrekt\n2. Til hoofd en schouders op\n3. Armen langs lichaam, handpalmen naar beneden\n4. Pomp armen op en neer, tel tot 100\n5. Adem 5 tellen in, 5 tellen uit",
      8, 1, 100, null, 30, 12, false, "Pilates mat", Location.HOME, "core,buik,uithoudingsvermogen"
    ),
    createExercise(
      "ex-082", "Roll Up",
      "Gecontroleerde buikspier oefening.",
      "1. Lig plat, armen boven hoofd\n2. Adem in, breng armen naar plafond\n3. Rol langzaam omhoog wervel voor wervel\n4. Reik naar tenen\n5. Rol gecontroleerd terug",
      10, 3, 8, null, 30, 8, false, "Pilates mat", Location.HOME, "buik,rug,flexibiliteit"
    ),
    createExercise(
      "ex-083", "Single Leg Stretch",
      "Core oefening met been wisselen.",
      "1. Lig op rug, schouders van mat\n2. Eén knie naar borst, ander been gestrekt\n3. Handen op knie\n4. Wissel benen in vloeiende beweging\n5. Houd romp stil",
      10, 3, 20, null, 30, 10, false, "Pilates mat", Location.HOME, "core,coördinatie"
    ),
    createExercise(
      "ex-084", "Double Leg Stretch",
      "Dynamische core oefening.",
      "1. Lig op rug, knieën naar borst\n2. Handen op schenen, hoofd van mat\n3. Strek armen en benen weg\n4. Cirkel armen en trek knieën terug\n5. Herhaal met controle",
      10, 3, 10, null, 30, 12, false, "Pilates mat", Location.HOME, "core,coördinatie"
    ),
    createExercise(
      "ex-085", "Spine Stretch Forward",
      "Gezeten rugstretch oefening.",
      "1. Zit met benen gespreid, voeten geflexi\n2. Armen naar voren op schouderhoogte\n3. Buig voorover vanaf bekken\n4. Reik naar voren, rond rug\n5. Rol wervel voor wervel terug",
      8, 3, 8, null, 30, 5, false, "Pilates mat", Location.HOME, "rug,hamstrings"
    ),
    createExercise(
      "ex-086", "Swimming",
      "Rug versterkende oefening.",
      "1. Lig op buik, armen en benen gestrekt\n2. Til armen, hoofd en benen van mat\n3. Flapper afwisselend armen en benen\n4. Als zwemmen in de lucht\n5. Adem rustig door",
      8, 3, 20, null, 30, 8, false, "Pilates mat", Location.HOME, "rug,billen,schouders"
    ),
    createExercise(
      "ex-087", "Teaser",
      "Gevorderde Pilates core oefening.",
      "1. Lig op rug, armen boven hoofd, benen gestrekt\n2. Rol omhoog, til tegelijk benen\n3. Balanceer op zitbeenderen, V-vorm\n4. Armen parallel aan benen\n5. Rol gecontroleerd terug",
      10, 3, 6, null, 45, 12, false, "Pilates mat", Location.HOME, "core,balans,kracht"
    ),
    createExercise(
      "ex-088", "Side Kick Series",
      "Zijliggende beenoefeningn.",
      "1. Lig op zij, hoofd op arm\n2. Benen iets naar voren\n3. Til bovenste been op heupniveau\n4. Schop naar voren, dan naar achteren\n5. Varieer met cirkels en lifts",
      12, 2, 10, null, 30, 8, false, "Pilates mat", Location.HOME, "heupen,billen,dijen"
    ),
    createExercise(
      "ex-089", "Shoulder Bridge",
      "Pilates bridge met been lift.",
      "1. Lig op rug, knieën gebogen\n2. Til heupen omhoog in bridge\n3. Strek één been naar plafond\n4. Zak been naar beneden zonder heupen te laten zakken\n5. Wissel been",
      10, 2, 8, null, 30, 10, false, "Pilates mat", Location.HOME, "billen,hamstrings,core"
    ),
    createExercise(
      "ex-090", "Spine Twist",
      "Gezeten rotatieoeening.",
      "1. Zit met benen gestrekt, armen wijd\n2. Grow tall door kruin\n3. Draai romp naar één kant\n4. Pulse twee keer\n5. Keer terug naar midden, wissel",
      8, 3, 10, null, 30, 5, false, "Pilates mat", Location.HOME, "rug,obliques,mobiliteit"
    ),

    // ========== HIIT (91-100) ==========
    createExercise(
      "ex-091", "HIIT Squat Jumps",
      "Explosieve squat met sprong.",
      "1. Sta in squat positie\n2. Spring explosief omhoog\n3. Strek volledig in de lucht\n4. Land zacht terug in squat\n5. Direct door naar volgende sprong",
      8, 4, 15, null, 30, 25, false, null, Location.HOME, "benen,billen,cardio,explosiviteit"
    ),
    createExercise(
      "ex-092", "Tuck Jumps",
      "Hoge sprong met knie optrek.",
      "1. Sta met voeten heupbreed\n2. Spring zo hoog mogelijk\n3. Trek knieën naar borst in de lucht\n4. Land zacht met gebogen knieën\n5. Direct volgende sprong",
      8, 3, 10, null, 45, 28, false, null, Location.HOME, "benen,core,explosiviteit"
    ),
    createExercise(
      "ex-093", "Speed Skaters",
      "Zijwaartse plyometrische beweging.",
      "1. Sta op één been\n2. Spring zijwaarts naar andere been\n3. Land op één been, ander been achter\n4. Zwaai armen mee\n5. Spring direct terug",
      8, 3, 20, null, 30, 22, false, null, Location.HOME, "benen,balans,cardio"
    ),
    createExercise(
      "ex-094", "Plank Jacks",
      "Jumping jacks in plank positie.",
      "1. Begin in plank positie\n2. Spring voeten wijd uit elkaar\n3. Spring voeten terug samen\n4. Houd heupen stabiel\n5. Houd tempo hoog",
      8, 3, 20, null, 30, 18, false, null, Location.HOME, "core,schouders,cardio"
    ),
    createExercise(
      "ex-095", "Sprawls",
      "Burpee variatie zonder push-up.",
      "1. Sta rechtop\n2. Zak naar squat, handen op grond\n3. Spring voeten naar achteren (plank)\n4. Spring direct terug naar squat\n5. Sta op of spring omhoog",
      10, 4, 12, null, 45, 25, false, null, Location.HOME, "full-body,cardio"
    ),
    createExercise(
      "ex-096", "Lunge Jumps",
      "Plyometrische lunges met wisseling.",
      "1. Begin in lunge positie\n2. Spring explosief omhoog\n3. Wissel benen in de lucht\n4. Land in lunge op andere kant\n5. Direct door naar volgende",
      10, 3, 16, null, 45, 24, false, null, Location.HOME, "benen,billen,explosiviteit"
    ),
    createExercise(
      "ex-097", "Shuttle Runs",
      "Korte sprints heen en weer.",
      "1. Zet twee markers 10-20 meter uit elkaar\n2. Sprint naar eerste marker\n3. Raak grond aan, keer om\n4. Sprint terug\n5. Herhaal zonder pauze",
      8, 4, 8, null, 60, 30, false, "Optioneel: markers of kegels", Location.OUTDOOR, "benen,cardio,wendbaarheid"
    ),
    createExercise(
      "ex-098", "Bear Crawls",
      "Dierbeweging voor full-body kracht.",
      "1. Begin op handen en voeten, knieën van grond\n2. Kruip naar voren met tegenovergestelde arm en been\n3. Houd heupen laag en stabiel\n4. Kruip ook achteruit\n5. Houd core aangespannen",
      8, 3, null, 30, 45, 15, false, null, Location.HOME, "core,schouders,benen"
    ),
    createExercise(
      "ex-099", "Kettlebell Swings",
      "Explosieve heup hinge beweging.",
      "1. Sta met voeten wijder dan schouders\n2. Kettlebell met twee handen vast\n3. Hinge heupen, zwaai kettlebell tussen benen\n4. Stoot heupen naar voren, zwaai omhoog\n5. Laat zwaartekracht werk doen op terugweg",
      12, 4, 15, null, 45, 25, true, "Kettlebell", Location.GYM, "billen,hamstrings,core,cardio"
    ),
    createExercise(
      "ex-100", "Slam Ball",
      "Explosieve core en cardio oefening.",
      "1. Sta met slam ball boven hoofd\n2. Gooi bal met kracht naar grond\n3. Zak mee naar beneden\n4. Pak bal op, til boven hoofd\n5. Herhaal explosief",
      10, 4, 12, null, 45, 22, true, "Slam ball", Location.GYM, "core,schouders,armen,cardio"
    ),
  ];

  // Create all exercises
  const exercises = await Promise.all(
    exerciseData.map((data) =>
      prisma.exercise.upsert({
        where: { id: data.id },
        update: {},
        create: data,
      })
    )
  );
  console.log(`Created ${exercises.length} exercises`);

  // ============================================================
  // 25 PROGRAMS FOR LIBRARY
  // ============================================================

  const programsData = [
    // 1. Beginner Full Body Home
    {
      id: "prog-001",
      name: "Beginners Full Body Thuis",
      description: "Perfect startprogramma voor fitness beginners. Geen apparatuur nodig, alle oefeningen kun je thuis doen. Focus op het leren van basistechnieken en opbouwen van basis conditie.",
      shortDescription: "Ideaal startprogramma zonder apparatuur",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 30,
      caloriesBurn: 180,
      isPublic: true,
      categoryId: "category-home",
      exercises: ["ex-021", "ex-001", "ex-041", "ex-032", "ex-058", "ex-025"],
    },
    // 2. Beginner Strength Gym
    {
      id: "prog-002",
      name: "Beginners Krachttraining",
      description: "Introductie tot krachttraining in de sportschool. Leer de basis compound oefeningen met veilige gewichten en goede techniek.",
      shortDescription: "Eerste stappen in de sportschool",
      difficulty: Difficulty.BEGINNER,
      location: Location.GYM,
      durationMinutes: 45,
      caloriesBurn: 250,
      equipmentNeeded: "Dumbbells, bankdruk station, leg press",
      isPublic: true,
      categoryId: "category-strength",
      exercises: ["ex-022", "ex-005", "ex-019", "ex-033", "ex-036"],
    },
    // 3. Intermediate Push Day
    {
      id: "prog-003",
      name: "Push Day - Intermediate",
      description: "Focus op duw-spieren: borst, schouders en triceps. Onderdeel van een push/pull/legs split voor gevorderden.",
      shortDescription: "Borst, schouders en triceps workout",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.GYM,
      durationMinutes: 50,
      caloriesBurn: 320,
      equipmentNeeded: "Bankdruk, dumbbells, dip station, cables",
      isPublic: true,
      categoryId: "category-strength",
      exercises: ["ex-004", "ex-005", "ex-009", "ex-010", "ex-007", "ex-016"],
    },
    // 4. Intermediate Pull Day
    {
      id: "prog-004",
      name: "Pull Day - Intermediate",
      description: "Focus op trek-spieren: rug en biceps. Perfecte aanvulling op Push Day in een PPL split.",
      shortDescription: "Rug en biceps training",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.GYM,
      durationMinutes: 50,
      caloriesBurn: 300,
      equipmentNeeded: "Pull-up bar, kabel machine, dumbbells",
      isPublic: true,
      categoryId: "category-strength",
      exercises: ["ex-017", "ex-019", "ex-020", "ex-012", "ex-013", "ex-014"],
    },
    // 5. Intermediate Leg Day
    {
      id: "prog-005",
      name: "Leg Day - Intermediate",
      description: "Complete beentraining met focus op quads, hamstrings en billen. Bouw kracht en spiermassa in je onderkant.",
      shortDescription: "Volledige beentraining",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.GYM,
      durationMinutes: 55,
      caloriesBurn: 380,
      equipmentNeeded: "Squat rack, leg press, leg curl machine",
      isPublic: true,
      categoryId: "category-strength",
      exercises: ["ex-023", "ex-028", "ex-033", "ex-035", "ex-031", "ex-036"],
    },
    // 6. Advanced Full Body
    {
      id: "prog-006",
      name: "Advanced Full Body Power",
      description: "Intensieve full-body training voor gevorderde atleten. Combineert compound oefeningen voor maximale resultaten.",
      shortDescription: "Intensieve training voor gevorderden",
      difficulty: Difficulty.ADVANCED,
      location: Location.GYM,
      durationMinutes: 70,
      caloriesBurn: 500,
      equipmentNeeded: "Complete sportschool apparatuur",
      isPublic: true,
      categoryId: "category-strength",
      exercises: ["ex-029", "ex-023", "ex-004", "ex-017", "ex-009", "ex-028"],
    },
    // 7. HIIT Fat Burner
    {
      id: "prog-007",
      name: "HIIT Fat Burner",
      description: "High Intensity Interval Training voor maximale calorieverbranding. Korte maar intensieve training die je metabolisme urenlang verhoogd houdt.",
      shortDescription: "Maximale vetverbranding in 25 minuten",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.HOME,
      durationMinutes: 25,
      caloriesBurn: 350,
      isPublic: true,
      categoryId: "category-hiit",
      exercises: ["ex-060", "ex-091", "ex-050", "ex-093", "ex-094", "ex-095"],
    },
    // 8. HIIT Advanced
    {
      id: "prog-008",
      name: "HIIT Extreme",
      description: "Gevorderde HIIT training voor maximale prestaties. Alleen voor ervaren atleten met goede basisconditie.",
      shortDescription: "Extreme intervaltraining",
      difficulty: Difficulty.ADVANCED,
      location: Location.HOME,
      durationMinutes: 30,
      caloriesBurn: 450,
      isPublic: true,
      categoryId: "category-hiit",
      exercises: ["ex-060", "ex-092", "ex-096", "ex-050", "ex-091", "ex-094", "ex-093"],
    },
    // 9. Yoga Morning Flow
    {
      id: "prog-009",
      name: "Yoga Ochtend Flow",
      description: "Zachte yoga sessie om je dag te beginnen. Wake-up je lichaam, verbeter je flexibiliteit en vind mentale rust.",
      shortDescription: "Start je dag met energie",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 20,
      caloriesBurn: 80,
      equipmentNeeded: "Yogamat",
      isPublic: true,
      categoryId: "category-yoga",
      exercises: ["ex-072", "ex-066", "ex-068", "ex-069", "ex-071", "ex-080"],
    },
    // 10. Yoga Flexibility
    {
      id: "prog-010",
      name: "Yoga voor Flexibiliteit",
      description: "Focus op het verbeteren van je flexibiliteit met diepe stretches en langere holds. Perfect voor stijve spieren.",
      shortDescription: "Verbeter je beweeglijkheid",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 35,
      caloriesBurn: 100,
      equipmentNeeded: "Yogamat",
      isPublic: true,
      categoryId: "category-yoga",
      exercises: ["ex-066", "ex-075", "ex-074", "ex-077", "ex-078", "ex-076", "ex-080"],
    },
    // 11. Power Yoga
    {
      id: "prog-011",
      name: "Power Yoga",
      description: "Dynamische yoga met focus op kracht en conditie. Vloeiende bewegingen in een hoger tempo voor een uitdagende workout.",
      shortDescription: "Krachtige yoga flow",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.HOME,
      durationMinutes: 45,
      caloriesBurn: 200,
      equipmentNeeded: "Yogamat",
      isPublic: true,
      categoryId: "category-yoga",
      exercises: ["ex-079", "ex-068", "ex-069", "ex-070", "ex-003", "ex-073", "ex-076"],
    },
    // 12. Pilates Core Focus
    {
      id: "prog-012",
      name: "Pilates Core Fundamentals",
      description: "Klassieke Pilates oefeningen met focus op core stabiliteit. Bouw een sterke kern en verbeter je houding.",
      shortDescription: "Sterke core, betere houding",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 30,
      caloriesBurn: 120,
      equipmentNeeded: "Pilates mat",
      isPublic: true,
      categoryId: "category-pilates",
      exercises: ["ex-081", "ex-082", "ex-083", "ex-044", "ex-085", "ex-089"],
    },
    // 13. Pilates Full Body
    {
      id: "prog-013",
      name: "Pilates Total Body",
      description: "Complete Pilates sessie voor het hele lichaam. Combinatie van kracht, flexibiliteit en controle.",
      shortDescription: "Pilates voor heel het lichaam",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.HOME,
      durationMinutes: 45,
      caloriesBurn: 180,
      equipmentNeeded: "Pilates mat",
      isPublic: true,
      categoryId: "category-pilates",
      exercises: ["ex-081", "ex-082", "ex-084", "ex-086", "ex-087", "ex-088", "ex-090"],
    },
    // 14. Cardio Indoor
    {
      id: "prog-014",
      name: "Cardio Indoor Workout",
      description: "Effectieve cardio training binnenshuis. Perfect voor als het weer niet meewerkt of als je thuis wilt trainen.",
      shortDescription: "Cardio zonder naar buiten te gaan",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 25,
      caloriesBurn: 220,
      isPublic: true,
      categoryId: "category-cardio",
      exercises: ["ex-058", "ex-059", "ex-050", "ex-061", "ex-060"],
    },
    // 15. Outdoor Running Program
    {
      id: "prog-015",
      name: "Outdoor Run Training",
      description: "Hardloopprogramma voor buiten. Combinatie van duurloop en intervallen voor betere conditie.",
      shortDescription: "Verbeter je hardlooptijd",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.OUTDOOR,
      durationMinutes: 40,
      caloriesBurn: 400,
      isPublic: true,
      categoryId: "category-outdoor",
      exercises: ["ex-051", "ex-052", "ex-097"],
    },
    // 16. Gym Cardio Mix
    {
      id: "prog-016",
      name: "Gym Cardio Variety",
      description: "Gebruik verschillende cardio machines voor een gevarieerde training. Voorkomt verveling en traint je lichaam op verschillende manieren.",
      shortDescription: "Variatie op cardio machines",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.GYM,
      durationMinutes: 45,
      caloriesBurn: 380,
      equipmentNeeded: "Loopband, roeier, fiets, elliptical",
      isPublic: true,
      categoryId: "category-cardio",
      exercises: ["ex-056", "ex-055", "ex-054", "ex-064", "ex-062"],
    },
    // 17. Core Destroyer
    {
      id: "prog-017",
      name: "Core Destroyer",
      description: "Intensieve core training voor een sterk middel. Alle buikspieren worden aangepakt in deze workout.",
      shortDescription: "Uitdagende buikspiertraining",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.HOME,
      durationMinutes: 20,
      caloriesBurn: 150,
      isPublic: true,
      categoryId: "category-home",
      exercises: ["ex-041", "ex-042", "ex-045", "ex-046", "ex-047", "ex-043"],
    },
    // 18. Advanced Core
    {
      id: "prog-018",
      name: "Advanced Core Training",
      description: "Gevorderde core oefeningen voor maximale kracht en stabiliteit. Voor atleten die de basis al beheersen.",
      shortDescription: "Elite core training",
      difficulty: Difficulty.ADVANCED,
      location: Location.GYM,
      durationMinutes: 25,
      caloriesBurn: 180,
      equipmentNeeded: "Pull-up bar, ab wheel",
      isPublic: true,
      categoryId: "category-strength",
      exercises: ["ex-048", "ex-049", "ex-087", "ex-042", "ex-041"],
    },
    // 19. Upper Body Home
    {
      id: "prog-019",
      name: "Bovenlichaam Thuis",
      description: "Train je bovenlichaam effectief zonder sportschool. Bodyweight oefeningen voor borst, rug, schouders en armen.",
      shortDescription: "Bovenlichaam zonder gewichten",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 30,
      caloriesBurn: 180,
      isPublic: true,
      categoryId: "category-home",
      exercises: ["ex-001", "ex-002", "ex-003", "ex-008", "ex-041"],
    },
    // 20. Lower Body Home
    {
      id: "prog-020",
      name: "Onderlichaam Thuis",
      description: "Complete beentraining die je thuis kunt doen. Geen apparatuur nodig, alleen je eigen lichaamsgewicht.",
      shortDescription: "Benen trainen zonder gym",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 30,
      caloriesBurn: 200,
      isPublic: true,
      categoryId: "category-home",
      exercises: ["ex-021", "ex-025", "ex-026", "ex-032", "ex-040"],
    },
    // 21. Stretch & Mobility
    {
      id: "prog-021",
      name: "Stretch & Mobility Routine",
      description: "Verbeter je mobiliteit en voorkom blessures met deze stretch routine. Perfect na het sporten of als actief herstel.",
      shortDescription: "Flexibiliteit en herstel",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 20,
      caloriesBurn: 60,
      equipmentNeeded: "Yogamat",
      isPublic: true,
      categoryId: "category-flexibility",
      exercises: ["ex-072", "ex-066", "ex-075", "ex-074", "ex-077", "ex-078"],
    },
    // 22. Quick Morning Workout
    {
      id: "prog-022",
      name: "15-Minuten Ochtendworkout",
      description: "Korte maar effectieve workout om je dag te starten. Wakker worden, metabolisme aanzwengelen en energie krijgen.",
      shortDescription: "Snelle start van je dag",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 15,
      caloriesBurn: 120,
      isPublic: true,
      categoryId: "category-home",
      exercises: ["ex-058", "ex-021", "ex-001", "ex-041"],
    },
    // 23. Kettlebell Workout
    {
      id: "prog-023",
      name: "Kettlebell Power",
      description: "Dynamische training met kettlebells. Bouw kracht en conditie op met deze veelzijdige tool.",
      shortDescription: "Kracht met kettlebells",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.GYM,
      durationMinutes: 35,
      caloriesBurn: 320,
      equipmentNeeded: "Kettlebells (diverse gewichten)",
      isPublic: true,
      categoryId: "category-strength",
      exercises: ["ex-099", "ex-022", "ex-028", "ex-009"],
    },
    // 24. Outdoor Bootcamp
    {
      id: "prog-024",
      name: "Outdoor Bootcamp",
      description: "Intensieve buitentraining die kracht en cardio combineert. Train als een soldaat in de buitenlucht.",
      shortDescription: "Militaire stijl buitentraining",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.OUTDOOR,
      durationMinutes: 45,
      caloriesBurn: 420,
      isPublic: true,
      categoryId: "category-outdoor",
      exercises: ["ex-051", "ex-060", "ex-021", "ex-001", "ex-025", "ex-097", "ex-050"],
    },
    // 25. Active Recovery
    {
      id: "prog-025",
      name: "Active Recovery Day",
      description: "Lichte beweging op rustdagen om herstel te bevorderen. Houdt je actief zonder je lichaam te overbelasten.",
      shortDescription: "Actief herstel op rustdagen",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 25,
      caloriesBurn: 80,
      equipmentNeeded: "Yogamat",
      isPublic: true,
      categoryId: "category-flexibility",
      exercises: ["ex-072", "ex-067", "ex-044", "ex-066", "ex-078", "ex-080"],
    },
  ];

  // Create programs
  const programs = [];
  for (const progData of programsData) {
    const { exercises: exerciseIds, ...programInfo } = progData;

    const program = await prisma.program.upsert({
      where: { id: progData.id },
      update: {},
      create: {
        ...programInfo,
        creatorId: instructor.id,
      },
    });
    programs.push(program);

    // Add exercises to program
    for (let i = 0; i < exerciseIds.length; i++) {
      await prisma.programItem.upsert({
        where: { id: `${progData.id}-item-${i}` },
        update: {},
        create: {
          id: `${progData.id}-item-${i}`,
          programId: program.id,
          exerciseId: exerciseIds[i],
          order: i,
        },
      });
    }
  }
  console.log(`Created ${programs.length} programs with exercises`);

  // ============================================================
  // ASSIGN SOME PROGRAMS TO CLIENT
  // ============================================================
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 2);

  // Assign beginner full body to client
  const clientProgram1 = await prisma.clientProgram.upsert({
    where: { id: "client-program-1" },
    update: {},
    create: {
      id: "client-program-1",
      clientId: client.id,
      programId: "prog-001",
      order: 0,
      isActive: true,
      startDate: startDate,
      endDate: endDate,
      assignedBy: "INSTRUCTOR",
    },
  });

  // Assign yoga morning flow
  await prisma.clientProgram.upsert({
    where: { id: "client-program-2" },
    update: {},
    create: {
      id: "client-program-2",
      clientId: client.id,
      programId: "prog-009",
      order: 1,
      isActive: true,
      startDate: startDate,
      endDate: endDate,
      assignedBy: "INSTRUCTOR",
    },
  });
  console.log("Assigned programs to client");

  // Add custom notes for specific exercises for this client
  await prisma.clientExerciseNote.upsert({
    where: { id: "client-note-1" },
    update: {},
    create: {
      id: "client-note-1",
      clientProgramId: clientProgram1.id,
      exerciseId: "ex-001",
      note: "Let extra op je houding vanwege je schouder. Begin met 10 reps ipv 15.",
    },
  });
  console.log("Added custom exercise notes for client");

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  await prisma.notification.create({
    data: {
      userId: client.id,
      type: "PROGRAM_ASSIGNED",
      title: "Nieuwe programma's toegewezen",
      message: "Je trainer heeft 'Beginners Full Body Thuis' en 'Yoga Ochtend Flow' aan je toegewezen.",
      link: "/client/programs",
    },
  });
  console.log("Created welcome notification");

  // ============================================================
  // COMMUNITY POST
  // ============================================================
  await prisma.communityPost.upsert({
    where: { id: "community-post-1" },
    update: {},
    create: {
      id: "community-post-1",
      authorId: instructor.id,
      title: "Welkom bij FitTrack Pro!",
      content: "Welkom allemaal! Dit is onze nieuwe fitness community. Hier deel ik tips, updates over programma's en motivatie. We hebben nu meer dan 100 oefeningen en 25 verschillende programma's beschikbaar in de bibliotheek. Van yoga tot HIIT, van beginner tot gevorderd - er is voor ieder wat wils!\n\nTips voor beginners:\n- Start rustig en bouw langzaam op\n- Focus eerst op techniek, dan op gewicht\n- Rust is net zo belangrijk als training\n- Drink voldoende water\n\nLaten we samen fit worden!",
      isPinned: true,
    },
  });
  console.log("Created sample community post");

  // ============================================================
  // EVENTS
  // ============================================================
  const now = new Date();

  // Event 1: Physical training (tomorrow)
  const trainingDate = new Date(now);
  trainingDate.setDate(trainingDate.getDate() + 1);
  trainingDate.setHours(10, 0, 0, 0);

  const trainingEvent = await prisma.event.upsert({
    where: { id: "event-1" },
    update: {},
    create: {
      id: "event-1",
      title: "Groepstraining Bootcamp",
      description: "Intensieve bootcamp training in de buitenlucht. We doen circuittraining met bodyweight oefeningen, hardlopen en teamchallenges. Geschikt voor alle niveaus - je kunt op je eigen tempo trainen.\n\nWat kun je verwachten:\n- Warming-up (10 min)\n- Circuittraining (40 min)\n- Cooling-down & stretching (10 min)\n\nNeem een handdoek en voldoende water mee!",
      eventType: EventType.TRAINING,
      location: "Vondelpark, Amsterdam",
      locationDetails: "We verzamelen bij de grote vijver, nabij het Blauwe Theehuis. Gratis parkeren mogelijk aan de Stadhouderskade.",
      equipment: "Yogamat (optioneel), handdoek, waterfles",
      difficulty: "INTERMEDIATE",
      startDate: trainingDate,
      endDate: new Date(trainingDate.getTime() + 60 * 60 * 1000),
      maxAttendees: 15,
      requiresRegistration: true,
      registrationDeadlineHours: 12,
      allowWaitlist: true,
      creatorId: instructor.id,
    },
  });
  console.log("Created event:", trainingEvent.title);

  // Event 2: Online coaching call (in 3 days)
  const onlineDate = new Date(now);
  onlineDate.setDate(onlineDate.getDate() + 3);
  onlineDate.setHours(19, 30, 0, 0);

  const onlineEvent = await prisma.event.upsert({
    where: { id: "event-2" },
    update: {},
    create: {
      id: "event-2",
      title: "Live Q&A: Voeding & Herstel",
      description: "In deze online sessie bespreken we alles over voeding rondom je trainingen en optimaal herstel. Je kunt live vragen stellen!\n\nOnderwerpen:\n- Pre- en post-workout maaltijden\n- Supplementen: wat werkt echt?\n- Slaap en herstel optimaliseren\n- Jouw vragen beantwoord",
      eventType: EventType.ONLINE,
      location: "Online",
      meetingUrl: "https://zoom.us/j/123456789",
      meetingPlatform: "zoom",
      startDate: onlineDate,
      endDate: new Date(onlineDate.getTime() + 45 * 60 * 1000),
      maxAttendees: 50,
      requiresRegistration: true,
      registrationDeadlineHours: 1,
      allowWaitlist: false,
      creatorId: instructor.id,
    },
  });
  console.log("Created event:", onlineEvent.title);

  // Event 3: Workshop (in 1 week)
  const workshopDate = new Date(now);
  workshopDate.setDate(workshopDate.getDate() + 7);
  workshopDate.setHours(14, 0, 0, 0);

  const workshopEvent = await prisma.event.upsert({
    where: { id: "event-3" },
    update: {},
    create: {
      id: "event-3",
      title: "Workshop: Mobility & Stretching",
      description: "Leer hoe je je mobiliteit verbetert en blessures voorkomt met de juiste stretching technieken. Deze hands-on workshop is perfect voor iedereen die last heeft van stijfheid of zijn flexibiliteit wil verbeteren.\n\nWe behandelen:\n- Warming-up methoden\n- Dynamisch vs statisch stretchen\n- Foam rolling technieken\n- Dagelijkse routines voor thuisgebruik",
      eventType: EventType.WORKSHOP,
      location: "Studio FitTrack, Prinsengracht 100, Amsterdam",
      locationDetails: "Bel aan bij 'FitTrack Studio' (2e verdieping). Er is een lift aanwezig.",
      equipment: "Comfortabele kleding",
      difficulty: "BEGINNER",
      startDate: workshopDate,
      endDate: new Date(workshopDate.getTime() + 2 * 60 * 60 * 1000),
      maxAttendees: 12,
      requiresRegistration: true,
      registrationDeadlineHours: 24,
      allowWaitlist: true,
      creatorId: instructor.id,
    },
  });
  console.log("Created event:", workshopEvent.title);

  // Event 4: Open gym (in 2 weeks)
  const openDate = new Date(now);
  openDate.setDate(openDate.getDate() + 14);
  openDate.setHours(9, 0, 0, 0);

  const openEvent = await prisma.event.upsert({
    where: { id: "event-4" },
    update: {},
    create: {
      id: "event-4",
      title: "Open Gym Sessie",
      description: "De gym is open voor vrij trainen. Geen begeleiding, maar wel de mogelijkheid om samen te trainen met andere leden. Ideaal om je eigen programma te volgen in een motiverende omgeving.",
      eventType: EventType.OTHER,
      location: "FitTrack Gym, Keizersgracht 200, Amsterdam",
      startDate: openDate,
      endDate: new Date(openDate.getTime() + 3 * 60 * 60 * 1000),
      requiresRegistration: false,
      creatorId: instructor.id,
    },
  });
  console.log("Created event:", openEvent.title);

  // Register client for the first training event
  await prisma.eventRegistration.upsert({
    where: { id: "event-reg-1" },
    update: {},
    create: {
      id: "event-reg-1",
      eventId: trainingEvent.id,
      userId: client.id,
      status: "REGISTERED",
      isWaitlist: false,
    },
  });
  console.log("Registered client for bootcamp event");

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n✅ Database seeded successfully!");
  console.log("\nTest accounts:");
  console.log("  Super Admin: admin@fitness.app / admin123");
  console.log("  Instructor: trainer@fitness.app / instructor123");
  console.log("  Client: klant@example.com / client123");
  console.log("\nContent created:");
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${exercises.length} exercises`);
  console.log(`  - ${programs.length} programs`);
  console.log("  - 4 events");
  console.log("\nCategories:");
  console.log("  - Krachttraining, Cardio, Yoga, Pilates");
  console.log("  - HIIT, Stretching & Mobility, Thuis Workouts, Buiten Sporten");
  console.log("\nExercise types included:");
  console.log("  - Upper body strength (chest, shoulders, arms, back)");
  console.log("  - Lower body strength (legs, glutes)");
  console.log("  - Core training");
  console.log("  - Cardio (indoor & outdoor)");
  console.log("  - Yoga poses");
  console.log("  - Pilates exercises");
  console.log("  - HIIT movements");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
