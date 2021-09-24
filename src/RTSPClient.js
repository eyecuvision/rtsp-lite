const net = require("net")
const portastic = require('portastic');
const Digest = require("./Digest")
const Basic = require("./Basic");
const { resolveObjectURL } = require("buffer");



class RTSPClient{

    constructor(ipAddress,port,config){

        const {
            clientTimeout = 5000
        } = config || {}

        this.client = net.Socket()
        this.ipAddress = ipAddress
        this.port = port
        this.clientTimeout = clientTimeout || 5000
        this.route = null
        this.uri = null
        this.authProperties = {}
        this.loggedIn = false
        this.CSeq = 1
    }

    static parseHeaders(header){

        const lines = header.split("\r\n")
        let retObj = {}

        for(let line of lines){
            const words = line.split(":")
            if(words[0] == "Public"){
                let options = words[1].replace(" ","").split(",")
                retObj["options"] = options
            }else if(words[0].toLowerCase() == "www-authenticate"){
                let authObj = {}
                let authDetails = words[1].slice(1).split(" ")
                
                const authType = authDetails[0]
                const authInformation = authDetails.slice(1).join(" ")
                const authFields =  authInformation.split(", ")

                authObj["type"] = authType
                for(let word of authFields){
                    let [key,value] = word.split("=")
                    value = value.slice(0,-1).replaceAll(`"`,"")
                    authObj[key] = value
                }
                retObj["wwwAuthenticate"] = retObj["wwwAuthenticate"] || []
                retObj["wwwAuthenticate"].push(authObj)
            }else if(words[0].toLowerCase() === "cseq"){
                retObj["CSeq"] =  parseInt(words[1].replace(" ",""))
            }else{
                let key = words[0]
                let value = words.slice(1).join(":").slice(1)
                retObj[key] = value
            }
        } 

        return retObj
    }


    static parseStreams(body)  {
    
        const lines = body.split("\r\n")
        let streams = []
        let flag = false
        lines.forEach((line) => {
            
            if(line.startsWith("m=")){
                flag = true
            }   
            else if(flag && line.startsWith("a=control:")){
                let stream = {}
                let value = line.split("=").slice(1).join("=")
                let tmp = value.split("control:")[1]
                if(tmp.startsWith("rtsp")){
                    stream.uri = tmp
                    stream.route = null
                }else{
                    stream.route = tmp
                    stream.uri = null  
                }
                streams.push(stream)
                flag = false
            }
        })
    
        return streams
    }

    static parseResponse (response){

        const lines = response.split("\r\n")
        
        const statusCode = parseInt(lines[0].split(" ")[1])
        const rtspVersion = lines[0].split(" ")[0].split("/")[1]
        let headers,streams = []
        let headersList = null,bodyList = null,tmp = []
        let counter = 0


        lines.forEach(element => {
            if(element === "" && counter === 0){
                headersList = tmp
                tmp = []
                counter++
            }else if(element === "" && counter === 1){
                bodyList = tmp
                tmp = []
                counter++
            }else{
                tmp.push(element)
            }
        })
    
    
        headers = RTSPClient.parseHeaders(headersList.slice(1).join("\r\n"))
        
        let retObj = {
            statusCode,
            rtspVersion,
            ...headers,
        }

        if(bodyList !== null){
            streams = RTSPClient.parseStreams(bodyList.slice(1).join("\r\n"))
            if(streams.length !== 0){
                retObj["streams"] = streams
            }
        }
        
        return retObj
        
    }


    static getBasicHeader(authProperties){

        const {username,password} = authProperties
        let header = "Basic "
        header += Basic(username,password)
        return header
    }


    getNewDigest(method) {
        return RTSP.getDigestHeader({
            method,
            ...this.authProperties
        })
    }

    static getDigestHeader(authProperties) {

        let header = "Digest"
        const {uri,username="",password="",nonce,algorithm="md5",realm,cnonce = "",qop="",nc = "",method="DESCRIBE"} = authProperties
    
        header += ` username="${username}",`
        header += ` realm="${realm}",`
        header += ` nonce="${nonce}",`
        header += ` uri="${uri}",`
    
        if(authProperties.qop !== undefined)
            header += ` qop=${qop},`
    
        if(authProperties.nc !== undefined)
            header += ` nc=${nc},`
    
        if(authProperties.cnonce !== undefined)
            header += ` cnonce="${cnonce}",`
    
        const response = Digest({
            ...authProperties,
            method
        })
    
        if(authProperties.opaque !== undefined)
            header += ` opaque="${authProperties.opaque}", response="${response}"`
        else
            header += ` response="${response}"`
        return header
        
    }

    connect = (route) => {
        this.route = route
        this.uri = `rtsp://${this.ipAddress}:${this.port}${this.route}`
        return new Promise((resolve,reject) => {
            const timeoutId = setTimeout(reject,5000)
            this.client.connect(this.port,this.ipAddress,() => {
                clearTimeout(timeoutId)
                resolve()
            })
            this.client.on("error",err => {
                clearTimeout(timeoutId)
                reject(err)
            })
        })
        
    }

    send = (message) => new Promise((resolve,reject) => {
        const timeoutId = setTimeout(() => {
            this.client.removeAllListeners()
            reject()
        },this.clientTimeout)
        this.client.write(Buffer.from(message))
        this.client.on("data",(data) => {
            clearTimeout(timeoutId)
            this.client.removeAllListeners()
            resolve(data.toString())
        })
        this.client.on("error",err => {
            clearTimeout(timeoutId)
            reject(err)
        })

        
    })
    

    prepareAuth = (authInformation,username,password,method) => {
        const {type} = authInformation
        this.authProperties = {
            authInformation,
            username,
            password
        }

        switch(type.toLowerCase()){
            case "digest":
               
                return RTSPClient.getDigestHeader({...authInformation,username,password,method})
            case "basic":
                
                return getBasicHeader({...authInformation,username,password,method})
            default:
                return null
        }
    }
    
    login =   (username,password) => new Promise( async (resolve,reject) => {
        
        const firstMessage = `DESCRIBE ${this.uri} RTSP/1.0\r\nCSeq: ${this.CSeq++}\r\nUser-Agent: EyeCU Ward v1.0.0\r\nAccept: application/sdp\r\n\r\n`

        const firstResponse = await this.send(firstMessage)
        


        const parsedFirstResponse = RTSPClient.parseResponse(firstResponse)
        if(parsedFirstResponse.statusCode === 200){
            this.authProperties = {
                username :"",
                password:""
            }
            this.loggedIn = true
            resolve(parsedFirstResponse)
        } 

        const authHeader = this.prepareAuth(parsedFirstResponse.wwwAuthenticate[0],username,password)

        let secondMessage = `DESCRIBE ${this.uri} RTSP/1.0\r\nCSeq: ${this.CSeq++}\r\nUser-Agent: EyeCU Ward v1.0.0\r\nAccept: application/sdp\r\n`
        secondMessage += `Authorization: ${authHeader}\r\n`
        secondMessage += "\r\n"
        const secondResponse = await this.send(secondMessage)
        const parsedSecondResponse = RTSPClient.parseResponse(secondResponse)

        if(parsedSecondResponse.statusCode === 200){
            this.loggedIn = true
            resolve(parsedSecondResponse)
        }else{
            reject(parsedSecondResponse)
        }
    })

    static getAvailablePort(){
        return new Promise((resolve,reject) => {
            portastic.find({
                min:50000,
                max:60000
            },(data,err) => {
                if(err) reject(err)
                else resolve(data)
            })
        })
    }

    setup = (streamInformation) => new Promise(async(resolve,reject) => {
        try{
            let uri  
            if(streamInformation.uri === null){
                uri = `${this.uri}/${streamInformation.route}`
            }else{
                uri = streamInformation.uri
            }
            const clientPort = (await RTSPClient.getAvailablePort())[0]
            let message = `SETUP ${uri} RTSP/1.0\r\nCSeq: ${this.CSeq++}\r\nUser-Agent: EyeCU Ward v1.0.0\r\n`

            if(this.loggedIn){
                const {authInformation,username,password} = this.authProperties
                const authHeader = this.prepareAuth(authInformation,username,password,"SETUP")
                message += `Authorization: ${authHeader}\r\n`
    
            }
            message += `Transport: RTP/AVP;unicast;client_port=${clientPort}-${clientPort+1}\r\n`
            message += "\r\n"
    
            const response = await this.send(message)
            const parsedResponse = RTSPClient.parseResponse(response)
            resolve(parsedResponse)
        }catch(err){
            reject(err)
        }
        
    })

    describe =  () => new Promise(async (resolve,reject) => {

        try{
            let message = `DESCRIBE ${this.uri} RTSP/1.0\r\nCSeq: ${this.CSeq++}\r\nUser-Agent: EyeCU Ward v1.0.0\r\n`
            if(this.loggedIn){
                const {authInformation,username,password} = this.authProperties
                const authHeader = this.prepareAuth(authInformation,username,password,"DESCRIBE")
                message += `Authorization: ${authHeader}\r\n`
    
            }
            message += "\r\n"
    
            const response = await this.send(message)
            const parsedResponse = RTSPClient.parseResponse(response)
            resolve(parsedResponse)
        }catch(err){
            reject(err)
        }
        

    })

    options = () => new Promise( async (resolve,reject) => {
        try{
            let message = `OPTIONS ${this.uri} RTSP/1.0\r\nCSeq: ${this.CSeq++}\r\nUser-Agent: EyeCU Ward v1.0.0\r\nAccept: application/sdp\r\n`
            const response = await this.send(message).catch()
            const parsedResponse = RTSPClient.parseResponse(response)
            resolve(parsedResponse)
        }catch(err){
            reject(err)
        }
        
    })

    destroy = () => {
        this.client.destroy()
    }
}


module.exports = RTSPClient