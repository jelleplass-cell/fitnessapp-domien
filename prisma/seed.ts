import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create instructor
  const instructorPassword = await bcrypt.hash("instructor123", 10);
  const instructor = await prisma.user.upsert({
    where: { email: "trainer@fitness.app" },
    update: {},
    create: {
      email: "trainer@fitness.app",
      password: instructorPassword,
      name: "Jan de Trainer",
      role: "INSTRUCTOR",
    },
  });
  console.log("Created instructor:", instructor.email);

  // Create a test client
  const clientPassword = await bcrypt.hash("client123", 10);
  const client = await prisma.user.upsert({
    where: { email: "klant@example.com" },
    update: {},
    create: {
      email: "klant@example.com",
      password: clientPassword,
      name: "Pieter Klant",
      role: "CLIENT",
    },
  });
  console.log("Created client:", client.email);

  // Create some sample exercises
  const exercises = await Promise.all([
    prisma.exercise.upsert({
      where: { id: "exercise-1" },
      update: {},
      create: {
        id: "exercise-1",
        name: "Push-ups",
        description:
          "Klassieke push-ups. Houd je lichaam recht, zak naar beneden tot je borst bijna de grond raakt, en duw jezelf weer omhoog.",
        durationMinutes: 10,
        sets: 3,
        reps: 15,
        requiresEquipment: false,
        location: "HOME",
        creatorId: instructor.id,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "exercise-2" },
      update: {},
      create: {
        id: "exercise-2",
        name: "Plank",
        description:
          "Houd de plank positie aan. Rug recht, buik aangespannen, kijk naar de grond.",
        durationMinutes: 5,
        sets: 3,
        holdSeconds: 60,
        requiresEquipment: false,
        location: "HOME",
        creatorId: instructor.id,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "exercise-3" },
      update: {},
      create: {
        id: "exercise-3",
        name: "Squats met dumbbells",
        description:
          "Sta rechtop met dumbbells in je handen. Zak door je knieën tot je bovenbenen parallel aan de grond zijn. Kom weer omhoog.",
        youtubeUrl: "https://www.youtube.com/watch?v=aYZRRyukuIw",
        durationMinutes: 15,
        sets: 4,
        reps: 12,
        requiresEquipment: true,
        equipment: "Dumbbells (5-10kg)",
        location: "GYM",
        creatorId: instructor.id,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "exercise-4" },
      update: {},
      create: {
        id: "exercise-4",
        name: "Bankdrukken",
        description:
          "Lig op de bank met je voeten plat op de grond. Pak de stang iets breder dan schouderbreed en druk omhoog.",
        durationMinutes: 20,
        sets: 4,
        reps: 10,
        requiresEquipment: true,
        equipment: "Bankdruk station, halterstang",
        location: "GYM",
        creatorId: instructor.id,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "exercise-5" },
      update: {},
      create: {
        id: "exercise-5",
        name: "Hardlopen buiten",
        description:
          "Rustig tempo hardlopen. Focus op een constante ademhaling en ontspannen schouders.",
        durationMinutes: 30,
        sets: 1,
        reps: 1,
        requiresEquipment: false,
        location: "OUTDOOR",
        creatorId: instructor.id,
      },
    }),
  ]);
  console.log(`Created ${exercises.length} exercises`);

  // Create program templates
  const beginnerProgram = await prisma.program.upsert({
    where: { id: "program-1" },
    update: {},
    create: {
      id: "program-1",
      name: "Beginners Full Body",
      description: "Een compleet full-body workout voor beginners",
      difficulty: "BEGINNER",
      creatorId: instructor.id,
    },
  });
  console.log("Created program:", beginnerProgram.name);

  const intermediateProgram = await prisma.program.upsert({
    where: { id: "program-2" },
    update: {},
    create: {
      id: "program-2",
      name: "Intermediate Strength",
      description: "Kracht training voor gevorderden",
      difficulty: "INTERMEDIATE",
      creatorId: instructor.id,
    },
  });
  console.log("Created program:", intermediateProgram.name);

  const advancedProgram = await prisma.program.upsert({
    where: { id: "program-3" },
    update: {},
    create: {
      id: "program-3",
      name: "Advanced Athlete",
      description: "Intensief programma voor ervaren sporters",
      difficulty: "ADVANCED",
      creatorId: instructor.id,
    },
  });
  console.log("Created program:", advancedProgram.name);

  // Add exercises to beginner program
  await Promise.all([
    prisma.programItem.upsert({
      where: { id: "program-item-1" },
      update: {},
      create: {
        id: "program-item-1",
        order: 0,
        programId: beginnerProgram.id,
        exerciseId: "exercise-1",
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
        exerciseId: "exercise-3",
      },
    }),
  ]);
  console.log("Added exercises to beginner program");

  // Add exercises to intermediate program
  await Promise.all([
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
  ]);
  console.log("Added exercises to intermediate program");

  // Add exercises to advanced program
  await Promise.all([
    prisma.programItem.upsert({
      where: { id: "program-item-6" },
      update: {},
      create: {
        id: "program-item-6",
        order: 0,
        programId: advancedProgram.id,
        exerciseId: "exercise-1",
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
      },
    }),
  ]);
  console.log("Added exercises to advanced program");

  // Assign beginner program to client
  await prisma.clientProgram.upsert({
    where: { id: "client-program-1" },
    update: {},
    create: {
      id: "client-program-1",
      clientId: client.id,
      programId: beginnerProgram.id,
      order: 0,
      isActive: true,
    },
  });
  console.log("Assigned beginner program to client");

  console.log("\n✅ Database seeded successfully!");
  console.log("\nTest accounts:");
  console.log("  Instructor: trainer@fitness.app / instructor123");
  console.log("  Client: klant@example.com / client123");
  console.log("\nProgram templates created:");
  console.log("  - Beginners Full Body (assigned to test client)");
  console.log("  - Intermediate Strength");
  console.log("  - Advanced Athlete");
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
