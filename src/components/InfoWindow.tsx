import React from "react";
import RoutePopup from "./RoutePopup";
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose } from "./ui/drawer";

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
}

const InfoWindow: React.FC<InfoWindowProps> = ({ popupInfo, isMobile }) => {
  // Informational text when nothing is selected
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

  if (isMobile) {
    return (
      <Drawer direction="bottom">
        <DrawerTrigger asChild>
          <button
            className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 bg-white shadow-lg rounded-lg border border-gray-200 px-4 py-2 font-medium text-sm"
            aria-label="Toon doorkomst info"
            style={{ userSelect: "none" }}
          >
            Doorkomst info
          </button>
        </DrawerTrigger>
        <DrawerContent className="max-w-sm mx-auto w-full">
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
