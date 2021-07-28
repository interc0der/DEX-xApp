import { parseOrderbookChanges } from 'ripple-lib-transactionparser'

import xrpl from '../../plugins/ws-client'

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
        const account = context.rootGetters.getAccount

        txs.forEach(transaction => {
            const tx = transaction.tx
            
            switch(tx.TransactionType) {
                case 'OfferCreate':
                    const parsed = parseOrderbookChanges(transaction.meta)

                    if(tx.Account === account) {
                        // initialOffer
                        tx.condition = getCondition(tx)
                        context.commit('setInitialOffer', tx)

                        // parse metadata
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
                                        TakerGets: mutation.direction === 'buy' ? quantity : totalPrice,
                                        TakerPays: mutation.direction === 'buy' ? totalPrice : quantity
                                    }
                                    context.commit('intermediateOffer', offerChanges)
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
                                        TakerGets: mutation.direction === 'sell' ? quantity : totalPrice,
                                        TakerPays: mutation.direction === 'sell' ? totalPrice : quantity
                                    }
                                    context.commit('intermediateOffer', offerChanges)
                                }
                            })
                        }
                    }
                    break
                case 'OfferCancel':
                    context.commit('canceledOffer', tx)
                    break
                case 'Payment':
                    const parsedPayment = parseOrderbookChanges(transaction.meta)
                    if(!parsedPayment.hasOwnProperty(account)) break

                    const parsedPaymentArray = parsedPayment[account]
                    
                    // console.log(tx.ledger_index)
                    // console.log(tx)
                    // console.log(transaction.meta)
                    // console.log(parsedPayment)

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
                                TakerGets: mutation.direction === 'sell' ? quantity : totalPrice,
                                TakerPays: mutation.direction === 'sell' ? totalPrice : quantity
                            }
                            context.commit('intermediateOffer', offerChanges)
                        }
                    })
                    break
                default:
                    console.log('TX TYPE NOT IN SWITCH VUEX: ' + tx.TransactionType)

            }
        })
    },
    parseTx: (context, tx) => {
        // this.setOpenOffers()

        // this.$emitter.on('account_change', () => {
        //     this.setOpenOffers()
        // })
        // this.$rippled.on('transaction', tx => {
        //     if(tx.transaction.TransactionType === 'OfferCreate') {
                
        //         console.log('parsing...')
        //         // const parsed = TxMutationParser(this.account, tx)
        //         const parsed = parseOrderbookChanges(tx.meta)
        //         console.log(parsed)
        //         console.log('result')
                
        //         if (tx.engine_result !== 'tesSUCCESS') {
        //             // Todo show all messages on the possible errors
        //             // tecKilled etc...
        //             this.$notify({
        //                 title: 'Transacion error HC',
        //                 text: `Some info about the TX: ${tx.engine_result}`,
        //                 type: 'error'
        //             })
        //             return // alert(tx.engine_result)
        //         }

        //         const offer = this.returnOffer(tx.transaction)
        //         this.offers.unshift(offer)

        //         const offerData = parsed[this.account][0]
        //         this.$notify({
        //             title: 'New Order',
        //             text: `${this.$xapp.currencyFormat(offerData.totalPrice.value, offerData.totalPrice.currency)}${this.$xapp.currencyCodeFormat(offerData.totalPrice.currency, 4)} Exchanged for ${this.$xapp.currencyFormat(offerData.quantity.value, offerData.quantity.currency)}${this.$xapp.currencyCodeFormat(offerData.quantity.currency, 4)}`,
        //             type: 'success'
        //         })
        //     } else if(tx.transaction.TransactionType === 'OfferCancel') {
        //         if (tx.engine_result !== 'tesSUCCESS') {
        //             // Todo
        //             this.$notify({
        //                 title: 'Error in canceling order',
        //                 text: `Result code: ${tx.engine_result}`,
        //                 type: 'error'
        //             })
        //             return
        //         }

        //         // tx.transaction.OfferSequence !== offer.seq
        //         this.offers = this.offers.filter(offer => {
        //             if(tx.transaction.OfferSequence === offer.Sequence) {
        //                 this.$notify({
        //                     title: `Canceled order #${tx.transaction.OfferSequence}`,
        //                     text: `Pay: ${this.$xapp.currencyFormat(offer.TakerGets.value, offer.TakerGets.currency)}${this.$xapp.currencyCodeFormat(offer.TakerGets.currency, 4)} Get: ${this.$xapp.currencyFormat(offer.TakerPays.value, offer.TakerPays.currency)}${this.$xapp.currencyCodeFormat(offer.TakerPays.currency, 4)}`,
        //                     type: 'success'
        //                 })
        //                 return false
        //             } else return true
        //         })
        //     }
        // })
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

            offerState.fees = Number(offer.Fee) + Number(offerState.fees)
        } else {
            const offerObject = {
                sequence: seq,
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
        }

        if(offerState.TakerPays.currency === offer.TakerPays.currency && offerState.TakerPays.issuer === offer.TakerPays.issuer) {
            offerState.TakerPays.values.filled = Number(offerState.TakerPays.values.filled) + Number(offer.TakerPays.value)
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
