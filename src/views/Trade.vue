<template>
    <div class="container">
        <TradeHeader />
        <hr>
        <div class="row padding">
            <TradeForm />
            <OrderBook />
        </div>
        <hr class="spacer">
        <TradeData />
    </div>
</template>

<script>
import TradeData from '@/components/TradeData.vue'
import OrderBook from '@/components/OrderBook.vue'
import TradeHeader from '@/components/TradeHeader.vue'
import TradeForm from '@/components/TradeForm.vue'

export default {
    components: { TradeData, OrderBook, TradeHeader, TradeForm },
    beforeMount() {
        this.$store.dispatch('getTradeHistory')
        this.$store.dispatch('setLastTradedPrice')
    }
}
</script>

<style scoped>
hr.spacer {
    border: none;
    width: 110%;
    height: 20px;
}
</style>