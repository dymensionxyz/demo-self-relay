const rpcA = "https://rpc-juno-ia.cosmosia.notional.ventures:443";
const rpcB = "https://rpc-osmosis-ia.cosmosia.notional.ventures:443";

const tmA = await Tendermint34Client.connect(rpcA);
const tmB = await Tendermint34Client.connect(rpcB);

const link = await IbcLink.createWithExistingConnections(
    await IbcClient.connectWithSigner(rpcA, offlineSignerA, addrA, {
        gasPrice: new GasPrice(Decimal.fromUserInput("0.025", 3), feeDenomA),
        logger,
    }),
    await IbcClient.connectWithSigner(rpcB, offlineSignerB, addrB, {
        gasPrice: new GasPrice(Decimal.fromUserInput("0.025", 3), feeDenomB),
        logger,
    }),
    cxnA,
    cxnB,
    logger
);


let packets = ...// from some source
let acks = await relayPackets(src, packets);
// can either relay the acks too, or just wait for user to do it

