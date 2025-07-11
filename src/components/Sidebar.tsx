import React, { useEffect, useState } from "react";
import RouteSelector from "./RouteSelector";
import SpeedRangeSelector from "./SpeedSelector";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "./ui/drawer";
import { Button, buttonVariants } from "./ui/button";
import { SettingsIcon, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreakpoints } from "@/lib/layout-hooks";
import {
  Sheet,
  SheetContent,
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
}

const Sidebar: React.FC<SidebarProps> = ({
  isMobile,
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
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [donationDrawerOpen, setDonationDrawerOpen] = useState(false);
  const [isDonationShown, setIsDonationShown] = useState(true);

  const { smallerThan, largerThan } = useBreakpoints();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsDonationShown(true);
    }, 12000);

    return () => clearTimeout(timeout);
  }, [setIsDonationShown]);

  const donationContent = (
    <div
      className={cn(
        "w-full bg-white pt-4 pb-2 flex-col-reverse md:flex-col items-center z-10 mt-auto  flex transition-opacity duration-500 gap-2",
        isDonationShown ? "md:opacity-100" : "opacity-0"
      )}
    >
      <a
        className={buttonVariants({
          className:
            "w-full max-w-xs flex items-center justify-center gap-2 text-base font-semibold py-3 bg-yellow-400 hover:bg-yellow-300 text-black shadow-md rounded-lg",
        })}
        href="https://donate.stripe.com/7sY7sMcYC2RcdZwdl26sw00"
        target="_blank"
        rel="noopener noreferrer"
      >
        <HandHeart className="mr-2" />
        Draag bij
      </a>
      <small className="text-sm text-gray-500">
        Heb je iets aan de app gehad, {isMobile && <br />} overweeg een kleine
        bijdrage
      </small>
    </div>
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
      {largerThan.xl && donationContent}
    </div>
  );

  const donationDrawer = (
    <Drawer open={donationDrawerOpen} onOpenChange={setDonationDrawerOpen}>
      <DrawerTrigger asChild>
        <button
          className={cn(
            "fixed top-28 md:top-16 right-4 z-40 bg-white rounded-full shadow p-2 flex items-center justify-center transition-opacity duration-500",
            isDonationShown ? "opacity-100" : "opacity-0"
          )}
          aria-label="Instellingen openen"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
        >
          <HandHeart className="size-6" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-w-full">
        <div className="flex flex-col h-full overflow-y-auto p-4">
          {donationContent}
        </div>
      </DrawerContent>
    </Drawer>
  );

  const settingsButton = (
    <button
      className="fixed top-16 md:top-4 right-4 z-40 bg-white rounded-full shadow p-2 flex items-center justify-center"
      aria-label="Instellingen openen"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
    >
      <SettingsIcon className="size-6" />
    </button>
  );

  if (smallerThan.md) {
    return (
      <>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>{settingsButton}</DrawerTrigger>
          <DrawerContent className="max-w-full">
            <div className="flex flex-col h-full overflow-y-auto">
              {sidebarContent}
            </div>
          </DrawerContent>
        </Drawer>
        {donationDrawer}
      </>
    );
  }

  if (smallerThan.xl) {
    return (
      <>
        {donationDrawer}
        <Sheet>
          <SheetTrigger>{settingsButton}</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Instellingen</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full overflow-y-auto">
              {sidebarContent}
            </div>
          </SheetContent>
        </Sheet>
      </>
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
