<template>
    <div id="trade-view-ticker-data-container">
        <div class="column">
            <h2 class="number" :class="{'buy': trend, 'sell': !trend}">{{ priceFormat(marketPrice) }}</h2>
        </div>
        <div id="trade-view-ticker-data-24h" class="column">
            <span>
                <h6>24h High</h6>
                <label class="number">--</label>
            </span>
            <span>
                <h6>24h Low</h6>
                <label class="number">--</label>
            </span>
            <span>
                <h6>24h Volume</h6>
                <label class="number">--</label>
            </span>
        </div>
    </div>
</template>

<script>
import { priceFormat } from '../../plugins/number-format'

export default {
    computed: {
        marketPrice() {
            return this.$store.getters.getMarketPrice
        },
        trend() {
            return this.$store.getters.marketTrend
        }
    },
    methods: {
        priceFormat
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