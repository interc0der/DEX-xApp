<template>
    <div id="offers" class="column">
        <div class="tab-head row">
            <div class="tabs">
                <span @click="activeTabIndex = 0">{{ $t('xapp.orders.orders') }} ({{ Object.keys(offers).length }})</span>
                <!-- <span @click="toggleAccountTx()">{{ $t('xapp.orders.history') }}</span> -->
            </div>
            <div class="redirect-btn-group">
                <a @click="openTradeDataView()" style="margin-right: 10px;">
                    <fa style="margin-right: 5px;" :icon="['fas', 'chart-line']"/>
                    <label>Charts</label>
                </a>
                <a @click="openEventView()">
                    <fa style="margin-right: 5px;" :icon="['fas', 'history']"/>
                    <label>{{ $t('xapp.orders.history') }}</label>
                </a>
            </div>
        </div>
        <hr>
        <div v-if="offers.length < 1 && activeTabIndex === 0" id="no-data-placeholder">
            <i>🚀</i>
            <h4>{{ $t('xapp.orders.no_open_orders') }}</h4>
        </div>
        <!-- txoffers -->
        <div v-else-if="!(Object.keys(history).length > 1 || history.length > 1) && activeTabIndex === 1" id="no-data-placeholder">
            <i>🚀</i>
            <h4>{{ $t('xapp.orders.no_history_orders') }}</h4>
        </div>
        <div v-else class="table-wrapper">
            <div class="table-container">

                <template v-if="activeTabIndex === 0">
                    <div class="order-item" v-for="(item, seq, index) in offers" :key="seq">
                        <div class="row" style="margin: 0; padding-left: 5px;">
                            <label v-if="getOrderTrade(item)" class="trade-label" :class="getOrderTrade(item)">{{ getOrderTrade(item) }}</label>
                            <label v-else class="trade-label open">{{ 'open' }}</label>
                        </div>

                        <div class="row" style="padding: 5px 0 5px 15px;">
                            <div v-if="tradingPair.base.currency === item.TakerGets.currency || tradingPair.quote.currency === item.TakerPays.currency" class="column">
                                <h6>{{ `Filled/Total (${currencyCodeFormat(item.TakerGets.currency, 16)})` }}</h6>
                                <span class="number">{{ `${QuantityFormat(item.TakerGets.values.filled, item.TakerGets.currency)}/${QuantityFormat(item.TakerGets.values.created, item.TakerGets.currency)}` }}</span>
                            </div>
                            <div v-else-if="tradingPair.base.currency === item.TakerPays.currency || tradingPair.quote.currency === item.TakerGets.currency" class="column">
                                <h6>{{ `Filled/Total (${currencyCodeFormat(item.TakerPays.currency, 16)})` }}</h6>
                                <span class="number">{{ `${QuantityFormat(item.TakerPays.values.filled, item.TakerPays.currency)}/${QuantityFormat(item.TakerPays.values.created, item.TakerPays.currency)}` }}</span>
                            </div>
                            <div v-else class="column">
                                <h6>{{ `Filled/Total` }}</h6>


                                <div class="row">
                                    <div class="column" style="width: fit-content">
                                        <span class="number">{{ `${QuantityFormat(item.TakerGets.values.filled, item.TakerGets.currency)}/${QuantityFormat(item.TakerGets.values.created, item.TakerGets.currency)} ${currencyCodeFormat(item.TakerGets.currency, 4)}` }}</span>
                                        <div style="height: 5px"><!-- spacer --></div>
                                        <span class="number">{{ `${QuantityFormat(item.TakerPays.values.filled, item.TakerPays.currency)}/${QuantityFormat(item.TakerPays.values.created, item.TakerPays.currency)} ${currencyCodeFormat(item.TakerPays.currency, 4)}` }}</span>
                                    </div>
                                    <fa class="trade-undefined-icon" style="padding: 0 5px" :icon="['fa', 'level-down-alt']" />
                                </div>
                            
                            
                            </div>
                            <div class="column">
                                <template v-if="getOrderTrade(item)">
                                    <h6>{{ `Price ${currencyCodeFormat(item.TakerGets.currency, 4)}/${currencyCodeFormat(item.TakerPays.currency, 4)}` }}</h6>
                                    <span class="number">{{ priceFormat(getOrderPrice(item)) }}</span>
                                </template>

                                <template v-else>
                                    <h6>Prices</h6>
                                    <span class="number">{{ priceFormat(getOrderPrice(item, 'sell')) }}  {{ `${currencyCodeFormat(item.TakerGets.currency, 4)}/${currencyCodeFormat(item.TakerPays.currency, 4)}` }}</span>
                                    <div style="height: 5px"><!-- spacer --></div>
                                    <span class="number">{{ priceFormat(getOrderPrice(item, 'buy')) }}  {{ `${currencyCodeFormat(item.TakerPays.currency, 4)}/${currencyCodeFormat(item.TakerGets.currency, 4)}` }}</span>
                                </template>
                                
                            </div>
                        </div>
                        <div class="action-row">
                            <a @click="info(item)">{{ $t('xapp.orders.info') }}</a>
                            <hr>
                            <SpinnerButton @click.prevent="cancel(item)">{{ $t('xapp.orders.cancel') }}</SpinnerButton>
                        </div>

                    </div>
                </template>

                <template v-else-if="activeTabIndex === 1">
                    Not available
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import xapp from '../plugins/xapp'
import { currencyFormat, currencyCodeFormat, epochToDate, quantityFormat, priceFormat } from '../plugins/number-format'

import SpinnerButton from '@/components/SpinnerButton.vue'

export default {
    components: { SpinnerButton },
    data() {
        return {
            activeTabIndex: 0,
            txs: []
        }
    },
    computed: {
        account() {
            return this.$store.getters.getAccount
        },
        tradingPair() {
            return this.$store.getters.getCurrencyPair
        },
        offers() { 
            return this.$store.getters.getOpenOffers
        },
        history() {
            return this.$store.getters.getOfferHistoryByCurrencyPair(this.tradingPair)
        }
    },
    methods: {
        openTradeDataView() {
            this.$emitter.emit('changeView', 'data')
        },
        openEventView() {
            this.$emitter.emit('changeView', 'events')
        },
        QuantityFormat(value, currency) {
            if(currency === 'XRP') value = Number(value / 1_000_000)
            return quantityFormat(value)
        },
        priceFormat(value) {
            return priceFormat(value)
        },
        currencyCodeFormat(string, maxLength) {
            return currencyCodeFormat(string, maxLength)
        },
        currencyFormat(amount, currency) {
            return currencyFormat(amount, currency)
        },
        epochToDate(epoch) {
            return epochToDate(epoch)
        },
        toggleAccountTx() {
            this.activeTabIndex = 1
        },
        async cancel(order) {
            try {
                const payload = {
                    txjson: {
                        TransactionType: "OfferCancel",
                        OfferSequence: order.seq || order.sequence,
                        Account: this.account
                    }
                }
                await xapp.signPayload(payload)
            } catch(e) {
                if(e.error !== false) {
                    this.$emitter.emit('modal', {
                        type: 'error',
                        title: this.$t('xapp.error.modal_title'),
                        text: this.$t('xapp.error.sign_cancel_offer'),
                        buttonText: this.$t('xapp.button.close')
                    })
                }
            }
        },
        async info(order) {
            // const txId = order.PreviousTxnID || order.hash || order.Sequence
            const txId = order.hashes[0]
            try {
                const data = await xapp.getTokenData()
                if (xapp.versionCheck(data.version, '2.1.0') < 0) throw 'Update XUMM to use this feature'
                
                xapp.openTxViewer(txId, this.account)
                // if(data.nodetype === 'MAINNET') xapp.openExternalBrowser(`https://livenet.xrpl.org/transactions/${txId}`)
                // else if(data.nodetype === 'TESTNET') xapp.openExternalBrowser(`https://testnet.xrpl.org/transactions/${txId}`)
            } catch(e) {
                this.$emitter.emit('modal', {
                    type: 'error',
                    title: this.$t('xapp.error.modal_title'),
                    text: e,
                    buttonText: this.$t('xapp.button.close')
                })
            }
        },
        getOrderTrade(order) {
            if(order.TakerPays.currency === this.tradingPair.base.currency || order.TakerGets.currency === this.tradingPair.quote.currency) return 'buy'
            else if(order.TakerPays.currency === this.tradingPair.quote.currency || order.TakerGets.currency === this.tradingPair.base.currency) return 'sell'
            else null
        },
        getOrderPrice(order, givenTrade) {
            const trade = givenTrade || this.getOrderTrade(order)
            let price = 0
            if (trade === 'sell') {
                price = order.TakerPays.values.open / order.TakerGets.values.open
                if(order.TakerPays.currency === 'XRP') price = price / 1_000_000
                if(order.TakerGets.currency === 'XRP') price = price * 1_000_000
            } else if(trade === 'buy') {
                price = order.TakerGets.values.open / order.TakerPays.values.open
                if(order.TakerPays.currency === 'XRP') price = price * 1_000_000
                if(order.TakerGets.currency === 'XRP') price = price / 1_000_000
            } else {
                return 0
            }
            return price
        }
    }
}
</script>

<style scoped>
.number {
    font-size: 0.8rem;
}
#offers {
    /* height: 100%; */
    /* display: flex;
    flex-flow: column; */
    /* height: inherit; */
    flex: 1 1 0;
    overflow: hidden;
}
.tab-head {
    display: flex;
    flex-direction: row;
}
.tab-head .tabs {
    font-size: 1rem;
    font-weight: 600;
    margin-left: 15px;
}
.tab-head .redirect-btn-group {
    margin-left: auto;
    margin-right: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.redirect-btn-group a {
    display: flex;
    flex-direction: row;
    align-items: center;
}
.table-wrapper {
    display: flex;
    flex-direction: row;
    overflow: hidden;
}
/* Overflow container */
.table-container {
    overflow-x: hidden;
    overflow-y: auto;
    padding: 5px 0;
    width: 100%;
    /* height: 100%;
    max-height: 100%; */
}
.order-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-bottom: 10px;
}
.order-item table {
    padding-left: 10px;
}
/* .order-item h6 {
    font-size: 0.8rem;
}
.order-item span {
    text-align: start;
    margin-top: 10px;
} */
.action-row {
    display: flex;
    flex-direction: row;
    width: 100%;
}
.action-row a {
    width: 50%;
    background-color: var(--var-secondary);
    padding: 6px 0;
    height: 20px;
    text-align: center;
}
.action-row hr {
    width: 1px;
    border-top: none;
    margin: 0;
}
.trade-label {
    padding: 3px 8px;
    font-size: 14px;
    border-radius: 5px 0px 5px 0px;
    color: var(--var-bg-color) !important;
    font-weight: 400;
}
.buy {
    color: white;
    background-color: var(--green);
}
.sell {
    color: white;
    background-color: var(--red);
}
.open {
    color: white;
    background-color: var(--var-primary);
}
#no-data-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
}
#no-data-placeholder h4 {
    margin: 0;
}
</style>
