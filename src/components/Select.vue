<template>
    <div @click.self="$emit('close'); start = true; currencySelect = false; issuerSelect = false" class="overlay">
        <div id="select-element">
            <div class="select-content">
                <div class="select-header" v-if="start">
                    <h3>{{ $t('xapp.header.select_pair') }}</h3>
                    <a class="btn-close" @click="$emit('close'); start = true; currencySelect = false; issuerSelect = false">
                        <fa :icon="['fas', 'times']" />
                    </a>
                </div>
                <div class="select-header" v-else-if="currencySelect">
                    <a class="btn-close" style="border: none; margin-left: -12px;" @click="start = true; currencySelect = false">
                        <fa :icon="['fas', 'chevron-left']" class="scale-15"/>
                    </a>
                    <h3>{{ $t('xapp.header.select_currency') }}: {{ $t(`xapp.trade.${target}`) }}</h3>
                    <a class="btn-close" @click="$emit('close'); start = true; currencySelect = false; issuerSelect = false">
                        <fa :icon="['fas', 'times']" />
                    </a>
                </div>
                <div class="select-header" v-else-if="issuerSelect">
                    <a class="btn-close" style="border: none; margin-left: -12px;" @click="start = false; currencySelect = true; issuerSelect = false">
                        <fa :icon="['fas', 'chevron-left']" class="scale-15"/>
                    </a>
                    <h3>{{ $t('xapp.header.select_issuer') }}: {{ $t(`xapp.trade.${target}`) }}</h3>
                    <a class="btn-close" @click="$emit('close'); start = true; currencySelect = false; issuerSelect = false">
                        <fa :icon="['fas', 'times']" />
                    </a>
                </div>

                <hr>

                <div class="row select-body">

                    <div class="column" v-if="start">
                        <h4>{{ $t('xapp.trade.base') }}</h4>
                        <div class="currency-change" @click="start = false; target = 'base'; currencySelect = true">
                            <img v-if="tradingPair.base.currency === 'XRP'" src="../assets/png/crypto-xrp.png" class="currency-icon">
                            <img v-else-if="getFirstObject(curatedCurrencies[tradingPair.base.currency], 'avatar')" :src="getFirstObject(curatedCurrencies[tradingPair.base.currency], 'avatar')" class="currency-icon" />
                            <img v-else src="../assets/png/trustline-unkown.png" class="currency-icon">
                            <div class="column">
                                <h5>{{ currencyCodeFormat(tradingPair.base.currency, 16) }}</h5>
                                <span class="issuer">{{ getIssuerName(tradingPair.base.issuer) }}</span>
                            </div>
                            <fa class="scale-15" :icon="['fas', 'caret-right']"/>
                        </div>
                        <div class="row" style="justify-content: space-around; margin-bottom: -12px">
                            <svgImg @click="setCurrency('switch')" style="height: 40px; width: 20px;" :icon="['fas', 'arrow-down']"/>
                        </div>

                        <h4>{{ $t('xapp.trade.quote') }}</h4>
                        <div class="currency-change" @click="target = 'quote'; start = false; currencySelect = true">
                            <img v-if="tradingPair.quote.currency === 'XRP'" src="../assets/png/crypto-xrp.png" class="currency-icon">
                            <img v-else-if="getFirstObject(curatedCurrencies[tradingPair.quote.currency], 'avatar')" :src="getFirstObject(curatedCurrencies[tradingPair.quote.currency], 'avatar')" class="currency-icon" />
                            <img v-else src="../assets/png/trustline-unkown.png" class="currency-icon">
                            <div class="column">
                                <h5>{{ currencyCodeFormat(tradingPair.quote.currency, 16) }}</h5>
                                <span class="issuer">{{ getIssuerName(tradingPair.quote.issuer) }}</span>
                            </div>
                            <fa class="scale-15" :icon="['fas', 'caret-right']"/>
                        </div>
                    </div>

                    <div class="column" v-else-if="currencySelect">
                        <ul>
                            <li v-if="(tradingPair.base.currency !== 'XRP' && target === 'quote') || (tradingPair.quote.currency !== 'XRP' && target === 'base')" @click="setCurrency('XRP')">XRP</li>
                            <template v-for="(item, currency, index) in currencyObject" :key="index">
                                <li @click="setCurrency(currency)" v-if="!filterCurrency(currency)">
                                    <span>{{ currencyCodeFormat(currency, 16) }}</span>
                                </li>
                            </template>
                        </ul>
                    </div>
                    <div class="column" v-else-if="issuerSelect">
                        <ul>
                            <template v-for="(item, key, index) in issuers" :key="index">
                                <li @click="setIssuer(item)" v-if="!filterIssuer(key)">
                                    <span>{{ getIssuerName(key) }}</span>
                                </li>
                            </template>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import svgImg from '@/assets/svg/switch.vue'

import { currencyCodeFormat } from '../plugins/number-format'
import xapp from '../plugins/xapp'

export default {
    emits: ['close'],
    components: { svgImg },
    data() {
        return {
            start: true,
            currencySelect: false,
            issuerSelect: false,
            target: '',
            selectedCurrency: '',
            curatedAssets: {},
            tokens: []
        }
    },
    computed: {
        tradingPair() {
            return this.$store.getters.getCurrencyPair
        },
        issuers() {
            const obj = this.currencyObject[this.selectedCurrency]
            return obj
        },
        currencyObject() {
            const lines = this.accountTrustlines
            const list = this.curatedCurrencies
            if(Object.keys(lines).length < 1) {
                return list
            }
            return {...lines, ...list}
        },
        curatedCurrencies() {
            const obj = {}

            for(const exchange in this.curatedAssets.details) {
                // If exchange is on short list continue else continue
                if(!this.curatedAssets.details[exchange].shortlist) continue
                for(const currency in this.curatedAssets.details[exchange].currencies) {
                    const details = this.curatedAssets.details[exchange].currencies[currency]
                    if(!details.shortlist) continue
                    
                    const issuer = details.issuer

                    if(typeof obj[currency] === 'undefined') {
                        obj[currency] = {
                           [issuer]: details
                        }
                    } else {
                        // if(obj.currency.hasOwnProperty(issuer)) continue
                        obj[currency][issuer] = details
                    }
                }
            }
            return obj
        },
        accountTrustlines() {
            const array = this.$store.getters.getAccountLines
            if (array < 1) return {}
            const obj = {}

            if(Array.isArray(array) && array.length > 0) {
                array.forEach(line => {
                    if(typeof obj[line.currency] === 'undefined') {
                        obj[line.currency] = {
                           [line.account]: line
                        }
                    } else {
                        obj[line.currency][line.account] = line
                    }
                })
            }
            return obj
        }
    },
    methods: {
        currencyCodeFormat(string, maxLength) {
            return currencyCodeFormat(string, maxLength)
        },
        filterCurrency(currency) {
            if ((this.tradingPair.base.currency === 'XRP' && this.target === 'quote') || (this.tradingPair.quote.currency === 'XRP' && this.target === 'base')) return false
            
            if(Object.keys(this.currencyObject[currency]).length > 1) return false
            else if(this.target === 'base' && this.tradingPair.quote.currency === currency) return true
            else if(this.target === 'quote' && this.tradingPair.base.currency === currency) return true
            else return false
        },
        filterIssuer(issuer) {
            if(this.target === 'base' && this.tradingPair.quote.issuer === issuer && this.tradingPair.quote.currency === this.selectedCurrency) return true
            else if(this.target === 'quote' && this.tradingPair.base.issuer === issuer && this.tradingPair.base.currency === this.selectedCurrency) return true
            else return false
        },
        getIssuerName(issuer) {
            if(issuer === null) return null
            for(const exchange in this.curatedAssets.details) {
                if(!this.curatedAssets.details[exchange].shortlist) continue
                for(const currency in this.curatedAssets.details[exchange].currencies) {
                    if (this.curatedAssets.details[exchange].currencies[currency].issuer === issuer) return this.curatedAssets.details[exchange].name
                }
            }
            for(const token of this.tokens) {
                if(token === issuer) return this.token[token].data.username
            }
            return `${issuer.slice(0, 4)}...${issuer.slice(-4)}`
        },
        getFirstObject(obj, key) {
            for (const element in obj) {
                return obj[element][key]
            }
        },
        openIssuerSelect(line) {
            this.currencySelect = false
            this.issuerSelect = true
            this.selectedCurrency = line
        },
        setIssuer(line) {
            this.currencySelect = false
            this.issuerSelect = false
            this.start = true

            this.$store.dispatch('changeCurrencyPair', {
                target: this.target,
                amount: {
                    issuer: line.account || line.issuer,
                    limit: line.limit || null,
                    currency: line.currency
                } 
            })
        },
        setCurrency(currency) {
            if(currency === 'XRP') {
                this.start = true
                this.$store.dispatch('changeCurrencyPair', {
                    target: this.target,
                    amount: {
                        issuer: null,
                        limit: null,
                        currency: 'XRP'
                    } 
                })
                return 
            }
            if(currency === 'switch') return this.$store.dispatch('changeCurrencyPair', { target: 'switch' })
            this.openIssuerSelect(currency)
        }
    },
    async created() {
        try {
            this.curatedAssets = await xapp.getCuratedAssets()
        } catch(e) {
            this.$emitter.emit('modal', {
                type: 'error',
                title: this.$t('xapp.error.modal_title'),
                text: this.$t('xapp.error.get_curated_assets'),
                buttonText: this.$t('xapp.button.close')
            })
        }

        // try {
        //     const res = await fetch('https://tokens.xumm.community/api/v1/tokens')
        //     // const res = await axios.get('https://tokens.xumm.community/api/v1/tokens')
        //     this.tokens = res.tokens
        // } catch(e) {
        //     // alert('error with nixer API')
        //     // alert(e)
        // }
    }
}
</script>

<style scoped>
.overlay {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(var(--var-backdrop), 0.4);
    z-index: 99;
}
#select-element {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--var-bg-color-secondary);
    width: 65%;
    min-height: 250px;
    min-width: 160px;
    max-width: 300px;
    padding: 1rem;
    border-radius: 15px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.select-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
}
.select-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    color: var(--var-txt-color);
    padding-bottom: 0.5rem;
    /* margin-bottom: auto; */
}
.select-header h3 {
  margin-left: 0.1rem;
}
.btn-close {
    border: 1px solid var(--var-txt-color);
    padding: 0.25rem 0.75rem;
    border-radius: 5rem;
}
.select-header svg {
  transform: scale(1);
  vertical-align: middle;
  margin: 0;
  padding: 0;
}
.scale-15 {
    transform: scale(1.5);
}
.select-body {
    margin: 1rem 0;
    height: 100%;
    min-height: 180px;
}
.list-header {
    border-bottom: 1px solid var(--var-txt-color);
}
.currency-change {
    background: var(--var-secondary);
    border-radius: 15px;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.5rem;
}
img.currency-icon {
    width: 2.1rem;
    height: 2.1rem;
    object-fit: cover;
    margin-right: 10px;
    /* border: 2px solid var(--var-daker); */
    border-radius: 0.5rem;
    padding: 0.1rem;
}
h4 {
    color: var(--var-primary);
    margin: 0;
    margin-right: auto;
    margin-left: 0.5rem;
}
h5 {
    margin: 0;
    margin-right: auto;
}
span.issuer {
    margin-right: auto;
}
.currency-label {
    border: 1px solid var(--var-txt-color);
    width: 50px;
    color: var(--var-txt-color);
    align-self: center;
}
ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
  font-size: 15px;
  height: 180px;
  overflow: auto;
  width: 100%;
  align-self: center;
  /* color: var(--var-txt-color); */
}
li {
    border-bottom: 1px solid var(--var-border);
    padding: 0.5rem 0;
    text-align: center;
}
</style>