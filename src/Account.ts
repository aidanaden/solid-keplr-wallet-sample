import { OfflineSigner, OfflineDirectSigner } from "@cosmjs/proto-signing";
import { ChainInfo, Keplr } from "@keplr-wallet/types";
import { Buffer } from "buffer";

export enum WalletStatus {
  NotInit = "NotInit",
  Loading = "Loading",
  Loaded = "Loaded",
  NotExist = "NotExist",
  Rejected = "Rejected",
}

export type MsgOpt = {
  readonly type: string;
  readonly gas: number;
};

export type AccountSetOpts = {
  readonly suggestChain: boolean;
  readonly suggestChainFn?: (
    keplr: Keplr,
    chainInfo: ChainInfo
  ) => Promise<void>;
  readonly autoInit: boolean;
  readonly getKeplr: () => Promise<Keplr | undefined>;
};

export class KeplrAccountBase {
  protected _walletVersion: string | undefined = undefined;
  protected _walletStatus: WalletStatus = WalletStatus.NotInit;
  protected _rejectionReason: Error | undefined;
  protected _name: string = "";
  protected _bech32Address: string = "";
  protected _txTypeInProgress: string = "";
  protected _address: string = "";
  protected pubKey: Uint8Array;
  protected offlineSigner: OfflineSigner | OfflineDirectSigner;
  protected hasInited = false;

  get walletVersion(): string | undefined {
    return this._walletVersion;
  }

  get isReadyToSendTx(): boolean {
    return (
      this.walletStatus === WalletStatus.Loaded && this.bech32Address !== ""
    );
  }

  get walletStatus(): WalletStatus {
    return this._walletStatus;
  }

  get rejectionReason(): Error | undefined {
    return this._rejectionReason;
  }

  get name(): string {
    return this._name;
  }

  get address(): string {
    return this._address;
  }

  get bech32Address(): string {
    return this._bech32Address;
  }

  /**
   * Returns the tx type in progress waiting to be committed.
   * If there is no tx type in progress, this returns an empty string ("").
   */
  get txTypeInProgress(): string {
    return this._txTypeInProgress;
  }

  constructor(
    protected readonly eventListener: {
      addEventListener: (type: string, fn: () => unknown) => void;
      removeEventListener: (type: string, fn: () => unknown) => void;
    },
    protected readonly chainInfos: ChainInfo[],
    protected readonly chainId: string,
    protected readonly opts: AccountSetOpts
  ) {
    this.pubKey = new Uint8Array();
    if (opts.autoInit) {
      this.init();
    }
  }

  getKeplr(): Promise<Keplr | undefined> {
    return this.opts.getKeplr();
  }

  protected async enable(keplr: Keplr, chainId: string): Promise<void> {
    const chainInfo = this.chainInfos.filter((ci) => ci.chainId === chainId)[0];

    if (this.opts.suggestChain) {
      if (this.opts.suggestChainFn) {
        await this.opts.suggestChainFn(keplr, chainInfo);
      } else {
        await this.suggestChain(keplr, chainInfo);
      }
    }
    await keplr.enable(chainId);
  }

  protected async suggestChain(
    keplr: Keplr,
    chainInfo: ChainInfo
  ): Promise<void> {
    await keplr.experimentalSuggestChain(chainInfo);
  }

  private readonly handleInit = () => this.init();

  public async init() {
    console.log("running init!");

    // If wallet status is not exist, there is no need to try to init because it always fails.
    if (this.walletStatus === WalletStatus.NotExist) {
      console.log("wallet status doesnt exist!");
      return;
    }

    // If the store has never been initialized, add the event listener.
    if (!this.hasInited) {
      // If key store in the keplr extension is changed, this event will be dispatched.
      this.eventListener.addEventListener(
        "keplr_keystorechange",
        this.handleInit
      );
    }
    this.hasInited = true;

    // Set wallet status as loading whenever try to init.
    this._walletStatus = WalletStatus.Loading;

    const keplr = await this.getKeplr();
    if (!keplr) {
      console.log("keplr doesnt exist!");
      this._walletStatus = WalletStatus.NotExist;
      return;
    }

    this._walletVersion = keplr.version;

    try {
      console.log("trying to enable with chain id: ", this.chainId);
      await this.enable(keplr, this.chainId);
    } catch (e) {
      console.error(e);
      this._walletStatus = WalletStatus.Rejected;
      this._rejectionReason = e;
      return;
    }

    try {
      console.log("trying to get key with chain id: ", this.chainId);
      const key = await keplr.getKey(this.chainId);
      this._bech32Address = key.bech32Address;
      this._name = key.name;
      this.pubKey = key.pubKey;

      // Set the wallet status as loaded after getting all necessary infos.
      this._walletStatus = WalletStatus.Loaded;
    } catch (e) {
      console.error(e);
      // Caught error loading key
      // Reset properties, and set status to Rejected
      this._bech32Address = "";
      this._name = "";
      this.pubKey = new Uint8Array(0);

      this._walletStatus = WalletStatus.Rejected;
      this._rejectionReason = e;
    }

    try {
      console.log("trying to get offlineSigner with chain id: ", this.chainId);
      const offlineSigner = await keplr.getOfflineSignerAuto(this.chainId);
      const accounts = await offlineSigner.getAccounts();

      this.offlineSigner = offlineSigner;
      this._address = accounts[0].address;
    } catch (e) {
      console.error(e);
      // Caught error loading offlineSigner
      // Reset properties, and set status to Rejected
      this.offlineSigner = undefined;

      this._walletStatus = WalletStatus.Rejected;
      this._rejectionReason = e;
    }

    if (this._walletStatus !== WalletStatus.Rejected) {
      // Reset previous rejection error message
      this._rejectionReason = undefined;
    }
  }

  public disconnect(): void {
    this._walletStatus = WalletStatus.NotInit;
    this.hasInited = false;
    this.eventListener.removeEventListener(
      "keplr_keystorechange",
      this.handleInit
    );
    this._bech32Address = "";
    this._name = "";
    this.pubKey = new Uint8Array(0);
  }

  public async signMsg(msg: string): Promise<boolean> {
    const keplr = await this.getKeplr();
    const bytes = Buffer.from(msg);

    const certificateData = msg + bytes;

    const accounts = await this.offlineSigner.getAccounts();
    const addr = accounts[0].address;
    const signatureResult = await keplr.signArbitrary(
      this.chainId,
      addr,
      certificateData
    );

    console.log("signature result: ", signatureResult);

    const isMatched = await keplr.verifyArbitrary(
      this.chainId,
      addr,
      certificateData,
      signatureResult
    );

    return isMatched;
  }
}
