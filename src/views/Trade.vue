<template>
    <div class="container">
        <TradeHeader />
        <hr>
        <div class="row padding">
            <TradeForm />
            <hr class="vertical-devider">
            <OrderBook style="max-width: 170px; min-width: 150px; width: 40%"/>
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
    data() {
        return {
            windowHeight: window.innerHeight,
            windowWidth: window.innerWidth
        }
    },
    methods: {
        onResize() {
            this.windowHeight = window.innerHeight
            this.windowWidth = window.innerWidth
        }
    },
    beforeMount() {
        this.$store.dispatch('getTradeHistory')
        this.$store.dispatch('setLastTradedPrice')
    },
    mounted() {
        this.$nextTick(() => {
            window.addEventListener('resize', this.onResize);
        })
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.onResize)
    }
}
</script>

<style scoped>
hr.spacer {
    border: none;
    width: 110%;
    height: 20px;
}
hr.vertical-devider {
    height: 100%;
    width: 15px;
    border: none;
}
</style>