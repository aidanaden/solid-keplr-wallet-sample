import {
  isMobile as isMobileWC,
  isAndroid,
  saveMobileLinkInfo,
} from "@walletconnect/browser-utils";
import { QRCodeSVG } from "solid-qr-code";
import { Component, createEffect, createMemo, on } from "solid-js";

import Modal, { ModalProps } from "./base";
import { useWindowSize } from "../hooks/window";

type Props = ModalProps & {
  uri: string;
};

export const KeplrWalletConnectQRModal: Component<Props> = (props) => {
  // Below is used for styling for mobile device.
  // Check the size of window.
  const { isMobile } = useWindowSize(undefined);

  // Below is used for real mobile environment.
  // Check the user agent.
  const checkMobile = createMemo(() => isMobileWC());
  const checkAndroid = createMemo(() => isAndroid());

  const navigateToAppURL = createMemo(() => {
    if (!props.uri) {
      return;
    }

    if (checkMobile()) {
      if (checkAndroid()) {
        // Save the mobile link.
        saveMobileLinkInfo({
          name: "Keplr",
          href: "intent://wcV1#Intent;package=com.chainapsis.keplr;scheme=keplrwallet;end;",
        });

        return `intent://wcV1?${props.uri}#Intent;package=com.chainapsis.keplr;scheme=keplrwallet;end;`;
      } else {
        // Save the mobile link.
        saveMobileLinkInfo({
          name: "Keplr",
          href: "keplrwallet://wcV1",
        });

        return `keplrwallet://wcV1?${props.uri}`;
      }
    }
  });

  createEffect(
    on(navigateToAppURL, (appUrl) => {
      // Try opening the app without interaction.
      if (appUrl) {
        window.location.href = appUrl;
      }
    })
  );

  return (
    <Modal isVisible={props.isVisible} onDismiss={props.onDismiss}>
      {props.uri ? (
        !checkMobile() ? (
          (() => {
            return (
              <div class="bg-white-high p-3.5 md:mx-auto md:full">
                <QRCodeSVG size={isMobile ? 290 : 480} value={props.uri} />
              </div>
            );
          })()
        ) : (
          <button
            class="my-3 py-4"
            onClick={() => {
              if (navigateToAppURL()) {
                window.location.href = navigateToAppURL();
              }
            }}
          >
            Open App
          </button>
        )
      ) : undefined}
    </Modal>
  );
};
