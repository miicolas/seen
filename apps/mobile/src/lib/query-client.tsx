import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { AppState, type AppStateStatus } from "react-native";
import type { PropsWithChildren } from "react";

function isOnline(state: Network.NetworkState) {
  return state.isConnected === true && state.isInternetReachable !== false;
}

onlineManager.setEventListener((setOnline) => {
  Network.getNetworkStateAsync().then((state) => setOnline(isOnline(state)));

  const subscription = Network.addNetworkStateListener((state) => {
    setOnline(isOnline(state));
  });

  return () => subscription.remove();
});

function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === "active");
}

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener("change", (status) => {
    onAppStateChange(status);
    if (status === "active") handleFocus();
  });

  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
      retry: 1,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
  },
});

export function QueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
