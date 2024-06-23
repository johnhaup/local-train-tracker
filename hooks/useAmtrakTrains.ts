import { useAppState } from "@react-native-community/hooks";
import { fetchAllTrains } from "amtrak";
import { Train } from "amtrak/dist/types";
import haversine from "haversine";
import isEqual from "lodash/isEqual";
import { useCallback, useEffect, useRef, useState } from "react";

const INTERVAL = 10000;

export function useAmtrakTrains(
  userCoords: { latitude: number; longitude: number } | null
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [trains, setTrains] = useState<Train[]>([]);
  const appState = useAppState();

  const sortTrains = useCallback(
    (trains: Train[]) => {
      if (!userCoords) {
        console.warn("No user coordinates provided. Skipping sorting.");
        return trains;
      }

      return trains.sort(
        ({ lat: latA, lon: lonA }, { lat: latB, lon: lonB }) => {
          const distA = haversine(
            [userCoords.latitude, userCoords.longitude],
            [latA, lonA],
            {
              unit: "mile",
              format: "[lat,lon]",
            }
          );

          const distB = haversine(
            [userCoords.latitude, userCoords.longitude],
            [latB, lonB],
            {
              unit: "mile",
              format: "[lat,lon]",
            }
          );

          return distA - distB;
        }
      );
    },
    [userCoords]
  );

  const fetchTrains = useCallback(async () => {
    try {
      const response = await fetchAllTrains();
      const allTrains = Object.values(response).flat();
      const sortedTrains = sortTrains(allTrains);

      if (!isEqual(sortedTrains, trains)) {
        setTrains(sortedTrains);
      }
    } catch (error) {
      console.error(error);
    }
  }, [userCoords]);

  const clearActiveInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (appState === "active") {
      fetchTrains();

      clearActiveInterval();

      intervalRef.current = setInterval(() => {
        fetchTrains();
      }, INTERVAL);
    } else {
      clearActiveInterval();
    }

    return () => {
      clearActiveInterval();
    };
  }, [fetchTrains, appState]);

  return trains;
}
