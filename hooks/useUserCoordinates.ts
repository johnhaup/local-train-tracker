import {
  getCurrentPositionAsync,
  useForegroundPermissions,
} from "expo-location";
import { useCallback, useEffect, useState } from "react";

export function useUserCoordinates() {
  const [_response, _request] = useForegroundPermissions();

  const [userCoords, _setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const requestPermission = useCallback(async () => {
    const _response = await _request();
    if (_response?.status === "granted") {
      const location = await getCurrentPositionAsync();
      _setUserCoords(location.coords);
    }
  }, []);

  useEffect(() => {
    if (!_response || _response?.status === "undetermined") {
      requestPermission();
    }
  }, [_response]);

  return userCoords;
}
