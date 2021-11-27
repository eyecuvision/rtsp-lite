const RTSPClient = require("../src/RTSPClient")

const rtspDeviceAddress = ["192.168.0.30",554]
const unavailableAddress = ["192.168.0.169",554]
const nonRtspDeviceAddress = ["192.168.0.10",554]


describe("RTSP Client can " , () => {
    
    
    it("fetch OPTIONS.", done => {

        const client = new RTSPClient(...rtspDeviceAddress)
        
        client.connect("/")
        .then(() => {
            () => done("asdfasdf")
            client.options()
            .then(() => done())
            .catch()
            .finally(client.destroy)
        })
    })

    it("fetch DESCRIBE.", done => {
        const client = new RTSPClient(...rtspDeviceAddress)
        client.connect("/")
        .then(() => {
            client.describe()
            .then(() => done())
            .catch((err) => done(err,"FAILED"))
            .finally(client.destroy)
        })
    })

    it("catch ECONNREFUSED.", done => {
        const client = new RTSPClient(...nonRtspDeviceAddress)

        try{
            client.connect("/")
            .then(() => done("ECONNREFUSED should have been rejected."))
            .catch(() => done())

        }catch{
            throw new Error("ECONNREFUSED cannot be catched.")
        }finally{
            client.destroy()
        }
        
    },10000)

    it("timeouts on unavailable connection.", done => {
        const client = new RTSPClient(...unavailableAddress)

        try{
            client.connect("/")
            .then((...args) => done(args,"Unavailabe connection should have been rejected."))
            .catch(done)

        }catch{
            throw new Error("Unavailable connection cannot be catched.")
        }finally{
            client.destroy()
        }
        
    },10000)

})