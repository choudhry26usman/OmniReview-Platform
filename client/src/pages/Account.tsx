import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogOut, User, Mail, Calendar, Shield } from "lucide-react";

export default function Account() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return "User";
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading account information...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account information and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your account details from Replit authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profileImageUrl || undefined} alt={getDisplayName()} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold" data-testid="text-user-name">
                  {getDisplayName()}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span data-testid="text-user-email">{user.email || "No email provided"}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                <p className="text-foreground" data-testid="text-first-name">
                  {user.firstName || "Not provided"}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                <p className="text-foreground" data-testid="text-last-name">
                  {user.lastName || "Not provided"}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Account Created
                </label>
                <p className="text-foreground" data-testid="text-created-at">
                  {formatDate(user.createdAt)}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Authentication
                </label>
                <Badge variant="secondary" data-testid="badge-auth-method">
                  Replit Auth
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Sign Out
            </CardTitle>
            <CardDescription>
              End your current session and return to the login page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
