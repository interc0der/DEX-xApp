<template>
    <header>
        <a class="logo-header">
            <img src="../assets/png/xumm.png">
        </a>

        <label v-show="account">{{ `${account.slice(0, 4)}...${account.slice(-4)}` }}</label>

        <!-- <div class="navbar-items">
            <div class="navbar-item">Buy Crypto</div>
            <div class="navbar-item">Markets</div>
            <div class="navbar-item">Trade</div>
            <div class="navbar-item">Finance</div>
        </div> -->

        <div class="signin-button">
            <a @click="popupActive = true" class="btn btn-primary">SignIn</a>
        </div>

        <div class="options">
            <a>
                <fa :icon="['fas', 'bars']" />
            </a>
            <a>
                <fa :icon="['fas', 'cog']" />
            </a>
            <a>
                <fa :icon="['fas', 'question-circle']" />
            </a>
        </div>
    </header>
    <PopUp v-if="popupActive" @close="popupActive = false">
        <ul>
            <li @click="signIn('xumm')">
                <SignInBtn height="40px"/>
            </li>
            <li @click="signIn('test')">
                Set Hardcoded account click here
            </li>
            <li @click="signIn('ledger')">
                <img height="40" src="../assets/png/ledger.png">
            </li>
        </ul>
        <!-- <component :is="comp" /> -->
    </PopUp>
</template>

<script>
import client from '../plugins/ws-client'
import client2 from '../plugins/ws-client-secondary'

import PopUp from './PopUp.vue'

import SignInBtn from '../assets/svg/signinWithXumm.vue'

import { listen } from "@ledgerhq/logs"
import AppXrp from "@ledgerhq/hw-app-xrp"
import TransportWebUSB from "@ledgerhq/hw-transport-webusb"

export default {
    components: {
        PopUp,
        SignInBtn
    },
    data() {
        return {
            popupActive: false,
            // comp: NodeSelect
        }
    },
    computed: {
        account() {
            return this.$store.getters.getAccount
        }
    },
    methods: {
        async signIn(provider) {
            switch(provider) {
                case 'test':
                    this.test()
                    break
                case 'xumm':
                    await this.xumm()
                    break
                case 'ledger':
                    await this.ledger()
                    break
            }

            return

            try {
                client.send({
                    command: 'subscribe',
                    accounts: [this.$store.getters.getAccount]
                })
            } catch(e) {
                const error = this.$t('xapp.error.subscribe_to_account')
                alert(error)
                // todo alert
            }

            client.on('transaction', tx => {
                this.$store.dispatch('parseTx', { transaction: tx, notify: true })
                
            })

            client2.on('transaction', tx => {
                this.$store.dispatch('parseOrderBookChanges', { tx, emitter: this.$emitter })
            })

        },
        async xumm() {
            const url = 'https://oauth2.xumm.app/auth'
            const api = process.env.VUE_APP_XAPP_KEY_WEB
            const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) //random string

            const qstring = new URLSearchParams({
                client_id: api,
                redirect_uri: 'http://192.168.1.102:8080/auth',
                scope: 'somescope',
                response_type: 'token',
                response_mode: 'query',
                state: '6a4fr0a09un',
                nonce: nonce
            })
            window.open(`${url}?${qstring}`)
        },
        async ledger() {
            try {
                const transport = await TransportWebUSB.create()
                listen(log => console.log(log))
                const appXrp = new AppXrp(transport)

                const { publicKey, address } = await appXrp.getAddress("44'/144'/0'/0/0")
                this.$store.dispatch('setAccount', address)
            } catch(e) {
                console.log(e)
            }
        },
        test() {
            // const account = 'rLWQ9tsmrJJc9wUmHDaHNGzUNK7dGefRZk'
            const account = 'rJR4MQt2egH9AmibZ8Hu5yTKVuLPv1xumm'
            this.$store.dispatch('setAccount', account)
        }
    }
}
</script>

<style scoped>
header {
    display: flex;
    flex-direction: row;
    /* justify-content: space-between; */
    align-items: center;
    width: 100%;
    height: 100%;
}
.logo-header {
    margin: 0 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.logo-header > img {
    max-height: 30px;
}
.navbar-items {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
.signin-button {
    margin-left: auto;
    margin-right: 20px;
}
.signin-button > a {
    padding: 0 10px;
}
.options {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    width: 100px;
    /* margin-left: auto; */
}
.options > a {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
}
.options > a > svg {
    margin: auto;
}

/* signin modal */
ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
}
li {
    cursor: pointer;
}
</style>
