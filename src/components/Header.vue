<template>
    <header>
        <a class="logo-header">
            <img src="../assets/png/xumm.png">
        </a>

        <!-- <label v-show="account">{{ `${account.slice(0, 4)}...${account.slice(-4)}` }}</label> -->
        <label v-show="account">{{ account }}</label>

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
            <li @click="signIn('ledger')">
                <img height="40" src="../assets/png/ledger.png">
            </li>
            <li @click="signIn('test')">
                Set Hardcoded account click here
            </li>
            <li @click="signIn('testnet')">
                TestNet account
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

import xummConnector from '../plugins/xumm-connector'
import ledgerConnector from '../plugins/ledger-hw-wallet-connector'

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
                    this.test('rJR4MQt2egH9AmibZ8Hu5yTKVuLPv1xumm')
                    break
                case 'testnet':
                    this.test('rLWQ9tsmrJJc9wUmHDaHNGzUNK7dGefRZk')
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
            const path = this.$router.currentRoute.value.fullPath
            console.log('path', path)
            xummConnector.authenticate(path)
        },
        async ledger() {
            try {
                const account = await ledgerConnector.init()
                this.$store.dispatch('setAccount', { account, provider: 'ledger' })
            } catch(e) {
                console.log(e)
            }
        },
        test(account) {
            this.$store.dispatch('setAccount', { account, provider: 'local' })
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
