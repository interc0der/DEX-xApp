<template>
    <div id="trading-view-container" ref="chartContainer"></div>
    <!-- <div id="trading-view-container" ref="chartContainer" v-show="!error"></div> -->
    <!-- <div v-show="error">
        <fa :icon="['fas', 'exclamation-circle']" />
        <label>{{ errorMessage }}</label>
    </div> -->
</template>

<script>
// import { widget } from '../../public/charting_library/charting_library'
// import { UDFCompatibleDatafeed } from '../../charting_library/datafeeds/udf/dist/bundle'
// import { UDFCompatibleDatafeed } from '../../public/charting_library/datafeeds/udf/lib/udf-compatible-datafeed'

export default {
    name: 'ChartContainer',
    data() {
        return {
            tvWidget: null,
            error: false,
            errorMessage: null
        }
    },
    computed: {
        chartData() {
            const data = this.$store.getters.getChartData
            return data
        }
    },
    async mounted() {
        // https://medium.com/@jonchurch/tradingview-js-api-integration-tutorial-introduction-5e4809d9ef36

        var style = getComputedStyle(document.body)
        const bg = style.getPropertyValue('--var-bg-color')
        const green = style.getPropertyValue('--green')
        const red = style.getPropertyValue('--red')

        const config  = {
            supported_resolutions: ['60', '120', '240', 'D', 'M'],
            supports_time: true
        }

        const DF = {
            onReady: cb => {
                console.log("TV onready")
                return setTimeout(() => { cb(config) }, 0)
            },

            resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
                
                const symbol_stub = {
                    name: symbolName,
                    description: '',
                    type: 'crypto',
                    session: '24x7',
                    timezone: 'Etc/UTC',
                    ticker: symbolName, // todo make it short max 4
                    minmov: 1,
                    pricescale: 10_000, // todo calculate the significance
                    has_intraday: true,
                    intraday_multipliers: ['1', '60', '240'], // 1,60
                    has_empty_bars: true,
                    volume_precision: 4,
                    data_status: 'delayed_streaming' // 'streaming'
                }
                
                return setTimeout(() => { onSymbolResolvedCallback(symbol_stub) }, 0)
            },

            getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
                console.log('get data')

                console.log('resolution: ', resolution)

                if(periodParams.firstDataRequest) {
                    await this.$store.dispatch('getChartData')
                } else {
                    console.log(periodParams)
                    console.log('Not first request', periodParams.firstDataRequest)
                    return
                }

                const bars = this.chartData.map(bar => {
                    return {
                        time: Date.parse(bar.start),
                        open: Number(bar.open),
                        high: Number(bar.high),
                        low: Number(bar.low),
                        close: Number(bar.close),
                        volume: Number(bar.base_volume)
                    }
                })

                console.log(bars)

                onHistoryCallback(bars.reverse(), { noData: false }) // nextTime: bars[bars.length - 1].time
            },

            subscribeBars: async (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
                console.log('subscirbe to bars')
            }            
        }

        try {

            var widget = window.tvWidget = new TradingView.widget({
                // debug: true, // uncomment this line to see Library errors and warnings in the console
                fullscreen: false,
                toolbar_bg: bg,
                autosize: true,
                symbol: 'XRP',
                interval: '240',
                container: "trading-view-container",

                //	BEWARE: no trailing slash is expected in feed URL
                datafeed: DF,
                library_path: "charting_library/charting_library/",
                locale: "en",

                disabled_features: ["use_localstorage_for_settings", "header_widget", "left_toolbar", "timeframes_toolbar"],
                enabled_features: ["study_templates"],
                charts_storage_url: 'https://saveload.tradingview.com',
                charts_storage_api_version: "1.1",
                client_id: 'tradingview.com',
                user_id: 'public_user_id',

                // custom_css_url: 'tv_styles.css',

                overrides: {
                    "paneProperties.background": bg,
                    "paneProperties.vertGridProperties.color": "#363c4e",
                    "paneProperties.horzGridProperties.color": "#363c4e",
                    "scalesProperties.backgroundColor": bg,
                    "scalesProperties.textColor" : "#AAA",
                    "mainSeriesProperties.candleStyle.wickUpColor": green,
                    "mainSeriesProperties.candleStyle.upColor": green,
                    "mainSeriesProperties.candleStyle.wickDownColor": red,
                    "mainSeriesProperties.candleStyle.downColor": red,
                    "mainSeriesProperties.candleStyle.drawBorder": false,

                    // "toolbarProperties.backgroundColor": bg

                },
                loading_screen: { backgroundColor: "#000000" },

                debug: true
            })
        } catch(e) {
            console.error(e)
        }

        

        return

        // console.log(UDFCompatibleDatafeed)

        const el = this.$refs.chartContainer

        const widgetOptions = {
            symbol: this.symbol,
            // BEWARE: no trailing slash is expected in feed URL
            datafeed: new UDFCompatibleDatafeed(this.datafeedUrl),
            // datafeed: this.datafeedUrl,
            interval: this.interval,
            container: el,
            // container: 'trading-view-container',
            library_path: this.libraryPath,
            locale: 'en', //todo
            disabled_features: ['use_localstorage_for_settings'],
            enabled_features: [], // 'study_templates'
            charts_storage_url: this.chartsStorageUrl,
            charts_storage_api_version: this.chartsStorageApiVersion,
            client_id: this.clientId,
            user_id: this.userId,
            fullscreen: this.fullscreen,
            autosize: this.autosize,
            // studies_overrides: this.studiesOverrides,
        }

        try {
            // const tvWidget = new widget(widgetOptions)
            // this.tvWidget = tvWidget
        } catch(e) {
            console.error(e)

            // this.error = true
            // this.errorMessage = e
        }
        
    },
    beforeUnmount() {
        if (this.tvWidget !== null) {
            this.tvWidget.remove()
            this.tvWidget = null
        }
    }

}
</script>

<style scoped>
#trading-view-container {
    width: 100%;
    height: 100%;
    background-color: black;
}
</style>
