<template>
    <!-- <div class="container">
        <TradeHeader />
        <hr>
        <div class="row padding">
            <TradeForm />
            <OrderBook />
        </div>
        <hr class="divide">
        <TradeData />
    </div> -->
    <Events/>
</template>

<script>
import TradeData from '@/components/TradeData.vue'
import OrderBook from '@/components/OrderBook.vue'
import TradeHeader from '@/components/TradeHeader.vue'
import TradeForm from '@/components/TradeForm.vue'

import Events from '@/views/Events.vue'

export default {
    components: { TradeData, OrderBook, TradeHeader, TradeForm, Events }    
}
</script>