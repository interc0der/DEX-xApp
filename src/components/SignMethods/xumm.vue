<template>
    <div>
        Sign with XUMM {{ message }}
    </div>
</template>

<script>
import xummConnector from '../../plugins/xumm-connector'

export default {
    props: ['payload'],
    data() {
        return {
            message: null
        }
    },
    methods: {
        socket(wss) {
            const self = this

            return new Promise((resolve, reject) => {
                const socket = new WebSocket(wss)

                socket.onopen = function (event) {
                    console.log('on open')
                    self.message = 'open'
                }

                socket.onmessage = function (event) {
                    const msg = JSON.parse(event.data)
                    console.log('msg', msg)

                    if(msg.opened) {
                        self.message = 'Opened in XUMM'
                    }
                    if(msg.hasOwnProperty('signed') && !msg.signed) reject()
                    if(msg.hasOwnProperty('signed') && msg.signed) {
                        self.message = 'Signed awaiting confirmation'
                    }
                    if(msg.hasOwnProperty('txid') && msg.signed) {
                        console.log('todo: get the transaction information and either show in the modal or just close' + msg.txid)
                        socket.close()
                        resolve(msg.txid)
                    }                    
                }
            })
        }
    },
    async mounted() {
        const status = await xummConnector.sendToSign({ txjson: this.payload })
        console.log(status.refs.websocket_status)

        try {
            await this.socket(status.refs.websocket_status)
            this.message = 'signed TX result is:'
        } catch(e) {
            this.message = 'Rejected transaction'
            console.error('rejected signing xumm:', e)
        }
    }
}
</script>

<style scoped>

</style>
