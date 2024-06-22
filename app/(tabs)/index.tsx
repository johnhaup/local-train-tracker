import React, { useCallback, useEffect, useRef } from "react";
import MapView from "react-native-maps";
import { Platform, StyleSheet, View } from "react-native";
import {
  useForegroundPermissions,
  getCurrentPositionAsync,
} from "expo-location";

export default function App() {
  const _mapRef = useRef<MapView>(null);
  const [response, request] = useForegroundPermissions();

  const centerOnUser = useCallback(async () => {
    const location = await getCurrentPositionAsync();
    _mapRef.current?.animateCamera({
      center: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      zoom: 15,
    });
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

  return (
    <View style={styles.container}>
      <MapView
        ref={_mapRef}
        style={styles.map}
        cameraZoomRange={{
          minCenterCoordinateDistance: 10000,
          maxCenterCoordinateDistance: 100000,
          animated: true,
        }}
        showsUserLocation={response?.status === "granted"}
      />
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
