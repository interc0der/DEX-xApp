<template>
    <notifications position="top center" :duration="-1" style="top: 25px;">
        <template v-slot:body="slotProps">
            <div class="my-notification" @click="slotProps.close">
                <fa v-if="slotProps.item.type === 'success'" :icon="['fas', 'check-circle']"/>
                <fa v-else-if="slotProps.item.type === 'error'" :icon="['fas', 'times-circle']"/>
                <fa v-else-if="slotProps.item.type === 'warn'" :icon="['fas', 'exclamation-circle']"/>
                <fa v-else-if="slotProps.item.type === 'info'" :icon="['fas', 'info-circle']"/>
                <div class="text-container">
                    <h6 class="title">
                        {{ slotProps.item.title }}
                    </h6>
                    <p>{{ slotProps.item.text }}</p>
                </div>
            </div>
        </template>
    </notifications>
</template>

<script>
export default {
}
</script>

<style>
.my-notification {
    background-color: black !important;
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
}
.my-notification .text-container h6 {
    margin: 0;
    font-size: 0.8rem;
}
.my-notification .text-container p {
    margin: 0;
    font-size: 0.7rem;
}
</style>