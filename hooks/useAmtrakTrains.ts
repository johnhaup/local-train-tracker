import { useAppState } from "@react-native-community/hooks";
import { fetchAllTrains } from "amtrak";
import { Train, TrainResponse } from "amtrak/dist/types";
import haversine from "haversine";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INTERVAL = 10000;

export function useAmtrakTrains(
  userCoords: { latitude: number; longitude: number } | null
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [response, setResponse] = useState<TrainResponse | null>(null);
  const appState = useAppState();

  const fetchTrains = useCallback(async () => {
    try {
      const freshResponse = await fetchAllTrains();
      setResponse(freshResponse);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const trains = useMemo(() => {
    if (!response) {
      return [];
    }

    const allTrains = Object.values(response).flat();

    const sortTrains = (trains: Train[]) => {
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
    };

    const sortedTrains = sortTrains(allTrains);

    return sortedTrains;
  }, [response, userCoords]);

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
