<template>
    <div class="container">
        <table id="orderbook">
            <tr>
                <th class="price">{{ $t('xapp.order_book.price') }}</th>
                <th class="quantity">{{ $t('xapp.order_book.quantity') }}</th>
            </tr>
            <template v-if="askSide.length > 0 && isReady">
                <tr v-for="order in askSide">
                    <td class="price sell number" @click="emitPrice(order.price)">{{ priceFormat(order.price) }}</td>
                    <td class="quantity number">{{ QuantityFormat(order.quantity) }}</td>
                </tr>
            </template>
            <template v-else>
                <tr v-for="index in 5">
                    <td class="price sell number">--</td>
                    <td class="quantity number">--</td>
                </tr>
            </template>

            <tr>
                <td class="number" style="width: 100%" colspan="2">
                    <div id="market-row">
                        <span id="market-price" :class="{'buy': marketTrend, 'sell': !marketTrend}" @click="emitPrice(marketPrice)">
                            <fa class="market-price-trend-svg" size="xs" v-if="marketTrend" :icon="['fa', 'arrow-up']" /><fa class="market-price-trend-svg" size="xs" v-else :icon="['fa', 'arrow-down']" />{{ priceFormat(marketPrice) }}
                        </span>
                    </div>
                </td>
            </tr>

            <template v-if="bidSide.length > 0 && isReady">
                <tr v-for="order in bidSide">
                    <td class="price buy number" @click="emitPrice(order.price)">{{ priceFormat(order.price) }}</td>
                    <td class="quantity number">{{ QuantityFormat(order.quantity) }}</td>
                </tr>
            </template>
            <template v-else>
                <tr v-for="index in 5">
                    <td class="price buy number">--</td>
                    <td class="quantity number">--</td>
                </tr>
            </template>
        </table>
    </div>
</template>

<script>
import { LiquidityCheck } from 'xrpl-orderbook-reader'
import client from '../plugins/ws-client'
import { quantityFormat, priceFormat } from '../plugins/number-format'

export default {
    data() {
        return {}
    },
    computed: {
        isReady() {
            return this.$store.getters.getOrderBookReadyState
        },
        getOrderBookData() {
            return this.$store.getters.getOrderBookData
        },
        askSide() {
            return this.getOrderBookData.asks.slice(0, 5).reverse()
        },
        bidSide() {
            return this.getOrderBookData.bids.slice(0, 5)
        },
        tradingPair() {
            return this.$store.getters.getCurrencyPair
        },
        marketPrice() {
            return this.$store.getters.getMarketPrice
        },
        marketTrend() {
            return this.$store.getters.marketTrend
        }
    },
    methods: {
        priceFormat,
        QuantityFormat(value) {
            if(this.tradingPair.base.currency === 'XRP') value = value / 1_000_000
            return quantityFormat(value)
        },
        emitPrice(value) {
            this.$emitter.emit('limitPriceUpdate', value)
        },
        async liquidityCheck() {
            // if base is xrp amount = 500 
            // else get price data from ledger
            if(this.tradingPair.base.currency === 'XRP' || this.tradingPair.quote.currency === 'XRP') {
                const orders = new LiquidityCheck({
                    trade: {
                        from: {
                            currency: 'XRP'
                        },
                        to: {
                            currency: this.tradingPair.base.currency === 'XRP' ? this.tradingPair.quote.currency : this.tradingPair.base.currency,
                            issuer: this.tradingPair.base.currency === 'XRP' ? this.tradingPair.quote.issuer : this.tradingPair.base.issuer
                        },
                        amount: 500
                    },
                    options: {
                        includeBookData: false,
                        rates: 'to',
                        maxSpreadPercentage: 5,
                        maxSlippagePercentage: 10,
                        maxSlippagePercentageReverse: 10,
                    },
                    method: client.send
                })
                const orderBookObj = await orders.get()
                this.$store.dispatch('toggleSafeMarket', orderBookObj.safe)
                console.log('Market ortder is safe?: ' + orderBookObj.safe)
            } else {
                const ordersForRate = new LiquidityCheck({
                    trade: {
                        from: {
                            currency: 'XRP'
                        },
                        to: {
                            currency: this.tradingPair.base.currency,
                            issuer: this.tradingPair.base.issuer
                        }
                    },
                    options: {
                        includeBookData: false,
                        rates: 'to',
                        maxBookLines: 1
                    },
                    method: client.send
                })
                const rateObj = await ordersForRate.get()
                // calculate the price then check liquidity again with amount is 500 * price
                const liquidityAmount = Number(500 * rateObj.rate)

                const orders = new LiquidityCheck({
                    trade:                 {
                        from: {
                            currency: this.tradingPair.base.currency,
                            issuer: this.tradingPair.base.issuer
                        },
                        to: {
                            currency: this.tradingPair.quote.currency,
                            issuer: this.tradingPair.quote.issuer
                        },
                        amount: liquidityAmount
                    },
                    options: {
                        includeBookData: false,
                        rates: 'to',
                        maxSpreadPercentage: 5,
                        maxSlippagePercentage: 10,
                        maxSlippagePercentageReverse: 10,
                    },
                    method: client.send
                })
                const orderBookObj = await orders.get()
                this.$store.dispatch('toggleSafeMarket', orderBookObj.safe)
                console.log('Market ortder is safe?: ' + orderBookObj.safe)
            }
        }
    },
    mounted() {
        this.$store.dispatch('getOrderBookData')
        this.liquidityCheck()

        let self = this
        client.on('ledger', () => {
            self.$store.dispatch('getOrderBookData')
        })

        this.$emitter.on('changedCurrency', data => {
            // Todo: No emitter 
            self.liquidityCheck()
        })
    }
}
</script>

<style scoped>
#orderbook {
    /* height: 100%; */
    width: 100%;
    font-size: 1rem;
}
table td {
    width: 50%;
}
#market-row {
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    width: 100%;
}
#market-price {
    padding: 10px 0;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: auto
}
.market-price-trend-svg {
    transform: scale(0.8);
}
#orderbook .price {
    /* font-weight: 600; */
    text-align: start;
}
#orderbook .quantity {
    text-align: end;
}
#orderbook .sell {
    color: var(--red);
}
#orderbook .buy {
    color: var(--green);
}
</style>
