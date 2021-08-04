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
            activeComponent: 'data'
        }
    },
    created() {
        this.$emitter.on('changeView', (view) => {
            this.activeComponent = view
        })
        this.$store.dispatch('getOrderBookData')
    }
}
</script>