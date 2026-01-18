import { PrismaClient, Role, Difficulty, Location, Language } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create super admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@fitness.app" },
    update: {},
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
    update: {},
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

  // Create sample exercises with more details
  const exercises = await Promise.all([
    prisma.exercise.upsert({
      where: { id: "exercise-1" },
      update: {},
      create: {
        id: "exercise-1",
        name: "Push-ups",
        description: "Klassieke push-ups. Houd je lichaam recht, zak naar beneden tot je borst bijna de grond raakt, en duw jezelf weer omhoog.",
        instructions: "1. Begin in plank positie met handen iets breder dan schouderbreed\n2. Houd je lichaam in een rechte lijn\n3. Zak langzaam naar beneden\n4. Duw jezelf weer omhoog\n5. Herhaal",
        durationMinutes: 10,
        sets: 3,
        reps: 15,
        restSeconds: 60,
        caloriesPerSet: 15,
        requiresEquipment: false,
        location: Location.HOME,
        muscleGroups: "borst,schouders,triceps",
        creatorId: instructor.id,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "exercise-2" },
      update: {},
      create: {
        id: "exercise-2",
        name: "Plank",
        description: "Houd de plank positie aan. Rug recht, buik aangespannen, kijk naar de grond.",
        instructions: "1. Ga op je onderarmen en tenen liggen\n2. Houd je lichaam in een rechte lijn\n3. Span je buikspieren aan\n4. Houd deze positie vast\n5. Adem rustig door",
        durationMinutes: 5,
        sets: 3,
        holdSeconds: 60,
        restSeconds: 45,
        caloriesPerSet: 8,
        requiresEquipment: false,
        location: Location.HOME,
        muscleGroups: "core,buik,rug",
        creatorId: instructor.id,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "exercise-3" },
      update: {},
      create: {
        id: "exercise-3",
        name: "Squats met dumbbells",
        description: "Sta rechtop met dumbbells in je handen. Zak door je knieën tot je bovenbenen parallel aan de grond zijn. Kom weer omhoog.",
        instructions: "1. Sta met voeten op schouderbreed\n2. Houd dumbbells langs je lichaam\n3. Zak door je knieën alsof je gaat zitten\n4. Houd je rug recht\n5. Duw door je hielen omhoog",
        youtubeUrl: "https://www.youtube.com/watch?v=aYZRRyukuIw",
        durationMinutes: 15,
        sets: 4,
        reps: 12,
        restSeconds: 90,
        caloriesPerSet: 20,
        requiresEquipment: true,
        equipment: "Dumbbells (5-10kg)",
        location: Location.GYM,
        muscleGroups: "benen,billen,quadriceps",
        creatorId: instructor.id,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "exercise-4" },
      update: {},
      create: {
        id: "exercise-4",
        name: "Bankdrukken",
        description: "Lig op de bank met je voeten plat op de grond. Pak de stang iets breder dan schouderbreed en druk omhoog.",
        instructions: "1. Lig plat op de bank\n2. Pak de stang met brede grip\n3. Til de stang van het rek\n4. Zak langzaam naar je borst\n5. Duw explosief omhoog",
        durationMinutes: 20,
        sets: 4,
        reps: 10,
        restSeconds: 120,
        caloriesPerSet: 25,
        requiresEquipment: true,
        equipment: "Bankdruk station, halterstang",
        location: Location.GYM,
        muscleGroups: "borst,schouders,triceps",
        creatorId: instructor.id,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "exercise-5" },
      update: {},
      create: {
        id: "exercise-5",
        name: "Hardlopen buiten",
        description: "Rustig tempo hardlopen. Focus op een constante ademhaling en ontspannen schouders.",
        instructions: "1. Warm op met 5 minuten wandelen\n2. Begin met licht joggen\n3. Vind je comfortabele tempo\n4. Focus op ademhaling\n5. Cool down met wandelen",
        durationMinutes: 30,
        sets: 1,
        reps: 1,
        restSeconds: 0,
        caloriesPerSet: 300,
        requiresEquipment: false,
        location: Location.OUTDOOR,
        muscleGroups: "benen,cardio,conditie",
        creatorId: instructor.id,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "exercise-6" },
      update: {},
      create: {
        id: "exercise-6",
        name: "Lunges",
        description: "Uitvalspassen naar voren. Wissel af tussen links en rechts.",
        instructions: "1. Sta rechtop met voeten bij elkaar\n2. Stap naar voren met één been\n3. Zak door beide knieën tot 90 graden\n4. Duw jezelf terug naar start\n5. Wissel van been",
        durationMinutes: 12,
        sets: 3,
        reps: 12,
        restSeconds: 60,
        caloriesPerSet: 18,
        requiresEquipment: false,
        location: Location.HOME,
        muscleGroups: "benen,billen,balans",
        creatorId: instructor.id,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "exercise-7" },
      update: {},
      create: {
        id: "exercise-7",
        name: "Burpees",
        description: "Complete lichaamsoefening die kracht en cardio combineert.",
        instructions: "1. Sta rechtop\n2. Zak door naar squat positie\n3. Spring met je voeten naar achteren (plank)\n4. Doe een push-up\n5. Spring terug naar squat en spring omhoog",
        durationMinutes: 10,
        sets: 3,
        reps: 10,
        restSeconds: 90,
        caloriesPerSet: 30,
        requiresEquipment: false,
        location: Location.HOME,
        muscleGroups: "full-body,cardio,kracht",
        creatorId: instructor.id,
      },
    }),
  ]);
  console.log(`Created ${exercises.length} exercises`);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: "category-1" },
      update: {},
      create: {
        id: "category-1",
        name: "Krachttraining",
        description: "Programma's gericht op spierkracht",
        color: "#EF4444",
        icon: "dumbbell",
        creatorId: instructor.id,
      },
    }),
    prisma.category.upsert({
      where: { id: "category-2" },
      update: {},
      create: {
        id: "category-2",
        name: "Cardio",
        description: "Programma's gericht op uithoudingsvermogen",
        color: "#3B82F6",
        icon: "heart",
        creatorId: instructor.id,
      },
    }),
    prisma.category.upsert({
      where: { id: "category-3" },
      update: {},
      create: {
        id: "category-3",
        name: "Thuis Workouts",
        description: "Oefeningen zonder apparatuur",
        color: "#10B981",
        icon: "home",
        creatorId: instructor.id,
      },
    }),
  ]);
  console.log(`Created ${categories.length} categories`);

  // Create program templates (some public for library)
  const beginnerProgram = await prisma.program.upsert({
    where: { id: "program-1" },
    update: {},
    create: {
      id: "program-1",
      name: "Beginners Full Body",
      description: "Een compleet full-body workout voor beginners. Perfect om te starten met fitness.",
      shortDescription: "Ideaal startprogramma voor beginners",
      difficulty: Difficulty.BEGINNER,
      location: Location.HOME,
      durationMinutes: 30,
      caloriesBurn: 200,
      isPublic: true,
      creatorId: instructor.id,
      categoryId: "category-3",
    },
  });
  console.log("Created program:", beginnerProgram.name);

  const intermediateProgram = await prisma.program.upsert({
    where: { id: "program-2" },
    update: {},
    create: {
      id: "program-2",
      name: "Intermediate Strength",
      description: "Kracht training voor gevorderden met focus op compound oefeningen.",
      shortDescription: "Bouw serieuze kracht op",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.GYM,
      durationMinutes: 45,
      caloriesBurn: 350,
      equipmentNeeded: "Dumbbells, bankdruk station",
      isPublic: true,
      creatorId: instructor.id,
      categoryId: "category-1",
    },
  });
  console.log("Created program:", intermediateProgram.name);

  const advancedProgram = await prisma.program.upsert({
    where: { id: "program-3" },
    update: {},
    create: {
      id: "program-3",
      name: "Advanced Athlete",
      description: "Intensief programma voor ervaren sporters. Combineert kracht en cardio.",
      shortDescription: "Voor de serieuze atleet",
      difficulty: Difficulty.ADVANCED,
      location: Location.GYM,
      durationMinutes: 60,
      caloriesBurn: 500,
      equipmentNeeded: "Complete gym apparatuur",
      isPublic: true,
      creatorId: instructor.id,
      categoryId: "category-1",
    },
  });
  console.log("Created program:", advancedProgram.name);

  const cardioProgram = await prisma.program.upsert({
    where: { id: "program-4" },
    update: {},
    create: {
      id: "program-4",
      name: "Cardio Blast",
      description: "Intensieve cardio sessie voor maximale vetverbranding.",
      shortDescription: "Verbrand calorieën en verbeter je conditie",
      difficulty: Difficulty.INTERMEDIATE,
      location: Location.OUTDOOR,
      durationMinutes: 40,
      caloriesBurn: 400,
      isPublic: true,
      creatorId: instructor.id,
      categoryId: "category-2",
    },
  });
  console.log("Created program:", cardioProgram.name);

  // Add exercises to programs
  await Promise.all([
    // Beginner program exercises
    prisma.programItem.upsert({
      where: { id: "program-item-1" },
      update: {},
      create: {
        id: "program-item-1",
        order: 0,
        programId: beginnerProgram.id,
        exerciseId: "exercise-1",
        notes: "Neem de tijd voor goede vorm",
      },
    }),
    prisma.programItem.upsert({
      where: { id: "program-item-2" },
      update: {},
      create: {
        id: "program-item-2",
        order: 1,
        programId: beginnerProgram.id,
        exerciseId: "exercise-2",
      },
    }),
    prisma.programItem.upsert({
      where: { id: "program-item-3" },
      update: {},
      create: {
        id: "program-item-3",
        order: 2,
        programId: beginnerProgram.id,
        exerciseId: "exercise-6",
      },
    }),
    // Intermediate program exercises
    prisma.programItem.upsert({
      where: { id: "program-item-4" },
      update: {},
      create: {
        id: "program-item-4",
        order: 0,
        programId: intermediateProgram.id,
        exerciseId: "exercise-3",
      },
    }),
    prisma.programItem.upsert({
      where: { id: "program-item-5" },
      update: {},
      create: {
        id: "program-item-5",
        order: 1,
        programId: intermediateProgram.id,
        exerciseId: "exercise-4",
      },
    }),
    // Advanced program exercises
    prisma.programItem.upsert({
      where: { id: "program-item-6" },
      update: {},
      create: {
        id: "program-item-6",
        order: 0,
        programId: advancedProgram.id,
        exerciseId: "exercise-7",
        notes: "Warm-up oefening",
      },
    }),
    prisma.programItem.upsert({
      where: { id: "program-item-7" },
      update: {},
      create: {
        id: "program-item-7",
        order: 1,
        programId: advancedProgram.id,
        exerciseId: "exercise-3",
      },
    }),
    prisma.programItem.upsert({
      where: { id: "program-item-8" },
      update: {},
      create: {
        id: "program-item-8",
        order: 2,
        programId: advancedProgram.id,
        exerciseId: "exercise-4",
      },
    }),
    prisma.programItem.upsert({
      where: { id: "program-item-9" },
      update: {},
      create: {
        id: "program-item-9",
        order: 3,
        programId: advancedProgram.id,
        exerciseId: "exercise-5",
        notes: "Cool-down cardio",
      },
    }),
    // Cardio program exercises
    prisma.programItem.upsert({
      where: { id: "program-item-10" },
      update: {},
      create: {
        id: "program-item-10",
        order: 0,
        programId: cardioProgram.id,
        exerciseId: "exercise-5",
      },
    }),
    prisma.programItem.upsert({
      where: { id: "program-item-11" },
      update: {},
      create: {
        id: "program-item-11",
        order: 1,
        programId: cardioProgram.id,
        exerciseId: "exercise-7",
      },
    }),
  ]);
  console.log("Added exercises to all programs");

  // Assign beginner program to client with date range
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 2); // 2 months from now

  const clientProgram = await prisma.clientProgram.upsert({
    where: { id: "client-program-1" },
    update: {},
    create: {
      id: "client-program-1",
      clientId: client.id,
      programId: beginnerProgram.id,
      order: 0,
      isActive: true,
      startDate: startDate,
      endDate: endDate,
      assignedBy: "INSTRUCTOR",
    },
  });
  console.log("Assigned beginner program to client");

  // Add custom notes for specific exercises for this client
  await prisma.clientExerciseNote.upsert({
    where: { id: "client-note-1" },
    update: {},
    create: {
      id: "client-note-1",
      clientProgramId: clientProgram.id,
      exerciseId: "exercise-1",
      note: "Let extra op je houding vanwege je schouder. Begin met 10 reps ipv 15.",
    },
  });
  console.log("Added custom exercise notes for client");

  // Create a welcome notification
  await prisma.notification.create({
    data: {
      userId: client.id,
      type: "PROGRAM_ASSIGNED",
      title: "Nieuw programma toegewezen",
      message: "Je trainer heeft het 'Beginners Full Body' programma aan je toegewezen.",
      link: "/client/programs",
    },
  });
  console.log("Created welcome notification");

  // Create a sample community post
  await prisma.communityPost.create({
    data: {
      authorId: instructor.id,
      title: "Welkom bij FitTrack Pro!",
      content: "Welkom allemaal! Dit is onze nieuwe fitness community. Hier deel ik tips, updates over programma's en motivatie. Laten we samen fit worden!",
      isPinned: true,
    },
  });
  console.log("Created sample community post");

  console.log("\n✅ Database seeded successfully!");
  console.log("\nTest accounts:");
  console.log("  Super Admin: admin@fitness.app / admin123");
  console.log("  Instructor: trainer@fitness.app / instructor123");
  console.log("  Client: klant@example.com / client123");
  console.log("\nProgram templates created:");
  console.log("  - Beginners Full Body (public, assigned to test client)");
  console.log("  - Intermediate Strength (public)");
  console.log("  - Advanced Athlete (public)");
  console.log("  - Cardio Blast (public)");
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
