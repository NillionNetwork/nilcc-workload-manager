import { ReactNode, useState, ReactElement } from 'react';

interface TabsProps {
  defaultTab?: number;
  className?: string;
  children: ReactNode;
}

interface TabProps {
  label: ReactNode;
  children: ReactNode;
}

export function Tabs({ defaultTab = 0, className = '', children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Extract Tab children
  const tabs = Array.isArray(children) ? children : [children];
  const validTabs = tabs.filter(
    (child) =>
      child &&
      typeof child === 'object' &&
      'type' in child &&
      child.type === Tab
  ) as ReactElement<TabProps>[];

  return (
    <div>
      {/* Tab Navigation */}
      <div
        className={`flex space-x-1 border-b border-border mb-4 ${className}`}
      >
        {validTabs.map((tab, index) => (
          <button
            key={index}
            className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors flex items-center ${
              activeTab === index
                ? 'nillion-bg-primary text-primary-foreground'
                : 'nillion-bg-secondary nillion-text-secondary'
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {validTabs.map((tab, index) =>
          activeTab === index ? (
            <div key={index}>{tab.props.children}</div>
          ) : null
        )}
      </div>
    </div>
  );
}

export function Tab(_props: TabProps) {
  // This is just a placeholder component for type checking
  // The actual rendering is handled by the Tabs component
  return null;
}
