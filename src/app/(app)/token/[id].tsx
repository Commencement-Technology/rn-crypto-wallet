import { useEffect, useState, useCallback } from "react";
import {
  View,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { router, useLocalSearchParams } from "expo-router";
import styled, { useTheme } from "styled-components/native";
import * as WebBrowser from "expo-web-browser";
import type { ThemeType } from "../../../styles/theme";
import type { RootState, AppDispatch } from "../../../store";
import {
  fetchEthereumBalance,
  updateSolanaBalance,
  fetchEthereumTransactions,
  fetchSolanaTransactions,
} from "../../../store/walletSlice";
import { getSolanaBalance } from "../../../utils/solanaHelpers";
import { capitalizeFirstLetter } from "../../../utils/capitalizeFirstLetter";
import { formatDollar } from "../../../utils/formatDollars";
import PrimaryButton from "../../../components/PrimaryButton/PrimaryButton";
import SendIcon from "../../../assets/svg/send.svg";
import ReceiveIcon from "../../../assets/svg/receive.svg";
import TokenInfoCard from "../../../components/TokenInfoCard/TokenInfoCard";
import SolanaIcon from "../../../assets/svg/solana.svg";
import EthereumIcon from "../../../assets/svg/ethereum_plain.svg";
import { AssetTransfer } from "../../../types";
import CryptoInfoCard from "../../../components/CryptoInfoCard/CryptoInfoCard";
import { truncateWalletAddress } from "../../../utils/truncateWalletAddress";
import { TICKERS } from "../../../constants/tickers";
import { Chains } from "../../../types";
import { FETCH_PRICES_INTERVAL } from "../../../constants/price";

const isAndroid = Platform.OS === "android";

const SafeAreaContainer = styled(SafeAreaView)<{ theme: ThemeType }>`
  flex: 1;
  background-color: ${(props) => props.theme.colors.dark};
  justify-content: flex-end;
`;

const ContentContainer = styled.View<{ theme: ThemeType }>`
  flex: 1;
  justify-content: flex-start;
  padding: ${(props) => props.theme.spacing.large};
  margin-top: ${(props) => isAndroid && props.theme.spacing.huge};
`;

const BalanceContainer = styled.View<{ theme: ThemeType }>`
  margin-top: 10px;
  margin-bottom: ${(props) => props.theme.spacing.huge};
`;

const BalanceTokenText = styled.Text<{ theme: ThemeType }>`
  font-family: ${(props) => props.theme.fonts.families.openBold};
  font-size: ${(props) => props.theme.fonts.sizes.huge};
  color: ${(props) => props.theme.fonts.colors.primary};
  text-align: center;
`;

const BalanceUsdText = styled.Text<{ theme: ThemeType }>`
  font-family: ${(props) => props.theme.fonts.families.openBold};
  font-size: ${(props) => props.theme.fonts.sizes.title};
  color: ${(props) => props.theme.colors.lightGrey};
  text-align: center;
`;

const ActionContainer = styled.View<{ theme: ThemeType }>`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: ${(props) => props.theme.spacing.huge};
`;

const CryptoInfoCardContainer = styled.View<{ theme: ThemeType }>`
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: ${(props) => props.theme.spacing.medium};
`;

const SectionTitle = styled.Text<{ theme: ThemeType }>`
  font-family: ${(props) => props.theme.fonts.families.openBold};
  font-size: ${(props) => props.theme.fonts.sizes.header};
  color: ${(props) => props.theme.fonts.colors.primary};
  margin-left: ${(props) => props.theme.spacing.small};
  margin-bottom: ${(props) => props.theme.spacing.medium};
`;

const TransactionTitle = styled.Text<{ theme: ThemeType }>`
  font-family: ${(props) => props.theme.fonts.families.openBold};
  font-size: ${(props) => props.theme.fonts.sizes.header};
  color: ${(props) => props.theme.fonts.colors.primary};
  margin-bottom: ${(props) => props.theme.spacing.small};
  margin-top: ${(props) => props.theme.spacing.medium};
`;

const ComingSoonView = styled.View<{ theme: ThemeType }>`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ComingSoonText = styled.Text<{ theme: ThemeType }>`
  font-family: ${(props) => props.theme.fonts.families.openBold};
  font-size: ${(props) => props.theme.fonts.sizes.header};
  color: ${(props) => props.theme.colors.lightGrey};
  margin-top: ${(props) => props.theme.spacing.medium};
`;

const ErrorContainer = styled.View<{ theme: ThemeType }>`
  flex: 1;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: rgba(255, 0, 0, 0.3);
  border: 2px solid rgba(255, 0, 0, 0.4);
  border-radius: ${(props) => props.theme.borderRadius.large};
  height: 85px;
  padding: ${(props) => props.theme.spacing.medium};
`;

const ErrorText = styled.Text<{ theme: ThemeType }>`
  font-family: ${(props) => props.theme.fonts.families.openBold};
  font-size: ${(props) => props.theme.fonts.sizes.normal};
  color: ${(props) => props.theme.colors.white};
`;

export default function Index() {
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const chainName = id as string;
  const tokenAddress = useSelector(
    (state: RootState) => state.wallet[chainName].address
  );
  const tokenBalance = useSelector(
    (state: RootState) => state.wallet[chainName].balance
  );
  const transactionHistory = useSelector(
    (state: RootState) => state.wallet[chainName].transactions
  );

  const walletState = useSelector(
    (state: RootState) => state.wallet[chainName]
  );
  const prices = useSelector((state: RootState) => state.price.data);
  const solPrice = prices.solana.usd;
  const ethPrice = prices.ethereum.usd;

  const [usdBalance, setUsdBalance] = useState(0);
  const [transactions, setTransactions] = useState<AssetTransfer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const ticker = TICKERS[chainName];
  const isSolana = chainName === Chains.Solana;
  const isEthereum = chainName === Chains.Ethereum;
  const Icon = isSolana ? SolanaIcon : EthereumIcon;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTokenBalance();
    await fetchPrices(tokenBalance);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, [dispatch]);

  const _handlePressButtonAsync = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const urlBuilder = (hash: string) => {
    let url: string;

    if (chainName === Chains.Ethereum) {
      url = `https://sepolia.etherscan.io/tx/${hash}`;
    } else {
      url = `https://explorer.solana.com/tx/${hash}`;
    }
    return url;
  };

  const renderItem = ({ item }) => {
    if (isSolana) {
      return (
        <CryptoInfoCard
          onPress={() => _handlePressButtonAsync(urlBuilder(item.hash))}
          title={capitalizeFirstLetter(item.direction)}
          caption={`To ${truncateWalletAddress(item.to)}`}
          details={`- ${item.value} ${item.asset}`}
          icon={<Icon width={35} height={35} fill={theme.colors.white} />}
        />
      );
    }

    if (
      item.category === "external" &&
      item.from.toLowerCase() === tokenAddress.toLowerCase() &&
      isEthereum
    ) {
      return (
        <CryptoInfoCard
          onPress={() => _handlePressButtonAsync(urlBuilder(item.hash))}
          title="Sent"
          caption={`To ${truncateWalletAddress(item.to)}`}
          details={`- ${item.value} ${item.asset}`}
          icon={<Icon width={35} height={35} fill={theme.colors.white} />}
        />
      );
    }

    if (
      item.category === "external" &&
      item.to.toLowerCase() === tokenAddress.toLowerCase() &&
      isEthereum
    ) {
      return (
        <CryptoInfoCard
          onPress={() => _handlePressButtonAsync(urlBuilder(item.hash))}
          title="Received"
          caption={`From ${truncateWalletAddress(item.from)}`}
          details={`+ ${item.value} ${item.asset}`}
          icon={<Icon width={35} height={35} fill={theme.colors.white} />}
        />
      );
    }
  };

  const fetchPrices = async (currentTokenBalance: number) => {
    if (chainName === Chains.Ethereum) {
      dispatch(fetchEthereumTransactions(tokenAddress));
      const usd = ethPrice * currentTokenBalance;
      setUsdBalance(usd);
    }

    if (chainName === Chains.Solana) {
      dispatch(fetchSolanaTransactions(tokenAddress));
      const usd = solPrice * currentTokenBalance;
      setUsdBalance(usd);
    }
  };

  const fetchTokenBalance = async () => {
    if (isSolana && tokenAddress) {
      const currentSolBalance = await getSolanaBalance(tokenAddress);
      dispatch(updateSolanaBalance(currentSolBalance));
    }

    if (isEthereum && tokenAddress) {
      dispatch(fetchEthereumBalance(tokenAddress));
    }
  };

  const setTokenTransactions = async () => {
    if (transactionHistory.length !== 0 && isEthereum) {
      const walletTransactions = transactionHistory.filter(
        (tx: AssetTransfer) => {
          return tx.asset === ticker;
        }
      );
      setTransactions(walletTransactions.reverse());
    }

    if (transactionHistory.length !== 0 && isSolana) {
      setTransactions(transactionHistory);
    }
  };

  useEffect(() => {
    const fetchAndUpdatePrices = async () => {
      await fetchTokenBalance();
      await fetchPrices(tokenBalance);
    };
    fetchAndUpdatePrices();
    const intervalId = setInterval(fetchAndUpdatePrices, FETCH_PRICES_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [dispatch, tokenBalance, ethPrice, solPrice, chainName, tokenAddress]);

  useEffect(() => {
    setTokenTransactions();
  }, [transactionHistory]);

  console.log("wallet state:", walletState);
  return (
    <SafeAreaContainer>
      <ContentContainer>
        <FlatList
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.white}
            />
          }
          ListHeaderComponent={
            <>
              <BalanceContainer>
                <BalanceTokenText>
                  {tokenBalance} {ticker}
                </BalanceTokenText>
                <BalanceUsdText>{formatDollar(usdBalance)}</BalanceUsdText>
              </BalanceContainer>
              <ActionContainer>
                <PrimaryButton
                  icon={
                    <SendIcon
                      width={25}
                      height={25}
                      fill={theme.colors.primary}
                    />
                  }
                  onPress={() => router.push(`token/send/${chainName}`)}
                  btnText="Send"
                />
                <View style={{ width: 15 }} />
                <PrimaryButton
                  icon={
                    <ReceiveIcon
                      width={25}
                      height={25}
                      fill={theme.colors.primary}
                    />
                  }
                  onPress={() => router.push(`token/receive/${chainName}`)}
                  btnText="Receive"
                />
              </ActionContainer>
              <SectionTitle>
                About {capitalizeFirstLetter(chainName)}
              </SectionTitle>
              <CryptoInfoCardContainer>
                <TokenInfoCard
                  tokenName={capitalizeFirstLetter(chainName)}
                  tokenSymbol={ticker}
                  network={capitalizeFirstLetter(chainName)}
                />
              </CryptoInfoCardContainer>

              <TransactionTitle>Transaction History</TransactionTitle>
            </>
          }
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.uniqueId}
          contentContainerStyle={{ gap: 10 }}
          ListEmptyComponent={
            <ComingSoonView>
              <ComingSoonText>Add some {ticker} to your wallet</ComingSoonText>
            </ComingSoonView>
          }
        />
      </ContentContainer>
    </SafeAreaContainer>
  );
}

// <ErrorContainer>
//   <ErrorText>
//     Devnet transactions are not available currently
//   </ErrorText>
