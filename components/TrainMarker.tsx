import { Train } from "amtrak/dist/types";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { Marker } from "react-native-maps";

interface Props {
  train: Train;
  onSelect: () => void;
}

export function TrainMarker({ train, onSelect }: Props) {
  return (
    <Marker
      identifier={train.trainID}
      coordinate={{ latitude: train.lat, longitude: train.lon }}
      title={`Train ${train.trainNum}`}
      description={`Heading ${train.heading} to ${train.destName}`}
      onSelect={onSelect}
    >
      <Text style={styles.text}>🚂</Text>
    </Marker>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 32,
  },
});
