<template>
    <a v-on="listeners" :class="$attrs.class" :id="$attrs.id" :style="$attrs.style">
        <slot v-if="!busy"></slot>
        <Spinner v-else />
    </a>
</template>

<script>
import Spinner from '@/components/Spinner.vue'

export default {
    inheritAttrs: false,
    components: { Spinner },
    data() {
        return {
            busy: false
        }
    },
    computed: {
        listeners() {
            return {
                ...this.$attrs,
                click: this.handleClick
            }
        },
    },
    methods: {
        async handleClick(evt) {
            if(this.busy) return
            try {
                this.busy = true
                await this.$attrs.onClick(evt)
            } catch(e) {
                throw e
            } finally {
                this.busy = false
            }
        }
    }
}
</script>