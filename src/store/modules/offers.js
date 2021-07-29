import { parseOrderbookChanges } from 'ripple-lib-transactionparser'
import xrpl from '../../plugins/ws-client'
import { notify } from "@kyvg/vue3-notification";

const state = {
    offers: {},
    openOfferSequences: []
}

const getters = {
    getOpenOffers: state => {
        const array = []
        state.openOfferSequences
            .sort((a, b) =>  b - a )
            .forEach(seq => array.push(state.offers[seq]) )
        return array
    },
    getOfferHistoryByCurrencyPair: state => currencyPair => {
        // console.log(currencyPair)
        const array = []
        for(const seq in state.offers) {
            const offer = state.offers[seq]

            let test = false
            if(offer.TakerGets.currency === currencyPair.base.currency || offer.TakerGets.currency === currencyPair.quote.currency) test = true
            if(offer.TakerPays.currency === currencyPair.base.currency || offer.TakerPays.currency === currencyPair.quote.currency) test = true

            if(!test) continue
            array.push(offer)
        }
        array.sort((a, b) =>  b.sequence - a.sequence )
        return array
    },
    getOfferHistory: state => {
        const array = []
        for(const seq in state.offers) {
            const offer = state.offers[seq]

            array.push(offer)
        }
        array.sort((a, b) =>  b.sequence - a.sequence )
        return array
    },
    getOfferBySequence: state => sequence => {
        if(!state.offers.hasOwnProperty(sequence)) return null
        else return state.offers[sequence]
    }
}

const getCondition = (tx) => {
    const flag = tx.Flags
    const expiration = tx.Expiration

    const tfImmediateOrCancel = 0x00020000
    const tfFillOrKill = 0x00040000

    if((flag & tfImmediateOrCancel) == tfImmediateOrCancel) return 'ImmediateOrCancel'
    else if((flag & tfFillOrKill) == tfFillOrKill) return 'FillOrKill'
    else if(typeof expiration === 'string') return 'TimeToKill'
    else return 'GoodTillCancel'
}

const actions = {
    setOpenOffers: async (context, objects) => {
        objects.forEach(offer => {
            context.commit('setOpenOfferObject', offer)
        })
        return
        // todo Use this code if there is an offer without a created/initial tx get it until prevTx does not exsists
        try {
            const offers = await Promise.all(
                objects.map(async offer => {

                    const originalTx = await xrpl.send({
                        command: 'tx',
                        transaction: offer.PreviousTxnID
                    })
                    // If original TX has PreviousTxnID fetch that one if there is no offfer create tx in the history
                    const offerObject = {}
                    return offerObject
                })
            )
        } catch(e) {
            throw e
        }
    },
    setOfferHistory: (context, txs) => {
        txs.forEach(transaction => {
            context.dispatch('parseTx', { transaction, notify: false })
        })
    },
    parseTx: (context, payload) => {
        const account = context.rootGetters.getAccount
        const transaction = payload.transaction
        const tx = transaction.tx

        if(transaction.hasOwnProperty('engine_result') && transaction.engine_result !== 'tesSUCCESS') {
            notify({
                title: 'Transacion error',
                text: `Some info about the TX: ${transaction.engine_result}`,
                type: 'error'
            })
        }
            
            switch(tx.TransactionType) {
                case 'OfferCreate':
                    const parsed = parseOrderbookChanges(transaction.meta)

                    if(tx.Account === account) {
                        tx.condition = getCondition(tx)
                        tx.TransactionResult = transaction.meta.TransactionResult
                        context.commit('setInitialOffer', tx)
                        if(payload.notify) notify({
                            data: tx,
                            title: 'Created Order',
                            type: 'success'
                        })

                        for(const address in parsed) {
                            const array = parsed[address]
                            
                            array.forEach(mutation => {
                                if(account !== address) {
                                    const quantity = {
                                        value: mutation.quantity.currency === 'XRP' ? mutation.quantity.value * 1_000_000 : mutation.quantity.value,
                                        currency: mutation.quantity.currency,
                                        issuer: mutation.quantity.counterparty
                                    }

                                    const totalPrice = {
                                        value: mutation.totalPrice.currency === 'XRP' ? mutation.totalPrice.value * 1_000_000 : mutation.totalPrice.value,
                                        currency: mutation.totalPrice.currency,
                                        issuer: mutation.totalPrice.counterparty
                                    }

                                    const offerChanges = {
                                        sequence: tx.Sequence,
                                        makerExchangeRate: mutation.makerExchangeRate,
                                        type: 'create',
                                        TakerGets: mutation.direction === 'buy' ? quantity : totalPrice,
                                        TakerPays: mutation.direction === 'buy' ? totalPrice : quantity
                                    }
                                    context.commit('intermediateOffer', offerChanges)
                                    if(!payload.notify) context.dispatch('notify', offerChanges)
                                }
                            })                            
                        }
                    } else {
                        if(parsed.hasOwnProperty(account)) {
                            // Balance changes for the account
                            parsed[account].forEach(mutation => {
                                if(context.state.offers.hasOwnProperty(mutation.sequence)) {
                                    const quantity = {
                                        value: mutation.quantity.currency === 'XRP' ? mutation.quantity.value * 1_000_000 : mutation.quantity.value,
                                        currency: mutation.quantity.currency,
                                        issuer: mutation.quantity.counterparty
                                    }

                                    const totalPrice = {
                                        value: mutation.totalPrice.currency === 'XRP' ? mutation.totalPrice.value * 1_000_000 : mutation.totalPrice.value,
                                        currency: mutation.totalPrice.currency,
                                        issuer: mutation.totalPrice.counterparty
                                    }

                                    const offerChanges = {
                                        sequence: mutation.sequence,
                                        makerExchangeRate: mutation.makerExchangeRate,
                                        type: 'mutation',
                                        TakerGets: mutation.direction === 'sell' ? quantity : totalPrice,
                                        TakerPays: mutation.direction === 'sell' ? totalPrice : quantity
                                    }
                                    context.commit('intermediateOffer', offerChanges)
                                    if(!payload.notify) context.dispatch('notify', offerChanges)
                                }
                            })
                        }
                    }
                    break
                case 'OfferCancel':
                    context.commit('canceledOffer', tx)
                    const canceledOffer = {
                        sequence: tx.OfferSequence,
                        type: 'cancelled'
                    }
                    if(!payload.notify) context.dispatch('notify', offerChanges)
                    break
                case 'Payment':
                    const parsedPayment = parseOrderbookChanges(transaction.meta)
                    if(!parsedPayment.hasOwnProperty(account)) break

                    const parsedPaymentArray = parsedPayment[account]
                    
                    parsedPaymentArray.forEach(mutation => {
                        if(context.state.offers.hasOwnProperty(mutation.sequence)) {
                            const quantity = {
                                value: mutation.quantity.currency === 'XRP' ? mutation.quantity.value * 1_000_000 : mutation.quantity.value,
                                currency: mutation.quantity.currency,
                                issuer: mutation.quantity.counterparty
                            }
    
                            const totalPrice = {
                                value: mutation.totalPrice.currency === 'XRP' ? mutation.totalPrice.value * 1_000_000 : mutation.totalPrice.value,
                                currency: mutation.totalPrice.currency,
                                issuer: mutation.totalPrice.counterparty
                            }
    
                            const offerChanges = {
                                sequence: mutation.sequence,
                                makerExchangeRate: mutation.makerExchangeRate,
                                type: 'mutation',
                                TakerGets: mutation.direction === 'sell' ? quantity : totalPrice,
                                TakerPays: mutation.direction === 'sell' ? totalPrice : quantity
                            }
                            context.commit('intermediateOffer', offerChanges)
                            if(payload.notify) context.dispatch('notify', offerChanges)
                        }
                    })
                    break
                default:
                    console.log('TX TYPE NOT IN SWITCH VUEX: ' + tx.TransactionType)
            }
    },
    notify: (context, tx) => {
        switch(tx.type) {
            case 'create':
                notify({
                    data: tx,
                    title: 'Created Order',
                    type: 'success'
                })
                break
            case 'mutation':
                notify({
                    data: tx,
                    title: 'Filled',
                    type: 'success'
                })
                break
            case 'cancel':
                notify({
                    title: 'Cancelled Order',
                    type: 'success'
                })
                break
        }
    }
}

const mutations = {
    setInitialOffer: (state, offer) => {
        const seq = offer.Sequence
        if(state.offers.hasOwnProperty(seq)) {
            const offerState = state.offers[seq]

            offerState.TakerGets.values.created = offer.TakerGets?.value || offer.TakerGets
            offerState.TakerPays.values.created = offer.TakerPays?.value || offer.TakerPays

            offerState.condition = getCondition(offer)
            offerState.date.created = offer.date

            offerState.hashes.unshift(offer.hash)

            offerState.fees = Number(offer.Fee) + Number(offerState.fees)
        } else {
            const offerObject = {
                sequence: seq,
                status: offer.TransactionResult === 'tesSUCCESS' ? '--' : 'failed',
                TransactionResult: offer.TransactionResult,
                filledStatus: 'empty',
                condition: getCondition(offer),
                TakerGets: {
                    currency: offer.TakerGets?.currency || 'XRP',
                    issuer: offer.TakerGets?.issuer || undefined,
                    values: {
                        open: 0,
                        created: offer.TakerGets?.value || offer.TakerGets,
                        filled: 0
                    },
                    price: {
                        open: 0,
                        created: 0
                    }
                },
                TakerPays: {
                    currency: offer.TakerPays?.currency || 'XRP',
                    issuer: offer.TakerPays?.issuer || undefined,
                    values: {
                        open: 0,
                        created: offer.TakerPays?.value || offer.TakerPays,
                        filled: 0
                    },
                    price: {
                        open: 0,
                        created: 0
                    }
                },
                date: {
                    latest: 0,
                    created: offer.date,
                    closed: 0
                },
                hashes: [offer.hash],
                fees: offer.Fee,
                linkedOffers: []
            }
    
            if(offerObject.condition === 'ImmediateOrCancel' || offerObject.condition === 'FillOrKill') offerObject['status'] = 'closed'
    
            state.offers[seq] = offerObject   
        }
    },
    setOpenOfferObject: (state, offer) => {
        const seq = offer.Sequence
        if(state.offers.hasOwnProperty(seq)) {
            const offerState = state.offers[seq]
            offerState.status = 'open'

            offerState.TakerGets.values.open = offer.TakerGets?.value || offer.TakerGets
            offerState.TakerPays.values.open = offer.TakerPays?.value || offer.TakerPays

        } else {
            const offerObject = {
                status: 'open',
                filledStatus: 'empty',
                sequence: seq,
                condition: 'GoodTillCancel',
                TakerGets: {
                    currency: offer.TakerGets?.currency || 'XRP',
                    issuer: offer.TakerGets?.issuer || undefined,
                    values: {
                        open: offer.TakerGets?.value || offer.TakerGets,
                        created: 0,
                        filled: 0
                    },
                    price: {
                        open: 0,
                        created: 0
                    }
                },
                TakerPays: {
                    currency: offer.TakerPays?.currency || 'XRP',
                    issuer: offer.TakerPays?.issuer || undefined,
                    values: {
                        open: offer.TakerPays?.value || offer.TakerPays,
                        created: 0,
                        filled: 0
                    },
                    price: {
                        open: 0,
                        created: 0
                    }
                },
                date: {
                    latest: 0,
                    created: 0,
                    closed: 0
                    // todo: Check if also is created 
                },
                fees: 0,
                hashes:[],
                linkedOffers: []
            }
            state.offers[seq] = offerObject
        }

        state.openOfferSequences.push(seq)
    },
    intermediateOffer: (state, offer) => { 
        const offerState = state.offers[offer.sequence]

        if(offerState.TakerGets.currency === offer.TakerGets.currency && offerState.TakerGets.issuer === offer.TakerGets.issuer) {
            offerState.TakerGets.values.filled = Number(offerState.TakerGets.values.filled) + Number(offer.TakerGets.value)
            if(offerState.TakerGets.values.filled >= offerState.TakerGets.values.created) offerState.filledStatus = 'filled'
            else if(offerState.filledStatus === 'empty') offerState.filledStatus = 'partially-filled'
        }

        if(offerState.TakerPays.currency === offer.TakerPays.currency && offerState.TakerPays.issuer === offer.TakerPays.issuer) {
            offerState.TakerPays.values.filled = Number(offerState.TakerPays.values.filled) + Number(offer.TakerPays.value)
            if(offerState.TakerPays.values.filled >= offerState.TakerPays.values.created) offerState.filledStatus = 'filled'
            else if(offerState.filledStatus === 'empty') offerState.filledStatus = 'partially-filled'        
        }
    },
    canceledOffer: (state, offer) => {
        const seq = offer.OfferSequence
        
        // Todo
        if(!state.offers.hasOwnProperty(seq)) return console.log('Canceled Offer Without TX history')

        const offerState = state.offers[seq]

        offerState.status = 'cancelled'
        offerState.date.closed = offer.date
        offerState.date.latest = offer.date
        offerState.hashes.push(offer.hash)

        offerState.fees = Number(offer.Fee) + Number(offerState.fees)
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
