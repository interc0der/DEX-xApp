import axios from 'redaxios'
import router from '../../router'
import _isEqual from 'lodash/isEqual'

const intervalConvert = (value, provider) => {
    if(provider === 'OnTheDex') {
        switch(value) {
            case '5m':
                return '5'
            case '15m':
                return '15'
            case '1h':
                return '60'
            case '2h':
                return '240'
            case 'D':
                return 'D'
            case 'W':
                return 'W'
            default:
                throw new Error('Not supported chart interval')
        }
    } else if(provider === 'ripple') {
        switch(value) {
            case '1m':
                return '1minute'
            case '5m':
                return '5minute'
            case '15m':
                return '15minute'
            case '30m':
                return '30minute'
            case '1h':
                return '1hour'
            case '2h':
                return '2hour'
            case '4h':
                return '4hour'
            case 'D':
                return '1day'
            case 'W':
                return '7day'
            case 'M':
                return '1month' 
            default:
                throw new Error('Not supported chart interval')
        }
    }
}

const state = {
    isSafe: true,
    marketPrice: 0,
    marketPriceHasError: false,
    marketTrend: 0,
    marketTickerData: {},
    currencyPair: {
        base: {
            currency: 'XRP',
            issuer: null
        },
        quote: {
            currency: 'USD',
            issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
        }
    },
    tradeHistory: [],
    chartData: [],
    marker: null,
    activeCandle: null,
    selectedChartInterval: 'D',
    tickerData: [],
    activeMarketTokenList: {},
    dataProvider: 'ripple' // 'OnTheDex' / 'ripple'
}

const getters = {
    getCurrencyPair: state => {
        return state.currencyPair
    },
    getMarketPrice: state => {
        return Number(state.marketPrice)
    },
    getMarketPriceError: state => {
        return state.marketPriceHasError
    },
    isMarketSafe: state => {
        return state.isSafe
    },
    marketTrend: state => {
        return state.marketTrend
    },
    getMarketTickerData: state => {
        return state.marketTickerData
    },
    getAllTradeHistory: state => {
        return state.tradeHistory
    },
    getChartData: state => {
        return state.chartData
    },
    getSelectedChartInterval: state => {
        return state.selectedChartInterval
    },
    getDataProvider: state => {
        return state.dataProvider
    },
    getActiveCandleData: state => {
        return state.activeCandle
    },
    getActiveMarketTokenList: state => {
        return state.activeMarketTokenList
    },
    getChartDataMarker: state => {
        return state.marker
    }
}

const actions = {
    setChartInterval: async (context, interval) => {
        context.commit('setChartInterval', interval)
        return await context.dispatch('getChartData')
    },
    changeCurrencyPair: (context, obj) => {
        context.commit('setCurrencyPair', obj)
        // todo
        context.dispatch('setLastTradedPrice')
        
        // Flip??
        context.dispatch('getTradeHistory')
        context.dispatch('getOrderBookData', true)
        return
    },
    toggleSafeMarket: (context, bool) => {
        return context.commit('toggleSafeMarket', bool)
    },
    getTickerData: async (context, payload) => {
        const marker = payload?.marker
        const firstData = payload?.data
        const provider = context.getters.getDataProvider

        switch(provider) {
            case 'OnThedex':
                console.warn('todo onthedex 24h data on tradingpair')
                break
            case 'ripple':
                let now = new Date()
                now.setUTCHours(now.getUTCHours() - 24)
                const yesterday = now.toJSON()
        
                const currencyPair = context.getters.getCurrencyPair
                const endpoint = 'https://data.ripple.com/v2/exchanges/'
                let options = `?start=${yesterday}&reduce=true`
                // let options = `?start=${yesterday}&interval=1hour&limit=24`
                if(marker) options = options + `&marker=${marker}`
                const currency1 = currencyPair.base.currency === 'XRP' ? 'XRP' : `${currencyPair.base.currency}+${currencyPair.base.issuer}`
                const currency2 = currencyPair.quote.currency === 'XRP' ? 'XRP' : `${currencyPair.quote.currency}+${currencyPair.quote.issuer}`
                const call = `${endpoint}${currency1}/${currency2}${options}`
        
                try {
                    const res = await axios.get(call)
        
                    if(res.data.marker && !marker) {
                        return context.dispatch('getTickerData', {
                            marker: res.data.marker,
                            data: res.data.exchanges[0]
                        })
                    } else if(res.data.marker && marker) {
                        const newData = res.data.exchanges[0]
                        const lastData = {
                            high: firstData.high < newData.high ? newData.high : firstData.high,
                            low: firstData.low > newData.low ? newData.low : firstData.low,
                            close: newData.close,
                            base_volume: Number(firstData.base_volume) + Number(newData.base_volume),
                            counter_volume: Number(firstData.counter_volume) + Number(newData.counter_volume),
                            buy_volume: Number(firstData.buy_volume) + Number(newData.buy_volume),
                            count: Number(firstData.count) + Number(newData.count)
                        }
                        
                        return context.dispatch('getTickerData', {
                            marker: res.data.marker,
                            data: Object.assign(firstData, lastData)
                        })
                    } else {
                        return context.commit('setTickerDataMarket', firstData || res.data.exchanges)
                    }
                } catch(e) {
                    console.error(e)
                }
                break
            default:
                throw new Error('Not a valid data provider')
        }
    },
    getChartData: async (context, payload) => {
        const marker = context.getters.getChartDataMarker

        const currencyPair = context.getters.getCurrencyPair
        const provider = context.getters.getDataProvider
        const interval = intervalConvert(context.getters.getSelectedChartInterval, provider)

        let call
        if(provider === 'OnTheDex') {
            // https://github.com/OnTheDEX/xrpledger-token-data-api

            const endpoint = 'https://api.onthedex.live/public/v1/ohlc'
            const options = `interval=${interval}&bars=300`
            const base = currencyPair.base.currency === 'XRP' ? 'XRP' : `${currencyPair.base.currency}.${currencyPair.base.issuer}`
            const quote = currencyPair.quote.currency === 'XRP' ? 'XRP' : `${currencyPair.quote.currency}.${currencyPair.quote.issuer}`
            call = `${endpoint}?base=${base}&quote=${quote}&${options}`

        } else if(provider === 'ripple') {
            const endpoint = 'https://data.ripple.com/v2/exchanges/'
            const options = `?descending=true&result=tesSUCCESS&limit=1000&interval=${interval}`
            const currency1 = currencyPair.base.currency === 'XRP' ? 'XRP' : `${currencyPair.base.currency}+${currencyPair.base.issuer}`
            const currency2 = currencyPair.quote.currency === 'XRP' ? 'XRP' : `${currencyPair.quote.currency}+${currencyPair.quote.issuer}`
            call = `${endpoint}${currency1}/${currency2}${options}`

            if(payload?.marker && marker) call = call + `&marker=${marker}`
        } else {
            throw new Error('Not a valid data provider')
        }

        try {
            const res = await axios.get(call)
            return context.commit('setChartData', res.data)
        } catch(e) {
            console.error(e)
        }
    },
    getActiveMarketTokenList: async (context, payload) => {
        const provider = context.getters.getDataProvider

        let call
        if(provider === 'OnTheDex') {
            const endpoint = 'https://api.onthedex.live/public/v1/daily/pairs?token=XRP'
            call = endpoint
        } else {
            throw new Error('Not a valid data provider')
        }

        try {
            const res = await axios.get(call)
            return context.commit('setTokenList', res.data)
        } catch(e) {
            console.error(e)
        }

    },
    getTradeHistory: async (context, payload) => {
        const currencyPair = context.getters.getCurrencyPair

        const endpoint = 'https://data.ripple.com/v2/exchanges/'
        const options = '?descending=true&result=tesSUCCESS&limit=51'
        const currency1 = currencyPair.base.currency === 'XRP' ? 'XRP' : `${currencyPair.base.currency}+${currencyPair.base.issuer}`
        const currency2 = currencyPair.quote.currency === 'XRP' ? 'XRP' : `${currencyPair.quote.currency}+${currencyPair.quote.issuer}`
        const call = `${endpoint}${currency1}/${currency2}${options}`
        
        try {
            const res = await axios.get(call)
            return context.commit('setTradeHistory', res.data.exchanges)
        } catch(e) {
            console.error(e)
        }
    },
    pushTxToTradeHistory: (context, payload) => {
        context.commit('pushTxToTradeHistory', payload)
    },
    setLastTradedPrice: async (context, bool) => {
        context.dispatch('getTickerData')
        const currencyPair = context.getters.getCurrencyPair

        const endpoint = 'https://data.ripple.com/v2/exchanges/'
        const options = '?descending=true&result=tesSUCCESS&limit=10'
        const currency1 = currencyPair.base.currency === 'XRP' ? 'XRP' : `${currencyPair.base.currency}+${currencyPair.base.issuer}`
        const currency2 = currencyPair.quote.currency === 'XRP' ? 'XRP' : `${currencyPair.quote.currency}+${currencyPair.quote.issuer}`
        const call = `${endpoint}${currency1}/${currency2}${options}`

        try {
            const res = await axios.get(call)
            const obj = res.data

            if(!obj.hasOwnProperty('exchanges')) throw 'No propertie exchanges'
            else if(obj.exchanges.length < 1) throw 'Array has no items'
            else if(!obj.exchanges[0].hasOwnProperty('rate')) throw 'No Market Price'

            const price = obj.exchanges[0].rate

            if(isNaN(Number(price))) throw 'Market Price is NaN'

            let trend = 0
            for(const trade of obj.exchanges) {
                if(price > trade.rate) {
                    trend = 1
                    break
                }
                else if(price < trade.rate) {
                    trend = -1
                    break
                }
                
            }

            return context.commit('setMarketPrice', [price, trend])
        } catch(e) {
            console.error(e)
            context.commit('toggleSafeMarket', false)
            return context.commit('setMarketPriceError', e)
        }
    },
    updateLastTradedPrice: (context, payload) => {
        const price = payload.rate
        const time = payload.time
        const volume_base = payload.volume_base
        const volume_quote = payload.volume_quote

        if(isNaN(Number(price))) {
            context.commit('toggleSafeMarket', false)
            context.commit('setMarketPriceError', e)
            return console.log('Price is not a Number')
        }

        console.log(`Price Update: ${price}`)
        context.commit('updateMarketPrice', price)

        if(isNaN(time)) throw new Error('Timestamp should be a number, UNIX timestamp')
        if(isNaN(Number(volume_base))) throw new Error('base volume is not a number')
        if(isNaN(Number(volume_quote))) throw new Error('base volume is not a number')

        context.commit('updateCandleStickData', payload)
    }
}

const mutations = {
    setCurrencyPair: (state, obj) => {
        // todo check if base and quote are the same if true throw error

        const test = {
            base: state.currencyPair.base.currency === 'XRP' ? 'XRP' : { ...state.currencyPair.base },
            quote: state.currencyPair.quote.currency === 'XRP' ? 'XRP' : { ...state.currencyPair.quote }
        }
        if(_isEqual(obj, test)) {
            console.log('currency pair isEqual:', true)
            return new Error('No change in currency pair')
        }

        if(obj.switch === true) {
            state.currencyPair = { base: state.currencyPair.quote, quote: state.currencyPair.base }
        } else {
            if(obj.target === 'base' || obj.hasOwnProperty('base')) {
                if(obj?.amount?.currency === 'XRP' || obj?.base?.currency === 'XRP' || obj.base === 'XRP') state.currencyPair.base = { currency: 'XRP', issuer: null }
                else state.currencyPair.base = obj.hasOwnProperty('base') ? obj.base : obj.amount
            }
            if(obj.target === 'quote' || obj.hasOwnProperty('quote')) {
                if(obj?.amount?.currency === 'XRP' || obj?.quote?.currency === 'XRP' || obj.quote === 'XRP') state.currencyPair.quote = { currency: 'XRP', issuer: null }
                else state.currencyPair.quote = obj.hasOwnProperty('quote') ? obj.quote : obj.amount
            }
        }

        const baseString = state.currencyPair.base.currency.toUpperCase() === 'XRP' ? state.currencyPair.base.currency : `${state.currencyPair.base.currency}+${state.currencyPair.base.issuer}`
        const quoteString = state.currencyPair.quote.currency.toUpperCase() === 'XRP' ? state.currencyPair.quote.currency : `${state.currencyPair.quote.currency}+${state.currencyPair.quote.issuer}`
        const qstring = `/?base=${baseString}&quote=${quoteString}`
        router.replace(qstring)
        
    },
    setMarketPrice: (state, arr) => {
        state.marketPrice = arr[0]
        state.marketTrend = arr[1]
        state.marketPriceHasError = false
    },
    updateMarketPrice: (state, price) => {
        if(state.marketPrice !== 0) {
            if(price > state.marketPrice) state.marketTrend = 1
            else if(price < state.marketPrice) state.marketTrend = -1
            else state.marketTrend = 0
        } else state.marketTrend = 0

        state.marketPrice = price
        state.marketPriceHasError = false
    },
    setMarketPriceError: (state, data) => {
        state.marketPriceHasError = true
        state.marketPrice = 0
        state.marketTrend = 0
    },
    setTickerDataMarket: (state, data) => {
        state.marketTickerData = data
    },
    pushTxToTradeHistory: (state, item) => {
        state.tradeHistory.unshift(item)
    },
    toggleSafeMarket: (state, bool) => {
        state.isSafe = bool
    },
    setTradeHistory: (state, array) => {
        state.tradeHistory = array
    },
    setChartData: (state, data) => {
        console.log('set chart data:', data)
        switch(state.dataProvider) {
            case 'OnTheDex':
                const arr1 = data.data.ohlc.map(bar => {
                    return {
                        time: bar.t * 1000,
                        open: bar.o,
                        high: bar.h,
                        low: bar.l,
                        close: bar.c,
                        volume: bar.vb
                    }
                })
                state.chartData = arr1
                break
            case 'ripple':
                const arr2 = data.exchanges.map(bar => {
                    return {
                        time: Date.parse(bar.start),
                        open: Number(bar.open),
                        high: Number(bar.high),
                        low: Number(bar.low),
                        close: Number(bar.close),
                        volume: Number(bar.base_volume)
                    }
                }).reverse()
                state.chartData = arr2

                if(data.hasOwnProperty('marker') && data?.marker) state.marker = data.marker

                break
        }
        const index = state.chartData.length - 1
        const lastcandle = state.chartData[index]
        const start = lastcandle.time
        const timeBetweenInMs = lastcandle.time - state.chartData[index - 1].time
        const end = start + timeBetweenInMs

        state.activeCandle = {
            end: end,
            ...lastcandle,
            index: index
        }
    },
    setChartInterval: (state, interval) => {
        state.selectedChartInterval = interval
    },
    updateCandleStickData: (state, payload) => {
        const price = payload.rate
        const time = payload.time
        const volume_base = payload.volume_base
        const volume_quote = payload.volume_quote

        // todo :: check time if new or should push to chart data array
        // or adjust high, low, close. and add volume
        if(time > state.activeCandle.end) {
            console.warn('close the candle and set new active candle!!!')

            state.chartData[state.activeCandle.index] = {
                ...state.chartData[state.activeCandle.index],
                high: state.activeCandle.high,
                low: state.activeCandle.low,
                close: state.activeCandle.close,
                volume: state.activeCandle.volume
            }

            const index = state.chartData.length - 1
            const lastcandle = state.chartData[index]
            const start = lastcandle.time
            const timeBetweenInMs = lastcandle.time - state.chartData[index - 1].time

            const end = start + timeBetweenInMs
            state.activeCandle = {
                time: state.activeCandle.end,
                end: end,
                open: price,
                high: price,
                low: price,
                close: price,
                volume: Number(volume_base),
                index: index + 1
            }
        } else {
            state.activeCandle = {
                ...state.activeCandle,
                open: state.activeCandle.open,
                high: price > state.activeCandle.high ? price : state.activeCandle.high,
                low: price < state.activeCandle.low ? price : state.activeCandle.low,
                close: price,
                volume: Number(state.activeCandle.volume) + Number(volume_base)
            }
        }
    },
    setTokenList: (state, payload) => {   
           
        payload.pairs.forEach(item => {
            if(!state.activeMarketTokenList.hasOwnProperty(item.quote)) state.activeMarketTokenList[item.quote] = []
            if(!state.activeMarketTokenList[item.quote].length) state.activeMarketTokenList[item.quote] = []

            state.activeMarketTokenList[item.quote].push({
                    issuer: item.base.issuer,
                    currency: item.base.currency,
                    trades: item.num_trades,
                    high: item.price_hi,
                    low: item.price_lo,
                    market: item.price_mid, // todo what is this price?
                    high_usd: item.price_hi_usd,
                    low_usd: item.price_lo_usd,
                    volume_base: item.volume_base,
                    volume_quote: item.volume_quote,
                    volume_usd: item.volume_usd                    
                })
        })

        console.log(payload)
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}