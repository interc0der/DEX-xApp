# DEX xApp XUMM
This is the documentation for the DEX xApp

### Custom Currency
When opening the xApp with a link youy can pass parameters to the DEX xApp and set a trading pair on startup.


Example:
```
https://xumm.app/detect/xapp:xumm.dex?issuer=rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq&currency=USD&base=false
https://xumm.app/detect/xapp:xumm.dex?base=USD+rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq&quote=xrp
```
### Simple use:
issuer is the address of the issuer:
```
issuer=rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq
```

currency, this is the currency code:
```
currency=USD
currency=534F4C4F00000000000000000000000000000000
```

base, boolean true if the given currency should be base against XRP, FALSE if omitted

### base and quote manually
```
base=currency+issuer
base=USD+rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq
base=XRP

quote=currency+issuer
quote=USD+rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq
quote=XRP
```


## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
