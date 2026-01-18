import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "./user-actions";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          sessions: { where: { status: "COMPLETED" } },
        },
      },
    },
  });

  const roleColors = {
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    INSTRUCTOR: "bg-blue-100 text-blue-700",
    CLIENT: "bg-green-100 text-green-700",
  };

  const roleLabels = {
    SUPER_ADMIN: "Admin",
    INSTRUCTOR: "Instructeur",
    CLIENT: "Klant",
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Gebruikers</h1>
        <p className="text-sm text-gray-500">Beheer alle gebruikers op het platform</p>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">
            Alle gebruikers ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                      {roleLabels[user.role as keyof typeof roleLabels]}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {user._count.sessions} trainingen
                    </p>
                  </div>
                  <div className="md:hidden">
                    <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                      {roleLabels[user.role as keyof typeof roleLabels]}
                    </Badge>
                  </div>
                  <UserActions
                    userId={user.id}
                    userName={user.name}
                    userRole={user.role}
                    currentUserId={session.user.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
