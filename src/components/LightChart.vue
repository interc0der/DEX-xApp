<template>
    <div id="light-chart"></div>
</template>

<script>
import CandlestickChart from 'trading-charts'
// import CandlestickChart from '../plugins/CandlestickChartDiv'

import axios from 'redaxios'

export default {
    data() {
        return {

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
        chartData() {
            const data = this.$store.getters.getChartData
            return data
        }
    },
    methods: {
        setChartData(candlestickChart) {
            console.log('set data...')
            // var json = await axios.get("https://api.binance.com/api/v3/klines?symbol=XRPUSDT&interval=5m&limit=500")
            // json = json.data
            // for (let i = 0 ; i < json.length ; ++i) {
            //     candlestickChart.addCandlestick( json[i][0] , json[i][1] , json[i][2] , json[i][3] , json[i][4] )
            // }

            const data = this.chartData
            console.log(data[0])

            data.forEach(entry => {
                candlestickChart.addCandlestick(Date.parse(entry.start), entry.open, entry.high, entry.low, entry.close)
            })
            candlestickChart.draw()
        }
    },
    async mounted() {
        try {
            await this.$store.dispatch('getChartData')

            var style = getComputedStyle(document.body)
            const bg = style.getPropertyValue('--var-bg-color')
            const green = style.getPropertyValue('--green')
            const red = style.getPropertyValue('--red')

            var candlestickChart = new CandlestickChart('light-chart',
                {
                    fillWidth : true,
                    fillHeight : true,
                    marginRight: 10,
                    overlayMode : "click",
                    fontSize: 16,
                    backgroundColor: bg,
                    overlayBackgroundColor: '#000',
                    overlayTextColor: "#cccccc",
                    scrollZoomSensitivity: 50,
                    allowOverPanning: true,
                    panningAccelerationDamping: 0.9,

                    greenColor: green,
                    redColor: red,
                    crosshairColor: '#FFF',

                    gridColor: '#000',
                    yGridCells: 5
                })

            this.setChartData(candlestickChart)

        } catch(e) {
            console.error('light-chart-error:', e)
        }
        return
    }
}
</script>

<style scoped>
#light-chart {    
    /* height: inherit;
    width: inherit; */
}
</style>
