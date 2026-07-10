import React from "react";
import { UsersRoundIcon, XIcon } from "lucide-react";
import { useBreakpoints } from "@/lib/layout-hooks";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

interface PeopleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walkerCount: number;
  children: React.ReactNode;
}

const PeopleSheet: React.FC<PeopleSheetProps> = ({
  open,
  onOpenChange,
  walkerCount,
  children,
}) => {
  const { smallerThan } = useBreakpoints();

  const trigger = (
    <button
      type="button"
      className="fixed top-24 right-[4.5rem] md:top-4 md:right-[4.5rem] z-40 flex h-10 items-center gap-1.5 rounded-full bg-white px-3 shadow"
      aria-label="Lopers volgen openen"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
    >
      <UsersRoundIcon className="size-5" />
      {walkerCount > 0 ? <span>{walkerCount}</span> : null}
    </button>
  );

  if (smallerThan.md) {
    return (
      <Drawer autoFocus open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Lopers volgen</DrawerTitle>
            <DrawerDescription>
              Voeg lopers toe, bekijk hun positie en meld doorkomsten.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex items-center justify-between px-4 pb-3 pt-4">
            <h2 className="font-semibold">Lopers volgen</h2>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" aria-label="Sluiten">
                <XIcon className="size-4" />
              </Button>
            </DrawerClose>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="gap-0">
        <SheetHeader>
          <SheetTitle>Lopers volgen</SheetTitle>
          <SheetDescription className="sr-only">
            Voeg lopers toe, bekijk hun positie en meld doorkomsten.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PeopleSheet;
