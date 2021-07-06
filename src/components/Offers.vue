<template>
    <div id="offers" class="column">
        <div class="tab-head row">
            <span @click="activeTabIndex = 0">{{ $t('xapp.orders.orders') }} ({{ Object.keys(offers).length }})</span>
            <span @click="toggleAccountTx()">{{ $t('xapp.orders.history') }}</span>
        </div>
        <hr>
        <div v-if="Object.keys(offers).length < 1 && activeTabIndex === 0" id="no-data-placeholder">
            <i>🚀</i>
            <h4>{{ $t('xapp.orders.no_open_orders') }}</h4>
        </div>
        <!-- txoffers -->
        <div v-else-if="txs.length < 1 && activeTabIndex === 1" id="no-data-placeholder">
            <i>🚀</i>
            <h4>{{ $t('xapp.orders.no_history_orders') }}</h4>
        </div>
        <div v-else class="table-wrapper">
            <div class="table-container">

                <template v-if="activeTabIndex === 0">
                    <div class="order-item" v-for="(item, seq, index) in offers" :key="index">
                        <div class="row" style="margin: 0; padding-left: 5px;">
                            <label v-if="getOrderTrade(item)" class="trade-label" :class="getOrderTrade(item)">{{ getOrderTrade(item) }}</label>
                            <label v-else class="trade-label open">{{ 'open' }}</label>
                        </div>

                        <div class="row" style="padding: 5px 0 5px 15px;">
                            <div class="column">
                                <h6>{{ `${$t('xapp.orders.pay')} (${currencyCodeFormat(item.TakerGets.currency, 16)})`}}</h6>
                                <span class="number">{{ `${currencyFormat(item.TakerGets.value, item.TakerGets.currency)}` }}</span>
                            </div>
                            <div class="column">
                                <h6>{{ `${$t('xapp.orders.get')} (${currencyCodeFormat(item.TakerPays.currency, 16)})` }}</h6>
                                <span class="number">{{ `${currencyFormat(item.TakerPays.value, item.TakerPays.currency)}` }}</span>
                            </div>
                            <div class="column">
                                <h6>Price HC</h6>
                                <span v-if="getOrderTrade(item)" class="number">{{ currencyFormat(getOrderPrice(item), tradingPair.base.currency) }}</span>
                                <span v-else>--</span>
                            </div>
                        </div>
                        <div class="action-row">
                            <a @click="info(item)" class="more-info-btn">{{ $t('xapp.orders.info') }}</a>
                            <SpinnerButton @click.prevent="cancel(item)">{{ $t('xapp.orders.cancel') }}</SpinnerButton>
                        </div>

                    </div>
                </template>

                <template v-else-if="activeTabIndex === 1">
                    <div class="order-item" v-for="(item, index) in txs" :key="index">
                        <div class="row" style="margin: 0; padding-left: 5px;">
                            <label v-if="getOrderTrade(item)" class="trade-label" :class="getOrderTrade(item)">{{ getOrderTrade(item) }}</label>
                            <label v-else class="trade-label open">{{ 'Create' }}</label>
                            <span style="margin-left: auto">DATE: {{ epochToDate(item.date) }}</span>
                        </div>

                        <div class="row" style="padding: 5px 0 5px 15px;">
                            <div class="column">
                                <h6>{{ `${$t('xapp.orders.pay')} (${currencyCodeFormat(item.TakerGets.currency, 16)})`}}</h6>
                                <span class="number">{{ `${currencyFormat(item.TakerGets.value, item.TakerGets.currency)}` }}</span>
                            </div>
                            <div class="column">
                                <h6>{{ `${$t('xapp.orders.get')} (${currencyCodeFormat(item.TakerPays.currency, 16)})` }}</h6>
                                <span class="number">{{ `${currencyFormat(item.TakerPays.value, item.TakerPays.currency)}` }}</span>
                            </div>
                            <div class="column">
                                <h6>Price HC</h6>
                                <span v-if="getOrderTrade(item)" class="number">{{ currencyFormat(getOrderPrice(item), tradingPair.base.currency) }}</span>
                                <span v-else>--</span>
                            </div>
                        </div>
                        <div class="action-row">
                            <a @click="info(item)" class="more-info-btn">{{ $t('xapp.orders.info') }}</a>
                            <!-- <a @click="cancel(item)">{{ $t('xapp.orders.cancel') }}</a> -->
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
// import { parseOrderbookChanges } from 'ripple-lib-transactionparser'
// import { TxMutationParser } from 'tx-mutation-parser'

import xapp from '../plugins/xapp'
import { currencyFormat, currencyCodeFormat, epochToDate } from '../plugins/number-format'

import Spinner from '@/components/Spinner.vue'
import SpinnerButton from '@/components/SpinnerButton.vue'

export default {
    components: { Spinner, SpinnerButton },
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
            return this.$store.getters.getOffers
        }
    },
    watch: {
        account: function () {
            this.setOpenOffers()
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
        toggleAccountTx() {
            this.activeTabIndex = 1
        },
        async cancel(order) {
            try {
                const payload = {
                    txjson: {
                        TransactionType: "OfferCancel",
                        OfferSequence: order.seq || order.Sequence,
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
        versionCheck(v1, v2) {
            var v1parts = v1.split('.');
            var v2parts = v2.split('.');

            // First, validate both numbers are true version numbers
            function validateParts(parts) {
                for (var i = 0; i < parts.length; ++i) {
                    if (!/^\d+$/.test(parts[i])) {
                        return false;
                    }
                }
                return true;
            }
            if (!validateParts(v1parts) || !validateParts(v2parts)) {
                return NaN;
            }

            for (var i = 0; i < v1parts.length; ++i) {
                if (v2parts.length === i) {
                    return 1;
                }

                if (v1parts[i] === v2parts[i]) {
                    continue;
                }
                if (v1parts[i] > v2parts[i]) {
                    return 1;
                }
                return -1;
            }

            if (v1parts.length != v2parts.length) {
                return -1;
            }

            return 0;
        },
        async info(order) {
            const txId = order.PreviousTxnID || order.hash || order.Sequence
            try {
                const data = await xapp.getTokenData()
                if (this.versionCheck(data.version, '2.1.0') < 0) throw 'Update XUMM to use this feature'
                if(data.nodetype === 'MAINNET') xapp.openExternalBrowser(`https://livenet.xrpl.org/transactions/${txId}`)
                else if(data.nodetype === 'TESTNET') xapp.openExternalBrowser(`https://testnet.xrpl.org/transactions/${txId}`)
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
        getOrderPrice(order) {
            const trade = this.getOrderTrade(order)
            let price = 0
            if (trade === 'sell') {
                price = order.TakerPays.value / order.TakerGets.value
                if(order.TakerPays.currency === 'XRP') price = price / 1_000_000
                if(order.TakerGets.currency === 'XRP') price = price * 1_000_000
            } else if(trade === 'buy') {
                price = order.TakerGets.value / order.TakerPays.value
                if(order.TakerPays.currency === 'XRP') price = price * 1_000_000
                if(order.TakerGets.currency === 'XRP') price = price / 1_000_000
            } else {
                return 0
            }
            if(this.tradingPair.base.currency === 'XRP') price = price * 1_000_000
            return price
        },
        // getOrderQuantity(order) {
        //     const trade = this.getOrderTrade(order)
        //     if (trade === 'buy') {
        //         return order.TakerGets.value
        //     } else {
        //         return order.TakerPays.value
        //     }
        // }
        async setOpenOffers() {
            try {
                if(xapp.getAccountData() === null) throw { msg: 'Account not activated', error: false}
                else this.$store.dispatch('setOpenOffers')
            } catch(e) {
                if(e.error !== false) {
                    this.$emitter.emit('modal', {
                        type: 'error',
                        title: this.$t('xapp.error.modal_title'),
                        text: this.$t('xapp.error.get_offer_data'),
                        buttonText: this.$t('xapp.button.close')
                    })
                }
            }
        }
    },
    mounted() {
        // this.setOpenOffers()

        // this.$emitter.on('account_change', () => {
        //     this.setOpenOffers()
        // })
        // this.$rippled.on('transaction', tx => {
        //     if(tx.transaction.TransactionType === 'OfferCreate') {
                
        //         console.log('parsing...')
        //         // const parsed = TxMutationParser(this.account, tx)
        //         const parsed = parseOrderbookChanges(tx.meta)
        //         console.log(parsed)
        //         console.log('result')
                
        //         if (tx.engine_result !== 'tesSUCCESS') {
        //             // Todo show all messages on the possible errors
        //             // tecKilled etc...
        //             this.$notify({
        //                 title: 'Transacion error HC',
        //                 text: `Some info about the TX: ${tx.engine_result}`,
        //                 type: 'error'
        //             })
        //             return // alert(tx.engine_result)
        //         }

        //         const tfImmediateOrCancel = 0x00020000
        //         const tfFillOrKill = 0x00040000
        //         if((tx.transaction.Flags & tfImmediateOrCancel) == tfImmediateOrCancel) {
        //             // Todo get the amount that is filled and show in notification (Always succesfull but amount can be 0)
        //             this.$notify({
        //                 title: 'Immediate Or Cancel TX',
        //                 text: `Some info about the TX: ${tx.engine_result}`,
        //                 type: 'success'
        //             })
        //             return
        //         }
        //         if((tx.transaction.Flags & tfFillOrKill) == tfFillOrKill) {
        //             // Successfull Fill or Kill, the entire amount is filled and not killed message
        //             this.$notify({
        //                 title: 'Fill Or Kill TX',
        //                 text: `Some info about the TX: ${tx.engine_result}`,
        //                 type: 'success'
        //             })
        //             return
        //         }

        //         const offer = this.returnOffer(tx.transaction)
        //         this.offers.unshift(offer)

        //         const offerData = parsed[this.account][0]
        //         this.$notify({
        //             title: 'New Order',
        //             text: `${this.$xapp.currencyFormat(offerData.totalPrice.value, offerData.totalPrice.currency)}${this.$xapp.currencyCodeFormat(offerData.totalPrice.currency, 4)} Exchanged for ${this.$xapp.currencyFormat(offerData.quantity.value, offerData.quantity.currency)}${this.$xapp.currencyCodeFormat(offerData.quantity.currency, 4)}`,
        //             type: 'success'
        //         })
        //     } else if(tx.transaction.TransactionType === 'OfferCancel') {
        //         if (tx.engine_result !== 'tesSUCCESS') {
        //             // Todo
        //             this.$notify({
        //                 title: 'Error in canceling order',
        //                 text: `Result code: ${tx.engine_result}`,
        //                 type: 'error'
        //             })
        //             return
        //         }

        //         // tx.transaction.OfferSequence !== offer.seq
        //         this.offers = this.offers.filter(offer => {
        //             if(tx.transaction.OfferSequence === offer.Sequence) {
        //                 this.$notify({
        //                     title: `Canceled order #${tx.transaction.OfferSequence}`,
        //                     text: `Pay: ${this.$xapp.currencyFormat(offer.TakerGets.value, offer.TakerGets.currency)}${this.$xapp.currencyCodeFormat(offer.TakerGets.currency, 4)} Get: ${this.$xapp.currencyFormat(offer.TakerPays.value, offer.TakerPays.currency)}${this.$xapp.currencyCodeFormat(offer.TakerPays.currency, 4)}`,
        //                     type: 'success'
        //                 })
        //                 return false
        //             } else return true
        //         })
        //     }
        // })
    }
}
</script>

<style scoped>
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
    padding: 5px 10px;
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
    padding: 10px 0;
    text-align: center;
}
.more-info-btn {
    border-right: 1px white solid;
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
