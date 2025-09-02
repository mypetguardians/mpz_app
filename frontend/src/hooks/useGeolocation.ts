import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "브라우저가 위치정보를 지원하지 않습니다.",
        isLoading: false,
      }));
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        isLoading: false,
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = "위치정보를 가져오는데 실패했습니다.";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "위치정보 접근 권한이 거부되었습니다.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "위치정보를 사용할 수 없습니다.";
          break;
        case error.TIMEOUT:
          errorMessage = "위치정보 요청 시간이 초과되었습니다.";
          break;
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    };

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000,
    };

    navigator.geolocation.getCurrentPosition(
      successHandler,
      errorHandler,
      geoOptions
    );
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge]);

  const requestLocation = () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "브라우저가 위치정보를 지원하지 않습니다.",
        isLoading: false,
      }));
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        isLoading: false,
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = "위치정보를 가져오는데 실패했습니다.";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "위치정보 접근 권한이 거부되었습니다.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "위치정보를 사용할 수 없습니다.";
          break;
        case error.TIMEOUT:
          errorMessage = "위치정보 요청 시간이 초과되었습니다.";
          break;
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    };

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000,
    };

    navigator.geolocation.getCurrentPosition(
      successHandler,
      errorHandler,
      geoOptions
    );
  };

  return {
    ...state,
    requestLocation,
  };
};
