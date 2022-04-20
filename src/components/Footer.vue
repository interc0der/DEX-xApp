<template>
    <footer>
        <div>
            <Indicator @click="alert('Popup with connection settings')"/>
        </div>

        <div class="footer-information">
            <label @click="alert('Terms & Conditions redirect...')">Terms & Conditions</label>
            <label @click="alert('XUMM support redirect...')">support</label>
        </div>

    </footer>
</template>

<script>
import Indicator from './ConnectionStatusIndicator.vue'

export default {
    components: {
        Indicator
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
