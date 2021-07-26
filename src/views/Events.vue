<template>
    <div id="history-container">
        <div id="history-header">
            <fa class="header-icon" :icon="['fas', 'chevron-left']" />
            <h2>Events</h2>
            <fa class="header-icon" :icon="['fas', 'calendar']" />
        </div>
        <div class="tabs-row">
            <label>
                <input type="radio" :value="1" name="tabs" id="tab1" v-model="activeTab"/>
                <span>Open Orders</span>
            </label>

            <label>
                <input type="radio" :value="2" name="tabs" id="tab2" v-model="activeTab"/>
                <span>Orders History</span>
            </label>
        </div>
        <div class="tab-container">
            <template v-if="activeTab === 2">
                <div class="filters row">
                    <select class="arrow" v-model="selectedCurrency">
                        <option value="All">All</option>
                        <option value="USD">USD</option>
                        <option value="XRP">XRP</option>
                        <option value="EUR">EUR</option>
                        <option value="ETH">ETH</option>
                    </select>
                    <select class="arrow" v-model="selectedIssuer">
                        <option value="All">All</option>
                        <option value="r...">GateHub</option>
                        <option value="r...">BitStamp</option>
                    </select>
                </div>
                <hr style="margin: 10px 0; border: none;">

                <!-- Content -->
                <div v-if="filterHistoryByCurrency.length < 1">
                    <i>🚀</i>
                    <h4>{{ $t('xapp.orders.no_history_orders') }}</h4>
                </div>

                <div class="list-container">
                    <div class="order-card" v-for="(item, index) in filterHistoryByCurrency">
                        <div class="order-item">
                            <div class="row">
                                <div class="currency-pair">
                                    <label>{{ currencyCodeFormat(item.created.TakerGets.currency, 16) }}</label>
                                    <fa style="margin: auto 5px" :icon="['fas', 'arrow-right']" size="xs"/>
                                    <label>{{ currencyCodeFormat(item.created.TakerPays.currency, 16) }}</label>
                                </div>
                                <!-- <label v-if="getOrderTrade(item.created)" class="trade-label" :class="getOrderTrade(item.created)">{{ getOrderTrade(item.created) }}</label> -->
                                <label v-if="item.status === 'open'" class="trade-label active">{{ 'active' }}</label>
                            </div>
                            <div class="row">
                                <h6 class="number">#{{ item.sequence }}</h6>
                                <h6 class="number" style="margin-left: auto;">{{ epochToDate(item.created.date) }}</h6>
                            </div>
                            <hr>
                            <div class="column">
                                <h5>
                                    Status:
                                    <span>{{ item.status }}</span>
                                </h5>
                                <h5>
                                    Other info if not avail:
                                    <span>--</span>
                                </h5>
                                <h5>
                                    Selling:
                                    <span class="number">{{`0/${QuantityFormat(item.created.TakerGets.value, item.created.TakerGets.currency)} ${currencyCodeFormat(item.created.TakerGets.currency, 4)}`}}</span>
                                </h5>
                                <h5>
                                    Selling price:
                                    <span class="number">{{ orderPrice(item, 'sell') }}</span>
                                </h5>
                                <h5>
                                    Buying:
                                    <span class="number">{{`0/${QuantityFormat(item.created.TakerPays.value, item.created.TakerPays.currency)} ${currencyCodeFormat(item.created.TakerPays.currency, 4)}`}}</span>
                                </h5>
                                <h5>
                                    Buying price:
                                    <span class="number">{{ orderPrice(item, 'buy') }}</span>
                                </h5>
                                <h5>
                                    Condition:
                                    <span class="number">{{ item.condition }}</span>
                                </h5>
                                <h5>
                                    Fees paid:
                                    <span class="number">{{ item.fees }} drops</span>
                                </h5>
                            </div>
                        </div>
                        <div class="action-row">
                            <a @click="info(item)" style="border-radius: 0 0 0 10px">{{ $t('xapp.orders.info') }}</a>
                            <hr>
                            <SpinnerButton v-if="item.status === 'open'" @click="cancel(item)" style="border-radius: 0 0 10px 0">{{ $t('xapp.orders.cancel') }}</SpinnerButton>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
import xapp from '../plugins/xapp'
import { currencyFormat, currencyCodeFormat, epochToDate, quantityFormat } from '../plugins/number-format'

import SpinnerButton from '@/components/SpinnerButton.vue'

export default {
  components: { SpinnerButton },
    data() {
        return {
            activeTab: 2,
            selectedCurrency: 'All',
            selectedIssuer: 'All'
        }
    },
    computed: {
        openOffers() {
            return this.$store.getters.getOpenOffers
        },
        history() {
            return this.$store.getters.getOfferHistory
        },
        filterHistoryByCurrency() {
            if(this.selectedCurrency === 'All') return this.history
            
            const array = this.history.filter(offer => {
                    const gets = offer.created.TakerGets
                    const pays = offer.created.TakerPays
                    if(gets.currency === this.selectedCurrency || pays.currency === this.selectedCurrency) return true
                    else return false
                })
            return array.sort((a, b) =>  b.sequence - a.sequence )
        }
    },
    methods: {
        currencyCodeFormat(string, maxLength) {
            return currencyCodeFormat(string, maxLength)
        },
        currencyFormat(amount, currency) {
            return currencyFormat(amount, currency)
        },
        epochToDate(epoch) {
            return epochToDate(epoch)
        },
        getOrderTrade(order) {
            if(order.TakerPays.currency === this.selectedCurrency) return 'buy'
            else if(order.TakerPays.currency === this.selectedCurrency) return 'sell'
            else null
        },
        QuantityFormat(value, currency) {
            if(currency === 'XRP') value = Number(value / 1_000_000)
            return quantityFormat(value)
        },
        orderPrice(order, trade) {
            let price = 0
            const TakerPays = order.created.TakerPays
            const TakerGets = order.created.TakerGets

            if (trade === 'sell') {
                price = TakerPays.value / TakerGets.value
                if(TakerPays.currency === 'XRP') price = price / 1_000_000
                if(TakerGets.currency === 'XRP') price = price * 1_000_000
            } else if(trade === 'buy') {
                price = TakerGets.value / TakerPays.value
                if(TakerPays.currency === 'XRP') price = price * 1_000_000
                if(TakerGets.currency === 'XRP') price = price / 1_000_000
            } else {
                return 0
            }
            return price 
        },
        async cancel(order) {
            if(order.status !== 'open') {
                return this.$emitter.emit('modal', {
                        type: 'error',
                        title: this.$t('xapp.error.modal_title'),
                        text: this.$t('xapp.error.sign_cancel_offer'),
                        buttonText: this.$t('xapp.button.close')
                    })
            }

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
            const txId = order.status === 'open' ? order.open.hash : order.canceled.hash
            try {
                const data = await xapp.getTokenData()
                if (xapp.versionCheck(data.version, '2.1.0') < 0) throw 'Update XUMM to use this feature'
                
                xapp.openTxViewer(txId, this.$store.getters.getAccount)
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
        }
    }
}
</script>

<style scoped>
h2 {
    margin: 0;
}
h5 {
    margin: 5px 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgb(167, 167, 167);
    display: flex;
}
h5 span {
    margin-left: auto;
}
h5 .number {
    color: white;
    margin-top: auto;
    margin-bottom: auto;
}
select {
    width: fit-content;
    padding-right: 30px;
    margin-right: 15px;
    border: 1px solid rgba(128, 128, 128, 0.5);;
}
#history-container {
    display: flex;
    flex-direction: column;
    height: calc(100% - 2px);
    padding: 2px 10px;
}
#history-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 0;
}
.header-icon {
    margin: auto 0;
}
.tab-container {
    overflow: hidden;
    flex: 1 1 0;
}
.list-container {
    height: calc(100% - 55px);
    overflow-x: hidden;
    overflow-y: auto;
}
.order-card {
    border-radius: 10px;
    background-color: rgb(24, 24, 24);
    margin-bottom: 30px;
}
.order-item {
    padding: 10px 10px;
}
.order-item .currency-pair {
    font-weight: 600;
    display: flex;
    margin-right: 10px;
}
.order-item hr {
    width: calc(100% + 20px);
    /* margin-left: -10px; */
    border-top: 1px solid rgba(128, 128, 128, 0.377); 
    margin: 8px 0 5px -10px;
}
.order-item h6 {
    color: rgb(110, 110, 110);
}
.trade-label {
    padding: 3px 8px;
    font-size: 0.7rem;
    border-radius: 5px 0px 5px 0px;
    font-weight: 400;
    margin-right: 5px;
}
.trade-label.active {
    margin-top: -1px;
    color: white;
    border: 1px solid green;
    background-color: rgba(0, 128, 0, 0.356);
}
.action-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    border-top: 1px solid grey;
    max-height: 40px;
}
.action-row a {
    width: 50%;
    background-color: var(--var-secondary);
    padding: 10px 0;
    text-align: center;
}
.action-row hr {
    width: 1px;
    border-top: none;
    border-left: 1px solid white;
    margin: 0;
}

.tabs-row {
    height: 30px;
    overflow-x: auto;
    overflow-y: hidden;
}
.tabs-row input {
    display: none;
    /* position: fixed;
    opacity: 0;
    pointer-events: none; */
}
.tabs-row label {
    display: inline-block;
    margin: 5px 10px;
    cursor: pointer;
}
.tabs-row input:checked + span {
    color: rgb(255, 255, 255);
    border-bottom: 1px solid var(--var-primary);
    transition: 0.5s ease;
}
.tabs-row input + span {
    color: rgb(170, 170, 170);
    transition: 0.5s ease;
}
</style>