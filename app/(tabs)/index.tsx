import { fetchAllTrains } from "amtrak";
import { Train } from "amtrak/dist/types";
import {
  getCurrentPositionAsync,
  useForegroundPermissions,
} from "expo-location";
import haversine from "haversine";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Camera, Marker } from "react-native-maps";

const MILE_RADIUS = 100;
const METER_RADIUS = MILE_RADIUS * 1609.34;
const INTERVAL = 10000;

export default function App() {
  const _mapRef = useRef<MapView>(null);
  const _intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [response, request] = useForegroundPermissions();
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [trains, setTrains] = useState<Train[]>([]);

  console.log("trains", trains);

  useEffect(() => {
    if (userCoords && !_intervalRef.current) {
      const fetchTrains = async () => {
        const trains = await fetchAllTrains();
        const trainsWithinBounds = Object.values(trains)
          .flat()
          .filter(({ lat, lon }) => {
            return haversine(
              [userCoords.latitude, userCoords.longitude],
              [lat, lon],
              { unit: "mile", format: "[lat,lon]", threshold: MILE_RADIUS }
            );
          });

        setTrains(trainsWithinBounds);
      };

      fetchTrains();

      _intervalRef.current = setInterval(() => {
        fetchTrains();
      }, INTERVAL);
    }

    if (!userCoords && _intervalRef.current) {
      clearInterval(_intervalRef.current);
      _intervalRef.current = null;
    }

    return () => {
      if (_intervalRef.current) {
        clearInterval(_intervalRef.current);
        _intervalRef.current = null;
      }
    };
  }, [userCoords]);

  const zoomToCoordinate = useCallback(
    (center: Camera["center"], altitude = 2000) => {
      _mapRef.current?.animateCamera({
        center,
        altitude,
      });
    },
    []
  );

  const centerOnUser = useCallback(async () => {
    const location = await getCurrentPositionAsync();
    setUserCoords(location.coords);
    zoomToCoordinate(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      10000
    );
  }, []);

  const requestPermission = useCallback(async () => {
    const response = await request();
    if (response?.status === "granted") {
      centerOnUser();
    }
  }, []);

  useEffect(() => {
    if (!response || response?.status === "undetermined") {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    if (response?.status === "granted") {
      centerOnUser();
    }
  }, []);

  const trainMarkers = useMemo(
    () =>
      trains.map((train) => (
        <Marker
          identifier={train.trainID}
          key={train.trainID}
          coordinate={{ latitude: train.lat, longitude: train.lon }}
          title={`Train ${train.trainNum}`}
          onPress={() => {
            console.log("pressed", train.trainNum);
            zoomToCoordinate({ latitude: train.lat, longitude: train.lon });
          }}
        >
          <Text style={{ fontSize: 32 }}>🚂</Text>
        </Marker>
      )),
    [trains]
  );

  const fitToAllTrains = useCallback(() => {
    if (_mapRef.current) {
      console.log("fitting to all trains");
      _mapRef.current.fitToElements({ animated: true });
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={_mapRef}
        style={styles.map}
        cameraZoomRange={{
          animated: true,
        }}
        showsUserLocation={response?.status === "granted"}
        userInterfaceStyle="light"
      >
        {trainMarkers}
        {trainMarkers.length ? (
          <View style={{ position: "absolute", top: 0, left: 0 }}>
            <Text
              style={{
                padding: 10,
                backgroundColor: "rgba(0,0,0,0.5)",
                color: "white",
              }}
              onPress={fitToAllTrains}
            >
              {`Fit to All Trains (${trains.length})`}
            </Text>
          </View>
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
