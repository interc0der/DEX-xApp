<template>
    <Trade v-show="activeComponent === 'trade'"/>
    <Events v-show="activeComponent === 'events'"/>
    <Data v-show="activeComponent === 'data'"/>
</template>

<script>
import Events from '@/views/Events.vue'
import Trade from '@/views/Trade.vue'
import Data from '@/views/TradeData.vue'

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
        })
    }
}
</script>