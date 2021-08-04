import client from '../../plugins/ws-client'
import { quantityFormat, priceFormat } from '../../plugins/number-format'

import orderBookParser from '../../plugins/orderbook-parser'

const state = {
    ready: false,
    asks: [],
    bids: []
}

const getters = {
    getOrderBookData: state => {
        const asks = state.asks
        const bids = state.bids
        const obj = { asks, bids }
        return obj
    },
    getOrderBookReadyState: state => {
        return state.ready
    }
}

const actions = {
    getOrderBookData: async (context, resetReadyState) => {
        if(resetReadyState) context.commit('isReady', false)
        await Promise.all([context.dispatch('setSellSide'), context.dispatch('setBuySide')])
        return context.commit('isReady', true)
    },
    setSellSide: async (context, payload) => {
        const tradingPair = context.rootGetters.getCurrencyPair

        const dataSell = await client.send({
            command: 'book_offers',
            taker_gets: {
                currency: tradingPair.base.currency,
                issuer: tradingPair.base.currency === 'XRP' ? undefined : tradingPair.base.issuer
            },
            taker_pays: {
                currency: tradingPair.quote.currency,
                issuer: tradingPair.quote.currency === 'XRP' ? undefined : tradingPair.quote.issuer
            }
        })
        const askBook = dataSell.offers
        return context.commit('setAskOrders', askBook)
    },
    setBuySide: async (context, payload) => {
        const tradingPair = context.rootGetters.getCurrencyPair

        const dataBuy = await client.send({
            command: 'book_offers',
            taker_gets: {
                currency: tradingPair.quote.currency,
                issuer: tradingPair.quote.currency === 'XRP' ? undefined : tradingPair.quote.issuer
            },
            taker_pays: {
                currency: tradingPair.base.currency,
                issuer: tradingPair.base.currency === 'XRP' ? undefined : tradingPair.base.issuer
            }
        })
        const bidBook = dataBuy.offers
        return context.commit('setBidOrders', bidBook)
    }
}

const mutations = {
    setAskOrders: (state, payload) => {
        state.asks = orderBookParser(payload)
    },
    setBidOrders: (state, payload) => {
        state.bids = orderBookParser(payload, true)
    },
    isReady: (state, bool) => {
        state.ready = bool
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
