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
    isMarketSafe: state => {
        return state.isSafe
    },
    marketTrend: state => {
        if(state.marketTrend > 0) {
            return true
        } else {
            return false
        }
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
        
        if(obj.target === 'switch') context.dispatch('flipPrices')
        
        // Flip??
        context.dispatch('getTradeHistory')
        context.dispatch('getOrderBookData', true)
        return
    },
    toggleSafeMarket: (context, bool) => {
        return context.commit('toggleSafeMarket', bool)
    },
    getTickerData: async (context, payload) => {

        let now = new Date()
        now.setUTCHours(now.getUTCHours() - 24)
        const yesterday = now.toJSON()

        const currencyPair = context.getters.getCurrencyPair
        const endpoint = 'https://data.ripple.com/v2/exchanges/'
        const options = `?start=${yesterday}&reduce=true`
        const currency1 = currencyPair.base.currency === 'XRP' ? 'XRP' : `${currencyPair.base.currency}+${currencyPair.base.issuer}`
        const currency2 = currencyPair.quote.currency === 'XRP' ? 'XRP' : `${currencyPair.quote.currency}+${currencyPair.quote.issuer}`
        const call = `${endpoint}${currency1}/${currency2}${options}`

        try {
            const res = await axios.get(call)
            return context.commit('setTickerDataMarket', res.data.exchanges)
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
        const options = '?descending=true&result=tesSUCCESS&limit=2'
        const currency1 = currencyPair.base.currency === 'XRP' ? 'XRP' : `${currencyPair.base.currency}+${currencyPair.base.issuer}`
        const currency2 = currencyPair.quote.currency === 'XRP' ? 'XRP' : `${currencyPair.quote.currency}+${currencyPair.quote.issuer}`
        const call = `${endpoint}${currency1}/${currency2}${options}`

        try {
            const res = await axios.get(call)
            return context.commit('setMarketPrice', res.data)
        } catch(e) {
            console.error(e)
            return context.commit('setMarketPrice', 'error')
        }
    }
}

const mutations = {
    setCurrencyPair: (state, obj) => {
        if(obj.target === 'switch') {
            state.currencyPair = { base: state.currencyPair.quote, quote: state.currencyPair.base }
        } else if(obj.target === 'base') {
            if(obj.amount.currency === 'XRP') state.currencyPair.base = { currency: 'XRP', issuer: null }
            else state.currencyPair.base = obj.amount
        } else if(obj.target === 'quote') {
            if(obj.amount.currency === 'XRP') return state.currencyPair.quote = { currency: 'XRP', issuer: null }
            else state.currencyPair.quote = obj.amount
        }
    },
    setMarketPrice: (state, obj) => {
        if(obj === 'error') return state.marketPrice = 0
        if(!obj.hasOwnProperty('exchanges')) return state.marketPrice = 0
        else if(obj.exchanges.length < 1) return state.marketPrice = 0
        else if(!obj.exchanges[0].hasOwnProperty('rate')) return state.marketPrice = 0

        const price = obj.exchanges[0].rate

        if(price) {
            state.marketPrice = price
        }

        if(obj.exchanges.length < 2) return
        if(price > obj.exchanges[1].rate) {
            state.marketTrend = 1
        } else {
            state.marketTrend = -1
        }
    },
    setTickerDataMarket: (state, data) => {
        state.marketTickerData = data[0]
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