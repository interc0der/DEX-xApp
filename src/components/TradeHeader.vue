<template>
    <!-- <div class="row header padding">
        <h6>
            <span class="dot" :style="{ 'background-color': online ? 'green' : 'red' }"></span>
            {{ account }}
        </h6>
        <SpinnerButton @click.prevent="signin()" style="margin-left: auto;">
            <fa :icon="['fas', 'sign-in-alt']"/>
        </SpinnerButton>
    </div> -->
    <div class="row header" style="margin-top: 0;">
        <div class="column">
            <a @click="selectActive = true" id="currency-pair-select-btn">{{ currencyCodeFormat(currencyPair.base.currency) }}/{{ currencyCodeFormat(currencyPair.quote.currency) }}
                <fa size="xs" :icon="['fas', 'chevron-down']"/>
            </a>
        </div>
        <div class="account-selector">
            <label class="number">
                <span class="dot" :style="{ 'background-color': online ? 'green' : 'red' }"></span>
                {{ account }}
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

export default {
    components: { Select, SpinnerButton },
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
        async setAccountData(account) {
            
        },
        async signin() {
            // Delete for testing only
            if(typeof window.ReactNativeWebView === 'undefined') {
                const account = this.$store.getters.getAccount === 'rJR4MQt2egH9AmibZ8Hu5yTKVuLPv1xumm' ? 'rLyYk3V8siKuUSyHrBfHXnEx7YxhatgmyC' : 'rJR4MQt2egH9AmibZ8Hu5yTKVuLPv1xumm'
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
#currency-pair-select-btn {
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
    font-size: 0.7rem;
    font-weight: 600;
    margin-right: 5px;
}
.account-selector label {
    margin-right: 5px;
}
</style>