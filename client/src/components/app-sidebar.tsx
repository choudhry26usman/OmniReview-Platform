import { LayoutDashboard, Workflow, BarChart3, Upload, Filter, Settings, Mail, Grid, LogOut, User } from "lucide-react";
import { SiAmazon, SiShopify, SiWalmart } from "react-icons/si";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import driftSignalLogo from "@assets/Gemini_Generated_Image_20rbpd20rbpd20rb_1763885742664.png";
import { ImportReviewsModal } from "@/components/ImportReviewsModal";
import { AdvancedFiltersModal } from "@/components/AdvancedFiltersModal";
import { useAuth } from "@/hooks/useAuth";

const mainMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-dashboard" },
  { title: "Workflow Management", url: "/workflow", icon: Workflow, testId: "link-workflow" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, testId: "link-analytics" },
  { title: "Settings", url: "/settings", icon: Settings, testId: "link-settings" },
];

const marketplaces = [
  { title: "Amazon", icon: SiAmazon, color: "#FF9900" },
  { title: "Shopify", icon: SiShopify, color: "#7AB55C" },
  { title: "Walmart", icon: SiWalmart, color: "#0071CE" },
  { title: "Mailbox", icon: Mail, color: "#0078D4" },
];

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
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
  
  const activeMarketplace = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('marketplace');
  }, [location]);

  const handleMarketplaceClick = (marketplace: string) => {
    const currentParams = new URLSearchParams(window.location.search);
    const currentMarketplace = currentParams.get('marketplace');
    
    const newParams = new URLSearchParams(window.location.search);
    
    if (currentMarketplace === marketplace) {
      newParams.delete('marketplace');
    } else {
      newParams.set('marketplace', marketplace);
    }
    
    const newSearch = newParams.toString();
    navigate(newSearch ? `/?${newSearch}` : '/');
  };

  const handleClearFilter = () => {
    const newParams = new URLSearchParams(window.location.search);
    newParams.delete('marketplace');
    const newSearch = newParams.toString();
    navigate(newSearch ? `/?${newSearch}` : '/');
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <img 
              src={driftSignalLogo} 
              alt="DriftSignal Logo" 
              className="h-10 w-10"
            />
            <div>
              <h1 className="font-semibold text-lg">DriftSignal</h1>
              <p className="text-xs text-muted-foreground">Review Manager</p>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url && !activeMarketplace}>
                      <Link href={item.url} data-testid={item.testId}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator className="my-2" />

          <SidebarGroup>
            <SidebarGroupLabel>Marketplaces</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    className="hover-elevate active-elevate-2"
                    onClick={handleClearFilter}
                    isActive={!activeMarketplace}
                    data-testid="link-marketplace-all"
                  >
                    <Grid className="h-4 w-4" />
                    <span>All Marketplaces</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {marketplaces.map((marketplace) => (
                  <SidebarMenuItem key={marketplace.title}>
                    <SidebarMenuButton 
                      className="hover-elevate active-elevate-2"
                      onClick={() => handleMarketplaceClick(marketplace.title)}
                      isActive={activeMarketplace === marketplace.title}
                      data-testid={`link-marketplace-${marketplace.title.toLowerCase()}`}
                    >
                      <marketplace.icon className="h-4 w-4" style={{ color: marketplace.color }} />
                      <span>{marketplace.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator className="my-2" />

          <SidebarGroup>
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    data-testid="button-import"
                    onClick={() => setImportModalOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Import Reviews</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    data-testid="button-filters"
                    onClick={() => setFiltersModalOpen(true)}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Advanced Filters</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {user && (
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 px-2 hover-elevate"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={getDisplayName()} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left overflow-hidden">
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {getDisplayName()}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {user.email}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2 cursor-pointer" data-testid="link-account">
                    <User className="h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        )}
      </Sidebar>
      
      <ImportReviewsModal 
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />
      
      <AdvancedFiltersModal 
        open={filtersModalOpen}
        onOpenChange={setFiltersModalOpen}
      />
    </>
  );
}
