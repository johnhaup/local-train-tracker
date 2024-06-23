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
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Camera, Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";

const INTERVAL = 1000;

export default function App() {
  const _mapRef = useRef<MapView>(null);
  const _intervalRef = useRef<NodeJS.Timeout | null>(null);
  const _prevTrainsLength = useRef(0);
  const [response, request] = useForegroundPermissions();
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [trains, setTrains] = useState<Train[]>([]);
  ``;
  useEffect(() => {
    if (userCoords && !_intervalRef.current) {
      const fetchTrains = async () => {
        const trains = await fetchAllTrains();
        const sortedTrains = Object.values(trains)
          .flat()
          .sort(({ lat: latA, lon: lonA }, { lat: latB, lon: lonB }) => {
            return (
              haversine(
                [userCoords.latitude, userCoords.longitude],
                [latA, lonA],
                { unit: "mile", format: "[lat,lon]" }
              ) -
              haversine(
                [userCoords.latitude, userCoords.longitude],
                [latB, lonB],
                { unit: "mile", format: "[lat,lon]" }
              )
            );
          });

        setTrains(sortedTrains);
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
    if (!trains.length) {
      zoomToCoordinate(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        10000
      );
    } else if (trains.length) {
      _mapRef.current?.fitToSuppliedMarkers(
        trains.slice(0, 5).map((train) => train.trainID),
        {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        }
      );
    }
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

  const { top, bottom } = useSafeAreaInsets();

  useEffect(() => {
    if (!_prevTrainsLength.current && trains.length) {
      _prevTrainsLength.current = trains.length;
      fitToAllTrains();
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
          description={`Heading ${train.heading} to ${train.destName}`}
          onSelect={() => {
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
      _mapRef.current.fitToElements({ animated: true });
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={_mapRef}
        style={[styles.map, { paddingTop: top, paddingBottom: bottom }]}
        cameraZoomRange={{
          animated: true,
        }}
        showsUserLocation={response?.status === "granted"}
        userInterfaceStyle="light"
        onMapReady={fitToAllTrains}
      >
        {trainMarkers}
      </MapView>
      <View style={{ position: "absolute", top: top + 8, left: 8 }}>
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 8,
            flexDirection: "row",
          }}
        >
          {trainMarkers.length ? (
            <TouchableOpacity
              onPress={fitToAllTrains}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: "white",
                }}
              >
                {`🚂 (${trains.length})`}
              </Text>
            </TouchableOpacity>
          ) : null}
          <View style={{ width: 1, backgroundColor: "white" }} />
          <TouchableOpacity
            onPress={centerOnUser}
            style={{ paddingHorizontal: 16, paddingVertical: 12 }}
            activeOpacity={0.8}
          >
            <View style={{ height: 2 }} />
            <FontAwesome5 name="location-arrow" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
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
