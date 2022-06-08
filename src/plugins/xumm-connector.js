import axios from 'redaxios'
import jwt from 'jsonwebtoken'

const apiEndPoint = 'https://xumm.app/api/v1/xapp-jwt'
const api = process.env.VUE_APP_XAPP_KEY_WEB
let jwtToken
let curatedAssets

const authenticate = (state) => {
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) //random string

    const qstring = new URLSearchParams({
        client_id: api,
        redirect_uri: 'http://192.168.1.102:8080/auth',
        scope: 'somescope',
        response_type: 'token',
        response_mode: 'query',
        state: btoa(state),
        //buf.toString('base64')
        nonce: nonce
    })
    window.open(`https://oauth2.xumm.app/auth?${qstring}`)
}

const authenticateWithPopup = (state) => {
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) //random string

    const qstring = new URLSearchParams({
        client_id: api,
        redirect_uri: 'http://192.168.1.102:8080/auth',
        scope: 'somescope',
        response_type: 'token',
        response_mode: 'query',
        state: btoa(state),
        //buf.toString('base64')
        nonce: nonce
    })
    
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const width = 400;
    const height = 700;
 
    const url = `https://oauth2.xumm.app/auth?${qstring}`;
    window.open(url, "popup", `location=no,width=${width},height=${height},top=0,left=${screenWidth-width},resizable=no`);
}


const setJwt = (token) => {
    jwtToken = token

    return jwt.decode(token)
}

const sendToSign = async (payload) => {
    console.log('payload:', payload)
    const res = await axios.post(`${apiEndPoint}/payload`, payload , { headers: { Authorization: `Bearer ${jwtToken}` } })
    console.log(res.data)
    return res.data
}

const getCuratedAssets = async () => {
    if(curatedAssets && Object.keys(curatedAssets).length > 0 && curatedAssets.constructor === Object) return curatedAssets
    
    const res = await axios.get('https://xumm.app/api/v1/platform/curated-assets')
    curatedAssets = res.data
    return curatedAssets
}

export default {
    authenticate,
    setJwt,
    sendToSign,
    getCuratedAssets
}
