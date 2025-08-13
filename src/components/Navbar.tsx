'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Layers, Plus } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { components, cn } from '@/styles/design-system';
import { Badge, Button, ThemeToggleSlider } from '@/components/ui';

export default function Navbar() {
  const pathname = usePathname();
  const { apiKey } = useSettings();

  const navigation = [
    { name: 'Workloads', href: '/workloads', icon: Layers },
    { name: 'Create', href: '/workloads/create', icon: Plus },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className={components.nav.base}>
      <div className={components.container}>
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-foreground">
                nilCC Workload Manager
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      components.nav.link,
                      isActive ? components.nav.linkActive : components.nav.linkInactive
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggleSlider />
            <div className="flex-shrink-0">
              {apiKey ? (
                <Badge variant="success">API Key Set</Badge>
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