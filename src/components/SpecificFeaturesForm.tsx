import React from "react";
import { PisoFeatures } from "./specific-features/PisoFeatures";
import { ChaletFeatures } from "./specific-features/ChaletFeatures";
import { LocalFeatures, OficinaFeatures } from "./specific-features/CommercialFeatures";
import { TerrenoFeatures, NaveFeatures } from "./specific-features/IndustrialLandFeatures";

export const SpecificFeaturesForm: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case "piso":
      return <PisoFeatures />;
    case "chalet":
      return <ChaletFeatures />;
    case "local":
      return <LocalFeatures />;
    case "oficina":
      return <OficinaFeatures />;
    case "terreno":
      return <TerrenoFeatures />;
    case "nave":
      return <NaveFeatures />;
    default:
      return <p className="text-muted-foreground text-sm">Selecciona un tipo de inmueble para ver sus campos específicos.</p>;
  }
};
