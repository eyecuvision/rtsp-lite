const crypto = require("crypto")

const Digest = (config) => {
    const {
        username,password,uri,realm,nonce,cnonce = "",qop = "",algorithm= "md5",method ,nc = ""
    } = config
    let HA1,HA2,response

    if(algorithm.toLowerCase() === "md5"){
        HA1 = crypto.createHash('md5').update(`${username}:${realm}:${password}`).digest('hex')
    }else if(algorithm.toLowerCase() === "md5-sess"){
        tmp = crypto.createHash('md5').update(`${username}:${realm}:${password}`).digest('hex')
        HA1 = crypto.createHash('md5').update(`${tmp}:${nonce}:${cnonce}`).digest('hex')
    }else{
        throw new Error(`${algorithm} is not implemented.`)
    }

    const entityBody = ""
    if(qop.toLowerCase() === "auth-int"){
        tmp = crypto.createHash('md5').update(entityBody).digest('hex')
        HA2 =  crypto.createHash('md5').update(`${method}:${uri}:${tmp}`).digest('hex')
    }else{
        HA2 =  crypto.createHash('md5').update(`${method}:${uri}`).digest('hex')
    }

    if(qop.toLowerCase() === "auth-int" || qop.toLowerCase() === "auth"){
        response = crypto.createHash('md5').update(`${HA1}:${nonce}:${cnonce}:${nc}:${qop}${HA2}`).digest('hex')

    }else{
        response = crypto.createHash('md5').update(`${HA1}:${nonce}:${HA2}`).digest('hex')

    }
    
    return response
} 

module.exports = Digest