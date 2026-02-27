"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronRight, LayoutDashboard, Users, UserCog, Package, Truck, MapPin, Radio, BarChart3, Settings } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/Sidebar";

type NavItem = { href: string; label: string; icon: React.ElementType };

type NavGroup = {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "ventas",
    label: "Ventas y operaciones",
    icon: Package,
    items: [
      { href: "/customers", label: "Clientes", icon: Users },
      { href: "/vendors", label: "Vendedores", icon: UserCog },
      { href: "/pedidos", label: "Pedidos", icon: Package },
      { href: "/entregas", label: "Entregas", icon: Truck },
    ],
  },
  {
    id: "logistica",
    label: "Logística",
    icon: MapPin,
    items: [
      { href: "/mapa-asignacion", label: "Mapa asignación", icon: MapPin },
      { href: "/ubicacion-equipo", label: "Ubicación equipo", icon: Radio },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    icon: Settings,
    items: [
      { href: "/users", label: "Usuarios", icon: UserCog },
      { href: "/settings", label: "Configuración", icon: Settings },
    ],
  },
];

interface AppSidebarProps {
  userName: string;
  companyName: string;
}

function isItemActive(href: string, pathname: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

function isGroupActive(group: NavGroup, pathname: string) {
  return group.items.some((item) => isItemActive(item.href, pathname));
}

export function AppSidebar({ userName, companyName }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex flex-col gap-1 p-2">
          <p className="text-lg font-semibold text-sidebar-foreground truncate">DistriApp</p>
          <p className="text-xs text-sidebar-foreground/70 truncate">{companyName}</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Panel">
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  <span>Panel</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {NAV_GROUPS.map((group) => {
          const defaultOpen = isGroupActive(group, pathname);
          const GroupIcon = group.icon;

          return (
            <Collapsible key={group.id} asChild defaultOpen={defaultOpen} className="group/collapsible">
              <SidebarGroup>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={group.label}>
                      <GroupIcon className="size-4" />
                      <span>{group.label}</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const active = isItemActive(item.href, pathname);
                        return (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton asChild isActive={active}>
                              <Link href={item.href}>
                                <ItemIcon className="size-4" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </SidebarGroup>
            </Collapsible>
          );
        })}

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/rendimiento" || pathname.startsWith("/rendimiento")} tooltip="Rendimiento">
                <Link href="/rendimiento">
                  <BarChart3 className="size-4" />
                  <span>Rendimiento</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-2">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-1 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
