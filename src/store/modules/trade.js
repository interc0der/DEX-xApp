const state = {
    isSafe: true,
    marketPrice: 0,
    limitPrice: 0,
    currencyPair: {
        base: {
            currency: 'XRP',
            issuer: null
        },
        quote: {
            currency: 'USD',
            issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
        }
    }
}

const getters = {
    getCurrencyPair: state => {
        return state.currencyPair
    },
    getMarketPrice: state => {
        if(state.currencyPair.base.currency !== 'XRP' && state.currencyPair.quote.currency !== 'XRP') return Number(state.marketPrice)
        if(state.currencyPair.base.currency === 'XRP') return Number(state.marketPrice) / 1_000_000
        if(state.currencyPair.quote.currency === 'XRP') return Number(state.marketPrice) * 1_000_000
    },
    isMarketSafe: state => {
        return state.isSafe
    }
}

const actions = {
    changeCurrencyPair: (context, obj) => {
        return context.commit('setCurrencyPair', obj)
    },
    setLimitPrice: (context, price) => {
        return context.commit('setLimitPrice', price)
    },
    setMarketPrice: (context, price) => {
        return context.commit('setMarketPrice', price )
    },
    toggleSafeMarket: (context, bool) => {
        return context.commit('toggleSafeMarket', bool)
    }
}

const mutations = {
    setCurrencyPair: (state, obj) => {
        if(obj.target === 'switch') {
            state.currencyPair = { base: state.currencyPair.quote, quote: state.currencyPair.base }
        } else if(obj.target === 'base') {
            if(obj.amount.currency === 'XRP') state.currencyPair.base = { currency: 'XRP', issuer: null, limit: null }
            else state.currencyPair.base = obj.amount
        } else if(obj.target === 'quote') {
            if(obj.amount.currency === 'XRP') return state.currencyPair.quote = { currency: 'XRP', issuer: null, limit: null }
            else state.currencyPair.quote = obj.amount
        }
    },
    setLimitPrice: (state, price) => {
        state.limitPrice = price
    },
    setMarketPrice: (state, price) => {
        state.marketPrice = price
    },
    toggleSafeMarket: (state, bool) => {
        state.isSafe = bool
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}