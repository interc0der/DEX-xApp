import { parseOrderbookChanges } from 'ripple-lib-transactionparser'
import { TxMutationParser } from 'tx-mutation-parser'

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
            const gets = offer.created.TakerGets
            const pays = offer.created.TakerPays

            let test = false
            if(gets.currency === currencyPair.base.currency || gets.currency === currencyPair.quote.currency) test = true
            if(pays.currency === currencyPair.base.currency || pays.currency === currencyPair.quote.currency) test = true

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
    getOfferFilledStatusBySequence: state => sequence => {
        if(!state.offers.hasOwnProperty(sequence)) return null

    }
}

const actions = {
    setOpenOffers: async (context, objects) => {
        context.commit('resetOffers')
        try {
            const offers = await Promise.all(
                objects.map(async offer => {
                    // todo check if offercreate TX already excist in Account TX to get all Offers related to the OfferSequence
                    const originalTx = await xrpl.send({
                        command: 'tx',
                        transaction: offer.PreviousTxnID
                    })
                    // If original TX has PreviousTxnID fetch that one if there is no offfer create tx in the history

                    const getCondition = (flag) => {
                        const tfImmediateOrCancel = 0x00020000
                        const tfFillOrKill = 0x00040000

                        if(( flag & tfImmediateOrCancel) == tfImmediateOrCancel) return 'ImmediateOrCancel'
                        else if((flag & tfFillOrKill) == tfFillOrKill) return 'FillOrKill'
                        else if(originalTx.hasOwnProperty('Expiration')) return 'TimeToKill'
                        else return 'GoodTillCancel'
                    }

                    const offerObject = {
                        status: 'open',
                        sequence: offer.Sequence,
                        condition: getCondition(originalTx.Flags),
                        open: {
                            hash: offer.PreviousTxnID,
                            TakerGets: typeof offer.TakerGets === 'string' ? { currency: 'XRP', value: offer.TakerGets } : offer.TakerGets,
                            TakerPays: typeof offer.TakerPays === 'string' ? { currency: 'XRP', value: offer.TakerPays } : offer.TakerPays
                        },
                        created: {
                            hash: originalTx.hash,
                            date: originalTx.date,
                            TakerGets: typeof originalTx.TakerGets === 'string' ? { currency: 'XRP', value: originalTx.TakerGets } : originalTx.TakerGets,
                            TakerPays: typeof originalTx.TakerPays === 'string' ? { currency: 'XRP', value: originalTx.TakerPays } : originalTx.TakerPays
                        },
                        quality: Number(originalTx.TakerGets?.value || originalTx.TakerGets) / Number(originalTx.TakerPays?.value || originalTx.TakerPays),
                        TakerGetsFilled: Number(originalTx.TakerGets?.value || originalTx.TakerGets) - Number(offer.TakerGets?.value || offer.TakerGets),
                        TakerPaysFilled: Number(originalTx.TakerPays?.value || originalTx.TakerPays) - Number(offer.TakerPays?.value || offer.TakerPays),
                        progress: [], // Todo
                        fees: 0 // Todo
                    }
                    context.commit('setOffer', offerObject)
                    return offerObject
                })
            )
        } catch(e) {
            throw e
        }
    },
    setOfferHistory: (context, txs) => {
        txs.forEach(transaction => {
            const tx = transaction.tx
            
            switch(tx.TransactionType) {
                case 'OfferCreate':

                    const getCondition = (flag, expiration) => {
                        const tfImmediateOrCancel = 0x00020000
                        const tfFillOrKill = 0x00040000
        
                        if(( flag & tfImmediateOrCancel) == tfImmediateOrCancel) return 'ImmediateOrCancel'
                        else if((flag & tfFillOrKill) == tfFillOrKill) return 'FillOrKill'
                        else if(typeof expiration === '') return 'TimeToKill'
                        else return 'GoodTillCancel'
                    }

                    const offerCreatedObject = {
                        sequence: tx.Sequence,
                        condition: getCondition(tx.Flags, tx.Expiration),
                        created: {
                            meta: transaction.meta,
                            date: tx.date,
                            hash: tx.hash,
                            TakerGets: typeof tx.TakerGets === 'string' ? { currency: 'XRP', value: tx.TakerGets } : tx.TakerGets,
                            TakerPays: typeof tx.TakerPays === 'string' ? { currency: 'XRP', value: tx.TakerPays } : tx.TakerPays
                        },
                        fees: tx.Fee
                    }
                    
                    // const parsed1 = TxMutationParser(context.rootGetters.getAccount, transaction)
                    // console.log(parsed1)
                    const parsed = parseOrderbookChanges(transaction.meta)
                    console.log(parsed)

                    if(offerCreatedObject.condition === 'ImmediateOrCancel' || offerCreatedObject.condition === 'FillOrKill') offerCreatedObject['status'] = 'closed'

                    const offerInState = context.getters.getOfferBySequence(tx.Sequence)
                    if(offerInState) {
                        if(offerInState.hasOwnProperty('created')) console.log('Has created object')
                        else context.commit('setOffer', offerCreatedObject)
                    } else context.commit('setOffer', offerCreatedObject)
                    break
                case 'OfferCancel':
                    const offerCanceledObject = {
                        sequence: tx.OfferSequence,
                        status: 'closed',
                        canceled: {
                            meta: transaction.meta,
                            date: tx.date,
                            hash: tx.hash,
                            sequence: tx.Sequence
                        },
                        fees: tx.Fee
                    }
                    context.commit('setOffer', offerCanceledObject)
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
    resetOffers: (state) => {
        state.offers = {}
    },
    setOffer: (state, offer) => {

        if(offer.status === 'open') state.openOfferSequences.push(offer.sequence)
        if(!state.offers.hasOwnProperty(offer.sequence)) {
            state.offers[offer.sequence] = offer
        } else {
            const fees = Number(state.offers[offer.sequence].fees) + Number(offer.fees)
            
            state.offers[offer.sequence] = {...state.offers[offer.sequence], ...offer}
            
            state.offers[offer.sequence].fees = fees
        }
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
