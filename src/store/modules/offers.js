import { parseOrderbookChanges } from 'ripple-lib-transactionparser'
import xrpl from '../../plugins/ws-client'
import { notify } from "@kyvg/vue3-notification"

import { currencyCodeFormat, quantityFormat, priceFormat } from '../../plugins/number-format'

const state = {
    offers: {},
    openOfferSequences: [],
    currencyList: {
        XRP: null
    }
}

const getters = {
    getOpenOffers: state => {
        const array = []
        state.openOfferSequences
            .sort((a, b) =>  b - a )
            .forEach(seq => {
                if(state.offers[seq].status.active) array.push(state.offers[seq])
            })
        return array
    },
    getOfferHistoryByCurrencyPair: state => currencyPair => {
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
    },
    getOfferCurrencyList: state => {
        return state.currencyList
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
    checkOpenOffers: (context) => {
        // check if offer has created offer tx
        console.log('checking open offers...')

        context.state.openOfferSequences.forEach(seq => {
            if(!context.state.offers[seq].hasOfferCreateData) {
                if(context.state.offers[seq].hashes[0]) context.dispatch('getPreviousExchanges', context.state.offers[seq].hashes[0])
            }
        })
    },
    setOpenOffers: (context, objects) => {
        objects.forEach(offer => {
            context.commit('setOpenOfferObject', offer)
        })
        return
        // todo Use this code if there is an offer without a created/initial tx get it until prevTx does not exsists
    },
    setOfferHistory: (context, txs) => {
        txs.forEach(transaction => {
            context.dispatch('parseTx', { transaction, notify: false })
            context.commit('addCurrencyObject', transaction.tx)
        })
    },
    getPreviousExchanges: async (context, transaction) => {
        const account = context.rootGetters.getAccount

        const getOfferTx = async (PreviousTxnID) => {
            try {
                const previousTx = await xrpl.send({
                    command: 'tx',
                    transaction: PreviousTxnID
                })
                context.dispatch('parseTx', {
                    transaction: {
                        tx: previousTx,
                        meta: previousTx.meta,
                        validated: previousTx.validated
                    }
                })
            } catch(e) {
                throw e
            }
        }

        if(transaction.hasOwnProperty('meta')) {
            for(const node of transaction.meta.AffectedNodes) {
                if(node.ModifiedNode?.LedgerEntryType === 'Offer') {
                    if(node.ModifiedNode?.FinalFields?.Account === account) {
                        const PreviousTxnID = node.ModifiedNode.PreviousTxnID
    
                        await getOfferTx(PreviousTxnID)
                    }
                }
            }
        } else if(typeof transaction === 'string') {
            await getOfferTx(transaction)
        }
        
        return

    },
    parseMetaData: (context, meta) => {
        const account = context.rootGetters.getAccount

        for(const node of meta.AffectedNodes) {
            if(node.DeletedNode?.LedgerEntryType === 'Offer') {
                if(node.DeletedNode?.FinalFields?.Account === account) {
                    context.commit('closedOffer', node.DeletedNode.FinalFields.Sequence)
                }
            }
        }

    },
    parseTx: (context, payload) => {
        const account = context.rootGetters.getAccount
        const transaction = payload.transaction
        const tx = transaction.tx || transaction.transaction
        
        context.dispatch('parseMetaData', transaction.meta)

        // if(payload.notify) {
        //     console.log(payload)
        //     context.dispatch('setAccountObjects')
        // }

        switch(tx.TransactionType) {
            case 'OfferCreate':
                const parsed = parseOrderbookChanges(transaction.meta)

                if(tx.Account === account) {
                    tx.condition = getCondition(tx)
                    tx.TransactionResult = transaction.meta.TransactionResult
                    
                    // The initial offercreate for this offer seq and account
                    context.commit('setInitialOffer', tx)

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
                                // If there's a trade on the inital offer create mutate the values
                                context.commit('intermediateOffer', offerChanges)
                            }
                        })
                    }

                    // if(transaction.hasOwnProperty('engine_result') && transaction.engine_result !== 'tesSUCCESS') {}
                    if(payload.notify) context.dispatch('notify', { type: 'create', sequence: tx.Sequence })
                    
                } else {
                    if(parsed.hasOwnProperty(account)) {
                        // transactions/exchanges after the initial offer create
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

                                if(!context.state.offers.hasOwnProperty(offerChanges.sequence) || !context.state.offers[offerChanges.sequence]?.hasOfferCreateData) {
                                    context.dispatch('getPreviousExchanges', transaction)
                                }

                                context.commit('intermediateOffer', offerChanges)
                                if(payload.notify) context.dispatch('notify', offerChanges)
                            }
                        })
                    }
                }
                break
            case 'OfferCancel':
                context.commit('canceledOffer', tx)
                const canceledOffer = {
                    sequence: tx.OfferSequence,
                    type: 'cancel'
                }
                // If there is a Canceled offer but no
                if(!context.state.offers.hasOwnProperty(canceledOffer.sequence) || !context.state.offers[canceledOffer.sequence]?.hasOfferCreateData) {
                    context.dispatch('getPreviousExchanges', transaction)
                }
                if(payload.notify) context.dispatch('notify', canceledOffer)
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

                        if(!context.state.offers.hasOwnProperty(offerChanges.sequence) || !context.state.offers[offerChanges.sequence]?.hasOfferCreateData) {
                            context.dispatch('getPreviousExchanges', transaction)
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
        console.log('notify...')
        const offerObj = context.getters.getOfferBySequence(tx.sequence)
        
        if(offerObj.status.failed) {
            return notify({
                title: 'Transacion failed',
                text: `Some info about the TX: ${offerObj.TransactionResult}`,
                type: 'error',
                data: offerObj
            })
        }

        if(offerObj.status.canceled) {
            if(offerObj.condition === 'ImmediateOrCancel') {
                if(offerObj.filledStatus === 'empty') {
                    return notify({
                        title: 'Canceled order Immidiately',
                        type: 'success',
                        data: offerObj
                    })
                } else if(offerObj.filledStatus === 'partially-filled') {
                    return notify({
                        title: 'Part-Filled & Canceled',
                        type: 'success',
                        text: `Exchanged ${quantityFormat(offerObj.TakerGets.values.filled, offerObj.TakerGets.currency)}/${quantityFormat(offerObj.TakerGets.values.created, offerObj.TakerGets.currency)}${currencyCodeFormat(offerObj.TakerGets.currency, 4)} for ${quantityFormat(offerObj.TakerPays.values.filled, offerObj.TakerPays.currency)}/${quantityFormat(offerObj.TakerPays.values.created, offerObj.TakerPays.currency)}${currencyCodeFormat(offerObj.TakerPays.currency, 4)}`,
                        data: offerObj
                    })
                }
            } else {
                return notify({
                    title: 'Canceled Order',
                    type: 'success',
                    data: offerObj
                })
            }
        }

        switch(tx.type) {
            case 'create':
                switch(offerObj.filledStatus) {
                    case 'empty':
                        return notify({
                            title: 'Created new Order',
                            type: 'success',
                            text: `Exchange ${quantityFormat(offerObj.TakerGets.values.created, offerObj.TakerGets.currency)}${currencyCodeFormat(offerObj.TakerGets.currency, 4)} for ${quantityFormat(offerObj.TakerPays.values.created, offerObj.TakerPays.currency)}${currencyCodeFormat(offerObj.TakerPays.currency, 4)}`,
                            data: offerObj
                        })
                    case 'partially-filled':
                        return notify({
                            title: 'Part-Filled new Order',
                            type: 'success',
                            text: `Exchanged ${quantityFormat(offerObj.TakerGets.values.filled, offerObj.TakerGets.currency)}/${quantityFormat(offerObj.TakerGets.values.created)}${currencyCodeFormat(offerObj.TakerGets.currency, 4)} for ${quantityFormat(offerObj.TakerPays.values.filled, offerObj.TakerPays.currency)}/${quantityFormat(offerObj.TakerPays.values.created, offerObj.TakerPays.currency)}${currencyCodeFormat(offerObj.TakerPays.currency, 4)}`,
                            data: offerObj
                        })
                    case 'filled':
                        return notify({
                            title: 'Filled new Order',
                            type: 'success',
                            text: `Exchanged ${quantityFormat(offerObj.TakerGets.values.filled, offerObj.TakerGets.currency)}${currencyCodeFormat(offerObj.TakerGets.currency, 4)} for ${quantityFormat(offerObj.TakerPays.values.filled, offerObj.TakerPays.currency)}${currencyCodeFormat(offerObj.TakerPays.currency, 4)}`,
                            data: offerObj
                        })
                }           
                break
            case 'mutation':
                switch(offerObj.filledStatus) {
                    case 'partially-filled':
                        return notify({
                            title: 'Partial filled',
                            type: 'success',
                            text: `Exchanged ${quantityFormat(tx.TakerGets.value, offerObj.TakerGets.currency)}/${quantityFormat(offerObj.TakerGets.values.created, offerObj.TakerGets.currency)}${currencyCodeFormat(offerObj.TakerGets.currency, 4)} for ${quantityFormat(tx.TakerPays.value, offerObj.TakerPays.currency)}/${quantityFormat(offerObj.TakerPays.values.created, offerObj.TakerPays.currency)}${currencyCodeFormat(offerObj.TakerPays.currency, 4)}`,
                            data: offerObj
                        })
                    case 'filled':
                        return notify({
                            title: 'Filled Order',
                            type: 'success',
                            text: `Exchanged ${quantityFormat(offerObj.TakerGets.values.filled, offerObj.TakerGets.currency)}${currencyCodeFormat(offerObj.TakerGets.currency, 4)} for ${quantityFormat(offerObj.TakerPays.values.filled, offerObj.TakerPays.currency)}${currencyCodeFormat(offerObj.TakerPays.currency, 4)}`,
                            data: offerObj
                        })
                }
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

            offerState.hasOfferCreateData = true
        } else {
            const offerObject = {
                sequence: seq,
                status: {
                    failed: offer.TransactionResult === 'tesSUCCESS' ? false : true,
                },
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
                hasOfferCreateData: true
            }
            
            if(offerObject.condition === 'ImmediateOrCancel') {
                offerObject.status.canceled = true
            } else if(offerObject.condition === 'FillOrKill') {
                offerObject.status.closed = offerObject.status.failed ? false : true
            }
    
            state.offers[seq] = offerObject   
        }
    },
    setOpenOfferObject: (state, offer) => {
        const seq = offer.Sequence
        if(state.offers.hasOwnProperty(seq)) {
            const offerState = state.offers[seq]
            offerState.status.active = true

            offerState.TakerGets.values.open = offer.TakerGets?.value || offer.TakerGets
            offerState.TakerPays.values.open = offer.TakerPays?.value || offer.TakerPays

        } else {
            const offerObject = {
                status: {
                    active: true
                },
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
                hashes:[offer.PreviousTxnID]
            }
            state.offers[seq] = offerObject
        }

        if(!state.openOfferSequences.includes(seq)) state.openOfferSequences.push(seq)

    },
    intermediateOffer: (state, offer) => { 
        const offerState = state.offers[offer.sequence]

        // Value mutations on the offer
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

        if(offerState.filledStatus === 'filled') {
            offerState.status.closed = true
        }
        if(offerState.condition === 'ImmediateOrCancel' && offerState.filledStatus === 'partially-filled') {
            offerState.status.canceled = true
        }
    },
    closedOffer: (state, seq) => {
        // Todo
        if(!state.offers.hasOwnProperty(seq)) return console.log('Deleted Offer Node Without TX history')

        const offerState = state.offers[seq]
        offerState.status.active = false

        state.openOfferSequences = state.openOfferSequences.filter(openSeq => openSeq !== seq)
    },
    canceledOffer: (state, offer) => {
        const seq = offer.OfferSequence
        
        // Todo
        if(!state.offers.hasOwnProperty(seq)) return console.log('Canceled Offer Without TX history')

        const offerState = state.offers[seq]

        offerState.status.canceled = true
        offerState.status.active = false
        offerState.date.closed = offer.date
        offerState.date.latest = offer.date
        offerState.hashes.push(offer.hash)

        offerState.fees = Number(offer.Fee) + Number(offerState.fees)

        state.openOfferSequences = state.openOfferSequences.filter(openSeq => openSeq !== seq)
    },
    addCurrencyObject: (state, tx) => {
        if(tx.hasOwnProperty('TakerGets') && typeof tx.TakerGets === 'object' && typeof tx.TakerGets?.currency !== 'undefined' && typeof tx.TakerGets?.issuer !== 'undefined') {
            if(Array.isArray(state.currencyList[tx.TakerGets.currency]) && !state.currencyList[tx.TakerGets.currency].includes(tx.TakerGets.issuer)) state.currencyList[tx.TakerGets.currency].push(tx.TakerGets.issuer)
            else state.currencyList[tx.TakerGets.currency] = [tx.TakerGets.issuer]
        }

        if(tx.hasOwnProperty('TakerPays') && typeof tx.TakerPays === 'object' && typeof tx.TakerPays?.currency !== 'undefined' && typeof tx.TakerPays?.issuer !== 'undefined') {
            if(Array.isArray(state.currencyList[tx.TakerPays.currency]) && !state.currencyList[tx.TakerPays.currency].includes(tx.TakerPays.issuer)) state.currencyList[tx.TakerPays.currency].push(tx.TakerPays.issuer)
            else state.currencyList[tx.TakerPays.currency] = [tx.TakerPays.issuer]
        }
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
