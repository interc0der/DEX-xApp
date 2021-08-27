// import { parseOrderbookChanges, parseBalanceChanges } from 'ripple-lib-transactionparser'
import xrpl from '../../plugins/ws-client'
import { notify } from "@kyvg/vue3-notification"

import { currencyCodeFormat, quantityFormat, priceFormat } from '../../plugins/number-format'

const state = {
    offers: {},
    openOfferSequences: [],
    currencyList: {
        XRP: null
    },
    createdNotAvailableSequences: []
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
                if(context.state.offers[seq].hashes[0]) context.dispatch('getOfferTx', { PreviousTxnID: context.state.offers[seq].hashes[0], Sequence: seq } )
            }
        })
    },
    setOpenOffers: (context, objects) => {
        objects.forEach(offer => {
            context.commit('setOpenOfferObject', offer)
        })
        return
    },
    setOfferHistory: (context, txs) => {
        txs.forEach(transaction => {
            context.dispatch('parseTx', { transaction, notify: false })
        })
    },
    getOfferTx: async (context, payload) => {
        const PreviousTxnID = payload.PreviousTxnID
        const Sequence = payload.Sequence
        const overRide = payload.overRide

        if(context.state.createdNotAvailableSequences.includes(Sequence) && !overRide) return
        else context.commit('addNoCreatedSequenceToArray', Sequence)

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

            const account = context.rootGetters.getAccount
            
            if(previousTx.hasOwnProperty('meta')) {
                for(const node of previousTx.meta.AffectedNodes) {
                    if(node.ModifiedNode?.LedgerEntryType === 'Offer') {
                        if(node.ModifiedNode?.FinalFields?.Account === account) {
                            const PreviousTxnID = node.ModifiedNode.PreviousTxnID
        
                            await context.dispatch('getOfferTx', { PreviousTxnID, Sequence: Sequence, overRide: true })
                        }
                    }
                }
            }

        } catch(e) {
            throw e
        }
    },
    parseMetaData: (context, transaction) => {
        const meta = transaction.meta
        const tx = transaction.tx || transaction.transaction
        const notification = transaction.notify

        if(!meta) {
            console.error('No metadata to parse!')
            return console.log(transaction)
        }

        // only for testing todo delete
        // if(tx.Sequence !== 19626395) {
        //     return
        // } else {
        //     console.log(transaction)
        // }

        const account = context.rootGetters.getAccount

        let offerChange = false
        let offerChangedSequence
        const balanceChanges = {}

        const addBalance = (account, amountObj) => {
            if(!Array.isArray(balanceChanges[account])) {
                balanceChanges[account] = [amountObj]
            } else {
                for(let obj of balanceChanges[account]) {
                    if(obj.currency === amountObj.currency && obj.issuer === amountObj.issuer) {
                        obj.value = Number(obj.value) + Number(amountObj.value)
                        return
                    }
                }
                balanceChanges[account].push(amountObj)
            }
        }

        if(tx.TransactionType === 'OfferCreate' && tx.Account === account) {
            tx.condition = getCondition(tx)
            tx.TransactionResult = transaction.meta.TransactionResult

            context.commit('setInitialOffer', tx)
        }

        for(const node of meta.AffectedNodes) {

            if(node.hasOwnProperty('CreatedNode') && node.CreatedNode?.NewFields?.Account === account && notification) {
                // increase/increment object reserve for account
                context.dispatch('addObjectToAccount', node.CreatedNode)

                // set offer to active
                context.commit('setOpenOfferObject', node.CreatedNode.NewFields)
            }

            if(node.hasOwnProperty('CreatedNode') && (node.CreatedNode?.NewFields?.HighLimit?.issuer === account || node.CreatedNode?.NewFields?.LowLimit?.issuer || account) && notification) {
                // If trustline Added
                context.dispatch('addObjectToAccount', node.CreatedNode)
                notify({
                    title: 'Created Trustline',
                    type: 'success',
                    text: `${currencyCodeFormat(node.CreatedNode?.NewFields?.HighLimit?.currency, 4)} - ${node.CreatedNode?.NewFields?.HighLimit?.issuer === account ? node.CreatedNode?.NewFields?.LowLimit?.issuer : node.CreatedNode?.NewFields?.HighLimit?.issuer}`,
                })
            }

            if(node.hasOwnProperty('DeletedNode') && notification) {
                // decrease object reserve
                if(node.DeletedNode?.FinalFields?.Account === account) {
                    // remove offer object
                    context.dispatch('removeObjectFromAccount', node.DeletedNode)
                } else if(node.DeletedNode?.FinalFields?.HighLimit?.issuer === account || node.DeletedNode?.FinalFields?.LowLimit?.issuer === account) {
                    // remove if ripplestate/trustline/iou
                    context.dispatch('removeObjectFromAccount', node.DeletedNode)
                    notify({
                        title: 'Deleted Trustline',
                        type: 'success',
                        text: `${currencyCodeFormat(node.DeletedNode?.FinalFields?.HighLimit?.currency, 4)} - ${node.DeletedNode?.FinalFields?.HighLimit?.issuer === account ? node.DeletedNode?.FinalFields?.LowLimit?.issuer : node.DeletedNode?.FinalFields?.HighLimit?.issuer}`,
                    })
                }
            }

            // Offer Create
            if(node.CreatedNode?.LedgerEntryType === 'Offer') {
                if(node.CreatedNode?.NewFields?.Account === account) {
                    offerChange = true
                    offerChangedSequence = node.CreatedNode.NewFields.Sequence
                }
            }

            // Offer Cancel or filled
            if(node.DeletedNode?.LedgerEntryType === 'Offer') {
                if(node.DeletedNode?.FinalFields?.Account === account) {
                    // TODO TakerPays & TakerGets value = 0 is filled else Part Filled???
                    const sequence = node.DeletedNode.FinalFields.Sequence
                    const PreviousTxnID = node.DeletedNode.FinalFields.PreviousTxnID
                    
                    if(tx.TransactionType !== 'OfferCancel') {
                        offerChange = true
                        offerChangedSequence = sequence
                        
                        context.commit('closedOffer', node.DeletedNode.FinalFields.Sequence)
                        context.commit('setFilledState', sequence)
                    } else {
                        context.commit('canceledOffer', tx)
                    }

                    if(!context.state.offers.hasOwnProperty(sequence) || !context.state.offers[sequence]?.hasOfferCreateData) {
                        context.dispatch('getOfferTx', { PreviousTxnID: PreviousTxnID, Sequence: sequence } )
                    }
                }
            }
          
            if(node.ModifiedNode?.LedgerEntryType === 'Offer') {
                if(node.ModifiedNode?.FinalFields?.Account === account) {
                    const sequence = node.ModifiedNode.FinalFields.Sequence
                    const PreviousTxnID = node.ModifiedNode.PreviousTxnID

                    offerChange = true
                    offerChangedSequence = sequence

                    if(!context.state.offers.hasOwnProperty(sequence) || !context.state.offers[sequence]?.hasOfferCreateData) {
                        context.dispatch('getOfferTx', { PreviousTxnID, Sequence: sequence } )
                    }
                }
            }

            if(node.ModifiedNode?.LedgerEntryType === 'AccountRoot') {
                if(node.ModifiedNode?.FinalFields?.Account === account) {
                    // parse XRP amount
                    let value = Number(node.ModifiedNode.FinalFields.Balance) - Number(node.ModifiedNode.PreviousFields.Balance) + Number(tx.Fee)

                    if(value === 0) {
                        // console.log('only fee paid no offerchanges')
                        addBalance(node.ModifiedNode.FinalFields.Account, {
                            currency: 'XRP',
                            issuer: null,
                            fees: Number(tx.Fee)
                        })
                    } else {
                        addBalance(node.ModifiedNode.FinalFields.Account, {
                            currency: 'XRP',
                            issuer: null,
                            value: value,
                            fees: Number(tx.Fee)
                        })
                    }
                }
            }

            if(node.ModifiedNode?.LedgerEntryType === 'RippleState') {
                // parse IOU's
                if(!isNaN(node.ModifiedNode.FinalFields?.Balance?.value) && !isNaN(node.ModifiedNode.PreviousFields?.Balance?.value) ) {
                    // HighLimit === issuer if balance positive else is account
                    // LowLimit === account

                    let issuerRipple
                    let accountRipple
                    if( Math.sign(Number(node.ModifiedNode.FinalFields?.Balance?.value)) >= 0 ) {
                        issuerRipple = node.ModifiedNode.FinalFields.HighLimit.issuer
                        accountRipple = node.ModifiedNode.FinalFields.LowLimit.issuer
                    } else {
                        issuerRipple = node.ModifiedNode.FinalFields.LowLimit.issuer
                        accountRipple = node.ModifiedNode.FinalFields.HighLimit.issuer
                    }
                    

                    let value = Number(node.ModifiedNode.FinalFields.Balance.value) - Number(node.ModifiedNode.PreviousFields?.Balance?.value)
                    const balanceObj = {
                        currency: node.ModifiedNode.FinalFields.Balance.currency,
                        issuer: issuerRipple,
                        value: value
                    }

                    // addBalance(issuerRipple, balanceObj)
                    addBalance(accountRipple, balanceObj)
                }
            }
        }

        if(tx.TransactionType === 'OfferCreate' && tx.Account === account && !offerChange && tx.TransactionResult === 'tesSUCCESS') {
            offerChange = true
            offerChangedSequence = tx.Sequence

            context.commit('setFilledState', tx.Sequence)
        }

        if(offerChange) {
            const offerChanges = {
                sequence: offerChangedSequence,
                balanceChanges: balanceChanges[account]
            }
            // console.log(offerChanges)
            context.commit('intermediateOffer', offerChanges)

            if(notification) {
                switch(tx.TransactionType) {
                    case 'OfferCreate':
                        if(tx.Account === account) context.dispatch('notify', { type: 'create', sequence: tx.Sequence })
                        else {
                            // todo :: If offercreate by other account that hit the offer check for offer sequence in this state 
                            offerChanges['type'] = 'mutation'
                            context.dispatch('notify', offerChanges)
                        }
                        break
                    case 'OfferCancel':
                        context.dispatch('notify', {
                            sequence: tx.OfferSequence,
                            type: 'cancel'
                        })
                        break
                    case 'Payment':
                        // todo :: Check if is payment or hit an offer sequence also check if is in state
                        break
                    default:
                        console.log('TX TYPE NOT IN SWITCH VUEX: ' + tx.TransactionType)
                }
            }
        } else {
            if(notification) {
                console.log('todo notify me please')
                switch(tx.TransactionType) {
                    case 'Payment':
                        if(tx.Account === account) {
                            notify({
                                title: 'Payment send',
                                type: 'success',
                                text: `Send ${quantityFormat(tx.Amount?.value || tx.Amount, tx.Amount?.currency || 'XRP')}${currencyCodeFormat(tx.Amount?.currency || 'XRP', 4)}`,
                                // data: offerObj
                            })
                        } else {
                            notify({
                                title: 'Payment received',
                                type: 'success',
                                text: `Received ${quantityFormat(tx.Amount?.value || tx.Amount, tx.Amount?.currency || 'XRP')}${currencyCodeFormat(tx.Amount?.currency || 'XRP', 4)}`,
                            })
                        }
                        break
                    case 'TrustSet':
                        break
                }
            }
        }

        if(notification) {
            context.dispatch('changeBalance', balanceChanges[account])
        }
    },
    parseTx: (context, payload) => {
        const transaction = payload.transaction
        const tx = transaction.tx || transaction.transaction

        transaction.notify = payload.notify
        
        context.dispatch('parseMetaData', transaction)
        context.commit('addCurrencyObject', tx)

        return
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
                        let TakerGets = 0
                        let TakerPays = 0
                        tx.balanceChanges.forEach(change => {
                            if(offerObj.TakerGets.currency === change.currency && (offerObj.TakerGets.issuer === change.issuer || offerObj.TakerGets.currency === 'XRP') ) {
                                TakerGets = Number(TakerGets) + Math.abs(Number(change.value))
                            } else if(offerObj.TakerPays.currency === change.currency && (offerObj.TakerPays.issuer === change.issuer || offerObj.TakerPays.currency === 'XRP') ) {
                                TakerPays = Number(TakerPays) + Math.abs(Number(change.value))
                            }
                        })
                        return notify({
                            title: 'Partial filled',
                            type: 'success',
                            text: `Exchanged ${quantityFormat(TakerGets, offerObj.TakerGets.currency)}/${quantityFormat(offerObj.TakerGets.values.created, offerObj.TakerGets.currency)}${currencyCodeFormat(offerObj.TakerGets.currency, 4)} for ${quantityFormat(TakerPays, offerObj.TakerPays.currency)}/${quantityFormat(offerObj.TakerPays.values.created, offerObj.TakerPays.currency)}${currencyCodeFormat(offerObj.TakerPays.currency, 4)}`,
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
    },
    resetOfferState: (context) => {
        context.commit('resetOfferState')
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
        if(!state.offers.hasOwnProperty(offer.sequence)) return console.log('Sequence is not set for Offer')
        const offerState = state.offers[offer.sequence]

        if(offer.balanceChanges?.length >= 2) {
            offer.balanceChanges.forEach(change => {
                if(offerState.TakerGets.currency === change.currency && (offerState.TakerGets.issuer === change.issuer || offerState.TakerGets.currency === 'XRP') ) {
                    offerState.TakerGets.values.filled = Number(offerState.TakerGets.values.filled) + Math.abs(Number(change.value))
                } else if(offerState.TakerPays.currency === change.currency && (offerState.TakerPays.issuer === change.issuer || offerState.TakerPays.currency === 'XRP') ) {
                    offerState.TakerPays.values.filled = Number(offerState.TakerPays.values.filled) + Math.abs(Number(change.value))
                }
            })

            if(offerState.filledStatus !== 'filled') offerState.filledStatus = 'partially-filled'
        } // else console.log('Offer mutation not on both sides')
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
    },
    addNoCreatedSequenceToArray: (state, seq) => {
        state.createdNotAvailableSequences.push(seq)
    },
    setFilledState: (state, seq) => {
        // Todo
        if(!state.offers.hasOwnProperty(seq)) return console.log('Setting FilledStatus to Offer Without TX history/sequence available')

        const offerState = state.offers[seq]
        offerState.filledStatus = 'filled'
    },
    resetOfferState: (state) => {
        console.log('Resetting Offers.js state')
        state.offers = {}
        state.openOfferSequences = []
        state.createdNotAvailableSequences = []
        state.currencyList = {
            XRP: null
        }
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
