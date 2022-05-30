<template>
    <div>
        Ledger signin
        <span>{{ message }}</span>
    </div>    
</template>

<script>
import client from '../../plugins/ws-client'
import ledgerConnector from '../../plugins/ledger-hw-wallet-connector'

export default {
    props: ['payload'],
    data() {
        return {
            message: null
        }
    },
    async mounted() {
        const txjson = { ...this.payload }
        txjson['Fee'] = '15'
        txjson['Sequence'] = this.$store.getters.getAccountInfo?.Sequence

        this.message = 'Please sign on your Ledger device'
        const tx_blob = await ledgerConnector.sign(txjson)

        this.message = 'Signed and submitted to the XRP Ledger, awaiting results...'
        console.warn('success signing:', tx_blob)
        const res = await client.send({
            command: 'submit',
            tx_blob: tx_blob
        })

        console.log('submit result with ledger HW wallet:', res)
        const txResult = res.engine_result
        const txid = res.tx_json.hash

        if(txResult !== 'tesSUCCESS') return this.message = 'Error with TX: ' + txResult

        const tx = (hash) => {
            return new Promise(async (resolve, reject) => {
                client.on('transaction', tx => {
                    if(tx.transaction.hash === hash) {
                        resolve(tx)
                    }
                })
            })
        }
        const finalTransactionResult = await tx(txid)
        
        if(finalTransactionResult.engine_result !== 'tesSUCCESS') return this.message = finalTransactionResult.engine_result
        else {
            this.message = 'success tx result'
        }

    }
}
</script>

<style scoped>

</style>
