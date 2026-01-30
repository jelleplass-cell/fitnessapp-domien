import { db } from "@/lib/db";

interface CourseWithAccess {
  id: string;
  accessType: "OPEN" | "SEQUENTIAL" | "COMMUNITY" | "PRIVATE";
  prerequisiteId: string | null;
  communityId: string | null;
  creatorId: string;
}

/**
 * Check if a user can access a course based on its access type.
 * Returns { allowed: true } or { allowed: false, reason: string }
 */
export async function canAccessCourse(
  userId: string,
  course: CourseWithAccess
): Promise<{ allowed: boolean; reason?: string }> {
  switch (course.accessType) {
    case "OPEN":
      return { allowed: true };

    case "SEQUENTIAL": {
      if (!course.prerequisiteId) {
        return { allowed: true };
      }
      const prerequisiteEnrollment = await db.courseEnrollment.findUnique({
        where: {
          clientId_courseId: {
            clientId: userId,
            courseId: course.prerequisiteId,
          },
        },
      });
      if (prerequisiteEnrollment?.completedAt) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Je moet eerst de vereiste cursus voltooien.",
      };
    }

    case "COMMUNITY": {
      if (!course.communityId) {
        return { allowed: true };
      }
      const membership = await db.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: course.communityId,
            userId,
          },
        },
      });
      if (membership) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Je moet lid zijn van de gekoppelde community.",
      };
    }

    case "PRIVATE": {
      const enrollment = await db.courseEnrollment.findUnique({
        where: {
          clientId_courseId: {
            clientId: userId,
            courseId: course.id,
          },
        },
      });
      if (enrollment) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Je hebt geen toegang tot deze cursus.",
      };
    }

    default:
      return { allowed: false, reason: "Onbekend toegangstype." };
  }
}
