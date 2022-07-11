import {
  Component,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  useContext,
} from "solid-js";
import { Keplr } from "@keplr-wallet/types";
import { BroadcastMode, StdTx } from "@cosmjs/launchpad";

import { getKeplrFromWindow } from "./get-keplr";
import { KeplrAccountBase } from "../Account";
import junoChainInfo from "../juno";
import { KeplrWalletConnectV1 } from "@keplr-wallet/wc-client";
import { isMobile } from "@walletconnect/browser-utils";
import WalletConnect from "@walletconnect/client";
import EventEmitter from "eventemitter3";
import Axios from "axios";
import { KeplrWalletConnectQRModal } from "../modals";
import KeplrConnectionSelectModal from "../modals/keplr-connection-selection";
import { ChainInfos } from "../config/chain-infos";

// const semver = require("semver");

export async function sendTxWC(
  chainId: string,
  tx: StdTx | Uint8Array,
  mode: BroadcastMode
): Promise<Uint8Array> {
  const restInstance = Axios.create({
    baseURL: ChainInfos.find((chainInfo) => chainInfo.chainId === chainId)!
      .rest,
  });

  const isProtoTx = Buffer.isBuffer(tx) || tx instanceof Uint8Array;

  const params = isProtoTx
    ? {
        tx_bytes: Buffer.from(tx as any).toString("base64"),
        mode: (() => {
          switch (mode) {
            case "async":
              return "BROADCAST_MODE_ASYNC";
            case "block":
              return "BROADCAST_MODE_BLOCK";
            case "sync":
              return "BROADCAST_MODE_SYNC";
            default:
              return "BROADCAST_MODE_UNSPECIFIED";
          }
        })(),
      }
    : {
        tx,
        mode: mode,
      };

  const result = await restInstance.post(
    isProtoTx ? "/cosmos/tx/v1beta1/txs" : "/txs",
    params
  );

  const txResponse = isProtoTx ? result.data["tx_response"] : result.data;

  if (txResponse.code != null && txResponse.code !== 0) {
    throw new Error(txResponse["raw_log"]);
  }

  return Buffer.from(txResponse.txhash, "hex");
}

type storeContextType = {
  accountStore: KeplrAccountBase;
};

const storeContext = createContext<storeContextType | null>(null);

type Props = {
  children?: JSXElement;
};

export const StoreProvider: Component<Props> = (props) => {
  const [isExtensionSelectionModalOpen, setIsExtensionSelectionModalOpen] =
    createSignal(false);
  const [isExtentionNotInstalled, setIsExtensionNotInstalled] =
    createSignal(false);
  const [wcUri, setWCUri] = createSignal("");

  let lastUsedKeplrRef: Keplr | undefined;
  let defaultConnectionTypeRef: "extension" | "wallet-connect" | undefined;
  const [connectionType, setConnectionType] = createSignal<
    "extension" | "wallet-connect" | undefined
  >();
  const eventEmitter = createMemo(() => new EventEmitter());

  const getKeplr = createMemo(() => async (): Promise<Keplr | undefined> => {
    console.log("running getKeplr fn");
    if (typeof window === "undefined") {
      console.log("window undefined");
      return Promise.resolve(undefined);
    }

    if (lastUsedKeplrRef) {
      console.log("using last used keplr ref");
      return Promise.resolve(lastUsedKeplrRef);
    }

    if (defaultConnectionTypeRef === "extension") {
      return getKeplrFromWindow().then((keplr) => {
        lastUsedKeplrRef = keplr;
        console.log("found keplr using getKeplrFromWindow()");
        setConnectionType("extension");
        return keplr;
      });
    }

    let callbackClosed: (() => void) | undefined;

    const createWalletConnect = (): WalletConnect => {
      const wcLogoURI = "/osmosis-logo-wc.png";

      const wc = new WalletConnect({
        bridge: "https://bridge.walletconnect.org", // Required
        signingMethods: [
          "keplr_enable_wallet_connect_v1",
          "keplr_sign_amino_wallet_connect_v1",
        ],
        qrcodeModal: {
          open: (uri: string, cb: any) => {
            console.log("qr code modal open called!");
            setWCUri(uri);
            callbackClosed = cb;
          },
          close: () => setWCUri(""),
        },
      });

      // XXX: I don't know why they designed that the client meta options in the constructor should be always ingored...
      // @ts-ignore
      wc._clientMeta = {
        name: "solid-keplr-wallet",
        description: "solid-keplr-wallet for coinhall testing",
        url: "https://solid-keplr-wallet-sample.vercel.app/",
        icons: wcLogoURI
          ? [
              // Keplr mobile app can't show svg image.
              window.location.origin + wcLogoURI,
            ]
          : [],
      };

      return wc;
    };

    if (defaultConnectionTypeRef === "wallet-connect") {
      const connector = createWalletConnect();

      if (connector.connected) {
        console.log("wallet connect is already connected");
        const keplr = new KeplrWalletConnectV1(connector, {
          sendTx: sendTxWC,
        });
        lastUsedKeplrRef = keplr;
        setConnectionType("wallet-connect");
        return Promise.resolve(keplr);
      }
    }

    // return await getKeplrFromWindow();

    return (async () => {
      // First, try to get keplr from window.
      const keplrFromWindow = await getKeplrFromWindow();

      if (!isMobile()) {
        // If on mobile browser environment,
        // no need to open select modal.
        setIsExtensionSelectionModalOpen(true);
      }

      return await new Promise((resolve, reject) => {
        const cleanUp = () => {
          eventEmitter().off("extension_selection_modal_close");
          eventEmitter().off("select_extension");
          eventEmitter().off("select_wallet_connect");
          eventEmitter().off("wc_modal_close");
          eventEmitter().off("connect");
          eventEmitter().off("keplr_install_modal_close");
        };

        eventEmitter().on("extension_selection_modal_close", () => {
          setIsExtensionSelectionModalOpen(false);
          reject();
          cleanUp();
        });

        eventEmitter().on("keplr_install_modal_close", () => {
          setIsExtensionNotInstalled(false);
          reject();
          cleanUp();
        });

        eventEmitter().on("select_extension", () => {
          setIsExtensionSelectionModalOpen(false);

          getKeplrFromWindow().then((keplr) => {
            lastUsedKeplrRef = keplr;
            setConnectionType("extension");
            resolve(keplr);
            cleanUp();
          });
        });

        eventEmitter().on("select_wallet_connect", () => {
          console.log("detected select_wallet_connect event!");
          const connector = createWalletConnect();
          console.log("connector object: ", connector);

          eventEmitter().on("wc_modal_close", () => {
            setWCUri("");
            if (callbackClosed) {
              callbackClosed();
            }
          });

          // Check if connection is already established
          if (!connector.connected) {
            console.log("creating new connection!");

            // create new session
            connector.createSession();

            connector.on("connect", (error) => {
              cleanUp();
              if (error) {
                reject(error);
              } else {
                const keplr = new KeplrWalletConnectV1(connector, {
                  sendTx: sendTxWC,
                });
                setIsExtensionSelectionModalOpen(false);
                lastUsedKeplrRef = keplr;
                setConnectionType("wallet-connect");
                resolve(keplr);
              }
            });
          } else {
            const keplr = new KeplrWalletConnectV1(connector, {
              sendTx: sendTxWC,
            });
            setIsExtensionSelectionModalOpen(false);
            lastUsedKeplrRef = keplr;
            setConnectionType("wallet-connect");
            resolve(keplr);
            cleanUp();
          }
        });

        if (isMobile()) {
          if (keplrFromWindow && keplrFromWindow.mode === "mobile-web") {
            // If mobile with `keplr` in `window`, it means that user enters frontend from keplr app's in app browser.
            // So, their is no need to use wallet connect, and it resembles extension's usages.
            eventEmitter().emit("select_extension");
          } else {
            // Force emit "select_wallet_connect" event if on mobile browser environment.
            eventEmitter().emit("select_wallet_connect");
          }
        }
      });
    })();
  });

  createEffect(() => {
    getKeplrFromWindow().then((keplr) => {
      if (!keplr) {
        setIsExtensionNotInstalled(true);
      }
    });
  });

  const eventListener = (() => {
    // On client-side (web browser), use the global window object.
    if (typeof window !== "undefined") {
      return window;
    }

    // On server-side (nodejs), there is no global window object.
    // Alternatively, use the event emitter library.
    // const emitter = new EventEmitter();
    // return {
    //   addEventListener: (type: string, fn: () => unknown) => {
    //     emitter.addListener(type, fn);
    //   },
    //   removeEventListener: (type: string, fn: () => unknown) => {
    //     emitter.removeListener(type, fn);
    //   },
    // };
  })();

  const [accountStore, setAccountStore] = createSignal(
    new KeplrAccountBase(
      eventListener,
      [junoChainInfo],
      junoChainInfo.chainId,
      {
        suggestChain: true,
        suggestChainFn: async (keplr, chainInfo) => {
          if (
            keplr.mode === "mobile-web"
            // &&
            // In keplr mobile below 0.10.9, there is no receiver for the suggest chain.
            // Therefore, it cannot be processed because it takes infinite pending.
            // As of 0.10.10, experimental support was added.
            // !semver.satisfies(keplr.version, ">=0.10.10")
          ) {
            // Can't suggest the chain on mobile web.
            return;
          }

          if (keplr instanceof KeplrWalletConnectV1) {
            // Still, can't suggest the chain using wallet connect.
            return;
          }

          await keplr.experimentalSuggestChain(chainInfo);
        },
        autoInit: false,
        getKeplr: getKeplr(),
      }
    )
  );

  createEffect(() => {
    console.log("wcUri length: ", wcUri().length);
  });

  return (
    <storeContext.Provider value={{ accountStore: accountStore() }}>
      <KeplrConnectionSelectModal
        isVisible={isExtensionSelectionModalOpen()}
        overrideWithKeplrInstallLink={
          isExtentionNotInstalled() ? "https://www.keplr.app/" : undefined
        }
        onDismiss={() => {
          eventEmitter().emit("extension_selection_modal_close");
        }}
        onSelectExtension={() => {
          eventEmitter().emit("select_extension");
        }}
        onSelectWalletConnect={() => {
          eventEmitter().emit("select_wallet_connect");
          console.log("emitted select wallet connect!");
        }}
      />
      <KeplrWalletConnectQRModal
        isVisible={wcUri().length > 0}
        onDismiss={() => {
          console.log("dismissing wc_modal");
          eventEmitter().emit("wc_modal_close");
        }}
        uri={wcUri()}
      />
      {/* <AccountInitManagement /> */}
      {props.children}
    </storeContext.Provider>
  );
};

export const useStore = () => {
  const store = useContext(storeContext);
  if (!store) {
    throw new Error("You have forgot to use StoreProvider");
  }
  return store;
};
