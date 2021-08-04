<template>
    <div class="row">
        <div class="column">
            <h2 class="number" :class="{'buy': trend, 'sell': !trend}">{{ priceFormat(marketPrice) }}</h2>
        </div>
        <div class="column">
            2 Test
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
    }
}
</script>

<style scoped>
h2 {
    margin: 0;
}
.buy {
    color: var(--green);
}
.sell {
    color: var(--red);
}
</style>