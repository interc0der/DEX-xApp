<template>
    <div class="row header" style="margin-top: 0;">
        <div class="row">
            <a @click="selectActive = true" class="currency-pair-select-btn">{{ currencyCodeFormat(currencyPair.base.currency) }}/{{ currencyCodeFormat(currencyPair.quote.currency) }}
                <fa size="xs" :icon="['fas', 'chevron-down']"/>
            </a>
            <Ticker />
        </div>
        <div class="account-selector">
            <label class="number">
                <span class="dot" :style="{ 'background-color': online ? 'green' : 'red' }"></span>
                {{ `${account.slice(0, 4)}...${account.slice(-4)}` }}
            </label>
            <SpinnerButton @click.prevent="signin()" style="font-size: 1rem;">
                <fa :icon="['fas', 'sign-in-alt']"/>
            </SpinnerButton>
        </div>
    </div>
    <Select v-show="selectActive" @close="selectActive = false"/>
</template>

<script>
import xapp from '../plugins/xapp'
import client from '../plugins/ws-client'
import { currencyCodeFormat } from '../plugins/number-format'

import Select from '@/components/Select.vue'
import SpinnerButton from '@/components/SpinnerButton.vue'
import Ticker from './Ticker.vue'

export default {
    components: { Select, SpinnerButton, Ticker },
    data() {
        return {
            selectActive: false,
            online: true
        }
    },
    computed: {
        currencyPair() {
            return this.$store.getters.getCurrencyPair
        },
        account() {
            return this.$store.getters.getAccount
        }
    },
    methods: {
        currencyCodeFormat(string, maxLength) {
            return currencyCodeFormat(string, maxLength)
        },
        async signin() {
            // Delete for testing only
            if(typeof window.ReactNativeWebView === 'undefined') {
                const account = this.$store.getters.getAccount === 'rLWQ9tsmrJJc9wUmHDaHNGzUNK7dGefRZk' ? 'rLyYk3V8siKuUSyHrBfHXnEx7YxhatgmyC' : 'rLWQ9tsmrJJc9wUmHDaHNGzUNK7dGefRZk'
                if(this.$store.getters.getAccount === account) throw { msg: 'Same account', error: false }

                client.send({
                    command: 'unsubscribe',
                    accounts: [this.$store.getters.getAccount]
                })

                this.$store.dispatch('setAccount', account)
                client.send({
                    command: 'subscribe',
                    accounts: [account]
                })
                return
            }
            
            // END 

            try {
                const result = await xapp.signPayload({
                    txjson: {
                        TransactionType: "SignIn"
                    }
                })
                const account = result.data.response.account
                if(this.$store.getters.getAccount === account) throw { msg: 'Same account', error: false }

                client.send({
                    command: 'unsubscribe',
                    accounts: [this.$store.getters.getAccount]
                })

                this.$store.dispatch('setAccount', account)

                client.send({
                    command: 'subscribe',
                    accounts: [account]
                })

            } catch(e) {
                if(e.error !== false) {
                    this.$emitter.emit('modal', {
                        type: 'error',
                        title: this.$t('xapp.error.modal_title'),
                        text: this.$t('xapp.error.signin'),
                        buttonText: this.$t('xapp.button.close')
                    })
                }
            }
        }
    },
    mounted() {
        setInterval(() => {
            this.online = client.getState().online
        }, 500)
    }
}
</script>

<style scoped>
.currency-pair-select-btn {
    color: var(--var-txt-color);
    font-weight: 600;
    text-align: start;
    padding: 5px 10px;
}
.account-selector {
    display: flex;
    flex-direction: row;
    align-items: center;
    color: var(--var-txt-color);
    font-size: 0.9rem;
    font-weight: 600;
    margin-right: 5px;
}
.account-selector label {
    margin-right: 5px;
}
</style>