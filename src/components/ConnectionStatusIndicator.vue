<template>
    <label class="number">
        <fa v-if="online" :icon="['fas', 'wifi']" class="green"/>
        <span v-else class="dot" :style="{ 'background-color': online ? 'green' : 'red' }"></span>
        <label>{{ online ? 'Connected' : 'Not connected' }}</label>
    </label>
</template>

<script>
import client from '../plugins/ws-client'

export default {
    data() {
        return {
            online: false
        }
    },
    mounted() {
        try {
            setInterval(() => {
                this.online = client.getState().online
            }, 500)
        } catch(e) {}
    }
}
</script>

<style scoped>
label > svg {
    margin: 0 5px;
}
.green {
    color: var(--green);
}
</style>
