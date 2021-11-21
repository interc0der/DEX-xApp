<template>
    <div class="ticker" :class="{'buy': Math.sign(Number(ticker)) > 0, 'sell': Math.sign(Number(ticker)) < 0}" v-show="!isNaN(ticker)">
        <fa v-if="Math.sign(Number(ticker)) > 0" class="buy" :icon="['fa', 'caret-up']"/>
        <fa v-else-if="Math.sign(Number(ticker)) < 0" class="sell" :icon="['fa', 'caret-down']"/>
        <label class="number">{{ ticker }}%</label>
    </div>
</template>

<script>
export default {
    computed: {
        marketPrice() {
            return this.$store.getters.getMarketPrice
        },
        tickerData() {
            return this.$store.getters.getMarketTickerData
        },
        ticker() {
            const open = this.tickerData.open
            const now = this.marketPrice

            let ticker = ( (now - open) / open ) * 100
            if(isNaN(Number(ticker))) return NaN

            return ticker.toFixed(2)
        }
    }
}
</script>

<style scoped>
.ticker > label {
    margin-left: 2px;
}
.ticker {
    display: flex;
    flex-direction: row;
}
.buy {
    color: var(--green);
}
.sell {
    color: var(--red);
}
</style>