<template>
    <div class="column">
        <div class="column">
            <div class="row">
                <a @click="toggleDirection('buy')" :class="direction === 'buy' ? 'btn-success' : 'btn-secondary'" class="btn label">{{ $t('xapp.trade.buy') }}</a>
                <a @click="toggleDirection('sell')" :class="direction === 'sell' ? 'btn-cancel' : 'btn-secondary'" class="btn label">{{ $t('xapp.trade.sell') }}</a>
            </div>
        </div>
        <div class="row margin-input">
            <select class="arrow" v-model="method">
                <option value="market" :disabled="!marketOrderActive">{{ $t('xapp.trade.order_types.market_order') }}</option>
                <option value="limit">{{ $t('xapp.trade.order_types.limit_order') }}</option>
            </select>
        </div>
        <div class="row margin-input" v-if="method === 'limit'">
            <div class="input-label" :class="{ 'input-error': limitPriceInputError }">
                <input type="text" inputmode="decimal" :placeholder="$t('xapp.trade.limit_price')" v-model="priceInput" @keydown="prevent">
                <label>{{ currencyCodeFormat(tradingPair.quote.currency) }}</label>
            </div>
        </div>
        <div class="row margin-input">
            <div class="input-label" :class="{ 'input-error': quantityInputValidator || quantityInputError }">
                <input type="text" inputmode="decimal" :placeholder="$t('xapp.trade.quantity')" v-model="quantityInput" @keydown="prevent">
                <label>{{ currencyCodeFormat(tradingPair.base.currency) }}</label>
            </div>
        </div>
        <div class="row" style="width: calc(100% - 30px); margin: 10px auto">
            <Slider step="1" min="0" max="100" v-model="quantitySlider"/>
        </div>
        <div class="row">
            <div class="column">
                <div class="row margin-0">
                    <h6>{{ $t('xapp.trade.funds') }}:</h6>
                    <h6 style="width: 100%" class="number align-end">{{ currencyFormat(funds, direction === 'sell' ? tradingPair.base.currency : tradingPair.quote.currency) }} {{ direction === 'sell' ? currencyCodeFormat(tradingPair.base.currency) : currencyCodeFormat(tradingPair.quote.currency) }}</h6>
                </div>

                <div class="row margin-0">
                    <h6>{{ $t('xapp.trade.quantity') }}:</h6>
                    <h6 v-if="direction === 'buy'" style="width: 100%" class="align-end number">{{ currencyFormat(takerQuantity, tradingPair.quote.currency) }} {{ currencyCodeFormat(tradingPair.quote.currency) }}</h6>
                    <h6 v-else style="width: 100%" class="number align-end">{{ currencyFormat(quantity, tradingPair.base.currency) }} {{ currencyCodeFormat(tradingPair.base.currency) }} </h6>
                </div>

                <div class="row margin-0">
                    <h6>{{ $t('xapp.trade.receiving') }}:</h6>
                    <h6 v-if="direction === 'buy'" style="width: 100%" class="number align-end">{{ currencyFormat(quantity, tradingPair.base.currency) }} {{ currencyCodeFormat(tradingPair.base.currency) }} </h6>
                    <h6 v-else style="width: 100%" class="align-end number">{{ currencyFormat(takerQuantity, tradingPair.quote.currency) }} {{ currencyCodeFormat(tradingPair.quote.currency) }}</h6>
                </div>
            </div>
        </div>
        <div class="row">
            <SpinnerButton v-if="$store.getters.hasAccountErrors" @click="signin()" class="btn btn-warning btn-0-margin">{{ $t('xapp.button.account_not_found_login_button') }} ({{ $store.getters.getAccountInfo }})</SpinnerButton>
            <SpinnerButton v-else @click="order()" :class="{'btn-success': direction === 'buy', 'btn-cancel': direction === 'sell' }" class="btn btn-0-margin">{{ direction === 'buy' ? $t('xapp.trade.buy') : $t('xapp.trade.sell') }}</SpinnerButton>
        </div>
        <div class="row margin-input" v-if="method !== 'market'">
            <select class="arrow" v-model="type">
                <option value="GoodTillCancel">{{ $t('xapp.trade.order_methods.good_till_cancel') }}</option>
                <option value="ImmediateOrCancel">{{ $t('xapp.trade.order_methods.immediate_or_cancel') }}</option>
                <option value="FillOrKill">{{ $t('xapp.trade.order_methods.fill_or_kill') }}</option>
                <!-- <option disabled value="GoodTillDate">{{ $t('xapp.trade.order_methods.good_till_date') }}</option> -->
            </select>
        </div>
    </div>
</template>

<script>
import Slider from '@/components/Slider.vue'
import SpinnerButton from '@/components/SpinnerButton.vue'

import xapp from '../plugins/xapp'
import client from '../plugins/ws-client'
import { currencyFormat, currencyCodeFormat } from '../plugins/number-format'

export default {
    components: { Slider, SpinnerButton },
    data() {
        return {
            direction: 'buy',
            method: 'market',
            type: 'GoodTillCancel',
            limitPrice: null,
            quantity: null,
            InputLimitPrice: null,
            InputQuantity: null,
            cushion: 0.05,
            selectActive: false,
            sliderValue: null,
            limitPriceInputError: false,
            quantityInputError: false
        }
    },
    watch: {
        tradingPair: function() {
            this.marketPrice = null
            this.InputLimitPrice = null
            this.InputQuantity = null
            this.limitPrice = null
            this.quantity = null
            this.sliderValue = null,
            this.limitPriceInputError = false,
            this.quantityInputError = false
        }
    },
    computed: {
        marketOrderActive() {
            if(!this.$store.getters.isMarketSafe) {
                if(this.method === 'market') this.method = 'limit'
            }
            return this.$store.getters.isMarketSafe
        },
        tradingPair() {
            return this.$store.getters.getCurrencyPair
        },
        marketPrice() {
            return this.$store.getters.getMarketPrice
        },
        quantityInputValidator() {
            if(this.quantity < 0) return true
            if (this.direction === 'buy') {
                return this.method === 'market' ? this.quantity * this.marketPrice > this.funds : this.quantity * this.limitPrice > this.funds
            } else {
                return this.quantity > this.funds
            }
        },
        funds() {
            if(this.direction === 'sell') return this.$store.getters.getAccountFunds(this.tradingPair.base.currency, this.tradingPair.base.issuer)
            else return this.$store.getters.getAccountFunds(this.tradingPair.quote.currency, this.tradingPair.quote.issuer)
        },
        price() {
            if(this.method === 'market') {
                if(this.direction === 'buy') return Number(this.marketPrice * (1 + this.cushion))
                else return Number(this.marketPrice * (1 - this.cushion))
            }
            else return this.limitPrice
        },
        priceInput: {
            get() {
                return this.InputLimitPrice
            },
            set(value) {
                if(this.limitPriceInputError) this.limitPriceInputError = false
                value = this.parseValue(value)
                if(value === null) {
                    this.InputLimitPrice = null
                    return this.limitPrice = null
                }
                this.InputLimitPrice = value.toString()
                value = parseFloat(value)
                if(this.tradingPair.base.currency !== 'XRP' && this.tradingPair.quote.currency !== 'XRP') this.limitPrice = value
                else if(this.tradingPair.base.currency !== 'XRP') this.limitPrice = value * 1_000_000
                else this.limitPrice = value / 1_000_000
            }
        },
        takerQuantity() {
            return this.quantity * this.price
        },
        quantityInput: {
            get() {
                return this.InputQuantity
            },
            set(value) {
                if(this.quantityInputError) this.quantityInputError = false

                value = this.parseValue(value)
                if(value === null) {
                    this.sliderValue = 0
                    this.InputQuantity = null
                    return this.quantity = null
                }
                this.InputQuantity = value.toString()
                value = parseFloat(value)

                if(this.tradingPair.base.currency === 'XRP') {
                    value = Math.trunc(value * 1_000_000)
                }

                this.quantity = value

                // Update slider value
                if(this.direction === 'buy') {
                    if(this.price || typeof this.price === 'number') this.sliderValue = Number(Number(this.price * value) / this.funds * 100)
                } else {
                    if(this.tradingPair.base.currency !== 'XRP') this.sliderValue = Number(value / this.funds * 100)
                    else this.sliderValue = Math.trunc(Number(value / this.funds) * 100)
                }

            }
        },
        quantitySlider: {
            get() {
                return this.sliderValue
            },
            set(value) {
                this.sliderValue = value

                value = Number(value / 100)
                if(this.direction === 'buy') {
                    if(!this.price || typeof this.price !== 'number') return
                    if(this.tradingPair.base.currency !== 'XRP') this.quantity = Number(this.funds / this.price * value)
                    else this.quantity = Math.trunc(Number(this.funds / this.price * value))
                } else {
                    if(this.tradingPair.base.currency !== 'XRP') this.quantity = Number(value * this.funds)
                    else this.quantity = Math.trunc(Number(value * this.funds))
                }
                this.InputQuantity = this.currencyFormat(this.quantity, this.tradingPair.base.currency)
            }
        }
    },
    methods: {
        toggleDirection(direction) {
            if (this.direction === direction) return
            this.quantity = null
            this.InputQuantity = null
            this.direction = direction
        },
        currencyCodeFormat(string, maxLength) {
            return currencyCodeFormat(string, maxLength)
        },
        currencyFormat(amount, currency) {
            return currencyFormat(amount, currency)
        },
        parseValue(value) {
            if(value === '') return null
            if(value === ',' || value === '.') return '0.'
            value = value.replace(/,/g, '.')
            return value
        },
        prevent(e) {
            const input = e.target.value
            if(e.key === 'ArrowLeft') return
            if(e.key === 'ArrowRight') return
            if( (e.key === ',' || e.key === '.') && (input.includes('.') || input.includes(',')) ) return e.preventDefault()
            if(!/^[0-9]$/i.test(e.key)) {
                switch(e.key) {
                    case 'Home':
                    case 'End':
                    case 'Shift':
                    case 'Control':
                    case 'Escape':
                    case 'Alt':
                    case 'Meta':
                    case 'Tab':
                    case 'Backspace':
                    case 'Delete':
                    case 'Enter':
                    case '.':
                    case ',':
                    case 'ArrowLeft':
                    case 'ArrowRight':
                        break
                    default:
                        console.log(`Prevent key: ${e.key}`)
                        return e.preventDefault()
                }
            }
            var value = e.target.value,
            idx = e.target.selectionStart,
            key = e.key;

            value = value.slice(0, idx) + key + value.slice(idx + Math.abs(0))
            if(this.tradingPair.base.currency === 'XRP') {
                const decimals = value.split('.', 2)[1]
                if(decimals) {
                    // if(decimals.length > 6 && /^[0-9]$/i.test(e.key)) return e.preventDefault()
                }
            } else {
                // Other trading pair max decimals
            }
        },
        toggleDirection(direction) {
            if (this.direction === direction) return
            this.quantity = null
            this.InputQuantity = null
            this.direction = direction
        },
        takerObject(currency, issuer, quantity, price) {
            // calculate value if method = market from market price else get limit price
            const value = quantity * price
            if (currency === 'XRP') {
                return Math.trunc(value).toString()
            } else {
                return {
                    currency: currency,
                    issuer: issuer,
                    value: value.toFixed(8)
                }
            }
        },
        async order() {
            if(!this.funds || this.funds <= 0) {
                return this.$emitter.emit('modal', {
                    type: 'info',
                    title: this.$t('xapp.error.modal_title'),
                    text: this.$t('xapp.info.no_funds'),
                    buttonText: this.$t('xapp.button.close')
                })
            }

            let inputError = false
            if(typeof this.quantity !== 'number' || this.quantity <= 0) {
                this.quantityInputError = true
                inputError = true
            }
            if(this.method === 'market' && (typeof this.marketPrice !== 'number' || this.marketPrice <= 0 || isNaN(this.marketPrice))) {
                inputError = true
                this.$emitter.emit('modal', {
                    type: 'error',
                    title: this.$t('xapp.error.modal_title'),
                    text: this.$t('xapp.error.market_price'),
                    buttonText: this.$t('xapp.button.close')
                })
            } else if(this.method === 'limit' && (typeof this.limitPrice !== 'number' || this.limitPrice <= 0)) {
                inputError = true
                this.limitPriceInputError = true
            }

            if(this.direction === 'buy') {
                if(this.funds < this.takerQuantity) {
                    this.quantityInputError = true
                    inputError = true
                }
            } else if(this.direction === 'sell'){
                if(this.funds < this.quantity) {
                    this.quantityInputError = true
                    inputError = true
                }
            }

            if(inputError) {
                return
            } else {
                this.limitPriceInputError = false
                this.quantityInputError = false   
            }

            try {
                const OfferCreate = {
                    TransactionType: "OfferCreate",
                    Account: this.$store.getters.getAccount
                }

                if (this.direction === 'sell') {
                    OfferCreate['TakerPays'] = this.takerObject(this.tradingPair.quote.currency, this.tradingPair.quote.issuer, this.quantity, this.price)
                    OfferCreate['TakerGets'] = this.takerObject(this.tradingPair.base.currency, this.tradingPair.base.issuer, this.quantity, 1)

                } else if(this.direction === 'buy') {
                    OfferCreate['TakerPays'] = this.takerObject(this.tradingPair.base.currency, this.tradingPair.base.issuer, this.quantity, 1)
                    OfferCreate['TakerGets'] = this.takerObject(this.tradingPair.quote.currency, this.tradingPair.quote.issuer, this.quantity, this.price)
                }
                const tfPassive	= 0x00010000
                const tfImmediateOrCancel = 0x00020000
                const tfFillOrKill = 0x00040000
                const tfSell = 0x00080000

                if (this.method === 'market') {
                    OfferCreate['Flags'] = tfFillOrKill | tfSell
                } else {
                    switch(this.type) {
                        case 'GoodTillCancel':
                            OfferCreate['Flags'] = tfSell
                            break
                        case 'ImmediateOrCancel':
                            OfferCreate['Flags'] = tfImmediateOrCancel | tfSell
                            break
                        case 'FillOrKill':
                            OfferCreate['Flags'] = tfFillOrKill | tfSell
                            break
                        case 'GoodTillDate':
                            OfferCreate['Flags'] =  tfSell
                            break
                    }
                }

                await xapp.signPayload({
                    txjson: OfferCreate
                })
            } catch(e) {
                if(e.error !== false) {
                    this.$emitter.emit('modal', {
                        type: 'error',
                        title: this.$t('xapp.error.modal_title'),
                        text: this.$t('xapp.error.sign_offer_create'),
                        buttonText: this.$t('xapp.button.close')
                    })
                }
            }
        },
        async signin() {
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
    }
}
</script>

<style scoped>

</style>