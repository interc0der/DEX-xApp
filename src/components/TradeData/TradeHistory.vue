<template>
    <table>
        <!-- <colgroup>
            <col span="1" style="width: 100px;">
            <col span="1" style="width: 50%;">
            <col span="1" style="width: 100%;">
        </colgroup> -->

        <thead>
            <tr>
                <th style="width: 100px;">Time Stamp</th>
                <!-- <th>Direction</th> -->
                <th>Price</th>
                <th>QTY</th>
            </tr>
        </thead>

        <tbody v-if="tradeHistory.length > 0">
            <tr v-for="(iteration, index) in (tradeHistory.length - 1)">
                <td class="number">{{ formatTime(tradeHistory[index].executed_time) }}</td>
                <!-- <td class="sell">NA</td> -->
                <td :class="{'buy': tradeHistory[index + 1].rate < tradeHistory[index].rate, 'sell': !tradeHistory[index + 1].rate < tradeHistory[index].rate}" class="number">
                    {{ priceFormat(tradeHistory[index].rate) }}
                    <fa v-if="tradeHistory[index + 1].rate < tradeHistory[index].rate" class="market-price-trend-svg" size="xs" :icon="['fa', 'arrow-up']" />
                    <fa v-else class="market-price-trend-svg" size="xs" :icon="['fa', 'arrow-down']" />
                </td>
                <td class="number">{{ quantityFormat(tradeHistory[index].base_amount) }}</td>
            </tr>
        </tbody>
        <div v-else>
            <i>🚀</i>
            <h4>No trade history data available</h4>
        </div>
    </table>
</template>
<script>
import { quantityFormat, priceFormat } from '../../plugins/number-format'

export default {
    computed: {
        tradeHistory() {
            return this.$store.getters.getAllTradeHistory
        }
    },
    methods: {
        quantityFormat,
        priceFormat,
        formatTime(time) {
            let date = new Date(time)

            const hours = date.getHours()
            const minutes = date.getMinutes()
            const seconds = date.getSeconds()

            const makeDouble = (value) => {
                value = value.toString()
                if(value.length === 1) return '0' + value
                return value
            }
            return `${makeDouble(hours)}:${makeDouble(minutes)}:${makeDouble(seconds)}`
        }
    }
}
</script>

<style scoped>
table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 10px;
    margin-bottom: 60px;
}
th {
    color: var(--grey);
    font-weight: 400;
    font-size: 0.8rem;
}
tbody {
    text-align: center;
    font-size: 0.8rem;
}
tbody td {
    height: 40px;
}
tbody tr:nth-child(even) {
    background-color: var(--grey5);
}
.sell {
    color: var(--red);
}
.buy {
    color: var(--green);
}
</style>
