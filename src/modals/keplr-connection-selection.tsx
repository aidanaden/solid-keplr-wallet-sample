import { Component } from "solid-js";
import Modal, { ModalProps } from "./base";

type Props = ModalProps & {
  overrideWithKeplrInstallLink?: string;
  onSelectExtension: () => void;
  onSelectWalletConnect: () => void;
};

const KeplrConnectionSelectModal: Component<Props> = (props) => (
  <Modal
    isVisible={props.isVisible}
    onDismiss={props.onDismiss}
    class="max-w-[30.625rem]"
  >
    {props.overrideWithKeplrInstallLink ? (
      <button
        class="bg-background rounded-2xl p-5 flex items-center"
        onClick={(e) => {
          e.preventDefault();
          (window as any).open(props.overrideWithKeplrInstallLink, "_blank");
        }}
      >
        <img
          src="../images/keplr-logo.png"
          alt="keplr logo"
          width={64}
          height={64}
        />
        <div class="flex flex-col text-left ml-5">
          <div class="flex items-center gap-2">
            <h6>Install Keplr</h6>
            <img
              src="/icons/external-link-white.svg"
              alt="external link"
              width={14}
              height={14}
            />
          </div>
          <p class="body2 text-iconDefault mt-1">
            {props.overrideWithKeplrInstallLink}
          </p>
        </div>
      </button>
    ) : (
      <button
        class="bg-background rounded-2xl p-5 flex items-center"
        onClick={(e) => {
          e.preventDefault();
          props.onSelectExtension();
        }}
      >
        <img
          src="../images/keplr-logo.png"
          alt="keplr logo"
          width={64}
          height={64}
        />
        <div class="flex flex-col text-left ml-5">
          <h6>Keplr Wallet</h6>
          <p class="body2 text-iconDefault mt-1">Keplr Browser Extension</p>
        </div>
      </button>
    )}
    <button
      class="bg-background rounded-2xl p-5 flex items-center mt-5"
      onClick={(e) => {
        e.preventDefault();
        props.onSelectWalletConnect();
      }}
    >
      <img
        src="../images/wallet-connect-logo.png"
        alt="wallet connect logo"
        width={64}
        height={64}
      />
      <div class="flex flex-col text-left ml-5">
        <h6>WalletConnect</h6>
        <p class="body2 text-iconDefault mt-1">Keplr Mobile</p>
      </div>
    </button>
    <div class="mt-5 p-5 rounded-2xl bg-card">
      <p class="caption text-white-mid">
        By connecting a wallet, you acknowledge that you have read and
        understand the Osmosis{" "}
        <a
          href="/disclaimer"
          class="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Protocol Disclaimer
        </a>
        .
      </p>
    </div>
  </Modal>
);

export default KeplrConnectionSelectModal;
