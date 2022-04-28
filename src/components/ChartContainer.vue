<template>
    <div class="chart-container">

        <div class="chart-header">
            <div class="chart-options-row">
                <label v-for="time in resolutions">
                    <input type="radio" :value="time" name="chart-interval" v-model="interval">
                    <span>{{ time }}</span>
                </label>
            </div>
            <div class="chart-select-tabs tabs-row">
                <label v-for="chart in availableCharts">
                    <input type="radio" :value="chart" name="chart-options" v-model="activeChart"/>
                    <span>{{ chart }}</span>
                </label>
            </div>
        </div>

        <div class="chart-container-view" ref="chartContainer">
            <LightChart v-if="activeChart === 'Basic'"/>
            <DepthChart v-else-if="activeChart === 'Depth'" />
            <Charts v-else-if="activeChart === 'TradingView'" />
        </div>
    </div>
</template>

<script>
// Mobile implementation
import LightChart from '../components/LightChart.vue'

import DepthChart from '../components/DepthChart.vue'
import Charts from '../components/Charts.vue'

export default {
    components: {
        Charts,
        LightChart,
        DepthChart
    },
    data() {
        return {
            activeChart: 'Basic', // Basic/Mobile || Depth
            availableCharts: ['Basic', 'TradingView', 'Depth'],
            resolutions: ['1m', '5m', '1h', '4h', 'D', 'W', 'M']
        }
    },
    computed: {
        interval: {
            get() {
                return this.$store.getters.getSelectedChartInterval
            },
            set(value) {
                this.$store.dispatch('setChartInterval', value)
            }
        },
        parentHeight() {
            return this.$refs?.chartContainer?.clientHeight
        }
    }
}
</script>

<style scoped>
.chart-container {
    height: inherit;
    width: inherit;
}
.chart-header {
    height: 30px;
    width: inherit;

    display: flex;
    flex-direction: row;
    align-items: center;
}
.chart-container-view {
    height: calc(100% - 30px);
    width: 100%;
}
.chart-options-row {
    height: inherit;
    /* width: inherit; */
    display: flex;
    align-items: center;
    padding: 0 10px;
}
.chart-options-row input {
    display: none;
}
.chart-options-row label {
    display: inline-block;
    margin: 0px 3px;
    cursor: pointer;
}
.chart-options-row input + span {
    color: var(--grey);
    transition: 0.5s ease;
}
.chart-options-row input:checked + span {
    color: var(--var-txt-color);
    border-bottom: 1px solid var(--var-primary);
    transition: 0.5s ease;
}
.chart-select-tabs {
    margin-left: auto;
}
</style>
