import { AppCurrency, ChainInfo } from "@keplr-wallet/types";

export interface ChainInfoWithExplorer extends ChainInfo {
  /** Formed as "https://explorer.com/{txHash}" */
  explorerUrlToTx: string;
  /** Add optional stable coin peg info to currencies. */
  currencies: Array<
    AppCurrency & {
      pegMechanism?: "collateralized" | "algorithmic" | "hybrid";
    }
  >;
}
