import React, { useState } from "react";
import RouteSelector from "./RouteSelector";
import SpeedRangeSelector from "./SpeedSelector";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Button } from "./ui/button";
import { SettingsIcon } from "lucide-react";
import { useBreakpoints } from "@/lib/layout-hooks";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./ui/sheet";

interface SidebarProps {
  isMobile: boolean;
  selectedDay: string;
  distancesByDay: Record<
    string,
    { key: string; label: string; color: string }[]
  >;
  selectedDistances: string[];
  onDistanceToggle: (distanceKey: string) => void;
  startTimes: Record<string, string>;
  onStartTimeChange: (distanceKey: string, newTime: string) => void;
  minSpeed: number;
  maxSpeed: number;
  setMinSpeed: (min: number) => void;
  setMaxSpeed: (max: number) => void;
  /** Controlled open state for the mobile drawer / tablet sheet. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Extra content rendered below the standard settings. */
  peoplePanel?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedDay,
  distancesByDay,
  selectedDistances,
  onDistanceToggle,
  startTimes,
  onStartTimeChange,
  minSpeed,
  maxSpeed,
  setMinSpeed,
  setMaxSpeed,
  open,
  onOpenChange,
  peoplePanel,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const drawerOpen = open ?? internalOpen;
  const setDrawerOpen = onOpenChange ?? setInternalOpen;

  const { smallerThan, largerThan } = useBreakpoints();

  const attribution = (
    <a
      className="mt-auto pt-6 text-center text-sm text-gray-500 underline-offset-4 transition-colors hover:text-gray-900 hover:underline"
      href="https://24letters.com"
      target="_blank"
      rel="noopener noreferrer"
    >
      Made with love by Anton
    </a>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto p-4 bg-white shadow-lg w-full relative">
      <h1 className="text-2xl font-bold mb-4 hidden xl:block">
        4Daagse doorkomsttijden
      </h1>
      <RouteSelector
        distancesByDay={distancesByDay}
        selectedDay={selectedDay}
        selectedDistances={selectedDistances}
        onDistanceToggle={onDistanceToggle}
        startTimes={startTimes}
        onStartTimeChange={onStartTimeChange}
      />
      <SpeedRangeSelector
        minSpeed={minSpeed}
        maxSpeed={maxSpeed}
        onChange={(min, max) => {
          setMinSpeed(min);
          setMaxSpeed(max);
        }}
      />
      {peoplePanel}
      {smallerThan.md && (
        <>
          <DrawerClose asChild>
            <Button className="mt-4">Sluiten</Button>
          </DrawerClose>
        </>
      )}
      {largerThan.md && smallerThan.xl && (
        <>
          <SheetClose asChild>
            <Button className="mt-8">Sluiten</Button>
          </SheetClose>
        </>
      )}
      {attribution}
    </div>
  );

  const settingsButton = (
    <button
      type="button"
      className="fixed top-24 md:top-4 right-4 z-40 bg-white rounded-full shadow p-2 flex items-center justify-center"
      aria-label="Instellingen openen"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
    >
      <SettingsIcon className="size-6" />
    </button>
  );

  if (smallerThan.md) {
    return (
      <>
        <Drawer autoFocus open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>{settingsButton}</DrawerTrigger>
          <DrawerContent className="max-w-full">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Instellingen</DrawerTitle>
              <DrawerDescription>
                Pas de zichtbare routes, starttijden en wandelsnelheid aan.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col h-full overflow-y-auto">
              {sidebarContent}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  if (smallerThan.xl) {
    return (
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>{settingsButton}</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Instellingen</SheetTitle>
            <SheetDescription className="sr-only">
              Pas de zichtbare routes, starttijden en wandelsnelheid aan.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col h-full overflow-y-auto">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <div className="fixed left-0 top-0 bottom-0 z-20 w-full md:w-[400px] max-w-md bg-white shadow-lg flex flex-col">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;
