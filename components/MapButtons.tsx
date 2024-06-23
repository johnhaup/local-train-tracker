import { FontAwesome5 } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  trainsTotal: number;
  onTrainButtonPress: () => void;
  showUserLocationButton: boolean;
  onUserLocationButtonPress: () => void;
}

export function MapButtons({
  trainsTotal,
  onTrainButtonPress,
  showUserLocationButton,
  onUserLocationButtonPress,
}: Props) {
  const showDivider = useMemo(
    () => trainsTotal > 0 && showUserLocationButton,
    [trainsTotal, showUserLocationButton]
  );

  if (!trainsTotal && !showUserLocationButton) {
    return null;
  }

  return (
    <View style={styles.container}>
      {trainsTotal > 0 ? (
        <TouchableOpacity
          onPress={onTrainButtonPress}
          style={styles.button}
          activeOpacity={0.8}
        >
          <Text style={styles.text}>{`🚂 (${trainsTotal})`}</Text>
        </TouchableOpacity>
      ) : null}
      {showDivider ? <View style={styles.divider} /> : null}
      {showUserLocationButton ? (
        <TouchableOpacity
          onPress={onUserLocationButtonPress}
          style={styles.button}
          activeOpacity={0.8}
        >
          <View style={styles.locationArrowOffset} />
          <FontAwesome5 name="location-arrow" size={16} color="white" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    flexDirection: "row",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  divider: {
    width: 1,
    backgroundColor: "white",
  },
  text: {
    color: "white",
  },
  locationArrowOffset: {
    height: 2,
  },
});
