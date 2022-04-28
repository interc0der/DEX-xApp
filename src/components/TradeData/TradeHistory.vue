<template>
    <div class="trade-data-table-wrapper">
        <table>
            <colgroup>
                <col span="1">
                <col span="1">
                <col span="1" style="width: 70px;">
            </colgroup>

            <thead>
                <tr>
                    <th>Price</th>
                    <th class="quantity">Quantity</th>
                    <th>Time Stamp</th>
                </tr>
            </thead>

            <tbody v-if="tradeHistory.length > 0">
                <tr v-for="(item, index) in tradeHistory">

                    <!-- Last in Array -->
                    <template v-if="index === (tradeHistory.length - 1)">
                        <td class="number buy price">
                            {{ priceFormat(tradeHistory[index]?.rate) }}
                            <fa class="market-price-trend-svg" size="xs" :icon="['fa', 'arrow-up']" />
                        </td>
                        <td class="number quantity">{{ quantityFormat(tradeHistory[index]?.base_amount) }}</td>
                        <td class="number timestamp">{{ formatTime(tradeHistory[index]?.executed_time) }}</td>
                    </template>

                    <template v-else>
                        <td 
                            class="number price"
                            :class="{'buy': tradeHistory[index + 1].rate < tradeHistory[index].rate, 'sell': !tradeHistory[index + 1].rate < tradeHistory[index].rate}">
                                
                                {{ priceFormat(tradeHistory[index].rate) }}
                                <fa v-if="tradeHistory[index + 1].rate < tradeHistory[index]?.rate" class="market-price-trend-svg" size="xs" :icon="['fa', 'arrow-up']" />
                                <fa v-else class="market-price-trend-svg" size="xs" :icon="['fa', 'arrow-down']" />
                        </td>
                        <td class="number quantity">{{ quantityFormat(tradeHistory[index]?.base_amount) }}</td>
                        <td class="number timestamp">{{ formatTime(tradeHistory[index].executed_time) }}</td>
                    </template>
                </tr>
            </tbody>
            <div v-else>
                <i>🚀</i>
                <h4>No trade history data available</h4>
            </div>
        </table>
    </div>
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
.trade-data-table-wrapper {
    height: 100%;
    overflow-y: auto;
}
table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 10px;
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
    height: 1.2rem;
}
tbody td.price {
    text-align: left;
    padding-left: 10px;
    margin: auto;
}
thead th.quantity {
    text-align: right;
    padding-right: 15px;
}
tbody td.quantity {
    text-align: right;
    padding-right: 15px;
}
tbody td.timestamp {
    text-align: right;
    padding-right: 10px;
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
.neutral {
    color: var(--orange);
}
</style>
