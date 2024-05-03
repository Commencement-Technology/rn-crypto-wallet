import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { useLocalSearchParams, router } from "expo-router";
import type { ThemeType } from "../../../../styles/theme";
import ConfirmSend from "../../../../assets/svg/confirm-send.svg";
import { formatDollar } from "../../../../utils/formatDollars";
import { TICKERS } from "../../../../constants/tickers";
import { truncateWalletAddress } from "../../../../utils/truncateWalletAddress";
import SendConfCard from "../../../../components/SendConfCard/SendConfCard";
import { capitalizeFirstLetter } from "../../../../utils/capitalizeFirstLetter";
import Button from "../../../../components/Button/Button";
import {
  calculateGasAndAmounts,
  sendTransaction,
} from "../../../../utils/etherHelpers";
import { getPrivateKey } from "../../../../hooks/use-storage-state";
import { ROUTES } from "../../../../constants/routes";

const SafeAreaContainer = styled(SafeAreaView)<{ theme: ThemeType }>`
  flex: 1;
  background-color: ${(props) => props.theme.colors.dark};
  justify-content: flex-end;
`;

const ContentContainer = styled.View<{ theme: ThemeType }>`
  flex: 1;
  justify-content: flex-start;
  padding: ${(props) => props.theme.spacing.large};
`;

const IconBackground = styled.View<{ theme: ThemeType }>`
  background-color: ${(props) => props.theme.colors.ethereum};
  border-radius: 100px;
  padding: ${(props) => props.theme.spacing.large};
`;

const IconView = styled.View<{ theme: ThemeType }>`
  justify-content: center;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing.medium};
  width: 100%;
`;

const BalanceContainer = styled.View<{ theme: ThemeType }>`
  margin-top: 10px;
  margin-bottom: ${(props) => props.theme.spacing.huge};
`;

const CryptoBalanceText = styled.Text<{ theme: ThemeType }>`
  font-family: ${(props) => props.theme.fonts.families.openBold};
  font-size: ${(props) => props.theme.fonts.sizes.huge};
  color: ${(props) => props.theme.fonts.colors.primary};
  text-align: center;
`;

const UsdBalanceText = styled.Text<{ theme: ThemeType }>`
  font-family: ${(props) => props.theme.fonts.families.openBold};
  font-size: ${(props) => props.theme.fonts.sizes.title};
  color: ${(props) => props.theme.colors.lightGrey};
  text-align: center;
`;

const CryptoInfoCardContainer = styled.View<{ theme: ThemeType }>`
  flex: 1;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: ${(props) => props.theme.spacing.medium};
`;

const ButtonContainer = styled.View<{ theme: ThemeType }>`
  margin-bottom: ${(props) => props.theme.spacing.small};
`;

const ErrorView = styled.View<{ theme: ThemeType }>`
  margin-top: ${(props) => props.theme.spacing.medium};
`;

const ErrorText = styled.Text<{ theme: ThemeType }>`
  font-family: ${(props) => props.theme.fonts.families.openBold};
  font-size: ${(props) => props.theme.fonts.sizes.title};
  color: ${(props) => props.theme.colors.red};
  text-align: center;
`;

const ButtonView = styled.View<{ theme: ThemeType }>``;

const ethPriceMock = 3006.94;
const solPriceMock = 127.22;

const findChainPrice = (chainName: string, amount: string) => {
  switch (chainName) {
    case "ethereum":
      return ethPriceMock * parseFloat(amount);
    case "solana":
      return solPriceMock * parseFloat(amount);
    default:
      return 0;
  }
};

export default function SendConfirmationPage() {
  const theme = useTheme();
  const {
    address: toAddress,
    amount: tokenAmount,
    chainName: chain,
  } = useLocalSearchParams();
  const [gasEstimate, setGasEstimate] = useState("0.00");
  const [totalCostMinusGas, setTotalCostMinusGas] = useState("0.00");
  const [error, setError] = useState<string | null>(null);
  const [isBtnDisabled, setIsBtnDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const chainName = chain as string;
  const ticker = TICKERS[chainName];
  const amount = tokenAmount as string;
  const address = toAddress as string;

  const chainBalance = `${amount} ${ticker}`;
  // const usdBalance = findChainPrice(chainName, amount);
  const ethPriceMock = 3006.94;
  const solPriceMock = 127.22;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setIsBtnDisabled(true);
      const privateKey = await getPrivateKey();
      const response = await sendTransaction(address, privateKey, amount);
      console.log("Transaction response:", response);
      if (response) {
        console.log("Transaction sent successfully.", `token/${chainName}`);
        router.navigate(`token/${chainName}`);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to send transaction:", error);
      setError("Failed to send transaction. Please try again later.");
      setLoading(false);
      setIsBtnDisabled(false);
    }
  };

  const calculateTransactionCosts = async () => {
    const chainPriceMock =
      chainName === "ethereum" ? ethPriceMock : solPriceMock;
    try {
      const { gasEstimate, totalCost, totalCostMinusGas } =
        await calculateGasAndAmounts(address, amount);

      const gasEstimateUsd = formatDollar(
        parseFloat(gasEstimate) * chainPriceMock
      );
      const totalCostPlusGasUsd = formatDollar(
        parseFloat(totalCost) * chainPriceMock
      );
      setGasEstimate(gasEstimateUsd);
      setTotalCostMinusGas(totalCostPlusGasUsd);

      if (totalCostMinusGas > amount) {
        setError("Not enough funds to send transaction.");
        setIsBtnDisabled(true);
      } else {
        setError("");
        setIsBtnDisabled(false);
      }
    } catch (error) {
      console.error("Failed to fetch transaction costs:", error);
    }
  };

  useEffect(() => {
    calculateTransactionCosts();

    const intervalId = setInterval(async () => {
      await calculateTransactionCosts();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [address, amount]);

  const networkName =
    process.env.EXPO_PUBLIC_ENVIRONMENT === "production"
      ? "Mainnet"
      : "Sepolia";

  return (
    <SafeAreaContainer>
      <ContentContainer>
        <IconView>
          <IconBackground>
            <ConfirmSend width={45} height={45} fill={theme.colors.primary} />
          </IconBackground>
        </IconView>
        <BalanceContainer>
          <CryptoBalanceText>{chainBalance}</CryptoBalanceText>
          <UsdBalanceText>{totalCostMinusGas}</UsdBalanceText>
        </BalanceContainer>
        <CryptoInfoCardContainer>
          <SendConfCard
            toAddress={truncateWalletAddress(address)}
            network={`${capitalizeFirstLetter(chainName)} ${networkName}`}
            networkFee={`Up to ${gasEstimate}`}
          />
          {error && (
            <ErrorView>
              <ErrorText>{error}</ErrorText>
            </ErrorView>
          )}
        </CryptoInfoCardContainer>
        <ButtonView>
          <ButtonContainer>
            <Button
              loading={loading}
              disabled={isBtnDisabled}
              backgroundColor={theme.colors.primary}
              onPress={handleSubmit}
              title="Send"
            />
          </ButtonContainer>
        </ButtonView>
      </ContentContainer>
    </SafeAreaContainer>
  );
}
