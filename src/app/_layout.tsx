import { StatusBar } from "expo-status-bar";
import { Stack, router } from "expo-router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "styled-components/native";
import {
  useFonts,
  OpenSans_400Regular,
  OpenSans_700Bold,
} from "@expo-google-fonts/open-sans";
import {
  Roboto_400Regular as RobotoReg,
  Roboto_700Bold as RobotoBld,
} from "@expo-google-fonts/roboto";
import { WalletProvider } from "../providers/wallet-provider";
import LeftArrow from "../assets/svg/left-arrow.svg";
import { clearStorage } from "../hooks/use-storage-state";
import Theme from "../styles/theme";
import { store, persistor } from "../store";
import { ROUTES } from "../constants/routes";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_700Bold,
    Roboto_400Regular: RobotoReg,
    Roboto_700Bold: RobotoBld,
  });

  if (!fontsLoaded) {
    return null;
  }

  const goBack = () => {
    clearStorage();
    router.back();
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={Theme}>
          <WalletProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                headerTransparent: true,
                gestureEnabled: true,
              }}
            >
              <Stack.Screen
                name={ROUTES.walletSetup}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(wallet)/seed-phrase"
                options={{
                  title: "Seed Phrase",
                  headerShown: true,
                  headerTransparent: true,
                  headerTitleStyle: {
                    color: "transparent",
                  },
                  headerLeft: () => (
                    <LeftArrow
                      width={35}
                      height={35}
                      fill="#FFF"
                      onPress={goBack}
                    />
                  ),
                }}
              />
              <Stack.Screen
                name="(wallet)/confirm-seed-phrase"
                options={{
                  title: "Confirm Seed Phrase",
                  headerShown: true,
                  headerTransparent: true,
                  headerTitleStyle: {
                    color: "transparent",
                  },
                  headerLeft: () => (
                    <LeftArrow
                      width={35}
                      height={35}
                      fill="#FFF"
                      onPress={goBack}
                    />
                  ),
                }}
              />
              <Stack.Screen
                name="(wallet)/wallet-created-successfully"
                options={{
                  title: "Confirm Seed Phrase",
                  headerShown: true,
                  headerTransparent: true,
                  headerTitleStyle: {
                    color: "transparent",
                  },
                  headerLeft: () => (
                    <LeftArrow
                      width={35}
                      height={35}
                      fill="#FFF"
                      onPress={goBack}
                    />
                  ),
                }}
              />
              <Stack.Screen
                name="(wallet)/wallet-import-options"
                options={{
                  title: "Confirm Seed Phrase",
                  headerShown: true,
                  headerTransparent: true,
                  headerTitleStyle: {
                    color: "transparent",
                  },
                  headerLeft: () => (
                    <LeftArrow
                      width={35}
                      height={35}
                      fill="#FFF"
                      onPress={goBack}
                    />
                  ),
                }}
              />
              <Stack.Screen
                name="(wallet)/wallet-import-seed-phrase"
                options={{
                  title: "Confirm Seed Phrase",
                  headerShown: true,
                  headerTransparent: true,
                  headerTitleStyle: {
                    color: "transparent",
                  },
                  headerLeft: () => (
                    <LeftArrow
                      width={35}
                      height={35}
                      fill="#FFF"
                      onPress={goBack}
                    />
                  ),
                }}
              />
            </Stack>
          </WalletProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
