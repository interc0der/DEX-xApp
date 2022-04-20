<template>
    <div class="account-offers-view">

        <div class="account-offers-view-header">
            <div class="tabs-row">
                <label v-for="table in availableTables">
                    <input type="radio" :value="table" name="account-tabs" v-model="activeTable"/>
                    <span>
                        {{ table }}
                        <span v-if="availableTables[0] === table">({{ openOrderList.length }})</span>
                    </span>
                    
                </label>
            </div>

            <div class="table-filter-options">
                <input type="checkbox" v-model="filterFailedResults">
                <label>hide failed results</label>
            </div>

        </div>

        <div class="table-wrapper">
                <!-- <div class="filters row">
                    <select class="arrow" v-model="selectedCurrency">
                        <option value="All">All</option>
                        <option v-for="(item, key, index) in currencyList" :value="key">{{ currencyCodeFormat(key, 4) }}</option>
                    </select>
                    <select class="arrow" v-model="selectedIssuer">
                        <option value="All">All</option>
                        <option value="r..." disabled="true">Issuer</option>
                    </select>
                    <input type="checkbox" v-model="filterFailedResults">
                    <label>hide failed results</label>
                </div>
                <hr style="margin: 10px 0; border: none;"> -->

                <!-- Content -->
                <div v-if="listItems.length < 1">
                    <i>🚀</i>
                    <h4>{{ $t('xapp.orders.no_history_orders') }}</h4>
                </div>

                <div v-else class="list-container">
                    
                    <!-- mobile version -->
                    <template v-if="false">
                        <div class="order-card" v-for="(item, index) in listItems">
                            <div class="order-item">
                                <div class="row">
                                    <div class="currency-pair">
                                        <label>{{ currencyCodeFormat(item.TakerGets.currency, 16) }}</label>
                                        <fa style="margin: auto 5px" :icon="['fas', 'arrow-right']" size="xs"/>
                                        <label>{{ currencyCodeFormat(item.TakerPays.currency, 16) }}</label>
                                    </div>
                                    <!-- <label v-if="getOrderTrade(item)" class="trade-label" :class="getOrderTrade(item.created)">{{ getOrderTrade(item.created) }}</label> -->
                                    <label v-if="item.status.active" class="trade-label active">{{ 'active' }}</label>
                                </div>
                                <div class="row">
                                    <h6 class="number">#{{ item.sequence }}</h6>
                                    <h6 class="number" style="margin-left: auto;">{{ epochToDate(item.date.created) }}</h6>
                                </div>
                                <hr>
                                <div class="column">
                                    <h5>
                                        Status:
                                        <span class="number">{{ statusString(item.status) }}</span>
                                    </h5>
                                    <!-- TODO: correct filled status parsing -->
                                    <!-- <h5>
                                        Filled status:
                                        <span class="number">{{ item.filledStatus }}</span>
                                    </h5> -->
                                    <h5>
                                        Selling:
                                        <span class="number">{{ QuantityFormat(item.TakerGets.values.filled, item.TakerGets.currency)}}/{{ QuantityFormat(item.TakerGets.values.created, item.TakerGets.currency) }} {{ currencyCodeFormat(item.TakerGets.currency, 4) }}</span>
                                    </h5>
                                    <h5>
                                        Selling price:
                                        <span class="number">{{ priceFormat(orderPrice(item, 'sell')) }}</span>
                                    </h5>
                                    <h5>
                                        Buying:
                                        <span class="number">{{ QuantityFormat(item.TakerPays.values.filled, item.TakerPays.currency) }}/{{QuantityFormat(item.TakerPays.values.created, item.TakerPays.currency) }} {{ currencyCodeFormat(item.TakerPays.currency, 4) }}</span>
                                    </h5>
                                    <h5>
                                        Buying price:
                                        <span class="number">{{ priceFormat(orderPrice(item, 'buy')) }}</span>
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
                                <SpinnerButton v-if="item.status.active" @click="cancel(item)" style="border-radius: 0 0 10px 0">{{ $t('xapp.orders.cancel') }}</SpinnerButton>
                            </div>
                        </div>
                    </template>

                    <!-- table - Desktop env -->
                    <div v-else class="order-table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Symbol</th>
                                    <th>Status</th>
                                    <th>Selling price</th>
                                    <th>Amount sell</th>
                                    <th>Buying Price</th>
                                    <th>Buying Amount</th>
                                    <th>Condition</th>
                                    <th>Fees</th>
                                    <th>ICONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in listItems">
                                    <!-- Time -->
                                    <td class="number">{{ epochToDate(item.date.created) }}</td>
                                    <!-- Symbol/CurrencyPair -->
                                    <td>
                                        <div class="currency-pair">
                                            <label>{{ currencyCodeFormat(item.TakerGets.currency, 16) }}</label>
                                            <fa style="margin: auto 5px" :icon="['fas', 'arrow-right']" size="xs"/>
                                            <label>{{ currencyCodeFormat(item.TakerPays.currency, 16) }}</label>
                                        </div>
                                    </td>

                                    <!-- Status -->
                                    
                                    <td>
                                        <label v-if="item.status.active" class="trade-label active">{{ 'active' }}</label>
                                        <span v-else>{{ statusString(item.status) }}</span>
                                    </td>

                                    <!-- Selling price: -->
                                    <td class="number">{{ priceFormat(orderPrice(item, 'sell')) }}</td>
                                    <!-- Amount sell -->
                                    <td class="number">{{ QuantityFormat(item.TakerGets.values.filled, item.TakerGets.currency)}}/{{ QuantityFormat(item.TakerGets.values.created, item.TakerGets.currency) }} {{ currencyCodeFormat(item.TakerGets.currency, 4) }}</td>
                                    <!-- Buying Price -->
                                    <td class="number">{{ priceFormat(orderPrice(item, 'buy')) }}</td>
                                    <!-- Buying Amount -->
                                    <td class="number">{{ QuantityFormat(item.TakerPays.values.filled, item.TakerPays.currency) }}/{{QuantityFormat(item.TakerPays.values.created, item.TakerPays.currency) }} {{ currencyCodeFormat(item.TakerPays.currency, 4) }}</td>
                                    <!-- Condition -->
                                    <td>{{ item.condition }}</td>
                                    <!-- Fees: -->
                                    <td class="number">{{ item.fees }} drops</td>

                                    <td>
                                        <fa v-if="item.status.active" :icon="['fas', 'trash-alt']" @click="cancel(item)" />
                                        <fa :icon="['fas', 'external-link-alt']" @click="info(item)" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
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
            activeTable: 'Open Orders',
            availableTables: ['Open Orders', 'History'],
            selectedCurrency: 'All',
            selectedIssuer: 'All',
            filterFailedResults: true,
        }
    },
    computed: {
        currencyList() {
            return this.$store.getters.getOfferCurrencyList
        },
        issuerList() {
            // Todo
            return []
        },
        openOffers() {
            return this.$store.getters.getOpenOffers
        },
        history() {
            return this.$store.getters.getOfferHistory
        },
        historyList() {
            if(this.selectedCurrency === 'All' && !this.filterFailedResults) return this.history
            
            const array = this.history.filter(offer => {
                    if(this.filterFailedResults && offer.status.failed) return false
                    if(this.selectedCurrency === 'All') return true

                    const gets = offer.TakerGets
                    const pays = offer.TakerPays
                    if(gets.currency === this.selectedCurrency || pays.currency === this.selectedCurrency) return true
                    else return false
                })
            return array.sort((a, b) =>  b.sequence - a.sequence )
        },
        openOrderList() {
            const array = this.openOffers.filter(offer => {
                if(this.selectedCurrency === 'All') return true

                const gets = offer.TakerGets
                const pays = offer.TakerPays
                if(gets.currency === this.selectedCurrency || pays.currency === this.selectedCurrency) return true
                else return false
            })
            return array.sort((a, b) =>  b.sequence - a.sequence )
        },
        listItems() {
            switch(this.activeTable) {
                case this.availableTables[0]:
                    return this.openOrderList
                case this.availableTables[1]:
                    return this.historyList
            }
        }
    },
    methods: {
        statusString(statusObj) {
            if(statusObj.failed) return 'Failed'
            if(statusObj.canceled) return 'Canceled'
            if(statusObj.active) return 'Open'
            return 'Closed'
        },
        openTradeView() {
            this.$emitter.emit('changeView', 'trade')
        },
        currencyCodeFormat(string, maxLength) {
            return currencyCodeFormat(string, maxLength)
        },
        currencyFormat(amount, currency) {
            return currencyFormat(amount, currency)
        },
        priceFormat(value) {
            return priceFormat(value)
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
            const TakerPays = order.TakerPays
            const TakerGets = order.TakerGets

            if (trade === 'sell') {
                price = TakerPays.values.created / TakerGets.values.created
                if(TakerPays.currency === 'XRP') price = price / 1_000_000
                if(TakerGets.currency === 'XRP') price = price * 1_000_000
            } else if(trade === 'buy') {
                price = TakerGets.values.created / TakerPays.values.created
                if(TakerPays.currency === 'XRP') price = price * 1_000_000
                if(TakerGets.currency === 'XRP') price = price / 1_000_000
            } else {
                return 0
            }
            return price 
        },
        async cancel(order) {
            if(!order.status.active) {
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
            const txId = (order.status === 'open' ? order.hashes[0] : (order.hashes[order.hashes.length - 1] || order.hashes[0]) )

            if(typeof window.ReactNativeWebView === 'undefined' || process.env.VUE_APP_ENV !== 'XAPP') {
                alert('todo, check for connected node')
                window.open(`https://livenet.xrpl.org/transactions/${txId}`)
                return
            }

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
.account-offers-view-header {
    display: flex;
    flex-direction: row;
    align-items: center;
}
.account-offers-view {
    height: inherit;
    overflow: hidden;
}

.table-filter-options {
    margin-left: auto;
}
.table-wrapper {
    display: flex;
    flex-direction: row;
    overflow: hidden;
    height: calc(100% - 30px);
}

.order-table-container {
    /* display: flex;
    flex-direction: column;
    align-items: center; */
}
.order-table-container table {
    width: 100%;
    font-size: 0.8rem;
    border-collapse: collapse;
}
tr {
    border-bottom: 1px solid black;
}
tbody td {
    text-align: center;
}
h2 {
    margin: 0;
}
h5 {
    margin: 5px 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--grey);
    display: flex;
}
h5 span {
    margin-left: auto;
}
h5 .number {
    color: var(--var-txt-color);
    margin-top: auto;
    margin-bottom: auto;
}
select {
    width: fit-content;
    padding-right: 30px;
    margin-right: 15px;
    border: 1px solid var(--var-border)
}
#history-container {
    /* display: flex;
    flex-direction: column; */
    /* height: inherit; */
    /* overflow: hidden; */
}
#history-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 0;
}
/* .tab-container {
    overflow: hidden;
    flex: 1 1 0;
} */
.list-container {
    /* height: calc(100% - 55px);
    overflow-x: hidden;
    overflow-y: auto; */

    overflow-x: hidden;
    overflow-y: auto;
    width: 100%;
}
.order-card {
    border-radius: 10px;
    background-color: var(--grey5);
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
    border-top: 1px solid var(--var-border); 
    margin: 8px 0 5px -10px;
}
.order-item h6 {
    color: rgb(110, 110, 110);
}
.trade-label {
    padding: 0 8px;
    height: 18px;
    font-size: 0.7rem;
    border-radius: 5px 0px 5px 0px;
    font-weight: 400;
    margin-right: 5px;
    display: flex;
    align-items: center;
}
.trade-label.active {
    margin-top: -1px;
    color: white;
    border: 1px solid var(--green);
    background-color: rgba(0, 128, 0, 0.35);
}
.action-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    /* border-top: 1px solid var(--var-border); */
    max-height: 40px;
}
.action-row a {
    width: 50%;
    background-color: var(--grey3);
    padding: 10px 0;
    text-align: center;
}
.action-row hr {
    width: 1px;
    border-top: none;
    margin: 0;
}
</style>