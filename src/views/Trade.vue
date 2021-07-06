<template>
    <div class="container">
        <TradeHeader />
        <hr>
        <div class="row padding">
            <TradeForm />
            <div class="container">
                <OrderBook />
                <!-- <OrderBook @limitPrice="setLimitPrice" @marketSafeChange="toggleMarketOffers" @marketInfo="priceUpdate" /> -->
            </div>
        </div>
        <hr class="divide">
        <Offers />
    </div>
</template>

<script>
import Offers from '@/components/Offers'
import OrderBook from '@/components/OrderBook.vue'
import TradeHeader from '@/components/TradeHeader.vue'
import TradeForm from '@/components/TradeForm.vue'

export default {
    components: { Offers, OrderBook, TradeHeader, TradeForm }    
}
</script>