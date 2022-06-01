<template>
    <div v-if="loading" class="spinner-container">
        <div class="spinner-wrapper">
            <Spinner />
        </div>
    </div>
    <div v-show="!loading" id="light-chart"></div>
</template>

<script>
import CandlestickChart from 'trading-charts'
import Spinner from '@/components/Spinner.vue'

export default {
    components: { Spinner },
    data() {
        return {
            init: false,
            candlestickChart: null,
            loading: false
        }
    },
    computed: {
        interval() {
            const data = this.$store.getters.getSelectedChartInterval
            return data
        },
        chartData() {
            const data = this.$store.getters.getChartData
            return data
        }
    },
    watch: {
        '$store.getters.getChartData': function() {
            if(this.init) {
                console.log('Chart update data')
                this.initChart()
                this.setChartData()
            }
        },
        '$store.getters.getActiveCandleData': function() {
            if(this.init) {
                const data = this.$store.getters.getActiveCandleData
                console.warn('Updated candle stick chart data:', data)

                this.candlestickChart.updateCandlestick(data.time, data.open, data.high, data.low, data.close)
            }
        }
    },
    methods: {
        setChartData() {
            console.log('set chart data...')
            const data = this.chartData
            // console.log(data[0])

            data.forEach(entry => {
                this.candlestickChart.addCandlestick(entry.time, entry.open, entry.high, entry.low, entry.close)
            })
            

            // todo delete me::
            // const ms = 86_400_000
            // const today = new Date().getTime()
            // for(let i = 1; i < 100; i++) {
            //     const calc = today - ms * i
            //     this.candlestickChart.addCandlestick(calc, 0.2 + i * 0.1, 0.45 + i * 0.1, 0.1+ i * 0.1, 0.3 + i * 0.1)
            // }

            this.candlestickChart.draw()

            this.loading = false
        },
        initChart() {
            this.loading = true

            var style = getComputedStyle(document.body)
            const bg = style.getPropertyValue('--var-bg-color')
            const green = style.getPropertyValue('--green')
            const red = style.getPropertyValue('--red')

            this.candlestickChart = new CandlestickChart('light-chart',
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

            // this.candlestickChart.panningAtStartCallback = async () => {
            //     console.warn('test')
            //     await this.$store.dispatch('getChartData', { marker: true })
            // }
        }
    },
    async mounted() {
        try {
            this.loading = true
            await this.$store.dispatch('getChartData')

            this.initChart()
            this.setChartData()
            this.init = true

        } catch(e) {
            console.error('light-chart-error:', e)
            this.loading = false
        }
    }
}
</script>

<style scoped>
.spinner-container {
    height: inherit;
    width: inherit;
    display: flex;
    align-items: center;
}
.spinner-wrapper {
    margin: auto;
}
</style>
