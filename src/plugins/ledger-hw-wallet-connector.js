import { listen } from "@ledgerhq/logs"
import TransportWebUSB from "@ledgerhq/hw-transport-webusb"
import AppXrp from "@ledgerhq/hw-app-xrp"
import { encode } from 'ripple-binary-codec'

let transport
let ledger
const path = "44'/144'/0'/0/0"

let pubKey

const init = async () => {
    transport = await TransportWebUSB.create()
    listen(log => console.log(log))
    ledger = new AppXrp(transport)

    const { publicKey, address } = await ledger.getAddress(path)
    pubKey = publicKey
    return address
}

const sign = async txjson => {
    txjson['SigningPubKey'] = pubKey.toUpperCase()

    // todo fix bug with flags
    delete txjson.Flags

    const signature = await ledger.signTransaction(path, encode(txjson))
    txjson['TxnSignature'] = signature
    const signedTx = encode(txjson)
    return signedTx
}

export default {
    init,
    sign
}
