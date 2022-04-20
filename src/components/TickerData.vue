<template>
    <div class="ticker-data-container">
        <div class="currency-pair">
            <a @click="selectActive = true" class="currency-pair-select-btn">{{ currencyCodeFormat(currencyPair.base.currency) }}/{{ currencyCodeFormat(currencyPair.quote.currency) }}
                <fa size="xs" :icon="['fas', 'chevron-down']"/>
            </a>
        </div>

        <div class="market-price-container">
            <!-- <Ticker /> -->
            <h2 class="number" :class="{'buy': trend > 0, 'sell': trend < 0}">{{ marketPriceError ? '--' : priceFormat(marketPrice) }}</h2>
        </div>

        <div class="market-24h-data">
            <span>
                <h6>24h High</h6>
                <label class="number buy">{{ priceFormat(tickerData.high) || '--' }}</label>
            </span>
            <span>
                <h6>24h Low</h6>
                <label class="number sell">{{ priceFormat(tickerData.low) || '--' }}</label>
            </span>
            <span>
                <h6>24h Volume ({{ currencyCodeFormat(currencyPair.base.currency) }})</h6>
                <label class="number">{{ quantityFormat(tickerData.base_volume) || '--' }}</label>
            </span>
            <span>
                <h6>24h Volume ({{ currencyCodeFormat(currencyPair.quote.currency) }})</h6>
                <label class="number">{{ quantityFormat(tickerData.counter_volume) || '--' }}</label>
            </span>
        </div>

    </div>
    <Select v-show="selectActive" @close="selectActive = false"/>
</template>

<script>
import { currencyCodeFormat, prefixNumber, priceFormat } from '../plugins/number-format'

import Select from '@/components/Select.vue'
import Ticker from './Ticker.vue'

export default {
    components: { Select, Ticker },
    data() {
        return {
            selectActive: false
        }
    },
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
        currencyCodeFormat,
        priceFormat,
        prefixNumber,
        quantityFormat(value) {
            if(isNaN(Number(value))) return null
            return this.prefixNumber(value, 3)
        }
    }
}
</script>

<style scoped>
.ticker-data-container {
    display: flex;
    flex-direction: row;
}
.currency-pair {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0 10px;
    white-space: nowrap;
}
.currency-pair-select-btn {
    color: var(--var-txt-color);
    font-size: 1.5rem;
    font-weight: 400;
    text-align: start;
    padding: 5px 10px;
}
.market-price-container {
    margin: 0 10px;
}
.market-24h-data {
    display: flex;
    flex-direction: row;
    overflow-y: auto;
    padding-left: 30px;
    align-items: center;
}
.market-24h-data > span {
    margin-right: 25px;
    white-space: nowrap;
}
.buy {
    color: var(--green);
}
.sell {
    color: var(--red);
}
</style>
