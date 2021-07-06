const currencyFormat = (amount, currency) => {
    amount = Number(amount)
    if(amount === null || Number.isNaN(amount)) amount = 0 // Set amount to 0 when there is no trustline

    var integer = Math.trunc(amount)
    var decimal = amount % 1
    
    switch(currency) {
        case 'XRP':
            return amount = Number(amount / 1_000_000).toFixed(6)
        case 'EUR':
        case 'USD':
            return amount = Number(amount).toFixed(4)
        default:
            decimal = decimal.toFixed(8)
            return (Number(integer) + Number(decimal)).toFixed(8)
    }
}

function isHex(string) {
    var re = /[0-9A-Fa-f]{6}/g
    const isValid = re.test(string) && !isNaN( parseInt(string,16) )
    re.lastIndex = 0
    return isValid
}

const currencyCodeFormat = (string, maxLength) => {
    if (typeof maxLength === 'undefined') maxLength = 4
    if(!isHex(string)) {
        if(string.length > maxLength) {
            return string.slice(0, maxLength)
        } else return string
    }

    var hex = string.toString()
    var str = ''
    for (var n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16))
    }
    var trimmed = str.trim()
    if(trimmed.length > maxLength) {
        return trimmed.slice(0, maxLength)
    } else return trimmed
}

const epochToDate = (epoch) => {
    let date = new Date('2000-01-01T00:00:00Z')
    date.setUTCSeconds(epoch)
    return date
}

export {
    currencyFormat,
    currencyCodeFormat,
    epochToDate
}