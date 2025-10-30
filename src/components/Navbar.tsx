"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Layers, Plus, CheckCircle } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { Badge, Button, ThemeToggleSlider } from "@/components/ui";

export default function Navbar() {
  const pathname = usePathname();
  const { apiKey, apiBaseUrl } = useSettings();

  const getApiKeyBadgeText = () => {
    if (
      apiBaseUrl === "https://nilcc-api.sandbox.app-cluster.sandbox.nilogy.xyz"
    ) {
      return "Connected to Sandbox";
    } else if (apiBaseUrl === "https://api.nilcc.nillion.network") {
      return "API Key Set";
    } else {
      return "Custom API Key Set";
    }
  };

  const navigation = [
    { name: "Workloads", href: "/workloads", icon: Layers },
    { name: "Create", href: "/workloads/create", icon: Plus },
    { name: "Verify", href: "/verify", icon: CheckCircle },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--nillion-border)",
        backgroundColor: "var(--nillion-bg-secondary)",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            height: "4rem",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{ flexShrink: 0, display: "flex", alignItems: "center" }}
            >
              <Link
                href="/"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  textDecoration: "none",
                  fontFamily: "var(--nillion-font-heading)",
                }}
              >
                nilCC Workload Manager
              </Link>
            </div>
            <div
              style={{
                display: "flex",
                marginLeft: "2rem",
                gap: "1.5rem",
                height: "100%",
              }}
            >
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: "100%",
                      textDecoration: "none",
                      color: isActive
                        ? "var(--nillion-primary)"
                        : "var(--nillion-text-secondary)",
                      fontWeight: "500",
                      padding: "0 0.5rem",
                      transition: "all 200ms ease",
                    }}
                  >
                    <item.icon
                      style={{
                        height: "1rem",
                        width: "1rem",
                        marginRight: "0.5rem",
                      }}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <ThemeToggleSlider />
            <div style={{ flexShrink: 0 }}>
              {apiKey ? (
                <Badge variant="success">{getApiKeyBadgeText()}</Badge>
              ) : (
                <Link href="/settings">
                  <Button size="sm">Set API Key</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
