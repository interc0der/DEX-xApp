<template>
    <div id="view" class="view-container">
        <div v-if="!ready" style="display: flex; width: 100%; height: 100%;">
            <Spinner style="margin: auto"/>
        </div>
        <Test v-else-if="!init" @passed="completedTest" />
        <Controller v-else />
        <Modal />
        <Alert />
        <div v-if="error" class="column h-100">
            <div id="failed-start" class="column">
                <fa :icon="['fas', 'exclamation-circle']" />
                <p>{{ error }}</p>
                <a @click="if($t('xapp.error.get_ott_data') === error) getTokenData(); else if($t('xapp.error.subscribe_to_account') === error) subscribe();" class="btn btn-primary">{{ $t("xapp.button.try_again") }}</a>
            </div>
        </div>
    </div>
</template>

<script>
import Controller from '@/views/Controller.vue'
import Alert from '@/components/Alert.vue'
import Spinner from '@/components/Spinner.vue'
import Modal from '@/components/Modal.vue'
import Test from '@/components/Test.vue'

import xapp from './plugins/xapp'
import client from './plugins/ws-client'

import client2 from './plugins/ws-client-secondary'

export default {
	name: 'App',
	components: {
        Alert,
        Spinner,
        Modal,
        Test,
        Controller
	},
	data() {
		return {
			init: false,
			ready: false,
			error: false
		}
	},
	computed: {
		account() {
			return this.$store.getters.getAccount
		}
	},
	methods: {
        async onboardingCheck() {
            let initSaved = false
            try {
                const dataresult = await xapp.getUserData('onboarding')
                if(dataresult?.onboarding?.init === true) {
                    this.init = true
                    return
                }
            } catch(e) {
                console.error('getting user data')
            }

            if(localStorage.getItem('onboarding')) {
                this.init = true

                if(!initSaved) {
                    try {
                        await xapp.setUserData('onboarding', { init: true })
                        // localStorage.removeItem('onboarding')
                    } catch(e) {
                        console.error('Error setting data into XUMM:', e)
                    }
                }
            }
        },
		async wsConnect(data) {
            try {
                if(!data) data = await xapp.getTokenData()
                await this.$store.dispatch('setNodeType', { type: data.nodetype || 'MAINNET', url: data.nodewss || 'wss://xrplcluster.com/'})
                this.$store.dispatch('setAccount', data.account)
                this.error = false
            } catch(e) {
                this.error = this.$t('xapp.error.subscribe_to_ledger')
                throw e
            }
        },
		async getTokenData() {
            try {
                const urlParams = new URLSearchParams(window.location.search)
                const ott = urlParams.get('xAppToken')
                const data = await xapp.getTokenData(ott)

                if(data.hasOwnProperty('currency') && data.hasOwnProperty('issuer')) {
                    if(String(data.base).toLowerCase() === 'true') {
                        this.$store.dispatch('changeCurrencyPair', { base: { currency: data.currency, issuer: data.issuer }, quote: { currency: 'XRP', issuer: null } })
                    } else {
                        this.$store.dispatch('changeCurrencyPair', { quote: { currency: data.currency, issuer: data.issuer } })
                    }
                } else if(data.hasOwnProperty('base') && data.hasOwnProperty('quote')) {
                    const payload = {}
                    // XUMM doesn't return the '+' sign it converts to a space: 
                    const baseSplitted = data.base.split(' ', 2)
                    const quoteSplitted = data.quote.split(' ', 2)

                    if(baseSplitted.length > 1) {
                        payload.base = {
                            currency: baseSplitted[0],
                            issuer: baseSplitted[1]
                        }
                    } else if(String(data.base).toUpperCase() === 'XRP') payload.base = 'XRP'

                    if(quoteSplitted.length > 1) {
                        payload.quote = {
                            currency: quoteSplitted[0],
                            issuer: quoteSplitted[1]
                        }
                    } else if(String(data.quote).toUpperCase() === 'XRP') payload.quote = 'XRP'
                    this.$store.dispatch('changeCurrencyPair', payload)
                }

                if(this.error === this.$t('xapp.error.get_ott_data')) {
                    this.error = false
                    try {
                        await this.wsConnect(data)
                        this.ready = true
                    } catch(e) {}
                }
                return data
            } catch(e) {
                this.error = this.$t('xapp.error.get_ott_data')
                throw e
            }
        },
		completedTest(bool) {
			if(!bool) return
			this.init = true
		},
        test() {
            // todo delete me
            console.warn('THIS IS DEVMODE')
            const account = 'rJR4MQt2egH9AmibZ8Hu5yTKVuLPv1xumm'
            // account: 'rpDpacp6FX4qXdaXHp8Tvt88CFewdCNEVw'
            // account: 'rLyYk3V8siKuUSyHrBfHXnEx7YxhatgmyC'
            // account: 'rLWQ9tsmrJJc9wUmHDaHNGzUNK7dGefRZk'
            // account: 'raS7yFXbzWMwsaPxdGjHN15XEdroZPq8Sg'
           
            const type = 'MAINNET'
            const wss = 'wss://xrplcluster.com' // 'wss://s.altnet.rippletest.net:51233' // 'wss://testnet.xrpl-labs.com'

            this.$store.dispatch('setNodeType', { type: type, url: wss})
            this.$store.dispatch('setAccount', account)
            this.ready = true
        }
	},
	async mounted() {
		try {
			if (typeof window.ReactNativeWebView === 'undefined') {
                this.test()
            } else {
                const data = await this.getTokenData()
                await this.wsConnect(data)                
            }
		} catch(e) { return }

        try {
            await this.onboardingCheck()
        } catch(e) {
            console.error('onboarding check',)
        }

        this.ready = true
	},
    beforeUnmount() {
        this.$emitter.all.clear()
    }
}
</script>

<style>
@import url('https://use.typekit.net/iqo4nny.css');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@600&display=swap');
@import URL('https://use.typekit.net/rav4uns.css');

#app {
	font-family: proxima-nova, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100%;
    overflow-y: auto;
}
.view-container {
    height: 100%;
    overflow: hidden;
    color: var(--var-txt-color);
    user-select: none;
}
#failed-start {
    align-items: center;
    margin: auto;
}
.number {
    font-family: 'IBM Plex Sans Condensed';
    font-family: din-2014, sans-serif;
    /* font-family: din-condensed,sans-serif; */
    font-variant-numeric: tabular-nums;
    font-weight: 400;
    font-style: normal;
    line-height: 1;
    white-space: nowrap;
}
.row {
    display: flex;
    flex-direction: row;
    width: 100%;
    margin: 5px 0;
    align-items: center;
}
.column {
    display: flex;
    flex-direction: column;
    width: 100%;
}
.h-100 {
    height: 100%;
}
.margin-0 {
    margin: 0 !important;
}
.btn {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: 35px;
    border-radius: 5px;
    width: 100%;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    text-align: center;
    color: var(--var-white);
}
.tabs-row {
    height: 30px;
    overflow-x: auto;
    overflow-y: hidden;
}
.tabs-row input {
    display: none;
}
.tabs-row label {
    display: inline-block;
    margin: 5px 10px;
    cursor: pointer;
}
.tabs-row input:checked + span {
    color: var(--var-txt-color);
    border-bottom: 1px solid var(--var-primary);
    transition: 0.5s ease;
}
.tabs-row input + span {
    color: var(--grey);
    transition: 0.5s ease;
}
fieldset {
    display: flex;
    align-items: center;
    margin-inline-start: 0;
    margin-inline-end: 0;
    padding-block-start: 0;
    padding-inline-start: 0;
    padding-inline-end: 0;
    padding-block-end: 0;
    min-inline-size: min-content;
    border-width: 0;
    border-style: none;
    border-color: rgba(255, 255, 255, 0);
    border-image: none;
}

/* TODO CLEAN */
.margin-input {
    margin-top: 2px !important;
}
.padding {
    margin: 0 5px;
    width: calc(100% - 10px) !important;
}
span.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: white;
    display: inline-block;
}
h3 {
    margin: 0;
    font-size: 16px;
}
h6 {
    margin: 0;
    font-size: 12px;
}
.align-end {
    text-align: end;
}
hr {
    /* display: block;
    unicode-bidi: isolate;
    margin-block-start: 0.5em;
    margin-block-end: 0.5em;
    margin-inline-start: auto;
    margin-inline-end: auto;
    overflow: hidden;
    border-style: solid;
    border-width: 1px; */
    margin: 0;
    border: 0;
    border-top: 1px solid var(--var-border);
    width: 100%;
}
.container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    align-items: center;
}
.btn-primary {
    background-color: var(--var-primary);
}
.btn-secondary {
    background-color: var(--var-secondary) !important;
    color: grey !important;
}
.btn-success {
    background-color: var(--green);
}
.btn-cancel {
    background-color: var(--red);
}
.btn-warning {
    background-color: var(--orange);
}
.header {
    margin: 0 10px;
    margin-bottom: 0 !important;
    text-align: center;
    color: var(--var-primary);
}
.input-error {
    border-color: red !important;
}
.input-label {
    width: 100%;
    text-align: center;
    padding: 0 10px;
    height: 30px;
    font-size: 1rem;
    border-radius: 5px;
    border: 1px solid var(--var-border);
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.input-label:focus-within {
    border: 1px solid var(--var-primary);
}
.input-label label {
    position: absolute;
    top: 0;
    right: 8px;
    bottom: 0;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    /* background-color: var(--var-bg-color); */
}
.input-label input {
    color: var(--var-txt-color);
    background-color: var(--var-bg-color);
    border: 0;
    padding: 0;
    /* text-align-last: center; */
    width: calc(100% - 8px);
    font-family: 'IBM Plex Sans Condensed';
    font-size: 1rem;
}
.input-label input:focus {
    outline: 0;
}
.input-label input::-webkit-input-placeholder {
    font-family: proxima-nova, sans-serif !important;
}
select {
    -webkit-appearance: none;
    /* text-align: center;
    text-align-last: center; */
    width: 100%;
    color: var(--var-txt-color);
    background-color: var(--var-bg-color);
    padding: 0 10px;
    height: 28px;
    font-size: 0.8rem;
    border-radius: 5px;
    border: 1px solid var(--var-border);
}
select.arrow {
    background-image:
        linear-gradient(45deg, transparent 50%, gray 50%),
        linear-gradient(135deg, gray 50%, transparent 50%);
    background-position:
        calc(100% - 20px) calc(1em + 2px),
        calc(100% - 15px) calc(1em + 2px);
    background-size:
        5px 5px,
        5px 5px;
    background-repeat: no-repeat;
}
select:focus {
    border: 1px solid var(--var-primary);
}
select.arrow:focus {
  background-image:
    linear-gradient(45deg, gray 50%, transparent 50%),
    linear-gradient(135deg, transparent 50%, gray 50%);
  background-position:
    calc(100% - 15px) 1em,
    calc(100% - 20px) 1em;
  background-size:
    5px 5px,
    5px 5px;
  background-repeat: no-repeat;
  outline: 0;
}
</style>
