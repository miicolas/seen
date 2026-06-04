import { useNetworkState } from "expo-network";

export function useNetworkOnline() {
  const state = useNetworkState();
  return state.isConnected !== false && state.isInternetReachable !== false;
}
