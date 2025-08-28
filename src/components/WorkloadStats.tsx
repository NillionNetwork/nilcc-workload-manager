'use client';

import React, { useState } from 'react';
import { Card, CardContent } from './ui';
import { Cpu, HardDrive, MemoryStick } from 'lucide-react';

interface SystemStats {
  memory: {
    total: number;
    used: number;
  };
  cpus: Array<{
    name: string;
    usage: number;
    frequency: number;
  }>;
  disks: Array<{
    name: string;
    mountPoint: string;
    filesystem: string;
    size: number;
    used: number;
  }>;
}

interface WorkloadStatsProps {
  stats: SystemStats | null;
  loading?: boolean;
  error?: string | null;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

export default function WorkloadStats({
  stats,
  loading,
  error,
}: WorkloadStatsProps) {
  const [hoveredDisk, setHoveredDisk] = useState<number | null>(null);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading system stats...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Failed to load system stats: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No system stats available
          </div>
        </CardContent>
      </Card>
    );
  }

  const memoryUsagePercentage =
    stats.memory.total > 0 ? (stats.memory.used / stats.memory.total) * 100 : 0;

  const averageCpuUsage =
    stats.cpus.length > 0
      ? stats.cpus.reduce((acc, cpu) => acc + cpu.usage, 0) / stats.cpus.length
      : 0;

  return (
    <Card>
      <CardContent>
        <h4 className="text-lg font-semibold text-card-foreground mb-4">
          System Resources
        </h4>

        {/* Memory Usage */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <MemoryStick className="h-4 w-4 mr-2" />
              <span className="font-medium">Memory</span>
            </div>
            <span className="text-sm text-foreground font-mono">
              {formatBytes(stats.memory.used)} /{' '}
              {formatBytes(stats.memory.total)}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${Math.min(memoryUsagePercentage, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {formatPercentage(memoryUsagePercentage)} used
          </div>
        </div>

        {/* CPU Usage */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Cpu className="h-4 w-4 mr-2" />
              <span className="font-medium">CPU</span>
            </div>
            <span className="text-sm text-foreground font-mono">
              {stats.cpus.length} core{stats.cpus.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {stats.cpus.map((cpu, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-mono">
                    Core {index}: {cpu.frequency} MHz
                  </span>
                  <span className="text-foreground font-mono">
                    {formatPercentage(cpu.usage)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div
                    className="bg-primary rounded-full h-1.5 transition-all duration-300"
                    style={{ width: `${Math.min(cpu.usage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {stats.cpus.length > 1 && (
            <div className="mt-2 text-xs text-muted-foreground text-right">
              Average: {formatPercentage(averageCpuUsage)}
            </div>
          )}
        </div>

        {/* Disk Usage */}
        {stats.disks.length > 0 && (
          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <HardDrive className="h-4 w-4 mr-2" />
              <span className="font-medium">Storage</span>
            </div>
            <div className="space-y-3">
              {(() => {
                // Group disks by size and usage to identify duplicates
                const uniqueDisks = new Map();
                const dockerOverlays: typeof stats.disks = [];

                stats.disks.forEach((disk) => {
                  const key = `${disk.size}-${disk.used}-${disk.filesystem}`;

                  // Collect Docker overlay filesystems separately
                  if (
                    disk.filesystem === 'overlay' &&
                    disk.mountPoint.includes('/docker/overlay')
                  ) {
                    dockerOverlays.push(disk);
                  } else {
                    // For non-Docker disks, keep first occurrence of each unique size/usage combo
                    if (
                      !uniqueDisks.has(key) ||
                      disk.mountPoint.length <
                        uniqueDisks.get(key).mountPoint.length
                    ) {
                      uniqueDisks.set(key, disk);
                    }
                  }
                });

                // Convert back to array and sort by mount point
                const disksToShow = Array.from(uniqueDisks.values()).sort(
                  (a, b) => a.mountPoint.localeCompare(b.mountPoint)
                );

                // If we have Docker overlays, add a summary entry
                if (dockerOverlays.length > 0) {
                  const dockerDisk = dockerOverlays[0]; // They're all the same

                  disksToShow.push({
                    ...dockerDisk,
                    mountPoint: `/docker/overlay (${dockerOverlays.length})`,
                    isDockerSummary: true,
                    containerPaths: dockerOverlays.map((d) => d.mountPoint),
                  });
                }

                return disksToShow.map((disk, index) => {
                  const diskUsagePercentage =
                    disk.size > 0 ? (disk.used / disk.size) * 100 : 0;

                  // Format display name based on type
                  const displayMountPoint = disk.isDockerSummary
                    ? disk.mountPoint
                    : disk.mountPoint.length > 20
                    ? '...' + disk.mountPoint.slice(-10)
                    : disk.mountPoint;

                  return (
                    <div key={index} className="space-y-1 relative">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 relative group">
                          <div className="text-xs text-muted-foreground opacity-75">
                            {disk.filesystem}
                          </div>
                          <div
                            className={`text-xs text-muted-foreground font-mono truncate ${
                              disk.isDockerSummary &&
                              disk.containerPaths.length > 1
                                ? 'cursor-help'
                                : ''
                            }`}
                            onMouseEnter={() => {
                              if (
                                disk.isDockerSummary &&
                                disk.containerPaths.length > 1
                              ) {
                                setHoveredDisk(index);
                              }
                            }}
                          >
                            {displayMountPoint}
                          </div>

                          {/* Only show tooltip for Docker summaries with multiple containers */}
                          {disk.isDockerSummary &&
                            disk.containerPaths.length > 1 && (
                              <div
                                className={`absolute bottom-full left-0 mb-1 z-10 transition-opacity duration-200 ${
                                  hoveredDisk === index
                                    ? 'opacity-100 pointer-events-auto'
                                    : 'opacity-0 pointer-events-none'
                                }`}
                                onMouseEnter={() => setHoveredDisk(index)}
                                onMouseLeave={() => setHoveredDisk(null)}
                              >
                                <div className="bg-popover border border-border rounded-md shadow-lg p-3 max-w-md">
                                  <div className="space-y-2">
                                    <div className="text-xs font-medium text-foreground mb-2">
                                      Containers:
                                    </div>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                      {disk.containerPaths.map((path: string, idx: number) => (
                                        <div
                                          key={idx}
                                          className="text-xs text-muted-foreground font-mono break-all border-b mb-1 pb-1"
                                        >
                                          <span>{path}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                        <span className="text-xs text-foreground font-mono whitespace-nowrap ml-2">
                          {formatBytes(disk.used)} / {formatBytes(disk.size)}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary rounded-full h-1.5 transition-all duration-300"
                          style={{
                            width: `${Math.min(diskUsagePercentage, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {formatPercentage(diskUsagePercentage)} used
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
