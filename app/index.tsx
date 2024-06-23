import { useAmtrakTrains, useUserCoordinates } from "@/hooks";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Camera } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrainMarker } from "../components";
import { MapButtons } from "../components/MapButtons";

export default function App() {
  const _mapRef = useRef<MapView>(null);
  const _prevTrainsLength = useRef(0);
  const { top, bottom } = useSafeAreaInsets();

  const userCoords = useUserCoordinates();
  const trains = useAmtrakTrains(userCoords);

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
    if (!trains.length && userCoords) {
      zoomToCoordinate(userCoords, 10000);
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

  useEffect(() => {
    if (!_prevTrainsLength.current && trains.length) {
      _prevTrainsLength.current = trains.length;
      fitToAllTrains();
    }
  }, []);

  const trainMarkers = useMemo(
    () =>
      trains.map((train) => (
        <TrainMarker
          key={train.trainID}
          train={train}
          onSelect={() => {
            zoomToCoordinate({ latitude: train.lat, longitude: train.lon });
          }}
        />
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
        cameraZoomRange={{ animated: true }}
        showsUserLocation={!!userCoords}
        userInterfaceStyle="light"
        onMapReady={fitToAllTrains}
      >
        {trainMarkers}
      </MapView>
      <View style={[styles.buttonsContainer, { marginTop: top }]}>
        <MapButtons
          trainsTotal={trains.length}
          onTrainButtonPress={fitToAllTrains}
          showUserLocationButton={!!userCoords}
          onUserLocationButtonPress={centerOnUser}
        />
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
  buttonsContainer: { position: "absolute", top: 8, left: 8 },
});
