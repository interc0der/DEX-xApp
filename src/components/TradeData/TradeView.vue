<template>
    <div id="trade-view-container">
        <div id="chart-view-options-row" class="number">
            <label>
                <input type="radio" value="1hour" name="chart-interval" v-model="interval">
                <span>1h</span>
            </label>
            <label>
                <input type="radio" value="2hour" name="chart-interval" v-model="interval">
                <span>2h</span>
            </label>
            <label>
                <input type="radio" value="4hour" name="chart-interval" v-model="interval">
                <span>4h</span>
            </label>
            <label>
                <input type="radio" value="1day" name="chart-interval" v-model="interval">
                <span>1d</span>
            </label>
            <label>
                <input type="radio" value="3day" name="chart-interval" v-model="interval">
                <span>3d</span>
            </label>
            <label>
                <input type="radio" value="7day" name="chart-interval" v-model="interval">
                <span>7d</span>
            </label>
            <label>
                <input type="radio" value="1month" name="chart-interval" v-model="interval">
                <span>1m</span>
            </label>
        </div>
        <div id="chart-view"></div>
    </div>
</template>

<script>
import { createChart, CrosshairMode } from 'lightweight-charts'

export default {
    data() {
        return {
            candleSeries: undefined
        }
    },
    computed: {
        interval: {
            get() {
                return this.$store.getters.getSelectedChartInterval
            },
            set(value){
                this.$store.dispatch('setChartInterval', value)
            }
        }
    },
    watch: {
        '$store.getters.getChartData': function() {
            console.log('wow update')
            this.setChartData()
        }
    },
    methods: {
        setChartData() {
            const data = this.$store.getters.getChartData
            let array = []
            data.forEach(entry => {
                array.unshift({
                    time: Math.floor(Date.parse(entry.start) / 1000),
                    open: Number(entry.open),
                    high: Number(entry.high),
                    low: Number(entry.low),
                    close: Number(entry.close)
                })
            })
            if(array.length > 0) this.candleSeries.setData(array)
        }
    },
    mounted() {
        var style = getComputedStyle(document.body)
        const bg = style.getPropertyValue('--var-bg-color')
        
        const green = style.getPropertyValue('--green')
        const red = style.getPropertyValue('--red')

        const line = style.getPropertyValue('--var-border')

        var chart = createChart('chart-view', {
            layout: {
                backgroundColor: 'rgba(0,0,0,0)',
                textColor: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'din-2014, sans-serif'
            },
            grid: {
                vertLines: {
                    color: line,
                },
                horzLines: {
                    color: line,
                }
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            priceScale: {
                position: 'right',
                borderColor: line,
                alignLabels: false,
                borderVisible: false
            },
            timeScale: {
                borderColor: line,
            }
        })

        this.candleSeries = chart.addCandlestickSeries({
            upColor: 'rgba(48, 209, 88, 0.4)',
            downColor: 'rgba(255, 69, 58, 0.4)',
            borderDownColor: red,
            borderUpColor: green,
            wickDownColor: red,
            wickUpColor: green,
        })
        this.$store.dispatch('getChartData')
    }
}
</script>

<style>
#trade-view-container {
    
}
#chart-view-options-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 30px;
}
#chart-view-options-row input {
    display: none;
}
#chart-view-options-row label {
    display: inline-block;
    margin: 5px 10px;
    cursor: pointer;
}
#chart-view-options-row input + span {
    color: var(--grey);
    transition: 0.5s ease;
}
#chart-view-options-row input:checked + span {
    color: var(--var-txt-color);
    border-bottom: 1px solid var(--var-primary);
    transition: 0.5s ease;
}
#chart-view {
    width: calc(100% + 40px);
    height: 400px;
}
#chart-view table tr > td:first-child+td+td > div {
    /* background-color: red; */
    left: -35px !important;
}
</style>