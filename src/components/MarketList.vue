<template>
    <div class="market-list">
        <div class="market-list-header">
            <div class="search-bar-container">
                <input type="text" placeholder="Search" v-model="search">
            </div>
            <div class="tabs-row">
                <label v-for="(table, index, key) in getTokenList">
                    <input type="radio" :value="index" name="market-tabs" v-model="activeCurrency"/>
                    <span>{{ index }}</span>
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
                    <div class="tr" v-for="token in tokenList">
                        <div class="td" style="margin-right: auto">{{ currencyCodeFormat(token.currency) }}</div>
                        <div class="td number" style="width: 125px">{{ priceFormat(token.market) }}</div>
                        <div class="td number" style="width: 50px">!todo! +1.35%</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { quantityFormat, priceFormat, currencyFormat, prefixNumber, currencyCodeFormat } from '../plugins/number-format'

export default {
    data() {
        return {
            search: null,
            activeCurrency: 'XRP',
            // availableTables: ['XRP', 'USD']
        }
    },
    computed: {
        getTokenList() {
            return this.$store.getters.getActiveMarketTokenList
        },
        tokenList() {
            const list = this.getTokenList[this.activeCurrency]
                // todo filter
            if(this.search) {
                return list.filter(item => {
                    return item.currency.toLowerCase().indexOf(this.search.toLowerCase()) !== -1
                })
            } else {
                return list
            }
        }
    },
    methods: {
        priceFormat,
        currencyFormat,
        currencyCodeFormat
    },
    mounted() {
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