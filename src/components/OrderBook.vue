<template>
    <div class="container">
        <table id="orderbook">
            <tr>
                <th class="price">{{ $t('xapp.order_book.price') }}</th>
                <th class="quantity">{{ $t('xapp.order_book.quantity') }}</th>
            </tr>
            <tr v-for="order in orders.sell">
                <td class="price sell number" @click="emitPrice(order.p)">{{ NumberFormat(order.p) }}</td>
                <td class="quantity number">{{ QuantityFormat(order.q) }}</td>
            </tr>
            <tr>
                <td class="number" style="width: 100%" colspan="2">
                    <div id="market-row">
                        <span id="market-price" :class="{'buy': trend, 'sell': !trend}" @click="emitPrice(marketPrice)">
                            <fa class="market-price-trend-svg" size="xs" v-if="trend" :icon="['fa', 'arrow-up']" /><fa class="market-price-trend-svg" size="xs" v-else :icon="['fa', 'arrow-down']" />{{ NumberFormat(marketPrice) }}
                        </span>
                        <!-- <span class="spread">{{ formattedSpread }}Δ</span> -->
                    </div>
                </td>
            </tr>
            <tr v-for="order in orders.buy">
                <td class="price buy number" @click="emitPrice(order.p)">{{ NumberFormat(order.p) }}</td>
                <td class="quantity number">{{ QuantityFormat(order.q) }}</td>
            </tr>
        </table>
    </div>
</template>

<script>
import { LiquidityCheck } from 'xrpl-orderbook-reader'
import client from '../plugins/ws-client'
import { quantityFormat } from '../plugins/number-format'

export default {
    data() {
        return {
            orders: {
                sell: [{ p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }],
                buy: [{ p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }]
            },
            trend: true
        }
    },
    computed: {
        tradingPair() {
            return this.$store.getters.getCurrencyPair
        },
        significance() {
            const sellPrice = Number(this.orders.sell[this.orders.sell.length - 1].p)
            return Number(this.maxDecimals(sellPrice))
        },
        marketPrice() {
            const sellPrice = Number(this.orders.sell[this.orders.sell.length - 1].p)
            const add = this.spread / 2
            const price = sellPrice - add
            return this.round(price, this.significance)
            // return Number(price.toPrecision(this.significance))
        },
        spread() {
            const sellPrice = Number(this.orders.sell[this.orders.sell.length - 1].p)
            const buyPrice = this.orders.buy[0].p
            const spread = (sellPrice - buyPrice)
            return Number(spread)
        }
    },
    watch: {
        marketPrice: function (newPrice, lastPrice) {
            this.$store.dispatch('setMarketPrice', newPrice)
            if(newPrice > lastPrice) this.trend = true
            else this.trend = false
        }
    },
    methods: {
        QuantityFormat(value) {
            return quantityFormat(value)
        },
        NumberFormat(value) {
            const str = value.toString().split('.', 2)
            const int = str[0] || '0'
            const frac = str[1] || ''

            return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (str[1] ? '.' + frac : '')
        },
        emitPrice(value) {
            this.$store.dispatch('setLimitPrice', Number(value))
        },
        async bookOffers() {
            const dataSell = await client.send({
                command: 'book_offers',
                taker_gets: {
                    currency: this.tradingPair.base.currency,
                    issuer: this.tradingPair.base.currency === 'XRP' ? undefined : this.tradingPair.base.issuer
                },
                taker_pays: {
                    currency: this.tradingPair.quote.currency,
                    issuer: this.tradingPair.quote.currency === 'XRP' ? undefined : this.tradingPair.quote.issuer
                }
            })

            const dataBuy = await client.send({
                command: 'book_offers',
                taker_gets: {
                    currency: this.tradingPair.quote.currency,
                    issuer: this.tradingPair.quote.currency === 'XRP' ? undefined : this.tradingPair.quote.issuer
                },
                taker_pays: {
                    currency: this.tradingPair.base.currency,
                    issuer: this.tradingPair.base.currency === 'XRP' ? undefined : this.tradingPair.base.issuer
                }
            })
            
            const askBook = dataSell.offers
            const bidBook = dataBuy.offers
            this.orders.sell = this.formatOrderBook(dataSell.offers).reverse()
            this.orders.buy = this.formatOrderBook(dataBuy.offers, true)
        },
        maxDecimals(float) {
            const value = Math.trunc(float)
            const length = value.toString().length
            if(length > 1) {
                return 2
            } else {
                if(value < 1) {
                    return 4
                } else {
                    return 3
                }
            }
        },
        formatOrderBook(offers, reverse) {
            if(offers.length < 1) return [{ p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }]

            let multiplier = 1
            if(reverse) {
                if(this.tradingPair.base.currency === 'XRP') multiplier = 0.000_001
                else if(this.tradingPair.quote.currency === 'XRP') multiplier = 1_000_000
            } else {
                if(this.tradingPair.base.currency === 'XRP') multiplier = 1_000_000
                else if(this.tradingPair.quote.currency === 'XRP') multiplier = 0.000_001
            }

            let precision = this.maxDecimals(reverse ? Math.pow(offers[0].quality * multiplier, -1) : offers[0].quality * multiplier)

            let index = 0
            const array = []
            for(let i = 0; offers.length > i; i++) {
                const offer = offers[i]
                const obj = {
                    p: 0,
                    q: 0
                }

                var quantity = 0
                if(this.tradingPair.base.currency === 'XRP') {
                    if(reverse) quantity = offer.TakerPays / 1_000_000
                    else quantity = offer.TakerGets / 1_000_000
                } else {
                    if(reverse) quantity = offer.TakerPays.value
                    else quantity = offer.TakerGets.value
                }
                

                if(i === 0) {
                    obj.p = this.round(reverse ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier, precision)
                    obj.q = quantity
                } else {
                    const price = this.round(reverse ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier, precision)
                    if(array[index].p === price) {
                        array[index].q = Number(quantity) + Number(array[index].q)
                        continue
                    } else {
                        index++
                        if(index >= 5) break
                        obj.p = price
                        obj.q = quantity
                    }
                }
                array.push(obj)
            }
            return array
        },
        round(value, decimals) {
            value = Number(value)
            if(value < 1) return value.toPrecision(decimals)
            const integerLength = (value.toFixed(0)).length
            return value.toPrecision(decimals + integerLength)
            // return Number(Math.round(value+'e'+decimals)+'e-'+decimals)
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
    async mounted() {
        this.bookOffers()
        this.liquidityCheck()
        client.on('ledger', () => {
            this.bookOffers()
        })
        this.$emitter.on('changedCurrenct', data => {
            this.orders = {
                sell: [{ p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }],
                buy: [{ p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }, { p: 0.0000, q: 0 }]
            }
            this.bookOffers()
            this.liquidityCheck()
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
