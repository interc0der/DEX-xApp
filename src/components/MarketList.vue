<template>
    <div class="market-list">
        <div class="market-list-header">
            <div class="search-bar-container">
                <input type="text" placeholder="Search" v-model="search">
            </div>
            <div class="tabs-row">
                <label v-for="table in availableTables">
                    <input type="radio" :value="table" name="market-tabs" v-model="activeTable"/>
                    <span>{{ table }}</span>
                </label>
            </div>
            <hr>
        </div>

        <div class="market-list-container">
            <div class="market-list-sort-options">
                <span>Tokens</span>
                <span>Price</span>
                <span>24H Change</span>
            </div>
            <div class="market-list-wrapper">
                <div class="list">
                    <div class="tr" v-for="token in 50">
                        <div class="td" style="margin-right: auto">BTC</div>
                        <div class="td number" style="width: 75px">30,499.75</div>
                        <div class="td number" style="width: 50px">+0.79%</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            search: null,
            activeTable: 'XRP',
            availableTables: ['XRP', 'USD']
        }
    },
    computed: {

    },
    mounted() {
        console.log('test')
        this.$store.dispatch('getActiveMarketTokenList')
    }
}
</script>

<style scoped>
.market-list {
    height: 100%;
}
.market-list-header {
    height: 75px;
    display: flex;
    flex-direction: column;
}
.market-list-header .search-bar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 10px 0;
}
.market-list-container {
    height: calc(100% - 75px);
}
.market-list-wrapper {
    height: calc(100% - 25px);
    overflow-y: auto;
}
.market-list-sort-options {
    display: flex;
    align-items: center;
    height: 25px;
    font-size: 0.8rem;
}
.tr {
    display: flex;
    align-items: center;
}
</style>