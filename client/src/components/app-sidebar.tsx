import { LayoutDashboard, Workflow, BarChart3, Upload, Filter, Settings, Mail, Grid } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import driftSignalLogo from "@assets/Gemini_Generated_Image_20rbpd20rbpd20rb_1763885742664.png";
import { ImportReviewsModal } from "@/components/ImportReviewsModal";
import { AdvancedFiltersModal } from "@/components/AdvancedFiltersModal";

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
