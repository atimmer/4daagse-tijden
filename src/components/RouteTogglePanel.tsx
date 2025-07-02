import React from "react";

export interface RouteTogglePanelProps {
  routes: { name: string; visible: boolean }[];
  onToggle: (routeName: string) => void;
}

const RouteTogglePanel: React.FC<RouteTogglePanelProps> = ({
  routes,
  onToggle,
}) => {
  return (
    <div className="flex gap-4 mb-4">
      {routes.map((route) => (
        <label
          key={route.name}
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={route.visible}
            onChange={() => onToggle(route.name)}
            className="accent-blue-600"
          />
          <span>{route.name}</span>
        </label>
      ))}
    </div>
  );
};

export default RouteTogglePanel;
