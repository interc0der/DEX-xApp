<template>
    <PopUp v-if="popupActive" @close="closeModal">
        <Xumm v-if="provider === 'xumm'" :payload="payload"/>
        <Ledger v-else-if="provider === 'ledger'" :payload="payload"/>
        <div v-else>
            Unknown provider: {{ provider }}
        </div>
    </PopUp>
</template>

<script>
import xapp from '../../plugins/xapp'

import PopUp from '../PopUp.vue'
import Xumm from './xumm.vue'
import Ledger from './ledger.vue'

export default {
    components: {
        PopUp,
        Xumm,
        Ledger
    },
    data() {
        return {
            popupActive: false,
            payload: null
        }
    },
    created() {
        this.$emitter.on('signModalOpen', payload => {
            if(process.env.VUE_APP_ENV === 'WEB') {
                this.payload = payload
                this.popupActive = true
            } else {
                xapp.signPayload(txjson)
            }
        })
    },
    computed: {
        provider() {
            return this.$store.getters.getAccountSignProvider
        }
    },
    methods: {
        closeModal() {
            this.popupActive = false
            this.payload = null
        }
    }
}
</script>