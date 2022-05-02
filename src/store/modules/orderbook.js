import client from '../../plugins/ws-client-secondary'
import { quantityFormat, priceFormat } from '../../plugins/number-format'

import orderBookParser from '../../plugins/orderbook-parser'

import { parseOrderbookChanges, parseBalanceChanges } from 'ripple-lib-transactionparser'

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
    },
    getIndicatorProgress: state => (value) => {
        if(isNaN(value)) throw new Error('Needs a value')

        const asks = state.asks
        const bids = state.bids

        let totA
        let avgA

        if(asks.length >= 1) {
            totA = asks[asks.length - 1].total
            avgA = totA / asks.length
        }

        let totB
        let avgB

        if(bids.length >= 1) {
            totB = bids[bids.length - 1].total
            avgB = totB / bids.length
        }

        const avg = (Number(avgA) + Number(avgB)) / 2
        
        const max100 = avg / 50 * 100

        const progress = value / max100 > 1 ? 1 : (value / max100).toFixed(2)

        const percentageString = (progress * 100).toFixed(0) + '%'
        
        return percentageString
    }
}

const actions = {
    getOrderBookData: async (context, resetReadyState) => {
        if(resetReadyState) context.commit('isReady', false)
        await context.dispatch('subscribeToBook')
        return context.commit('isReady', true)
    },
    getCurrentOrderBook: async (context) => {
        // Todo if subscribed parse instead of fetching new data
        await Promise.all([context.dispatch('setSellSide'), context.dispatch('setBuySide')])
    },
    subscribeToBook: async (context, payload) => {
        // todo unsubscribe & on book???
        const tradingPair = context.rootGetters.getCurrencyPair

        const orderBook = await client.send({
            id: 'book',
            command: 'subscribe',
            books: [
                {
                    taker_pays: {
                        currency: tradingPair.base.currency,
                        issuer: tradingPair.base.currency === 'XRP' ? undefined : tradingPair.base.issuer
                    },
                    taker_gets: {
                        currency: tradingPair.quote.currency,
                        issuer: tradingPair.quote.currency === 'XRP' ? undefined : tradingPair.quote.issuer
                    },
                    snapshot: true,
                    both: true
                }
            ]
        })
        if(orderBook.hasOwnProperty('result')) {
            context.commit('setAskOrders', orderBook.result.asks)
            context.commit('setBidOrders', orderBook.result.bids)
        }
    },
    parseOrderBookChanges: (context, payload) => {
        const tx = payload.tx

        // console.log(tx)

        // console.log(parseBalanceChanges(tx.meta))

        const tradingPair = context.rootGetters.getCurrencyPair

        const array = tx?.meta?.AffectedNodes
        if(!Array.isArray(array)) return console.warn('No metadata')

        const epochToDate = (epoch) => {
            let date = new Date('2000-01-01T00:00:00Z')
            date.setUTCSeconds(epoch)

            return date.toJSON()
        }
        
        const changes = parseBalanceChanges(tx.meta)

        let tradeUpdates = []
        // let direction = null

        for(let party in changes) {
            if(party === tx.transaction.Account) {
                // todo
                // const accountChangesCreatedArray = changes[tx.transaction.Account]
                // if(accountChangesCreatedArray.length > 1) {
                //     for(let line of accountChangesCreatedArray) {
                //         if( (line.counterparty === tradingPair.base.issuer && line.currency === tradingPair.base.currency) || (line.currency === 'XRP' && tradingPair.base.currency === 'XRP') ) {
                //             baseObject = line
                //         }
                //         if( (line.counterparty === tradingPair.quote.issuer && line.currency === tradingPair.quote.currency) || (line.currency === 'XRP' && tradingPair.quote.currency === 'XRP') ) {
                //             quoteObject = line
                //         }
                //     }
                //     direction = changes[tx.transaction.Account]
                // }

                // console.log('Skip: look into other accounts for trading history than it\'s creator')
                continue
            }

            let baseObject = null
            let quoteObject = null
            // if party & account equals transaction make sure fee is deducted or added to amount for price calculations
            for(let line of changes[party]) {
                if(line.currency === 'XRP' && party === tx.transaction.Account) {
                    // todo unreachable, the account who offercrete skip at this moment
                    // value with fess
                    line.grossValue = line.value

                    let valDrops = Math.trunc(Number(line.value) * 1_000_000)
                    line.value = (valDrops + Number(tx.transaction.Fee)) / 1_000_000
                }

                if( (line.counterparty === tradingPair.base.issuer && line.currency === tradingPair.base.currency) || (line.currency === 'XRP' && tradingPair.base.currency === 'XRP') ) {
                    baseObject = line
                }
                if( (line.counterparty === tradingPair.quote.issuer && line.currency === tradingPair.quote.currency) || (line.currency === 'XRP' && tradingPair.quote.currency === 'XRP') ) {
                    quoteObject = line
                }

                if(tradingPair.base.issuer === party || (line.currency === 'XRP' && tradingPair.base.currency === 'XRP')) {
                    if(line.currency === tradingPair.base.currency) {
                        baseObject = line
                    }
                }

                if(tradingPair.quote.issuer === party || (line.currency === 'XRP' && tradingPair.quote.currency === 'XRP')) {
                    if(line.currency === tradingPair.quote.currency) {
                        quoteObject = line
                    }
                }
            }

            if(!baseObject || !quoteObject) {
                // console.log('skip: No base or quote')
                baseObject = null
                quoteObject = null
                continue
            }
            console.log({baseObject, quoteObject})

            try {
                const newTrade = {
                    base_amount: Math.abs(baseObject.value),
                    base_currency: baseObject.currency,
                    base_issuer: baseObject.currency === 'XRP' ? null : baseObject.counterparty,
        
                    counter_amount: Math.abs(quoteObject.value),
                    counter_currency: quoteObject.currency,
                    counter_issuer: quoteObject.currency === 'XRP' ? null : baseObject.counterparty,
        
                    rate: Number(Math.abs(quoteObject.value)) / Number(Math.abs(baseObject.value)),
                    executed_date: tx?.transaction?.date,
                    executed_time: epochToDate(tx?.transaction?.date),
                    direction: null
                    // ledger_index: 0,
                    // node_index: 0,
                    // offer_sequence: 0,
                    // provider: "rpXhhWmCvDwkzNtRbm7mmD1vZqdfatQNEe",
                    // seller: "rpMwusB1JD8PYYJwrw5qT65pgDMx3rLcEe",
                    // buyer: null,
                    // taker: "rpMwusB1JD8PYYJwrw5qT65pgDMx3rLcEe",
                    // tx_hash: null,
                    // tx_index: 0,
                    // tx_type: "OfferCreate"
                }
                if(newTrade.base_amount < 0 && newTrade.counter_amount > 0) newTrade.direction = 'sell'
                else if(newTrade.base_amount > 0 && newTrade.counter_amount < 0) newTrade.direction = 'buy'
                else if(newTrade.base_currency === 'XRP' && newTrade.base_amount <= 0 && newTrade.counter_amount < 0) newTrade.direction = 'buy'
                else if(newTrade.counter_currency === 'XRP' && newTrade.counter_amount <= 0 && newTrade.base_amount < 0) newTrade.direction = 'buy'
                else newTrade.direction = 'undefined'
                tradeUpdates.push(newTrade)

                baseObject = null
                quoteObject = null
            } catch(e) { console.warn(e) }
        }

        tradeUpdates.sort((a, b) => {
            if(tradeUpdates[0].direction === 'buy') {
                // lowest first highest last
                return a.rate - b.rate
            } else {
                return b.rate - a.rate
            }
        })

        for(let updateItem of tradeUpdates) {
            context.dispatch('updateLastTradedPrice', updateItem.rate)
            context.dispatch('pushTxToTradeHistory', updateItem)
            payload.emitter.emit('tradeDataUpdate', updateItem)
            // if (updateItem.base_currency === 'XRP' || updateItem.counter_currency === 'XRP') {
                // if( (baseObject.grossValue <= 0 || baseObject.value <= 0) && (quoteObject.grossValue <= 0 || quoteObject.value <= 0) ) {
                //     console.log('Do not update market price: both values negative')
                // }
                // else if( (baseObject.grossValue >= 0 || baseObject.value >= 0) && (quoteObject.grossValue >= 0 || quoteObject.value >= 0) ) {
                //     console.log('Do not update market price: both values positive')
                // }
                // else {
                    // context.dispatch('updateLastTradedPrice', updateItem.rate)
                // }
                // context.dispatch('pushTxToTradeHistory', updateItem)
            // } else {
            //     context.dispatch('updateLastTradedPrice', updateItem.rate)
            //     context.dispatch('pushTxToTradeHistory', updateItem)
            // }
        }
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
