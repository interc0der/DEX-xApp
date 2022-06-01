import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

import trade from '../views/Desktop.vue'
import NotFound from '../views/NotFound.vue'

import xummConnector from '../plugins/xumm-connector'

const some = (to) => {

}

function removeQueryParams(to) {
    if (Object.keys(to.query).length) {
        return { path: to.path, query: {}, hash: to.hash }
    }
}

const changeTradingPair = query => {
    if(query.hasOwnProperty('base') && query.hasOwnProperty('quote')) {
        const base = query.base
        const quote = query.quote

        const payload = {}

        const baseSplitted = base.split(' ', 2)
        const quoteSplitted = quote.split(' ', 2)

        if(baseSplitted.length > 1) {
            payload.base = {
                currency: baseSplitted[0],
                issuer: baseSplitted[1]
            }
        } else if(String(base).toUpperCase() === 'XRP') payload.base = 'XRP'

        if(quoteSplitted.length > 1) {
            payload.quote = {
                currency: quoteSplitted[0],
                issuer: quoteSplitted[1]
            }
        } else if(String(quote).toUpperCase() === 'XRP') payload.quote = 'XRP'

        store.dispatch('changeCurrencyPair', payload)
    } else return null
}

const routes = [
    {
        path: '/',
        name: 'url',
        component: trade,
        beforeEnter: (to, from) => {
            if (Object.keys(to.query).length) {
                const res = changeTradingPair(to.query)
                if(res === null) console.log('error with quote or base')
            }
            
            // return { path: '/test?', query: { base: 'xrp', quote: 'USD+rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq' } }
        }
        // base=xrp&quote=USD+rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq
    },
    {
        path: '/auth',
        name: 'xummAuth',
        beforeEnter: (to, from, next) => {
            if(Object.keys(to.query).length) {
                if(to.query.hasOwnProperty('access_token')) {
                    const data = xummConnector.setJwt(to.query.access_token)

                    store.dispatch('setAccount', { account: data.sub, provider: 'xumm' })
                    // {
                    //     "client_id": "f73378ed-7641-4978-83f9-e649d82c3ec0",
                    //     "state": "Lz9iYXNlPVVTRCtyaHViOFZSTjU1czk0cVdLRHY2am1EeTFwVXlrSnpGM3dxJnF1b3RlPVhSUA==",
                    //     "scope": "somescope",
                    //     "nonce": "2ppuqtmum0ero5fayjaq8r",
                    //     "aud": "f73378ed-7641-4978-83f9-e649d82c3ec0",
                    //     "sub": "rLWQ9tsmrJJc9wUmHDaHNGzUNK7dGefRZk",
                    //     "app_uuidv4": "f73378ed-7641-4978-83f9-e649d82c3ec0",
                    //     "app_name": "Trade",
                    //     "payload_uuidv4": "e9112783-d20a-468d-9c56-9bcca39f3c0a",
                    //     "usertoken_uuidv4": "04df5c72-3635-46d2-b765-41ac5ba1213c",
                    //     "iat": 1653910326,
                    //     "exp": 1653996726,
                    //     "iss": "https://oauth2.xumm.app"
                    // }
                }
                if(to.query.hasOwnProperty('state')) next(atob(to.query.state))

                // http://192.168.1.102:8080/auth?
                // access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJmNzMzNzhlZC03NjQxLTQ5NzgtODNmOS1lNjQ5ZDgyYzNlYzAiLCJzdGF0ZSI6Ii8_YmFzZT1VU0Qrcmh1YjhWUk41NXM5NHFXS0R2NmptRHkxcFV5a0p6RjN3cSZxdW90ZT1YUlAiLCJzY29wZSI6InNvbWVzY29wZSIsIm5vbmNlIjoibnp0cjZxNWI4cTcwdGVwNXZnczZjIiwiYXVkIjoiZjczMzc4ZWQtNzY0MS00OTc4LTgzZjktZTY0OWQ4MmMzZWMwIiwic3ViIjoickxXUTl0c21ySkpjOXdVbUhEYUhOR3pVTks3ZEdlZlJaayIsImFwcF91dWlkdjQiOiJmNzMzNzhlZC03NjQxLTQ5NzgtODNmOS1lNjQ5ZDgyYzNlYzAiLCJhcHBfbmFtZSI6IlRyYWRlIiwicGF5bG9hZF91dWlkdjQiOiIyYzA3MDkzYi1lOWZiLTRiOTQtYjU2Mi02MTk1YWEzNmE4MzciLCJ1c2VydG9rZW5fdXVpZHY0IjoiMDRkZjVjNzItMzYzNS00NmQyLWI3NjUtNDFhYzViYTEyMTNjIiwiaWF0IjoxNjUzOTA3MzAzLCJleHAiOjE2NTM5OTM3MDMsImlzcyI6Imh0dHBzOi8vb2F1dGgyLnh1bW0uYXBwIn0.QiZlTVzPwKQUXKZJZTMDyMO8v-8zFBBnRoirX00ONA79kpoFk-jCCk9ukOzrugQO5lDvFXHJ239bzy_I8bICYwP26k8Zxx7vUzqDjETw6-ShY7LDLNtc_obqBFrtyhrtbIEkIq65Oe69asAQOujS3F6wDV_iFVXpI6HDFOlporP479DbskLYqW1fwwJkNdA9ozGJ6At-yDxpAOgTSgLhJsy-AyIz7Z89aJAfLRvd3_PKE1Q6P2ne7J9SKWhZ0KFSVm4bLv42RDd7O1w8izhPfbBlTYsF2uaIKD_21oYLUeq3VeKYkzbGU9hozm3hA94Dg1_ms6VaN5CMTxLVWnq-ZvNbzzOF69zdosN-g270jHMz_tRZuU_keTuqM4X2cPI5P60FDXD0uUABf4iRkxCgLCz8pOyjs4vD26n9vVT72uWPPplMwehjaFhmJvKLactmIm7SR4esxe2JqsyQXD6RJlEGfIddta6vgVGhDs0EEqtWyDPCdnND3aHBK_z2v-XG
                // &token_type=bearer
                // &expires_in=86400
                // &refresh_token=
                // &state=%2F%3Fbase%3DUSD%2Brhub8VRN55s94qWKDv6jmDy1pUykJzF3wq%26quote%3DXRP&nonce=nztr6q5b8q70tep5vgs6c
            }
        }
    },
    // {
    //     path: '/:trading_pair',
    //     name: 'trade',
    //     component: trade,
    //     beforeEnter: (to, from) => {
    //         // todo check if excists/valid

    //         return removeQueryParams(to)
        
    //         // return false
    //     }
    // },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router