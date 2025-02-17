import {IbcClient, Link} from "@confio/relayer";
import {Tendermint34Client} from "@cosmjs/tendermint-rpc";
import {OfflineSigner} from "@cosmjs/proto-signing";
import {GasPrice} from "@cosmjs/stargate";
import {Decimal} from "@cosmjs/math";
import {Packet} from "cosmjs-types/ibc/core/channel/v1/channel";
import {PacketWithMetadata} from "@confio/relayer/build/lib/endpoint";

const rpcA = "https://rpc-juno-ia.cosmosia.notional.ventures:443";
const rpcB = "https://rpc-osmosis-ia.cosmosia.notional.ventures:443";

const tmA = await Tendermint34Client.connect(rpcA);
const tmB = await Tendermint34Client.connect(rpcB);


function getSigner(): OfflineSigner {
    /*
    Just need to implement

        export interface OfflineDirectSigner {
            readonly getAccounts: () => Promise<readonly AccountData[]>;
            readonly signDirect: (signerAddress: string, signDoc: SignDoc) => Promise<DirectSignResponse>;
        }


    OR

        export interface OfflineAminoSigner {

             * Get AccountData array from wallet. Rejects if not enabled.
            readonly getAccounts: () => Promise<readonly AccountData[]>;

             * Request signature from whichever key corresponds to provided bech32-encoded address. Rejects if not enabled.
             *
             * The signer implementation may offer the user the ability to override parts of the signDoc. It must
             * return the doc that was signed in the response.
             *
             * @param signerAddress The address of the account that should sign the transaction
             * @param signDoc The content that should be signed

            readonly signAmino: (signerAddress: string, signDoc: StdSignDoc) => Promise<AminoSignResponse>;
        }
    */

    // see https://github.com/dymensionxyz/portal/blob/main/src/modules/wallet/wallets/ethereum-wallet.ts#L112-L125
    // I see getOfflineSigner is already implemented for several wallets in portal
}

const addrA = " 0xc48aa6af9b849541920dcc1f47b0be624cea3b3d"
const addrB = " 0xc48aa6af9b849541920dcc1f47b0be624cea3b3d"

const signerA = getSigner();
const signerB = getSigner();

const gasA = "adym"
const gasB = "arol"

const connA = "connection-60" // can be queried if necessary by nodeA.query.ibc.connection.connections (might need to page)
const connB = "connection-42" // can be queried if necessary by nodeB.query.ibc.connection.connections (might need to page)

const link = await Link.createWithExistingConnections(
    await IbcClient.connectWithSigner(rpcA, signerA, addrA, {
        gasPrice: new GasPrice(Decimal.fromUserInput(1, 2), gasA),
    }),
    await IbcClient.connectWithSigner(rpcB, signerB, addrB, {
        gasPrice: new GasPrice(Decimal.fromUserInput(1, 2), gasB),
    }),
    connA,
    connB,
);


async function sendPackets(link: Link, packets: PacketWithMetadata[]){
    let h = await link.endA.client.tm.status().then(s => s.syncInfo.latestBlockHeight);
    let [timedOut, ok] = partition(packets, p => isTimedOut(p.packet, h));
    await link.timeoutPackets("A", timedOut);
    let acks = await link.relayPackets("A", packets);
    await link.relayAcks("A", acks);
}

function isTimedOut(p :Packet, dstHeight: number){
    let now = Date.now(); // convert to appropriate representation
    return p.timeoutTimestamp > now || dstHeight > p.timeoutHeight.revisionHeight
}


////////////////////////////////////////////////////////////////////////////////////

{
    let packets = await link.getPendingPackets("A");
    let acks = await link.relayPackets("A", packets);
    await link.relayAcks("A", acks);

    // if necessary:
    let h = await link.endA.client.tm.status().then(s => s.syncInfo.latestBlockHeight);
    await link.timeoutPackets("A", packets.filter(p => isTimedOut(p.packet, h)));
}