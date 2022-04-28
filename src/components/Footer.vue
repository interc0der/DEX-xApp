<template>
    <footer>
        <div>
            <Indicator @click="popupActive = true"/>
        </div>

        <div class="footer-information">
            <label @click="alert('Terms & Conditions redirect...')">Terms & Conditions</label>
            <label @click="alert('XUMM support redirect...')">support</label>
        </div>

    </footer>
    <PopUp v-if="popupActive">
        <component :is="comp" />
    </PopUp>
</template>

<script>
import Indicator from './ConnectionStatusIndicator.vue'
import PopUp from './PopUp.vue'
import NodeSelect from './NodeSelectOptions.vue'

export default {
    components: {
        Indicator,
        PopUp,
        NodeSelect
    },
    data() {
        return {
            popupActive: false,
            comp: NodeSelect
        }
    },
    methods: {
        alert(msg) {
            alert(msg)
        }
    }
}
</script>

<style scoped>
footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    position: sticky;
    border-top: 1px solid grey;

    padding: 0 10px;
}
.footer-information > label {
    margin: 0 10px;
}
</style>
