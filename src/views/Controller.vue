<template>
    <Trade v-show="activeComponent === 'trade'"/>
    <Events v-show="activeComponent === 'events'"/>
</template>

<script>
import Events from '@/views/Events.vue'
import Trade from '@/views/Trade.vue'

export default {
    components: { Events, Trade },
    data() {
        return {
            activeComponent: 'trade'
        }
    },
    created() {
        this.$emitter.on('changeView', (view) => {
            this.activeComponent = view
        })
    }
}
</script>