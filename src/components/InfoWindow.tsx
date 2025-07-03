import React from "react";
import RoutePopup from "./RoutePopup";
import { Drawer, DrawerContent, DrawerClose } from "./ui/drawer";

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
  // Advertising drawer content
  const infoText = (
    <div className="p-3 text-sm text-gray-700">
      <b>Doorkomst info</b>
      <div className="mt-1">
        Selecteer een punt op de routekaart om de verwachte doorkomsttijden te
        zien. Beweeg met de muis over de route (desktop) of tik op de route
        (mobiel).
      </div>
    </div>
  );

  // Summary for advertising drawer when a point is selected
  const summary =
    popupInfo && popupInfo.length > 0 ? (
      <div className="p-3 text-sm text-gray-700">
        <b>Doorkomst info</b>
        <div className="mt-1">
          {popupInfo.map((r, i) => (
            <div key={i} className="mb-1 last:mb-0">
              <span className="font-semibold" style={{ color: r.color }}>
                {r.routeName}
              </span>
              : {r.timeRange.earliest} – {r.timeRange.latest}
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">Tik voor meer info</div>
      </div>
    ) : (
      infoText
    );

  if (isMobile && drawerOpen !== undefined && setDrawerOpen) {
    // AdvertisingDrawer is always visible at the bottom
    return (
      <>
        {/* Advertising Drawer (always visible, acts as trigger) */}
        <button
          className="fixed left-1/2 -translate-x-1/2 bottom-4 z-40 bg-white shadow-lg rounded-lg border border-gray-200 px-4 py-2 font-medium text-sm w-[95vw] max-w-sm"
          aria-label="Toon doorkomst info"
          style={{ userSelect: "none" }}
          onClick={() => setDrawerOpen(true)}
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
            <div className="p-2">
              <div className="font-semibold mb-2">Doorkomst info</div>
              {popupInfo && popupInfo.length > 0 ? (
                <RoutePopup routes={popupInfo} />
              ) : (
                infoText
              )}
              <DrawerClose asChild>
                <button className="mt-4 w-full bg-gray-100 rounded p-2 text-sm text-gray-700">
                  Sluiten
                </button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: fixed window
  const baseClass =
    "fixed z-50 bg-white shadow-lg rounded-lg border border-gray-200 top-4 right-4 max-w-xs w-full min-w-[220px]";

  return (
    <div
      className={baseClass}
      aria-label="Doorkomst info"
      style={{ userSelect: "none" }}
    >
      {popupInfo && popupInfo.length > 0 ? (
        <div className="p-2">
          <div className="font-semibold mb-2">Doorkomst info</div>
          <RoutePopup routes={popupInfo} />
        </div>
      ) : (
        infoText
      )}
    </div>
  );
};

export default InfoWindow;
