<template>
    <div class="container">

        <div class="orderbook-container">
            <span class="price">{{ $t('xapp.order_book.price') }}</span>
            <span class="quantity">{{ $t('xapp.order_book.quantity') }}</span>

            <!-- Row 2 -->
            <template v-if="askSide.length > 0 && isReady">
                <div v-for="(order, index) in askSide" class="orderbook-grid-row-wrapper">
                    
                    <span :style="{ 'grid-row': index + 2, 'grid-column': 1, 'z-index': 2 }" class="price sell number" @click="emitPrice(order.price)">
                        {{ priceFormat(order.price) }}
                    </span>
                    <span :style="{ 'grid-row': index + 2, 'grid-column': 2, 'z-index': 2 }" class="quantity number">{{ QuantityFormat(order.quantity) }}</span>

                    <div class="volume-bar-wrapper" :style="{ 'grid-row': index + 2 }">
                        <div class="volume-bar-indicator red" :style="{ width: $store.getters.getIndicatorProgress(order.quantity, 'ask') }"></div>
                    </div>
                        
                </div>
            </template>

            <template v-else>
                <div v-for="index in 5" class="orderbook-grid-row-wrapper">
                    <span class="price sell number">--</span>
                    <span class="quantity number">--</span>
                </div>
            </template>

            <!-- Row 7 -->
            <div id="market-row" class="number">
                <span id="market-price" :class="{'buy': marketTrend > 0, 'sell': marketTrend < 0}" @click="emitPrice(marketPrice)">
                    <fa class="market-price-trend-svg" size="xs" v-if="marketTrend > 0" :icon="['fa', 'arrow-up']" /><fa class="market-price-trend-svg" size="xs" v-else-if="marketTrend < 0" :icon="['fa', 'arrow-down']" />{{ marketPriceError ? '--' : priceFormat(marketPrice) }}
                </span>
            </div>


            <!-- start row 8 -->
            <template v-if="bidSide.length > 0 && isReady">
                <div v-for="(order, index) in bidSide" class="orderbook-grid-row-wrapper">

                    <span :style="{ 'grid-row': index + 8, 'grid-column': 1, 'z-index': 2 }" class="price buy number" @click="emitPrice(order.price)">{{ priceFormat(order.price) }}</span>
                    <span :style="{ 'grid-row': index + 8, 'grid-column': 2, 'z-index': 2 }" class="quantity number">{{ QuantityFormat(order.quantity) }}</span>


                    <div class="volume-bar-wrapper" :style="{ 'grid-row': index + 8 }">
                        <div class="volume-bar-indicator green" :style="{ width: $store.getters.getIndicatorProgress(order.quantity, 'bid') }"></div>
                    </div>
                </div>
            </template>

            <template v-else>
                <div v-for="index in 5" class="orderbook-grid-row-wrapper">
                    <span class="price buy number">--</span>
                    <span class="quantity number">--</span>
                </div>
            </template>


        </div>
    </div>
</template>

<script>
import { LiquidityCheck } from 'xrpl-orderbook-reader'
import client from '../plugins/ws-client'
import { quantityFormat, priceFormat, prefixNumber } from '../plugins/number-format'

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
        },
        marketPriceError() {
            return this.$store.getters.getMarketPriceError
        }
    },
    methods: {
        priceFormat,
        prefixNumber,
        QuantityFormat(value) {
            if(this.tradingPair.base.currency === 'XRP') value = value / 1_000_000
            return this.prefixNumber(value, 3)
            return quantityFormat(value, this.tradingPair.base.currency)
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
        this.$emitter.on('changedCurrency', data => {
            self.liquidityCheck()
        })
    }
}
</script>

<style scoped>
.orderbook-container {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: minmax(20px, 1fr);
    font-size: 1rem;
}
.orderbook-grid-row-wrapper {
    display: contents;
    height: 20px;
}
.orderbook-grid-row-wrapper > span {
    display: flex;
    align-items: center;
    min-height: 20px;
    text-align: center;
    padding: 2px 10px;
}
.orderbook-grid-row-wrapper > span:nth-child(2) {
    margin-left: auto;
}
.volume-bar-indicator {
    position: absolute;

    width: 0;
    top: 0;
    right: 0;

    /* background-color: rgba(255, 0, 0, 0.2); */
    height: 100%;

}
.volume-bar-wrapper {
    position: relative;
    width: 100%;
    height: 100%;

    grid-column-start: 1;
    grid-column-end: span 2;
    z-index: 1;
}
#market-row {
    grid-column-start: 1;
    grid-column-end: span 2;

    display: flex;
    flex-direction: row;
    white-space: nowrap;
}
#market-price {
    /* padding: 10px 0; */
    font-size: 20px;
    font-weight: 600;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: auto;
}
.market-price-trend-svg {
    transform: scale(0.8);
}
.price {
    /* font-weight: 600; */
    text-align: start;
}
.quantity {
    text-align: end;
}
.sell {
    color: var(--red);
}
.buy {
    color: var(--green);
}
.volume-bar-indicator.red {
    background-color: var(--red);
    opacity: 0.2;
}
.volume-bar-indicator.green {
    background-color: var(--green);
    opacity: 0.2;
}
</style>
