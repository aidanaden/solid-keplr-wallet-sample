import { ChainInfo } from "@keplr-wallet/types";

const junoChainInfo: ChainInfo = {
  chainId: "juno-1",
  chainName: "Juno mainnet",
  rpc: "https://rpc-juno.itastakers.com/",
  rest: "https://lcd-juno.itastakers.com/",
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: "juno",
    bech32PrefixAccPub: "junopub",
    bech32PrefixValAddr: "junovaloper",
    bech32PrefixValPub: "junovaloperpub",
    bech32PrefixConsAddr: "junovalcons",
    bech32PrefixConsPub: "junovalconspub",
  },
  currencies: [
    {
      coinDenom: "JUNO",
      coinMinimalDenom: "ujuno",
      coinDecimals: 6,
      coinGeckoId: "juno-network",
    },
  ],
  feeCurrencies: [
    {
      coinDenom: "JUNO",
      coinMinimalDenom: "ujuno",
      coinDecimals: 6,
      coinGeckoId: "juno-network",
    },
  ],
  stakeCurrency: {
    coinDenom: "JUNO",
    coinMinimalDenom: "ujuno",
    coinDecimals: 6,
    coinGeckoId: "juno-network",
  },
  coinType: 118,
  gasPriceStep: {
    low: 0.0004,
    average: 0.001,
    high: 0.0016,
  },
};

export default junoChainInfo;
