<template>
    <div id="trade-view-ticker-data-container">
        <div class="column">
            <h2 class="number" :class="{'buy': trend > 0, 'sell': trend < 0}">{{ marketPriceError ? '--' : priceFormat(marketPrice) }}</h2>
        </div>
        <div id="trade-view-ticker-data-24h" class="column">
            <span>
                <h6>24h High</h6>
                <label class="number buy">{{ priceFormat(tickerData.high) || '--' }}</label>
            </span>
            <span>
                <h6>24h Low</h6>
                <label class="number sell">{{ priceFormat(tickerData.low) || '--' }}</label>
            </span>
            <span>
                <h6>24h Volume</h6>
                <label class="number">{{ quantityFormat(tickerData.base_volume) || '--' }}</label>
            </span>
        </div>
    </div>
</template>

<script>
import { priceFormat, quantityFormat, prefixNumber } from '../../plugins/number-format'

export default {
    computed: {
        currencyPair() {
            return this.$store.getters.getCurrencyPair
        },
        marketPrice() {
            return this.$store.getters.getMarketPrice
        },
        marketPriceError() {
            return this.$store.getters.getMarketPriceError
        },
        trend() {
            return this.$store.getters.marketTrend
        },
        tickerData() {
            return this.$store.getters.getMarketTickerData
        }
    },
    methods: {
        priceFormat,
        prefixNumber,
        quantityFormat(value) {
            // value = quantityFormat(value)
            if(isNaN(Number(value))) return null
            return this.prefixNumber(value, 3)
        }
    },
    mounted() {
        this.$store.dispatch('getTickerData')
    }
}
</script>

<style scoped>
#trade-view-ticker-data-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0 15px 5px 15px;
}
h2 {
    margin: 0;
    font-weight: 600;
    font-size: 2rem;
}
#trade-view-ticker-data-24h {
    padding-left: 50px;
}
span {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}
.buy {
    color: var(--green);
}
.sell {
    color: var(--red);
}
</style>