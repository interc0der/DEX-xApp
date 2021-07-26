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

    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const hour = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()

    const makeDouble = (value) => {
        value = value.toString()
        if(value.length === 1) return '0' + value
        return value
    }
    return `${year}-${makeDouble(month)}-${makeDouble(day)} ${makeDouble(hour)}:${makeDouble(minutes)}:${makeDouble(seconds)}`
}

const thousandSeperators = (value) => {
    const str = value.toString().split('.', 2)
    const int = str[0] || '0'
    const frac = str[1] || ''

    return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (str[1] ? '.' + frac : '')
}

const quantityFormat = (value) => {
    if(value < 1 && value > 0) {
        if(parseFloat(value) < 0.01) {
            return parseFloat(value).toFixed(3)
        } else return parseFloat(value).toFixed(2)
    } else return thousandSeperators(Math.floor(value))
}

export {
    currencyFormat,
    currencyCodeFormat,
    epochToDate,
    quantityFormat
}