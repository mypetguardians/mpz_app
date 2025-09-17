import { useEffect, useRef, useState } from "react";

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
  accuracyThresholdMeters?: number;
  watchTimeoutMs?: number;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: true,
  });
  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const bestPositionRef = useRef<GeolocationPosition | null>(null);

  useEffect(() => {
    requestLocation();
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.enableHighAccuracy,
    options.timeout,
    options.maximumAge,
    options.accuracyThresholdMeters,
    options.watchTimeoutMs,
  ]);

  const requestLocation = () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    bestPositionRef.current = null;

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "브라우저가 위치정보를 지원하지 않습니다.",
        isLoading: false,
      }));
      return;
    }

    const accuracyThreshold = options.accuracyThresholdMeters ?? 50; // 미터
    const watchTimeout = options.watchTimeoutMs ?? 12000; // ms

    const commitPosition = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        isLoading: false,
      });
    };

    const finalize = (
      position: GeolocationPosition | null,
      errorMsg?: string
    ) => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (position) {
        commitPosition(position);
      } else {
        setState((prev) => ({
          ...prev,
          error: errorMsg ?? "위치정보를 가져오는데 실패했습니다.",
          isLoading: false,
        }));
      }
    };

    const onSuccess = (position: GeolocationPosition) => {
      const acc = position.coords.accuracy;
      if (
        !bestPositionRef.current ||
        acc < bestPositionRef.current.coords.accuracy
      ) {
        bestPositionRef.current = position;
      }
      if (acc <= accuracyThreshold) {
        finalize(position);
      }
    };

    const onError = (error: GeolocationPositionError) => {
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
      finalize(bestPositionRef.current, errorMessage);
    };

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? watchTimeout,
      maximumAge: options.maximumAge ?? 0, // 오래된 캐시 사용 방지
    };

    // 빠른 1차 위치 확보 후, watch로 정밀도 개선
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        bestPositionRef.current = pos;
        if (pos.coords.accuracy <= accuracyThreshold) {
          finalize(pos);
        }
      },
      onError,
      geoOptions
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      geoOptions
    );

    timeoutRef.current = window.setTimeout(() => {
      finalize(
        bestPositionRef.current,
        bestPositionRef.current
          ? undefined
          : "위치정보 요청 시간이 초과되었습니다."
      );
    }, watchTimeout);
  };

  return {
    ...state,
    requestLocation,
  };
};
