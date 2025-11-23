import { LayoutDashboard, Workflow, BarChart3, Upload, Filter } from "lucide-react";
import { SiAmazon, SiEbay, SiShopify, SiPaypal, SiAlibabadotcom } from "react-icons/si";
import { Globe } from "lucide-react";
import { Link, useLocation } from "wouter";
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

const mainMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-dashboard" },
  { title: "Workflow Management", url: "/workflow", icon: Workflow, testId: "link-workflow" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, testId: "link-analytics" },
];

const marketplaces = [
  { title: "Amazon", icon: SiAmazon, color: "#FF9900" },
  { title: "eBay", icon: SiEbay, color: "#E53238" },
  { title: "Shopify", icon: SiShopify, color: "#7AB55C" },
  { title: "PayPal", icon: SiPaypal, color: "#00457C" },
  { title: "Alibaba", icon: SiAlibabadotcom, color: "#FF6A00" },
  { title: "Website", icon: Globe, color: "#6B7280" },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img 
            src="/attached_assets/image_1763885624491.png" 
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
                  <SidebarMenuButton asChild isActive={location === item.url}>
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
              {marketplaces.map((marketplace) => (
                <SidebarMenuItem key={marketplace.title}>
                  <SidebarMenuButton className="hover-elevate active-elevate-2">
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
                <SidebarMenuButton data-testid="button-import">
                  <Upload className="h-4 w-4" />
                  <span>Import Reviews</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton data-testid="button-filters">
                  <Filter className="h-4 w-4" />
                  <span>Advanced Filters</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
