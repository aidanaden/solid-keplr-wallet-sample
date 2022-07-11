import { ChainInfo } from "@keplr-wallet/types";
import {
  assertIsDeliverTxSuccess,
  SigningStargateClient,
} from "@cosmjs/stargate";

import {
  Card,
  InputGroup,
  Button,
  Form,
  Stack,
  Container,
} from "solid-bootstrap";

import "bootstrap/dist/css/bootstrap.min.css";
import junoChainInfo from "./juno";
import osmoChainInfo from "./osmo";
import { onMount } from "solid-js";
import { StoreProvider, useStore } from "./store";

const App = () => {
  const openWallet = async (chainInfo: any) => {
    if (!(window as any).getOfflineSigner || !(window as any).keplr) {
      alert("Please install keplr extension");
      return;
    }

    try {
      if (!(window as any).keplr?.experimentalSuggestChain) {
        return;
      }

      (window as any).keplr!.defaultOptions = {
        sign: {
          preferNoSetFee: false,
          preferNoSetMemo: false,
        },
      };

      // one more check to connect wallet.
      await (window as any).keplr?.enable(chainInfo.chainId);
    } catch (error) {
      // In case, reject to add firmachain info to the extension
      alert("error : " + error);
    }
  };

  const getAddress = async (chainInfo: ChainInfo) => {
    alert(`address for ${chainInfo.chainName} : ${accountStore.address}`);
  };

  // const signSomething = (chainInfo: any) => {
  //   return;
  // };

  // const onSubmit = (e: any, chainInfo: any) => {
  //   return;
  // };

  const signSomething = async (chainInfo: ChainInfo) => {
    const LOGIN_PHRASE = "WARNING: sign this message ONLY on coinhall.org!";
    const isValid = await accountStore.signMsg(LOGIN_PHRASE);

    if (isValid) {
      alert("Wallet address registration completed.");
    } else {
      alert("Wallet address registration failed.");
    }

    // if (!(window as any).getOfflineSigner || !(window as any).keplr) {
    //   alert("Please install keplr extension");
    //   return;
    // }

    // try {
    //   await (window as any).keplr?.enable(chainInfo.chainId);

    //   const offlineSigner = (window as any).getOfflineSigner?.(
    //     chainInfo.chainId
    //   );
    //   const accounts = await offlineSigner.getAccounts();
    //   const address = accounts[0].address;

    //   const LOGIN_PHRASE = "WARNING: sign this message ONLY on coinhall.org!";
    //   const bytes = Buffer.from("3936a4db-1d18-4cb6-8274-bccb1541f021");
    //   const certificateData = LOGIN_PHRASE + bytes;

    //   const signatureResult = await (window as any).keplr?.signArbitrary(
    //     chainInfo.chainId,
    //     address,
    //     certificateData
    //   );

    //   // true or false
    //   const isMatched = await (window as any).keplr?.verifyArbitrary(
    //     chainInfo.chainId,
    //     address,
    //     certificateData,
    //     signatureResult!
    //   );

    //   if (isMatched) {
    //     console.log("bytes: ", bytes.toString("base64"));
    //     console.log(
    //       "pub key base64: ",
    //       Buffer.from(signatureResult.pub_key.value).toString("base64")
    //     );
    //     console.log(
    //       "signature base64: ",
    //       Buffer.from(signatureResult.signature).toString("base64")
    //     );

    //     console.log("pub key: ", signatureResult.pub_key);
    //     console.log("signature: ", signatureResult.signature);

    //     alert("Wallet address registration completed.");
    //   } else {
    //     alert("Wallet address registration failed.");
    //   }
    // } catch (error) {
    //   alert("Wallet address registration failed : " + error);
    // }
  };

  const loginViaPost = () => {};

  const onSubmit = (e: any, chainInfo: ChainInfo) => {
    // let recipient = document.sendForm.recipient.value;
    // let amount = document.sendForm.amount.value;
    e.preventDefault();

    const target = e.target as typeof e.target & {
      recipient: { value: string };
      amount: { value: string };
    };

    const recipient = target.recipient.value;
    const amt = target.amount.value;
    console.log("recipient: ", recipient);
    console.log("amt: ", amt);
    // let memo = document.sendForm.memo.value;

    let amount = parseFloat(amt);
    if (isNaN(amount)) {
      alert("Invalid amount");
      return false;
    }

    amount *= 1000000;
    amount = Math.floor(amount);

    (async () => {
      // See above.
      await (window as any).keplr?.enable(chainInfo.chainId);
      const offlineSigner = await (window as any)?.getOfflineSignerAuto?.(
        chainInfo.chainId
      );
      const accounts = await offlineSigner!.getAccounts();

      const client = await SigningStargateClient.connectWithSigner(
        chainInfo.rpc,
        offlineSigner!
      );

      const amountFinal = {
        denom: chainInfo.stakeCurrency.coinMinimalDenom,
        amount: amount.toString(),
      };

      const fee = {
        amount: [
          {
            denom: chainInfo.stakeCurrency.coinMinimalDenom,
            amount: "5000",
          },
        ],
        gas: "200000",
      };

      const result = await client.sendTokens(
        accounts[0].address,
        recipient,
        [amountFinal],
        fee,
        ""
      );
      assertIsDeliverTxSuccess(result);

      if (result.code !== undefined && result.code !== 0) {
        alert("Failed to send tx: " + result.rawLog);
      } else {
        alert("Succeed to send tx:" + result.transactionHash);
      }
    })();

    return false;
  };

  onMount(() => {
    window.addEventListener("keplr_keystorechange", () => {
      alert(
        "Key store in Keplr is changed. You may need to refetch the account info."
      );
    });
  });

  const { accountStore } = useStore();

  return (
    <Container>
      <div class="row">
        <div class="col p-5">
          <img
            src="keplr-logo.png"
            alt=""
            style={{ maxWidth: "200px", margin: "auto", display: "block" }}
          />
        </div>
      </div>
      <Stack gap={5}>
        <Card>
          <Card.Header>Connect Juno wallet</Card.Header>
          <Card.Body>
            <Button
              type="submit"
              variant="primary"
              // onClick={() => openWallet(junoChainInfo)}
              onClick={() => accountStore.init()}
            >
              Connect kepler
            </Button>
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>Get Juno wallet address</Card.Header>
          <Card.Body>
            <Button
              type="submit"
              variant="primary"
              onClick={() => getAddress(junoChainInfo)}
            >
              Get address
            </Button>
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>Sign something on Juno</Card.Header>
          <Card.Body>
            <Button
              type="submit"
              variant="primary"
              onClick={() => signSomething(junoChainInfo)}
            >
              Sign
            </Button>
          </Card.Body>
        </Card>
        {/* <Card>
          <Card.Header>Send coin(s) on Juno</Card.Header>
          <Card.Body>
            <b>Address:</b>
            <div id="address"></div>
            <Form name="sendForm" onSubmit={(e) => onSubmit(e, junoChainInfo)}>
              <Stack gap={3}>
                <Form.Group>
                  <label for="recipient">Recipient</label>
                  <Form.Control id="recipient" name="recipient" />
                </Form.Group>
                <Form.Group>
                  <label for="amount">Amount</label>
                  <InputGroup>
                    <Form.Control id="amount" name="amount" />
                    <InputGroup.Text>JUNO</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
                <Button type="submit" variant="primary">
                  Submit
                </Button>
              </Stack>
            </Form>
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>Connect Osmosis wallet</Card.Header>
          <Card.Body>
            <Button
              type="submit"
              variant="primary"
              onClick={() => openWallet(osmoChainInfo)}
            >
              Connect kepler
            </Button>
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>Get Osmosis wallet address</Card.Header>
          <Card.Body>
            <Button
              type="submit"
              variant="primary"
              onClick={() => getAddress(osmoChainInfo)}
            >
              Get address
            </Button>
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>Sign Something on Osmosis</Card.Header>
          <Card.Body>
            <Button
              type="submit"
              variant="primary"
              onClick={() => signSomething(osmoChainInfo)}
            >
              Sign
            </Button>
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>Send Coin on Osmosis</Card.Header>
          <Card.Body>
            <b>Address:</b>
            <div id="address"></div>
            <Form name="sendForm" onSubmit={(e) => onSubmit(e, osmoChainInfo)}>
              <Stack gap={3}>
                <Form.Group>
                  <label for="recipient">Recipient</label>
                  <Form.Control id="recipient" name="recipient" />
                </Form.Group>
                <Form.Group>
                  <label for="amount">Amount</label>
                  <InputGroup>
                    <Form.Control id="amount" name="amount" />
                    <InputGroup.Text>OSMO</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
                <Button type="submit" variant="primary">
                  Submit
                </Button>
              </Stack>
            </Form>
          </Card.Body>
        </Card> */}
      </Stack>
    </Container>
  );
};

export default App;
