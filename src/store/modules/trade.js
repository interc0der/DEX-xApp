import axios from 'redaxios'

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
    selectedChartInterval: '4hour',
    tickerData: []
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
    }
}

const actions = {
    setChartInterval: (context, interval) => {
        context.commit('setChartInterval', interval)
        context.dispatch('getChartData')
        return
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
    },
    getChartData: async (context, payload) => {
        const currencyPair = context.getters.getCurrencyPair
        // ["1m","3m","5m","15m","30m","1h","3h","6h","12h","1d","3d","1w"]
        // unix timestamp
        // https://api.sologenic.org/api/v1/ohlc?symbol=USD%2BrD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi%2FXRP&period=1m&from=1611007200&to=1611070980

        const endpoint = 'https://data.ripple.com/v2/exchanges/'
        const options = `?descending=true&result=tesSUCCESS&limit=1000&interval=${context.getters.getSelectedChartInterval}`
        const currency1 = currencyPair.base.currency === 'XRP' ? 'XRP' : `${currencyPair.base.currency}+${currencyPair.base.issuer}`
        const currency2 = currencyPair.quote.currency === 'XRP' ? 'XRP' : `${currencyPair.quote.currency}+${currencyPair.quote.issuer}`
        const call = `${endpoint}${currency1}/${currency2}${options}`

        try {
            const res = await axios.get(call)
            return context.commit('setChartData', res.data.exchanges)
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
    updateLastTradedPrice: (context, price) => {
        if(isNaN(Number(price))) {
            context.commit('toggleSafeMarket', false)
            context.commit('setMarketPriceError', e)
            return console.log('Price is not a Number')
        }
        
        console.log(`Price Update: ${price}`)
        context.commit('updateMarketPrice', price)
    }
}

const mutations = {
    setCurrencyPair: (state, obj) => {
        // todo check if base and quote are the same if true throw error
        if(obj.switch === true) {
            return state.currencyPair = { base: state.currencyPair.quote, quote: state.currencyPair.base }
        }
        if(obj.target === 'base' || obj.hasOwnProperty('base')) {
            if(obj?.amount?.currency === 'XRP' || obj?.base?.currency === 'XRP' || obj.base === 'XRP') state.currencyPair.base = { currency: 'XRP', issuer: null }
            else state.currencyPair.base = obj.hasOwnProperty('base') ? obj.base : obj.amount
        }
        if(obj.target === 'quote' || obj.hasOwnProperty('quote')) {
            if(obj?.amount?.currency === 'XRP' || obj?.quote?.currency || obj.quote === 'XRP') state.currencyPair.quote = { currency: 'XRP', issuer: null }
            else state.currencyPair.quote = obj.hasOwnProperty('quote') ? obj.quote : obj.amount
        }
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
        state.chartData = data
    },
    setChartInterval: (state, interval) => {
        state.selectedChartInterval = interval
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}