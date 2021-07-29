<template>
    <notifications position="top center" :duration="-3000" style="top: 25px;" :max="3">
        <template v-slot:body="slotProps">
            <div class="my-notification" @click="slotProps.close">
                <fa class="green-icon" v-if="slotProps.item.type === 'success'" :icon="['fas', 'check-circle']"/>
                <fa class="red-icon" v-else-if="slotProps.item.type === 'error'" :icon="['fas', 'times-circle']"/>
                <fa class="orange-icon" v-else-if="slotProps.item.type === 'warn'" :icon="['fas', 'exclamation-circle']"/>
                <fa v-else-if="slotProps.item.type === 'info'" :icon="['fas', 'info-circle']"/>
                
                <div class="text-container">
                    <div class="notification-header-row">
                        <span class="title">
                            <h4>{{ slotProps.item.title }}</h4>
                        </span>
                        <h6 v-if="slotProps.item.data.sequence">#{{ slotProps.item.data.sequence }}</h6>
                    </div>
                    <!-- <span class="title">
                        <h4>{{ currencyCodeFormat(slotProps.item.data.TakerGets.currency, 4) }}</h4>
                        <fa :icon="['fas', 'arrow-right']" size="xs"/>
                        <h4>{{ currencyCodeFormat(slotProps.item.data.TakerPays.currency, 4) }}</h4>
                    </span> -->
                    <p>{{ slotProps.item.text }}</p>
                </div>

            </div>
        </template>
    </notifications>
</template>

<script>
import { currencyFormat, currencyCodeFormat, quantityFormat, priceFormat } from '../plugins/number-format'

export default {
    methods: {
        quantityFormat(value, currency) {
            if(currency === 'XRP') value = Number(value / 1_000_000)
            return quantityFormat(value)
        },
        priceFormat(value) {
            return priceFormat(value)
        },
        currencyCodeFormat(string, maxLength) {
            return currencyCodeFormat(string, maxLength)
        },
    }
}
</script>

<style>
.vue-notification-wrapper {
    margin-bottom: 10px !important;
}
.my-notification {
    background-color: var(--grey4) !important;
    color: white !important;
    border-radius: 8px;
    padding: 8px 15px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.my-notification .text-container {
    display: flex;
    flex-direction: column;
    margin-left: 15px;
    width: 100%;
}
.my-notification .notification-header-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
    margin: 0;
}
.my-notification .text-container .title {
    font-size: 1rem;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.my-notification .text-container * {
    margin: 0;
    margin-right: 5px;
}
.my-notification .text-container h6 {
    color: var(--grey);
    font-size: 0.8rem;
    font-weight: 400;
}
.my-notification .text-container p {
    margin: 0;
    font-size: 0.7rem;
}
.green-icon {
    color: var(--green);
}
.orange-icon {
    color: var(--orange)
}
.red-icon {
    color: var(--red)
}
</style>