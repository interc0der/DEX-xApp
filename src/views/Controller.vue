<template>
    <Trade v-show="activeComponent === 'trade'"/>
    <Events v-show="activeComponent === 'events'"/>
    <Data v-if="activeComponent === 'data'"/>
</template>

<script>
import Events from '@/views/Events.vue'
import Trade from '@/views/Trade.vue'
import Data from '@/views/TradeData.vue'

import client from '../plugins/ws-client'

export default {
    components: { Events, Trade, Data },
    data() {
        return {
            activeComponent: 'trade'
        }
    },
    created() {
        this.$emitter.on('changeView', (view) => {
            if(view === 'data') this.$store.dispatch('getChartData')
            this.activeComponent = view
        })

        this.$store.dispatch('getOrderBookData')
        

        this.$emitter.on('changedCurrency', data => {
            this.$store.dispatch('getOrderBookData')

            if(this.activeComponent === 'data') {
                this.$store.dispatch('getChartData')
            }
        })

        // Todo
        let self = this
        client.on('ledger', () => {
            self.$store.dispatch('getCurrentOrderBook')
        })
    }
}
</script>