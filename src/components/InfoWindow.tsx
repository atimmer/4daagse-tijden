import React from "react";
import RoutePopup from "./RoutePopup";
import { Drawer, DrawerContent, DrawerClose } from "./ui/drawer";
import { Button } from "./ui/button";
import { useBreakpoints } from "@/lib/layout-hooks";
import { ChevronDownIcon } from "lucide-react";

interface RoutePopupInfo {
  routeName: string;
  color: string;
  distanceKm: number;
  timeRange: { earliest: string; latest: string };
  latlng: [number, number];
  direction?: string;
}

interface InfoWindowProps {
  popupInfo: RoutePopupInfo[] | null | undefined;
  isMobile: boolean;
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
}

const InfoWindow: React.FC<InfoWindowProps> = ({
  popupInfo,
  isMobile,
  drawerOpen,
  setDrawerOpen,
}) => {
  const { smallerThan } = useBreakpoints();

  // Advertising drawer content
  const infoText = (
    <div className="p-3 text-sm text-gray-700">
      <b>Verwachte doorkomst</b>
      <div className="mt-1">
        Selecteer een punt op de routekaart om de verwachte doorkomsttijden te
        zien. Beweeg met de muis over de route (desktop) of tik op de route
        (mobiel).
      </div>
    </div>
  );

  // Summary for advertising drawer when a point is selected
  let summary = infoText;
  if (popupInfo && popupInfo.length > 0) {
    // Group by direction
    const heen = popupInfo.filter((r) => r.direction === "Heenreis");
    const terug = popupInfo.filter((r) => r.direction === "Terugreis");
    const overige = popupInfo.filter((r) => !r.direction);

    // Helper to get min/max time for a group
    const getTimeRange = (group: RoutePopupInfo[]) => {
      if (group.length === 0) return null;
      const times = group
        .map((r) => [r.timeRange.earliest, r.timeRange.latest])
        .flat();
      const sorted = times.slice().sort();
      return { min: sorted[0], max: sorted[sorted.length - 1] };
    };
    const heenTime = getTimeRange(heen);
    const terugTime = getTimeRange(terug);
    const overigeTime = getTimeRange(overige);

    summary = (
      <div className="p-3 text-sm text-gray-700">
        {heenTime && (
          <div>
            <b>Doorkomst Heen</b>: {heenTime.min} – {heenTime.max}
          </div>
        )}
        {terugTime && (
          <div>
            <b>Doorkomst Terug</b>: {terugTime.min} – {terugTime.max}
          </div>
        )}
        {/* If neither heen nor terug, show overige as fallback */}
        {!heenTime && !terugTime && overigeTime && (
          <div>
            <b>Doorkomst</b>: {overigeTime.min} – {overigeTime.max}
          </div>
        )}
        <button className="text-blue-600 w-full leading-8 font-bold mt-4 flex justify-center items-center gap-1">
          Bekijk per afstand
          <ChevronDownIcon
            className={`transition-transform duration-300 ${
              drawerOpen ? "rotate-180" : "rotate-0"
            } ml-1 size-4`}
            aria-hidden="true"
          />
        </button>
      </div>
    );
  }

  if (isMobile && drawerOpen !== undefined && setDrawerOpen) {
    // AdvertisingDrawer is always visible at the bottom
    return (
      <>
        {/* Advertising Drawer (always visible, acts as trigger) */}
        <button
          className="fixed left-1/2 -translate-x-1/2 bottom-4 z-40 bg-white shadow-lg rounded-lg border border-gray-200 px-4 py-2 font-medium text-sm w-[95vw] max-w-sm"
          aria-label="Toon doorkomst info"
          style={{ userSelect: "none" }}
          onClick={() => {
            if (popupInfo && popupInfo.length > 0) setDrawerOpen(true);
          }}
        >
          {summary}
        </button>
        {/* Main Drawer (opened by tapping the advertising drawer or map) */}
        <Drawer
          direction="bottom"
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        >
          <DrawerContent className="max-w-sm mx-auto w-full z-50">
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="font-semibold mb-4 sr-only">Doorkomst info</div>
              {popupInfo && popupInfo.length > 0 ? (
                <>
                  <RoutePopup routes={popupInfo} />

                  {smallerThan.xl && (
                    <p className="mt-4 text-sm">
                      De gemiddelde snelheid en starttijden kan je aanpassen in
                      de instellingen.
                    </p>
                  )}
                </>
              ) : (
                infoText
              )}
              <DrawerClose asChild>
                <Button className="mt-4">Sluiten</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: fixed window
  const baseClass =
    "fixed z-50 bg-white shadow-lg rounded-lg border border-gray-200 bottom-8 xl:bottom-auto xl:top-4 right-4 max-w-xs w-full min-w-[220px]";

  return (
    <div className={baseClass} style={{ userSelect: "none" }}>
      {popupInfo && popupInfo.length > 0 ? (
        <div className="p-2">
          <div className="font-semibold mb-2">Doorkomst</div>
          <RoutePopup routes={popupInfo} />
          {smallerThan.xl && (
            <p className="mt-4 text-sm">
              De gemiddelde snelheid en starttijden kan je aanpassen met het
              tandwiel icoon.
            </p>
          )}
        </div>
      ) : (
        infoText
      )}
    </div>
  );
};

export default InfoWindow;
