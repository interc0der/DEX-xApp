<template>
    <div id="trade-view-container">
        <div id="chart-view-options-row" class="number">
            <label>
                <input type="radio" value="1h" name="chart-interval" v-model="interval">
                <span>1h</span>
            </label>
            <label>
                <input type="radio" value="2h" name="chart-interval" v-model="interval">
                <span>2h</span>
            </label>
            <label>
                <input type="radio" value="4h" name="chart-interval" v-model="interval">
                <span>4h</span>
            </label>
            <label>
                <input type="radio" value="D" name="chart-interval" v-model="interval">
                <span>D</span>
            </label>
            <label>
                <input type="radio" value="W" name="chart-interval" v-model="interval">
                <span>W</span>
            </label>
            <label>
                <input type="radio" value="M" name="chart-interval" v-model="interval">
                <span>M</span>
            </label>
        </div>
        <div class="chart-view-container">
            <LightChart />
            <!-- <div id="chart-loader">
                <Spinner v-if="chartLoading"/>
                <h2 v-else-if="!chartAvailable">no chart data available</h2>
            </div> -->
            <!-- <div id="chart-view"></div> -->
            <!-- <span>The chart is temporary disabled while we work on improving the chart data provider. As users have pointed out, the data provider we previously used wasn't always up to date with the XRP Ledger order books. We're working on it!</span> -->
        </div>
    </div>
</template>

<script>
import LightChart from '@/components/LightChart.vue'

// import { createChart, CrosshairMode } from 'lightweight-charts'
import Spinner from '@/components/Spinner.vue'

export default {
    components: { Spinner, LightChart },
    data() {
        return {
            candleSeries: undefined,
            chartLoading: true,
            chartAvailable: false,
            hasOpenCandle: false,
            openCandleData: {
                time: Number(0),
                open: Number(0),
                high: Number(0),
                low: Number(0),
                close: Number(0)
            },
            streamedData: []
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
    // watch: {
    //     '$store.getters.getChartData': function() {
    //         console.log('Chart update data')
    //         this.setChartData()
    //     }
    // },
    methods: {
        initChart() {
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
        },
        setChartData() {
            if(!this.candleSeries) {
                console.warn('Init chart no candle series')
                this.initChart()
            }

            const data = this.$store.getters.getChartData
            let array = []


            // todo delelte fake data
            if(data.length <= 0) {
                // for(let i = 0; i < 50; i++) {
                //     array.unshift({
                //         time: `19${45 + i}-01-01`,
                //         value: Number( (i + 1) / 2),
                //     })
                // }
                this.candleSeries.setData([
                    { time: '2021-01-01', Value: 8 },
                    { time: '2021-02-01', Value: 9 },
                    { time: '2021-03-01', Value: 7 },
                    { time: '2021-04-01', Value: 8 },
                    { time: '2021-05-01', Value: 7 },
                    { time: '2021-06-01', Value: 8 },
                    { time: '2021-07-01', Value: 9 },
                    { time: '2021-08-01', Value: 7 },
                    { time: '2021-09-01', Value: 8 },
                ])
                this.chartAvailable = true
                this.chartLoading = false
                return
            }

            data.forEach(entry => {
                array.unshift({
                    time: Math.floor(Date.parse(entry.start) / 1000),
                    open: Number(entry.open),
                    high: Number(entry.high),
                    low: Number(entry.low),
                    close: Number(entry.close)
                })
            })
            if(array.length > 0) {
                this.candleSeries.setData(array)
                this.chartAvailable = true
            } else this.chartAvailable = false
            this.chartLoading = false
        },
        updateChart(data) {
            if(!this.candleSeries) return
            const chartData = this.$store.getters.getChartData

            if( !(chartData.length > 0) ) {
                console.warn('No Chartdata available')
                // todo
            }

            // const now = Math.floor(Date.now() / 1000) 
            // let last = Math.floor(Date.parse(entry.start) / 1000)
            const now = new Date()
            const open = chartData[0].start
            let last = new Date(open)

            switch(this.interval) {
                case '1hour':
                    last.setUTCHours(last.getUTCHours() + 1)
                    // interval = 3600
                    break
                case '2hour':
                    last.setUTCHours(last.getUTCHours() + 2)
                    // interval = 7200
                    break
                case '4hour':
                    last.setUTCHours(last.getUTCHours() + 3)
                    // interval = 14400
                    break
                case '1day':
                    last.setUTCDate(last.getUTCDate() + 1)
                    // interval = 86400
                    break
                case '3day':
                    last.setUTCDate(last.getUTCDate() + 3)
                    // interval = 259200
                    break
                case '7day':
                    last.setUTCDate(last.getUTCDate() + 7)
                    // interval = 604800
                    break
                case '1month':
                    last.setUTCMonth(last.getUTCMonth() + 1)
                    // interval = 
            }

            if(last.getTime() > now.getTime()) {
                const lastTrade = chartData[0]

                if(this.hasOpenCandle === false) {
                    this.openCandleData = {
                        time: Math.floor(Date.parse(lastTrade.start) / 1000), // const
                        open: Number(lastTrade.open), // const
                        high: Number(data.rate) > Number(lastTrade.high) ? Number(data.rate) : Number(lastTrade.high), 
                        low: Number(data.rate) < Number(lastTrade.low) ? Number(data.rate) : Number(lastTrade.low),
                        close: Number(data.rate)
                    }
                    this.hasOpenCandle = true
                } else {
                    this.openCandleData = {
                        time: this.openCandleData.time,
                        open: Number(this.openCandleData.open),
                        high: Number(data.rate) > Number(this.openCandleData.high) ? Number(data.rate) : Number(this.openCandleData.high), 
                        low: Number(data.rate) < Number(this.openCandleData.low) ? Number(data.rate) : Number(this.openCandleData.low),
                        close: Number(data.rate)
                    }
                }

                this.candleSeries.update(this.openCandleData)
                console.log('Update candle')

                console.log(lastTrade)
                console.log(updateTrade)
            } else {
                // todo
                this.hasOpenCandle = false
                return console.warn('Insert new candle todo...')
                const newTrade = {
                    time: Math.floor(Date.parse(data.executed_time) / 1000),
                    open: Number(entry.open),
                    high: Number(entry.high),
                    low: Number(entry.low),
                    close: Number(entry.close)
                }
            }
            
            // const updateObj = {
            //     time: Math.floor(Date.parse(data.executed_time) / 1000),
            //     Value: Number(data.rate)
            // }
            // console.log(updateObj)

            // this.candleSeries.update(obj)
        }
    },
    mounted() {
        // this.$store.dispatch('getChartData')

        // this.$emitter.on('tradeDataUpdate', (data) => {
        //     this.updateChart(data)
        // })
    }
}
</script>

<style>
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
.chart-view-container {
    height: 400px;
    position: relative;
}
#chart-loader {
    position: absolute;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}
#chart-view {
    /* width: calc(100% + 40px); */
    height: 400px;
}
/* #chart-view table tr > td:first-child+td+td > div {
    background-color: red;
    left: -35px !important;
} */
</style>