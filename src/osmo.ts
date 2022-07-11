import { ChainInfo } from "@keplr-wallet/types";

const osmoChainInfo: ChainInfo = {
  chainId: "osmosis-1",
  chainName: "Osmosis mainnet",
  rpc: "https://rpc.osmosis.zone/",
  rest: "https://lcd.osmosis.zone/",
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: "osmo",
    bech32PrefixAccPub: "osmo" + "pub",
    bech32PrefixValAddr: "osmo" + "valoper",
    bech32PrefixValPub: "osmo" + "valoperpub",
    bech32PrefixConsAddr: "osmo" + "valcons",
    bech32PrefixConsPub: "osmo" + "valconspub",
  },
  currencies: [
    {
      coinDenom: "OSMO",
      coinMinimalDenom: "uosmo",
      coinDecimals: 6,
      coinGeckoId: "osmosis",
    },
  ],
  feeCurrencies: [
    {
      coinDenom: "OSMO",
      coinMinimalDenom: "uosmo",
      coinDecimals: 6,
      coinGeckoId: "osmosis",
    },
  ],
  stakeCurrency: {
    coinDenom: "OSMO",
    coinMinimalDenom: "uosmo",
    coinDecimals: 6,
    coinGeckoId: "osmosis",
  },
  coinType: 118,
  gasPriceStep: {
    low: 0.0004,
    average: 0.001,
    high: 0.0016,
  },
};

export default osmoChainInfo;
