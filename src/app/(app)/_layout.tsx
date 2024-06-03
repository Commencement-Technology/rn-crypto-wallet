global.Buffer = require("buffer").Buffer;

import { useState, useEffect } from "react";
import { Redirect, Stack, router } from "expo-router";
import { useSelector } from "react-redux";
import styled, { useTheme } from "styled-components/native";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import type { RootState } from "../../store";
import { ROUTES } from "../../constants/routes";
import LeftIcon from "../../assets/svg/left-arrow.svg";
import CloseIcon from "../../assets/svg/close.svg";
import { getPhrase, clearStorage } from "../../hooks/use-storage-state";
import { clearPersistedState } from "../../store";
import { toastConfig } from "../../config/toast";
import Header from "../../components/Header/Header";

const IconTouchContainer = styled.TouchableOpacity`
  padding: 10px;
`;

SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  const theme = useTheme();
  const ethWallet = useSelector((state: RootState) => state.wallet.ethereum);
  const solWallet = useSelector((state: RootState) => state.wallet.solana);
  const [seedPhraseConfirmed, setSeedPhraseConfirmed] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const walletsExist = ethWallet.address && solWallet.address;
  useEffect(() => {
    const loadSeedPhraseConfirmation = async () => {
      const phrase = await getPhrase();
      if (!phrase && !ethWallet.address && !solWallet.address) {
        clearPersistedState();
        clearStorage();
        setLoading(false);
        router.replace(ROUTES.walletSetup);
      }
      if (!phrase && ethWallet.address && solWallet.address) {
        setSeedPhraseConfirmed(true);
        setLoading(false);
      }
    };

    loadSeedPhraseConfirmation();
  }, []);

  if (!loading) {
    SplashScreen.hideAsync();
  }

  if (!seedPhraseConfirmed && !loading && walletsExist) {
    return <Redirect href={ROUTES.seedPhrase} />;
  }

  if (!seedPhraseConfirmed && !loading && !walletsExist) {
    return <Redirect href={ROUTES.walletSetup} />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerTransparent: true,
          gestureEnabled: true,
          headerTitle: "",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            gestureEnabled: true,
            header: (props) => <Header {...props} />,
          }}
        />
        <Stack.Screen
          name="token/[id]"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            gestureEnabled: true,
            headerRight: null,
            headerLeft: () => (
              <IconTouchContainer onPress={() => router.back()}>
                <LeftIcon width={25} height={25} fill={theme.colors.primary} />
              </IconTouchContainer>
            ),
          }}
        />
        <Stack.Screen
          name="token/send/send-options"
          options={{
            headerShown: true,
            headerTransparent: true,
            gestureEnabled: true,
            presentation: "modal",
            headerRight: null,
            headerLeft: () => (
              <IconTouchContainer onPress={() => router.back()}>
                <CloseIcon width={25} height={25} fill={theme.colors.primary} />
              </IconTouchContainer>
            ),
          }}
        />
        <Stack.Screen
          name="token/send/[send]"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            gestureEnabled: true,
            presentation: "modal",
            headerLeft: null,
            headerRight: null,
            header: () => null,
          }}
        />
        <Stack.Screen
          name="token/receive/[receive]"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            gestureEnabled: true,
            headerTitleStyle: {
              color: theme.colors.white,
            },
            presentation: "modal",
            headerRight: null,
            headerLeft: () => (
              <IconTouchContainer onPress={() => router.back()}>
                <LeftIcon width={25} height={25} fill={theme.colors.white} />
              </IconTouchContainer>
            ),
          }}
        />
        <Stack.Screen
          name="token/send/send-confirmation"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            gestureEnabled: true,
            presentation: "modal",
            headerRight: null,
            headerLeft: () => (
              <IconTouchContainer onPress={() => router.back()}>
                <LeftIcon width={25} height={25} fill={theme.colors.primary} />
              </IconTouchContainer>
            ),
          }}
        />
        <Stack.Screen
          name="token/receive/receive-options"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            gestureEnabled: true,
            presentation: "modal",
            headerRight: null,
            headerLeft: () => (
              <IconTouchContainer onPress={() => router.back()}>
                <CloseIcon width={25} height={25} fill={theme.colors.primary} />
              </IconTouchContainer>
            ),
          }}
        />
        <Stack.Screen
          name="camera/index"
          options={{
            headerShown: false,
            headerTransparent: true,
            headerTitle: "",
            gestureEnabled: true,
            headerRight: null,
            headerLeft: () => (
              <IconTouchContainer onPress={() => router.back()}>
                <CloseIcon width={25} height={25} fill={theme.colors.white} />
              </IconTouchContainer>
            ),
          }}
        />
        <Stack.Screen
          name="settings/settings-modal"
          options={{
            headerShown: false,
            headerTransparent: true,
            gestureEnabled: true,
            presentation: "modal",
            headerLeft: null,
            headerRight: null,
          }}
        />
        <Stack.Screen
          name="accounts/accounts-modal"
          options={{
            headerShown: false,
            headerTransparent: true,
            gestureEnabled: true,
            presentation: "modal",
            headerLeft: null,
            headerRight: null,
          }}
        />
      </Stack>
      <Toast position="top" topOffset={75} config={toastConfig} />
    </>
  );
}
