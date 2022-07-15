import { useStore } from "./index";
import { KeplrWalletConnectV1 } from "@keplr-wallet/wc-client";
import {
  Component,
  createMemo,
  createEffect,
  createSignal,
  JSXElement,
  on,
  onMount,
} from "solid-js";
import junoChainInfo from "../juno";
import { getKeplrFromWindow } from "./get-keplr";
import { WalletStatus } from "../Account";

type Props = {
  children?: JSXElement;
};

/** Manages the initialization of the Osmosis account. */
export const AccountInitManagement: Component<Props> = (props) => {
  const accountHasInit = useStore().accountHasInit;
  const connectionType = useStore().connectionType;
  const chainInfo = createMemo(() => junoChainInfo);
  const walletStatus = useStore().walletStatus;

  onMount(() => {
    // Initially, try to get keplr from window, and keplr's mode is "mobile-web",
    // it means that user enters the website via keplr app's in app browser.
    // And, it means explicitly press the osmosis button on the keplr's dApps introduction page.
    // So, try to init account immediately.
    getKeplrFromWindow().then((keplr) => {
      if (keplr && keplr.mode === "mobile-web") {
        useStore().init();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // Init Osmosis account w/ desired connection type (wallet connect, extension)
  // if prev connected Keplr in this browser.
  onMount(() => {
    if (typeof localStorage !== "undefined") {
      const value = localStorage.getItem("account_auto_connect");
      if (value) {
        if (value === "wallet-connect") {
          useStore().setDefaultConnectionType("wallet-connect");
        } else {
          useStore().setDefaultConnectionType("extension");
        }
        useStore().init();
      }
    }
  });

  let listenWCDisconnectEventOnce: boolean = false;

  // MOVED TO KEPLR PROVIDER
  // createEffect(
  //   on(walletStatus, (walletStatus) => {
  //     if (walletStatus === WalletStatus.Loaded) {
  //       useStore().then((keplr: any) => {
  //         // For WalletConnect, all accounts are released at "disconnect" event
  //         // TODO: Disconnection of WalletConnect is handled here,
  //         //       but most of the logic for WalletConnect is in the `useKeplr()` hook.
  //         //       WalletConnect related logic should be modified so that it can be in one place.
  //         if (keplr instanceof KeplrWalletConnectV1) {
  //           if (!listenWCDisconnectEventOnce) {
  //             listenWCDisconnectEventOnce = true;

  //             keplr.connector.on("disconnect", () => {
  //               accountStore.disconnect();
  //             });
  //           }
  //         }
  //       });
  //     }
  //   })
  // );

  // React to changes in Osmosis account state; store desired connection type in browser
  // clear Keplr sessions, disconnect account.
  createEffect(
    on(
      [walletStatus, accountHasInit, connectionType],
      ([walletStatus, accHasInit, connectionType]) => {
        if (walletStatus === WalletStatus.Loaded) {
          useStore().setAccountHasInit(true);
          if (typeof localStorage !== "undefined") {
            const value =
              connectionType === "wallet-connect"
                ? "wallet-connect"
                : "extension";
            localStorage.setItem("account_auto_connect", value);
          }
        }

        if (accHasInit && walletStatus === WalletStatus.NotInit) {
          useStore().setAccountHasInit(false);
          if (typeof localStorage !== "undefined") {
            localStorage.removeItem("account_auto_connect");
          }
          useStore()
            .getKeplr()()
            .then((keplrAPI) => {
              if (keplrAPI && keplrAPI instanceof KeplrWalletConnectV1) {
                keplrAPI.connector.killSession().catch((e) => {
                  console.log(e);
                });
              }

              useStore().clearLastUsedKeplr();
              useStore().setDefaultConnectionType(undefined);
            });
        }

        if (
          walletStatus === WalletStatus.Rejected ||
          walletStatus === WalletStatus.NotExist
        ) {
          useStore().disconnect();
        }
      }
    )
  );

  return <>{props.children}</>;
};
